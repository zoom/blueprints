---
# ── Required — validation fails without these ───────────────────────────────
title: "Outcome-oriented title — what the reader ends up with"
slug: "your-blueprint-slug"        # MUST match this directory's name
description: >-
  One to two sentences: capture X with [product], do Y, deliver [outcome].
  Shown on cards and used for SEO — write how a customer would search.
products: ["rtms"]                 # ids from /taxonomy.json → products
verticals: ["enterprise"]          # ids from /taxonomy.json → verticals
difficulty: "intermediate"         # beginner | intermediate | advanced
estimated_time: "2-4 hours"        # honest wall-clock estimate to implement
author: "Your Name"
status: "draft"                    # draft | review | published
updated: 2026-08-04                # YYYY-MM-DD, bump on every edit

# ── Strongly encouraged — the site hides blueprints without a repo ──────────
github_repo: ""                    # sample code lives in its own repo, linked here
                                   # REQUIRED: repo must include a platform-agnostic Dockerfile
                                   # (see STYLE_GUIDE.md § Sample Code and Repository Requirements)

# ── Optional — delete what you don't use ────────────────────────────────────
# hero_image: images/hero.png       # header + catalog thumbnail; relative to this
                                    # folder. Omit and the site auto-generates one
                                    # from your metadata (title, description, tags)
# solution_types: ["transcription-summarization"]   # ids from /taxonomy.json
# tags: ["real-time", "hipaa"]                      # free-form
# seo_title: "What someone would Google to find this"
# seo_keywords: ["zoom something integration", "two to four phrases"]
# partners: ["anthropic"]                          # ids from /taxonomy.json → partners
# demo_url: ""
# license_required: false
# license_note: "Requires RTMS add-on license"
# stack: "Node · TypeScript · Postgres"
# deploy:
#   - { label: "Vercel", url: "" }
---

<!-- HTML comments like these are invisible on GitHub and on the site.
     Delete them as you fill in each section.

     Body rules:
     - GitHub-flavored markdown ONLY. No JSX/MDX components.
     - No inline style attributes on HTML elements (causes hydration errors).
       Use width/height attributes for sizing. Avoid &nbsp; between elements.
     - Diagrams are ```mermaid fences (keep architecture.mmd in sync).
     - Long code blocks may be wrapped in <details> collapsibles.
     - Open with intro PROSE before any heading — CI validates this.
     - Images live in this folder's images/ subdir; reference them with a
       RELATIVE path — ![Coaching panel](images/coaching-panel.png). The site
       rewrites it to /img/blueprints/<slug>/…; never hand-write that /img path
       (it 404s in GitHub preview). Validation errors on a ref with no file.
     - The four H2 sections below (Features, Architecture, Implementation Guide,
       App Manifest) are REQUIRED and validated by CI.
     - Do NOT write an Agent Skill Export section — it is auto-generated
       from this content by the build pipeline. -->

<!-- INTRO (no heading) — start with outcomes, not a problem statement.
     2–4 paragraphs of continuous prose from the customer's perspective:
     what the reader ends up with and what it does for their business.
     You may touch on the problem it solves, but lead with the outcome.
     Ground it in a real use-case pattern — no hypotheticals. Bold Zoom
     products on first mention. -->

## Features

<!-- Succinct bullet list of what the finished application does. Follow with
     screenshots (width attribute, no inline styles) and a demo video link
     if you have one. Every feature listed must exist in the sample code or
     be built in the Implementation Guide — no aspirational features. -->

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

<!-- Teach how the application is built, not how to clone it. Walk through
     the real code — imports, configuration, error handling — so a developer
     (or coding agent) could rebuild this class of app WITHOUT external docs.
     Every file path and identifier must exist in the linked repo. End with a
     short "Run the Sample" section (deploy buttons, condensed setup). -->

## App Manifest

<!-- Explain what the manifest.json in this directory configures (scopes,
     event subscriptions, redirect URLs) and how to use it for one-click app
     creation via the Zoom Marketplace manifests API. -->

<!-- Optional sections — add after the required four if you have them:
     ## Demo | ## Deployment Guide | ## Video Walkthrough
     ## Related Blueprints | ## Customer Stories -->
