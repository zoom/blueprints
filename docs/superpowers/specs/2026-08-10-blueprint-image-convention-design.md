# Blueprint image convention — design

**Date:** 2026-08-10
**Status:** approved, pending implementation plan

## Problem

Blueprints need images: one header/hero per blueprint and inline images in the
body. The remote dev-docs repo pulls this repo at build time and renders the
markdown, so image paths written by authors must resolve to real URLs on the
published site. There is no convention yet — the first attempt used
`blueprints/realtime-sales-coach/images/deal-qualification.png` referenced ad
hoc. We set the convention now, before it becomes folklore.

Two goals in tension:

- **Author ergonomics:** a blueprint should stay one self-contained folder that
  previews correctly in GitHub (PRs and editorial passes happen on the repo).
- **Build ergonomics:** the dev-docs build wants a deterministic source→site
  path mapping so it never has to guess or re-resolve image URLs.

## Decision

Keep image assets grouped with the markdown, author with **relative** paths, and
have the dev-docs build apply a mechanical prefix rewrite. This is the standard
static-site-generator pattern (Docusaurus/Astro/Hugo) and gives the build the
deterministic mapping it wants without forcing authors to hand-type site-absolute
paths that 404 in GitHub.

## Authoring convention

- Image files live in **`blueprints/<slug>/images/`**.
- **Body images** use relative paths:
  `![Deal qualification panel](images/deal-qualification.png)`.
- **Header image** is declared in frontmatter: `hero_image: images/hero.png`.
  Optional. One per blueprint; also serves as the catalog thumbnail.
- Paths are always relative to the blueprint dir: no leading `/`, no `http(s)://`,
  no slug embedded in the path (the folder already *is* the slug). This is what
  keeps them rendering in GitHub previews and stops authors from mistyping the
  slug into every path.

## dev-docs build contract (implemented in the other repo)

Deterministic prefix swap — not a re-resolution:

```
blueprints/<slug>/images/<file>   →   /img/blueprints/<slug>/images/<file>
```

Rules:

- Applies to both `hero_image` (frontmatter) and every relative `![](…)` in the
  body.
- Any image reference that is absolute (`/…`) or a URL (`http(s)://`) is left
  untouched.
- The build copies `blueprints/<slug>/images/**` verbatim into the site's static
  tree at `/img/blueprints/<slug>/images/`.

Because the source directory equals the slug and filenames are 1:1, the mapping
is total and mechanical.

### Fallback thumbnail

When `hero_image` is absent, the dev-docs build **auto-generates a thumbnail
from frontmatter metadata** — the GitHub-OG-card pattern (title, description,
products/verticals badges, difficulty). The inputs the generator needs
(`title`, `description`, `products`, `verticals`) are already required
frontmatter, so this repo already guarantees them. No author action required;
works at every `status`.

## This repo's changes

1. **`blueprints/_template/index.md`**
   - Add `hero_image: images/hero.png` to frontmatter, commented as
     optional-but-recommended (fallback card generated if omitted).
   - Add one example inline `![](images/…)` in the body demonstrating the
     relative form.
2. **`blueprints/_template/images/`** — add the folder (with `.gitkeep`) so the
   convention is visible the moment someone copies the template.
3. **`CONTRIBUTING.md`** — a short "Images" subsection under Content rules
   stating the grouped/relative rule, the `hero_image` field, and the build
   rewrite, so it is documented rather than tribal knowledge.
4. **`scripts/validate.js`**
   - **Referential integrity:** error if `hero_image` is set but the file is
     missing; error if any body `![](images/…)` points at a file that does not
     exist on disk. (Absent `hero_image` is fine — fallback covers it.)
   - **Binary-safe credential scan:** `scanCredentials` currently reads every
     top-level file as UTF-8. Real `.png`/`.jpg` assets would be slurped as text
     and could throw or false-positive on the secret regex. Skip known
     binary/image extensions in the scanner.

## Severity model

| Case | Severity | Why |
|---|---|---|
| `hero_image` absent | OK | Fallback metadata card is generated |
| `hero_image` set but file missing | Error | Author intended an image; typo bug |
| Body `![](images/…)` file missing | Error | Definite broken reference |
| Off-blueprint / absolute / URL image ref | OK (not rewritten) | Left as authored |

## Out of scope (YAGNI)

- Image optimization, resizing, or format conversion — authors commit web-ready
  assets.
- Enforcing dimensions or file-size limits (could add a warning later).
- The dev-docs repo changes themselves — this spec defines the contract; the
  site team implements the rewrite and fallback generator.
- Recursing the credential scanner into subdirectories (a pre-existing open
  task, kept separate; the scan stays scoped to text files here).
