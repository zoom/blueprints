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

- ✅ Content pipeline is end to end: author in this repo → renders on developers.zoom.us at build time, no engineering handoff. This repo is the site's ONLY blueprint source; drafts render on the site until launch. Repo is still private — site builds need a GitHub access token until the Sep 29 public flip
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

**Claims due Aug 11 (EOD):** commit to a title in the #Blueprinters thread so the team can give feedback. Still needed from: Donte, Pranjal, Rehema, Chun Siong — Gianni optional. Claim by adding a row here (PR) or posting in #Blueprinters.

## Open tasks

| # | Task | Owner | When |
|---|------|-------|------|
| 1 | **All:** comment on [PR #1](https://github.com/zoom/blueprints/pull/1) to solidify the content structure | everyone | **Tue Aug 11 EOD** |
| 2 | Lock editorial review & content skills (what qualifies, quality bar, review criteria); explore auto-review on PR submit via GitHub Actions | Jen + Ekaansh | **Aug 15** |
| 3 | Manifest verification on PR: align manifests to the real Zoom app schema (arlo-style `display_information`/`oauth_information`/`features`), add field-level validation so only valid manifests merge; then verify against the live Marketplace manifests API (create-app roundtrip) | Donte | this week |
| 4 | Image convention: repo half done — **[PR #4](https://github.com/zoom/blueprints/pull/4) open, needs review/merge** (relative paths, `hero_image`, validation errors on broken refs, binary-safe secret scan). Dev-docs half: implement the `/img/blueprints/<slug>/` path rewrite + metadata fallback-thumbnail generator (contract in [spec](docs/superpowers/specs/2026-08-10-blueprint-image-convention-design.md)) | Michael + site team | this week |
| 5 | Decide: similar use case across different products — one blueprint or separate? Michael's vote: separate (e.g. "Track sentiment in Zoom Meetings" ≠ "Add sentiment analysis to Video SDK sessions") | Jen | this week |
| 6 | Site rendering polish (dev-docs side): populate `/img/blueprints/_assets/partners` and add a fallback icon; fix code block contrast (light gray text on light gray background is unreadable); Mermaid text clipping | Michael | pre-launch |
| 7 | dev-docs must fail gracefully when pulled content doesn't match the schema — verify the `gen-blueprints` script handles invalid content | — | pre-launch |
| 8 | Agent-skill generation for accepted blueprints: script that runs on merged PR? Open question: does generating one require an LLM/AI-gateway connection? Scope an approach | Chun Siong + Ekaansh | scoping now |
| 9 | Add the fake-credentials-must-be-placeholders rule to CONTRIBUTING (see gotcha above) | — | ~5 min |
| 10 | Update the catalog table in the project spec (exemplar row still says real-time-transcription) | Michael | editorial call |

## Later (scheduled, don't start yet)

- **Integration weeks (Sep 15–26):** `build-catalog.js`, `generate-agent-skills.js` build (scoping pulled forward — task 8 above), **Blueprints entry point in the developers.zoom.us site nav** (header dropdown)
- Decide fate of the `real-time-transcription` skeleton (keep as second blueprint vs fold into catalog work)
- Validate `collections/index.json` slugs against real blueprint dirs (typos currently 404 silently at site build)
- Credential scan is top-level-files only — recurse if blueprints grow subdirectories
- Repo flips **public at soft launch (Sep 29)** — also unlocks full branch protection (see above)
- 💡 Exploratory (no commitment): richer `ArchDiagram` component for complex flows beyond what Mermaid handles cleanly
