# Blueprint review rubric

Each check has an ID. Use the ID in the scorecard so a finding can be traced to its rule.

Severity:

- **Blocker**: an agent or developer following the page would build something wrong or get stuck.
- **Should fix**: unclear, inconsistent, or against the style guide, but a careful reader recovers.
- **Nit**: polish.

## C. Contract consistency (page against itself)

| ID | Check | Example of a failure |
|---|---|---|
| C1 | Each component has one name in the components table, the diagram, `architecture.mmd`, and the prose. | "Transcript access" in the table, "RTMS" in the diagram, "RTMS service" in the text. |
| C2 | A product name is not reused for a component of the app. | "RTMS" meaning both Zoom's product and the app's own service. |
| C3 | Each identifier has one name. Where the wire name differs, the page states the mapping. | `meeting_uuid`, `meetingId` and `meeting_id` with no sentence relating them. |
| C4 | Every field in a contract's **Output** matches the schema, prompt, or message shown for it. | Output lists `task`; the prompt returns `text`. |
| C5 | Every item under **Features** has a contract or a section that specifies it. | "Filler-word alerts" is listed and never described. |
| C6 | Each behaviour has one owner. | One section says the backend runs a timer; another says the panel triggers it. |
| C7 | Every invariant can be tested. It states a value or an observable behaviour. | "Handle missing names gracefully", "last N minutes", "minimum length". |
| C8 | Every acceptance criterion traces to an invariant or a step on the page. | A criterion about credentials the page never mentions. |
| C9 | Setup steps name their inputs: which variables, which secrets, which URL path. | "Generate secrets" without saying which variables take them. |
| C10 | One term per role or concept. | "seller" and "rep" for the same person in consecutive sentences. |
| C11 | Sections stand alone. No "see above" or "as before" across sections. | "the scopes above" three sections later. |
| C12 | Numbers and keys agree wherever they appear: intervals, limits, versions, ports, storage keys. | A counter that restarts per stream, used in a storage key scoped to the meeting. |
| C13 | `manifest.json` agrees with the page: scopes, event subscriptions, and SDK APIs. | The scopes table marks a scope required; the manifest does not list it. |
| C14 | Every flow has a stated trigger: what starts it, and who or what calls it. | "When transcription starts, Zoom sends a webhook" with nothing that starts transcription. |
| C15 | Every arrow in the diagram has a contract: transport, payload, and authentication between the two components. | "forward" and "segments" arrows between two services with no endpoint or payload. |
| C16 | Every message type shown has its payload shown. | `{ type: 'sales_signals', data }` with `data` undefined. |

## I. Implementation check (page against sample and docs)

Give every checkable claim one status.

| Status | Meaning | What to do |
|---|---|---|
| `MATCH` | The source or the docs confirm it. | Nothing. |
| `PAGE-WRONG` | The source or the docs contradict it. | Finding, with the correct value and its `file:line` or URL. |
| `SAMPLE-WRONG` | The page describes the intended build; the sample falls short or contradicts the docs. | Record under "Sample issues". Do not edit the page to describe the gap. |
| `NO-CODE` | The page specifies something the sample does not implement. | Record it. The page becomes the only specification, so stage 2 and stage 4 matter more for that section. |
| `UNVERIFIED` | You could not check it. | Say why. |

| ID | What to check | Where |
|---|---|---|
| I1 | Routes, event names, message types and payload shapes | Sample source |
| I2 | Environment variable names and which are required | Sample config code and README (never a `.env` file) |
| I3 | Ports, commands, service names | Compose files, package scripts |
| I4 | Runtime and package versions | Sample `package.json`, lockfile, Dockerfile, and the package registry |
| I5 | Links into the sample repo resolve at the recorded commit | Sample tree |
| I6 | Every deploy button has its config file in the sample | `render.yaml`, `railway.json` |
| I7 | Scopes, event names, licensing, settings paths, client versions | Live Zoom docs |
| I8 | The sample's README agrees with the Zoom docs on access and app setup | Both |
| I9 | Code shown on the page matches the sample, or is clearly marked as a pattern | Sample source |
| I10 | Security-critical code on the page is complete: header names, signature check, replay window, timing-safe compare, token validation | Page and sample |
| I11 | Every route the diagram shows is authenticated in the sample, including service-to-service routes | Sample source |
| I12 | Dependency drift in the sample: an unpinned package whose latest version needs a newer runtime than the sample's image | Sample `package.json`, Dockerfile, registry. Record as a sample issue. |

Record the sample commit you read. A review without a commit hash cannot be repeated.

## A. Agent readiness (cold read)

The cold reader's list is the evidence. It over-reports by design, so triage every item: accept it as a finding, or reject it with a reason.

| ID | Kind | Counts as |
|---|---|---|
| A1 | **Blocking guess**: the reader must invent a name, a message shape, a contract between two components, or an owner | Blocker |
| A2 | **Contradiction**: two parts of the page disagree | Blocker |
| A3 | **Same thing, different names** | Should fix |
| A4 | **Promised but unspecified** feature | Blocker if it is in Features |
| A5 | **Pick a value**: a number or default is missing and no obvious one exists | Should fix |
| A6 | **Minor guess** with an obvious default | Nit |
| A7 | **Linked out**: the page sends the reader elsewhere for something needed to build | See below |

Triage rules:

- **A7 is acceptable** when the link goes to the specific Zoom docs page that answers the question, because blueprints link to docs and do not copy them. It is a finding when the link goes to a sample repo for something the page should specify, or to a docs landing page.
- **Reject** an item when the page does answer it and the reader missed it. Note the line. If two readers miss the same line, the page is unclear there.
- **Stack choices are not gaps.** A blueprint is stack-agnostic, so "which database" is not a finding. "What is stored and under which key" is.

- **Merge duplicates** and reclassify where the reader's tier is wrong. An item that blocks only one stack ("blocking for stacks without an SDK") counts once, as A7.

The score is the count of accepted A1, A2 and A4 items after triage. Zero is the target. Report the raw count and the A5 count beside it. Track them per blueprint over time.

## V. Zoom brand voice

Source: Zoom Verbal Guidelines (2026). Zoom's voice has four traits. Technical guidance uses a light voice: the headline and first paragraph carry it, and technical copy is voice-neutral.

**Where the voice applies:** title, description, and the intro before the first heading. Everywhere else, aim for clear and neutral.

| ID | Trait | In a blueprint this means | Not this |
|---|---|---|---|
| V1 | **Confident**: assured, not arrogant | State what the system does. "The panel shows cues while the prospect is still talking." | Hedging ("could help", "may be able to"), overpromising, bravado. |
| V2 | **Human**: straightforward, not plain | Write how people talk. Define a term the first time it appears. | Buzzwords, stacked jargon in the intro, robotic phrasing ("Error 404. Page unavailable."). |
| V3 | **Empowering**: helpful, not pandering | Lead with what the reader ends up with, then the product. Action over hype. | Opening on the product ("Zoom offers a comprehensive suite of…"). |
| V4 | **Clever**: smart, not snarky | Use restraint. In a blueprint this is close to zero. | Puns, jokes, exclamation marks, a forced callback. |

Watch list:

| ID | Check |
|---|---|
| V5 | **AI and people.** Zoom's AI supports people; it does not replace them. Do not call a product a "digital teammate" or "virtual coworker". "Agent" is an accepted industry term. When a page gives software a human job title (coach, advisor, notetaker), list it as a decision for the owner. |
| V6 | **"Impact".** Try affect, effect, result, or outcome first. |
| V7 | **Filler words**: even, fairly, just, much, only, pretty, quite, rather, really, simply, so, totally, very. Cut one when the sentence means the same without it. Keep "only" and "rather than" when they carry meaning. |
| V8 | **Filter words** that put distance between the reader and the point: seem, appear, think, believe, realize, notice. Literal uses are fine ("the panel appears"). |
| V9 | **Active verbs.** Replace passive, wordy phrasing with a direct verb and a named actor. |
| V10 | **Too far.** Slang and hype in the voice zone: "brings the fire", "buckle up", "powerhouse". |
| V11 | **Authorship.** The author stands behind every line. Verify each factual claim, and never ship an invented quote, statistic, or customer. |

Brand words are not banned. "Empower", "seamless", and "streamline" appear in Zoom's own examples. Flag one only when the sentence makes no concrete claim.

## S. AI-sounding patterns

From [STYLE_GUIDE.md](../../../STYLE_GUIDE.md), plus patterns found in review.

| ID | Pattern | Example | Fix |
|---|---|---|---|
| S1 | Em dash | "surfaces signals — while you can act" | Period, semicolon, or colon |
| S2 | Binary contrast | "Real-Time, Not Post-Call" | Say what it does |
| S3 | Dramatic kicker | "The intelligence layer is yours to build." | Cut it |
| S4 | Marketing header | "The No-Bot Advantage" | A plain technical header |
| S5 | Synonym cycling | agent, assistant, tool for one thing | Repeat the right word (also C10) |
| S6 | Recap ending | A last paragraph that restates the page | End on the last concrete point |
| S7 | Colon reveal | "The best part: it learns." | A plain sentence |
| S8 | Importance puffery | "plays a vital role", "marks a pivotal moment" | State the fact |
| S9 | Trailing "-ing" clause that explains nothing | ", highlighting its flexibility" | State the consequence or cut |
| S10 | Filler transition | "Let's dive in." | Cut, or name what comes next. The one transition sentence that the style guide requires at the end of the intro is exempt. |
| S11 | Unsourced authority | "experts agree", "studies show" | Name the source or cut |
| S12 | Decorative formatting | Bold scattered mid-sentence, a header over two sentences | Format follows content |

## P. Product claims (flag for the owner; never edit)

List any sentence that asserts one of these, whether or not it looks wrong:

| ID | Claim type | Note |
|---|---|---|
| P1 | What a Zoom product does or does not do | For example, whether an app "records" or "accesses" meeting content. |
| P2 | Latency or performance figures | Prefer "near real time" unless the figure is in the Zoom docs. |
| P3 | Licensing, pricing, plans, and access requirements | Check against the docs; the owner confirms. |
| P4 | Compliance, legal, or consent guidance | Describe what the product enables. Do not prescribe how to comply. |
| P5 | Roadmap or future features | Do not publish. |
| P6 | Partner status or comparisons with other vendors | Owner confirms wording. |
| P7 | Title, `seo_title`, `seo_keywords` | Set by search terms. Report a mismatch between them; do not restyle. |
