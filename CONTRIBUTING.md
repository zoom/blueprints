# Contributing a Blueprint

V1 is team-only (Developer Advocacy). Partner contributions open in V2.

## Workflow

1. Copy `blueprints/_template/` to `blueprints/<your-slug>/` (lowercase, hyphenated)
2. Fill in every required frontmatter field, the outcome-focused intro prose
   (before any heading), and the required **Architecture** and
   **Implementation Guide** sections. Add **App Manifest** when the selected
   product uses a Zoom App manifest.
3. Keep sample code in its own repo; link it via `github_repo`
4. Validate locally: `npm install && npm run validate blueprints/<your-slug>`
5. Open a PR. CI runs the same validation; peer review per the team schedule
6. On approval, set `status: review` → editorial pass → `status: published`

## Content rules

- **Markdown only.** GitHub-flavored markdown; Mermaid fences for diagrams.
  No JSX/MDX components.
- **No inline styles on HTML elements.** The site uses MDX which causes
  hydration errors with `style` attributes. Use `width` and `height` attributes
  for sizing. Avoid `&nbsp;` between elements (causes nested `<p>` tags).
- **Outcomes first.** Open with intro prose (no heading) that leads with the
  business outcomes the customer gets, grounded in real use cases, not
  hypotheticals. Problems are context, not the framing.
- **Teach the build, not the clone.** Implementation guides explain how the
  app is built and how to rebuild one like it, with real code: imports,
  config, error handling. Setup/quickstart is a short section at the end.
- **Grounded in the repo.** Every file path, endpoint, env var, and feature
  claim must match the linked sample code. No invented details.
- **Images stay with the blueprint.** Put image files in your blueprint's
  `images/` folder and reference them with **relative** paths: in the body as
  `![alt](images/foo.png)`, or as the header via the `hero_image:` frontmatter
  field. The site serves them at `/img/blueprints/<slug>/…`; don't hand-write
  that path (it 404s in GitHub preview). No `hero_image`? The site generates a
  thumbnail from your metadata. Validation errors on a ref with no file behind it.
- **No Agent Skill Export section.** It is auto-generated from your content.
- **No credentials anywhere.** CI scans for keys and secrets.

## Previewing your blueprint

The site hosts a preview page that renders your local draft exactly as it
will ship. Nothing is pushed or uploaded; your files are read locally in
the browser:

1. Open [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
2. Click **Choose blueprint folder…** and select your
   `blueprints/<your-slug>/` directory
3. Edit `index.md` locally and save. The preview re-renders automatically
   (Chrome/Edge; in other browsers, re-select the folder to refresh)

The panel above the preview shows the same frontmatter errors and warnings
that CI validation and the site build would report, plus any MDX syntax
errors (e.g. a stray `{` or `<` that GitHub tolerates but the
site's MDX compiler rejects).

## Adding vocabulary

New product, vertical, solution type, or partner? Add an `{ "id", "label" }` entry to
`taxonomy.json` in your PR. No code changes needed.

## Timeline (V1)

- Aug 18: outlines (intro + architecture sketch)
- Aug 25-Sep 5: drafts, peer review pairs
- Sep 8-12: final submissions
- Sep 29: soft launch
