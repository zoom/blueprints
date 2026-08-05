# Contributing a Blueprint

V1 is team-only (Developer Advocacy). Partner contributions open in V2.

## Workflow

1. Copy `blueprints/_template/` to `blueprints/<your-slug>/` (lowercase, hyphenated)
2. Fill in every required frontmatter field and the four required sections:
   **Problem Statement**, **Architecture**, **Implementation Guide**, **App Manifest**
3. Keep sample code in its own repo; link it via `github_repo`
4. Validate locally: `npm install && npm run validate blueprints/<your-slug>`
5. Open a PR — CI runs the same validation; peer review per the team schedule
6. On approval, set `status: review` → editorial pass → `status: published`

## Content rules

- **Markdown only.** GitHub-flavored markdown; Mermaid fences for diagrams.
  No JSX/MDX components.
- **Customer-perspective framing.** Problem statements describe business
  outcomes, grounded in real use cases — no hypotheticals.
- **Followable without external docs.** Implementation guides include real
  code with imports, config, and error handling.
- **No Agent Skill Export section.** It is auto-generated from your content.
- **No credentials anywhere.** CI scans for keys and secrets.

## Adding vocabulary

New product, vertical, solution type, or partner? Add an `{ "id", "label" }` entry to
`taxonomy.json` in your PR — no code changes needed.

## Timeline (V1)

- Aug 18 — outlines (problem statement + architecture sketch)
- Aug 25–Sep 5 — drafts, peer review pairs
- Sep 8–12 — final submissions
- Sep 29 — soft launch
