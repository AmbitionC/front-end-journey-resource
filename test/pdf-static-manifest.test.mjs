import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { publicInventory } from '../scripts/content-review.mjs';
import { leafPath } from '../scripts/resource-paths.mjs';
import { createPdfStaticRenderer } from '../scripts/pdf-static-images.mjs';
import { buildHtml, preflightPdfImages } from '../scripts/build-materials.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('committed PDF mappings preflight every current published book before browser or upload use', async () => {
  const snapshot = await publicInventory(root);
  const approved = new Map(snapshot.files.map(file => [file.path, file.sha256]));
  const manifest = JSON.parse(readFileSync(resolve(root, 'knowledge/pdf-static-images.json'), 'utf8'));
  const staleArticles = [...new Set([...manifest.entries, ...manifest.literals]
    .filter(entry => approved.get(entry.articlePath) !== entry.articleSha256)
    .map(entry => entry.articlePath))];
  assert.deepEqual(staleArticles, [], 'PDF article pins differ from the current publication input');
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const render = await createPdfStaticRenderer(root, approved, { sourceCommit });
  const tree = JSON.parse(readFileSync(resolve(root, 'knowledge/_tree.json'), 'utf8'));
  let books = 0;
  for (const category of tree) {
    for (const sub of category.children ?? []) {
      const built = buildHtml(sub, category.label,
        leaf => readFileSync(resolve(root, leafPath('knowledge', leaf)), 'utf8'), render);
      if (!built) continue;
      await preflightPdfImages(root, built.html, approved);
      books++;
    }
  }
  assert.ok(books > 0, 'the actual published book collection must be inspected');
});
