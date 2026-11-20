#!/usr/bin/env node
'use strict';

// review-lint: prose hints for blueprint review.
//
// This is the mechanical first stage of the review described in
// .claude/skills/reviewing-blueprints/SKILL.md. It never fails a build unless
// --strict is passed: every line it prints is a place for a reviewer to look,
// not a verdict. Structure, front matter and images are checked by validate.js.

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const BLUEPRINTS_DIR = path.join(ROOT, 'blueprints');
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// Each rule: id, level (warn = style guide rule, info = look and decide),
// a global regex, and the hint shown to the reviewer.
const RULES = [
  {
    id: 'em-dash',
    level: 'warn',
    pattern: /—/g,
    hint: 'Em dash. Use a period, semicolon or colon (STYLE_GUIDE: Avoid AI-sounding patterns).',
  },
  {
    id: 'exclamation',
    level: 'warn',
    pattern: /[A-Za-z)]!(?=\s|$)/g,
    hint: 'Exclamation mark in prose (Zoom voice: skip).',
  },
  {
    id: 'ai-as-human',
    level: 'warn',
    pattern: /\b(?:digital|virtual|ai)\s+(?:teammate|co-?worker|colleague|employee)s?\b/gi,
    hint: 'Describes AI as a person. Zoom voice: AI supports people; it does not replace them.',
  },
  {
    id: 'latency-figure',
    level: 'warn',
    pattern: /\bsub-(?:second|\d+\s?ms)\b|\b\d+\s?(?:-|to)\s?\d+\s?ms\b|\bunder a second\b/gi,
    hint: 'Latency figure. Say "near real time" unless the number is sourced from Zoom docs.',
  },
  {
    id: 'filler',
    level: 'info',
    pattern: /\b(?:just|simply|really|very|quite|totally|fairly|basically|actually)\b/gi,
    hint: 'Filler word. Cut it unless it carries meaning.',
  },
  {
    id: 'hype',
    level: 'info',
    pattern: /\b(?:powerful|seamless(?:ly)?|effortless(?:ly)?|revolutionary|game-chang\w+|best-in-class|world-class|cutting-edge|supercharge\w*|unlock\w*|robust)\b/gi,
    hint: 'Hype word. Keep only if the sentence also states a concrete fact.',
  },
  {
    id: 'impact',
    level: 'info',
    pattern: /\bimpact(?:s|ed|ful|ing)?\b/gi,
    hint: '"Impact" is on the Zoom watch list. Try affect, effect, result or outcome.',
  },
  {
    id: 'vague-spec',
    level: 'info',
    pattern: /\b(?:gracefully|appropriately|as needed|as appropriate|properly|sensible defaults?|last N \w+|some time|and so on|etc\.?)(?=\W|$)/gi,
    hint: 'Vague instruction. An agent has to guess; state the value or the behaviour.',
  },
  {
    id: 'positional-ref',
    level: 'info',
    pattern: /\b(?:see above|as above|mentioned above|described above|as before|see below|mentioned earlier|as noted earlier)\b/gi,
    hint: 'Positional reference. Name the section or repeat the value so the text stands alone.',
  },
];

// Replace fenced code, inline code, HTML comments and link targets with spaces
// of the same length so line and column positions stay true to the file.
function maskNonProse(text) {
  const blank = (match) => match.replace(/[^\n]/g, ' ');
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/`[^`\n]*`/g, blank)
    .replace(/\]\([^)\n]*\)/g, (m) => ']' + blank(m.slice(1)));
}

function lintProse(text) {
  const findings = [];
  const lines = maskNonProse(text).split('\n');
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      let match = rule.pattern.exec(line);
      while (match !== null) {
        findings.push({
          rule: rule.id,
          level: rule.level,
          line: index + 1,
          text: match[0].trim(),
          hint: rule.hint,
        });
        match = rule.pattern.exec(line);
      }
    }
  });
  return findings;
}

const words = (value) =>
  String(value).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// Titles are chosen for the search term customers use. The lint only checks
// that the title still carries one of the page's own keywords; it never
// suggests a rewording.
function checkTitle(data = {}) {
  const findings = [];
  const keywords = Array.isArray(data.seo_keywords) ? data.seo_keywords : [];
  if (typeof data.title !== 'string' || keywords.length === 0) {
    findings.push({
      rule: 'seo-title',
      level: 'info',
      line: 1,
      text: 'title / seo_keywords',
      hint: 'No title or seo_keywords to compare. Confirm the target search term with the page owner.',
    });
    return findings;
  }
  const titleWords = new Set(words(data.title));
  const covered = keywords.some((kw) => words(kw).every((w) => titleWords.has(w)));
  if (!covered) {
    findings.push({
      rule: 'seo-title',
      level: 'info',
      line: 1,
      text: data.title,
      hint: 'Title does not contain all the words of any seo_keywords entry. Confirm the search term with the page owner; do not restyle the title.',
    });
  }
  return findings;
}

const normaliseDiagram = (text) =>
  text
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '' && !l.trim().startsWith('%%'))
    .join('\n');

function checkDiagramCopy(raw, mmd) {
  if (typeof mmd !== 'string') return [];
  const fence = /^```mermaid[^\n]*\n([\s\S]*?)^```/m.exec(raw);
  if (!fence) return [];
  if (normaliseDiagram(fence[1]) === normaliseDiagram(mmd)) return [];
  const line = raw.slice(0, fence.index).split('\n').length;
  return [{
    rule: 'diagram-copy',
    level: 'warn',
    line,
    text: 'architecture.mmd',
    hint: 'architecture.mmd differs from the first mermaid diagram on the page. Keep them identical.',
  }];
}

function lintBlueprint(dir) {
  const file = path.join(dir, 'index.md');
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const mmdPath = path.join(dir, 'architecture.mmd');
  const mmd = fs.existsSync(mmdPath) ? fs.readFileSync(mmdPath, 'utf8') : undefined;

  // Lint the description and the body. Mask the rest of the front matter so
  // line numbers still point into the real file.
  const bodyStart = raw.length - parsed.content.length;
  const frontMatter = raw.slice(0, bodyStart).replace(/[^\n]/g, ' ');
  const findings = [
    ...checkTitle(parsed.data),
    ...lintProse(frontMatter + parsed.content),
    ...checkDiagramCopy(raw, mmd),
  ];
  if (typeof parsed.data.description === 'string') {
    for (const f of lintProse(parsed.data.description)) {
      findings.push({ ...f, line: 1, text: `description: ${f.text}` });
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

function resolveSlugs(args) {
  if (args.length === 0) {
    return fs.readdirSync(BLUEPRINTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
      .map((e) => e.name)
      .sort();
  }
  return args.map((arg) => {
    // Accept "slug" or "blueprints/slug"; reject anything that is not a plain
    // slug so a path argument cannot leave the blueprints directory.
    const slug = path.basename(arg.replace(/[\\/]+$/, ''));
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(`not a blueprint slug: ${arg}`);
    }
    const dir = path.resolve(BLUEPRINTS_DIR, slug);
    if (path.dirname(dir) !== BLUEPRINTS_DIR || !fs.existsSync(path.join(dir, 'index.md'))) {
      throw new Error(`no blueprint found for: ${arg}`);
    }
    return slug;
  });
}

function main(argv) {
  const strict = argv.includes('--strict');
  const args = argv.filter((a) => !a.startsWith('--'));
  let slugs;
  try {
    slugs = resolveSlugs(args);
  } catch (error) {
    console.error(`ERROR ${error.message}`);
    return 2;
  }

  let warnings = 0;
  let infos = 0;
  for (const slug of slugs) {
    let findings;
    try {
      findings = lintBlueprint(path.join(BLUEPRINTS_DIR, slug));
    } catch (error) {
      console.error(`ERROR ${slug}: ${error.message}`);
      return 2;
    }
    if (findings.length === 0) {
      console.log(`  OK    ${slug}`);
      continue;
    }
    console.log(`  LOOK  ${slug}`);
    for (const f of findings) {
      if (f.level === 'warn') warnings += 1; else infos += 1;
      console.log(`        ${slug}/index.md:${f.line}  ${f.level.padEnd(4)}  ${f.rule}  "${f.text}"  ${f.hint}`);
    }
  }
  console.log(`\n${slugs.length} blueprint(s): ${warnings} warning(s), ${infos} hint(s). Hints are places to look, not errors.`);
  return strict && warnings > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { lintProse, checkTitle, checkDiagramCopy, maskNonProse, resolveSlugs };
