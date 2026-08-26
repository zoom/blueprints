---
title: "Real-Time Compliance Advisor in Meetings"
slug: "realtime-compliance-advisor"
description: >-
  Build a real-time compliance advisor that lives inside Zoom meetings.
  Stream transcripts with RTMS, screen every segment against a versioned rule
  pack, and warn the representative before a disclosure is missed or a
  prohibited claim goes unanswered.
products: ["rtms", "zoom-apps"]
verticals: ["finance", "healthcare", "enterprise"]
solution_types: ["real-time-analysis", "compliance-auditing"]
difficulty: "intermediate"
estimated_time: "5-7 hours"
author: "Max Mansfield"
status: "draft"
updated: 2026-08-26
github_repo: "https://github.com/zoom/compliance-advisor-sample"
tags: ["compliance", "finance", "real-time", "audit", "supervision"]
seo_title: "How to build a real-time compliance monitoring app on Zoom"
seo_keywords: ["zoom real-time compliance monitoring", "rtms compliance app", "finra meeting supervision zoom", "build compliance advisor zoom api"]
partners: ["anthropic", "openai"]
license_required: true
license_note: "Requires a paid Zoom Workplace plan with the RTMS entitlement"
stack: "Node · Express · React · Postgres"
deploy:
  - { label: "Render", url: "https://render.com/deploy?repo=https://github.com/zoom/compliance-advisor-sample" }
  - { label: "Railway", url: "https://railway.app/new?repo=https://github.com/zoom/compliance-advisor-sample" }
---

A real-time compliance advisor streams meeting transcripts from RTMS, screens every segment against a versioned rule pack, and warns the licensed representative in a panel only they can see. The alert names the rule, quotes the phrase that triggered it, and offers approved language to correct the record.

Compliance review normally happens weeks after the call, when a surveillance team samples recordings. By then the client has acted on what they heard and the only remedy is remediation. Screening the transcript live gives the representative a chance to correct the record while the other party is still on the call.

**What you'll need:**

- Transcript access via [RTMS](https://developers.zoom.us/docs/rtms/) (requires a paid Zoom Workplace plan with RTMS entitlement; [request access](https://www.zoom.com/en/realtime-media-streams/#form))
- A backend to receive webhooks, screen segments, and persist audit records (Node/Express in this guide; any stack works)
- A [Zoom Surface App](https://developers.zoom.us/docs/zoom-apps/create/) to render the advisor panel in-meeting
- An LLM to adjudicate flagged phrases in context (OpenRouter, OpenAI, Anthropic, or self-hosted)
- A rule pack for your jurisdiction, reviewed and signed off by your compliance team

**Features:**

- Deterministic screening of every transcript segment against a versioned rule pack, under 5ms per segment
- Prohibited-claim alerts with the triggering quote, the rule ID, and approved replacement language
- Required-disclosure checklist that marks each item satisfied when the representative says it
- Severity routing: high-severity alerts post to a supervisor webhook while the meeting is live
- Hash-chained audit log covering every alert, verdict, and disclosure
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

Screening runs in two stages. A deterministic pass matches every segment against the rule pack. Only segments that match go to an LLM, which decides whether the match is a real violation in context. This keeps cost proportional to risk and keeps the first stage reproducible, which matters when an auditor asks why an alert fired.

### Components

| Component | Responsibility | Our stack (yours may differ) |
|-----------|----------------|------------------------------|
| **Transcript access** | Receive RTMS webhooks, join streams, normalize segments | Node service using `@zoom/rtms` SDK |
| **Rule engine** | Match segments against the rule pack, track disclosure state | Node module loading versioned YAML rule packs |
| **Backend** | Adjudicate candidates with an LLM, broadcast alerts, write audit records | Express + Prisma (Postgres) + OpenRouter |
| **Frontend** | Render alerts, disclosure checklist, suggested language | React Surface App via Zoom Apps SDK |
| **Audit store** | Append-only, hash-chained record of every alert and disclosure | Postgres table with a retention policy |

```mermaid
graph LR
    Z[Zoom Meeting] -->|1. webhook| B[Backend]
    B -->|2. forward| R[RTMS]
    Z -->|3. media WS| R
    R -->|4. segments| B
    B -->|5. match| E[Rule Engine]
    E -->|6. candidates| L[LLM]
    L -->|7. verdicts| B
    B -->|8. WS broadcast| P[Advisor Panel]
    B --> D[(Audit Log)]
```

When transcription starts, Zoom sends a webhook to the backend. The backend verifies it, forwards it to the RTMS service, which opens a WebSocket to Zoom and receives transcript segments phrase by phrase. Each segment hits the rule engine within 5ms. Clean segments stop there. Candidates go to the LLM, which returns a verdict in 800ms to 2s. An alert typically reaches the panel 2-3 seconds after the phrase is spoken.

**Our stack vs. your options:** We use Node/Express, but Python/FastAPI, Go, or Ruby work the same way. The requirements are a webhook endpoint Zoom can reach, a WebSocket client for RTMS, a rule matcher, an LLM, and a way to push updates to the frontend.

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
| Webhook endpoint | Existing API routes | Express router or equivalent |
| Signature verification | Existing HMAC middleware | `verifyWebhookSignature()` |
| WebSocket server | Existing real-time layer | ws or Socket.io server |
| Rule storage | Existing policy or feature-flag store | Versioned YAML rule packs on disk |
| Database | Existing Postgres/MySQL | Prisma schema for transcripts and audit records |
| Audit trail | Existing append-only log | Hash-chained `AuditRecord` table |
| LLM client | Existing OpenAI/Anthropic setup | OpenRouter client |
| Supervisor alerting | Existing paging or chat webhook | Outbound webhook on high severity |

---

## Implementation Guide

Three parts: the transcript pipeline, the compliance layer, and running the reference implementation.

Code examples are from [the sample repo](https://github.com/zoom/compliance-advisor-sample), but the patterns transfer to any stack.

### Part 1: Building the Transcript Pipeline

#### Verify the webhook

When transcription starts, Zoom sends `meeting.rtms_started` to your webhook endpoint. Verify the request came from Zoom: compute an HMAC-SHA256 signature over `v0:{timestamp}:{rawBody}` using your webhook secret token, enforce a five-minute replay window, and use timing-safe comparison.

```javascript
function verifyWebhookSignature(rawBody, timestamp, signature) {
  const secret = config.zoomWebhookToken;
  if (!signature || !timestamp) return false;

  const now = Math.floor(Date.now() / 1000);
  const reqTimestamp = parseInt(timestamp, 10);
  if (isNaN(reqTimestamp) || Math.abs(now - reqTimestamp) > 300) return false;

  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  if (signature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
```

Use `express.raw()` to preserve the exact bytes Zoom sent; re-serialized JSON produces a different signature. Handle Zoom's `endpoint.url_validation` challenge before signature verification, since validation requests carry no signature.

**Other languages:** In Python, use `hmac.compare_digest`; in Go, use `crypto/subtle.ConstantTimeCompare`.

#### Stream session management

**Input:** `meeting.rtms_started` webhook payload with `meeting_uuid`, `rtms_stream_id`, `server_urls`

**Output:** Active RTMS session registered, client connected, transcript handler receiving segments

**Invariants:**

- Deduplicate by `rtms_stream_id`, not `meeting_uuid`
- If same meeting arrives with new stream ID (media server failover), tear down old session and join new
- Register transcript handlers before calling `join()`
- Pin the active rule pack version at session start; do not hot-swap packs mid-meeting
- Clean up session on `onLeave` callback
- Track sequence counter per session for segment ordering

**Other languages:** The `@zoom/rtms` SDK is Node-only. For other stacks, implement the WebSocket protocol directly; the [RTMS documentation](https://developers.zoom.us/docs/rtms/) covers the wire format.

See [the RTMS service](https://github.com/zoom/compliance-advisor-sample/tree/main/services/rtms) for the reference implementation.

#### Transcript segment handling

**Input:** Raw transcript callback with `text`, `timestamp` (microseconds), `userId`, `userName`

**Output:** Normalized segment with `speakerId`, `speakerLabel`, `text`, `tStartMs`, `seqNo`

**Invariants:**

- Assign monotonic sequence number per session
- Convert timestamp from microseconds to milliseconds
- Screen synchronously before broadcasting; the rule pass is fast enough to stay inline
- Persist asynchronously with upsert on `(meetingId, seqNo)` for idempotency
- Handle missing userId/userName gracefully with defaults

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

See [the rule engine](https://github.com/zoom/compliance-advisor-sample/tree/main/backend/compliance) for the reference implementation.

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
- Match only against speech from the representative, not the client
- A disclosure moves from pending to satisfied and never back
- Store the quote that satisfied it; a checkbox with no quote is not evidence
- Surface still-pending high-severity disclosures in the panel as the meeting passes the 45-minute mark

#### Audit records

**Input:** An alert or disclosure state change, plus the hash of the previous record for this meeting

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

The [sample repo](https://github.com/zoom/compliance-advisor-sample) implements everything above. Use it to see the patterns working, then fork or reference for your own build.

#### One-click deploy

| Platform | What you get |
|----------|--------------|
| [Deploy to Render](https://render.com/deploy?repo=https://github.com/zoom/compliance-advisor-sample) | Backend, frontend, RTMS service, database |
| [Deploy to Railway](https://railway.app/new?repo=https://github.com/zoom/compliance-advisor-sample) | Backend, frontend, RTMS service, database |

Both have free tiers. After deploying, create a Zoom App in the [Marketplace](https://marketplace.zoom.us/), add `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, and `ZOOM_WEBHOOK_TOKEN`, and set the OAuth redirect URL to your backend.

**Deploy anywhere:** The repo includes a platform-agnostic [Dockerfile](https://github.com/zoom/compliance-advisor-sample/blob/main/Dockerfile) for any container platform. Adjust environment variables for your target.

#### Local setup

| Requirement | Purpose |
|-------------|---------|
| [Node.js 20+](https://nodejs.org/) | Runtime |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Postgres and services |
| [ngrok](https://ngrok.com/) | Public URL for webhooks |
| [Zoom account](https://marketplace.zoom.us/) | App configuration |
| RTMS access | [Request here](https://www.zoom.com/en/realtime-media-streams/#form) |

<details>
<summary><strong>Step-by-step local setup</strong></summary>

1. Clone and configure:

   ```bash
   git clone https://github.com/zoom/compliance-advisor-sample.git
   cd compliance-advisor-sample
   cp .env.example .env
   ```

2. Start ngrok with a [free static domain](https://dashboard.ngrok.com/domains):

   ```bash
   ngrok http 3000 --domain=your-subdomain.ngrok-free.app
   ```

3. Create your Zoom App at [marketplace.zoom.us](https://marketplace.zoom.us/):
   - OAuth Redirect URL: `https://YOUR-NGROK-URL/api/auth/callback`
   - Scopes: `meeting:read:meeting`
   - Zoom App SDK: enable RTMS > Transcripts
   - Surface: Home URL `https://YOUR-NGROK-URL`
   - Event Subscriptions: endpoint `https://YOUR-NGROK-URL/api/rtms/webhook`, events `meeting.rtms_started` and `meeting.rtms_stopped`

4. Fill `.env` with `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBHOOK_TOKEN`, `PUBLIC_URL`, and `RULE_PACK_ID`. Generate secrets:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Start:

   ```bash
   docker-compose up --build
   ```

</details>

Services: Postgres 5432, backend 3000, frontend 3001, RTMS 3002. Rule packs load from `rule-packs/` at startup; the sample ships `fin-us-retail-v3` and `health-us-intake-v1`. Join a meeting, open Apps, select your app, choose a pack, and start transcription.

---

## App Manifest

The [`manifest.json`](./manifest.json) pre-configures OAuth scopes, Surface App capabilities, RTMS transcript access, and event subscriptions. Upload it when creating your app to skip manual configuration.

### Scopes

| Scope | Required | Purpose |
|-------|----------|---------|
| `zoomapp:inmeeting` | Yes | Render the advisor panel in meetings |
| `meeting:read:meeting` | Yes | Meeting metadata for the audit record |
| `user:read` | Optional | Identify the assigned representative |

The panel uses the Zoom Apps SDK `getMeetingParticipants` API for the attendee list on the audit record, so no additional OAuth scope is needed for participants.

### RTMS Configuration

In app settings: **Features** > **Zoom App SDK** > enable **Real-Time Media Streams** > select **Transcripts**. RTMS requires approval from Zoom. [Request access here](https://www.zoom.com/en/realtime-media-streams/#form).

### Event Subscriptions

| Event | Trigger |
|-------|---------|
| `meeting.rtms_started` | Transcription begins; payload has stream credentials |
| `meeting.rtms_stopped` | Transcription ends; close the audit chain for the meeting |

---

<details>
<summary><strong>Production Considerations</strong></summary>

| Area | Development | Production |
|------|-------------|------------|
| Credentials | `.env` file | Secrets manager |
| Sessions | In-memory | Redis |
| WebSockets | Single instance | Redis pub/sub for horizontal scaling |
| HTTPS | ngrok | Load balancer with TLS 1.2+ |
| Audit storage | Same Postgres as the app | Separate database with WORM or object-lock backups |
| Rule packs | Files on disk | Versioned artifact with a compliance sign-off gate in CI |

**This is engineering guidance, not legal advice.** Rule pack content, retention periods, and supervision workflows must be reviewed and approved by your compliance and legal teams before use with real clients.

**Data retention:** Transcripts and audit records contain client information and evidence of supervision. These usually have different retention requirements from each other. Store them separately so you can expire transcripts without destroying the audit chain.

**False positives:** Every alert the representative dismisses is a signal about pack quality. Log dismissals with the rule ID and review them on the same cadence you review the packs themselves.

**Notice:** Participants see Zoom's standard transcription notice. Confirm with counsel whether your jurisdiction requires additional notice that live compliance screening is running.

**Scaling:** Each active meeting holds one RTMS WebSocket connection. The deterministic pass is CPU-bound and cheap; LLM adjudication is the cost driver, so keep packs tight and the suppression window in place.

</details>

---

## Acceptance Criteria

Use this checklist to verify the implementation:

- [ ] Webhook signature verification rejects invalid or stale requests
- [ ] Duplicate `rtms_stream_id` webhooks are ignored
- [ ] Stream failover (new `rtms_stream_id`, same meeting) tears down old session and joins new
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

- [Compliance Advisor Sample](https://github.com/zoom/compliance-advisor-sample) - Reference implementation
- [RTMS Documentation](https://developers.zoom.us/docs/rtms/) - Real-Time Media Streams API reference
- [Zoom Apps SDK](https://developers.zoom.us/docs/zoom-apps/) - Building in-meeting experiences
- [AI Meeting Notetaker](../ai-meeting-notetaker/) - Same transcript pipeline, general-purpose extraction
- [Zoom Developer Forum](https://devforum.zoom.us/) - Community support
