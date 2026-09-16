#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');

const REQUIRED_FIELDS = [
  'title', 'slug', 'description', 'products', 'verticals',
  'estimated_time', 'author', 'status', 'updated',
];

const ENUMS = {
  status: ['draft', 'review', 'published'],
};

// Route names claimed by developers.zoom.us/blueprints/* — a blueprint with
// one of these slugs would collide with a site page.
const RESERVED_SLUGS = new Set(['preview', 'preview-frame', 'collections']);

const FACETS = ['products', 'verticals', 'solution_types'];
const REQUIRED_FACETS = ['products', 'verticals'];

// partners is a vocabulary but NOT a facet: it never participates in the
// required-facet degrade policy below.
const VOCABULARIES = [...FACETS, 'partners'];

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

function loadTaxonomy(root = ROOT) {
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'taxonomy.json'), 'utf8'));
  const ids = {};
  for (const key of VOCABULARIES) {
    ids[key] = new Set((raw[key] || []).map((entry) => entry.id));
  }
  return ids;
}

function validateFrontmatter(data = {}, dirSlug, taxonomy) {
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_FIELDS) {
    const value = data[field];
    const missing = value == null || value === ''
      || (Array.isArray(value) && value.length === 0);
    if (missing) errors.push(`missing required field: ${field}`);
  }

  if (data.slug != null && data.slug !== '' && data.slug !== dirSlug) {
    errors.push(`slug "${data.slug}" does not match directory "${dirSlug}"`);
  }

  if (RESERVED_SLUGS.has(dirSlug)) {
    errors.push(`slug "${dirSlug}" is reserved by the site and cannot be used`);
  }

  for (const [field, allowed] of Object.entries(ENUMS)) {
    const value = data[field];
    if (value != null && value !== '' && !allowed.includes(value)) {
      errors.push(`${field} must be one of: ${allowed.join(', ')}`);
    }
  }

  // Off-vocab facet values are dropped with a warning (degrade policy);
  // a required facet that loses every value is an error.
  for (const facet of FACETS) {
    const values = asArray(data[facet]);
    const kept = values.filter((v) => taxonomy[facet].has(v));
    for (const v of values) {
      if (!taxonomy[facet].has(v)) warnings.push(`off-vocab ${facet} value (ignored): "${v}"`);
    }
    if (REQUIRED_FACETS.includes(facet) && values.length && !kept.length) {
      errors.push(`${facet} has no valid values after vocabulary check`);
    }
  }

  // Unknown partners warn only — the vocabulary guards display names, not
  // publishability. Guard: callers may pass a taxonomy without partners.
  const knownPartners = taxonomy.partners || new Set();
  for (const partner of asArray(data.partners)) {
    if (!knownPartners.has(partner)) {
      warnings.push(`unknown partner id (ignored): "${partner}"`);
    }
  }

  // deploy, when present, must be [{ label, url }] — non-empty label,
  // string url (empty is fine; placeholders are legitimate in drafts).
  if (data.deploy != null) {
    const entries = Array.isArray(data.deploy) ? data.deploy : null;
    const wellFormed = entries && entries.every((e) => e && typeof e === 'object'
      && !Array.isArray(e) && typeof e.label === 'string' && e.label !== ''
      && typeof e.url === 'string');
    if (!wellFormed) errors.push('deploy entries must be { label, url } objects');
  }

  if (!data.github_repo) {
    warnings.push('github_repo is empty — the site will not list this blueprint');
  }

  return { errors, warnings };
}

const REQUIRED_SECTIONS = ['Architecture', 'Implementation Guide'];

// These products do not use a Zoom App manifest, so their blueprints may omit
// manifest.json. If one is present, it is still validated below.
const MANIFEST_OPTIONAL_PRODUCTS = new Set([
  'video-sdk', 'cobrowse-sdk', 'ai-services',
]);

// Parse + non-empty check only for now. Field-level checks land during
// integration weeks once the Marketplace manifests API schema is confirmed.
const CREDENTIAL_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

// Key-value scan: matches quoted JSON keys ("client_secret": "...") and
// unquoted .env-style values (ZOOM_CLIENT_SECRET=...). The [A-Z0-9_]* affixes
// let env-style names like ZOOM_CLIENT_SECRET match; the i flag covers case.
const SECRET_KEY_PATTERN =
  /["']?(?:[A-Z0-9_]*(?:api[_-]?key|client[_-]?secret|access[_-]?token)[A-Z0-9_]*)["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi;

// Documentation placeholders (YOUR_CLIENT_SECRET_HERE, <your-secret>, etc.)
// are legitimate in blueprint tutorials and must not hard-error.
const PLACEHOLDER_PATTERN = /YOUR_|EXAMPLE|PLACEHOLDER|CHANGE_?ME|xxx|</i;

// Binary/media files can't hold a readable secret and would be slurped as
// garbage UTF-8 (risking false positives) — the credential scan skips them.
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.pdf',
  '.mp4', '.mov', '.webm', '.woff', '.woff2',
]);

// Markdown image refs: capture the URL up to whitespace or the closing paren,
// so an optional "title" suffix — ![alt](path "title") — is not swept in.
const IMAGE_MD_PATTERN = /!\[[^\]]*\]\(\s*([^)\s]+)/g;

// Remote (http(s):, data:) and site-absolute (/…) refs are the author's
// responsibility; only relative paths resolve to a file we can check on disk.
const isRemoteOrAbsolute = (ref) => /^(?:https?:|data:|\/)/i.test(ref);

function validateBody(body, products = []) {
  const errors = [];
  const requiredSections = [...REQUIRED_SECTIONS];
  const manifestIsOptional = asArray(products)
    .some((product) => MANIFEST_OPTIONAL_PRODUCTS.has(product));
  if (!manifestIsOptional) requiredSections.push('App Manifest');

  for (const section of requiredSections) {
    const heading = new RegExp(`^## ${section}\\s*$`, 'm');
    if (!heading.test(body)) errors.push(`missing required section: ## ${section}`);
  }

  // Blueprints open with outcome-focused intro prose, not a heading.
  // Strip HTML comments (template guidance) before checking.
  const stripped = body.replace(/<!--[\s\S]*?-->/g, '').trim();
  const firstHeading = stripped.search(/^#{1,6} /m);
  const intro = (firstHeading === -1 ? stripped : stripped.slice(0, firstHeading)).trim();
  if (!intro) {
    errors.push('blueprint must open with intro prose (outcomes-first) before the first heading');
  }
  return errors;
}

function validateManifest(dir, products = []) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    const manifestIsOptional = asArray(products)
      .some((product) => MANIFEST_OPTIONAL_PRODUCTS.has(product));
    return manifestIsOptional ? [] : ['missing manifest.json'];
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)
      || !Object.keys(manifest).length) {
      return ['manifest.json must be a non-empty JSON object'];
    }
  } catch (err) {
    return [`manifest.json is not valid JSON: ${err.message}`];
  }
  return [];
}

function scanCredentials(dir) {
  const errors = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
    for (const pattern of CREDENTIAL_PATTERNS) {
      if (pattern.test(content)) {
        errors.push(`possible credential in ${entry.name} (matched ${pattern})`);
      }
    }
    // matchAll gives fresh iteration state per call, avoiding lastIndex
    // pitfalls with the shared global regex literal.
    for (const match of content.matchAll(SECRET_KEY_PATTERN)) {
      if (!PLACEHOLDER_PATTERN.test(match[0])) {
        errors.push(`possible credential in ${entry.name} (secret-like value for a key named like api_key/client_secret/access_token)`);
      }
    }
  }
  return errors;
}

// Every relative image ref — hero_image (frontmatter) and body ![](…) — must
// resolve to a file inside the blueprint dir; the site copies them verbatim to
// /img/blueprints/<slug>/. An absent hero_image is fine (a thumbnail is
// generated from metadata), but a set-but-broken ref is a typo we catch here.
function validateImages(dir, data = {}, body = '') {
  const errors = [];
  const refs = [];

  if (data.hero_image != null && data.hero_image !== '') {
    refs.push({ ref: String(data.hero_image), where: 'hero_image' });
  }
  // Strip HTML comments first — a commented-out ![](…) renders nothing on the
  // site, so it needn't resolve (this is also how template examples survive).
  const visible = body.replace(/<!--[\s\S]*?-->/g, '');
  for (const match of visible.matchAll(IMAGE_MD_PATTERN)) {
    refs.push({ ref: match[1], where: `body image "${match[1]}"` });
  }

  for (const { ref, where } of refs) {
    if (isRemoteOrAbsolute(ref)) continue;
    const resolved = path.resolve(dir, ref);
    // Reject ../ traversal escaping the blueprint dir before touching disk.
    if (resolved !== dir && !resolved.startsWith(dir + path.sep)) {
      errors.push(`${where} escapes the blueprint directory`);
    } else if (!fs.existsSync(resolved)) {
      errors.push(`${where === 'hero_image' ? `hero_image "${ref}"` : where} not found on disk`);
    }
  }
  return errors;
}

function validateBlueprintDir(dir, taxonomy) {
  const slug = path.basename(dir);
  const indexPath = path.join(dir, 'index.md');
  const errors = [];
  const warnings = [];
  let products = [];

  if (!fs.existsSync(indexPath)) {
    errors.push('missing index.md');
  } else {
    const parsed = matter(fs.readFileSync(indexPath, 'utf8'));
    products = parsed.data.products;
    const fm = validateFrontmatter(parsed.data, slug, taxonomy);
    errors.push(...fm.errors);
    warnings.push(...fm.warnings);
    errors.push(...validateBody(parsed.content, parsed.data.products));
    errors.push(...validateImages(dir, parsed.data, parsed.content));
  }

  errors.push(...validateManifest(dir, products));
  errors.push(...scanCredentials(dir));
  return { slug, errors, warnings };
}

module.exports = {
  loadTaxonomy, validateFrontmatter, validateBody,
  validateManifest, scanCredentials, validateImages, validateBlueprintDir,
};

function main() {
  const taxonomy = loadTaxonomy();
  const args = process.argv.slice(2);
  const targets = args.length
    ? args.map((p) => path.resolve(p))
    : fs.readdirSync(path.join(ROOT, 'blueprints'), { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
        .map((e) => path.join(ROOT, 'blueprints', e.name));

  let failed = false;
  for (const dir of targets) {
    const { slug, errors, warnings } = validateBlueprintDir(dir, taxonomy);
    for (const w of warnings) console.warn(`  WARN  ${slug}: ${w}`);
    for (const e of errors) console.error(`  FAIL  ${slug}: ${e}`);
    if (errors.length) failed = true;
    else console.log(`  OK    ${slug}${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
  }
  if (!targets.length) console.log('  no blueprints to validate');
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
