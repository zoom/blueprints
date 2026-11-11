## Blueprint

<!-- slug + one-line summary -->

## Checklist

See [STYLE_GUIDE.md](../STYLE_GUIDE.md) for detailed guidance.

**Required:**
- [ ] `npm run validate` passes locally
- [ ] Required sections complete (Outcome-focused intro, Architecture, Implementation Guide, App Manifest)
- [ ] `updated` date bumped
- [ ] No credentials, API keys, or customer data in the diff

**Content quality:**
- [ ] Intro is outcome-focused (what you'll build and why it matters)
- [ ] Architecture leads with differentiation (why this approach matters)
- [ ] Implementation teaches how it's built (not just clone-and-run)
- [ ] Zoom products link to official docs (RTMS, Zoom Apps, etc.)

**Formatting:**
- [ ] Mermaid diagram in Architecture section
- [ ] Images use relative paths (`images/screenshot.png`)
- [ ] Collapsible `<details>` sections used for verbose config
- [ ] No MDX issues (no inline styles, use `<div>` not `<p>` for images)

**Assets:**
- [ ] Sample code repo linked via `github_repo`
- [ ] `manifest.json` included
- [ ] Screenshots in `/images/` with relative paths
- [ ] Demo video linked (if available)
- [ ] Code links to source repo (avoid duplicating files that drift)
