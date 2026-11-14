---
title: "Send Zoom transcripts to ChatGPT or Claude"
slug: "send-transcripts-to-llms"
description: >-
  Build a live meeting analysis workflow that sends Zoom Meeting transcripts
  to OpenAI or Anthropic and returns useful answers while the meeting is active.
products: ["rtms"]
verticals: ["agents"]
author: "Chun Siong Tan"
status: "published"
hero_image: "images/hero.png"
updated: 2026-11-14
github_repo: "https://github.com/zoom/rtms-samples"
demo_url: "https://youtu.be/2Uapr2w8wmk"
solution_types: ["real-time-analysis", "agent-automation"]
tags: ["transcripts", "llm", "real-time", "zoom-meetings"]
seo_title: "Send Zoom transcripts to ChatGPT or Claude"
seo_keywords: ["zoom transcript llm", "zoom openai transcript", "zoom claude transcript"]
partners: ["openai", "anthropic"]
license_required: true
license_note: "Requires Zoom Developer Pack credits for RTMS."
stack: "Node.js · Express · RTMSManager · OpenAI or Anthropic"
---

Build a live analysis path that turns meeting speech into useful answers while the conversation is still happening. A support lead can investigate an objection immediately. An operations team can flag a risk while the people in the meeting can still explain it.

[Zoom Realtime Media Streams (RTMS)](https://developers.zoom.us/docs/rtms/) sends live transcript text to your backend without adding a bot to the participant list. You choose the AI provider, write the prompt, decide how much conversation to include, and choose where the answer goes. This Blueprint includes paths for [OpenAI](https://developers.openai.com/api/docs/) and [Anthropic](https://docs.anthropic.com/), but the design is not tied to either provider.

The transcript is only the starting point. Change the prompt, send the answer to a CRM, start an automation, or show recommendations in your own app.

**What you'll need:**

- [Zoom Developer Pack](https://zoom.us/pricing/developer) credits for RTMS (free trial credits are available)
- A backend that can receive webhooks and maintain one session per RTMS stream
- An OpenAI or Anthropic account, or another approved model provider
- A destination for the results, such as a dashboard, CRM, or automation

## Features

- Receive live transcript segments without adding a meeting participant.
- Keep Zoom and model-provider credentials on the backend.
- Send each OpenAI request with a defined prompt and one transcript segment.
- Keep a bounded Claude conversation history for each RTMS stream.
- Limit request rate, requests per stream, and estimated spend per stream.
- Keep model errors from interrupting the RTMS stream.
- Print each answer to the server log, ready to route to a destination you control.

Follow along as we walk through the architecture.

The reference implementations show the live Zoom Meeting transcript and the
model response produced from that transcript.

<div align="center">
  <img src="images/zoom-client.png" alt="Zoom client showing a live meeting transcript" width="640" />
  <img src="images/llm-response-in-console.png" alt="LLM response produced from the live transcript" width="640" />
</div>

<YouTube id="2Uapr2w8wmk" />

---

## Architecture

### The reusable pattern

When RTMS starts, Zoom sends an event to your webhook. Your backend connects to RTMS and listens for transcript text. A production implementation collects enough conversation for the task, sends bounded context to the chosen model, and forwards the answer to an app or business system.

Keep provider credentials on the server. Never expose them in a browser or commit them to source control.

### How the reference implementation handles it

The linked [RTMS reference implementations](https://github.com/zoom/rtms-samples) use Node.js, Express, and RTMSManager. Both call the provider for each incoming transcript event and write the answer to the server console. The OpenAI path sends one segment without history. The Anthropic path keeps a separate history for each RTMS stream, trims it to 20 messages or 40,000 characters by default, and clears it when the stream stops. Both apply a timeout, a retry limit, and local limits on request rate, requests per stream, and estimated spend per stream. Neither path delivers answers to a CRM, dashboard, automation, or frontend.

```mermaid
flowchart LR
    A[Zoom Meeting] -->|Live transcript via RTMS| B[Node.js RTMS service]
    B -->|Transcript event| C[Provider context: one segment or per-stream history]
    C -->|Provider request| D{Configured LLM}
    D -->|OpenAI or Anthropic response| E[Server console in reference implementation]
    E -.->|Your extension| F[CRM, dashboard, automation, or app]
```

### Agent integration map

Check what your application already provides before adding components:

| Required capability | Reuse when present | Add when missing |
| --- | --- | --- |
| Webhook endpoint | Existing public API route | HTTPS endpoint for RTMS lifecycle events |
| Signature verification | Existing Zoom webhook middleware | Raw-body HMAC verification and replay protection |
| RTMS session manager | Existing stream registry | State keyed by `rtms_stream_id` |
| Transcript context | Existing conversation store | Bounded per-meeting segment buffer |
| Model client | Existing approved AI provider | OpenAI, Anthropic, or equivalent adapter |
| Result delivery | Existing CRM, queue, or UI integration | Destination adapter with retry and idempotency |

## Implementation Guide

### Part 1: Build the transcript pipeline

#### 1. Connect transcript events to a provider boundary

The RTMS repository contains two equivalent starting points:

| Provider | Reference code |
| --- | --- |
| OpenAI | [`transcript/send_transcript_to_openai_js`](https://github.com/zoom/rtms-samples/tree/main/transcript/send_transcript_to_openai_js) |
| Anthropic | [`transcript/send_transcript_to_claude_js`](https://github.com/zoom/rtms-samples/tree/main/transcript/send_transcript_to_claude_js) |

Both implementations register the provider call on RTMSManager's `transcript` event. See [`send_transcript_to_openai_js/index.js`](https://github.com/zoom/rtms-samples/blob/main/transcript/send_transcript_to_openai_js/index.js) for the Node.js implementation. A different language or framework still needs the same lifecycle event, transcript handler, provider boundary, and failure isolation.

#### 2. Create a Zoom General App

Create a General App in the [Zoom App Marketplace](https://marketplace.zoom.us/). Give it permission to read RTMS transcripts, then subscribe your public webhook to the RTMS start and stop events.

| Setting | Value |
| --- | --- |
| Scope | `meeting:read:meeting_transcript` |
| Events | `meeting.rtms_started`, `meeting.rtms_stopped` |
| Webhook URL | `https://YOUR_DOMAIN.example.com/webhook` |

The scope is an RTMS media scope: it selects the media your app receives. An account admin must also turn on **Share realtime meeting content with apps** under **Account Settings** > **Zoom Apps**. The [`manifest.json`](manifest.json) in this directory has the same scope and events.

#### 3. Accept the webhook quickly

Check that every webhook request really came from Zoom and reply to it right away. Start the RTMS connection after sending the reply. Never make Zoom wait while you call the AI provider. Reject requests with an invalid signature or secret token.

Keep signature verification concrete because it protects the entry point. The reference implementations use a shared `verifyZoomWebhookRequest` helper; the check looks like this:

```javascript
import crypto from 'node:crypto';

function verifyZoomWebhook(rawBody, timestamp, signature, secret) {
  if (typeof signature !== 'string') return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false;

  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = `v0=${crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')}`;

  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  return received.length === computed.length &&
    crypto.timingSafeEqual(received, computed);
}
```

Use the raw request bytes, handle endpoint validation separately, and compare signatures with a timing-safe function.

#### 4. Receive transcript segments

Configure RTMSManager to receive transcripts. Both paths pass the `text` field directly to the model call without speaker or timestamp metadata. OpenAI sends only that segment. Anthropic adds it to that stream's conversation history before making the request.

Before using this pattern for meeting-wide analysis, decide which transcript events are final enough for your use case. Add the speaker name and timestamp when they help, and prevent duplicate or still-changing segments from starting repeated requests.

Limit the context by time, number of turns, or tokens. Without a limit, every request gets slower and more expensive as the meeting continues. Summarize older discussion when the agent needs a longer memory.

**Input:** RTMS transcript event with stream ID, speaker, timestamp, and text

**Output:** Normalized transcript segment stored in the correct meeting context

**Invariants:**

- Key state by `rtms_stream_id`, not by a process-wide array
- Deduplicate repeated events before calling a model
- Preserve speaker and timing metadata needed by the use case
- Bound context by time, turns, tokens, or a combination of them
- Remove session state when RTMS stops or the connection closes

### Part 2: Add the analysis layer

#### 5. Call the selected model safely

The OpenAI implementation calls the Responses API from [`chatWithOpenAI.js`](https://github.com/zoom/rtms-samples/blob/main/transcript/send_transcript_to_openai_js/chatWithOpenAI.js) and reads the model from `OPENAI_MODEL` (default `gpt-4.1-mini`). The Anthropic implementation calls the Messages API from [`chatWithClaude.js`](https://github.com/zoom/rtms-samples/blob/main/transcript/send_transcript_to_claude_js/chatWithClaude.js) with that stream's history and reads the model from `CLAUDE_MODEL` (default `claude-sonnet-5`). Both read the timeout (20 seconds), retry limit (2), output limit (512 tokens), input size cap, and request and spend limits from environment variables. The system prompt is a constant in each file; change it there for your task.

Give the model a clear task and ask for a predictable response format. Retry temporary failures only. If an answer can trigger an action, check it against a list of allowed actions first.

Do not send sensitive meeting content to a provider until your organization has approved the provider, region, retention policy, and data-processing terms.

**Input:** Bounded transcript context, task instructions, and current workflow state

**Output:** Validated provider-neutral result for the selected destination

**Invariants:**

- Model, timeout, output limit, and retry policy come from configuration
- Provider-specific response parsing stays behind an adapter
- Invalid or incomplete output does not interrupt RTMS ingestion
- Retries apply only to temporary failures and remain bounded
- High-impact actions require an explicit application policy outside the prompt

#### 6. Add your destination

The reference implementation prints the answer to the server console. Replace that log statement with an adapter for your destination. The linked repository does not include a database, queue, CRM client, or frontend. Add only the components your workflow needs, and keep the model integration independent from the destination.

**Input:** Validated analysis result plus meeting and request identifiers

**Output:** Result delivered to a dashboard, CRM, queue, automation, or application

**Invariants:**

- A destination failure does not close the RTMS session
- Delivery retries are idempotent
- Logs exclude credentials and unnecessary transcript content
- Authorization is checked again before any lasting external action

### Part 3: Run the reference implementation

#### 7. Install, configure, and start

Clone the repository, open the folder for the selected provider, and install its dependencies:

```bash
git clone https://github.com/zoom/rtms-samples.git
cd rtms-samples/transcript/send_transcript_to_openai_js
npm install
```

Use `send_transcript_to_claude_js` for the Anthropic path. Copy `.env.example` to `.env`, then use these values as the working configuration:

```dotenv
ZOOM_CLIENT_ID=YOUR_ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET=YOUR_ZOOM_CLIENT_SECRET
ZOOM_SECRET_TOKEN=YOUR_ZOOM_WEBHOOK_SECRET_TOKEN
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-4.1-mini
PORT=3000
WEBHOOK_PATH=/webhook
```

For Anthropic, replace `OPENAI_API_KEY` with `ANTHROPIC_API_KEY` and `OPENAI_MODEL` with `CLAUDE_MODEL`. Each sample's readme lists the timeout, retry, history, rate, and spend settings. Keep `WEBHOOK_PATH` identical to the Marketplace event endpoint. The samples need Node.js 22 or newer.

#### 8. Verify end to end

Run:

```bash
node index.js
```

Start the service, expose the webhook over HTTPS, start RTMS in a test meeting, and speak several complete sentences. With the reference implementation, verify:

- The webhook receives both lifecycle events.
- Transcript events arrive in the expected order and the application log identifies the speaker.
- The model's answer is printed after each transcript event.
- Model failures do not disconnect the RTMS stream.

The reference implementation prints transcript text and answers to the console. Before production, also verify:

- No transcript or credential appears in unrestricted logs.
- The selected destination receives a useful, bounded response.

Each sample includes a Dockerfile; build it from the `rtms-samples` repository root. Deploy on a platform that supports a long-running HTTPS webhook process, then supply the Zoom credentials, provider key, public domain, and secret storage for that environment.

### Production considerations

- Put AI requests in a separate queue so a slow provider cannot block RTMS.
- Define consent, retention, deletion, and data-residency behavior before production use.
- Redact sensitive fields before provider calls when the use case permits it.
- Track end-to-end latency, model error rates, token usage, and dropped transcript segments.
- Treat model output as untrusted. Route high-impact actions through your approval workflow.

## App Manifest

The [`manifest.json`](manifest.json) in this directory uses the Zoom Marketplace manifest structure and pre-configures live transcript analysis: the transcript scope, development and production OAuth callback placeholders, and RTMS lifecycle subscriptions. It is the OpenAI sample's manifest, so its app name says OpenAI; the Anthropic sample ships the same manifest under its own name. Replace `your-development-domain` and `your-production-domain` before importing it.

### Scopes

- `meeting:read:meeting_transcript`

### Event subscriptions

- `meeting.rtms_started`
- `meeting.rtms_stopped`

### Structure

The manifest contains the app name, description, transcript scope, OAuth callback placeholder, and a webhook endpoint with both lifecycle events. Provider credentials do not belong in the Zoom manifest.

After importing the manifest, review the requested permissions and complete endpoint validation.

## Acceptance Criteria

- A valid Zoom webhook starts one RTMS session, while invalid or stale signatures are rejected.
- Transcript state is isolated by stream and removed when the stream ends.
- Duplicate segments do not create duplicate model requests or destination actions.
- Model context stays within the configured time, turn, or token limit.
- Provider timeouts and malformed responses do not interrupt transcript ingestion.
- The configured destination receives a validated result with meeting context.
- Zoom and provider credentials stay on the backend and out of logs.
- Data handling, retention, and provider use match your approved policy.

## Related Resources

- [Zoom RTMS documentation](https://developers.zoom.us/docs/rtms/)
- [RTMS JavaScript SDK reference](https://zoom.github.io/rtms/js/)
- [OpenAI reference implementation](https://github.com/zoom/rtms-samples/tree/main/transcript/send_transcript_to_openai_js)
- [Anthropic reference implementation](https://github.com/zoom/rtms-samples/tree/main/transcript/send_transcript_to_claude_js)
