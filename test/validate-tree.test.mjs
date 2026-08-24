import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = join(import.meta.dirname, '..');

async function runValidator(interviewContents) {
  const fixture = await mkdtemp(join(tmpdir(), 'validate-tree-'));
  try {
    await mkdir(join(fixture, '.codex'), { recursive: true });
    await mkdir(join(fixture, 'scripts'), { recursive: true });
    await mkdir(join(fixture, 'interview', 'company'), { recursive: true });
    await mkdir(join(fixture, 'knowledge'), { recursive: true });
    await copyFile(join(ROOT, 'scripts', 'validate-tree.mjs'), join(fixture, 'scripts', 'validate-tree.mjs'));
    await copyFile(
      join(ROOT, 'scripts', 'interview-source-history.mjs'),
      join(fixture, 'scripts', 'interview-source-history.mjs'),
    );
    await writeFile(join(fixture, 'interview', '_tree.json'), JSON.stringify([{
      label: '公司',
      key: 'company',
      children: [{ label: '面经', key: 'article', isLeaf: true, filePath: 'company' }],
    }]));
    await writeFile(join(fixture, 'interview', 'company', 'article.md'), interviewContents);
    await writeFile(join(fixture, 'knowledge', '_tree.json'), '[]');
    await writeFile(join(fixture, '.codex', 'interview-source-history.json'), JSON.stringify({
      schemaVersion: 1,
      updatedAt: '2026-08-25',
      records: {},
    }));

    return spawnSync(process.execPath, [join(fixture, 'scripts', 'validate-tree.mjs')], {
      cwd: fixture,
      encoding: 'utf8',
    });
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

test('tree validation rejects every public interview source disclosure', async () => {
  const cases = [
    ['source heading', '# 面经\n\n## 来源\n'],
    ['Nowcoder URL', '# 面经\n\n原始记录：https://www.nowcoder.com/feed/main/detail/example\n'],
  ];

  for (const [name, contents] of cases) {
    const result = await runValidator(contents);
    assert.notEqual(result.status, 0, `${name} should fail validation`);
    assert.match(`${result.stdout}\n${result.stderr}`, /公开面经不得包含/u);
  }
});
