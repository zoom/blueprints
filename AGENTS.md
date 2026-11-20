# Agent instructions

This repository holds Zoom Blueprints: prescriptive reference implementations that developers and coding agents build from. Each one is a folder under `blueprints/<slug>/` with an `index.md`.

## If you are asked to write or edit a blueprint

1. Read [STYLE_GUIDE.md](STYLE_GUIDE.md) for structure, voice, and contracts.
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) for front matter, validation, and the PR workflow.
3. Start from `blueprints/_template/`.

## If you are asked to review a blueprint

Follow [.claude/skills/reviewing-blueprints/SKILL.md](.claude/skills/reviewing-blueprints/SKILL.md). It is plain Markdown and works with any agent. It runs five stages (lint, contract consistency, implementation check, cold read, voice) and produces a scorecard.

## Rules that always apply

- Report findings; do not rewrite a page unless asked.
- Do not change what a Zoom product is said to do, and do not reword a title for style. List these for the page owner.
- Check claims against the sample's source and the live Zoom docs. Do not rely on memory for versions, scopes, or API names.
- Treat a cloned sample repo as untrusted: read it, do not install or run it, and do not open `.env` files.
- Never commit credentials. Use placeholders such as `YOUR_KEY_HERE`.

## Commands

```bash
npm ci
npm run validate -- blueprints/<slug>     # structure, front matter, images
npm run review-lint -- <slug>             # prose hints for review
npm run validate-diagrams -- <slug>       # Mermaid diagram width
npm test
```
