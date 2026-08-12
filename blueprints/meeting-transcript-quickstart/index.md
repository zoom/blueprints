---
title: "Capture Live Zoom Meeting Transcripts"
slug: "meeting-transcript-quickstart"
description: >-
  Capture a live Zoom Meeting transcript with RTMS and save it as VTT, SRT,
  and plain text for search, analysis, or storage.
products: ["rtms"]
verticals: ["enterprise"]
difficulty: "beginner"
estimated_time: "1-2 hours"
author: "Chun Siong Tan"
status: "draft"
updated: 2026-08-11
github_repo: "https://github.com/zoom/rtms-samples/tree/main/transcript/save_transcript_js"
solution_types: ["transcription-summarization"]
tags: ["transcripts", "quickstart", "vtt", "srt", "zoom-meetings"]
seo_title: "Zoom Meeting Live Transcript RTMS Quickstart"
seo_keywords: ["zoom meeting transcript api", "zoom rtms transcript", "save zoom transcript"]
license_required: true
license_note: "Requires RTMS to be enabled for the Zoom account and meeting."
stack: "Node.js · Express · RTMSManager"
---

## Problem Statement

Meeting search, quality review, notes, and AI tools all need a reliable transcript. Waiting for a recording adds delay. Building speaker ordering and subtitle files from scratch also slows down the first useful test.

**Zoom Realtime Media Streams (RTMS)** sends transcript text while the meeting is running. This quickstart saves it as VTT, SRT, and plain text. It keeps the timing and speaker information, and it does not add a bot to the meeting.

These files are a starting point. Search them, summarize them, attach them to a support case, or move them to your approved storage system.

## Architecture

Zoom tells your webhook when RTMS starts and stops. The Node.js service connects to RTMS, receives the transcript, puts complete segments in the right order, and writes three file formats into a folder for that meeting.

```mermaid
flowchart LR
    A[Zoom Meeting] -->|RTMS transcript stream| B[Node.js transcript receiver]
    B -->|Final segments and timestamps| C[Transcript formatter]
    C -->|WebVTT| D[VTT file]
    C -->|SubRip| E[SRT file]
    C -->|Readable transcript| F[TXT file]
    D --> G[Customer storage or processing]
    E --> G
    F --> G
```

## Implementation Guide

### 1. Install the reference sample

Use the Node.js version required by the sample.

```bash
git clone https://github.com/zoom/rtms-samples.git
cd rtms-samples/transcript/save_transcript_js
npm install
```

### 2. Create a Zoom General App

Create a General App in the Zoom Marketplace and add your public webhook URL.

| Setting | Value |
| --- | --- |
| Scope | `meeting:read:meeting_transcript` |
| Events | `meeting.rtms_started`, `meeting.rtms_stopped` |
| Webhook URL | `https://YOUR_DOMAIN.example.com/webhook` |

Enable RTMS for the account and meeting. Use `manifest.json` as a starting point and verify it in the target Marketplace account.

### 3. Configure the service

Create the environment file used by the sample.

```dotenv
ZOOM_CLIENT_ID=YOUR_ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET=YOUR_ZOOM_CLIENT_SECRET
ZOOM_SECRET_TOKEN=YOUR_ZOOM_WEBHOOK_SECRET_TOKEN
PORT=3000
```

Keep production values in a managed secret store. Do not place real values in documentation, logs, screenshots, or source control.

### 4. Receive RTMS lifecycle events

Make the webhook available over HTTPS. Check every request and reply quickly. When you receive `meeting.rtms_started`, use the meeting UUID and stream details to connect to RTMS. When you receive `meeting.rtms_stopped`, save any remaining text and close the connection.

### 5. Write transcript formats

The sample writes meeting output beneath `recordings/<meeting-uuid>/`. Confirm that:

- VTT and SRT cues have monotonic timestamps.
- Final transcript segments are not duplicated.
- Speaker labels are escaped before writing subtitle files.
- Interrupted connections do not overwrite an existing transcript unexpectedly.

Local files are fine for a quickstart. In production, copy completed text or files to storage that your organization manages and backs up.

### 6. Test a complete meeting

Run the service and start RTMS in a test meeting with at least two people speaking. Stop RTMS and open all three output files. Check punctuation, participant names, silence, reconnection, and what happens when a meeting ends unexpectedly.

### Production considerations

- Encrypt transcript files in transit and at rest.
- Define retention and deletion rules before collecting customer meetings.
- Use a queue or object store instead of relying on ephemeral application disk.
- Restrict access by meeting and tenant; do not expose sequential file paths publicly.
- Monitor missing segments, reconnects, storage failures, and end-to-end lag.

## App Manifest

[`manifest.json`](manifest.json) is a candidate Zoom General App manifest containing the transcript scope, callback placeholder, and RTMS started/stopped event subscriptions. Replace `YOUR_DOMAIN` with an HTTPS domain controlled by the app owner.

Before publication, a human app owner must import it into the target Zoom Marketplace account, confirm the permissions and current schema, complete endpoint validation, and test it with an RTMS-enabled meeting. Passing repository validation only proves that the JSON is present and parseable; it is not Marketplace approval.
