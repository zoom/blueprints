#!/usr/bin/env node
'use strict';

// Renders every ```mermaid block in a blueprint's index.md the way
// developers.zoom.us does and fails when a diagram is wider than the content
// column. The site scales wide diagrams down to fit, which makes the labels
// unreadable. See "Diagram layout" in STYLE_GUIDE.md.
//
// Needs two things that are not project dependencies:
//   - mermaid:  npm install --no-save mermaid@12.3.0
//   - Chrome or Chromium on this machine (set CHROME_PATH if it is not found)

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const BLUEPRINTS_DIR = path.join(ROOT, 'blueprints');

// Content column (824px) minus the diagram container's padding and border.
const DEFAULT_MAX_WIDTH = 790;
const MIN_MAX_WIDTH = 200;
const MAX_MAX_WIDTH = 4000;

// The mermaid version and settings the site renders with. Keep in sync with
// src/components/mdx/mermaid-diagram.tsx in the site's frontend.
const SITE_MERMAID_VERSION = '12.3.0';
const SITE_MERMAID_CONFIG = {
  securityLevel: 'strict',
  startOnLoad: false,
  flowchart: { rankSpacing: 80 },
  layout: 'dagre',
  theme: 'base',
  themeVariables: { fontSize: '14px' },
};
const FONT_STACK = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

const SLUG_PATTERN = /^[a-z0-9_][a-z0-9_-]*$/;
const RESULT_PATTERN = /<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/;
const RENDER_BUDGET_MS = 30000;
const CHROME_TIMEOUT_MS = 120000;

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

/** Returns the source of each ```mermaid fence, in document order. */
function extractDiagrams(markdown) {
  const diagrams = [];
  const fence = /^```mermaid[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm;
  let match;
  while ((match = fence.exec(markdown)) !== null) {
    const line = markdown.slice(0, match.index).split('\n').length;
    diagrams.push({ line, source: match[1] });
  }
  return diagrams;
}

/** Parses --max-width=N. Returns the default when the flag is absent. */
function parseMaxWidth(flags) {
  const flag = flags.find((f) => f.startsWith('--max-width='));
  if (!flag) return DEFAULT_MAX_WIDTH;
  const raw = flag.slice('--max-width='.length);
  if (!/^\d{1,5}$/.test(raw)) throw new Error(`--max-width must be a whole number, got "${raw}"`);
  const value = Number.parseInt(raw, 10);
  if (value < MIN_MAX_WIDTH || value > MAX_MAX_WIDTH) {
    throw new Error(`--max-width must be between ${MIN_MAX_WIDTH} and ${MAX_MAX_WIDTH}`);
  }
  return value;
}

/**
 * Turns a CLI argument (a slug or a path such as blueprints/<slug>) into a
 * blueprint directory. Rejects anything that is not directly inside blueprints/.
 */
function resolveBlueprintDir(arg, blueprintsDir = BLUEPRINTS_DIR) {
  const slug = path.basename(path.normalize(arg));
  if (!SLUG_PATTERN.test(slug)) throw new Error(`not a blueprint slug: "${arg}"`);
  const dir = path.resolve(blueprintsDir, slug);
  if (path.dirname(dir) !== path.resolve(blueprintsDir)) {
    throw new Error(`outside the blueprints directory: "${arg}"`);
  }
  return dir;
}

/** Builds the page Chrome loads. Diagram text is data, never markup. */
function buildPage(diagrams, mermaidScriptPath) {
  const data = JSON.stringify(diagrams).replace(/</g, '\\u003c');
  const config = JSON.stringify(SITE_MERMAID_CONFIG);
  const scriptUrl = new URL(`file://${mermaidScriptPath.split(path.sep).join('/')}`).href;
  return `<!doctype html>
<meta charset="utf-8">
<body style='font-family: ${FONT_STACK}'>
<script src="${scriptUrl}"></script>
<script>
const diagrams = ${data};
(async () => {
  const results = [];
  try {
    await document.fonts.ready;
    const config = ${config};
    config.themeVariables.fontFamily = getComputedStyle(document.body).fontFamily;
    mermaid.initialize(config);
    let n = 0;
    for (const d of diagrams) {
      try {
        const { svg } = await mermaid.render('diagram' + (n++), d.source);
        const box = /viewBox="([^"]+)"/.exec(svg);
        const parts = box ? box[1].trim().split(/[ ,]+/).map(Number) : [];
        if (parts.length !== 4 || parts.some(Number.isNaN)) throw new Error('rendered SVG has no viewBox');
        results.push({ id: d.id, width: Math.ceil(parts[2]), height: Math.ceil(parts[3]) });
      } catch (err) {
        results.push({ id: d.id, error: String(err && err.message ? err.message : err).slice(0, 300) });
      }
    }
  } catch (err) {
    results.push({ fatal: String(err && err.message ? err.message : err).slice(0, 300) });
  }
  const bytes = new TextEncoder().encode(JSON.stringify(results));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const pre = document.createElement('pre');
  pre.id = 'result';
  pre.textContent = btoa(binary);
  document.body.replaceChildren(pre);
})();
</script>`;
}

/** Reads the measurements back out of Chrome's --dump-dom output. */
function parseResults(dom) {
  const match = RESULT_PATTERN.exec(dom);
  if (!match) throw new Error('Chrome did not return any measurements (the render may have timed out)');
  const results = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  if (!Array.isArray(results)) throw new Error('unexpected measurement format');
  return results;
}

function findChrome() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) {
    if (!fs.existsSync(fromEnv)) throw new Error(`CHROME_PATH does not exist: ${fromEnv}`);
    return fromEnv;
  }
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error('Chrome or Chromium not found. Install one, or set CHROME_PATH to its executable.');
  }
  return found;
}

function findMermaid() {
  let packageJsonPath;
  try {
    packageJsonPath = require.resolve('mermaid/package.json');
  } catch {
    throw new Error(`mermaid is not installed. Run: npm install --no-save mermaid@${SITE_MERMAID_VERSION}`);
  }
  const { version } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const script = path.join(path.dirname(packageJsonPath), 'dist', 'mermaid.min.js');
  if (!fs.existsSync(script)) throw new Error(`mermaid build not found at ${script}`);
  return { script, version };
}

function measure(diagrams, chromePath, mermaidScriptPath) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blueprint-diagrams-'));
  try {
    const pagePath = path.join(workDir, 'page.html');
    fs.writeFileSync(pagePath, buildPage(diagrams, mermaidScriptPath), { encoding: 'utf8', mode: 0o600 });
    const pageUrl = new URL(`file://${pagePath.split(path.sep).join('/')}`).href;
    const dom = execFileSync(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        `--user-data-dir=${path.join(workDir, 'profile')}`,
        `--virtual-time-budget=${RENDER_BUDGET_MS}`,
        '--dump-dom',
        pageUrl,
      ],
      { encoding: 'utf8', timeout: CHROME_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return parseResults(dom);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/** Collects every diagram in the given blueprint directories. */
function collectDiagrams(dirs) {
  const diagrams = [];
  for (const dir of dirs) {
    const indexPath = path.join(dir, 'index.md');
    if (!fs.existsSync(indexPath)) continue;
    const slug = path.basename(dir);
    const found = extractDiagrams(fs.readFileSync(indexPath, 'utf8'));
    found.forEach((d, i) => diagrams.push({ id: `${slug}#${i + 1}`, slug, line: d.line, source: d.source }));
  }
  return diagrams;
}

/** Turns measurements into pass/fail lines. */
function evaluate(diagrams, results, maxWidth) {
  const byId = new Map(results.filter((r) => r.id).map((r) => [r.id, r]));
  return diagrams.map((d) => {
    const where = `${d.slug} (index.md:${d.line})`;
    const r = byId.get(d.id);
    if (!r) return { ok: false, message: `${where}: not measured` };
    if (r.error) return { ok: false, message: `${where}: does not render: ${r.error}` };
    if (r.width > maxWidth) {
      const scale = Math.round((maxWidth / r.width) * 100);
      return {
        ok: false,
        message: `${where}: ${r.width}px wide, limit ${maxWidth}px. The site would show it at ${scale}% size. See "Diagram layout" in STYLE_GUIDE.md.`,
      };
    }
    return { ok: true, message: `${where}: ${r.width} x ${r.height}px` };
  });
}

module.exports = {
  DEFAULT_MAX_WIDTH, extractDiagrams, parseMaxWidth, resolveBlueprintDir,
  buildPage, parseResults, evaluate,
};

function main() {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const names = args.filter((a) => !a.startsWith('--'));

  const maxWidth = parseMaxWidth(flags);
  const dirs = names.length
    ? names.map((n) => resolveBlueprintDir(n))
    : fs.readdirSync(BLUEPRINTS_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(BLUEPRINTS_DIR, e.name));

  for (const dir of dirs) {
    if (!fs.existsSync(path.join(dir, 'index.md'))) throw new Error(`no index.md in ${path.relative(ROOT, dir)}`);
  }

  const diagrams = collectDiagrams(dirs);
  if (!diagrams.length) {
    console.log('  no diagrams to check');
    return 0;
  }

  const mermaid = findMermaid();
  if (mermaid.version !== SITE_MERMAID_VERSION) {
    console.warn(`  WARN  mermaid ${mermaid.version} is installed; the site uses ${SITE_MERMAID_VERSION}, so widths may differ`);
  }
  const results = measure(diagrams, findChrome(), mermaid.script);
  const fatal = results.find((r) => r.fatal);
  if (fatal) throw new Error(`mermaid failed to start: ${fatal.fatal}`);

  let failed = false;
  for (const { ok, message } of evaluate(diagrams, results, maxWidth)) {
    if (ok) console.log(`  OK    ${message}`);
    else {
      console.error(`  FAIL  ${message}`);
      failed = true;
    }
  }
  return failed ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`  ERROR ${err.message}`);
    process.exit(2);
  }
}
