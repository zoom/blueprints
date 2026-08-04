'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateFrontmatter } = require('./validate.js');

const TAXONOMY = {
  products: new Set(['rtms', 'ai-services-scribe']),
  verticals: new Set(['healthcare', 'enterprise']),
  solution_types: new Set(['transcription-summarization']),
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

test('Date instance for updated is accepted (gray-matter parses YAML dates)', () => {
  const { errors } = validateFrontmatter(
    { ...VALID, updated: new Date('2026-08-04') }, 'test-blueprint', TAXONOMY);
  assert.deepEqual(errors, []);
});
