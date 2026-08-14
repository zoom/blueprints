# Zoom Blueprints

Curated, use-case-driven reference implementations for the [Zoom developer platform](https://developers.zoom.us). Each Blueprint is a deployable demonstration of a solution to a real enterprise problem: the outcome it delivers, the architecture, a step-by-step implementation guide, and a Zoom app manifest for one-click setup.

Published at **developers.zoom.us/blueprints** (this repo is the content source; the site builds from it).

## What is a Blueprint?

A Blueprint is **declarative, opinionated, and prescriptive**. It's a gold standard for recreating a system, closer to a CloudFormation template than a step-by-step tutorial.

| Tutorial | Blueprint |
|----------|-----------|
| "Go here, click this button" | "Here are the APIs and patterns; here's the path we recommend" |
| Sequential walkthrough | Declarative, prescriptive architecture |
| Clone and run | Understand and adapt |

**Litmus test:** If you removed all the prose and left only the architecture diagram, contracts, and manifest, could an experienced developer (or an LLM agent) recreate the system? If yes, it's a Blueprint.

## Gold standard examples

- [Real-Time Sales Coach](blueprints/realtime-sales-coach/) - Stream transcripts, extract qualification signals, surface coaching cues in-meeting
- [AI Meeting Notetaker](blueprints/ai-meeting-notetaker/) - Generate live summaries and action items from meeting transcripts

## Using a Blueprint

1. Browse `blueprints/` or visit [developers.zoom.us/blueprints](https://developers.zoom.us/blueprints)
2. Read the Blueprint: Outcome intro, Architecture, Implementation Guide, App Manifest
3. Clone the linked sample-code repo (`github_repo` in the frontmatter)
4. Use the directory's `manifest.json` to create the Zoom app
5. Follow the Implementation Guide to understand and adapt the code

## Repo structure

| Path | What it is |
|------|-----------|
| `blueprints/<slug>/` | One Blueprint: `index.md`, `manifest.json`, `images/` |
| `blueprints/_template/` | Start here for a new Blueprint |
| `taxonomy.json` | Vocabulary for `products`, `verticals`, `solution_types`, `partners` |
| `collections/index.json` | Vertical collections shown on the site |
| `scripts/validate.js` | Quality gate — run `npm run validate` |
| `scripts/validate-zoom-manifest.js` | validate manifest — run `npm run validate-zoom-manifest -- your-blueprint` |
| `STYLE_GUIDE.md` | Content standards, tone, required sections |
| `CONTRIBUTING.md` | Step-by-step contribution workflow |
| `PROJECT.md` | Current status, open tasks, topic claims |

## Previewing a draft

Writing a Blueprint? See it rendered exactly as it will ship without pushing anything:

1. Open [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
2. Drag your `blueprints/<slug>/` folder onto the page
3. Edit `index.md` locally and save. The preview re-renders automatically.

The preview surfaces frontmatter errors, MDX syntax issues, and missing files that validation would catch.

## Contributing

Currently team-only (Zoom Developer Advocacy). Partner contributions planned for V2.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [STYLE_GUIDE.md](STYLE_GUIDE.md) for content standards.

Sample code lives in separate linked repositories. This repo is content: it describes and guides.

## Quick links

- [STYLE_GUIDE.md](STYLE_GUIDE.md) - How to write a Blueprint
- [CONTRIBUTING.md](CONTRIBUTING.md) - Step-by-step workflow
- [PROJECT.md](PROJECT.md) - Status, open tasks, topic claims
- [Preview tool](https://developers.zoom.us/blueprints/preview/) - Render your draft locally
