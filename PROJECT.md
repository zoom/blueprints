# Blueprints — Project Status & Open Tasks

> Living doc. Update when you pick up or finish a task (PR welcome).
> Project context: the full spec lives with the site team (`BLUEPRINTS_CONTEXT.md` in the dev-docs repo). Timeline dates in [CONTRIBUTING.md](CONTRIBUTING.md).

**Last updated:** 2026-08-20

## Decisions locked (Aug 19 sync)

- **Blueprint = declarative/prescriptive gold standard, distinct from tutorial.** See [STYLE_GUIDE.md § What a Blueprint Is](STYLE_GUIDE.md#what-a-blueprint-is-and-what-it-isnt) for the litmus test
- **Intro structure locked.** See [STYLE_GUIDE.md § The Intro Block](STYLE_GUIDE.md#the-intro-block-field-by-field) for the required fields and filled example
- **Code = Input/Output/Invariants contracts.** Stack-agnostic format for business logic. Security-critical code (HMAC, JWT, signature verification) stays concrete. See [STYLE_GUIDE.md § Contracts](STYLE_GUIDE.md#contracts-and-agent-first-content)
- **Zoom license prerequisites required.** Every blueprint must state the required Zoom plan/entitlement in "What you'll need" with a link to pricing
- **Platform-agnostic Dockerfile required.** Every sample repo must include a Dockerfile that runs on any cloud (Render, Railway, Fly, AWS, etc.)
- **Demo video required.** Screen recording of the working app (30s-2min). No face, no voice, no editing required. Just show it working. See [STYLE_GUIDE.md § Images and Video](STYLE_GUIDE.md#images-and-video-requirements)
- **Sample code follows Max's OSS standards.** Link to repo, don't duplicate code that will drift

## Decisions locked (Aug 5–10)

- **MVP launch scope: 8–10 blueprints.** Flagship exemplars are `realtime-sales-coach` and `ai-meeting-notetaker`, grounded in [zoom/arlo](https://github.com/zoom/arlo)
- **Four required sections per blueprint:** Features, Architecture, Implementation Guide, App Manifest. Agent skill export is auto-generated
- **Taxonomy is use case + industry vertical, not Zoom product.** Products are tags
- **Live demos are optional for V1.** Shown when a demo URL exists, never a publishing gate
- **Surface Apps are one supported pattern, not the preferred default.** Future blueprints should also cover CRM, dashboard, automation, and agent flows
- **Blueprint images live with the blueprint** (`blueprints/<slug>/images/`), referenced by relative path

## Where we are

- ✅ Content pipeline is end to end: author in this repo → renders on developers.zoom.us at build time, no engineering handoff
- ✅ Repo foundation: template, taxonomy, collections, validation + CI on every PR, contribution docs, this status board
- ✅ **Gold-standard drafts complete:** `realtime-sales-coach` and `ai-meeting-notetaker` use Input/Output/Invariants contracts, ready for final review
- ✅ **STYLE_GUIDE.md + CONTRIBUTING.md overhauled:** New required structure, Zoom license prerequisites, Dockerfile requirements, contracts format, extended PR checklist
- ✅ **Local preview is live:** [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
- 🟡 **Daily 15-min standups (Mon–Thu)** running until delivery
- 🟡 **Target: reviewable PR for each Blueprint by Aug 27**
- 🟡 **Site integration aligned to Sept 20 developer site release**
- 🟡 **Jeremy presenting Blueprints at ship-room meeting**
- 🟡 Branch protection partial: full enforcement blocked until repo goes public (Sep 29)
- ⚠ Gotcha: Zoom's push-time secret scanner matches key-shaped strings. Fake keys must be obvious placeholders (`YOUR_KEY_HERE`)

---

## Blueprint Signup

**Everyone commits to at least 2 blueprints.** Add your name below.

### Conversation Intelligence (RTMS → AI)

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Real-time sales coach | Jen | Done |
| AI meeting notetaker | Jen | Done |
| Real-time compliance advisor in meetings | — | Unclaimed |
| Transcripts → LLM (OpenAI / Claude) | Chun Siong | In progress |
| Transcripts quickstart | Chun Siong | In progress |
| Live sentiment analysis in meetings | Ticorrian | Claimed |

### Conversation → Business Systems

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Transcripts → CRM (Salesforce) | — | Unclaimed |
| Transcripts → MCP server | Chun Siong | In progress |
| Archive to cloud (AWS S3) | Chun Siong | In progress |

### Voice Agents & Real-Time Audio

| Blueprint | Owner | Status |
|-----------|-------|--------|
| OpenAI voice agent in Zoom Meetings | Chun Siong | In progress |
| OpenAI voice agent (Video SDK) | — | Unclaimed |
| Gemini Live voice agent (Video SDK) | — | Unclaimed |

### Healthcare & Telehealth

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Telehealth waiting room | Ekaansh | In progress |
| Clinical notes from telehealth | — | Unclaimed |

### Embed Video

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Video chat app (React/Next.js) | — | Unclaimed |
| Embed meetings into website | — | Unclaimed |

### Media Intelligence & Safety

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Deepfake detection in meetings | Chun Siong | In progress |

### Partners & ISV Integrations

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Partner/ISV integrator (Rivet SDK) | Jeremy | Claimed |

### Agents & Automation

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Meeting follow-up agent with human approval | Donte | In progress |

---

## Open tasks

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Build partner-focused / ISV-integrator Blueprint using existing Rivet SDK code | Jeremy | This week |
| 2 | Coordinate Blueprints into new dev site with Brendan Abajelo + stand up Amplitude user-journey tracking | Michael | In progress |
| 3 | Confirm Blueprint topics in potluck channel; use GitHub traffic + Amplitude data to prioritize which RTMS sample apps become Blueprints | Team | Ongoing |
| 4 | Resolve developer access-to-test-licensing friction (Developer Pack SKU for test accounts) | Jen / Team | Separate workstream |
| 5 | Clarify RTMS manifest required-scopes | Jen | This week |
| 6 | Add platform-agnostic Dockerfile to Arlo repo | Donte | This week |
| 7 | Manifest verification on PR: validate against Zoom app schema, verify create-app roundtrip | Donte | In progress |
| 8 | Site rendering polish: partner icon fallback, code block contrast, Mermaid text clipping | Michael | Pre-launch |
| 9 | Agent-skill generation for accepted blueprints: scope LLM/AI-gateway approach | Chun Siong + Ekaansh | Scoping |
| 10 | Review and merge gold-standard blueprints (Sales Coach, AI Meeting Notetaker) | Team | This week |

## Completed tasks (Aug 10–20)

- ✅ Lock editorial review & content standards → [STYLE_GUIDE.md](STYLE_GUIDE.md)
- ✅ Convert gold-standard blueprints to contracts format
- ✅ Overhaul STYLE_GUIDE.md + CONTRIBUTING.md
- ✅ Add credential-safety rule to CONTRIBUTING.md
- ✅ Image convention (repo half): relative paths, `hero_image`, validation errors on broken refs
- ✅ Update template with Dockerfile requirement note

## Later (scheduled, don't start yet)

- **Integration weeks (Sep 15–26):** `build-catalog.js`, `generate-agent-skills.js`, Blueprints entry point in site nav
- Credential scan recursion if blueprints grow subdirectories
- Repo flips **public at soft launch (Sep 29)**
- Exploratory: richer `ArchDiagram` component for complex flows beyond Mermaid
