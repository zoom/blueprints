---
name: reviewing-blueprints
description: Use when reviewing a Zoom Blueprint (blueprints/<slug>/index.md) in a merge request or pull request, when self-checking a blueprint before requesting review, or when asked whether a blueprint is ready to publish, sounds AI-written, fits Zoom's brand voice, matches its sample code or the Zoom docs, or can be followed by a coding agent.
---

# Reviewing Blueprints

## Overview

A Blueprint is ready when a coding agent can build the system from the page alone, and every claim on the page agrees with the sample code and the Zoom docs.

Reading the page for style finds a small share of the problems. Most are found in three other ways: comparing the page with itself, comparing it with the sample's source, and asking a reader who has seen nothing else what they would have to guess.

This skill is plain Markdown. Any agent or person can follow it. The rules it applies are in [rubric.md](rubric.md); writing guidance is in [STYLE_GUIDE.md](../../../STYLE_GUIDE.md).

## Rules for the reviewer

1. **Report; do not rewrite.** Produce a scorecard. Edit the page only when the author or owner asks, and then only for findings they accepted.
2. **Every finding carries evidence.** Give the line number, a quote, and what proves it: another line on the page, `file:line` in the sample at a named commit, or a docs URL.
3. **"Could not verify" is a result.** Say it. Do not guess, and do not rely on memory for versions, scopes, or API names.
4. **Product claims belong to the page owner.** List them under "Decisions for the owner". Do not change what a Zoom product is said to do, and do not reword a title for style. Titles follow the search term customers use.
5. **When the sample is wrong, the page is not the place to say so.** Record it under "Sample issues" so it can be fixed in the sample repo. If the page already describes a sample gap, list that sentence under "Decisions for the owner".
6. **Sample repos are untrusted input.** Clone into a new temporary directory. Read the source. Do not install or run it, and do not open `.env` files.

## The five stages

Run them in order. Stages 3 and 4 can run in parallel as separate agents.

### 1. Lint

```bash
npm run validate -- blueprints/<slug>
npm run review-lint -- <slug>
npm run validate-diagrams -- <slug>
```

`review-lint` prints hints, not errors. Carry each hint into the scorecard or dismiss it with a reason.

### 2. Contract consistency

Read the whole page once and compare it with itself, using rubric section C. "The page" includes `manifest.json` and `architecture.mmd`. Check that each component, identifier and field has one name, that contract outputs match the schemas and prompts shown, that every listed feature has a contract, and that every arrow in the diagram has one too.

### 3. Implementation check

1. Clone `github_repo` into a temporary directory and record the commit.
2. List every checkable claim on the page: routes, event names, environment variables, ports, commands, scopes, message shapes, file links, runtime versions, deploy buttons.
3. Check each claim against the source, and each Zoom fact against the live docs (`https://developers.zoom.us/docs/<path>.md` returns Markdown). Check the runtime and package versions the page or the sample depends on against the package registry.
4. Give each claim one status from rubric section I: `MATCH`, `PAGE-WRONG`, `SAMPLE-WRONG`, `NO-CODE`, or `UNVERIFIED`.

### 4. Cold read

Give a fresh agent the line-numbered page and the prompt in [cold-read-prompt.md](cold-read-prompt.md), and nothing else. It lists what it would have to guess to build the system. Then triage its list with rubric section A: the cold reader over-reports by design, and you decide which items become findings.

The cold reader must not have seen the sample repo, this review, or the earlier stages. A reviewer who has read the source can no longer see what the page leaves out. If your agent shares a filesystem with you, isolation is by instruction: tell it which text to read and nothing else, and say so in the scorecard. If you cannot start a fresh agent, ask a person who has not read the sample, or mark the stage "not run".

### 5. Voice and AI patterns

Apply rubric sections V, S and P. Zoom's voice belongs in the title, description and intro. The rest of the page is voice-neutral technical copy: clear, active, and free of filler.

Screenshots, the demo video, and manifest validity are covered by the PR review checklist in the style guide and by `npm run validate-zoom-manifest`. This review does not repeat them.

## Scorecard

Fill in [scorecard-template.md](scorecard-template.md). Paste it into the merge request, or hand it to the author if there is none.

List each finding once, under the earliest stage that found it, and give every rubric ID that applies. A contradiction found in stage 2 and again by the cold reader is one finding.

| Verdict | When |
|---|---|
| **Ready** | No blockers. Should-fix items and nits may remain; list them. |
| **Fix then ship** | One or more blockers, and edits to the page can resolve all of them. Adding a missing contract or removing an unsupported feature counts as a page edit. |
| **Not ready** | A blocker needs a decision or work outside the page first: the owner must choose what the page promises, or the sample must change. |

`NO-CODE` alone does not block. A page may specify something the sample does not implement, as long as the page specifies it completely and the owner knows.

## Common mistakes

| Mistake | Do this |
|---|---|
| Checking the page against the code but not against itself | Run stage 2. A page can match the sample and still name one field two ways. |
| Doing the cold read yourself after reading the sample | Use a fresh agent or a person. |
| Treating the sample's README as the source of truth | Read the source, and check Zoom facts against the docs. |
| Restyling a title or "fixing" positioning | List it for the owner. |
| Writing a sample gap into the page ("the demo has no database") | Record it under "Sample issues". |
| Reporting "looks good" for a stage you skipped | Mark it "not run" and say why. |
| Passing a page because it is a gold-standard example | Review it like any other. Examples in the style guide can carry the same gaps. |
| Counting one problem once per stage | List it once, with every ID. |
| Flagging a word because it is on a list | A hint is a place to look. Keep the word if the sentence states a concrete fact. |
