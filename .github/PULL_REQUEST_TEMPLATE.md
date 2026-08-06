## Blueprint

<!-- slug + one-line summary -->

## Checklist

See [STYLE_GUIDE.md](../STYLE_GUIDE.md) for detailed guidance.

**Required:**
- [ ] `npm run validate` passes locally
- [ ] All four required sections complete (Problem Statement, Architecture, Implementation Guide, App Manifest)
- [ ] `updated` date bumped
- [ ] No credentials, API keys, or customer data in the diff

**Content quality:**
- [ ] Problem statement is customer-perspective (describes the pain, not the feature)
- [ ] Architecture leads with differentiation (why this approach matters)
- [ ] Implementation steps are followable without external docs
- [ ] Concrete numbers included where applicable (latency, timing, limits)

**Formatting:**
- [ ] Mermaid diagram in Architecture section
- [ ] Images render correctly (no broken links, proper sizing)
- [ ] Collapsible `<details>` sections used for verbose config
- [ ] No MDX issues (no inline styles, use `<div>` not `<p>` for images)

**Assets:**
- [ ] Sample code repo linked via `github_repo`
- [ ] `manifest.json` included
- [ ] Screenshots in `/images/`
- [ ] Demo video linked (if available)
