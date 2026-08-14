# Zoom Blueprints

Curated, use-case-driven reference implementations for the
[Zoom developer platform](https://developers.zoom.us). Each Blueprint is a
deployable demonstration of a solution to a real enterprise problem — the
problem it solves, the architecture, a step-by-step implementation guide, and
a Zoom app manifest for one-click setup.

Published at **developers.zoom.us/blueprints** (this repo is the content
source; the site builds from it).

## Using a Blueprint

1. Browse `blueprints/` — each directory is one Blueprint, named by its slug
2. Read its `index.md`: Problem Statement → Architecture → Implementation Guide
3. Clone the linked sample-code repo (`github_repo` in the frontmatter)
4. Use the directory's `manifest.json` to create the Zoom app

## Repo map

| Path | What it is |
|------|-----------|
| `blueprints/<slug>/` | One Blueprint: `index.md`, `architecture.mmd`, `manifest.json` |
| `blueprints/_template/` | Start here for a new Blueprint — copy and fill in |
| `taxonomy.json` | Vocabulary for `products`, `verticals`, `solution_types` |
| `collections/index.json` | Vertical collections shown on the site |
| `scripts/validate.js` | Quality gate — run `npm run validate` |
| `scripts/validate-zoom-manifest.js` | validate manifest — run `npm run validate-zoom-manifest -- your-blueprint` |

## Previewing a draft

Writing a Blueprint? See it rendered exactly as it will ship — without
pushing anything — at
[developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/).
Point it at your local `blueprints/<slug>/` folder; files are read by your
browser and never uploaded. The page also surfaces the frontmatter and MDX
errors that validation and the site build would catch. Details in
[CONTRIBUTING.md](CONTRIBUTING.md#previewing-your-blueprint).

## Previewing a draft

Writing a Blueprint? See it rendered exactly as it will ship — without
pushing anything — at
[developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/).
Point it at your local `blueprints/<slug>/` folder; files are read by your
browser and never uploaded. The page also surfaces the frontmatter and MDX
errors that validation and the site build would catch. Details in
[CONTRIBUTING.md](CONTRIBUTING.md#previewing-your-blueprint).

## Contributing

Currently team-only (Zoom Developer Advocacy). See [CONTRIBUTING.md](CONTRIBUTING.md).

Sample code lives in separate linked repositories, not here — this repo is
content: it describes and guides.
