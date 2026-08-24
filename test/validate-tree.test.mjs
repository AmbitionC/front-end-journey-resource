import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
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
    await copyFile(
      join(ROOT, 'scripts', 'public-interview-contract.mjs'),
      join(fixture, 'scripts', 'public-interview-contract.mjs'),
    );
    await symlink(join(ROOT, 'node_modules'), join(fixture, 'node_modules'), 'dir');
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
      records: {
        aaaaaaaaaaaa: {
          source: 'nowcoder',
          url: 'https://www.nowcoder.com/feed/main/detail/source-a',
          contentHash: '1111111111111111',
          clusterId: 'cluster-article',
          company: 'company',
          evidenceGrade: 'A',
          status: 'published',
          articleKey: 'article',
          publicFiles: ['interview/company/article.md'],
          knowledgeKeys: [],
          processedAt: '2026-08-25T00:00:00.000Z',
        },
      },
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
    ['indented source heading', '# 面经\n\n   ## 来源\n'],
    ['spaced source heading', '# 面经\n\n##   来源\n'],
    ['closed source heading', '# 面经\n\n## 来源 ##\n'],
    ['tabbed source heading', '# 面经\n\n##\t来源\n'],
    ['entity-encoded Nowcoder link', '# 面经\n\n[原始记录](https://nowcoder&#46;com/feed/main/detail/example)\n'],
    ['percent-encoded Nowcoder link', '# 面经\n\n[原始记录](https://www%2Enowcoder%2Ecom/feed/main/detail/example)\n'],
    ['case-insensitive Nowcoder hostname', '# 面经\n\n<https://WWW.NOWCODER.COM/feed/main/detail/example>\n'],
  ];

  const missedDisclosures = [];
  for (const [name, contents] of cases) {
    const result = await runValidator(contents);
    const output = `${result.stdout}\n${result.stderr}`;
    if (result.status === 0 || !/公开面经不得包含/u.test(output)) missedDisclosures.push(name);
  }
  assert.deepEqual(missedDisclosures, []);
});

test('tree validation allows generic source discussion and knowledge navigation', async () => {
  const result = await runValidator([
    '# 面经',
    '',
    '## 知识来源',
    '',
    '这里讨论答案的来源判断，不公开原始面经链接。',
    '',
    '[延伸阅读](../../../knowledge/llm/agent/agent-memory.md)',
    '',
  ].join('\n'));

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
