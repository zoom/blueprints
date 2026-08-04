#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');

const REQUIRED_FIELDS = [
  'title', 'slug', 'description', 'products', 'verticals',
  'difficulty', 'estimated_time', 'author', 'status', 'updated',
];

const ENUMS = {
  difficulty: ['beginner', 'intermediate', 'advanced'],
  status: ['draft', 'review', 'published'],
};

const FACETS = ['products', 'verticals', 'solution_types'];
const REQUIRED_FACETS = ['products', 'verticals'];

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

function loadTaxonomy(root = ROOT) {
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'taxonomy.json'), 'utf8'));
  const ids = {};
  for (const key of FACETS) {
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

  if (!data.github_repo) {
    warnings.push('github_repo is empty — the site will not list this blueprint');
  }

  return { errors, warnings };
}

module.exports = { loadTaxonomy, validateFrontmatter };
