---
title: "Real-Time Compliance Advisor in Meetings"
slug: "realtime-compliance-advisor"
description: >-
  Build a real-time compliance advisor that lives inside Zoom meetings.
  Stream transcripts with the Zoom RTMS SDK, screen every segment against a
  versioned rule pack, and warn the representative before a disclosure is
  missed or a prohibited claim goes unanswered.
products: ["rtms", "zoom-apps"]
verticals: ["finance", "healthcare", "enterprise"]
solution_types: ["real-time-analysis", "compliance-auditing"]
difficulty: "intermediate"
estimated_time: "5-7 hours"
author: "Max Mansfield"
status: "draft"
updated: 2026-08-26
github_repo: "https://github.com/zoom/rtms-compliance-sample-js"
tags: ["compliance", "finance", "real-time", "audit", "supervision"]
seo_title: "How to build a real-time compliance monitoring app on Zoom"
seo_keywords: ["zoom real-time compliance monitoring", "rtms compliance app", "finra meeting supervision zoom", "build compliance advisor zoom api"]
partners: ["anthropic", "openai"]
license_required: true
license_note: "Requires a paid Zoom Workplace plan with the RTMS entitlement"
stack: "Node 22 · Express · @zoom/rtms · React · Postgres"
deploy:
  - { label: "Render", url: "https://render.com/deploy?repo=https://github.com/zoom/rtms-compliance-sample-js" }
  - { label: "Railway", url: "https://railway.app/new?repo=https://github.com/zoom/rtms-compliance-sample-js" }
---

A real-time compliance advisor streams meeting transcripts through the [Zoom RTMS SDK](https://github.com/zoom/rtms), screens every segment against a versioned rule pack, and warns the licensed representative in a panel only they can see. The alert names the rule, quotes the phrase that triggered it, and offers approved language to correct the record.

Compliance review normally happens weeks after the call, when a surveillance team samples recordings. By then the client has acted on what they heard and the only remedy is remediation. Screening the transcript live gives the representative a chance to correct the record while the other party is still on the call.

**What you'll need:**

- Transcript access via [RTMS](https://developers.zoom.us/docs/rtms/) (requires a paid Zoom Workplace plan with RTMS entitlement; [request access](https://www.zoom.com/en/realtime-media-streams/#form))
- The [`@zoom/rtms`](https://www.npmjs.com/package/@zoom/rtms) SDK, which needs Node.js 22 or higher on `darwin-arm64` or `linux-x64` (Node 24 LTS recommended)
- A backend to screen segments and persist audit records (Express in this guide; the SDK also ships Python bindings)
- A [Zoom Surface App](https://developers.zoom.us/docs/zoom-apps/create/) to render the advisor panel in-meeting
- An LLM to adjudicate flagged phrases in context (OpenRouter, OpenAI, Anthropic, or self-hosted)
- A rule pack for your jurisdiction, reviewed and signed off by your compliance team

**Features:**

- Deterministic screening of every transcript segment against a versioned rule pack, under 5ms per segment
- Prohibited-claim alerts with the triggering quote, the rule ID, and approved replacement language
- Required-disclosure checklist that marks each item satisfied when the representative says it
- Severity routing: high-severity alerts post to a supervisor webhook while the meeting is live
- Hash-chained audit log covering every alert, verdict, disclosure, and coverage gap
- Post-meeting compliance summary exportable as JSON for your surveillance system

If you'd rather buy than build, Zoom offers [Zoom Compliance Manager](https://www.zoom.com/en/products/compliance-manager/) for archiving, eDiscovery, and risk detection across Zoom Workplace.

Follow along as we walk through the architecture.

<!-- TODO(images): capture and commit before review.
     1. images/disclosure-checklist.png - advisor panel with two disclosures satisfied, one pending
     2. images/prohibited-claim-alert.png - a high-severity alert with quote and suggested language
     3. images/audit-export.png - post-meeting compliance summary
     Then restore the block below:

<div align="center">
  <img src="images/disclosure-checklist.png" alt="Disclosure Checklist" width="640" />
  <img src="images/prohibited-claim-alert.png" alt="Prohibited Claim Alert" width="640" />
</div>

[Watch a 2-minute demo](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
-->

---

## Architecture

RTMS streams transcripts directly from Zoom's infrastructure. No bot joins the meeting, so the roster stays clean and the participant list in the audit record reflects only real attendees. The standard transcription notice displays to everyone.

The [`@zoom/rtms`](https://github.com/zoom/rtms) SDK collapses what would otherwise be two services into one process. It exposes a webhook handler you mount on your existing Express app, and a `Client` that opens the media WebSocket to Zoom and delivers transcript segments to a callback. There is no separate RTMS microservice to run.

Screening runs in two stages. A deterministic pass matches every segment against the rule pack. Only segments that match go to an LLM, which decides whether the match is a real violation in context. This keeps cost proportional to risk and keeps the first stage reproducible, which matters when an auditor asks why an alert fired.

### Components

| Component | Responsibility | Our stack (yours may differ) |
|-----------|----------------|------------------------------|
| **Transcript access** | Receive RTMS webhooks, join streams, deliver segments | `@zoom/rtms` mounted on the backend process |
| **Rule engine** | Match segments against the rule pack, track disclosure state | Node module loading versioned YAML rule packs |
| **Backend** | Adjudicate candidates with an LLM, broadcast alerts, write audit records | Express + Prisma (Postgres) + OpenRouter |
| **Frontend** | Render alerts, disclosure checklist, suggested language | React Surface App via Zoom Apps SDK |
| **Audit store** | Append-only, hash-chained record of every alert, disclosure, and coverage gap | Postgres table with a retention policy |

```mermaid
graph LR
    Z[Zoom Meeting] -->|1. webhook| B[Backend with @zoom/rtms]
    Z -->|2. media WS| B
    B -->|3. segments| E[Rule Engine]
    E -->|4. candidates| L[LLM]
    L -->|5. verdicts| B
    B -->|6. WS broadcast| P[Advisor Panel]
    B --> D[(Audit Log)]
```

When transcription starts, Zoom sends `meeting.rtms_started` to the webhook handler. The handler verifies the signature, constructs an `rtms.Client`, registers callbacks, and calls `join(payload)`. The SDK opens the media WebSocket and begins delivering transcript segments. Each segment hits the rule engine within 5ms. Clean segments stop there. Candidates go to the LLM, which returns a verdict in 800ms to 2s. An alert typically reaches the panel 2-3 seconds after the phrase is spoken.

**Our stack vs. your options:** We use Node/Express because `@zoom/rtms` ships Node bindings, but the same SDK ships [Python bindings](https://pypi.org/project/rtms/) and the compliance layer is stack-agnostic. Go bindings are planned. Whatever you pick, the requirements are a webhook endpoint Zoom can reach, an RTMS client, a rule matcher, an LLM, and a way to push updates to the frontend.

### How screening works

Every feature in the compliance layer follows the same three-stage path:

1. **Match**: Run the segment against the rule pack lexicon. Deterministic, no network call, under 5ms
2. **Adjudicate**: Send matched candidates plus 30 seconds of surrounding context to the LLM for a violation verdict and suggested correction
3. **Record**: Broadcast the verdict to the panel and append it to the audit log with the rule ID, model version, and quote

The two stages stay separate in storage. Each audit record keeps the deterministic rule ID and the model verdict in different fields, so a reviewer can tell which part of an alert was a pattern match and which part was a model judgment. A rule pack version is stamped on every record, so replaying an old meeting uses the rules that were in force at the time.

Disclosure tracking runs on a different cadence. Every 20 seconds the backend checks the full transcript against the pack's required disclosures and updates each item to satisfied or pending.

### Agent integration map

If you're grafting this into an existing codebase, check what you already have before adding anything:

| Required capability | Reuse when present | Add when missing |
|--------------------|--------------------|------------------|
| HTTP server | Existing Express/Fastify app | `rtms.createWebhookHandler()` on a new route |
| Signature verification | Existing HMAC middleware | `verifySignature()` over the raw body |
| RTMS client | Nothing to reuse | `@zoom/rtms` |
| WebSocket server | Existing real-time layer | ws or Socket.io server |
| Rule storage | Existing policy or feature-flag store | Versioned YAML rule packs on disk |
| Database | Existing Postgres/MySQL | Prisma schema for transcripts and audit records |
| Audit trail | Existing append-only log | Hash-chained `AuditRecord` table |
| LLM client | Existing OpenAI/Anthropic setup | OpenRouter client |
| Supervisor alerting | Existing paging or chat webhook | Outbound webhook on high severity |

---

## Implementation Guide

Three parts: the transcript pipeline, the compliance layer, and running the reference implementation.

Code examples are from [`rtms-compliance-sample-js`](https://github.com/zoom/rtms-compliance-sample-js), but the patterns transfer to any stack the SDK supports.

### Part 1: Building the Transcript Pipeline

The [`@zoom/rtms`](https://github.com/zoom/rtms) SDK handles webhook delivery and the media WebSocket. Install it and confirm your runtime first:

```bash
node --version    # must be >= 22.0.0; the SDK uses N-API 9/10
npm install @zoom/rtms
```

Prebuilt binaries exist for `darwin-arm64` and `linux-x64`. A Node version below 22 segfaults on import rather than failing cleanly, so pin it in `.nvmrc` and check it in CI.

#### Mount the webhook route

The SDK offers two ways in. `rtms.onWebhookEvent()` runs its own HTTP server, which is the fastest path for a standalone listener. `rtms.createWebhookHandler(callback, path)` mounts on an Express app you already own, which is what a compliance app needs, since it also serves the Surface App and the audit API.

Take the raw body on that route rather than parsed JSON. Zoom signs the exact bytes it sent, and re-serializing a parsed object produces different bytes and a different HMAC:

```javascript
import express from 'express';

const app = express();

// express.raw() guarantees req.body is the original Buffer. Do not mount
// express.json() ahead of this route.
app.post('/api/rtms/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const { status, body, action } = handleWebhook({
    rawBody: req.body,
    headers: req.headers,
    secret: process.env.ZM_RTMS_WEBHOOK_SECRET,
  });

  // Acknowledge before doing any work. Zoom retries a slow response, and a
  // retry is a second join for the same stream.
  res.status(status).json(body);

  if (action.type === 'stream_start') sessions.startStream(action.payload);
  if (action.type === 'stream_stop') sessions.stopStream(action.payload);
});

app.use(express.json()); // every other route
```

Keeping verification in your own handler, rather than inside the SDK callback, means the security-critical path is a pure function you can test directly: bytes and headers in, a decision out.

#### Verify the webhook

Verify the request came from Zoom before acting on it: compute an HMAC-SHA256 signature over `v0:{timestamp}:{rawBody}` using your webhook secret token, enforce a five-minute replay window, and use timing-safe comparison.

```javascript
function verifySignature(rawBody, timestamp, signature) {
  const secret = process.env.ZM_RTMS_WEBHOOK_SECRET;
  if (!signature || !timestamp) return false;

  const now = Math.floor(Date.now() / 1000);
  const reqTimestamp = parseInt(timestamp, 10);
  if (isNaN(reqTimestamp) || Math.abs(now - reqTimestamp) > 300) return false;

  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = 'v0=' + crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

Handle Zoom's `endpoint.url_validation` challenge before signature verification, since validation requests carry no signature. Respond with the `plainToken` and its HMAC-SHA256 under the same secret.

**Other languages:** In Python, use `hmac.compare_digest`; in Go, use `crypto/subtle.ConstantTimeCompare`. The SDK's [Node](https://github.com/zoom/rtms/blob/main/examples/node.md#webhook-validation) and [Python](https://github.com/zoom/rtms/blob/main/examples/python.md#webhook-validation) guides show the same pattern.

#### Stream session management

**Input:** Verified `meeting.rtms_started` payload with `meeting_uuid`, `rtms_stream_id`, `server_urls`, `signature`

**Output:** An `rtms.Client` joined to the stream with callbacks registered, tracked by stream ID

**Invariants:**

- Keep a `Map` keyed by `rtms_stream_id`, not `meeting_uuid`; one meeting can produce several streams
- Register every callback before calling `join()`; callbacks attached afterward miss early segments
- Call `setTranscriptParams()` before `join()` (see below)
- If the same meeting arrives with a new stream ID (media server failover), call `leave()` on the old client and join the new one
- On `meeting.rtms_stopped`, call `leave()` and delete the map entry
- Use `onLeave` to close the audit chain, not the webhook; the stream can end without a webhook

```javascript
const clients = new Map();

function startSession(payload) {
  const client = new rtms.Client();
  clients.set(payload.rtms_stream_id, client);

  client.setTranscriptParams({ srcLanguage: rtms.TranscriptLanguage.ENGLISH });

  client.onJoinConfirm((reason) => openAuditChain(client.uuid(), reason));
  client.onTranscriptData(handleSegment(client));
  client.onParticipantEvent(recordAttendance(client));
  client.onMediaConnectionInterrupted((ts) => recordCoverageGap(client.uuid(), ts));
  client.onLeave((reason) => closeAuditChain(client.uuid(), reason));

  client.join(payload);
}
```

**Set the transcript language.** Without `setTranscriptParams`, the SDK auto-detects the spoken language, which takes roughly 30 seconds. For a general notetaker that is a minor delay. For compliance it is 30 seconds of a regulated conversation with no screening, at the exact point in the call where consent and disclosure language is usually spoken. Pass an explicit `srcLanguage` and transcription starts immediately.

**Record coverage gaps.** `onMediaConnectionInterrupted` fires when the media connection drops. An audit log that silently omits the gap implies the call was screened end to end. Write a gap record with the timestamp and close it when segments resume.

See [the RTMS session module](https://github.com/zoom/rtms-compliance-sample-js/tree/main/src/rtms) for the reference implementation.

#### Transcript segment handling

**Input:** `onTranscriptData(buffer, size, timestamp, metadata)` where `buffer` is UTF-8 text, `timestamp` is Unix milliseconds, and `metadata` carries `userId` and `userName`

**Output:** Normalized segment with `speakerId`, `speakerLabel`, `text`, `tStartMs`, `seqNo`

**Invariants:**

- Decode with `buffer.toString('utf8')`; the callback hands you a `Buffer`, not a string
- Timestamps are already Unix milliseconds; do not rescale them
- Assign a monotonic sequence number per stream, since the SDK does not provide one
- Screen synchronously before broadcasting; the rule pass is fast enough to stay inline
- Persist asynchronously with upsert on `(meetingId, seqNo)` for idempotency
- Handle missing `userId`/`userName` gracefully with defaults

**Speaker attribution:** transcript metadata identifies the speaker per segment. If you also process mixed audio, that stream carries no speaker identity; use `onActiveSpeakerEvent` for attribution there.

**Other databases:** Works with Postgres, MySQL, or a time-series database. Pick one that supports the retention window your policy requires.

#### WebSocket delivery

**Input:** Client connection with `meeting_id` and JWT token

**Output:** Real-time transcript segments, alerts, and disclosure updates pushed to connected clients

**Invariants:**

- Require valid JWT on every connection
- Client sends `{ type: 'subscribe', meetingId }` after connecting
- Server broadcasts `{ type: 'transcript.segment', data }`, `{ type: 'compliance.alert', data }`, and `{ type: 'disclosure.state', data }`
- Only the host and assigned representative receive `compliance.alert` messages
- Clean up subscriptions on disconnect
- Panel appends segments in `seqNo` order

### Part 2: Building the Compliance Layer

With transcripts flowing, screen them. The rule pack is the contract between your compliance team and your code.

#### Rule pack format

**Input:** A YAML file per jurisdiction and meeting type, versioned in Git

**Output:** A loaded, compiled rule set with prohibited patterns and required disclosures

**Invariants:**

- Every pack carries an `id` that includes a version suffix; packs are never edited in place
- Every rule has a stable `id`, a `severity`, and author-supplied `guidance`
- Patterns compile once at load, not per segment
- Loading fails closed: an invalid pack stops the service rather than screening with partial rules
- Compliance owns pack content; engineering owns the loader

```yaml
id: fin-us-retail-v3
jurisdiction: US
applies_to: [retail-investment-review]
prohibited:
  - id: guaranteed-return
    severity: high
    match: ["guaranteed return", "risk[- ]free", "can.t lose"]
    guidance: "Past performance does not guarantee future results. Restate as a historical range."
  - id: unapproved-projection
    severity: medium
    match: ["you.ll definitely", "we always beat", "locked[- ]in gains?"]
    guidance: "Replace the projection with approved illustration language."
required_disclosures:
  - id: recording-consent
    severity: high
    satisfied_by: ["this meeting is being recorded", "consent to record"]
    prompt: "Confirm verbal consent to record before continuing."
  - id: fees-and-conflicts
    severity: high
    satisfied_by: ["advisory fee", "conflict of interest", "how we are compensated"]
    prompt: "State the advisory fee schedule and any conflicts of interest."
```

#### Deterministic screening pass

**Input:** Normalized transcript segment, compiled rule pack

**Output:** Zero or more candidates, each with `ruleId`, `severity`, `matchedText`, `seqNo`

**Invariants:**

- Run on every segment, inline, before broadcast
- Normalize case and collapse whitespace before matching; do not strip punctuation that changes meaning
- A segment can produce multiple candidates; do not stop at the first match
- Suppress a repeat candidate for the same `ruleId` within a 60-second window
- Emit nothing when there is no match; clean segments never reach the LLM

See [the rule engine](https://github.com/zoom/rtms-compliance-sample-js/tree/main/src/compliance) for the reference implementation.

#### LLM adjudication

**Input:** Candidate, the triggering segment, and the prior 30 seconds of transcript

**Output:** JSON with `violation` (boolean), `confidence`, `rationale`, and `suggested_language`

**Invariants:**

- Only adjudicate candidates, never the full stream
- Send the rule's `guidance` text in the prompt so suggestions match approved language
- Parse JSON response, strip markdown fences if present
- On a malformed response or timeout, keep the alert at reduced confidence rather than dropping it
- Record the model identifier and prompt version on the audit record
- A model verdict never clears the deterministic match from the record

**Prompt structure** (customize for your jurisdiction and product set):

```
You are a compliance reviewer for a regulated financial services firm.
A deterministic rule matched a phrase in a live client meeting.
Decide whether it is a real violation in context.

Rule: {{rule.id}} ({{rule.severity}})
Approved guidance: {{rule.guidance}}
Matched phrase: "{{candidate.matchedText}}"
Prior 30 seconds: {{context}}

Return JSON only:
{
  "violation": true | false,
  "confidence": 0.0 - 1.0,
  "rationale": "one sentence citing the transcript",
  "suggested_language": "what the representative should say now"
}

Mark violation false when the phrase is quoted, negated, or spoken by the client.
```

**Other LLMs:** Works with OpenAI, Anthropic, or self-hosted models. For reliability, use the provider's JSON mode or function calling.

#### Disclosure tracking

**Input:** Full transcript for the meeting, the pack's `required_disclosures`

**Output:** Per-disclosure state of `satisfied` or `pending`, with the satisfying quote and `seqNo`

**Invariants:**

- Run on a 20-second interval, not per segment
- Match only against speech from the representative, identified by `metadata.userId` on the segment
- A disclosure moves from pending to satisfied and never back
- Store the quote that satisfied it; a checkbox with no quote is not evidence
- Surface still-pending high-severity disclosures in the panel as the meeting passes the 45-minute mark

#### Audit records

**Input:** An alert, disclosure state change, or coverage gap, plus the hash of the previous record for this meeting

**Output:** An append-only record whose hash covers its own content and the prior hash

**Invariants:**

- Serialize fields in a fixed key order before hashing; JSON key order changes break verification
- Genesis record for a meeting uses a `prevHash` of 64 zeros
- Records are insert-only; corrections append a new record referencing the original
- Verification replays the chain from genesis and compares each stored hash

```javascript
function buildAuditRecord(meetingId, prevHash, record) {
  const canonical = JSON.stringify({
    meetingId,
    seqNo: record.seqNo,
    ruleId: record.ruleId,
    rulePackVersion: record.rulePackVersion,
    severity: record.severity,
    quote: record.quote,
    verdict: record.verdict,
    modelId: record.modelId,
    occurredAt: record.occurredAt,
    prevHash,
  });

  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return { ...record, meetingId, prevHash, hash };
}
```

**Other languages:** Any SHA-256 implementation works. The requirement is a canonical serialization both the writer and the verifier agree on.

#### Frontend state management

**Input:** WebSocket stream of segments, alerts, and disclosure updates

**Output:** React state for transcript, active alerts, disclosure checklist

**Invariants:**

- Append segments in `seqNo` order
- Dedupe alerts by `(ruleId, seqNo)`
- Sort active alerts by severity, then recency
- An alert stays visible until the representative dismisses it; dismissal writes an audit record
- Show existing alerts and disclosure state on reconnect, then apply incremental updates
- Never render an alert to a participant who is not the assigned representative

**Other frameworks:** Works with Vue, Svelte, or vanilla JS. The Surface App runs inside the Zoom client via iframe; standard web tech applies.

#### Customizing rule packs

The rule pack is the main customization point. Different regulated conversations need different packs:

| Meeting type | Pack adjustments |
|--------------|------------------|
| **Retail investment review** | Performance claims, suitability questions, fee and conflict disclosure |
| **Insurance sales** | State licensing statements, replacement-policy warnings, free-look period |
| **Telehealth intake** | Patient identity verification, consent to treat, PHI handling in shared screens |
| **Debt collection** | Mini-Miranda notice, call-time restrictions, third-party disclosure limits |

Keep one pack per jurisdiction and meeting type rather than one pack with conditionals. Small packs are easier for a compliance reviewer to sign off on, and pinning a version per meeting stays meaningful.

### Part 3: Running the Reference Implementation

The [sample repo](https://github.com/zoom/rtms-compliance-sample-js) implements everything above. Use it to see the patterns working, then fork or reference for your own build.

#### One-click deploy

| Platform | What you get |
|----------|--------------|
| [Deploy to Render](https://render.com/deploy?repo=https://github.com/zoom/rtms-compliance-sample-js) | Backend, frontend, database |
| [Deploy to Railway](https://railway.app/new?repo=https://github.com/zoom/rtms-compliance-sample-js) | Backend, frontend, database |

Both have free tiers. After deploying, create a Zoom App in the [Marketplace](https://marketplace.zoom.us/), set `ZM_RTMS_CLIENT` and `ZM_RTMS_SECRET` to your app's OAuth credentials, and point the OAuth redirect URL at your backend.

**Deploy anywhere:** The repo includes a platform-agnostic [Dockerfile](https://github.com/zoom/rtms-compliance-sample-js/blob/main/Dockerfile) for any container platform. It uses `node:24-trixie-slim`; see the platform constraint below before changing the base image.

#### Local setup

| Requirement | Purpose |
|-------------|---------|
| [Node.js 22+](https://nodejs.org/) | `@zoom/rtms` requires N-API 9/10; 24 LTS recommended |
| `darwin-arm64` or `linux-x64` | Platforms with prebuilt SDK binaries |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Postgres and services |
| [ngrok](https://ngrok.com/) | Public URL for webhooks |
| [Zoom account](https://marketplace.zoom.us/) | App configuration |
| RTMS access | [Request here](https://www.zoom.com/en/realtime-media-streams/#form) |

<details>
<summary><strong>Step-by-step local setup</strong></summary>

1. Clone and configure:

   ```bash
   git clone https://github.com/zoom/rtms-compliance-sample-js.git
   cd rtms-compliance-sample-js
   nvm use            # reads .nvmrc, pins Node 24
   cp .env.example .env
   ```

2. Start ngrok with a [free static domain](https://dashboard.ngrok.com/domains):

   ```bash
   ngrok http 3000 --domain=your-subdomain.ngrok-free.app
   ```

3. Create your Zoom App at [marketplace.zoom.us](https://marketplace.zoom.us/):
   - OAuth Redirect URL: `https://YOUR-NGROK-URL/api/auth/callback`
   - Scopes: `zoomapp:inmeeting` only
   - Zoom App SDK: enable RTMS > Transcripts
   - Surface: Home URL `https://YOUR-NGROK-URL`
   - Event Subscriptions: endpoint `https://YOUR-NGROK-URL/api/rtms/webhook`, events `meeting.rtms_started` and `meeting.rtms_stopped`

4. Fill `.env`. The SDK reads the `ZM_RTMS_*` variables directly from the environment; the rest are the app's:

   ```bash
   # Read by @zoom/rtms
   ZM_RTMS_CLIENT=your_client_id
   ZM_RTMS_SECRET=your_client_secret
   ZM_RTMS_WEBHOOK_SECRET=your_webhook_secret_token
   ZM_RTMS_LOG_LEVEL=info
   ZM_RTMS_LOG_FORMAT=json

   # Read by the app
   ZOOM_HOST=https://zoom.us          # https://zoomgov.com for Zoom for Government
   PUBLIC_URL=https://your-subdomain.ngrok-free.app
   DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance
   RULE_PACK_ID=fin-us-retail-v3
   TRANSCRIPT_LANGUAGE=ENGLISH
   LLM_API_KEY=your_llm_api_key
   ```

   Generate `SESSION_SECRET`, `JWT_SECRET`, and `TOKEN_ENCRYPTION_KEY` with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Startup fails with every missing variable named at once, rather than at the first webhook.

5. Start:

   ```bash
   docker compose up --build
   ```

</details>

Services: Postgres 5432, backend 3000 (Express plus the RTMS client in-process), frontend 3001. Rule packs load from `rule-packs/` at startup; the sample ships `fin-us-retail-v3` and `health-us-intake-v1`. Join a meeting, open Apps, select your app, choose a pack, and start transcription.

Set `ZM_RTMS_LOG_FORMAT=json` and `ZM_RTMS_LOG_LEVEL=debug` when a stream fails to join. The SDK logs the join handshake, which is usually where credential and entitlement problems surface.

---

## App Manifest

The [`manifest.json`](./manifest.json) pre-configures OAuth scopes, Surface App capabilities, RTMS transcript access, and event subscriptions. Upload it when creating your app to skip manual configuration.

### Scopes

| Scope | Required | Purpose |
|-------|----------|---------|
| `zoomapp:inmeeting` | Yes | Render the advisor panel in meetings |

One scope, and it is the one that makes the panel exist. Everything else this app needs arrives over the media stream: transcripts through RTMS, the attendee roster through `onParticipantEvent`, and the speaker on each segment through the transcript callback's `metadata`. Panel identity comes from the Zoom Apps SDK in-client, not from a REST call.

That means there is no server-side token exchange to implement, and no `meeting:read:meeting` or `user:read` to justify to a reviewer. Add them when you add the REST call that needs them, not before. A compliance app asking for scopes it never exercises is a poor advertisement for itself.

### RTMS Configuration

In app settings: **Features** > **Zoom App SDK** > enable **Real-Time Media Streams** > select **Transcripts**. RTMS requires approval from Zoom. [Request access here](https://www.zoom.com/en/realtime-media-streams/#form).

The SDK authenticates with the same OAuth Client ID and Secret, supplied as `ZM_RTMS_CLIENT` and `ZM_RTMS_SECRET`.

### Event Subscriptions

| Event | Trigger |
|-------|---------|
| `meeting.rtms_started` | Transcription begins; payload has stream credentials |
| `meeting.rtms_stopped` | Transcription ends; call `leave()` and close the audit chain |

---

<details>
<summary><strong>Production Considerations</strong></summary>

| Area | Development | Production |
|------|-------------|------------|
| Credentials | `.env` file | Secrets manager |
| Sessions | In-memory `Map` | Redis, so a restart does not orphan joined streams |
| WebSockets | Single instance | Redis pub/sub for horizontal scaling |
| HTTPS | ngrok | Load balancer with TLS 1.2+ |
| SDK logs | `progressive` format | `ZM_RTMS_LOG_FORMAT=json` into your log pipeline |
| Egress | Direct | `client.setProxy('http', url)` before `join()` for inspected egress |
| Audit storage | Same Postgres as the app | Separate database with WORM or object-lock backups |
| Rule packs | Files on disk | Versioned artifact with a compliance sign-off gate in CI |

**This is engineering guidance, not legal advice.** Rule pack content, retention periods, and supervision workflows must be reviewed and approved by your compliance and legal teams before use with real clients.

**Platform constraint:** `@zoom/rtms` ships prebuilt binaries for `darwin-arm64` and `linux-x64`, and the Linux binary has two base-image requirements. It needs glibc, so Alpine's musl will not load it at all. It also needs libstdc++ providing `GLIBCXX_3.4.31` or newer, which rules out Debian bookworm: bookworm ships gcc-12 and stops at `GLIBCXX_3.4.30`. Debian trixie (gcc-14, `GLIBCXX_3.4.33`) works.

Both failures happen when the container starts, not when it builds, and the second one reports as `version GLIBCXX_3.4.31 not found (required by rtms.node)`. Boot the container in CI rather than trusting a successful `docker build`.

**Data retention:** Transcripts and audit records contain client information and evidence of supervision. These usually have different retention requirements from each other. Store them separately so you can expire transcripts without destroying the audit chain.

**False positives:** Every alert the representative dismisses is a signal about pack quality. Log dismissals with the rule ID and review them on the same cadence you review the packs themselves.

**Notice:** Participants see Zoom's standard transcription notice. Confirm with counsel whether your jurisdiction requires additional notice that live compliance screening is running.

**Scaling:** Each active meeting holds one RTMS client and one media WebSocket in your process. The deterministic pass is CPU-bound and cheap; LLM adjudication is the cost driver, so keep packs tight and the suppression window in place.

</details>

---

## Acceptance Criteria

Use this checklist to verify the implementation:

- [ ] Webhook signature verification rejects invalid or stale requests
- [ ] `endpoint.url_validation` is answered before signature verification runs
- [ ] Callbacks and `setTranscriptParams()` are registered before `join()`
- [ ] An explicit `srcLanguage` is set, so screening starts without the auto-detect delay
- [ ] Duplicate `rtms_stream_id` webhooks are ignored
- [ ] Stream failover (new `rtms_stream_id`, same meeting) calls `leave()` on the old client
- [ ] `onMediaConnectionInterrupted` writes a coverage gap to the audit log
- [ ] An invalid rule pack fails the service at startup rather than screening with partial rules
- [ ] The rule pack version is pinned at session start and stamped on every audit record
- [ ] Clean segments never reach the LLM
- [ ] Repeat candidates for the same rule are suppressed within the 60-second window
- [ ] A malformed or timed-out LLM response still produces an alert at reduced confidence
- [ ] Disclosures move from pending to satisfied only, and store the satisfying quote
- [ ] Audit chain verifies from genesis; tampering with any record breaks verification
- [ ] Alerts render only for the assigned representative, never for other participants
- [ ] WebSocket connections require valid JWT and clean up on disconnect
- [ ] No SDK credentials in client bundles or logs

---

## Related Resources

- [rtms-compliance-sample-js](https://github.com/zoom/rtms-compliance-sample-js) - Reference implementation
- [Zoom RTMS SDK](https://github.com/zoom/rtms) - Node, Python, and Go bindings for real-time media
- [RTMS SDK API reference](https://zoom.github.io/rtms/js/) - Generated docs for the Node bindings
- [rtms-quickstart-js](https://github.com/zoom/rtms-quickstart-js) - Smallest working RTMS app
- [RTMS Documentation](https://developers.zoom.us/docs/rtms/) - Real-Time Media Streams API reference
- [Zoom Apps SDK](https://developers.zoom.us/docs/zoom-apps/) - Building in-meeting experiences
- [AI Meeting Notetaker](../ai-meeting-notetaker/) - Same transcript pipeline, general-purpose extraction
- [Zoom Developer Forum](https://devforum.zoom.us/) - Community support
