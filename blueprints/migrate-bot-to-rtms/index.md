---
title: "How to migrate a Zoom meeting bot to RTMS"
slug: "migrate-bot-to-rtms"
description: >-
  Replace your Meeting SDK bot with Zoom RTMS for native transcript, audio, and video access.
  No participant tile, no waiting room friction, same data.
products: ["rtms", "zoom-apps", "meeting-sdk"]
verticals: ["enterprise"]
solution_types: ["real-time-analysis", "transcription-summarization"]
author: "Jen Brissman"
status: "published"
hero_image: "images/hero.png"
updated: 2026-11-03
github_repo: "https://github.com/zoom/arlo"
demo_url: ""
tags: ["migration", "meeting-bot", "rtms", "transcription", "real-time"]
seo_title: "How to migrate a Zoom meeting bot to RTMS"
seo_keywords: ["zoom meeting bot migration", "rtms vs meeting sdk", "zoom bot to rtms", "replace zoom bot"]
partners: ["anthropic", "openai"]
license_required: true
license_note: "RTMS access via Zoom Developer Pack"
stack: "Node · Express · React · MySQL"
deploy:
  - { label: "Deploy to Render", url: "https://render.com/deploy?repo=https://github.com/zoom/arlo" }
  - { label: "Deploy to Railway", url: "https://railway.app/new?repo=https://github.com/zoom/arlo" }
---

Your meeting bot works. Users see it join. Hosts admit it from the waiting room. You manage infrastructure to keep a participant connected for the duration of the call. **Zoom RTMS** gives you the same data (audio, video, transcripts, screen share) without the bot.

Meeting SDK bots join as participants. They appear in the roster, require host approval, and need compute resources to stay connected. RTMS streams meeting data directly to your backend via webhook and WebSocket. No participant tile. No waiting room. The user installs your app once, and every meeting streams automatically.

**What you'll need:**

- An existing Meeting SDK bot you want to migrate (or understanding of bot architecture)
- Transcript access via [RTMS](https://developers.zoom.us/docs/rtms/) (available through the [Zoom Developer Pack](https://zoom.us/pricing/developer); try 20 credits free)
- A backend to receive webhooks and maintain WebSocket connections
- A [Zoom General App](https://developers.zoom.us/docs/integrations/) with RTMS event subscriptions
- Optional: A [Zoom Surface App](https://developers.zoom.us/docs/zoom-apps/guides/building-a-surface/) for in-meeting UI

**What changes:**

- **No participant**: RTMS streams data without joining the meeting. Users see your app in the Apps panel, not the participant list.
- **Webhook-driven lifecycle**: Instead of joining via SDK, you receive `meeting.rtms_started` when streaming begins.
- **User-scoped authorization**: The app is installed per-user (or org-wide by admin). The user's presence determines stream availability.
- **Host approval model**: Hosts can require approval before RTMS starts. Configure auto-start to skip this for trusted apps.

**What stays the same:**

- Real-time transcript segments with speaker attribution
- Mixed or separated audio streams (PCM L16, 16kHz or 24kHz)
- Video frames (H.264, gallery view)
- Screen share capture
- Participant join/leave events

If you're building a new meeting integration from scratch, start with the [AI Meeting Notetaker](../ai-meeting-notetaker/) blueprint instead. This guide is for developers migrating an existing bot.

**Don't want to build?** Preferred partners [Recall.ai](https://recall.ai), [Attendee](https://attendee.dev), and [MeetStream](https://meetstream.ai) offer managed RTMS infrastructure. They handle the WebSocket connections and media processing; you receive structured data via their APIs.

Follow along as we walk through the migration path.

## Features

This migration guide covers:

- **Side-by-side architecture comparison**: Bot vs. RTMS data flow and component differences
- **Decision matrix**: When to stay on Meeting SDK vs. migrate to RTMS
- **Webhook handler setup**: Replace SDK join with event-driven stream initiation
- **WebSocket connection patterns**: Connect to RTMS streams using the `@zoom/rtms` SDK
- **Lifecycle management**: Handle stream start, stop, and reconnection scenarios
- **Stream persistence for long meetings**: The scheduler-as-app-owner pattern for virtual onsites
- **Data model migration**: Update session tracking from bot IDs to RTMS stream IDs
- **Chat alternatives**: Replace bot chat with REST API, Surface Apps, or pre-meeting notifications
- **Failure modes and fallback logic**: Detect failures and fall back gracefully
- **Compliance considerations**: Recording notification, consent, pause/cancel functionality
- **Enterprise deployment**: Admin install flow for org-wide rollout

The reference implementation is [Arlo](https://github.com/zoom/arlo), a meeting assistant that demonstrates the complete RTMS pattern.

## Architecture

Meeting SDK bots and RTMS solve the same problem differently. Understanding the architectural shift is the first step.

### Bot Architecture (before)

Your bot runs as a headless participant. It joins via Meeting SDK, authenticates with a ZAK or OAuth token, and captures media through SDK callbacks. The bot process must stay connected for the meeting duration.

```mermaid
graph LR
    subgraph "Your Infrastructure"
        B[Bot Process]
        S[Your Server]
    end
    Z[Zoom Meeting] -->|SDK join| B
    B -->|Audio/Video callbacks| B
    B -->|Processed data| S
    S --> D[(Database)]
```

**Characteristics:**
- Bot appears as a participant (visible in roster)
- Requires compute resources per concurrent meeting
- Must handle SDK lifecycle (join, reconnect, leave)
- Host may need to admit bot from waiting room

### RTMS Architecture (after)

RTMS streams data directly to your backend. Zoom sends a webhook when streaming starts, your server connects via WebSocket, and media flows without a participant joining.

```mermaid
graph LR
    subgraph "Your Infrastructure"
        W[Webhook Endpoint]
        R[RTMS Client]
        S[Your Server]
    end
    Z[Zoom Meeting] -->|1. meeting.rtms_started| W
    W -->|2. Connect| R
    Z -->|3. WebSocket stream| R
    R -->|4. Processed data| S
    S --> D[(Database)]
```

**Characteristics:**
- No participant tile (app appears in Apps panel only)
- Webhook-driven: Zoom initiates the connection
- Single WebSocket per stream (not per participant)
- User installs app once; all their meetings can stream

### Migration Decision Matrix

| Capability | Meeting SDK Bot | RTMS | Notes |
|------------|-----------------|------|-------|
| Receive audio | Yes | Yes | RTMS offers mixed or per-participant |
| Receive video | Yes | Yes (gallery) | Speaker view on Zoom roadmap |
| Receive transcript | Manual (ASR) | Yes (built-in) | RTMS includes Zoom's ASR |
| Receive screen share | Yes | Yes | JPEG/PNG or H.264 |
| Send audio | Yes | No | Bots can speak; RTMS is receive-only |
| Send chat | Yes | No | Use REST API or Surface App |
| Control meeting | Yes | No | Mute, end, etc. require SDK |
| Visible participant | Yes | No | RTMS has no roster presence |
| Breakout rooms | Yes | No | RTMS main room only |
| Per-meeting compute | Required | Not required | RTMS uses shared infrastructure |

**When to stay on Meeting SDK:**
- Your bot needs to speak (voice assistant)
- Your bot sends chat messages during the meeting
- Your bot controls meeting state (mute participants, end meeting)
- You need breakout room access

**When to migrate to RTMS:**
- Receive-only workloads (transcription, recording, analysis)
- Users complain about "bot in my meeting"
- You want to reduce infrastructure costs
- You need Zoom's built-in ASR instead of running your own

## Implementation Guide

This guide covers the key migration steps. For complete code, see the [Arlo reference implementation](https://github.com/zoom/arlo).

### Part 1: Replace SDK Join with Webhook Handler

#### Bot approach (before)

Your bot joins meetings by calling the Meeting SDK with credentials:

```javascript
// Meeting SDK bot approach
const client = new ZoomMeetingSDK();
await client.join({
  meetingNumber: meetingId,
  userName: 'Recording Bot',
  zak: zakToken,
  password: meetingPassword
});

client.on('audio', (buffer) => { /* process audio */ });
client.on('video', (frame) => { /* process video */ });
```

#### RTMS approach (after)

With RTMS, Zoom calls you. Set up a webhook endpoint to receive `meeting.rtms_started`:

**Input:** `meeting.rtms_started` webhook payload

**Output:** Validated webhook, RTMS session initiated

**Invariants:**
- Verify webhook signature using HMAC-SHA256 with timing-safe comparison
- Enforce 5-minute replay window on timestamp
- Respond with 200 OK within 3 seconds (process asynchronously)
- Deduplicate by `rtms_stream_id` (not `meeting_uuid`)

```javascript
// Webhook signature verification (security-critical, keep concrete)
function verifyWebhookSignature(rawBody, timestamp, signature, secret) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = 'v0=' + crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**Other languages:** In Python, use `hmac.compare_digest`; in Go, use `crypto/subtle.ConstantTimeCompare`.

See [Arlo's webhook handler](https://github.com/zoom/arlo/blob/main/backend/routes/rtms.js) for the complete implementation.

### Part 2: Connect to RTMS WebSocket

After validating the webhook, connect to the RTMS stream using the provided `server_urls`.

**Input:** `server_urls`, `rtms_stream_id`, `meeting_uuid` from webhook payload

**Output:** Active WebSocket connection receiving media frames

**Invariants:**
- Use the `@zoom/rtms` SDK for Node.js (or implement WebSocket protocol directly for other languages)
- Register all media handlers before calling `join()`
- Handle `onLeave` callback for cleanup
- Track connection state per `rtms_stream_id`
- If stream drops mid-meeting, wait for new `meeting.rtms_started` webhook

```javascript
// RTMS connection pattern
const { RTMSClient } = require('@zoom/rtms');

async function connectToStream(payload) {
  const client = new RTMSClient({
    streamId: payload.rtms_stream_id,
    serverUrls: payload.server_urls,
    credentials: { /* from your app config */ }
  });

  // Register handlers BEFORE joining
  client.on('transcript', (segment) => {
    // segment: { text, userId, userName, timestamp }
    processTranscript(segment);
  });

  client.on('audio', (buffer) => {
    // PCM L16 audio data
    processAudio(buffer);
  });

  client.on('leave', () => {
    cleanupSession(payload.rtms_stream_id);
  });

  await client.join();
}
```

**Other languages:** The `@zoom/rtms` SDK is Node.js only. For Python, Go, or other stacks, implement the [WebSocket protocol](https://developers.zoom.us/docs/rtms/) directly.

### Part 3: Handle Lifecycle Differences

Meeting SDK bots control their own lifecycle. RTMS streams are controlled by users and hosts. This is the most significant behavioral change in the migration.

#### Stream start conditions

RTMS starts when ALL conditions are met:
- The meeting host's organization has RTMS enabled at the account level
- The meeting host's Zoom client is version 6.5.5+
- The app is installed for the user (app owner)
- Account/group/user policy allows RTMS
- Host approves (if required) or auto-start is enabled
- At least one app owner is in the meeting (or auto-start triggered before join)

#### Stream persistence

| Event | Bot Behavior | RTMS Behavior |
|-------|--------------|---------------|
| Host leaves | Bot stays | Stream continues IF app owner used auto-start and never joined. Stream STOPS if app owner joined the meeting. |
| App owner leaves | N/A | **Stream stops** |
| Host disables sharing | Bot unaffected | Stream stops; new `rtms_started` if re-enabled |
| Host handoff to org with RTMS disabled | Bot unaffected | Stream stops permanently |
| App owner moves to breakout room | N/A | Stream stops; may resume when returning to main room |
| Network disconnect | Bot reconnects | WebSocket closes; must wait for new `meeting.rtms_started` webhook |

**WARNING: App owner leaving kills the stream.** This is the most common migration surprise. With bots, you control when to leave. With RTMS, if the app owner leaves the meeting, the stream terminates even if other participants remain. Plan for this in your product flow.

#### Stream persistence for long meetings (virtual onsites)

For multi-hour meetings where participants rotate (virtual onsites, all-day workshops, interview panels), you need the stream to persist regardless of who joins or leaves. The key insight:

**If the app owner is the meeting's original scheduler AND auto-start is enabled, the RTMS stream persists for the entire meeting lifetime. The scheduler does not need to join or stay in the meeting.**

This means:
- Your app must be installed for the **meeting scheduler** (the person who created the meeting), not just the participants
- Use the scheduler's OAuth credentials when configuring auto-start for the meeting
- If your calendar sync knows who scheduled the meeting, use that user's context

**When the scheduler is not your user:** If an external party scheduled the meeting (candidate, external recruiter, customer), you cannot use their credentials for auto-start. Options:
1. Fall back to a participant who is your user, accepting the risk that the stream may die if they leave
2. Prompt the external scheduler to install your app (may not be practical)
3. For critical meetings, keep a bot fallback ready

#### Handling multiple users

When multiple users in the same meeting have your app installed, Zoom may send multiple `meeting.rtms_started` webhooks (one per app owner). Deduplicate by `meeting_uuid`:

**Invariants:**
- Process only the first webhook per `meeting_uuid`
- Ignore subsequent webhooks while a stream is active
- If active stream drops and new webhook arrives, treat as reconnection
- Track which user's stream you're using; if that user leaves and a new webhook arrives from another user, you can switch

### Part 4: Update Your Data Model

Your existing bot likely tracks sessions by meeting ID and bot instance. RTMS uses different identifiers.

| Bot Model | RTMS Model |
|-----------|------------|
| `bot_id` (your instance) | `rtms_stream_id` (Zoom-assigned) |
| `meeting_id` (numeric) | `meeting_uuid` (string, unique per instance) |
| `participant_id` (bot's ID) | N/A (no participant) |
| Bot status (joining, connected, leaving) | Stream status (waiting, connected, ended) |

**Schema migration:**

```sql
-- Add RTMS columns to existing sessions table
ALTER TABLE meeting_sessions ADD COLUMN rtms_stream_id VARCHAR(255);
ALTER TABLE meeting_sessions ADD COLUMN stream_status ENUM('waiting', 'connected', 'ended');

-- Index for webhook deduplication
CREATE UNIQUE INDEX idx_rtms_stream ON meeting_sessions(rtms_stream_id);
```

### Part 5: Replace Chat with Alternatives

Meeting SDK bots can send chat messages. RTMS cannot. If your bot sends messages (recording consent, cancel links), you have three options:

**Option A: REST API (if continuous chat enabled)**

If the meeting has continuous chat enabled, use the [Chat Messages API](https://developers.zoom.us/docs/api/rest/reference/chat/methods/#operation/sendChatMessage):

```javascript
await zoom.chat.sendMessage({
  to_channel: meetingChatChannel,
  message: 'Recording in progress. Reply STOP to cancel.'
});
```

**Option B: Surface App**

Build a [Zoom Surface App](https://developers.zoom.us/docs/zoom-apps/guides/building-a-surface/) that displays recording status and cancel button in-meeting. The Surface App can use the Zoom Apps SDK `sendMessage()` method to send chat.

**Option C: Pre-meeting notification**

Send recording consent via email or calendar invite before the meeting starts. Less interactive but simpler.

### Part 6: Plan for Failure Modes

Bots fail visibly: the bot doesn't join, or it disconnects and participants notice. RTMS fails silently: no webhook arrives, or the stream drops, and participants have no idea. Build detection and fallback logic.

#### Failure modes table

| Failure Mode | How to Detect | Mitigation |
|--------------|---------------|------------|
| RTMS not enabled for host org | No `meeting.rtms_started` webhook within 60 seconds of meeting start | Fall back to bot; notify your ops team |
| Zoom client too old (< 6.5.5) | No `meeting.rtms_started` received | Fall back to bot; prompt user to update Zoom |
| Host denies RTMS approval | No `meeting.rtms_started`, or `meeting.rtms_stopped` fires immediately | Fall back to bot; notify user that host declined |
| WebSocket connection failure | Connection error or timeout when connecting to `server_urls` | Retry with exponential backoff; fall back to bot if retries exhausted |
| Stream drops mid-meeting | WebSocket close event without `meeting.rtms_stopped` | Log the gap timestamp; wait 30 seconds for new `meeting.rtms_started`; if none arrives, finalize partial recording |
| App owner leaves (stream dies) | `meeting.rtms_stopped` webhook while meeting is still active | If another app owner is in the meeting, their webhook may arrive; otherwise finalize partial recording |
| Duplicate webhooks | Multiple `meeting.rtms_started` for same `meeting_uuid` | Deduplicate; process only one stream; ignore others |
| Webhook signature invalid | HMAC verification fails | Reject the request; log for security review |
| Webhook replay attack | Timestamp outside 5-minute window | Reject the request |

#### Fallback decision logic

```
Meeting scheduled
  │
  ├── Is scheduler an app owner with RTMS installed?
  │     ├── YES → Configure auto-start with scheduler's credentials
  │     └── NO  → Use first participant who is an app owner (accept stream-drop risk)
  │
Meeting starts
  │
  ├── meeting.rtms_started received within 60s?
  │     ├── YES → Connect RTMS WebSocket, begin recording
  │     └── NO  → Fall back to bot (or notify user RTMS unavailable)
  │
RTMS stream active
  │
  ├── Stream healthy → Continue recording
  ├── Stream drops (WebSocket close)
  │     ├── Wait 30s for new meeting.rtms_started
  │     │     ├── New webhook → Reconnect, log gap
  │     │     └── No webhook → Finalize partial recording; optionally deploy bot for remainder
  │     └── meeting.rtms_stopped → Finalize recording
  │
Meeting ends → Finalize all recordings
```

**Recommendation:** For high-stakes meetings (customer calls, compliance-required recordings), keep bot infrastructure available as a fallback during your RTMS rollout. Once you have confidence in RTMS reliability for your user base, you can decommission bots.

### Run the Sample

[Arlo](https://github.com/zoom/arlo) demonstrates the complete RTMS pattern with transcript capture, AI processing, and in-meeting display.

| Platform | What you get |
|----------|--------------|
| [**Deploy to Render**](https://render.com/deploy?repo=https://github.com/zoom/arlo) | Backend, frontend, RTMS service, managed database |
| [**Deploy to Railway**](https://railway.app/new?repo=https://github.com/zoom/arlo) | Backend, frontend, RTMS service, managed database |

<details>
<summary><strong>Local setup</strong></summary>

1. Clone and configure:
   ```bash
   git clone https://github.com/zoom/arlo.git && cd arlo && cp .env.example .env
   ```

2. Start ngrok with a static domain:
   ```bash
   ngrok http 3000 --domain=your-subdomain.ngrok-free.app
   ```

3. Create a Zoom General App at [marketplace.zoom.us](https://marketplace.zoom.us/):
   - Copy Client ID and Client Secret
   - Set OAuth Redirect URL to `https://YOUR-NGROK-URL/api/auth/callback`
   - Enable RTMS under Features > Zoom App SDK > Real-Time Media Streams > Transcripts
   - Add Event Subscription for `meeting.rtms_started` and `meeting.rtms_stopped`

4. Fill in `.env` with your credentials

5. Start the services:
   ```bash
   docker-compose up --build
   ```

</details>

## App Manifest

The migration requires updating your Zoom App configuration from Meeting SDK to RTMS.

### Required Scopes

| Scope | Purpose |
|-------|---------|
| `meeting:read:meeting` | Meeting metadata |
| `user:read` | User profile for personalization |

Note: RTMS access is configured via Zoom App SDK settings, not OAuth scopes.

### RTMS Configuration

1. In your app settings, go to **Features** > **Zoom App SDK**
2. Enable **Real-Time Media Streams**
3. Select the media types you need:
   - **Transcripts**: Speech-to-text segments
   - **Audio**: PCM audio stream
   - **Video**: H.264 video frames
   - **Screen Share**: Screen capture

### Event Subscriptions

| Event | When it fires | Your action |
|-------|---------------|-------------|
| `meeting.rtms_started` | User starts RTMS or auto-start triggers | Connect to WebSocket |
| `meeting.rtms_stopped` | Stream ends (host stops, meeting ends, etc.) | Finalize recording |

### Auto-Start Configuration

For hands-free recording (no user action required each meeting):

1. Go to **Features** > **Zoom App SDK** > **Real-Time Media Streams**
2. Enable **Auto-start**
3. Optionally disable **Host approval required** (admin setting)

With auto-start enabled, RTMS begins automatically when the app owner's meeting starts.

### Enterprise Deployment (Admin Install)

For enterprise customers, individual OAuth flows per user create friction. Zoom supports admin-level installation where an admin installs the app for their organization, and users can start using it without individual consent flows.

#### Admin install flow

1. **Admin enables RTMS at the organization level**
   - Zoom Admin Portal > Settings > "Allow apps to access real-time meeting content"
   - This is the master switch. If disabled, RTMS will not work for any meeting hosted by this organization.

2. **Admin installs your app for the organization**
   - Admin navigates to your app's Zoom Marketplace listing (or a direct install link you provide)
   - Admin approves OAuth scopes for the organization
   - Admin selects which users or groups the app is installed for (all users or a subset)

3. **Admin configures RTMS settings**
   - Enable auto-start for your app (Zoom Admin > Zoom Apps Settings)
   - Optionally disable host approval requirement (recommended for seamless recording)
   - Optionally enable "Allow meeting to start without host" (required if non-hosts need to trigger recording)

#### Post-install behavior

- **First meeting records automatically**: No user login or app interaction required. When a meeting starts for an installed user, Zoom sends `meeting.rtms_started` to your webhook.
- **No bot joins**: Participants see no additional attendee. Your app is listed in the meeting's Apps panel but does not appear as a participant.
- **Works for non-hosts**: A user who is not the host can trigger RTMS via auto-start as long as they are an app owner (the app is installed for them).

#### Required Zoom account settings

| Setting | Required Value | Where to Configure |
|---------|----------------|-------------------|
| Allow apps to access real-time meeting content | Enabled | Zoom Admin > Settings |
| Your RTMS app installed | Yes, for target users | Zoom Marketplace |
| Auto-start for your RTMS app | Enabled | Zoom Admin > Zoom Apps Settings |
| Host approval for RTMS | Disabled (recommended) | Zoom Admin > Settings |
| Allow meeting to start without host | Enabled (if needed) | Zoom Admin > Meeting Settings |
| Zoom client version | 6.5.5+ | All users |

---

## Compliance Considerations

RTMS is receive-only streaming, not Zoom's cloud recording. This distinction affects compliance requirements.

### No native recording indicator

**RTMS does not trigger Zoom's recording indicator** (the red dot or "Recording" badge). From Zoom's perspective, RTMS streams data to your application; it is not "recording." If your jurisdiction requires visible notification that recording is active, you must implement this yourself.

#### Options for recording notification

| Option | Pros | Cons |
|--------|------|------|
| **Zoom Surface App** | In-meeting UI; can show recording status, consent dialog, cancel button | Requires building a Zoom App with the Zoom Apps SDK |
| **Account-level disclaimer popup** | Zoom-native; no development required | Same disclaimer for all apps on the account; not customizable per-app or per-meeting |
| **Pre-meeting email/calendar** | Simple to implement; reaches external participants | No in-meeting cancel capability; participants may not read it |
| **Post-join external notification** | Can include links to cancel/consent page | Disruptive (email/SMS during meeting); may be too late |

**Recommendation:** If compliance requires in-meeting notification, build a Zoom Surface App. The Surface App and your RTMS General App can share the same Zoom App registration. The Surface App can display recording status, consent text, and a cancel button. It can also use the Zoom Apps SDK `sendMessage()` method to send chat messages on behalf of the app.

### Pause, resume, and cancel recording

RTMS streams continuously while active. To implement pause/resume or cancel functionality:

- **Pause/Resume**: Your app stops processing the stream but keeps the WebSocket open. Mark pause/resume timestamps and strip paused sections in post-processing. Alternatively, close the WebSocket on pause and wait for a new `meeting.rtms_started` on resume (but this is less reliable).
- **Cancel**: Close the WebSocket connection and discard captured media. The stream will stop. If you need to restart, the user must manually trigger RTMS again (or wait for conditions to re-trigger auto-start, which may not happen mid-meeting).

A Surface App provides the best UX for these controls, with pause/cancel buttons visible in-meeting.

### Consent for external participants

External participants (guests not in the host's organization) cannot see your app in their Apps panel unless they also install it. For consent:

1. Use Zoom's account-level disclaimer (if the host's org has it configured)
2. Send pre-meeting email with recording notice
3. Build a Surface App with guest mode that displays consent to all participants

---

## Acceptance Criteria

Use this checklist to verify your migration:

**Webhook and connection:**
- [ ] Webhook endpoint validates signatures with timing-safe comparison
- [ ] Webhook endpoint enforces 5-minute replay window
- [ ] Duplicate `rtms_stream_id` webhooks are ignored
- [ ] WebSocket handlers registered before `join()` call
- [ ] Stream cleanup runs on `onLeave` and `meeting.rtms_stopped`
- [ ] Multiple app owners in same meeting deduplicated by `meeting_uuid`

**Data model:**
- [ ] Session data model updated with RTMS identifiers (`rtms_stream_id`, `meeting_uuid`)
- [ ] Stream status tracking implemented (waiting, connected, ended)

**Lifecycle and reliability:**
- [ ] Fallback logic implemented for when RTMS is unavailable (if applicable)
- [ ] Stream persistence strategy defined for long meetings (scheduler-as-app-owner pattern)
- [ ] Gap detection and logging implemented for mid-meeting stream drops
- [ ] Reconnection handling tested (new `meeting.rtms_started` after drop)

**Compliance (if required by your use case):**
- [ ] Recording notification mechanism implemented (Surface App, disclaimer, or pre-meeting email)
- [ ] Pause/resume functionality tested (if offered to users)
- [ ] Cancel recording functionality tested (WebSocket close, media discard)
- [ ] External participant consent flow documented

**User experience:**
- [ ] Chat functionality replaced with REST API, Surface App, or pre-meeting notification
- [ ] Users no longer see bot participant in meetings
- [ ] Admin install flow documented for enterprise customers

**Decommissioning:**
- [ ] Bot infrastructure can be decommissioned after migration validation (or retained as fallback)

---

## Related Resources

- [RTMS Documentation](https://developers.zoom.us/docs/rtms/): Official API reference
- [AI Meeting Notetaker Blueprint](../ai-meeting-notetaker/): Building from scratch with RTMS
- [@zoom/rtms SDK](https://www.npmjs.com/package/@zoom/rtms): Node.js client library
- [Zoom Developer Forum](https://devforum.zoom.us/): Community support
- [Arlo Repository](https://github.com/zoom/arlo): Reference implementation
