# Blueprint Style Guide

Use this guide when writing and reviewing blueprints. These patterns come from the gold standard examples (Sales Coach, Meeting Notetaker) and must be applied consistently across all blueprints.

For the contribution workflow (repo setup, validation commands, PR lifecycle), see [CONTRIBUTING.md](CONTRIBUTING.md). For current project status and open tasks, see [PROJECT.md](PROJECT.md).

---

## What a Blueprint Is (and What It Isn't)

A Blueprint is **declarative, opinionated, and prescriptive**. It is a gold standard for recreating a system, closer to a CloudFormation template than a step-by-step tutorial.

| Tutorial | Blueprint |
|----------|-----------|
| "Go here, click this button" | "Here are the APIs and patterns; here's the path we recommend" |
| Step-by-step hand-holding | Declarative, prescriptive architecture |
| Sequential walkthrough | Understand and adapt |
| Clone and run | Scaffold and build |

**Litmus test:** If you removed all the prose and left only the architecture diagram, contracts, and manifest, could an experienced developer (or an LLM agent) recreate the system? If yes, it's a Blueprint. If they'd be lost without the step-by-step instructions, it's a tutorial.

**Prescriptive but not exclusive.** Blueprints declare a clear path (e.g., "we're using Postgres, we're using Railway") while acknowledging other approaches exist. The goal is to give enough guidance that models and developers can move fast, without implying it's the only way.

**Agent-first framing.** A Blueprint should work as a prompt artifact. If an existing customer (e.g., a telehealth app) wants to add a new capability, they should be able to feed the Blueprint to their agent and have it map the integration into their existing codebase, not just scaffold a fresh project.

---

## Who It's For

Blueprints serve **three readers at once**:

| Reader | What they need | How we serve them |
|--------|----------------|-------------------|
| **Developers** | Implementation details to build it | Implementation Guide, contracts, linked repo |
| **Sales engineers / Decision-makers** | Quick assessment of fit | One-sentence what/why, images, demo GIF |
| **LLM agents** | Machine-parseable prompt artifact | Contracts, stack-agnostic pseudocode, self-contained content |

Don't pick one and ignore the others. Write so all get value:

- Lead with outcomes (what you end up with): catches decision-makers
- Include concrete implementation details: satisfies developers
- Make it scannable with clear section headers: helps SEs find what they need
- Be declarative and self-contained: enables agent-driven scaffolding

---

## Anatomy of a Blueprint

Every blueprint must have these sections in this order:

### 1. Outcome-focused intro (no heading)

The prose before any H2 heading. Leads with what the reader ends up with and why it matters. See "The Intro Block" section below for the required field-by-field structure.

**Purpose:** Hook all three audiences in 30 seconds. Decision-makers decide if this solves their problem; developers see the scope; agents parse the requirements.

**Depth:** 4-6 short paragraphs covering what/why/prerequisites/features/alternative.

### 2. Architecture

How the solution works technically. Opens with 1-2 paragraphs explaining data flow, followed by a Mermaid diagram with labeled components and connections.

**Purpose:** Give developers and agents a mental model of the system before diving into code.

**Depth:** Components table (what each piece does, our stack vs. alternatives), sequence or flow diagram, brief explanation of why this architecture.

### 3. Implementation Guide

How the app is built, not how to clone it. Teaches developers (or coding agents) to rebuild this class of app without external docs.

**Purpose:** The core technical content. After reading this, a developer understands not just what to build but why each piece exists.

**Depth:** Walk through real code patterns. Use Input/Output/Invariants contracts for business logic; keep security-critical code (HMAC verification, JWT validation) as concrete snippets. Every file path and identifier must exist in the linked repo. End with a short "Run the Sample" section.

### 4. App Manifest

Zoom App configuration reference. Explains what the `manifest.json` configures (scopes, event subscriptions, redirect URLs) and how to use it.

**Purpose:** Let developers create the Zoom App correctly without guessing at configuration.

**Depth:** Table of required scopes with purpose, event subscriptions, RTMS/SDK configuration steps.

### Optional sections

Add after the required four if they help developers succeed:

- **Acceptance Criteria**: Verification checklist for implementations
- **Production Considerations**: Scaling, security, compliance notes (use collapsible `<details>`)
- **Related Resources**: Links to docs, repos, forums

---

## The Intro Block, Field by Field

The outcome-focused intro (before any heading) must follow this exact order:

1. **What it does** (one sentence): Declarative, technical, no marketing fluff
2. **Why it matters** (one sentence): The problem this solves
3. **What you'll need** (bulleted list): Including Zoom license prerequisites (see next section)
4. **Features** (bulleted list): What the finished app does
5. **Zoom product callout**: The out-of-the-box Zoom product for readers who don't need to build
6. **Transition** (one sentence): Bridge to the Architecture section

### Filled example

```markdown
A real-time sales coach streams meeting transcripts from RTMS, passes them to an LLM, and displays qualification signals, competitor mentions, and coaching cues in a panel visible only to the seller.

Sales coaching usually happens after the call, once a manager reviews the recording. By then the deal has moved on. A real-time coach catches those signals while the rep can still act.

**What you'll need:**

- Transcript access via [RTMS](https://developers.zoom.us/docs/rtms/) (requires a paid Zoom Workplace plan with RTMS entitlement)
- A backend to receive webhooks, persist transcripts, and call an LLM (Node/Express in this guide; any stack works)
- A [Zoom Surface App](https://developers.zoom.us/docs/zoom-apps/guides/building-a-surface/) to render the coaching panel in-meeting
- An LLM for signal extraction (OpenRouter, OpenAI, Anthropic, or self-hosted)

**Features:**

- Live transcript stream with sub-second latency
- Deal qualification tracker (BANT, MEDDIC, or custom criteria)
- Competitor mention detection with sentiment
- Commitment and next-step capture

If you'd rather buy than build, Zoom offers [Revenue Accelerator](https://zoom.us/revenue-accelerator) with similar capabilities.

Follow along as we walk through the architecture.
```

---

## What You'll Need: Zoom License Prerequisites

The "What you'll need" section must state which Zoom license/plan is required to build and run the Blueprint. This is about what developers need to build it, not marketing.

### License prerequisite table

| Blueprint ingredient | Required Zoom license/entitlement |
|---------------------|-----------------------------------|
| **RTMS (Real-Time Media Streams)** | Paid Zoom Workplace plan + RTMS entitlement ([request access](https://www.zoom.com/en/realtime-media-streams/#form)) |
| **Zoom Apps (Surface Apps)** | Any Zoom account; end users need Zoom client 5.9+ |
| **Meeting SDK** | Meeting SDK license (different from Meetings) |
| **Video SDK** | Video SDK license ([get credentials](https://developers.zoom.us/docs/video-sdk/get-credentials/)) |
| **Team Chat Apps** | Zoom Workplace plan with Team Chat enabled |
| **Zoom Phone** | Zoom Phone license |
| **Webhooks** | Any Zoom account (some events require specific plans) |
| **OAuth scopes** | Varies by scope; some require admin approval |

### How to write it

State the license requirement inline with the capability:

**Do:**
```markdown
- Transcript access via [RTMS](https://developers.zoom.us/docs/rtms/) (requires a paid Zoom Workplace plan with RTMS entitlement)
```

**Don't:**
```markdown
- Transcript access via RTMS
```

---

## Tone and Voice

### Lead with outcome, not description

**Don't start with:**
> "This blueprint shows how to use RTMS to stream transcripts."

**Start with:**
> "A real-time sales coach streams meeting transcripts from RTMS, passes them to an LLM, and displays qualification signals in a panel visible only to the seller."

### Use direct technical headers

Avoid marketing-style headers. Use plain descriptions:

| Don't | Do |
|-------|-----|
| "The No-Bot Advantage" | "Architecture" |
| "Real-Time, Not Post-Call" | "How extraction works" |
| "Wire it to the frontend" | "WebSocket delivery" |
| "The Intelligence Layer" | "Sales signal extraction" |

### Write short sentences

Long sentences lose everyone. Break them up.

**Don't:**
> "The backend maintains a WebSocket connection to RTMS for each active meeting, and as segments arrive, it buffers them for 2-3 seconds to handle out-of-order delivery, normalizes speaker labels, persists to Postgres for post-meeting retrieval, and broadcasts to connected frontend clients."

**Do:**
> As segments arrive, the backend:
> - Buffers for 2-3 seconds to handle out-of-order delivery
> - Normalizes speaker labels
> - Persists to Postgres
> - Broadcasts to connected clients

### Include concrete numbers

Latency, timing, limits. These build credibility:

- "typically within 300-500ms"
- "sub-second latency"
- "buffers for 2-3 seconds"
- "30-second extraction interval"

### Avoid AI-sounding patterns

These patterns make content smell like AI. Avoid them:

| Pattern | Example | Fix |
|---------|---------|-----|
| Em dashes | "surfaces signals — while you can act" | Use periods, semicolons, or colons |
| Binary contrasts | "Real-Time, Not Post-Call" | Just describe what it does |
| Dramatic kickers | "The intelligence layer is yours to build." | Cut it |
| Feature list em dashes | `**Feature** — description` | Use colons: `**Feature**: description` |

**Callout format:** Don't use blockquotes for "adapting this pattern" callouts. Use inline bold:

**Don't:**
```markdown
> **Adapting this pattern:** Every language has HMAC-SHA256...
```

**Do:**
```markdown
**Other languages:** In Python, use `hmac.compare_digest`; in Go, use `crypto/subtle.ConstantTimeCompare`.
```

---

## Images and Video Requirements

### Screenshots (required)

Every Blueprint must include **screenshots**. These are non-negotiable.

**What to capture:**
- UI screenshots showing the finished application in action
- Architecture diagram (Mermaid renders automatically, but additional visuals help)
- Key configuration or setup screens
- Output/results examples

**What makes a good screenshot:**

| Do | Don't |
|----|-------|
| Crop to the relevant area | Full desktop with toolbars and tabs |
| Show real data or realistic placeholders | Empty states or "lorem ipsum" |
| Capture the app in a working state | Error screens (unless documenting error handling) |
| Use consistent window sizes | Mix of random dimensions |
| High resolution, readable text | Blurry or scaled-down images |
| Light mode preferred for consistency | Dark mode (unless the app is dark-mode-only) |

Images live in `blueprints/<slug>/images/` and are referenced by **relative path**:

```markdown
![Deal Qualification](images/deal-qualification.png)
```

For centered images with sizing:
```markdown
<div align="center">
  <img src="images/screenshot.png" alt="Description" width="640" />
</div>
```

**Hero image** (optional): Add `hero_image: images/hero.png` to frontmatter. If omitted, the site auto-generates a thumbnail from metadata.

### Demo video (required)

Every Blueprint must include a **short video showing the end result**. This can be simple.

**Minimum bar (required):**
- Screen recording of the working application
- Shows the output/result, not the setup process
- 30 seconds to 2 minutes
- No face required
- No voice required
- No editing required beyond trimming start/end

A simple screen capture with QuickTime or Loom showing "here's what happens when you run it" is enough.

**Nice to have (not required):**
- Narrated walkthrough
- Polished editing
- Longer deep-dive video

Link demo videos in the intro after the images:

```markdown
[Watch a 2-minute demo](https://www.youtube.com/watch?v=...)
```

**Format:** Upload to YouTube (unlisted is fine) or host as a GIF/MP4. Don't embed large files in the repo.

---

## Collapsible Sections

Use `<details>` tags for verbose content that interrupts the narrative flow.

**Keep expanded:**
- The main narrative flow
- Critical decision points
- Things readers need to understand the architecture
- Security-critical code examples

**Collapse:**
- Step-by-step environment variable setup
- Detailed Zoom Marketplace configuration
- Production deployment considerations
- Anything that's "copy these values" rather than "understand this concept"

**Example:**
```markdown
<details>
<summary><strong>Step-by-step local setup</strong></summary>

1. Clone and configure:
   ```bash
   git clone https://github.com/zoom/arlo.git && cd arlo && cp .env.example .env
   ```

2. Start ngrok...

</details>
```

---

## Sample Code and Repository Requirements

### Repository structure

Every Blueprint's linked sample repo must include:

- Working application code matching the Blueprint
- `README.md` with setup instructions
- `.env.example` with all required environment variables (placeholder values only)
- `manifest.json` for Zoom App configuration
- **Platform-agnostic Dockerfile** (see below)
- `render.yaml` for Render one-click deploy
- `railway.json` for Railway one-click deploy

### Platform-agnostic Dockerfile (required)

Every sample repo must ship a generic, service-agnostic Dockerfile so developers can deploy on any platform, not only Render/Railway.

**Dockerfile requirements:**
- Multi-stage build (build stage + runtime stage)
- No platform-specific dependencies or assumptions
- Environment variables via `ENV` defaults or `--env-file` at runtime
- `EXPOSE` the application port
- Clear `CMD` or `ENTRYPOINT`

**Minimal example:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
```

### Sample code standards

Blueprint sample code must follow Zoom's Open Source Development standards. Key requirements:

1. **Easy to read and simple**: Clear variable names, minimal complexity
2. **Robust logging and actionable errors**: Help developers debug issues
3. **Security per Zoom SDL / OWASP Top 10**: No vulnerabilities in sample code
4. **TLS 1.2+ required**: All external connections use modern TLS
5. **Never commit real credentials**: Use obvious placeholders like `YOUR_KEY_HERE`
6. **Zoom for Government support**: Base URL must be configurable via environment variable
7. **Repo naming**: Include `sample` in repo name for automatic security scanning

**Reference documentation:**
- [Open Source Development Guide](https://docs.zoom.us/doc/PQUB5WfoSti3GnrYjx_iWQ)
- [Development Fundamentals](https://docs.zoom.us/doc/2849O5p2SWKjcUqQ9Eai9A)
- [Security Best Practices](https://docs.zoom.us/doc/BmnalDG1TYaUJ3L7gGIeNA)
- [Publishing to GitHub](https://docs.zoom.us/doc/aUjonajgSZSHdptNInRKKQ)
- [AI-Assisted Development](https://docs.zoom.us/doc/9fRcxF5uTIWfc3jKtTTlxQ)
- [All OSS Standards](https://docs.zoom.us/folder/sOOiZuU_Rr28IrlTxukh9w)

---

## Contracts and Agent-First Content

### Stack-agnostic contracts

Use Input/Output/Invariants contracts for business logic. This makes Blueprints work for Python, Go, Ruby, or any stack:

```markdown
#### Stream session management

**Input:** `meeting.rtms_started` webhook payload with `meeting_uuid`, `rtms_stream_id`, `server_urls`

**Output:** Active RTMS session registered, client connected, transcript handler receiving segments

**Invariants:**

- Deduplicate by `rtms_stream_id`, not `meeting_uuid`
- If same meeting arrives with new stream ID (media server failover), tear down old session and join new
- Register transcript handlers before calling `join()`
- Clean up session on `onLeave` callback

See [Arlo's RTMS service](https://github.com/zoom/arlo/tree/main/services/rtms) for the reference implementation.
```

### Keep security-critical code concrete

Some code must stay as concrete snippets because the implementation details matter for security:

- HMAC signature verification (timing-safe comparison)
- JWT validation
- Credential handling
- Encryption/decryption

```javascript
function verifyWebhookSignature(rawBody, timestamp, signature, secret) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expected = 'v0=' + crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### Copy for LLM / agent export

The on-page content may differ from the clipboard/agent-export version. The export can include richer context, doc links, and the full contract specifications. Authors don't write a separate "Agent Skill Export" section; it's auto-generated from the content.

**Link the repo, don't paste large blocks.** For implementation details that may change, link to the source:

**Do:**
> See [Arlo's AI routes](https://github.com/zoom/arlo/tree/main/backend/routes/ai) for the reference implementation.

**Don't:**
> Paste 200 lines of code that will drift from the repo.

---

## MDX and Rendering Constraints

These rules prevent hydration errors on the dev-docs site:

1. **No inline `style` attributes**: Use `width` and `height` attributes only
2. **Use `<div>` not `<p>` for image containers**: `<p>` tags can't contain block elements
3. **No `&nbsp;` between elements**: MDX converts these to nested `<p>` tags
4. **No JSX components**: Stick to GitHub-flavored markdown
5. **Mermaid diagrams**: Use fenced code blocks with `mermaid` language tag

**Valid:**
```markdown
<div align="center">
  <img src="images/screenshot.png" alt="Description" width="640" />
</div>
```

**Invalid:**
```markdown
<p style="text-align: center;">
  <img src="images/screenshot.png" style="width: 640px;" />
</p>
```

---

## One-Click and Portable Deploy

### One-click deploy buttons (easy path)

Include deploy buttons for Render and Railway:

```markdown
| Platform | What you get |
|----------|--------------|
| [**Deploy to Render**](https://render.com/deploy?repo=https://github.com/zoom/your-repo) | Backend, frontend, database |
| [**Deploy to Railway**](https://railway.app/new?repo=https://github.com/zoom/your-repo) | Backend, frontend, database |

Both platforms offer free tiers.
```

For this to work, the sample repo needs:
- `render.yaml` for Render
- `railway.json` for Railway

### Portable Dockerfile (any platform)

For developers who want to deploy elsewhere (AWS, GCP, Azure, self-hosted), the platform-agnostic Dockerfile enables deployment on any container platform. Document this option:

```markdown
**Deploy anywhere:** The repo includes a platform-agnostic `Dockerfile` for deployment to any container platform. See the [Dockerfile](https://github.com/zoom/your-repo/blob/main/Dockerfile) and adjust environment variables for your platform.
```

---

## PR Review Checklist

When reviewing a Blueprint PR, verify all items:

### Content and structure
- [ ] **Validation passes**: `npm run validate blueprints/<slug>`
- [ ] **Required sections present**: Outcome-focused intro, Architecture, Implementation Guide, App Manifest
- [ ] **Intro follows locked structure**: What/Why/Prerequisites/Features/Zoom callout/Transition
- [ ] **Zoom license prerequisite stated**: "What you'll need" includes required Zoom plan/entitlement

### Quality and tone
- [ ] **Architecture is direct**: No marketing headers like "The No-Bot Advantage"
- [ ] **Implementation teaches how it's built**: Not just clone-and-run
- [ ] **No AI patterns**: No em dashes, no dramatic kickers, no binary contrast headers
- [ ] **Concrete numbers included**: Latency, timing, limits where relevant

### Technical requirements
- [ ] **Zoom products linked**: RTMS, Zoom Apps, etc. link to official docs
- [ ] **Images use relative paths**: `images/screenshot.png`, not absolute URLs
- [ ] **Screenshots included**: UI, architecture, config screens, output (see screenshot quality checklist)
- [ ] **Demo video included**: Screen recording of working app, 30s-2min, linked in intro
- [ ] **No MDX compatibility issues**: No inline styles, use `<div>` for images, no `&nbsp;`
- [ ] **manifest.json included**: Valid Zoom App manifest

### Repository requirements
- [ ] **Sample repo linked**: `github_repo` frontmatter populated
- [ ] **Platform-agnostic Dockerfile present**: In the sample repo
- [ ] **Sample code follows OSS standards**: Per Max's Open Source Development guide
- [ ] **No real credentials**: All keys/secrets are obvious placeholders (`YOUR_KEY_HERE`)
- [ ] **Code links to source repo**: Don't duplicate files that may drift

---

## Gold Standard Examples

Reference these blueprints when writing or reviewing. They demonstrate the patterns above.

### [Real-Time Sales Coach](./blueprints/realtime-sales-coach/)

**Why it's exemplary:**
- Intro follows the locked structure exactly (what/why/prerequisites/features/Zoom callout/transition)
- "What you'll need" includes RTMS license requirement
- Architecture section has components table + Mermaid diagram + agent integration map
- Implementation Guide uses Input/Output/Invariants contracts for business logic
- HMAC verification stays as concrete code (security-critical)
- LLM prompt visible for customization
- Acceptance criteria checklist at the end
- Links to Arlo repo for full implementation; doesn't paste large code blocks

### [AI Meeting Notetaker](./blueprints/ai-meeting-notetaker/)

**Why it's exemplary:**
- Same RTMS + Surface App architecture, different use case (notes vs. sales coaching)
- Demonstrates how contracts transfer across blueprints (same transcript pipeline, different extraction)
- Customizing prompts section shows how to adapt for different meeting types
- Production considerations in collapsible `<details>` section
- Cross-links to Sales Coach blueprint for related use case

---

## LLM Prompting Block

When using an LLM to help write a Blueprint, include these instructions:

```
You are writing a Zoom Blueprint, not a tutorial. Blueprints are declarative, opinionated, and prescriptive, like CloudFormation templates.

STRUCTURE (required, in order):
1. Outcome-focused intro (no heading): What it does (1 sentence) → Why it matters (1 sentence) → What you'll need (bullets, MUST include Zoom license prereq) → Features (bullets) → Zoom product callout → Transition sentence
2. ## Architecture: Components table + Mermaid diagram + data flow explanation
3. ## Implementation Guide: Input/Output/Invariants contracts for business logic; concrete code only for security-critical patterns (HMAC, JWT); link to repo for full implementation
4. ## App Manifest: Scopes table, event subscriptions, configuration steps

AUDIENCE: Write for developers (implementation details), decision-makers (quick what/why + images), and LLM agents (contracts, self-contained content).

TONE RULES:
- No em dashes (use periods, semicolons, colons)
- No binary contrasts ("Real-Time, Not Post-Call")
- No dramatic kickers ("The intelligence layer is yours to build.")
- No marketing headers ("The No-Bot Advantage")
- Include concrete numbers (latency, timing, limits)
- Short sentences. Break up lists.

TECHNICAL RULES:
- Link to Zoom docs when introducing Zoom products
- Images use relative paths: images/screenshot.png
- Use <div> not <p> for image containers
- No inline style attributes
- Credentials must be obvious placeholders (YOUR_KEY_HERE)
- Sample code follows Zoom OSS standards

The litmus test: If you removed all prose and left only the architecture diagram, contracts, and manifest, could an experienced developer recreate the system?
```

---

## Blueprint Naming

A Blueprint title must pass these checks:

| Requirement | Why |
|-------------|-----|
| **States what it does** | "Real-time sales coach" not "RTMS Integration" |
| **Includes the use case or outcome** | "Transcripts → Salesforce" not "CRM Connector" |
| **Uses terms developers would search for** | "AI meeting notetaker" not "Intelligent Note Capture System" |
| **Scannable in a list** | Keep it under 8 words |
| **No jargon without context** | "Human-in-the-loop" means nothing alone; "Meeting follow-up agent with human approval" is clear |

**Pattern that works:** `[What] + [Where/How/For What]`

- "Live sentiment analysis in meetings"
- "Transcripts to Salesforce CRM"
- "Telehealth waiting room"
- "Deepfake detection in meetings"

**Litmus test:** If someone sees only the title in a list of 20 blueprints, can they decide in 2 seconds whether to click?

---

## One Blueprint Per Product

If you have similar use cases across different products, create **separate blueprints** for each.

**Example:**
- "Track sentiment in Zoom Meetings" (RTMS + Zoom Apps) → one blueprint
- "Add sentiment analysis to Video SDK sessions" (Video SDK) → separate blueprint

Someone searching for a Video SDK example isn't looking for a Meetings example, even if the use case is similar. Keep blueprints self-contained and optimized for their specific audience. Cross-link between related blueprints if helpful.

---

## Previewing Your Blueprint

Use the blueprint preview tool to see how your blueprint will render with full styling, Mermaid diagrams, and frontmatter validation.

1. Open `/blueprints/preview/` on localhost or the staging site
2. Drag your `blueprints/<your-slug>/` folder onto the page (or click to select)
3. Edit `index.md` locally and save. The preview re-renders automatically (~1 second in Chrome/Edge)

The preview shows:
- Frontmatter errors and warnings (missing fields, unknown product/vertical IDs)
- MDX syntax errors with line numbers
- Notes if `manifest.json` isn't in your folder

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions.
