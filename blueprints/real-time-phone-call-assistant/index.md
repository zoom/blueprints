---
title: "Real-time call assistant in Zoom Phone"
slug: "real-time-phone-call-assistant"
description: >-
  Build a Zoom Phone app with a live call transcript, a rolling call summary,
  and keyword-triggered agent prompts. Stream the call with RTMS and render it in
  a Zoom Surface App while the call is still in progress.
products: ["rtms", "phone", "zoom-apps"]
verticals: ["agents"]
solution_types: ["real-time-analysis", "transcription-summarization"]
author: "Elisa Levet"
status: "draft"
updated: 2026-11-16
github_repo: "https://github.com/zoom/phone-rtms-auto"
tags: ["zoom phone", "real-time", "agent assist"]
seo_title: "Live call transcripts and keyword prompts in Zoom Phone"
seo_keywords: ["zoom phone live transcript", "zoom phone rtms app", "zoom phone agent assist", "real-time call summary zoom phone"]
license_required: true
license_note: "Requires a Zoom Phone license and RTMS entitlement"
stack: "Node · Express · React · Redis · Docker"
---

A Zoom Surface App runs inside the **Zoom Phone** client and shows live call context, a speaker-labeled transcript, a summary bullet every 30 seconds, and keyword chips with suggested agent prompts. Every panel updates while the call is in progress.

Agents on phone calls listen, look things up, and take notes at the same time. This blueprint moves that context into the call window as the conversation happens. The agent does not wait for a post-call summary.

**What you'll need:**

- A [Zoom Phone](https://www.zoom.com/en/products/phone/) license for the users who take calls
- Transcript and audio access via [RTMS](https://developers.zoom.us/docs/rtms/) for Zoom Phone (requires a paid Zoom Workplace plan with RTMS entitlement; [request access](https://www.zoom.com/en/realtime-media-streams/#form))
- A [Zoom General App](https://developers.zoom.us/docs/zoom-apps/) with Surface app support enabled. Users need Zoom client 5.9 or later.
- Node.js 18 or later, Docker and Docker Compose, and [ngrok](https://ngrok.com/docs/getting-started) for a public HTTPS URL during development
- Redis for OAuth token storage (provided by Docker Compose) and FFmpeg for WAV output (included in the RTMS container image)

**Features:**

- Call context from the Zoom Phone client: call ID and answer start time
- Live transcript, streamed to the panel by speaker and saved to one text file per call
- Keyword chips with mention counts, and live prompts that expire after 10 seconds
- Rolling call summary with one new bullet every 30 seconds
- Per-call audio saved as a 16 kHz, 16-bit WAV when the call ends
- OAuth 2.0 with automatic token refresh and per-user token storage in Redis

If you'd rather start from what your Zoom Phone plan already includes, begin there. Build custom when you need keyword rules tuned to your call scripts, transcript and audio files stored on your own infrastructure, or a summary pipeline you control.

The architecture below shows how the webhook, the RTMS service, and the panel connect.

## Features

The panel has four sections. Each one is fed by a different event type from the backend.

| Section | Source | Update rule |
|---------|--------|-------------|
| Call Information | `getPhoneContext` from the Zoom Apps SDK | Set once when the panel opens inside a phone call |
| Live Transcript | `transcript` events | Appends one line per final transcript segment |
| Keyword Detection | `keywords` and `prompt` events | Chips replace on each update; prompts expire after 10 seconds |
| Call Summary | `summary` events | Replaces the full bullet list every 30 seconds |

<!-- SCREENSHOT PLACEHOLDER: the panel mid-call, showing all four sections. Save as images/panel-live-call.png and reference it here. -->

<!-- DEMO VIDEO PLACEHOLDER: 30 seconds to 6 minutes, linked as [Watch the demo](https://www.youtube.com/watch?v=...) -->

## Architecture

Zoom sends `phone.call_rtms_started` when RTMS begins for a call, and `phone.call_rtms_stopped` when it ends. The backend verifies each webhook signature. For the two RTMS events, it forwards the payload to the RTMS service and returns 200 to Zoom.

The RTMS service opens a signaling WebSocket to the `server_urls` in the start payload. After the handshake, it opens separate audio and transcript WebSockets. Each transcript segment goes through four steps: keyword detection, summary windowing, a line in the transcript file, and an event posted to the backend. The backend relays each event to every connected panel over Server-Sent Events (SSE).

The RTMS service keeps all per-call state in memory. Tokens and the active user ID live in Redis. The panel only receives events. It calls the backend for Zoom API requests and never talks to RTMS directly.

| Component | Role | Our stack | Alternatives |
|-----------|------|-----------|--------------|
| **Zoom Phone** | Sends RTMS webhooks and streams audio and transcript | Zoom platform | None |
| **Backend** (`backend/`) | Verifies webhooks, runs OAuth, relays events over SSE, proxies Zoom API calls | Express | Any HTTP framework that can verify raw-body HMAC |
| **RTMS service** (`rtms/`) | Opens signaling, audio, and transcript sockets. Runs keyword, summary, transcript, and audio features | Node.js with `ws` | Any WebSocket client in a runtime that can run the feature modules |
| **Redis** | Per-user OAuth tokens and the active user ID | Redis 7 (Docker Compose) | Any store with atomic key writes and a network-reachable endpoint |
| **Zoom Apps panel** (`frontend/`) | Renders the four panel sections inside the Zoom client | React, Vite, Zoom Apps SDK 0.16.37 | Any SPA framework that can call the Zoom Apps SDK |

```mermaid
graph LR
    Z[Zoom Phone] -->|webhook: phone.call_rtms_started / stopped| B[Backend :3001]
    B -->|forward RTMS event| R[RTMS service :3002]
    R <-->|signaling, audio, transcript WebSockets| Z
    R -->|POST /internal/rtms-events| B
    B -->|SSE /api/events| P[Zoom Apps panel]
    B <-->|tokens, active user| RD[(Redis)]
    R -->|transcript and WAV files| F[(rtms/data)]
```

The sequence for one call:

```mermaid
sequenceDiagram
    participant Z as Zoom Phone
    participant B as Backend
    participant R as RTMS service
    participant P as Zoom Apps panel
    Z->>B: phone.call_rtms_started (webhook)
    B->>R: POST / with event and payload
    R->>Z: Signaling handshake (msg_type 1)
    Z-->>R: Handshake response with server_urls (msg_type 2)
    R->>Z: Audio and transcript handshakes (msg_type 3)
    Z-->>R: Transcript segments (msg_type 17)
    R->>B: POST /internal/rtms-events
    B-->>P: SSE data frame
    Z->>B: phone.call_rtms_stopped (webhook)
    B->>R: POST / with event and payload
    R->>R: Close sockets, write WAV
```

## Implementation Guide

Each subsection names the file that implements it. Paths are relative to the sample repo root. Business logic uses Input, Output, and Invariants. Security-critical code stays as concrete snippets.

### Webhook intake and forwarding

File: `backend/server.js` (`/api/webhooks/zoom`), `backend/middleware/security.js` (`validateZoomWebhook`, `handleZoomUrlValidation`)

**Input:** `POST /api/webhooks/zoom` with headers `x-zm-request-timestamp` and `x-zm-signature`, and a JSON body of `{ event, payload }`.

**Output:** HTTP 200 for every verified event. For `phone.call_rtms_started` and `phone.call_rtms_stopped`, the body is forwarded to `RTMS_SERVER_URL` with a 2-second timeout. If the forward fails, the response is 502.

**Invariants:**

- Verify the signature before reading the event body
- Compute the HMAC over the raw request bytes. `express.json` stores them in `req.rawBody` through its `verify` callback.
- Answer `endpoint.url_validation` by returning `plainToken` and its HMAC
- Forward only the two RTMS events. Other events return 200 without forwarding.
- Reject timestamps more than 5 minutes old to limit replay

The signature check is security-critical, so it stays concrete:

```javascript
const crypto = require('crypto');

function verifyZoomSignature(rawBody, timestamp, signature, secretToken) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = 'v0=' + crypto
    .createHmac('sha256', secretToken)
    .update(message)
    .digest('hex');

  const provided = Buffer.from(signature || '');
  const expectedBuffer = Buffer.from(expected);
  // timingSafeEqual throws when lengths differ, so check length first
  return provided.length === expectedBuffer.length
    && crypto.timingSafeEqual(provided, expectedBuffer);
}
```

The sample's `validateZoomWebhook` compares the signature with `!==` and does not check the timestamp age. Use the version above when you adapt it. See [Production Considerations](#production-considerations).

### RTMS session lifecycle

File: `rtms/lib/rtmsSession.js` (`handleRTMSStart`, `handleRTMSStop`)

**Input:** `payload` with `call_id`, `rtms_stream_id`, and `server_urls`.

**Output:** A session in the `sessions` map, keyed by `rtms_stream_id`. The session holds the audio, transcript, and signaling sockets and the four feature instances. If the payload is missing a required field, or the stream already has a session, the function returns without changes.

**Invariants:**

- Deduplicate by `rtms_stream_id`, not `call_id`
- The base call ID is the text before the first `_`. Folder and file names use the base ID. The session keeps the original `call_id`, because the signaling handshake signs it.
- Create the feature instances before opening any socket, so the first transcript segment has a destination
- `handleRTMSStop` returns when the session is missing. It sets `stopped = true` before closing sockets, so the socket `close` handlers do not start a second stop.
- Stop the summary timer and close the audio and transcript files on stop

### Signaling and media handshake

File: `rtms/server.js` (`connectToSignalingWebSocket`, `connectToMediaWebSocket`), `rtms/lib/rtmsAuth.js`

Every handshake and acknowledgment carries `protocol_version: 2`. These message types drive the session:

| `msg_type` | Direction | Meaning |
|-----------|-----------|---------|
| 1 | Client to signaling | `SIGNALING_HAND_SHAKE_REQ` with `call_id`, `rtms_stream_id`, and `signature` |
| 2 | Signaling to client | Handshake response. Carries `media_server.server_urls.audio` and `.transcript` |
| 3 | Client to media | `DATA_HAND_SHAKE_REQ`. `media_type` 1 for audio, 8 for transcript |
| 4 | Media to client | Data handshake response |
| 7 | Client to signaling | `CLIENT_READY_ACK`, sent after a successful data handshake |
| 6 | Signaling to client | Event code `3000` carries the participant list, keyed by `channel_id` |
| 12, 13 | Both | Keep-alive request and response. Echo the `timestamp` in the response. |
| 14 | Media to client | `MEDIA_DATA_AUDIO`, base64 PCM in `content.data` |
| 17 | Media to client | `MEDIA_DATA_TRANSCRIPT`, text in `content.data` with `start_time` and `channel_id` |

**Invariants:**

- Each `server_urls` field is a comma-separated list. Use the first `wss://` entry and ignore `srt://`.
- If the signaling handshake fails, or either media URL is missing, stop the stream with a reason
- Set `send_rate` to 20 ms for audio. That is the minimum rate RTMS accepts.
- Compare `event_code` as a string. Zoom sends it as a number.

The signature proves the stream belongs to this app. It is security-critical, so it stays concrete. The signing key is the app's client secret.

```javascript
const crypto = require('crypto');

function generateSignature(callId, streamId, clientId, clientSecret) {
  return crypto
    .createHmac('sha256', clientSecret)
    .update(`${clientId},${callId},${streamId}`)
    .digest('hex');
}
```

### Transcript pipeline

File: `rtms/server.js` (the `msg_type === 17` branch), `rtms/features/transcript/index.js`

**Input:** `MEDIA_DATA_TRANSCRIPT` content with `data`, `start_time` (milliseconds), and `channel_id`.

**Output:** A `transcript` event `{ speaker, text }` for the panel, and one line in `rtms/data/transcripts/<timestamp>_<callId>.txt`.

**Invariants:**

- Skip segments with empty text
- The speaker name comes from the participant map, keyed by `channel_id`. The default is `Unknown`.
- Offsets are measured from the first segment that has a `start_time`, formatted as `[mm:ss]`. Use `--:--` before that segment arrives.
- One transcript file per base call ID. A new stream for the same call appends to the existing file.

Each line in the file reads like this:

```text
[00:03] Agent: Thanks for calling. How can I help?
```

### Keyword prompts and live keywords

File: `rtms/features/keyword-detector/index.js`, `rtms/features/keyword-detector/keywords.json`

**Input:** transcript text from each segment.

**Output:** Two event types. A `prompt` event `{ ruleId, keyword, prompt, text }` fires when a rule matches. A `keywords` event `{ keywords: [{ term, count }] }` lists the most frequent terms.

**Rule shape** in `keywords.json`:

```json
{
  "id": "billing",
  "keywords": ["refund", "overcharged", "charged twice", "billing", "invoice", "payment"],
  "prompt": "Billing topic detected. Verify the account holder, then pull up recent invoices and payment history.",
  "cooldownSeconds": 10
}
```

The sample ships five rules: `cancellation`, `billing`, `escalation`, `outage`, and `recording-consent`. They are customer-service examples. Replace them with rules for your own calls.

**Invariants:**

- Match whole phrases only. The regex is `(?<![\w'])keyword(?![\w'])` against lowercased text, with curly apostrophes normalized to straight ones.
- A rule fires at most once per `cooldownSeconds`. Cooldown is tracked per rule for each call.
- Live keywords come from words of at least `extraction.minLength` characters that are not stopwords, and that appear at least `extraction.minCount` times. The list shows the top `extraction.topN` terms.
- Emit a `keywords` event at most once per `extraction.emitIntervalMs`, and only when the list has changed
- The sample's values are `topN` 8, `minLength` 4, `minCount` 2, and `emitIntervalMs` 2000

### Rolling summary

File: `rtms/features/summarizer/index.js`

**Input:** transcript text from each segment.

**Output:** Every 30 seconds, a `summary` event with the full bullet list so far.

**Invariants:**

- Skip interim results that end with `…`. A final result follows.
- Skip any segment whose normalized text matches one of the last 6 lines. Zoom can deliver the same utterance more than once.
- Each 30-second window adds at most one bullet. A window with no usable content adds nothing.
- A bullet has up to 3 topic terms, the most repeated non-stopword terms of 4 or more characters, followed by the most representative sentence. The sentence is cut to about 90 characters.
- Sentences shorter than 4 words are never quoted
- The timer runs for the life of the session. `stop()` clears it on stream end.

A bullet looks like this:

```text
• billing, refund, invoice — “I was charged twice on the March invoice”
```

### Audio capture

File: `rtms/features/audio/index.js`

**Input:** `MEDIA_DATA_AUDIO` with base64 `content.data` and `content.channel_id`.

**Output:** One raw PCM file per channel in `rtms/data/audio/<timestamp>_<callId>/`. When the stream stops, one WAV file is written next to them.

**Invariants:**

- Audio is 16 kHz, 16-bit little-endian PCM, one stream per `channel_id`
- One folder per base call ID. A new stream for the same call appends to the existing folder.
- One channel produces a mono WAV. Several channels are interleaved sample by sample, in 64 KB chunks, and shorter channels are padded with silence.
- FFmpeg converts raw PCM to WAV. If FFmpeg fails, the code writes the 44-byte WAV header itself.
- On startup, `recoverOrphanedAudio()` finishes any folder that has raw audio but no WAV, for example after a crash.

### Event relay to the panel

File: `rtms/lib/eventNotifier.js`, `backend/server.js` (`/internal/rtms-events` and `/api/events`)

**Input:** An event object from the RTMS service, with `call_id` and `rtms_stream_id` added.

**Output:** One SSE `data:` frame per event, written to every connected panel.

**Invariants:**

- The RTMS service sends `x-internal-token` set to `SESSION_SECRET`. The backend compares it in constant time and returns 401 on mismatch.
- The backend accepts only four event types: `prompt`, `keywords`, `transcript`, and `summary`
- The notifier times out after 2 seconds. A failed delivery is logged. The call continues.
- The SSE endpoint sets `X-Accel-Buffering: no` so proxies do not buffer the stream

The shared-token check is security-critical, so it stays concrete:

```javascript
const expected = process.env.SESSION_SECRET;
const provided = req.get('x-internal-token') || '';
const valid = expected
  && provided.length === expected.length
  && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
if (!valid) return res.status(401).json({ message: 'Unauthorized.' });
```

### OAuth and token storage

File: `backend/server.js` (`/api/auth/login`, `/api/auth/callback`), `backend/helpers/token-store.js`, `backend/helpers/zoom-api.js`

**Input:** An authorization code from Zoom at `/api/auth/callback`.

**Output:** Tokens stored at the Redis key `oauth:tokens:{userId}`. The most recent user ID is stored at `oauth:active_user`.

**Invariants:**

- If the flow started at `/api/auth/login`, the callback must match the stored `state`. Marketplace installs arrive without a stored state, so the callback allows them through.
- The code exchange uses HTTP Basic auth with the client ID and secret
- Tokens are keyed by Zoom user ID. Session cookies do not reliably persist inside the Zoom client iframe, so the sample does not depend on them.
- When a Zoom API call returns 401, refresh once, save the new access and refresh tokens, and retry once. If the refresh fails, return `needsAuth: true`.

The refresh path is security-critical, so it stays concrete:

```javascript
if (error.response?.status === 401 && tokens.refreshToken) {
  const tokenData = await refreshAccessToken(tokens.refreshToken);
  await setTokens(userId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000)
  });
  // retry the original request once with tokenData.access_token
}
```

### Zoom Apps panel

File: `frontend/src/App.jsx`

**Input:** SSE events from `/api/events`, and the Zoom Apps SDK context.

**Output:** The four panel sections described in [Features](#features).

**Invariants:**

- Initialize the SDK with version `0.16.37` and capabilities `getRunningContext` and `getPhoneContext`
- Call `getPhoneContext` only when `getRunningContext` returns `inPhone`
- If SDK initialization fails, the panel still works from SSE. The call information section stays empty.
- Assign speaker colors on first appearance from a fixed six-color palette, so neighboring speakers are easy to tell apart
- Remove each prompt 10 seconds after it arrives. Keep transcript lines for the life of the panel.
- Scroll the newest transcript line into view on each update

### Run the Sample

<details>
<summary><strong>Step-by-step local setup</strong></summary>

1. Clone the repo and create your environment file:

   ```bash
   git clone https://github.com/zoom/phone-rtms-auto.git
   cd phone-rtms-auto
   cp .env.example .env
   ```

2. Start ngrok and copy the HTTPS forwarding URL into `PUBLIC_URL`, `FRONTEND_URL`, and `ZOOM_REDIRECT_URL` in `.env`:

   ```bash
   ngrok http 3001
   ```

3. Set `ZOOM_APP_CLIENT_ID`, `ZOOM_APP_CLIENT_SECRET`, and `ZOOM_SECRET_TOKEN` from your Zoom app. Set `SESSION_SECRET` to a random value. Use the same value for the backend and the RTMS service.

4. Start the services:

   ```bash
   docker compose up
   ```

5. Open `https://YOUR-NGROK-URL/api/auth/login` in a browser and approve the app.

6. Open the app in the Zoom Phone client during a call that has RTMS enabled.

</details>

## App Manifest

The [`manifest.json`](manifest.json) in this folder describes the Zoom General App. Use it as a reference for the settings in the Zoom Marketplace, or validate it with `npm run validate-zoom-manifest -- real-time-phone-call-assistant`.

**Scopes:**

| Scope | Purpose |
|-------|---------|
| `phone:read:voice_call_audio` | Receive call audio over RTMS |
| `phone:read:voice_call_transcript` | Receive live transcript segments |
| `rtms:read:phone_rtms_started` | Receive the RTMS start event |
| `rtms:read:phone_rtms_stopped` | Receive the RTMS stop event |
| `rtms:read:phone_rtms_interrupted` | Receive the RTMS interrupted event. The sample subscribes but does not handle it yet. |
| `user:read:user` | Look up the authenticated user's Zoom user ID at OAuth callback |

**Event subscriptions:** Turn on Event Subscription under **Access**, choose **Webhook**, and set the notification URL to `https://YOUR-NGROK-URL/api/webhooks/zoom`. Subscribe to these Zoom Phone RTMS events:

- RTMS started in Zoom Phone (`phone.call_rtms_started`)
- RTMS stopped in Zoom Phone (`phone.call_rtms_stopped`)
- RTMS interrupted in Zoom Phone. Select it from the event list in the Marketplace. The backend does not forward it to the RTMS service yet.

**Surface and SDK:** Under **Surface**, set the Home URL to `https://YOUR-NGROK-URL/api/home`. Allow `YOUR-NGROK-URL` and `appssdk.zoom.us` in the domain list. Select **Phone** as the product, enable the Zoom Apps SDK, and add `getPhoneContext` and `getRunningContext`.

**OAuth:** Set the redirect URL to `https://YOUR-NGROK-URL/api/auth/callback`. Copy the Client ID and Client Secret from **App Credentials**. Copy the Secret Token from **Access**.

## Acceptance Criteria

- [ ] Starting a phone call with RTMS enabled sends `phone.call_rtms_started`, and the RTMS service logs a successful signaling handshake
- [ ] A webhook with a bad `x-zm-signature` returns 401 and is not forwarded
- [ ] The panel shows call ID and answer start time when opened inside a phone call
- [ ] Transcript lines appear in the panel as each segment arrives, labeled with the speaker name
- [ ] Saying "refund" twice within the cooldown window fires one billing prompt, and the prompt disappears after 10 seconds
- [ ] The summary gains one bullet about every 30 seconds while speech continues
- [ ] Ending the call creates `rtms/data/transcripts/<timestamp>_<callId>.txt` and a WAV file in `rtms/data/audio/<timestamp>_<callId>/`
- [ ] Restarting the RTMS service during a call, then recovering on the next start, produces a WAV from the leftover raw files

<details>
<summary><strong>Production Considerations</strong></summary>

**Secrets:** Do not keep `.env` in production. The file is for local development. Use a secrets manager.

**Zoom API proxy:** `/api/zoom/*` uses the most recently authenticated user's tokens. It checks that a user is active, but it does not check who is calling. Any client that can reach the backend can call Zoom APIs as that user. Add authentication to the proxy before you deploy.

**One active user:** The active user ID is a single global value in Redis (`oauth:active_user`). A deployment with several agents needs a mapping from each agent to their Zoom user ID.

**Webhook verification:** The sample's `validateZoomWebhook` compares signatures with `!==` and does not check the timestamp age. Use the constant-time comparison and the 5-minute window from the Implementation Guide.

**Logging:** `handleZoomUrlValidation` logs `plainToken` and `encryptedToken`. Remove that log line in production. The webhook handler also logs full payloads, which include call IDs and participant names.

**Content Security Policy:** The production branch in `backend/middleware/security.js` still allows `'unsafe-inline'` for scripts and styles. Remove it and use your deployment origin only. The cookie is set with `secure: false` for ngrok. Set it to `true` behind HTTPS in production.

**Recording and consent:** The sample saves transcripts and audio to disk. Check recording consent requirements for every jurisdiction where your agents take calls. The sample includes a `recording-consent` keyword rule, but a rule does not establish consent.

**Retention:** Transcript and audio files contain customer speech. Set a retention policy and delete files on schedule. The sample does not delete them.

**Scaling:** Each RTMS stream's state lives in memory in one RTMS process. Route all events for a stream to the same process. SSE client connections also live in memory in the backend, so more than one backend instance needs a shared pub/sub channel for event delivery.

**Redis:** Secure the Redis instance and keep it off the public internet. Tokens are stored there in plain JSON.

</details>

## Related Blueprints

- [Real-time sales coach](../realtime-sales-coach/): RTMS transcript streaming with an in-meeting panel for sellers
- [AI meeting notetaker](../ai-meeting-notetaker/): Live summaries and action items from the same transcript pipeline
- [Migrate bot to RTMS](../migrate-bot-to-rtms/): Move from a bot-based meeting integration to RTMS
