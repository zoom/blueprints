# Blueprints — Project Status & Open Tasks

> Living doc. Update when you pick up or finish a task (PR welcome).
> Project context: the full spec lives with the site team (`BLUEPRINTS_CONTEXT.md` in the dev-docs repo). Timeline dates in [CONTRIBUTING.md](CONTRIBUTING.md).

**Last updated:** 2026-08-05

## Where we are

- ✅ Repo scaffolded: template, taxonomy, collections, validation (24 tests), CI on every PR
- ✅ Exemplar swapped: **`realtime-sales-coach`** (grounded in [zoom/arlo](https://github.com/zoom/arlo)) is the flagship; `real-time-transcription` skeleton kept for now
- ✅ Partners vocabulary + `deploy` shape validation
- ✅ Site fetch integration (pulled forward from Sep): dev-docs pulls this repo at build time behind `BLUEPRINTS_SOURCE=repo`, maps the schema, renders Mermaid — staging can demo real content with `BLUEPRINTS_SHOW_DRAFTS=1`
- 🔜 Team outlines due **Aug 18**; drafts Aug 25–Sep 5

## Handoff: write the `realtime-sales-coach` blueprint (due Aug 15)

**Owner:** _unassigned — claim by putting your name here_

The skeleton at [`blueprints/realtime-sales-coach/`](blueprints/realtime-sales-coach/) validates clean and has all four required sections stubbed with `<!-- Expand -->` notes. Your job is the content, not the structure.

1. Read the skeleton's `index.md` — each stub says what goes there
2. Ground everything in the real app: [arlo architecture doc](https://github.com/zoom/arlo/blob/main/docs/ARCHITECTURE.md), [Sales demo video](https://youtu.be/LKpZAe5_A8o), arlo README quick start
3. Style/tone reference: `blueprints/_template/index.md` comments + [CONTRIBUTING.md](CONTRIBUTING.md) content rules (customer-perspective problem statement, followable-without-external-docs guide)
4. Validate as you go: `npm run validate blueprints/realtime-sales-coach`
5. PR when the four sections are real; peer review per team schedule

Definition of done: a developer who has never seen arlo can follow the Implementation Guide end-to-end; problem statement reads like a sales leader's problem, not a feature list.

## Open tasks

| # | Task | Owner | When |
|---|------|-------|------|
| 1 | Write `realtime-sales-coach` content (handoff above) | _unassigned_ | Aug 15 |
| 2 | Branch protection on `main` (require `validate` check + 1 review) + add team collaborators | Michael | now (~5 min, GitHub UI) |
| 3 | Align all manifests to the real Zoom app schema (arlo-style `display_information`/`oauth_information`/`features`) — template + `real-time-transcription` still use the old placeholder shape — and add manifest field-level validation | — | this week (~1 hr) |
| 4 | Editorial review skill(s): codify problem-statement + implementation-guide standards for reviewers | Michael + editorial | before drafts (Aug 25) |
| 5 | Update the catalog table in the project spec (exemplar row still says real-time-transcription) | Michael | editorial call |

## Later (scheduled, don't start yet)

- **Integration weeks (Sep 15–26):** `build-catalog.js`, `generate-agent-skills.js` (auto skill export), retire the sample blueprints in the site repo (= flip `BLUEPRINTS_SOURCE` default to `repo`), **Blueprints entry point in the developers.zoom.us site nav** (header dropdown). ~~Site fetch script~~ ~~Mermaid renderer~~ — done early, see above
- Verify manifests against the live **Marketplace manifests API** (create-app roundtrip, not just schema shape) — needs API access; unblocks the "one-click install" promise
- Decide fate of the `real-time-transcription` skeleton (keep as second blueprint vs fold into catalog work)
- Validate `collections/index.json` slugs against real blueprint dirs (typos currently 404 silently at site build)
- Credential scan is top-level-files only — recurse if blueprints grow subdirectories
- Repo flips **public at soft launch (Sep 29)**
