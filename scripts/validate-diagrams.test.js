'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  DEFAULT_MAX_WIDTH, extractDiagrams, parseMaxWidth, resolveBlueprintDir,
  buildPage, parseResults, evaluate,
} = require('./validate-diagrams.js');

const BLUEPRINTS = path.resolve('/repo/blueprints');

test('extractDiagrams returns each mermaid fence with its line number', () => {
  const md = '# Title\n\n```mermaid\nflowchart TB\n    A --> B\n```\n\ntext\n\n```mermaid\nsequenceDiagram\n    A->>B: hi\n```\n';
  const found = extractDiagrams(md);
  assert.equal(found.length, 2);
  assert.deepEqual(found[0], { line: 3, source: 'flowchart TB\n    A --> B\n' });
  assert.equal(found[1].line, 10);
});

test('extractDiagrams ignores other code fences', () => {
  assert.deepEqual(extractDiagrams('```js\nconst a = 1;\n```\n'), []);
});

test('extractDiagrams handles CRLF line endings', () => {
  assert.equal(extractDiagrams('```mermaid\r\nflowchart TB\r\n```\r\n').length, 1);
});

test('parseMaxWidth defaults and accepts a number in range', () => {
  assert.equal(parseMaxWidth([]), DEFAULT_MAX_WIDTH);
  assert.equal(parseMaxWidth(['--max-width=640']), 640);
});

test('parseMaxWidth rejects non-numbers and out-of-range values', () => {
  assert.throws(() => parseMaxWidth(['--max-width=abc']));
  assert.throws(() => parseMaxWidth(['--max-width=-5']));
  assert.throws(() => parseMaxWidth(['--max-width=10']));
  assert.throws(() => parseMaxWidth(['--max-width=99999']));
});

test('resolveBlueprintDir accepts a slug or a blueprints/<slug> path', () => {
  assert.equal(resolveBlueprintDir('my-blueprint', BLUEPRINTS), path.join(BLUEPRINTS, 'my-blueprint'));
  assert.equal(resolveBlueprintDir('blueprints/my-blueprint/', BLUEPRINTS), path.join(BLUEPRINTS, 'my-blueprint'));
  assert.equal(resolveBlueprintDir('_template', BLUEPRINTS), path.join(BLUEPRINTS, '_template'));
});

test('resolveBlueprintDir rejects names that are not slugs', () => {
  assert.throws(() => resolveBlueprintDir('..', BLUEPRINTS));
  assert.throws(() => resolveBlueprintDir('blueprints/..', BLUEPRINTS));
  assert.throws(() => resolveBlueprintDir('Has Spaces', BLUEPRINTS));
  assert.throws(() => resolveBlueprintDir('%2e%2e', BLUEPRINTS));
});

test('buildPage embeds diagram text as data, not markup', () => {
  const page = buildPage([{ id: 'x#1', source: 'flowchart TB\n  A["</script><script>alert(1)</script>"]' }], '/opt/mermaid/dist/mermaid.min.js');
  assert.ok(!page.includes('</script><script>alert(1)'));
  assert.ok(page.includes('\\u003c/script>'));
  assert.ok(page.includes('file:///opt/mermaid/dist/mermaid.min.js'));
});

test('parseResults decodes the measurements Chrome prints', () => {
  const payload = Buffer.from(JSON.stringify([{ id: 'x#1', width: 500, height: 300 }]), 'utf8').toString('base64');
  assert.deepEqual(parseResults(`<html><body><pre id="result">${payload}</pre></body></html>`), [{ id: 'x#1', width: 500, height: 300 }]);
});

test('parseResults fails clearly when nothing was measured', () => {
  assert.throws(() => parseResults('<html><body></body></html>'), /did not return/);
});

test('evaluate passes diagrams within the limit and fails wider or broken ones', () => {
  const diagrams = [
    { id: 'a#1', slug: 'a', line: 10 },
    { id: 'b#1', slug: 'b', line: 20 },
    { id: 'c#1', slug: 'c', line: 30 },
    { id: 'd#1', slug: 'd', line: 40 },
  ];
  const results = [
    { id: 'a#1', width: 790, height: 400 },
    { id: 'b#1', width: 1580, height: 400 },
    { id: 'c#1', error: 'Parse error on line 2' },
  ];
  const [a, b, c, d] = evaluate(diagrams, results, 790);
  assert.equal(a.ok, true);
  assert.equal(b.ok, false);
  assert.match(b.message, /1580px wide, limit 790px.*50% size/);
  assert.equal(c.ok, false);
  assert.match(c.message, /does not render/);
  assert.equal(d.ok, false);
  assert.match(d.message, /not measured/);
});
