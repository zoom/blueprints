---
title: "Analyze Zoom Meeting Transcripts with Jev for Real-Time Coaching"
slug: "analyze-transcripts-with-jev-for-real-time-coaching"
description: >-
  Build a real-time sales coaching app that sends Zoom Meeting transcripts to
  Jev for typed buyer-intent, deal-stage, risk, and next-action decisions.
  Show ranked coaching choices in a Zoom App while the conversation is active.
products: ["rtms", "zoom-apps"]
verticals: ["sales", "enterprise"]
estimated_time: "1-2 days"
author: "Chun Siong Tan"
status: "draft"
updated: 2026-09-30
github_repo: "https://github.com/zoom/rtms-samples/tree/main/zoom_apps/jev_transcript_analysis_js"
solution_types: ["real-time-analysis", "agent-automation"]
tags: ["transcripts", "sales-coaching", "jev", "openrouter", "zoom-meetings"]
seo_title: "Analyze Zoom Meeting Transcripts with Jev for Real-Time Coaching"
seo_keywords: ["zoom transcript sales coaching", "jev real-time coaching", "zoom rtms sales analysis"]
license_required: true
license_note: "Requires a Zoom Developer Pack with RTMS transcript access and an OpenRouter account with access to the Jev model."
stack: "Node.js · Zoom Apps SDK · RTMS · OpenRouter Decisions API · Jev · WebSocket"
---

Build a real-time sales coaching app that receives **Zoom Realtime Media Streams (RTMS)** transcripts, sends bounded conversation context to [Jev](https://openrouter.ai/typesafe/jev-1.13), and shows typed coaching decisions in a Zoom App. The app can identify buyer intent, objections, deal stage, purchase signals, deal risk, and a recommended next action while the meeting is active.

Jev returns decisions and confidence values rather than arbitrary response text. The Blueprint uses those decisions to rank reviewed coaching choices, so the seller can choose how to respond. The reference implementation does not send messages or take external actions automatically.

This is an initial draft based on the [Jev transcript analysis reference implementation](https://github.com/zoom/rtms-samples/tree/main/zoom_apps/jev_transcript_analysis_js). The complete screenshots, demo video, verified manifest, and source-grounded implementation guide will be added before review.

## Features

- Receive live transcript turns from a Zoom Meeting through RTMS.
- Keep bounded conversation history per RTMS stream.
- Send typed decision questions to Jev through the OpenRouter Decisions API.
- Show buyer intent, objection, deal stage, purchase signal, deal risk, and ranked next-action choices in a Zoom App.
- Keep suggested coaching language in application-owned, reviewed text.

## Architecture

The reference implementation receives transcript events through RTMS and keeps session state keyed by `rtms_stream_id`. It sends recent context to Jev through OpenRouter, then broadcasts the normalized decision to the meeting-scoped Zoom App over WebSocket.

```mermaid
flowchart TB
    A[Zoom Meeting] -->|Live transcript via RTMS| B[Node.js RTMS service]
    B -->|Bounded conversation context| C[OpenRouter Decisions API]
    C -->|Typed Jev decisions| B
    B -->|Meeting-scoped decision events| D[Zoom App WebSocket]
    D --> E[Real-time sales coaching UI]
```

## Implementation Guide

This section is a stub for the source-grounded implementation steps. It will cover the Zoom Marketplace configuration, RTMS transcript subscription, OpenRouter and Jev settings, local startup, Zoom App testing, and production considerations.

## App Manifest

The `manifest.json` in this directory is an initial template placeholder. Verify its Zoom Apps SDK capabilities, RTMS event subscriptions, URLs, and scopes against the reference implementation before opening a PR.
