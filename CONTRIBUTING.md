# Contributing a Blueprint

V1 is team-only (Developer Advocacy). Partner contributions open in V2.

For what a Blueprint is, who it's for, and how to write one well, see **[STYLE_GUIDE.md](STYLE_GUIDE.md)**.

---

## 1. Create your blueprint folder

```bash
cp -r blueprints/_template blueprints/<your-slug>
```

Slug rules: lowercase, hyphenated, matches the directory name exactly.

---

## 2. Fill in frontmatter

Open `blueprints/<your-slug>/index.md` and complete the YAML block.

### Required fields (validation fails without these)

| Field | Format | Example |
|-------|--------|---------|
| `title` | Outcome-oriented string | `"Real-Time Sales Coach in Meetings"` |
| `slug` | Lowercase, hyphenated | `"realtime-sales-coach"` |
| `description` | 1-2 sentences for cards and SEO | `"Build a real-time sales coaching panel..."` |
| `products` | Array of IDs from taxonomy.json | `["rtms", "zoom-apps"]` |
| `verticals` | Array of IDs from taxonomy.json | `["sales", "enterprise"]` |
| `difficulty` | `beginner` \| `intermediate` \| `advanced` | `"intermediate"` |
| `estimated_time` | Wall-clock estimate | `"4-6 hours"` |
| `author` | Your name | `"Jen Brissman"` |
| `status` | `draft` \| `review` \| `published` | `"draft"` |
| `updated` | YYYY-MM-DD | `2026-08-20` |

### Strongly encouraged

| Field | Purpose |
|-------|---------|
| `github_repo` | Link to your sample code repo. The site hides blueprints without one. |

### Optional fields

| Field | Purpose |
|-------|---------|
| `hero_image` | Header + catalog thumbnail (relative path like `images/hero.png`). Omit and the site auto-generates one. |
| `solution_types` | IDs from taxonomy.json |
| `tags` | Free-form array |
| `seo_title` | What someone would Google |
| `seo_keywords` | 2-4 search phrases |
| `partners` | IDs from taxonomy.json (e.g., `["anthropic"]`) |
| `demo_url` | Link to video demo |
| `license_required` | `true` if Zoom license beyond free tier needed |
| `license_note` | Explain which license/add-on |
| `stack` | Tech stack summary (e.g., `"Node · Express · React · MySQL"`) |
| `deploy` | Array of `{ label, url }` for one-click deploy buttons |

---

## 3. Write the content

See **[STYLE_GUIDE.md](STYLE_GUIDE.md)** for all content rules:
- Intro structure and tone
- Required sections (Features, Architecture, Implementation Guide, App Manifest)
- Code block conventions and Input/Output/Invariants contracts
- Image and diagram requirements
- What to avoid (AI slop patterns, hypothetical features)

---

## 4. Validate locally

```bash
npm install
npm run validate blueprints/<your-slug>
```

Validation checks:
- All required frontmatter fields present
- Slug matches directory name
- Required H2 sections exist
- Image refs have files behind them
- No credential patterns detected

---

## 5. Preview your blueprint

The site hosts a local preview that renders exactly as it will ship. Files never leave your machine.

1. Open [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
2. Click **Choose blueprint folder...** and select your `blueprints/<your-slug>/` directory
3. Edit `index.md` and save. Preview re-renders automatically (Chrome/Edge; other browsers require re-selecting the folder)

The panel shows frontmatter errors/warnings and MDX syntax issues the site build would reject.

---

## 6. Open a PR

1. Create a branch: `git checkout -b blueprint/<your-slug>`
2. Commit your blueprint folder
3. Push and open a PR against `main`
4. CI runs the same validation as local

---

## 7. Review and publish

| Status | Meaning |
|--------|---------|
| `draft` | Work in progress, not visible on site |
| `review` | Ready for peer review and editorial pass |
| `published` | Live on site |

Workflow:
1. Author sets `status: draft` while writing
2. PR opened, peer review per team schedule
3. On approval, author sets `status: review`
4. Editorial pass (tone, grammar, consistency)
5. Merge to main with `status: published`

---

## 8. Adding taxonomy terms

Need a new product, vertical, solution type, or partner? Add an entry to `taxonomy.json`:

```json
{
  "id": "your-term",
  "label": "Your Term"
}
```

No code changes required. Include it in the same PR as your blueprint.

---

## 9. Credential safety

**No secrets anywhere.** CI scans for:
- API keys and tokens
- Client secrets
- Private keys
- Passwords

Use `.env.example` files with placeholder values. Document which credentials are needed in your Implementation Guide, but never include real values.

---

## Timeline (V1)

| Date | Milestone |
|------|-----------|
| Aug 18 | Outlines (intro + architecture sketch) |
| Aug 25 - Sep 5 | Drafts, peer review pairs |
| Sep 8-12 | Final submissions |
| Sep 29 | Soft launch |
