# Blueprint Writing Style Guide

Use this guide when writing and reviewing blueprints. These patterns come from the gold standard examples (Sales Coach, Meeting Notetaker) and should be applied consistently across all blueprints.

---

## Audience

You're writing for **multiple audiences at once**:

- **Developers** who want to build
- **Sales engineers** who need to demo the art of the possible
- **Decision-makers** evaluating what's buildable on Zoom

Don't pick one and ignore the others. Write so all three get value:

- Lead with differentiation (why this approach matters) — catches decision-makers
- Include concrete implementation details — satisfies developers
- Make it scannable with clear section headers — helps SEs find what they need

---

## Structure

Every blueprint must have these four sections:

1. **Problem Statement** — The customer problem, not the feature description
2. **Architecture** — How the solution works technically
3. **Implementation Guide** — Step-by-step instructions to build it
4. **App Manifest** — Zoom App configuration reference

These are the floor, not the ceiling. Add more sections if they help developers succeed.

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

**Image example:**
```markdown
<div align="center">
  <img src="/blueprints/your-slug/images/screenshot.png" alt="Description" width="640" />
</div>
```

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

## PR Review Checklist

When reviewing a blueprint PR, verify:

- [ ] **Validation passes** — `npm run validate blueprints/<slug>`
- [ ] **All 4 required sections present** — Problem Statement, Architecture, Implementation Guide, App Manifest
- [ ] **Problem statement is customer-perspective** — Describes the pain, not the feature
- [ ] **Architecture leads with differentiation** — Why this approach matters
- [ ] **Implementation steps are followable** — A developer unfamiliar with the reference app can complete them
- [ ] **Images render correctly** — No broken links, proper sizing
- [ ] **Demo video linked** — If available
- [ ] **Collapsible sections used appropriately** — Verbose config is collapsed
- [ ] **No MDX compatibility issues** — No inline styles, proper image containers
- [ ] **manifest.json included** — Valid Zoom App manifest
- [ ] **Concrete numbers included** — Latency, timing, limits where applicable

---

## Prompting Your LLM

If using an LLM to help write, include these instructions:

```
Write for a mixed audience: developers who build, SEs who demo, and decision-makers who evaluate.
Lead with differentiation — what makes this approach special vs. alternatives.
Use short sentences. Break up lists. Include concrete numbers (latency, timing).
Frame sections as value props, not descriptions.
End with extensibility — remind them this is theirs to customize.
Make it scannable. Use collapsible <details> sections for verbose config steps.
Include both the "why this matters" (for executives) and "how it works" (for developers).
```

---

## Gold Standard Examples

Reference these blueprints when writing or reviewing:

- **[Real-Time Sales Coach](./blueprints/realtime-sales-coach/)** — Sales vertical, qualification tracking, competitor detection
- **[AI Meeting Notetaker](./blueprints/ai-meeting-notetaker/)** — Notes vertical, summaries, action items

Both demonstrate the same RTMS + Surface App architecture for different use cases.
