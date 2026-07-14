#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const repo = resolve(process.argv[2] || '.');
const treePath = resolve(repo, 'knowledge', '_tree.json');

if (!existsSync(treePath)) {
  console.error(`Missing manifest: ${treePath}`);
  process.exit(1);
}

let tree;
try {
  tree = JSON.parse(readFileSync(treePath, 'utf8'));
} catch (error) {
  console.error(`Invalid JSON in ${treePath}: ${error.message}`);
  process.exit(1);
}

const rows = [];
const keyCounts = new Map();

function walk(nodes, ancestors = []) {
  for (const node of nodes || []) {
    const trail = [...ancestors, { key: node.key, label: node.label }];
    if (node.isLeaf) {
      const key = String(node.key || '');
      const filePath = String(node.filePath || '');
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
      const expected = resolve(repo, 'knowledge', filePath, `${key}.md`);
      const exists = Boolean(key && filePath && existsSync(expected));
      let bytes = 0;
      let headings = 0;
      let imageRefs = 0;
      if (exists) {
        const body = readFileSync(expected, 'utf8');
        bytes = Buffer.byteLength(body);
        headings = (body.match(/^#{1,6}\s+/gm) || []).length;
        imageRefs = (body.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
      }
      rows.push({
        key,
        label: node.label || '',
        filePath,
        parentKey: ancestors.at(-1)?.key || '',
        breadcrumb: trail.map((item) => item.label || item.key).join(' / '),
        articlePath: relative(repo, expected).split(sep).join('/'),
        exists,
        bytes,
        headings,
        imageRefs,
      });
    } else {
      walk(node.children, trail);
    }
  }
}

walk(tree);

const referenced = new Set(rows.map((row) => row.articlePath));
const orphans = [];

function scan(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === '_tree.json') continue;
    const absolute = resolve(dir, name);
    if (statSync(absolute).isDirectory()) scan(absolute);
    else if (name.endsWith('.md')) {
      const path = relative(repo, absolute).split(sep).join('/');
      if (!referenced.has(path)) orphans.push(path);
    }
  }
}

scan(resolve(repo, 'knowledge'));

const duplicateKeys = [...keyCounts.entries()]
  .filter(([, count]) => count > 1)
  .map(([key, count]) => ({ key, count }));

console.log(JSON.stringify({
  repository: repo,
  summary: {
    leaves: rows.length,
    existing: rows.filter((row) => row.exists).length,
    missing: rows.filter((row) => !row.exists).length,
    duplicateKeys: duplicateKeys.length,
    orphans: orphans.length,
  },
  articles: rows,
  duplicateKeys,
  orphans,
}, null, 2));

if (duplicateKeys.length) process.exitCode = 2;
