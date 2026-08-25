# Blueprints — Project Status & Open Tasks

> Living doc. Update when you pick up or finish a task (PR welcome).
> Project context: the full spec lives with the site team (`BLUEPRINTS_CONTEXT.md` in the dev-docs repo). Timeline dates in [CONTRIBUTING.md](CONTRIBUTING.md).

**Last updated:** 2026-09-02

---

## Timeline & Milestones

| Date | Milestone |
|------|-----------|
| **Aug 27** | PR progress deadline (show meaningful work) |
| **Sept 20** | DevDocs new app launch (external constraint) |
| **Sept 27** | Brandon's migration deadline (confident if Max starts now) |
| **Sept 29** | **Public launch target** (repo goes public, Blueprints live) |
| Mid-October | Zoomtopia (secondary launch window if needed) |

**V1 scope:** 10-12 Blueprints, non-logged-in state only

---

## Decisions Locked

### Sept 2 sync

- **Demo videos: 30 seconds to 6 minutes.** Must be professional, outcome-focused. Focus on the output/result, not setup or config.
- **Video intro formula standardized.** Every video opens with: name + hook, tech explanation, what you built, transition to demo. Multiple example scripts in STYLE_GUIDE.md.
- **Zoom Developers bumper required.** 3-second bumper at start and end of every video. Jen will add during upload if needed.
- **Gold standards updated.** Removed `difficulty` field from frontmatter and `architecture.mmd` files. Validation script updated.
- **"Live Demo" button → "Video Demo"** to avoid confusion about hosting requirements. Michael handling.
- **Screenshots are non-negotiable.** UI showing the app in action required for every blueprint.
- **AI encouraged for drafting** but human review required for style guide compliance (no em dashes, etc.).

### Aug 26 sync

- **Blueprints are use case-focused, not product-focused.** One blueprint per product per use case. Meeting SDK and Video SDK versions of same use case = separate blueprints.
- **V1 is non-logged-in state only.** Login = future iteration.
- **V1 is internal team only.** External contributors = V2. External contributions will be a separate collection (partner/submitted Blueprints).
- **Blueprints must NOT become a DevDocs publish dependency.**
- **Agent-first, platform-agnostic approach.** Accessible beyond just developers; designed to be found via Google/Claude search, not just site navigation.
- **Manifest parameters that don't apply can be omitted.**
- **Docker files required for all Blueprints.** Platform-agnostic deployment standard.
- **Author bylines pulled from GitHub user, displayed at top of each Blueprint page.**
- **All out-of-domain changes require PR process.**

### Aug 19 sync

- **Blueprint = declarative/prescriptive gold standard, distinct from tutorial.** See [What a Blueprint Is](STYLE_GUIDE.md#what-a-blueprint-is-and-what-it-isnt) in STYLE_GUIDE.md
- **Intro structure locked.** See [The Intro Block](STYLE_GUIDE.md#the-intro-block-field-by-field) in STYLE_GUIDE.md
- **Code = Input/Output/Invariants contracts.** Stack-agnostic format for business logic. Security-critical code stays concrete.
- **Zoom license prerequisites required.** Every blueprint must state the required Zoom plan/entitlement in "What you'll need"
- **Platform-agnostic Dockerfile required.** Every sample repo must include a Dockerfile
- **Demo video required.** Screen recording (30s-2min). No face, no voice, no editing required.
- **Sample code follows Max's OSS standards.** Link to repo, don't duplicate code that will drift

### Aug 5–10

- **MVP launch scope: 10-12 blueprints.** Flagship exemplars are `realtime-sales-coach` and `ai-meeting-notetaker`
- **Four required sections per blueprint:** Features, Architecture, Implementation Guide, App Manifest
- **Taxonomy is use case + industry vertical, not Zoom product.** Products are tags
- **Interactive live demos (hosted instances) are optional.** Demo *videos* ARE required.
- **Blueprint images live with the blueprint** (`blueprints/<slug>/images/`), referenced by relative path

---

## Where We Are

- ✅ Content pipeline is end to end: author in this repo → renders on developers.zoom.us at build time
- ✅ Repo foundation: template, taxonomy, collections, validation + CI, contribution docs
- ✅ **Gold standards complete:** `realtime-sales-coach` and `ai-meeting-notetaker` ready to ship (need cover image + GitHub author link fixes)
- ✅ **STYLE_GUIDE.md + CONTRIBUTING.md overhauled**
- ✅ **Local preview is live:** [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
- ✅ **Repository access granted to all contributors**
- ✅ **Brandon sync completed:** Integration path defined, Max assigned as migration bridge
- ✅ **Site rendering fixes:** Code block formatting, partner icon fallback, Mermaid text clipping improved
- 🟡 **Meeting cadence:** Wednesdays 9am PT (60 min dedicated sync) + 15-20 min in Tuesday team meetings
- 🟡 **DevDocs refresh integration:** Brandon confident in Sept 27 deadline if Max starts now. Work may stay in branch until main app launches Sept 20.
- 🟡 Branch protection partial: full enforcement blocked until repo goes public (Sep 29)
- ⚠️ **Blocker:** Credential scan recursion if subdirectories grow (could block site builds)

---

## Contributor Progress

| Contributor | Blueprint(s) | Status |
|-------------|--------------|--------|
| **Jen Brissman** | Real-Time Sales Coach, AI Meeting Notetaker | ✅ 100% complete. Gold standards updated (difficulty removed). |
| **Ekaansh Arora** | Video SDK Telehealth Waiting Room | ✅ Blueprint complete. 5-minute polished animated video done. Needs to add standardized intro (~30 sec) and Zoom Developers bumper. |
| **Ticorrian Heard** | Live Sentiment Analysis | PR submitted (#22), validation passing. Needs to expand demo video beyond 15 seconds. Keeping both server-side (RTMS) and client-side (LTT) approaches in one blueprint. |
| **Jeremy Wright** | Zoom Scheduler (ISV sample), Rivet Starter | Nearly ready with Rivet Starter blueprint. Scheduler blueprint pending PM approval. |
| **Pranjal Pandey** | CRM Integration (Contact Center) | Demonstrated custom CRM app using Zoom Contact Center APIs. Cloud token issue resolved; ready to submit PR. |
| **Rehema Armorer** | Customer Experience App, AI Services + Contact Center RTMS | Rough draft for CX app. Committed to Sept 16 deadline for new AI services blueprint. Needs to match style guide and add screenshots. |
| **Max Mansfield** | Real-time compliance advisor, Embed meetings into website + DevDocs migration bridge | In progress. Needs to add photos/videos and apply structural changes per updated guidance. |
| **Chun Siong Tan** | Multiple PRs submitted | Polishing: screenshots and editor snippets done. Needs details and videos. Dockerfile in progress. |
| **Donte Small** | Manifest verification script | Script ready; PR submission pending |
| **Boon Jun Tan** | TBD | Committed to contributing; blueprint selection pending |
| **Gianni Latange** | TBD | Committed to contributing; blueprint selection pending |

---

## V1 Blueprint Pipeline

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Real-Time Sales Coach | Jen | ✅ Done |
| AI Meeting Notetaker | Jen | ✅ Done |
| Video SDK Telehealth Waiting Room | Ekaansh | ✅ Blueprint done, video needs intro + bumper |
| Live Sentiment Analysis | Ticorrian | PR submitted (#22), needs video expansion |
| Rivet Starter (ISV) | Jeremy | Nearly ready |
| Zoom Scheduler ISV Sample | Jeremy | Pending PM approval |
| CRM Integration (Contact Center) | Pranjal | Blocked on cloud tokens |
| Customer Experience App | Rehema | Rough draft |
| AI Services + Contact Center RTMS | Rehema | Sept 16 deadline |
| Real-time compliance advisor | Max | In progress, needs photos/video |
| Embed meetings into website | Max | In progress |
| Chun Siong's PRs | Chun Siong | Polishing |

---

## Blueprint Signup

**Everyone commits to at least 2 blueprints.** Add your name below.

### Conversation Intelligence (RTMS → AI)

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Real-time sales coach | Jen | Done |
| AI meeting notetaker | Jen | Done |
| Real-time compliance advisor in meetings | Max | In Progress |
| Transcripts → LLM (OpenAI / Claude) | Chun Siong | In progress |
| Transcripts quickstart | Chun Siong | In progress |
| Live sentiment analysis in meetings | Ticorrian | Claimed |

### Conversation → Business Systems

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Transcripts → CRM (Salesforce) | — | Unclaimed |
| Transcripts → MCP server | Chun Siong | In progress |
| Archive to cloud (AWS S3) | Chun Siong | In progress |

### Voice Agents & Real-Time Audio

| Blueprint | Owner | Status |
|-----------|-------|--------|
| OpenAI voice agent in Zoom Meetings | Chun Siong | In progress |
| OpenAI voice agent (Video SDK) | — | Unclaimed |
| Gemini Live voice agent (Video SDK) | Ticorrian | In progress |

### Healthcare & Telehealth

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Telehealth waiting room | Ekaansh | In progress |
| Clinical notes from telehealth | — | Unclaimed |

### Embed Video

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Video chat app (React/Next.js) | Ticorrian | In progress |
| Embed meetings into website | Max | In Progress |

### Media Intelligence & Safety

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Deepfake detection in meetings | Chun Siong | In progress |

### Partners & ISV Integrations

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Zoom Scheduler (ISV sample) | Jeremy | In progress |

### Contact Center

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Remote Admin Control for Agent Engagements | Rehema | Committed |
| CRM Experience / Managing Contacts | Rehema | Committed |

### Agents & Automation

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Meeting follow-up agent with human approval | Donte | In progress |


### Contact Center Ecosystem 

| Blueprint | Owner | Status |
|-----------|-------|--------|
| Admin remote access to agent engagement | Rehema | Claimed |
| CRM Contact Management | Rehema/Pranjal | Claimed |

---

## Open Tasks

### Building the Library (Infrastructure & Platform)

*Most contributors don't need to worry about these. This is platform/integration work.*

| Task | Owner | Status |
|------|-------|--------|
| DevDocs migration: scaffold Blueprints feature in new app branch | Max | Starting now |
| Create Jira ticket for Blueprints feature migration | Brandon | This week |
| Security review + TestZoom approval for new app integration | Brandon | Pending |
| Author byline at TOP of each Blueprint page (pull GitHub user info) | Michael | Pre-launch |
| Content container width expansion (Clay's feedback) | Michael | Pre-launch |
| Persistent Dev Forum footer on each Blueprint page | Michael | Pre-launch (Jen to write language) |
| Blueprint homepage clarity and discoverability | Jen / Michael | Pre-launch |
| Amplitude tracking for Blueprint clicks | Jen | Pre-launch |
| Agent-skill generation workflow (consult LLM Gateway team) | Chun Siong | Scoping |
| Mermaid chart refinement | Michael | Pre-launch |
| Manifest copy/download button on Blueprint pages | Michael | Pre-launch |
| One-click deploy buttons (render `deploy` field from frontmatter) | Michael | Pre-launch |
| Content sanitation & validation for external repos (V2) | Brandon | Future |
| Credential scan recursion if subdirectories grow | — | ⚠️ Blocker identified |

### Writing the Books (Content Creation)

*This is what the team should focus on day-to-day.*

| Task | Owner | Status |
|------|-------|--------|
| Add standardized intro (~30 sec) + Zoom Developers bumper to telehealth video | Ekaansh | Pending |
| Expand sentiment analysis video beyond 15 seconds; follow video formula | Ticorrian | Pending |
| Add photos, videos, and structural changes per updated guidance | Max | Pending |
| Update CX draft to match style guide; add screenshots | Rehema | Pending (Sept 16 deadline for AI services blueprint) |
| Submit CRM integration PR | Pranjal | Ready |
| Finalize Rivet Starter blueprint | Jeremy | Nearly ready |
| Fill in details, screenshots, videos for PRs; ping Jen when ready | Chun Siong | In progress |
| Add Dockerfile for easy deployment | Chun Siong | In progress |
| Submit PR for manifest verification script | Donte | Pending |
| Cover images for gold standard Blueprints | Jen | This week |
| Rename "Live Demo" button to "Video Demo" | Michael | Pending |
| Select blueprint topic and claim in PROJECT.md | Boon Jun | Pending |
| Select blueprint topic and claim in PROJECT.md | Gianni | Pending |

---

## DevDocs Refresh Integration

*From Brandon sync Aug 26*

**Integration confirmed.** Brandon Abajelo is onboard and will handle migration into the new app.

### Architecture
- New app uses Prism + Tailwind CSS; Blueprint components will be rebuilt there
- Moving from generation scripts to proper server-side capabilities
- Current architecture (pull from GitHub markdown, generate JSON similar to blog) will be replicated
- Blueprints must NOT become a DevDocs publish dependency
- External contributions require content sanitation & validation
- New app features must go through security review + TestZoom

### Ownership
- **Brandon Abajelo:** Jira ticket, security reviews, integration oversight
- **Max Mansfield:** Bridge between Blueprints team and new app; scaffolding in branch

### What Brandon Needs (sent today)
- ✅ Data model documentation
- ✅ GitHub content structure & API endpoints
- ✅ Authentication requirements for GitHub access

### Discovery Strategy
- **Primary:** Google/Claude search (agent-first, not navigation-first)
- **Secondary:** DevDocs search and app bar placement

### Timeline
- Brandon confident in Sept 27 deadline if Max starts now
- Work may stay in branch initially, merge after main app launches Sept 20

---

## Completed (Sept 2)

- ✅ Video guide expanded in STYLE_GUIDE.md with prescriptive intro/outro formula and multiple example scripts
- ✅ Zoom Developers bumper requirement added to style guide
- ✅ Gold standards updated: removed `difficulty` field from ai-meeting-notetaker and realtime-sales-coach
- ✅ Validation script updated: removed `difficulty` from required fields
- ✅ Ticorrian's PR (#22) passing validation after rebase
- ✅ Ekaansh's telehealth PR (#17) reviewed - blueprint complete, video polish needed
- ✅ Pranjal's cloud token issue resolved; ready to submit PR

## Completed (Aug 20–26)

- ✅ Repository access granted to all contributors
- ✅ Code block formatting fixed (white text on gray)
- ✅ Partner icon fallback fixed (broken logos)
- ✅ Mermaid chart text clipping improved
- ✅ Style guide locked in
- ✅ Brandon sync completed; integration path defined
- ✅ Max assigned as migration bridge
- ✅ Timeline confirmed: Sept 29 public launch, Sept 27 migration deadline
- ✅ Data model + GitHub content structure sent to Brandon
- ✅ Lock editorial review & content standards → [STYLE_GUIDE.md](STYLE_GUIDE.md)
- ✅ Convert gold-standard blueprints to contracts format
- ✅ Overhaul STYLE_GUIDE.md + CONTRIBUTING.md

---

## Still Open / Unresolved

- Agent skill generation workflow (pending Chun Siong's LLM Gateway consultation)
- ⚠️ Credential scan recursion blocker if subdirectories grow
- Cover images for Jen's completed Blueprints
- GitHub author link fixes for Jen's Blueprints
- Content container width (pending DevDocs styling update)
- Amplitude/telemetry implementation
- Security approval process timeline for new app integration
- V2 external contribution acceptance parameters (not yet defined)

---

## Later (V2 / Post-Launch)

- External partner contributions (separate collection)
- Login-gated features
- Credential scan recursion handling
- Richer `ArchDiagram` component for complex flows beyond Mermaid
