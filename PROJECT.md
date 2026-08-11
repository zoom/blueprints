# Blueprints — Project Status & Open Tasks

> Living doc. Update when you pick up or finish a task (PR welcome).
> Project context: the full spec lives with the site team (`BLUEPRINTS_CONTEXT.md` in the dev-docs repo). Timeline dates in [CONTRIBUTING.md](CONTRIBUTING.md).

**Last updated:** 2026-08-10

## Decisions locked (Aug 5–10)

- **MVP launch scope: 8–10 blueprints.** Flagship exemplar is the sales assistant grounded in [zoom/arlo](https://github.com/zoom/arlo)
- **Four required sections per blueprint:** Problem Statement, Architecture Diagram, Implementation Guide, App Manifest. Agent skill export is required but auto-generated
- **Taxonomy is use case + industry vertical, not Zoom product.** Products are tags
- **Live demos are optional for V1** — shown when a demo URL exists, never a publishing gate
- **Surface Apps are one supported pattern, not the preferred default.** Future blueprints should also cover CRM, dashboard, automation, and agent flows
- **Blueprint images live with the blueprint** (`blueprints/<slug>/images/`), referenced by relative path. `hero_image` frontmatter sets the header; the site auto-generates a metadata thumbnail when it's absent. The site serves them at `/img/blueprints/<slug>/…` via a build-time path rewrite

## Where we are

- ✅ Content pipeline is end to end: author in this repo → renders on developers.zoom.us at build time, no engineering handoff. This repo is the site's ONLY blueprint source; drafts render on the site until launch
- ✅ Repo foundation: template, taxonomy, collections, validation + CI on every PR, contribution docs, this status board
- ✅ **Two gold-standard drafts ready for team review:** `realtime-sales-coach` (`jen/sales-coach-draft`) and `ai-meeting-notetaker` (`jen/ai-meeting-notetaker`) — both expand beyond the four minimum sections and are setting the authoring bar
- ✅ **Local preview is live:** render your local draft folder exactly as it will appear on the site, before opening a PR → [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/) ([how-to](CONTRIBUTING.md#previewing-your-blueprint))
- ✅ [STYLE_GUIDE.md](STYLE_GUIDE.md) on `main`; PR template checklist expanded so review standards are embedded in the workflow
- 🟡 Branch protection partial: merges now require a PR. Full enforcement (required `validate` check + review) is blocked until the repo goes public (Sep 29) or the GitHub plan is upgraded
- ⚠ Gotcha: Zoom's push-time secret scanner matches key-shaped strings even in docs and test fixtures. Fake keys in examples must be obvious placeholders (`YOUR_KEY_HERE`), never realistic-looking values
- 🔜 Team outlines due **Aug 18**; drafts Aug 25–Sep 5

## Topic claims

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Real-Time Sales Coach | Jen | Draft in review (`jen/sales-coach-draft`) |
| AI Meeting Notetaker | Jen | Draft in review (`jen/ai-meeting-notetaker`) |
| Human-in-the-Loop | Donte | In progress (`donte/human-in-loop-blueprint`) |
| Telehealth Waiting Room | Ekaansh Arora | Claimed |
| Live Sentiment | Ticorrian Heard | Claimed |

Claim a topic by adding a row here (PR) or posting in #Blueprinters.

## Open tasks

| # | Task | Owner | When |
|---|------|-------|------|
| 1 | Editorial review standards: what qualifies as a blueprint, the quality bar, review criteria — final alignment before publishing anything | Michael + editorial | before drafts (Aug 25) |
| 2 | Align all manifests to the real Zoom app schema (arlo-style `display_information`/`oauth_information`/`features`) + add field-level validation; then verify against the live Marketplace manifests API (create-app roundtrip) — validation is not yet proven end to end | — | this week (~1 hr for schema; API verify needs access) |
| 3 | Image convention: repo half done on `blueprint-image-convention` (relative paths, `hero_image`, validation errors on broken refs, binary-safe secret scan) — **PR open, needs review/merge**. Dev-docs half: implement the `/img/blueprints/<slug>/` path rewrite + metadata fallback-thumbnail generator (contract in [spec](docs/superpowers/specs/2026-08-10-blueprint-image-convention-design.md)) | Michael + site team | this week |
| 4 | Site rendering polish (dev-docs side): Mermaid text clipping, partner icon 404s, code block readability | Michael | pre-launch |
| 5 | Decide: similar use case across different products — one blueprint or separate? Raised in channel, unresolved | Michael + editorial | editorial call |
| 6 | Add the fake-credentials-must-be-placeholders rule to CONTRIBUTING (see gotcha above) | — | ~5 min |
| 7 | Update the catalog table in the project spec (exemplar row still says real-time-transcription) | Michael | editorial call |

## Later (scheduled, don't start yet)

- **Integration weeks (Sep 15–26):** `build-catalog.js`, `generate-agent-skills.js` (auto skill export), **Blueprints entry point in the developers.zoom.us site nav** (header dropdown)
- Decide fate of the `real-time-transcription` skeleton (keep as second blueprint vs fold into catalog work)
- Validate `collections/index.json` slugs against real blueprint dirs (typos currently 404 silently at site build)
- Credential scan is top-level-files only — recurse if blueprints grow subdirectories
- Repo flips **public at soft launch (Sep 29)** — also unlocks full branch protection (see above)
- 💡 Exploratory (no commitment): richer `ArchDiagram` component for complex flows beyond what Mermaid handles cleanly
