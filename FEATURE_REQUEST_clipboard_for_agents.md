# Feature Request: Copy Blueprint to Clipboard for Agents

**Status:** Ready for implementation
**Priority:** Nice-to-have for V1, recommended for V2
**Owner:** Dev Docs team
**Requested by:** Jen Brissman
**Date:** 2026-10-13

---

## Summary

Add a clipboard icon to each blueprint card on the `/blueprints` homepage. When clicked, it copies the **full blueprint content** (frontmatter + implementation guide + code snippets) as markdown to the user's clipboard. This allows developers to paste the entire blueprint into an AI agent (Claude, GPT, Cursor, Codex) for assistance.

**Tagline:** "Context for agents. Inspiration for humans."

---

## User Stories

1. **As a developer using Cursor/Copilot**, I want to copy a blueprint's full content so I can paste it into my AI assistant and get help implementing it in my codebase.

2. **As a developer using Claude/ChatGPT**, I want to copy a blueprint so I can ask questions about the implementation or get help customizing it.

3. **As a developer building an agent**, I want to programmatically fetch blueprint content via URL so my agent can reference Zoom implementation patterns.

---

## UX Design

### Clipboard Button on Blueprint Cards

- **Location:** Top-right corner of each blueprint card on `/blueprints`
- **Visibility:** Hidden by default, appears on hover
- **Icon:** Clipboard icon (📋) → Checkmark (✓) on success
- **Tooltip:** "Copy blueprint for agent"

### Interaction Flow

1. User hovers over blueprint card
2. Clipboard icon appears in top-right corner
3. User clicks icon
4. Full blueprint markdown copied to clipboard
5. Icon changes to checkmark for 2 seconds
6. Toast notification: "Blueprint copied to clipboard"

---

## Technical Implementation

### File Structure (in dev-docs repo)

```
dev-docs/
├── components/
│   └── blueprints/
│       ├── BlueprintCard.tsx          # Add clipboard button here
│       ├── CopyBlueprintButton.tsx    # New component
│       └── index.ts
├── utils/
│   └── generateBlueprintMarkdown.ts   # New utility
├── pages/
│   └── blueprints/
│       └── [slug].md.ts               # Optional: API route for .md access
```

---

### Component: CopyBlueprintButton.tsx

```tsx
import { useState } from 'react';
import { generateFullBlueprintMarkdown, BlueprintFull } from '../../utils/generateBlueprintMarkdown';

interface CopyBlueprintButtonProps {
  blueprint: BlueprintFull;
}

export function CopyBlueprintButton({ blueprint }: CopyBlueprintButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const markdown = generateFullBlueprintMarkdown(blueprint);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy blueprint:', err);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // Don't navigate to blueprint page
        e.stopPropagation();
        handleCopy();
      }}
      className="absolute top-2 right-2 p-2 rounded-md bg-white/90 hover:bg-white
                 opacity-0 group-hover:opacity-100 transition-all duration-200
                 shadow-sm hover:shadow-md z-10"
      title="Copy blueprint for agent"
      aria-label="Copy full blueprint markdown to clipboard"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
```

---

### Utility: generateBlueprintMarkdown.ts

```typescript
export interface BlueprintFull {
  // Frontmatter fields
  title: string;
  slug: string;
  description: string;
  stack?: string;
  github_repo?: string;
  demo_url?: string;
  products?: string[];
  estimated_time?: string;
  author?: string;
  seo_title?: string;
  seo_keywords?: string[];
  license_required?: boolean;

  // Full markdown body content
  content: string;
}

export function generateFullBlueprintMarkdown(blueprint: BlueprintFull): string {
  const lines: string[] = [];

  // --- YAML Frontmatter ---
  lines.push('---');
  lines.push(`title: "${escapeYaml(blueprint.title)}"`);
  lines.push(`slug: "${blueprint.slug}"`);
  lines.push(`description: "${escapeYaml(blueprint.description)}"`);

  if (blueprint.stack) {
    lines.push(`stack: "${blueprint.stack}"`);
  }
  if (blueprint.github_repo) {
    lines.push(`repo: "${blueprint.github_repo}"`);
  }
  if (blueprint.demo_url) {
    lines.push(`demo: "${blueprint.demo_url}"`);
  }
  if (blueprint.products?.length) {
    lines.push(`products: [${blueprint.products.map(p => `"${p}"`).join(', ')}]`);
  }
  if (blueprint.estimated_time) {
    lines.push(`estimated_time: "${blueprint.estimated_time}"`);
  }
  if (blueprint.author) {
    lines.push(`author: "${blueprint.author}"`);
  }
  if (blueprint.license_required !== undefined) {
    lines.push(`license_required: ${blueprint.license_required}`);
  }

  lines.push('---');
  lines.push('');

  // --- Full Blueprint Content ---
  lines.push(blueprint.content);

  // --- Footer with Quick Reference ---
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Quick Reference');
  lines.push('');
  lines.push(`- **Full Guide:** https://developers.zoom.us/blueprints/${blueprint.slug}`);

  if (blueprint.github_repo) {
    lines.push(`- **GitHub Repo:** ${blueprint.github_repo}`);
  }
  if (blueprint.demo_url) {
    lines.push(`- **Demo Video:** ${blueprint.demo_url}`);
  }

  // Add relevant documentation links based on products
  const docLinks = getDocLinks(blueprint.products || []);
  if (docLinks.length > 0) {
    lines.push('');
    lines.push('### Related Documentation');
    docLinks.forEach(link => {
      lines.push(`- [${link.label}](${link.url})`);
    });
  }

  return lines.join('\n');
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function getDocLinks(products: string[]): { label: string; url: string }[] {
  const links: { label: string; url: string }[] = [];

  if (products.includes('rtms')) {
    links.push({ label: 'RTMS Documentation', url: 'https://developers.zoom.us/docs/rtms/' });
  }
  if (products.includes('zoom-apps')) {
    links.push({ label: 'Zoom Apps Documentation', url: 'https://developers.zoom.us/docs/zoom-apps/' });
  }
  if (products.includes('video-sdk')) {
    links.push({ label: 'Video SDK Documentation', url: 'https://developers.zoom.us/docs/video-sdk/' });
  }
  if (products.includes('meeting-sdk')) {
    links.push({ label: 'Meeting SDK Documentation', url: 'https://developers.zoom.us/docs/meeting-sdk/' });
  }
  if (products.includes('team-chat')) {
    links.push({ label: 'Team Chat Documentation', url: 'https://developers.zoom.us/docs/team-chat/' });
  }

  return links;
}
```

---

### Usage in BlueprintCard.tsx

```tsx
import { CopyBlueprintButton } from './CopyBlueprintButton';
import { BlueprintFull } from '../../utils/generateBlueprintMarkdown';

interface BlueprintCardProps {
  blueprint: BlueprintFull;
}

export function BlueprintCard({ blueprint }: BlueprintCardProps) {
  return (
    <div className="group relative rounded-lg border border-gray-200 hover:border-gray-300
                    hover:shadow-lg transition-all duration-200 overflow-hidden">

      {/* Clipboard button - appears on hover */}
      <CopyBlueprintButton blueprint={blueprint} />

      {/* Card content */}
      <a href={`/blueprints/${blueprint.slug}`} className="block">
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-100 relative">
          <img
            src={`/blueprints/${blueprint.slug}/thumbnail.png`}
            alt={blueprint.title}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Text content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{blueprint.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{blueprint.description}</p>

          {/* Product tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {blueprint.products?.map(product => (
              <span
                key={product}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {product}
              </span>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {blueprint.estimated_time && (
              <span>{blueprint.estimated_time}</span>
            )}
            {blueprint.stack && (
              <span>{blueprint.stack}</span>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
```

---

### Data Fetching: Get Full Content

When loading blueprints for the homepage, include the full content:

```typescript
// lib/blueprints.ts
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

const BLUEPRINTS_DIR = path.join(process.cwd(), '..', 'blueprints', 'blueprints');

export async function getAllBlueprintsWithContent(): Promise<BlueprintFull[]> {
  const slugs = fs.readdirSync(BLUEPRINTS_DIR)
    .filter(name => !name.startsWith('_') && !name.startsWith('.'));

  return slugs.map(slug => {
    const filePath = path.join(BLUEPRINTS_DIR, slug, 'index.md');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    return {
      ...frontmatter,
      slug,
      content,
    } as BlueprintFull;
  });
}
```

---

## Bonus: URL-based Access for Agents

### API Route: /api/blueprints/[slug].md

Allow agents to fetch blueprint content directly via URL:

```typescript
// pages/api/blueprints/[slug].md.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getBlueprintBySlug } from '../../../lib/blueprints';
import { generateFullBlueprintMarkdown } from '../../../utils/generateBlueprintMarkdown';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (typeof slug !== 'string') {
    return res.status(400).send('Invalid slug');
  }

  const blueprint = await getBlueprintBySlug(slug.replace('.md', ''));

  if (!blueprint) {
    return res.status(404).send('Blueprint not found');
  }

  const markdown = generateFullBlueprintMarkdown(blueprint);

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(markdown);
}
```

**Usage:**
```
GET https://developers.zoom.us/api/blueprints/ai-meeting-notetaker.md
```

---

## Acceptance Criteria

- [ ] Clipboard icon appears on hover over blueprint cards
- [ ] Clicking icon copies full blueprint markdown to clipboard
- [ ] Visual feedback (checkmark + optional toast) confirms copy
- [ ] Copied content includes frontmatter, full implementation guide, and code snippets
- [ ] Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] Accessible: keyboard navigable, proper ARIA labels
- [ ] Optional: API endpoint serves blueprint as .md for programmatic access

---

## Notes

- Full blueprints are 10-20KB of text, which is fine for modern LLM context windows
- This feature positions Blueprints as "agent-ready" developer resources
- Consider adding analytics event to track clipboard usage
- Future: Add "Import to Cursor/Codex" deep link buttons

---

## Related

- Homepage hero copy: "Context for agents. Inspiration for humans."
- Collections/browse by theme design
- Blueprint metadata for SEO and agent discoverability
