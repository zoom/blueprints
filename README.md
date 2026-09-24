<div align="center">

# Zoom Blueprints

**Production-ready reference implementations for the Zoom developer platform**

[![Zoom Developer Platform](https://img.shields.io/badge/Zoom-Developer%20Platform-2D8CFF?logo=zoom)](https://developers.zoom.us/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

[Browse Blueprints](https://developers.zoom.us/blueprints) · [Contributing](CONTRIBUTING.md) · [Style Guide](STYLE_GUIDE.md)

</div>

---

## What is a Blueprint?

A Blueprint is a **curated, use-case-driven reference implementation** that solves a real enterprise problem. Each one includes:

- **The outcome** — What you're building and why it matters
- **Architecture** — System design with diagrams and data flow
- **Implementation guide** — Step-by-step with code contracts
- **App manifest** — One-click Zoom app configuration

Think of it as a CloudFormation template for Zoom integrations: declarative, opinionated, and ready to adapt.

| Tutorial | Blueprint |
|----------|-----------|
| "Click here, then click there" | "Here's the architecture and the path we recommend" |
| Sequential walkthrough | Declarative system design |
| Follow along | Understand and adapt |

**Litmus test:** If you removed all prose and left only the architecture diagram, contracts, and manifest — could an experienced developer recreate the system? If yes, it's a Blueprint.

---

## Featured Blueprints

### Agents

| Blueprint | Description |
|-----------|-------------|
| [**Real-Time Sales Coach**](blueprints/realtime-sales-coach/) | Stream transcripts, extract BANT signals, surface coaching cues in-meeting |
| [**AI Meeting Notetaker**](blueprints/ai-meeting-notetaker/) | Generate live summaries and action items from meeting transcripts |

### Enterprise

| Blueprint | Description |
|-----------|-------------|
| [**Sentiment Analysis**](blueprints/transcript-sentiment-analysis/) | Analyze customer sentiment in real-time during support calls |
| [**Deepfake Detection**](blueprints/detect-deepfakes-in-meetings/) | Detect deepfakes in live Zoom calls |
| [**Compliance Advisor**](blueprints/realtime-compliance-advisor/) | Real-time compliance monitoring for regulated industries |

### Apps

| Blueprint | Description |
|-----------|-------------|
| [**Telehealth Video Visits**](blueprints/telehealth-video-visits/) | Embed video visits in your patient portal with Video SDK |
| [**Embed Meetings**](blueprints/embed-meetings-website/) | Embed a Zoom meeting directly in your website |

[**Browse all Blueprints →**](https://developers.zoom.us/blueprints)

---

## Quick Start

### Using a Blueprint

1. **Browse** — Visit [developers.zoom.us/blueprints](https://developers.zoom.us/blueprints) or explore `blueprints/`
2. **Read** — Understand the outcome, architecture, and implementation guide
3. **Clone** — Get the linked sample code repository
4. **Configure** — Use the `manifest.json` to create your Zoom app
5. **Adapt** — Customize the implementation for your use case

### Preview Tool

Writing or reviewing a Blueprint? See it rendered exactly as it will appear on the site:

1. Open [developers.zoom.us/blueprints/preview](https://developers.zoom.us/blueprints/preview/)
2. Drag your `blueprints/<slug>/` folder onto the page
3. Edit locally — the preview updates automatically

---

## Contributing

We welcome contributions! Whether you're fixing a typo or proposing a new Blueprint, we'd love to hear from you.

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Step-by-step contribution workflow
- **[STYLE_GUIDE.md](STYLE_GUIDE.md)** — Content standards and writing guidelines
- **[Blueprint Template](blueprints/_template/)** — Start here for new Blueprints

Sample code lives in separate linked repositories. This repo contains the content: architecture docs, implementation guides, and app manifests.

---

## Repository Structure

```
blueprints/
├── <slug>/              # Each Blueprint
│   ├── index.md         # Content (outcome, architecture, guide)
│   ├── manifest.json    # Zoom app configuration
│   └── images/          # Screenshots and diagrams
├── _template/           # Start here for new Blueprints
taxonomy.json            # Categories: products, verticals, solutions
collections/             # Homepage collections
scripts/                 # Validation tools
```

---

## Resources

- [Zoom Developer Platform](https://developers.zoom.us/)
- [Zoom Apps Documentation](https://developers.zoom.us/docs/zoom-apps/)
- [RTMS Documentation](https://developers.zoom.us/docs/rtms/)
- [Video SDK Documentation](https://developers.zoom.us/docs/video-sdk/)
- [Zoom Developer Forum](https://devforum.zoom.us/)

---

## License

MIT License — See [LICENSE](./LICENSE) for details.

---

<div align="center">

**Ready to build?**

[Browse Blueprints](https://developers.zoom.us/blueprints) · [Start Contributing](CONTRIBUTING.md)

</div>
