import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readdirSync } from 'node:fs';
import { buildHtml, preferLightDiagrams } from '../scripts/build-materials.mjs';

const OSS = 'https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com';

test('PDF 换用 aj-diagrams 浅色版，只动资源仓 images 下的 .dark.png', () => {
  const md = `![a](${OSS}/images/x-v1.dark.png)\n![b](https://example.com/images/y.dark.png)\n![c](${OSS}/images/z.png)\n`;
  const out = preferLightDiagrams(md);
  assert.match(out, /images\/x-v1\.light\.png\)/);
  assert.match(out, /example\.com\/images\/y\.dark\.png/);
  assert.match(out, /images\/z\.png/);
});

test('buildHtml 输出里引用的是浅色版', () => {
  const tree = { label: '分类', children: [{ key: 'a', label: '文章', isLeaf: true }] };
  const built = buildHtml(tree, '父级', () => `正文\n\n![图](${OSS}/images/demo-v1.dark.png)\n`);
  assert.match(built.html, /demo-v1\.light\.png/);
  assert.doesNotMatch(built.html, /demo-v1\.dark\.png/);
});

test('每份 aj-diagrams 源码都有深浅两版产物', () => {
  const dir = new URL('../images/diagram-sources/', import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.aj.mjs'))) {
    const name = f.replace(/\.aj\.mjs$/, '');
    for (const theme of ['dark', 'light'])
      assert.ok(existsSync(new URL(`../images/${name}.${theme}.png`, import.meta.url)), `缺 ${name}.${theme}.png`);
  }
});
