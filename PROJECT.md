# Blueprints — Project Status & Open Tasks

> Living doc. Update when you pick up or finish a task (PR welcome).
> Project context: the full spec lives with the site team (`BLUEPRINTS_CONTEXT.md` in the dev-docs repo). Timeline dates in [CONTRIBUTING.md](CONTRIBUTING.md).

**Last updated:** 2026-08-20

## Decisions locked (Aug 19 sync)

- **Intro structure locked.** See [STYLE_GUIDE.md § The Intro Block](STYLE_GUIDE.md#the-intro-block-field-by-field) for the required fields and filled example
- **Code = Input/Output/Invariants contracts.** Stack-agnostic format for business logic. Security-critical code (HMAC, JWT, signature verification) stays concrete. See [STYLE_GUIDE.md § Contracts](STYLE_GUIDE.md#contracts-and-agent-first-content)
- **Zoom license prerequisites required.** Every blueprint must state the required Zoom plan/entitlement in "What you'll need" with a link to pricing. See [STYLE_GUIDE.md § Zoom License Prerequisites](STYLE_GUIDE.md#what-youll-need-zoom-license-prerequisites)
- **Platform-agnostic Dockerfile required.** Every sample repo must include a Dockerfile that runs on any cloud (Render, Railway, Fly, AWS, etc.) — not locked to one vendor
- **Demo GIFs: optional but quality-gated.** If present, must be short (~1 min), unnarrated, and focused on the end result. No talking-head walkthroughs
- **OSS maturity standards.** Link to Max Mansfield's internal doc for repo health (README, LICENSE, CONTRIBUTING, CI, etc.)

## Decisions locked (Aug 5–10)

- **MVP launch scope: 8–10 blueprints.** Flagship exemplar is the sales assistant grounded in [zoom/arlo](https://github.com/zoom/arlo)
- **Four required sections per blueprint:** Features, Architecture, Implementation Guide, App Manifest. Agent skill export is auto-generated
- **Taxonomy is use case + industry vertical, not Zoom product.** Products are tags
- **Live demos are optional for V1** — shown when a demo URL exists, never a publishing gate
- **Surface Apps are one supported pattern, not the preferred default.** Future blueprints should also cover CRM, dashboard, automation, and agent flows
- **Blueprint images live with the blueprint** (`blueprints/<slug>/images/`), referenced by relative path. `hero_image` frontmatter sets the header; the site auto-generates a metadata thumbnail when it's absent

## Where we are

- ✅ Content pipeline is end to end: author in this repo → renders on developers.zoom.us at build time, no engineering handoff
- ✅ Repo foundation: template, taxonomy, collections, validation + CI on every PR, contribution docs, this status board
- ✅ **Gold-standard drafts converted to contracts format:** `realtime-sales-coach` and `ai-meeting-notetaker` now use Input/Output/Invariants contracts for business logic, concrete code for security-critical sections
- ✅ **STYLE_GUIDE.md overhauled:** New required structure including intro field-by-field, Zoom license prerequisites, Dockerfile requirements, contracts format, extended PR checklist, annotated gold standard examples
- ✅ **CONTRIBUTING.md made procedural:** Now focuses on mechanics (folder setup, frontmatter reference, validation, PR workflow) and links to STYLE_GUIDE for content rules
- ✅ **Local preview is live:** render your local draft folder exactly as it will appear on the site → [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
- 🟡 Branch protection partial: merges now require a PR. Full enforcement blocked until repo goes public (Sep 29)
- ⚠ Gotcha: Zoom's push-time secret scanner matches key-shaped strings even in docs. Fake keys must be obvious placeholders (`YOUR_KEY_HERE`)
- 🔜 Team drafts due **Aug 25–Sep 5**

## Topic claims

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Real-Time Sales Coach | Jen | Contracts conversion complete, ready for final review |
| AI Meeting Notetaker | Jen | Contracts conversion complete, ready for final review |
| Human-in-the-Loop | Donte | In progress (`donte/human-in-loop-blueprint`) |
| Telehealth Waiting Room | Ekaansh Arora | In progress |
| Live Sentiment | Ticorrian Heard | Claimed |

## Open tasks

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Add platform-agnostic Dockerfile to Arlo repo | Donte | This week |
| 2 | Add platform-agnostic Dockerfile to Meeting Notetaker sample repo | — | Needs owner |
| 3 | Update template with Dockerfile requirements and example | Jen | This week |
| 4 | Manifest verification on PR: validate against Zoom app schema, verify create-app roundtrip | Donte | In progress |
| 5 | Site rendering polish: partner icon fallback, code block contrast, Mermaid text clipping | Michael | Pre-launch |
| 6 | dev-docs graceful failure when pulled content doesn't match schema | — | Pre-launch |
| 7 | Agent-skill generation for accepted blueprints: scope LLM/AI-gateway approach | Chun Siong + Ekaansh | Scoping |
| 8 | Validate `collections/index.json` slugs against real blueprint dirs (typos 404 silently) | — | Pre-launch |
| 9 | Review and merge gold-standard blueprints (Sales Coach, AI Meeting Notetaker) | Team | This week |

## Completed tasks (Aug 10–20)

- ✅ Lock editorial review & content standards → [STYLE_GUIDE.md](STYLE_GUIDE.md)
- ✅ Convert gold-standard blueprints to contracts format
- ✅ Add credential-safety rule to CONTRIBUTING.md
- ✅ Image convention (repo half): relative paths, `hero_image`, validation errors on broken refs

## Later (scheduled, don't start yet)

- **Integration weeks (Sep 15–26):** `build-catalog.js`, `generate-agent-skills.js`, **Blueprints entry point in site nav** (header dropdown)
- Credential scan recursion if blueprints grow subdirectories
- Repo flips **public at soft launch (Sep 29)** — also unlocks full branch protection
- Exploratory: richer `ArchDiagram` component for complex flows beyond Mermaid
