---
title: "Capture live meeting transcripts for search and storage"
slug: "meeting-transcript-quickstart"
description: >-
  Build a live transcript pipeline for Zoom Meetings. Capture RTMS transcript
  segments and save VTT, SRT, and plain-text files for search or storage.
products: ["rtms"]
verticals: ["enterprise"]
author: "Chun Siong Tan"
status: "published"
hero_image: "images/hero.png"
updated: 2026-11-14
github_repo: "https://github.com/zoom/rtms-samples/tree/main/transcript/save_transcript_js"
demo_url: "https://youtu.be/5CjRLI59ErQ"
solution_types: ["transcription-summarization"]
tags: ["transcripts", "quickstart", "vtt", "srt", "zoom-meetings"]
seo_title: "Capture live meeting transcripts for search and storage"
seo_keywords: ["zoom meeting transcript api", "zoom rtms transcript", "save zoom transcript"]
license_required: true
license_note: "Requires Zoom Developer Pack credits for RTMS."
stack: "Node.js · Express · RTMSManager"
---

Build a live transcript pipeline that produces VTT, SRT, and plain-text files before a cloud recording is processed. The resulting files can feed meeting search, quality review, notes, storage, or an AI workflow.

[Zoom Realtime Media Streams (RTMS)](https://developers.zoom.us/docs/rtms/) sends transcript text while the meeting is running. This quickstart saves it as [WebVTT](https://www.w3.org/TR/webvtt1/), SubRip (SRT), and plain text. It keeps the timing and speaker information, and it does not add a bot to the meeting.

These files are a starting point. Search them, summarize them, attach them to a support case, or move them to your approved storage system.

**What you'll need:**

- Transcript access through [RTMS](https://developers.zoom.us/docs/rtms/) (requires [Zoom Developer Pack](https://zoom.us/pricing/developer) credits; free trial credits are available)
- A backend that can receive Zoom webhooks and RTMS transcript events
- Writable local storage for the quickstart, or customer-managed storage for production
- A Zoom Meeting with RTMS enabled for testing

## Features

- Receive a live transcript without adding a participant bot.
- Create VTT, SRT, and TXT files for each RTMS stream, plus a JSON Lines event log.
- Preserve speaker labels and relative subtitle timing.
- Append each received transcript event to readable local files.
- Ignore duplicate events and rebuild the files after a restart.

Follow along as we walk through the architecture.

<YouTube id="5CjRLI59ErQ" />

---

## Architecture

### The reusable pattern

Zoom tells your webhook when RTMS starts and stops. A transcript service connects to RTMS, receives timestamped segments, orders them, and writes or forwards them in the formats the next system expects.

### How the reference implementation handles it

The linked [Node.js reference implementation](https://github.com/zoom/rtms-samples/tree/main/transcript/save_transcript_js) uses Express and RTMSManager. A `TranscriptStore` keeps separate timing, counters, and files for each `rtms_stream_id`, so concurrent meetings do not share state. It appends every event to an `events.jsonl` log and to VTT, SRT, and TXT files, ignores duplicate events, rebuilds the files from the log after a restart, and deletes inactive stream folders after a retention period (30 days by default). Everything is on local disk. Treat it as a starting point, not as a multi-tenant transcript store.

```mermaid
flowchart TB
    A[Zoom Meeting] -->|RTMS transcript stream| B[Node.js transcript receiver]
    B -->|Transcript events and timestamps| C[Transcript formatter]
    C -->|WebVTT| D[VTT file]
    C -->|SubRip| E[SRT file]
    C -->|Readable transcript| F[TXT file]
    C -->|Event log| H[JSONL file]
    D --> G[Customer storage or processing]
    E --> G
    F --> G
```

### Agent integration map

Check what your application already provides before adding components:

| Required capability | Reuse when present | Add when missing |
| --- | --- | --- |
| Webhook endpoint | Existing public API route | HTTPS endpoint for RTMS lifecycle events |
| Signature verification | Existing Zoom webhook middleware | Raw-body HMAC verification and replay protection |
| RTMS session manager | Existing stream registry | State keyed by `rtms_stream_id` |
| Transcript normalizer | Existing event schema | Speaker, text, timing, and sequence normalization |
| Format writer | Existing export service | VTT, SRT, and TXT serializers |
| Storage | Existing object or document storage | Local filesystem for the quickstart |

## Implementation Guide

### Part 1: Build the transcript pipeline

#### 1. Connect RTMS transcript events to the writer

[`index.js`](https://github.com/zoom/rtms-samples/blob/main/transcript/save_transcript_js/index.js) registers one handler that passes every transcript event to the `TranscriptStore`. The same pipeline can write to object storage, a database, a queue, or another transcript format. Keep the meeting identifier, speaker, start time, end time, and text when replacing the local writer.

#### 2. Create a Zoom General App

Create a General App in the [Zoom App Marketplace](https://marketplace.zoom.us/) and add your public webhook URL.

| Setting | Value |
| --- | --- |
| Scope | `meeting:read:meeting_transcript` |
| Events | `meeting.rtms_started`, `meeting.rtms_stopped` |
| Webhook URL | `https://YOUR_DOMAIN.example.com/webhook` |

The scope is an RTMS media scope: it selects the media your app receives. An account admin must also turn on **Share realtime meeting content with apps** under **Account Settings** > **Zoom Apps**.

#### 3. Receive RTMS lifecycle events

Make the webhook available over HTTPS. Check every request and reply quickly. The reference implementation verifies the request, replies with HTTP 200, and only then hands the event to RTMSManager, which manages the RTMS connection. On `meeting.rtms_stopped` it closes that stream's transcript session.

Keep signature verification concrete because it protects the entry point. The reference implementation uses a shared `verifyZoomWebhookRequest` helper; the check looks like this:

```javascript
import crypto from 'node:crypto';

function verifyZoomWebhook(rawBody, timestamp, signature, secret) {
  if (typeof signature !== 'string') return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false;
  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = `v0=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`;
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  return received.length === computed.length && crypto.timingSafeEqual(received, computed);
}
```

Use the raw request bytes, handle endpoint validation separately, and reply before file work begins.

**Input:** Valid `meeting.rtms_started` or `meeting.rtms_stopped` event

**Output:** One active transcript session or a completed session cleanup

**Invariants:**

- Deduplicate start events by `rtms_stream_id`
- Register handlers before joining the RTMS stream
- Keep counters, timing origins, and output paths isolated by stream
- Close file handles and remove session state when RTMS stops

### Part 2: Write usable transcript files

#### 4. Write transcript formats

[`writeTranscriptToVtt.js`](https://github.com/zoom/rtms-samples/blob/main/transcript/save_transcript_js/writeTranscriptToVtt.js) writes each stream to its own folder:

```text
recordings/
  <meeting-id-and-hash>/
    <stream-id-and-hash>/
      events.jsonl
      metadata.json
      transcript.vtt
      transcript.srt
      transcript.txt
```

`events.jsonl` is the append-only record. The VTT, SRT, and TXT files are built from it, so after a restart the store reads the log, drops an incomplete last record, restores the SRT counter and timing origin, and rebuilds the three files. Events for one stream are written in order, and separate streams write concurrently. Speaker names and text are escaped before they go into a cue, and the hashes in the folder names stop two IDs that sanitize to the same name from colliding.

Confirm that:

- VTT and SRT cues have monotonic timestamps.
- Repeated transcript events do not create unwanted duplicate cues.
- Speaker labels are escaped before writing subtitle files.
- Interrupted connections do not overwrite an existing transcript unexpectedly.

Local files are fine for a quickstart. In production, copy completed text or files to storage that your organization manages and backs up.

**Input:** Normalized segment with meeting ID, sequence, speaker, text, start time, and end time

**Output:** Matching VTT cue, SRT cue, and plain-text line

**Invariants:**

- Cue times are monotonic and end times do not precede start times
- SRT indexes increase within one stream and restart only for a new stream
- Retries and duplicate events do not create duplicate cues
- Untrusted speaker labels and text cannot break the output format or path
- A partial write is detected and can be recovered without overwriting completed content

### Part 3: Run the reference implementation

#### 5. Install, configure, and start

```bash
git clone https://github.com/zoom/rtms-samples.git
cd rtms-samples/transcript/save_transcript_js
npm install
cp .env.example .env
```

Set the following values in `.env`:

```dotenv
ZOOM_CLIENT_ID=YOUR_ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET=YOUR_ZOOM_CLIENT_SECRET
ZOOM_SECRET_TOKEN=YOUR_ZOOM_WEBHOOK_SECRET_TOKEN
PORT=3000
WEBHOOK_PATH=/webhook
TRANSCRIPT_OUTPUT_DIR=recordings
TRANSCRIPT_RETENTION_DAYS=30
```

The sample needs Node.js 22 or newer. Use the same webhook path in `.env` and Marketplace. Transcript files contain meeting content and participant names, so set the retention period to match your policy and restrict access to the output directory. Keep production values in a managed secret store.

Run:

```bash
node index.js
```

Expose port `3000` through an HTTPS tunnel for local development, then use the resulting `/webhook` URL in Marketplace. The sample includes a Dockerfile; build it from the `rtms-samples` repository root and mount a volume at the output directory so transcripts survive container replacement.

#### 6. Test a complete meeting

Run the service and start RTMS in a test meeting with at least two people speaking. Stop RTMS and open all three output files. Check punctuation, participant names, silence, reconnection, and what happens when a meeting ends unexpectedly.

### Production considerations

- Encrypt transcript files in transit and at rest.
- Define retention and deletion rules before collecting customer meetings.
- Use a queue or object store instead of relying on ephemeral application disk.
- Restrict access by meeting and tenant; do not expose sequential file paths publicly.
- Monitor missing segments, reconnects, storage failures, and end-to-end lag.

## App Manifest

The [`manifest.json`](manifest.json) in this directory summarizes the configuration for live transcript capture: transcript scope, an OAuth callback placeholder, and RTMS lifecycle subscriptions. It is a summary, not a file in the Zoom Marketplace manifest structure. To create the app by import, use the [manifest in the sample](https://github.com/zoom/rtms-samples/blob/main/transcript/save_transcript_js/manifest.json), which has the same scope and events in the Marketplace structure, and replace its domain placeholders first.

### Scopes

- `meeting:read:meeting_transcript`

### Event subscriptions

- `meeting.rtms_started`
- `meeting.rtms_stopped`

### Structure

The manifest contains the app identity, transcript scope, OAuth callback placeholder, and the public lifecycle webhook. It does not configure transcript storage or retention; those are application responsibilities.

After creating the app, complete endpoint validation and test it with an RTMS-enabled meeting.

## Acceptance Criteria

- Invalid or stale webhook signatures are rejected before RTMS work begins.
- Two simultaneous meetings write to separate state and output directories.
- One test meeting produces readable VTT, SRT, and TXT files.
- VTT and SRT timestamps remain monotonic across pauses and reconnections.
- Duplicate transcript events do not create duplicate cues.
- A stopped or failed stream releases its session state and file resources.
- Restarting the service does not overwrite a completed transcript unexpectedly.
- Production storage, retention, encryption, and deletion behavior are documented for the target environment.

## Related Resources

- [Zoom RTMS documentation](https://developers.zoom.us/docs/rtms/)
- [RTMS JavaScript SDK reference](https://zoom.github.io/rtms/js/)
- [Save-transcript reference implementation](https://github.com/zoom/rtms-samples/tree/main/transcript/save_transcript_js)
