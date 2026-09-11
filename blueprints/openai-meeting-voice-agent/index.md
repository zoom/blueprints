---
title: "OpenAI Voice Agent in Zoom Meetings"
slug: "openai-meeting-voice-agent"
description: >-
  Build a voice agent that listens to Zoom Meeting audio, uses approved Zoom MCP
  tools, and plays OpenAI Realtime responses inside a Zoom App.
products: ["rtms", "zoom-apps", "mcp"]
verticals: ["agents", "enterprise"]
estimated_time: "1-2 days"
author: "Chun Siong Tan"
status: "draft"
updated: 2026-09-11
github_repo: "https://github.com/zoom/rtms-samples/tree/main/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js"
solution_types: ["agent-automation", "real-time-analysis"]
tags: ["voice-agent", "openai-realtime", "audio", "mcp", "zoom-meetings"]
seo_title: "Build an OpenAI Voice Agent in Zoom Meetings"
seo_keywords: ["zoom meeting voice agent", "zoom rtms openai realtime", "openai voice agent zoom app"]
partners: ["openai"]
license_required: true
license_note: "Requires a Zoom Developer Pack with RTMS audio access and access to the selected OpenAI Realtime model."
stack: "Zoom Apps SDK · Node.js · RTMS · OpenAI Realtime API · Zoom MCP · Web Audio"
---

Build a voice agent that understands spoken requests in a Zoom Meeting, uses approved Zoom MCP tools, and plays OpenAI Realtime responses inside a Zoom App while the meeting is active.

This Blueprint connects [Zoom Realtime Media Streams (RTMS)](https://developers.zoom.us/docs/rtms/) audio from a Zoom Meeting, not a Video SDK session, to the [OpenAI Realtime API](https://developers.openai.com/api/docs/guides/realtime). The reference implementation converts the audio, lets the model call approved tools on [Zoom's hosted MCP server](https://developers.zoom.us/docs/mcp/zoom-mcp-server/), and streams the model's PCM audio to the Zoom App over WebSocket.

The assistant audio plays inside the Zoom App webview for the person running the app. It is not injected as a participant microphone track, so other participants hear it only if the local meeting setup captures that playback. Use headphones while testing to avoid echo and self-interruption.

**What you'll need:**

- A [Zoom Developer Pack](https://zoom.us/pricing/developer) with RTMS audio access
- A Zoom App frontend and backend that can maintain RTMS, OpenAI Realtime, and browser WebSocket sessions
- Access to an [OpenAI Realtime model](https://developers.openai.com/api/docs/guides/realtime)
- A user-authorized Zoom OAuth token when Zoom MCP tools are enabled
- Headphones for testing browser playback without microphone echo

**Features:**

- Receive mixed meeting audio through RTMS.
- Resample 48 kHz L16 audio to 24 kHz PCM for OpenAI Realtime.
- Detect speech turns and produce spoken and text responses.
- Allowlist Zoom MCP search, retrieval, and Zoom Docs tools.
- Play 24 kHz PCM responses in the Zoom App and stop playback when the user interrupts.
- Keep the model conversation aligned with what the user heard by sending playback truncation metadata.

If built-in meeting assistance meets your needs, [Zoom AI Companion](https://zoom.us/ai) provides native in-meeting capabilities without a custom voice pipeline. Build this agent when you need a custom voice, prompt, tool policy, or user experience.

Follow along as we walk through the architecture.

The reference implementation displays connection state and spoken response text in the Zoom App while playing the assistant audio through Web Audio.


## Architecture

### The reusable pattern

Your backend receives mixed meeting audio through RTMS, converts it to the model's required format, and keeps one model session associated with each meeting stream. The model may call a small set of tools using a user-authorized token. Output audio and transcript events cross a separate WebSocket to the Zoom App, where Web Audio schedules playback.

### How the reference implementation handles it

The linked [Node.js reference implementation](https://github.com/zoom/rtms-samples/tree/main/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js) uses RTMSManager, the Zoom Apps SDK, Web Audio, and a server-to-server WebSocket connection to OpenAI. Its default model is [`gpt-realtime-2`](https://developers.openai.com/api/docs/models/gpt-realtime-2), with audio output and optional input transcription. It registers the Zoom MCP server as a remote tool and shows the assistant transcript in the app.

When OpenAI detects new speech, the backend tells the browser to stop queued playback and sends `conversation.item.truncate` with the last played position. This keeps interruption responsive and aligns model context with what the user actually heard.

```mermaid
flowchart TB
    A[Zoom Meeting] -->|Mixed audio via RTMS| B[Node.js audio bridge]
    B -->|Resample 48 kHz to 24 kHz PCM| C[OpenAI Realtime session]
    C -->|Approved MCP tool call| D[Zoom hosted MCP server]
    D -->|Authorized meeting or document result| C
    C -->|24 kHz PCM and response text| E[Frontend WebSocket]
    E -->|Queued Web Audio playback| F[Zoom App webview]
    F -->|Playback interruption position| E
    E -->|conversation.item.truncate| C
```

### Agent integration map

Check what your application already provides before adding components:

| Required capability | Reuse when present | Add when missing |
| --- | --- | --- |
| Webhook endpoint | Existing public API route | HTTPS endpoint for RTMS lifecycle events |
| Signature verification | Existing Zoom webhook middleware | Raw-body HMAC verification and replay protection |
| RTMS audio receiver | Existing media service | Mixed-audio handler keyed by stream |
| Audio conversion | Existing media pipeline | 48 kHz L16 to 24 kHz PCM conversion |
| Realtime client | Existing OpenAI connection manager | One server-side session per RTMS stream |
| MCP authorization | Existing user OAuth and policy layer | Tool allowlist and approval boundary |
| Zoom App frontend | Existing in-meeting app | RTMS controls, status, and assistant transcript UI |
| Audio playback | Existing browser audio layer | PCM queue, Web Audio scheduling, and interruption handling |

## Implementation Guide

### Part 1: Build the live audio bridge

#### 1. Keep one voice session per stream

[`openaiRealtime.js`](https://github.com/zoom/rtms-samples/blob/main/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js/openaiRealtime.js) keeps buffered source audio with the meeting session, slices fixed-size chunks, resamples each chunk, and sends it to the matching OpenAI session. It also routes OpenAI audio deltas and transcript events to the frontend callback for that session.

**Input:** Timestamped 48 kHz L16 mixed audio associated with an RTMS stream

**Output:** Ordered 24 kHz PCM chunks appended to the matching OpenAI Realtime session

**Invariants:**

- One active model session is associated with one `rtms_stream_id`
- Audio order is preserved across buffering and resampling
- Queue size and end-to-end delay have explicit upper bounds
- Old audio is dropped when processing falls behind the allowed latency
- Buffered audio and model sessions are removed when RTMS stops

#### 2. Create the Zoom app

Create a Zoom General App in the [Zoom App Marketplace](https://marketplace.zoom.us/) with Zoom Apps SDK access and permission to read RTMS audio. Add only the user permissions needed by the Zoom MCP tools you plan to use.

| Capability | Candidate scopes |
| --- | --- |
| In-meeting Zoom App | `zoomapp:inmeeting` |
| Live meeting audio | `meeting:read:meeting_audio` |
| Search meetings | `meeting:read:search` |
| Read meeting assets | `meeting:read:assets` |
| List recordings | `cloud_recording:read:list_user_recordings` |
| Read recording content | `cloud_recording:read:content` |
| Create or import Zoom Docs | `docs:write:import` |
| Read or export Zoom Docs | `docs:read:export` |

Subscribe the webhook to `meeting.rtms_started` and `meeting.rtms_stopped`. Remove every MCP scope whose tools are disabled. Verify the combined app design and scopes in Marketplace before use.

Verify webhook signatures over the raw request body, enforce a replay window, and use a timing-safe comparison. Reply before opening RTMS, OpenAI, or MCP connections.

```javascript
import crypto from 'node:crypto';

function verifyZoomWebhook(rawBody, timestamp, signature, secret) {
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;
  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = `v0=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`;
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  return received.length === computed.length && crypto.timingSafeEqual(received, computed);
}
```

Handle Zoom endpoint validation separately because that request follows a different path.

#### 3. Bridge meeting audio to the realtime session

Check the RTMS webhook and reply quickly. Open the RTMS media connection, receive the mixed audio, and convert it from 48 kHz to 24 kHz PCM before sending it to OpenAI.

Set a maximum queue size. If the service falls behind, drop old audio instead of letting the delay keep growing. Keep track of which meeting, RTMS stream, and OpenAI session belong together, and close them when RTMS stops.

### Part 2: Configure the agent and tools

#### 4. Configure turns, voice, and playback

The reference implementation uses server-side voice detection with a 500 ms silence duration, 300 ms prefix padding, and audio output. Treat those values as reference settings. Test them with the languages, microphones, overlap, and room noise expected in your meetings.

These values are source-backed in `buildSessionUpdateEvent()`, which configures 24 kHz PCM input and output, server VAD, automatic response creation, interruption, and the selected voice. The configured model defaults to `gpt-realtime-2`.

Make it clear when the agent is listening, and give participants a simple way to stop it.

The browser queues PCM chunks through Web Audio. When new speech interrupts a response, stop active and queued audio immediately, report the last played position, and truncate the corresponding model item.

**Input:** Realtime session configuration, converted audio, and turn-detection settings

**Output:** Audio response chunks, response transcript events, and optional tool requests for the matching meeting stream

**Invariants:**

- The configured input format matches the bytes sent by the audio bridge
- Output audio is routed only to the Zoom App session associated with the stream
- Browser playback never claims to be a participant microphone track
- Turn settings are tested for the expected languages, overlap, and room noise
- Session errors close or replace only the affected stream session
- Model name, duration, rate, and spend limits come from deployment configuration

#### 5. Restrict MCP tools

Connect to Zoom's hosted MCP server only after the user signs in and gives permission. Enable as few tools as possible. Route content creation and lasting changes through the customer's approval workflow.

The reference implementation defaults MCP approval to `never` and only logs approval requests; it does not include an approval UI. Keep automatic execution only for tools you are willing to run without another prompt. Put write tools behind an approval flow before production.

Do not blindly trust tool descriptions, inputs, or results. Check IDs and permissions, set timeouts, and remove sensitive information from logs.

**Input:** Model-requested tool name and arguments plus user authorization context

**Output:** Authorized Zoom MCP result, approval request, or structured denial

**Invariants:**

- Tool execution uses a user-authorized token with the required granular scopes
- The configured allowlist overrides model requests
- Tool arguments and returned identifiers are validated
- Write tools require the selected approval policy
- Token expiry or tool failure does not interrupt RTMS audio ingestion

#### 6. Deliver and interrupt spoken responses

[`frontendWss.js`](https://github.com/zoom/rtms-samples/blob/main/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js/frontendWss.js) carries assistant audio and status events to the app. [`public/audio-client.js`](https://github.com/zoom/rtms-samples/blob/main/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js/public/audio-client.js) schedules PCM chunks, clears them on interruption, and reports the played position. Keep playback scoped to the intended app instance and stop it when RTMS or the frontend disconnects.

### Part 3: Run the reference implementation

#### 7. Install, configure, and start

```bash
git clone https://github.com/zoom/rtms-samples.git
cd rtms-samples/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js
npm install
cp .env.example .env
```

Set the Zoom, OpenAI, and Zoom MCP values in `.env`:

```dotenv
ZOOM_CLIENT_ID=YOUR_ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET=YOUR_ZOOM_CLIENT_SECRET
ZOOM_SECRET_TOKEN=YOUR_ZOOM_WEBHOOK_SECRET_TOKEN
ZOOM_MCP_ACCESS_TOKEN=YOUR_USER_AUTHORIZED_ZOOM_MCP_TOKEN
ZOOM_MCP_ALLOWED_TOOLS=search_meetings,get_meeting_assets
ZOOM_MCP_REQUIRE_APPROVAL=never
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_VOICE=marin
AUDIO_SAMPLE_RATE=48000
OPENAI_AUDIO_SAMPLE_RATE=24000
PORT=5050
WEBHOOK_PATH=/webhook
```

The Zoom MCP token acts for a user, so obtain it through the approved OAuth sign-in flow. Never log it or put it in browser code. Keep the allowed-tool list as small as the workflow permits. Then run:

```bash
npm start
```

Expose port `5050` over HTTPS and set the Marketplace event endpoint to the configured webhook path.

#### Hosted deployment

[The source deployment PR](https://github.com/zoom/rtms-samples/pull/11) adds a Render Blueprint and Railway service configuration for the Zoom App voice agent. They build one public Docker service from the monorepo root, expose port `5050`, and use `/health` for deployment checks. Supply the Zoom and OpenAI credentials, app domain, frontend WebSocket URL, and optional user-authorized Zoom MCP token. Treat these definitions as pending until the source PR is merged and tested.

These definitions deploy the backend and Zoom App webview. Test RTMS audio, browser playback and interruption, OpenAI Realtime reconnection, MCP authorization, and webhook delivery before publishing a one-click deployment button.

#### 8. Test end to end

Test people talking over each other, silence, interruptions, different accents, poor connections, slow MCP tools, expired tokens, model disconnects, and meetings that end suddenly. Measure how long the first answer takes and how often an answer arrives too late. Check that the agent cannot call tools outside your approved list.

### Production considerations

- Provide clear notice that meeting audio is sent to an external AI provider.
- Review provider retention, regional processing, safety controls, and contractual terms.
- Keep tool permissions separate from prompts. A prompt is not permission.
- Add rate, duration, and spend limits per meeting and tenant.
- Review the prompts, voice, participant notice, and escalation steps with the product and security owners before rollout.

## App Manifest

The [`manifest.json`](manifest.json) in this directory follows the current Zoom Marketplace manifest structure and pre-configures the Zoom App APIs, RTMS audio scope, selected Zoom MCP scopes, development and production URL placeholders, and RTMS lifecycle subscriptions. Remove unused scopes and replace the URL placeholders before importing it.

### RTMS scope

- `meeting:read:meeting_audio`

### MCP scopes

The manifest lists the granular scopes used by the reference implementation's full default tool allowlist. Remove scopes for tools you disable. Read-only meeting, recording, and Zoom Docs scopes should stay separate from `docs:write:import`.

| Scope | Default tool use |
| --- | --- |
| `meeting:read:search` | `search_meetings` |
| `meeting:read:assets` | `get_meeting_assets` |
| `cloud_recording:read:list_user_recordings` | `recordings_list` |
| `cloud_recording:read:content` | `get_recording_resource` |
| `docs:read:export` | `get_file_content` |
| `docs:write:import` | `create_new_file_with_markdown` |

The `search_zoom` tool searches more than one Zoom product. Its additional scope requirements depend on the entity types enabled for the deployment and are not guessed in this manifest. Add only the entity-specific scopes returned by Marketplace or the live MCP authorization error, or remove `search_zoom` from `ZOOM_MCP_ALLOWED_TOOLS`.

### Event subscriptions

- `meeting.rtms_started`
- `meeting.rtms_stopped`

The app owner must verify the current Zoom Marketplace schema, the app type and OAuth flow, each granular scope, Zoom Apps SDK capability, endpoint validation, and hosted MCP authorization behavior. OpenAI project owners must verify the selected realtime model, voice, and data controls. The browser playback path must not be represented as participant audio injection.

## Acceptance Criteria

- [ ] Invalid or stale Zoom webhook signatures are rejected before audio processing begins.
- [ ] Each RTMS stream has its own audio buffer and OpenAI Realtime session.
- [ ] 48 kHz L16 input is converted to the configured 24 kHz PCM format without unbounded buffering.
- [ ] Speech produces response text and audible playback in the intended Zoom App webview.
- [ ] New speech stops queued playback and truncates the model item at the reported playback position.
- [ ] The model cannot call a Zoom MCP tool outside the configured allowlist.
- [ ] Expired OAuth tokens, slow tools, and model disconnects do not close the RTMS stream unexpectedly.
- [ ] Session, audio buffer, and token state is removed when a meeting stream ends.
- [ ] Participant notice, provider data handling, tool permissions, rate limits, and spend limits match the target policy.
- [ ] Documentation and UI explain that playback occurs in the Zoom App, not through a participant microphone track.

## Related Resources

- [Zoom RTMS documentation](https://developers.zoom.us/docs/rtms/)
- [OpenAI Realtime guide](https://developers.openai.com/api/docs/guides/realtime)
- [GPT-Realtime-2 model reference](https://developers.openai.com/api/docs/models/gpt-realtime-2)
- [Zoom MCP Server documentation](https://developers.zoom.us/docs/mcp/zoom-mcp-server/)
- [Zoom App voice-agent reference implementation](https://github.com/zoom/rtms-samples/tree/main/zoom_apps/send_audio_to_openai_realtime_api_with_audio_playback_js)
