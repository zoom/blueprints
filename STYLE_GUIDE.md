# Blueprint Writing Style Guide

Use this guide when writing and reviewing blueprints. These patterns come from the gold standard examples (Sales Coach, Meeting Notetaker) and should be applied consistently across all blueprints.

---

## What a Blueprint Is (and Isn't)

**A Blueprint is not a tutorial.** It's more like a CloudFormation template — declarative, opinionated, and designed so that if you hand it to an agent, it can scaffold and build the integration end-to-end.

| Tutorial | Blueprint |
|----------|-----------|
| "Go here, click this button" | "Here are the APIs and patterns, here's the path we recommend" |
| Step-by-step hand-holding | Declarative, prescriptive architecture |
| Clone and run | Understand and adapt |

**Prescriptive but not exclusive.** Blueprints should declare a clear path (e.g., "we're using Postgres, we're using Railway") while acknowledging that other approaches exist. The goal is to give enough guidance that models and developers can move fast, without implying it's the only way.

**Agent-first framing.** A Blueprint should work as a prompt artifact — if an existing customer (e.g., a telehealth app) wants to add a new capability, they should be able to feed the Blueprint to their agent and have it map the integration into their existing codebase, not just scaffold a fresh project.

---

## Audience

You're writing for **multiple audiences at once**:

- **Developers** who want to build
- **Sales engineers** who need to demo the art of the possible
- **Decision-makers** evaluating what's buildable on Zoom
- **AI agents** that will use this as a prompt artifact

Don't pick one and ignore the others. Write so all get value:

- Lead with differentiation (why this approach matters) — catches decision-makers
- Include concrete implementation details — satisfies developers
- Make it scannable with clear section headers — helps SEs find what they need
- Be declarative and self-contained — enables agent-driven scaffolding

---

## Structure

Every blueprint must have these sections:

1. **Outcome-focused intro** — What this builds and why it matters (no "Problem Statement" H2)
2. **Architecture** — How the solution works technically
3. **Implementation Guide** — How the app is built, not just clone-and-run
4. **App Manifest** — Zoom App configuration reference

These are the floor, not the ceiling. Add more sections if they help developers succeed.

---

## One Blueprint Per Product

If you have similar use cases across different products, create **separate blueprints** for each.

**Example:**
- "Track sentiment in Zoom Meetings" (RTMS + Zoom Apps) → one blueprint
- "Add sentiment analysis to Video SDK sessions" (Video SDK) → separate blueprint

Someone searching for a Video SDK example isn't looking for a Meetings example, even if the use case is similar. Keep blueprints self-contained and optimized for their specific audience. Cross-link between related blueprints if helpful.

---

## Surface Zoom Core Products

Where it makes sense, include a lightweight callout to the equivalent Zoom product:

> "If you don't want to build this yourself, Zoom offers [AI Companion](https://zoom.us/ai) with similar capabilities out of the box."

This helps readers understand where custom development fits vs. using existing Zoom products.

---

## Link to Zoom Docs

When introducing a Zoom product or API, link to the official documentation. This helps both humans and LLMs fetch additional context:

**Do:**
> [RTMS](https://developers.zoom.us/docs/rtms/) streams the live transcript to your backend with sub-second latency.

**Don't:**
> RTMS streams the live transcript to your backend with sub-second latency.

---

## Tone & Voice

### Lead with Value, Not Description

**Don't start with:**
> "This blueprint shows how to use RTMS to stream transcripts."

**Start with:**
> "Traditional meeting assistants join as participants. This architecture takes a different approach — no bot, no unfamiliar name in the roster."

Establish *what makes this special* before explaining how it works.

### Frame Sections as Value Propositions

Use headers that tell the reader *why they should care*:

| Instead of | Try |
|------------|-----|
| "Architecture Overview" | "The No-Bot Advantage" |
| "Latency Information" | "Real-Time, Not Post-Call" |
| "Backend Components" | "The Intelligence Layer" |

### Write Short, Punchy Sentences

Long sentences lose everyone. Break them up.

**Don't:**
> "The backend maintains a WebSocket connection to RTMS for each active meeting, and as segments arrive, it buffers them for 2-3 seconds to handle out-of-order delivery, normalizes speaker labels, persists to Postgres for post-meeting retrieval, and broadcasts to connected frontend clients."

**Do:**
> As segments arrive, the backend:
> - Buffers for 2-3 seconds to handle out-of-order delivery
> - Normalizes speaker labels
> - Persists to Postgres
> - Broadcasts to connected clients

### Include Concrete Numbers

Latency, timing, limits — these build credibility for all audiences:

- "typically within 300-500ms"
- "sub-second latency"
- "buffers for 2-3 seconds"

### End Sections with Extensibility

Remind readers that this is theirs to customize:

> "The RTMS stream is the input; what you do with it is up to you."

> "Swap LLM providers. Add CRM integrations. Route competitor mentions to Slack."

---

## Collapsible Sections

Use `<details>` tags for verbose content that interrupts the narrative flow.

**Keep expanded:**
- The main narrative flow
- Critical decision points
- Things readers need to understand the architecture

**Collapse:**
- Step-by-step environment variable setup
- Detailed Zoom Marketplace configuration
- Production deployment considerations
- Anything that's "copy these values" rather than "understand this concept"

**Example:**
```markdown
<details>
<summary><strong>Step 4: Configure Environment Variables</strong></summary>

Edit `.env` with your values:

```bash
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

</details>
```

---

## MDX Compatibility

These rules prevent hydration errors on the dev-docs site:

1. **No inline `style` attributes** — Use `width` and `height` attributes only
2. **Use `<div>` not `<p>` for image containers** — `<p>` tags can't contain block elements
3. **No `&nbsp;` between elements** — MDX converts these to nested `<p>` tags
4. **No JSX components** — Stick to GitHub-flavored markdown

---

## Images

Images live with the blueprint in `blueprints/<slug>/images/` and are referenced by **relative path**:

```markdown
![Deal Qualification](images/deal-qualification.png)
```

For centered images with sizing:
```markdown
<div align="center">
  <img src="images/screenshot.png" alt="Description" width="640" />
</div>
```

**Hero image** (optional): Add `hero_image: images/hero.png` to frontmatter. If omitted, a thumbnail is auto-generated from metadata.

Relative paths keep blueprints self-contained and previewable in GitHub.

---

## Linking to Code

**Don't duplicate code files in the blueprint.** Link to the GitHub repo instead to avoid drift:

**Do:**
> See the full manifest in the [Arlo repository](https://github.com/zoom/arlo/blob/main/zoom-app-manifest.json).

**Don't:**
> Copy the entire manifest.json into the blueprint and try to keep it in sync.

The `manifest.json` in the blueprint directory is for reference/validation. For implementation details that may change, link to the source repo.

---

## One-Click Deploy

Include deploy buttons when possible. Both Render and Railway support one-click deploys:

```markdown
| Platform | What You Get |
|----------|--------------|
| [**Deploy to Render**](https://render.com/deploy?repo=https://github.com/zoom/your-repo) | Backend, Frontend, Database |
| [**Deploy to Railway**](https://railway.app/new?repo=https://github.com/zoom/your-repo) | Backend, Frontend, Database |

Both platforms offer free tiers. You'll need to create an account if you don't have one.
```

For this to work, your reference repo needs:
- `render.yaml` for Render
- `railway.json` for Railway

---

## Previewing Your Blueprint

Use the blueprint preview tool on the dev-docs staging site to see how your blueprint will render with full styling, Mermaid diagrams, and frontmatter validation.

1. Open `/blueprints/preview/` on the staging site (VPN required until launch)
2. Click **Choose blueprint folder…** and select your `blueprints/<your-slug>/` directory
3. Write — in Chrome/Edge the preview re-renders ~1 second after every save

The preview shows:
- Frontmatter errors and warnings (missing fields, unknown product/vertical IDs)
- MDX syntax errors with line numbers
- Notes if `manifest.json` isn't in your folder

See CONTRIBUTING.md for full instructions.

---

## PR Review Checklist

When reviewing a blueprint PR, verify:

- [ ] **Validation passes** — `npm run validate blueprints/<slug>`
- [ ] **Required sections present** — Outcome-focused intro, Architecture, Implementation Guide, App Manifest
- [ ] **Intro is outcome-focused** — Leads with what you'll build and why it matters
- [ ] **Architecture leads with differentiation** — Why this approach matters
- [ ] **Implementation teaches how it's built** — Not just clone-and-run
- [ ] **Zoom products linked** — RTMS, Zoom Apps, etc. link to official docs
- [ ] **Images use relative paths** — `images/screenshot.png`, not absolute URLs
- [ ] **Demo video linked** — If available
- [ ] **Collapsible sections used appropriately** — Verbose config is collapsed
- [ ] **No MDX compatibility issues** — No inline styles, use `<div>` for images
- [ ] **manifest.json included** — Valid Zoom App manifest
- [ ] **Code links to source repo** — Don't duplicate files that may drift

---

## Prompting Your LLM

If using an LLM to help write, include these instructions:

```
Write a Blueprint, not a tutorial. Blueprints are declarative and opinionated like CloudFormation templates.
Write for multiple audiences: developers, SEs, decision-makers, and AI agents that will use this as a prompt.
Lead with differentiation — what makes this approach special vs. alternatives.
Use short sentences. Break up lists. Include concrete numbers (latency, timing).
Frame sections as value props, not descriptions.
End with extensibility — remind them this is theirs to customize.
Make it scannable. Use collapsible <details> sections for verbose config steps.
Link to Zoom docs when introducing Zoom products (helps LLMs fetch context).
The Implementation Guide should teach how the app is built, not just clone-and-run.
Be agent-first: an existing customer should be able to feed this to their agent to map the integration into their codebase.
```

---

## Gold Standard Examples

Reference these blueprints when writing or reviewing:

- **[Real-Time Sales Coach](./blueprints/realtime-sales-coach/)** — Sales vertical, qualification tracking, competitor detection
- **[AI Meeting Notetaker](./blueprints/ai-meeting-notetaker/)** — Notes vertical, summaries, action items

Both demonstrate the same RTMS + Surface App architecture for different use cases.
