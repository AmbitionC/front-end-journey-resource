import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  topicFrequencies,
  validateInterviewSourceHistory,
} from '../scripts/interview-source-history.mjs';

function published(overrides = {}) {
  return {
    source: 'nowcoder',
    url: 'https://www.nowcoder.com/feed/main/detail/source-a',
    contentHash: '1111111111111111',
    clusterId: 'cluster-agent-memory',
    company: 'bytedance',
    evidenceGrade: 'A',
    status: 'published',
    articleKey: 'bytedance-agent-1',
    publicFiles: ['interview/bytedance/ai/bytedance-agent-1.md'],
    knowledgeKeys: ['agent-memory', 'agent-evaluation'],
    processedAt: '2026-08-23T15:00:00.000Z',
    ...overrides,
  };
}

test('validates published files and limits one public article per cluster', async () => {
  const root = await mkdtemp(join(tmpdir(), 'interview-history-'));
  try {
    await mkdir(join(root, 'interview', 'bytedance', 'ai'), { recursive: true });
    await mkdir(join(root, 'knowledge', 'llm'), { recursive: true });
    await writeFile(join(root, 'interview', 'bytedance', 'ai', 'bytedance-agent-1.md'), '# 正文\n');
    await writeFile(join(root, 'interview', '_tree.json'), JSON.stringify([{
      label: '字节', key: 'bytedance', children: [{
        label: 'AI', key: 'bytedance-ai', children: [{
          label: '面经', key: 'bytedance-agent-1', isLeaf: true, filePath: 'bytedance/ai',
        }],
      }],
    }]));
    await writeFile(join(root, 'knowledge', '_tree.json'), JSON.stringify([{
      label: '知识', key: 'knowledge', children: [
        { label: '记忆', key: 'agent-memory', isLeaf: true, filePath: 'llm' },
        { label: '评估', key: 'agent-evaluation', isLeaf: true, filePath: 'llm' },
      ],
    }]));
    const backlink = '- [面经](../../interview/bytedance/ai/bytedance-agent-1.md)（cluster-agent-memory）\n';
    await writeFile(join(root, 'knowledge', 'llm', 'agent-memory.md'), `# 记忆\n\n${backlink}`);
    await writeFile(join(root, 'knowledge', 'llm', 'agent-evaluation.md'), `# 评估\n\n${backlink}`);
    const valid = {
      schemaVersion: 1,
      updatedAt: '2026-08-23',
      records: { aaaaaaaaaaaa: published() },
    };

    assert.deepEqual(await validateInterviewSourceHistory(root, valid), []);

    const duplicateCluster = structuredClone(valid);
    duplicateCluster.records.bbbbbbbbbbbb = published({
      url: 'https://www.nowcoder.com/feed/main/detail/source-b',
      contentHash: '2222222222222222',
      articleKey: 'bytedance-agent-2',
      publicFiles: ['interview/bytedance/ai/bytedance-agent-2.md'],
    });
    const errors = await validateInterviewSourceHistory(root, duplicateCluster);
    assert.equal(errors.some(error => error.includes('同一 cluster 只能有一篇公开面经')), true);
    assert.equal(errors.some(error => error.includes('公开文件不存在')), true);

    const mismatched = structuredClone(valid);
    mismatched.records.aaaaaaaaaaaa.publicFiles = ['interview/bytedance/ai/another.md'];
    mismatched.records.aaaaaaaaaaaa.knowledgeKeys = ['missing-topic'];
    await writeFile(join(root, 'interview', 'bytedance', 'ai', 'another.md'), '# 另一篇\n');
    const mismatchErrors = await validateInterviewSourceHistory(root, mismatched);
    assert.equal(mismatchErrors.some(error => error.includes('articleKey 与 publicFiles 不匹配')), true);
    assert.equal(mismatchErrors.some(error => error.includes('知识点不存在')), true);

    const equivalentUrl = structuredClone(valid);
    equivalentUrl.records.bbbbbbbbbbbb = published({
      url: 'https://nowcoder.com/feed/main/detail/source-a/?from=share',
      contentHash: '2222222222222222',
      clusterId: 'cluster-another',
      status: 'merged',
      articleKey: undefined,
      publicFiles: [],
    });
    const equivalentErrors = await validateInterviewSourceHistory(root, equivalentUrl);
    assert.equal(equivalentErrors.some(error => error.includes('使用了重复 URL')), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('aggregates topic frequency by unique cluster instead of source URL', () => {
  const history = {
    schemaVersion: 1,
    updatedAt: '2026-08-23',
    records: {
      aaaaaaaaaaaa: published(),
      bbbbbbbbbbbb: published({
        url: 'https://www.nowcoder.com/feed/main/detail/source-b',
        contentHash: '2222222222222222',
        status: 'merged',
        articleKey: undefined,
        publicFiles: [],
      }),
      cccccccccccc: published({
        url: 'https://www.nowcoder.com/feed/main/detail/source-c',
        contentHash: '3333333333333333',
        clusterId: 'cluster-rag-eval',
        company: 'tencent',
        articleKey: 'tencent-agent-1',
        publicFiles: ['interview/tencent/ai/tencent-agent-1.md'],
        knowledgeKeys: ['agent-evaluation'],
        processedAt: '2026-08-22T15:00:00.000Z',
      }),
    },
  };

  assert.deepEqual(topicFrequencies(history), [
    {
      key: 'agent-evaluation',
      count: 2,
      clusters: ['cluster-agent-memory', 'cluster-rag-eval'],
      companies: ['bytedance', 'tencent'],
      lastSeenAt: '2026-08-23T15:00:00.000Z',
    },
    {
      key: 'agent-memory',
      count: 1,
      clusters: ['cluster-agent-memory'],
      companies: ['bytedance'],
      lastSeenAt: '2026-08-23T15:00:00.000Z',
    },
  ]);
});
