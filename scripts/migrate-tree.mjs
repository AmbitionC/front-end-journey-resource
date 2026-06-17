// scripts/migrate-tree.mjs
// Extracts INTERVIEW_NAV_LIST / KNOWLEDGE_NAV_LIST from the front-end-journey
// constants files and writes them as JSON manifests.
// Strategy: the .tsx files contain no TS-specific syntax and no imports —
// they are plain JS data arrays. We read the source, strip export lines,
// wrap with a return statement, and evaluate with node:vm.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const FE = '/Users/chenhao/code/front-end-journey';
const SELF = resolve(import.meta.dirname);

function extract(srcPath, exportName) {
  const src = readFileSync(srcPath, 'utf8');

  // Remove export statements and TypeScript-only lines
  const cleaned = src
    .replace(/^export\s+\{[^}]*\};?\s*$/gm, '')  // export { FOO };
    .replace(/^export\s+const\s+/gm, 'const ')    // export const X = ...
    .replace(/^export\s+default\s+/gm, '')         // export default
    .replace(/^import\s+.*$/gm, '');               // any stray imports

  // Wrap in a function that returns the named variable
  const code = `(function() {\n${cleaned}\nreturn ${exportName};\n})()`;
  const result = vm.runInNewContext(code, {}, { filename: srcPath });
  return result;
}

function countLeaves(nodes) {
  let n = 0;
  for (const node of nodes) {
    if (node.isLeaf) n++;
    if (node.children) n += countLeaves(node.children);
  }
  return n;
}

const targets = [
  {
    module: 'interview',
    src: `${FE}/src/pages/Interview/constants.tsx`,
    name: 'INTERVIEW_NAV_LIST',
  },
  {
    module: 'knowledge',
    src: `${FE}/src/pages/Knowledge/constants.tsx`,
    name: 'KNOWLEDGE_NAV_LIST',
  },
];

for (const t of targets) {
  const data = extract(t.src, t.name);
  const outPath = resolve(SELF, '..', t.module, '_tree.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`wrote ${outPath} (${countLeaves(data)} leaves)`);
}
