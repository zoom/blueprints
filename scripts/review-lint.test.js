'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { lintProse, checkTitle, checkDiagramCopy, resolveSlugs } = require('./review-lint.js');

const rules = (text) => lintProse(text).map((f) => f.rule);

test('flags an em dash and reports its line', () => {
  const findings = lintProse('First line.\nSignals appear — while you can act.');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'em-dash');
  assert.equal(findings[0].line, 2);
});

test('ignores fenced code, inline code and link targets', () => {
  const text = [
    'Plain sentence.',
    '```js',
    'const just = "simply — very";',
    '```',
    'Use `just` here and [the docs](https://example.com/just-simply).',
  ].join('\n');
  assert.deepEqual(rules(text), []);
});

test('keeps line numbers after a code fence', () => {
  const text = ['```', 'a', 'b', '```', 'This is very clear.'].join('\n');
  const findings = lintProse(text);
  assert.equal(findings[0].rule, 'filler');
  assert.equal(findings[0].line, 5);
});

test('flags AI described as a person, but not "agent"', () => {
  assert.deepEqual(rules('Your digital teammate joins the call.'), ['ai-as-human']);
  assert.deepEqual(rules('The agent requests approval.'), []);
});

test('flags latency figures and vague instructions', () => {
  assert.deepEqual(rules('Updates arrive with sub-second latency.'), ['latency-figure']);
  assert.deepEqual(rules('Handle missing names gracefully.'), ['vague-spec']);
});

test('does not flag an image tag as an exclamation', () => {
  assert.deepEqual(rules('![Dashboard](images/dashboard.png)'), []);
  assert.deepEqual(rules('Join us today!'), ['exclamation']);
});

test('title passes when it contains every word of one keyword', () => {
  const data = {
    title: 'Real-time sales coaching inside Zoom calls',
    seo_keywords: ['zoom real-time sales coaching', 'rtms sales call intelligence'],
  };
  assert.deepEqual(checkTitle(data), []);
});

test('title is flagged when no keyword is covered or none exist', () => {
  const miss = checkTitle({ title: 'A panel for sellers', seo_keywords: ['zoom sales coaching'] });
  assert.equal(miss[0].rule, 'seo-title');
  assert.equal(checkTitle({ title: 'A panel for sellers' })[0].rule, 'seo-title');
});

test('diagram copy check ignores comments and trailing space', () => {
  const page = 'Intro\n\n```mermaid\nflowchart TB\n    A --> B\n```\n';
  assert.deepEqual(checkDiagramCopy(page, '%% keep in sync\nflowchart TB\n    A --> B  \n'), []);
  assert.equal(checkDiagramCopy(page, 'flowchart TB\n    A --> C\n')[0].rule, 'diagram-copy');
});

test('rejects arguments that are not plain slugs', () => {
  assert.throws(() => resolveSlugs(['../scripts']), /no blueprint found|not a blueprint slug/);
  assert.throws(() => resolveSlugs(['Bad Slug']), /not a blueprint slug/);
});
