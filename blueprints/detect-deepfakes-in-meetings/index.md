---
title: "Live Deepfake Risk Detection in Zoom Meetings"
slug: "detect-deepfakes-in-meetings"
description: >-
  Check live Zoom Meeting audio and video with a commercial or self-hosted
  deepfake model, then show possible risks in a Zoom App.
products: ["rtms", "zoom-apps"]
verticals: ["enterprise", "finance"]
difficulty: "advanced"
estimated_time: "1-2 days"
author: "Chun Siong Tan"
status: "draft"
updated: 2026-08-12
github_repo: "https://github.com/zoom/rtms-samples/tree/main/zoom_apps/stream_audio_and_video_deepfake_detection_js"
solution_types: ["real-time-analysis", "security-encryption", "media-processing"]
tags: ["deepfake", "fraud", "risk", "audio", "video", "zoom-meetings"]
seo_title: "Detect Audio and Video Deepfakes in Zoom Meetings"
seo_keywords: ["zoom deepfake detection", "meeting deepfake detection", "live audio video fraud detection"]
license_required: true
license_note: "Requires RTMS and a Zoom App configured for the in-meeting experience."
stack: "Zoom Apps SDK · Node.js · RTMS · Customer inference service · HLS"
---

Fraud and security teams may need to spot suspicious audio or video while an important meeting is still happening. A review after the meeting may come too late to stop an impersonation attempt or a harmful instruction.

This blueprint sends [Zoom Realtime Media Streams (RTMS)](https://developers.zoom.us/docs/rtms/) audio and video to a detection service that you choose. You can use a commercial API or host your own model from [Hugging Face](https://huggingface.co/docs/inference-endpoints/). A [Zoom App](https://developers.zoom.us/docs/zoom-apps/) shows the result to an authorized reviewer in the meeting.

Deepfake detection is not certain. A high score is not proof that someone is trying to deceive you. Results can change with the language, microphone, camera, connection quality, lighting, participant, or type of attack. Use the result as one signal in a documented fraud-review process. Do not use the score as an automatic decision.

## Features

The review experience needs to:

- Let an authorized user choose the participant to review.
- Send only that participant's configured audio and video windows to inference.
- Show video and audio results separately with model and service status.
- Distinguish an unavailable model from a low-confidence result.
- Keep final decisions within the approved fraud-review policy.

## Architecture

### The reusable pattern

An authorized Zoom App starts RTMS from inside the meeting. The backend receives selected media, creates bounded clips, and sends them to a customer-owned inference adapter. The adapter turns each provider's response into one result contract. The backend sends service health and review cues back to the Zoom App.

### How this sample implements it

The linked [Node.js sample](https://github.com/zoom/rtms-samples/tree/main/zoom_apps/stream_audio_and_video_deepfake_detection_js) uses the [Zoom Apps SDK](https://appssdk.zoom.us/), Express, Socket.IO, RTMSManager, FFmpeg, and HLS. It requests one participant's individual video stream, receives multi-stream audio, and filters the audio packets to the same selected RTMS user ID.

By default, the sample cuts video into two-second clips sampled at five frames per second and audio into four-second PCM windows. It expects a separate inference service. The sample README names `Naman712/Deep-fake-detection` for video and `MelodyMachine/Deepfake-audio-detection-V2` for audio as examples. The customer owns the model or commercial service, hosting, credentials, evaluation, threshold, and data policy. Neither model service is included in this Blueprint repository.

```mermaid
flowchart LR
    B[In-meeting Zoom App] -->|startRTMS and stopRTMS| A[Zoom Meeting]
    A -->|Selected video and multi-stream audio| C[RTMS media service]
    B <-->|Selection, status, and results| C
    C -->|Bounded audio and video clips| D[Customer inference adapter]
    D -->|Commercial API| E[Selected detection service]
    D -->|Private endpoint| F[Customer-hosted model]
    E -->|Normalized scores| D
    F -->|Normalized scores| D
    D -->|Risk signal and model metadata| C
    C -->|Status and review cues| B
```

## Implementation Guide

### Part 1: Define the review and inference layer

#### 1. Establish the review policy first

Before connecting a live meeting, decide:

- Which meetings and roles may use detection.
- What participant notice and consent are required.
- Which media is sent to the inference service and for how long it is retained.
- Which score should show a warning and what the reviewer should do next.
- How false positives, appeals, audit records, and model changes are handled.

Security, privacy, legal, and AI-risk owners should approve these decisions. Do not use the sample's default score as your production threshold.

#### 2. Install the reference application

Use the Node.js version required by the sample. Install FFmpeg if the selected media flow needs it.

```bash
git clone https://github.com/zoom/rtms-samples.git
cd rtms-samples/zoom_apps/stream_audio_and_video_deepfake_detection_js
npm install
```

#### 3. Provide a customer-owned inference endpoint

Create a small adapter for your commercial service or self-hosted model. Give the rest of the app these consistent endpoints:

| Endpoint | Input | Normalized result |
| --- | --- | --- |
| `POST /video/classify` | MP4 clip and metadata headers | Label plus real/fake scores |
| `POST /audio/classify` | PCM L16, 16 kHz, mono | Label plus real/fake scores |
| `GET /video/health` | None | Readiness status |
| `GET /audio/health` | None | Optional readiness status |

Return a bounded JSON shape such as:

```json
{
  "label": "review",
  "scores": {
    "real": 0.42,
    "fake": 0.58
  }
}
```

Keep the API credential on the server and use HTTPS. Limit the request size and response time. Save the model name and version with each result. Decide what the adapter should return when the model is down, does not support the media, has low confidence, or receives only part of a clip.

The endpoint contract stays the same whether the adapter calls a commercial service, a managed inference endpoint, or a model in your own environment. Do not copy the sample model names into production without evaluating them on approved data from the intended meeting conditions.

### Part 2: Connect Zoom media to the reviewer

#### 4. Create the Zoom app

Create a General App in the [Zoom App Marketplace](https://marketplace.zoom.us/) that includes the Zoom App in-meeting experience. Configure the domains used by the frontend, backend, and inference service.

| Setting | Value |
| --- | --- |
| Scopes | `zoomapp:inmeeting`, `meeting:read:meeting_audio`, `meeting:read:meeting_video` |
| Events | `meeting.rtms_started`, `meeting.rtms_stopped` |
| Zoom Apps APIs | `getMeetingContext`, `getMeetingUUID`, `getMeetingParticipants`, `getRunningContext`, `startRTMS`, `stopRTMS`, `showNotification` |

Use `manifest.json` as a starting point for the scopes and events. You still need to configure and check the Zoom App APIs and allowed domains in Marketplace.

#### 5. Configure the application

<details>
<summary><strong>Environment variables</strong></summary>

Use placeholders in local configuration and managed secrets in deployment.

```dotenv
ZOOM_CLIENT_ID=YOUR_ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET=YOUR_ZOOM_CLIENT_SECRET
ZOOM_SECRET_TOKEN=YOUR_ZOOM_WEBHOOK_SECRET_TOKEN
INFERENCE_BASE_URL=https://YOUR_INFERENCE_DOMAIN.example.com
INFERENCE_API_KEY=YOUR_INFERENCE_API_KEY
DEEPFAKE_REVIEW_THRESHOLD=YOUR_APPROVED_THRESHOLD
PORT=5050
PUBLIC_BASE_URL=https://YOUR_DOMAIN.example.com
```

Do not send names or email addresses to the detection provider unless the service requires them and the data use is approved. Use a private internal participant ID instead when possible.

</details>

#### 6. Bound and classify media

Send short clips instead of an endless stream. Process audio and video separately so one can keep working if the other fails. Limit how many requests run at once, and drop old work when the result would arrive too late to help.

Check that every response has the expected fields and valid scores. Show which model ran, which part of the meeting it checked, how confident it was, and whether the service is healthy. Never turn a score directly into an accusation.

### Part 3: Run the reference implementation

#### 7. Start the application

Copy `.env.example` to `.env`, configure the Zoom app and inference URLs, then run:

```bash
npm start
```

Open the app inside a Zoom Meeting. Start RTMS, choose a participant whose video is on, load that participant's video, and start video or audio verification. The HLS preview requires FFmpeg on the backend host.

The sample repository does not include the inference service, a tested one-click deployment, or a production identity and audit system. You must deploy and operate those parts in your environment.

#### 8. Test under realistic conditions

Create an approved test set. Include normal participants, approved synthetic media, different devices and languages, poor lighting, weak connections, and compressed media. Measure how often the model is wrong at your proposed threshold. Also test slow responses and service outages.

Choose the production threshold from those test results and your organization's risk policy. Do not choose it from this document or from one successful demo.

### Production considerations

- Pin and review model versions; a silent provider model change can alter behavior.
- Encrypt clips, minimize retention, and delete temporary files after the approved interval.
- Separate informational warnings from access-control or fraud decisions.
- Make the service health visible so reviewers know when no classification occurred.
- Complete bias, accessibility, security, privacy, and legal reviews before rollout.

## App Manifest

[`manifest.json`](manifest.json) is a candidate manifest listing the in-meeting, audio, and video permissions plus RTMS lifecycle events. It cannot encode the complete organizational approval, Zoom App capability configuration, inference-provider contract, or model-risk policy.

### Scopes

- `zoomapp:inmeeting`
- `meeting:read:meeting_audio`
- `meeting:read:meeting_video`

### Event subscriptions

- `meeting.rtms_started`
- `meeting.rtms_stopped`

### Zoom Apps configuration

Enable the SDK capabilities used by the frontend and allow the app domain plus `https://appssdk.zoom.us/`. The manifest is a starting point; Marketplace capability and domain settings require separate verification.

The app owner must verify the current Marketplace schema, exact scopes, in-client APIs, redirect and webhook URLs, and domain allowlist. Security, privacy, legal, and AI-risk reviewers must approve participant disclosures, inference data handling, evaluation results, threshold, escalation language, and intended use before publication or production deployment.

## Related Resources

- [Zoom RTMS documentation](https://developers.zoom.us/docs/rtms/)
- [Zoom Apps SDK reference](https://appssdk.zoom.us/)
- [Deepfake review sample](https://github.com/zoom/rtms-samples/tree/main/zoom_apps/stream_audio_and_video_deepfake_detection_js)
- [Hugging Face Inference Endpoints](https://huggingface.co/docs/inference-endpoints/)

## What Will You Build?

Keep the first deployment to one selected participant and informational results visible only to an authorized reviewer. You can replace either model independently, send results to a security case system, or add an audit record that captures the model version and reviewed media window. Keep escalation and final action outside the score calculation.
