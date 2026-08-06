---
title: "Human in the loop Workplace Agent"
slug: "human-in-the-loop"        # MUST match this directory's name
description: >-
  A Zoom Workplace agent that turns meeting context into suggested follow-up actions, while keeping a human in control before anything gets executed.
products: ["rtms","zoom-apps","team-chat"]
partners: ["openai"]                    
solution_types: ["real-time-analysis", "agent-automation"]
verticals: ["enterprise"]          # ids from /taxonomy.json → verticals
difficulty: "intermediate"         # beginner | intermediate | advanced
estimated_time: "2-4 hours"        
author: "Donte"
status: "draft"                    # draft | review | published
updated: 2026-08-04                # YYYY-MM-DD, bump on every edit
github_repo: "https://github.com/zoom/human-in-the-loop-workplace-agent-sample"
seo_keywords: ["zoom real-time transcription", "rtms transcript stream", "zoom mcp server"]
---

## Problem Statement

AI agents are only useful when they have the right context and the right guardrails. This sample explores how Zoom meeting, chat, and workflow context can help developers build agentic experiences that observe what happened, recommend next steps, ask for approval, and then take action.

## Architecture

<!-- Open with 1–2 paragraphs explaining the data flow, then the diagram.
     Label every component and connection. -->

```mermaid
graph LR
    A[Zoom Meeting] -->|RTMS stream| B[Your Server]
    B -->|Audio / transcript| C[Processing Service]
    C -->|Structured output| D[Destination System]
```

## Implementation Guide

<!-- Numbered steps a developer (or coding agent) can follow WITHOUT external
     docs. Show real code with imports, configuration, and error handling —
     not isolated snippets. Include API calls, env setup, and deployment. -->

## App Manifest

 See [0-app-manifest/](https://github.com/zoom/human-in-the-loop-workplace-agent-sample/tree/main/0-app-manifest) — it contains app-manifest.json (scopes, chatbot subscription, events, webview, and redirect URIs already configured) plus a short guide to importing it in the Zoom App Marketplace. Replace example.ngrok.app with your tunnel URL, upload, and your app is configured.


