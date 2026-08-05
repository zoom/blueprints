---
title: "Real-Time Meeting Transcription"
slug: "real-time-transcription"
description: >-
  Stream live meeting audio with RTMS and produce running transcripts your
  application can act on the moment words are spoken.
products: ["rtms", "ai-services-scribe"]
verticals: ["enterprise"]
solution_types: ["transcription-summarization", "real-time-analysis"]
difficulty: "intermediate"
estimated_time: "2-4 hours"
author: "Michael Harrington"
status: "draft"
updated: 2026-08-04
github_repo: "https://github.com/zoom/rtms-samples"
seo_keywords: ["zoom real-time transcription", "rtms transcript stream", "zoom meeting live transcript api"]
---

## Problem Statement

Enterprises record meetings and wait — for the recording to process, for the
transcript to land, for someone to read it. The value of a conversation decays
by the hour. <!-- Expand: real use-case grounding, business outcome framing. -->

## Architecture

```mermaid
graph LR
    A[Zoom Meeting] -->|RTMS websocket| B[Ingest Server]
    B -->|Audio frames| C[Transcription Engine]
    C -->|Running transcript| D[Your Application]
```

<!-- Expand: component-by-component walkthrough. -->

## Implementation Guide

<!-- Expand: numbered steps from rtms-samples base. -->

1. Create a Server-to-Server OAuth app and enable RTMS scopes.

## App Manifest

The `manifest.json` in this directory configures the required RTMS scopes and
event subscriptions for one-click app creation. <!-- Expand once manifest
schema is confirmed. -->
