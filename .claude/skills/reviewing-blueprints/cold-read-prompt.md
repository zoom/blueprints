# Cold-read prompt

## For the reviewer

1. Start a fresh agent with no access to this repository, the sample repo, or your review notes.
2. Send it the prompt in the next section, followed by the page with line numbers, counted from the first line of the file including front matter (`cat -n blueprints/<slug>/index.md`).
3. If the blueprint has a `manifest.json`, append it under its own heading.
4. Triage what comes back using rubric section A. The cold reader over-reports by design; you decide which items become findings.

## Prompt

You are a coding agent. A developer has given you the page below and asked you to add this capability to their existing product. Their stack may differ from the one on the page. The page is all you have.

Do not write code. Do not browse the web or open any repository. Do not use knowledge of the sample app the page links to.

You may know the platform in general. Even so, treat anything that is not written on the page as missing, and add "(general platform knowledge would cover this)" where that is true. When the page links out for something you need, report it and name the link.

Read the page from start to finish, then report in these six sections. Put each item in one section only: a disagreement between two lines goes in section 2, and a feature with no instructions goes in section 4.

**1. Guesses.** Everything you would have to invent or assume in order to build this.

| Line | Quote | What is missing or unclear | Tier |
|---|---|---|---|

Tiers:

- **Blocking**: you must invent a name, a message shape, a contract between two components, or who owns a behaviour.
- **Pick a value**: the design is clear, but a number or default is missing and no obvious one exists.
- **Minor**: an obvious default exists.

Mark gaps that affect only setup of the linked reference app as "(reference setup)".

**2. Contradictions.** Places where two parts of the page disagree: field names, numbers, who performs a step, message shapes.

| Lines | First quote | Second quote | Why they conflict |
|---|---|---|---|

**3. Same thing, different names.** Terms that you believe refer to one component, identifier, role, or concept.

| Terms (with lines) | Confidence they are the same |
|---|---|

**4. Promised but unspecified.** Anything in the feature list, the intro, or the acceptance criteria that the page never tells you how to build.

| Line | Promise | What is absent |
|---|---|---|

**5. What you could build with confidence.** At most six bullets.

**6. Three questions.** The three questions you would ask the author first.

Report only what you can point to. If a section of the page is clear, do not invent a concern about it.

PAGE (with line numbers):
