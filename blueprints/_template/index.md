---
# ── Required — validation fails without these ───────────────────────────────
title: "Outcome-oriented title — what the reader ends up with"
slug: "your-blueprint-slug"        # MUST match this directory's name
description: >-
  One to two sentences: capture X with [product], do Y, deliver [outcome].
  Shown on cards and used for SEO — write how a customer would search.
products: ["rtms"]                 # ids from /taxonomy.json → products
verticals: ["enterprise"]          # enterprise | agents | apps
author: "Your Name"
status: "draft"                    # draft | review | published
updated: 2026-08-04                # YYYY-MM-DD, bump on every edit

# ── Strongly encouraged — the site hides blueprints without a repo ──────────
github_repo: ""                    # sample code lives in its own repo, linked here
                                   # REQUIRED: repo must include a platform-agnostic Dockerfile
                                   # (see STYLE_GUIDE.md)

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
# license_note: "Requires Zoom Developer Pack credits for RTMS."
# stack: "Node · TypeScript · Postgres"
# deploy:                                             # Vercel preferred for Next.js/React
#   - { label: "Deploy to Vercel", url: "https://vercel.com/new/clone?repository-url=..." }
#   - { label: "Deploy to Render", url: "https://render.com/deploy?repo=..." }
---

<!-- HTML comments like these are invisible on GitHub and on the site.
     Delete them as you fill in each section.

     Body rules:
     - GitHub-flavored markdown ONLY. The only components allowed are
       <YouTube id="..." /> and <Image src="images/..." alt="..." />.
     - No inline style attributes on HTML elements (causes hydration errors).
       Use width/height attributes for sizing. Avoid &nbsp; between elements.
     - Diagrams are ```mermaid fences (inline in index.md is the single source of truth).
     - Long code blocks may be wrapped in <details> collapsibles.
     - Open with intro PROSE before any heading — CI validates this.
     - Images live in this folder's images/ subdir; reference them with a
       RELATIVE path — ![Coaching panel](images/coaching-panel.png). The site
       rewrites it to /img/blueprints/<slug>/…; never hand-write that /img path
       (it 404s in GitHub preview). Validation errors on a ref with no file.
     - The H2 sections below are REQUIRED. CI validates Architecture,
       Implementation Guide, and App Manifest (for Zoom Apps). Features is
       an H2 heading (## Features), not a bold label.
     - Acceptance criteria use plain bullets (- item), not task-list
       checkboxes (- [ ]).
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
     Label every component and connection. Keep `flowchart TB` and edge labels
     of about four words so the diagram fits the 790px content column. -->

```mermaid
flowchart TB
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

<!-- Optional sections — add after the required sections if you have them:
     ## Demo | ## Deployment Guide | ## Video Walkthrough
     ## Related Blueprints | ## Customer Stories -->
