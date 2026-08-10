'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateFrontmatter, loadTaxonomy } = require('./validate.js');

const TAXONOMY = {
  products: new Set(['rtms', 'ai-services-scribe']),
  verticals: new Set(['healthcare', 'enterprise']),
  solution_types: new Set(['transcription-summarization']),
  partners: new Set(['anthropic', 'aws']),
};

const VALID = {
  title: 'Test Blueprint',
  slug: 'test-blueprint',
  description: 'A test blueprint.',
  products: ['rtms'],
  verticals: ['healthcare'],
  difficulty: 'intermediate',
  estimated_time: '2-4 hours',
  author: 'Test Author',
  status: 'draft',
  updated: '2026-08-04',
  github_repo: 'https://github.com/zoom/example',
};

test('valid frontmatter yields no errors or warnings', () => {
  const { errors, warnings } = validateFrontmatter(VALID, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('each missing required field is an error', () => {
  for (const field of ['title', 'slug', 'description', 'products', 'verticals',
    'difficulty', 'estimated_time', 'author', 'status', 'updated']) {
    const data = { ...VALID };
    delete data[field];
    const { errors } = validateFrontmatter(data, 'test-blueprint', TAXONOMY);
    assert.ok(errors.some((e) => e.includes(field)), `expected error for missing ${field}`);
  }
});

test('slug mismatch with directory is an error', () => {
  const { errors } = validateFrontmatter(VALID, 'other-dir', TAXONOMY);
  assert.ok(errors.some((e) => e.includes('does not match')));
});

test('reserved site-route slugs are rejected', () => {
  for (const dirSlug of ['preview', 'preview-frame', 'collections']) {
    const { errors } = validateFrontmatter({ ...VALID, slug: dirSlug }, dirSlug, TAXONOMY);
    assert.ok(errors.some((e) => e.includes('reserved')), `expected reserved error for ${dirSlug}`);
  }
});

test('invalid enum values are errors', () => {
  let res = validateFrontmatter({ ...VALID, difficulty: 'expert' }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('difficulty')));
  res = validateFrontmatter({ ...VALID, status: 'live' }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('status')));
});

test('falsy non-null enum and slug values are rejected, not skipped', () => {
  let res = validateFrontmatter({ ...VALID, difficulty: false }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('difficulty')));
  res = validateFrontmatter({ ...VALID, status: 0 }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('status')));
  res = validateFrontmatter({ ...VALID, slug: false }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('slug')));
});

test('off-vocab facet value warns; error only if none survive', () => {
  const mixed = validateFrontmatter(
    { ...VALID, products: ['rtms', 'not-a-product'] }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(mixed.errors, []);
  assert.ok(mixed.warnings.some((w) => w.includes('not-a-product')));

  const allBad = validateFrontmatter(
    { ...VALID, products: ['not-a-product'] }, 'test-blueprint', TAXONOMY);
  assert.ok(allBad.errors.some((e) => e.includes('products')));
});

test('empty github_repo warns but does not error', () => {
  const { errors, warnings } = validateFrontmatter(
    { ...VALID, github_repo: '' }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => w.includes('github_repo')));
});

test('known partner passes with no warnings', () => {
  const { errors, warnings } = validateFrontmatter(
    { ...VALID, partners: ['anthropic'] }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('unknown partner warns but does not error', () => {
  const { errors, warnings } = validateFrontmatter(
    { ...VALID, partners: ['anthropc'] }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => w.includes('anthropc')));
});

test('deploy with { label, url } entries passes', () => {
  const { errors } = validateFrontmatter(
    { ...VALID, deploy: [{ label: 'Vercel', url: '' }] }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
});

test('deploy with malformed entries is an error', () => {
  let res = validateFrontmatter(
    { ...VALID, deploy: ['vercel'] }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('deploy')));
  res = validateFrontmatter(
    { ...VALID, deploy: [{ label: '', url: 'x' }] }, 'test-blueprint', TAXONOMY);
  assert.ok(res.errors.some((e) => e.includes('deploy')));
});

test('loadTaxonomy exposes the partners vocabulary', () => {
  const taxonomy = loadTaxonomy();
  assert.ok(taxonomy.partners.has('anthropic'));
  assert.ok(taxonomy.partners.size >= 1);
});

test('Date instance for updated is accepted (gray-matter parses YAML dates)', () => {
  const { errors } = validateFrontmatter(
    { ...VALID, updated: new Date('2026-08-04') }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
});

const fsForFixtures = require('node:fs');
const os = require('node:os');
const pathForFixtures = require('node:path');

const {
  validateBody, validateManifest, scanCredentials, validateImages, validateBlueprintDir,
} = require('./validate.js');

function makeBlueprintDir(files) {
  const parent = fsForFixtures.mkdtempSync(pathForFixtures.join(os.tmpdir(), 'bp-'));
  const dir = pathForFixtures.join(parent, 'test-blueprint');
  fsForFixtures.mkdirSync(dir);
  for (const [name, content] of Object.entries(files)) {
    fsForFixtures.writeFileSync(pathForFixtures.join(dir, name), content);
  }
  return dir;
}

const FULL_BODY = [
  '## Problem Statement', 'text',
  '## Architecture', 'text',
  '## Implementation Guide', 'text',
  '## App Manifest', 'text',
].join('\n\n');

const VALID_FM_YAML = `---
title: Test Blueprint
slug: test-blueprint
description: A test blueprint.
products: [rtms]
verticals: [healthcare]
difficulty: intermediate
estimated_time: 2-4 hours
author: Test Author
status: draft
updated: 2026-08-04
github_repo: https://github.com/zoom/example
---`;

test('body with all four required sections passes', () => {
  assert.deepEqual(validateBody(FULL_BODY), []);
});

test('each missing required section is an error', () => {
  const errors = validateBody('## Problem Statement\n\ntext\n');
  for (const section of ['Architecture', 'Implementation Guide', 'App Manifest']) {
    assert.ok(errors.some((e) => e.includes(section)), `expected error for ${section}`);
  }
});

test('missing manifest.json is an error', () => {
  const dir = makeBlueprintDir({});
  assert.ok(validateManifest(dir).some((e) => e.includes('missing manifest.json')));
});

test('invalid manifest JSON is an error', () => {
  const dir = makeBlueprintDir({ 'manifest.json': '{ nope' });
  assert.ok(validateManifest(dir).some((e) => e.includes('not valid JSON')));
});

test('empty-object manifest is an error', () => {
  const dir = makeBlueprintDir({ 'manifest.json': '{}' });
  assert.ok(validateManifest(dir).some((e) => e.includes('non-empty')));
});

// Fixture strings are split so Zoom's push-time secret scanner (which
// matches on pattern alone, even in test fixtures) never sees a contiguous
// AWS key or PEM header in this file. Keep the split form in any edit.
const FAKE_AWS_KEY = 'AKIA' + 'IOSFODNN7EXAMPLE';
const FAKE_PEM_HEADER = '-----BEGIN RSA ' + 'PRIVATE KEY-----';

test('credential scan flags AWS key and PEM header', () => {
  const dir = makeBlueprintDir({
    'index.md': `key is ${FAKE_AWS_KEY}`,
    'notes.txt': FAKE_PEM_HEADER,
  });
  const errors = scanCredentials(dir);
  assert.equal(errors.length, 2);
});

test('validateBlueprintDir passes a complete valid blueprint', () => {
  const dir = makeBlueprintDir({
    'index.md': `${VALID_FM_YAML}\n\n${FULL_BODY}\n`,
    'manifest.json': '{ "name": "test-app" }',
  });
  const { errors, warnings } = validateBlueprintDir(dir, {
    products: new Set(['rtms']),
    verticals: new Set(['healthcare']),
    solution_types: new Set(),
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('validateBlueprintDir errors on missing index.md', () => {
  const dir = makeBlueprintDir({});
  const { errors } = validateBlueprintDir(dir, {
    products: new Set(), verticals: new Set(), solution_types: new Set(),
  });
  assert.ok(errors.some((e) => e.includes('missing index.md')));
});

test('credential scan catches quoted JSON keys and env-style values', () => {
  const dir = makeBlueprintDir({
    'manifest.json': '{ "client_secret": "aB3dEfGh1jKlMnOpQrStUvWx" }',
    'setup.md': 'ZOOM_ACCESS_TOKEN=aB3dEfGh1jKlMnOpQrStUvWx',
  });
  const errors = scanCredentials(dir);
  assert.equal(errors.length, 2);
});

test('credential scan ignores documentation placeholders', () => {
  const dir = makeBlueprintDir({
    'index.md': 'Set api_key: "YOUR_API_KEY_GOES_RIGHT_HERE" and client_secret: "<your-client-secret-value>"',
    '.env.example': 'ZOOM_CLIENT_SECRET=CHANGE_ME_BEFORE_DEPLOYING',
  });
  assert.deepEqual(scanCredentials(dir), []);
});

test('missing index.md still surfaces manifest and credential errors', () => {
  const dir = makeBlueprintDir({ 'notes.txt': FAKE_AWS_KEY });
  const { errors } = validateBlueprintDir(dir, {
    products: new Set(), verticals: new Set(), solution_types: new Set(),
  });
  assert.ok(errors.some((e) => e.includes('missing index.md')));
  assert.ok(errors.some((e) => e.includes('missing manifest.json')));
  assert.ok(errors.some((e) => e.includes('possible credential')));
});

// Writes an images/ subdir with the given files into an existing blueprint dir.
function addImages(dir, names) {
  const imagesDir = pathForFixtures.join(dir, 'images');
  fsForFixtures.mkdirSync(imagesDir, { recursive: true });
  for (const name of names) {
    fsForFixtures.writeFileSync(pathForFixtures.join(imagesDir, name), 'x');
  }
}

test('existing hero_image and body image refs pass', () => {
  const dir = makeBlueprintDir({});
  addImages(dir, ['hero.png', 'panel.png']);
  const body = 'text\n\n![Coaching panel](images/panel.png)\n';
  assert.deepEqual(validateImages(dir, { hero_image: 'images/hero.png' }, body), []);
});

test('hero_image set but file missing is an error', () => {
  const dir = makeBlueprintDir({});
  const errors = validateImages(dir, { hero_image: 'images/nope.png' }, '');
  assert.ok(errors.some((e) => e.includes('hero_image') && e.includes('not found')));
});

test('absent hero_image is not an error (fallback thumbnail covers it)', () => {
  const dir = makeBlueprintDir({});
  assert.deepEqual(validateImages(dir, {}, 'no images here'), []);
});

test('body image pointing at a missing file is an error', () => {
  const dir = makeBlueprintDir({});
  const errors = validateImages(dir, {}, '![alt](images/ghost.png)');
  assert.ok(errors.some((e) => e.includes('ghost.png') && e.includes('not found')));
});

test('image refs inside HTML comments are ignored', () => {
  const dir = makeBlueprintDir({});
  const body = '<!-- example: ![alt](images/does-not-exist.png) -->\nreal text';
  assert.deepEqual(validateImages(dir, {}, body), []);
});

test('remote and site-absolute image refs are not checked on disk', () => {
  const dir = makeBlueprintDir({});
  const body = '![a](https://example.com/x.png)\n![b](/img/blueprints/other/y.png)\n';
  assert.deepEqual(validateImages(dir, { hero_image: 'https://cdn.example.com/h.png' }, body), []);
});

test('image ref escaping the blueprint dir is an error', () => {
  const dir = makeBlueprintDir({});
  const errors = validateImages(dir, { hero_image: '../secrets/leak.png' }, '');
  assert.ok(errors.some((e) => e.includes('escapes')));
});

test('credential scan skips binary/image files', () => {
  const dir = makeBlueprintDir({ 'logo.png': `binary ${FAKE_AWS_KEY} bytes` });
  assert.deepEqual(scanCredentials(dir), []);
});

test('validateBlueprintDir errors on a broken hero_image ref', () => {
  const heroFM = VALID_FM_YAML.replace('github_repo: https://github.com/zoom/example',
    'github_repo: https://github.com/zoom/example\nhero_image: images/missing.png');
  const dir = makeBlueprintDir({
    'index.md': `${heroFM}\n\n${FULL_BODY}\n`,
    'manifest.json': '{ "name": "test-app" }',
  });
  const { errors } = validateBlueprintDir(dir, {
    products: new Set(['rtms']), verticals: new Set(['healthcare']), solution_types: new Set(),
  });
  assert.ok(errors.some((e) => e.includes('hero_image') && e.includes('not found')));
});
