import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  topicFrequencies,
  validateInterviewSourceHistory,
} from '../scripts/interview-source-history.mjs';
import { publicInterviewDisclosures } from '../scripts/public-interview-contract.mjs';

const ROOT = join(import.meta.dirname, '..');

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  }));
  return nested.flat();
}

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

test('keeps Nowcoder provenance private while every published article stays traceable', async () => {
  const files = await markdownFiles(join(ROOT, 'interview'));
  const publicViolations = [];
  for (const file of files) {
    const contents = await readFile(file, 'utf8');
    const relativePath = file.slice(ROOT.length + 1);
    const disclosures = publicInterviewDisclosures(contents);
    if (disclosures.has('source-heading')) publicViolations.push(`${relativePath}: 公开来源标题`);
    if (disclosures.has('nowcoder-destination')) publicViolations.push(`${relativePath}: 公开牛客 URL`);
  }

  const history = JSON.parse(await readFile(join(ROOT, '.codex', 'interview-source-history.json'), 'utf8'));
  const historyErrors = await validateInterviewSourceHistory(ROOT, history);
  const publishedRecords = Object.values(history.records).filter(record => record.status === 'published');
  const publishedArticleKeys = publishedRecords.map(record => record.articleKey);
  for (const record of publishedRecords) {
    const url = new URL(record.url);
    if (
      url.protocol !== 'https:'
      || url.hostname !== 'www.nowcoder.com'
      || url.search !== ''
      || url.hash !== ''
      || !['A', 'B'].includes(record.evidenceGrade)
      || typeof record.clusterId !== 'string'
      || record.clusterId.length === 0
      || typeof record.articleKey !== 'string'
      || record.articleKey.length === 0
      || !Array.isArray(record.knowledgeKeys)
    ) {
      historyErrors.push(`发布面经的私有来源记录不完整：${record.articleKey ?? '(missing articleKey)'}`);
    }
  }
  if (new Set(publishedArticleKeys).size !== publishedArticleKeys.length) {
    historyErrors.push('发布面经的 articleKey 不唯一');
  }

  assert.deepEqual({ publicViolations, historyErrors }, { publicViolations: [], historyErrors: [] });
});

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

    const missingPublishedRecord = structuredClone(valid);
    delete missingPublishedRecord.records.aaaaaaaaaaaa;
    const missingPublishedErrors = await validateInterviewSourceHistory(root, missingPublishedRecord);

    const duplicateArticle = structuredClone(valid);
    duplicateArticle.records.bbbbbbbbbbbb = published({
      url: 'https://www.nowcoder.com/feed/main/detail/source-b',
      contentHash: '2222222222222222',
      clusterId: 'cluster-another',
      knowledgeKeys: [],
    });
    const duplicateArticleErrors = await validateInterviewSourceHistory(root, duplicateArticle);

    const nonCanonical = structuredClone(valid);
    nonCanonical.records.aaaaaaaaaaaa.url = 'https://nowcoder.com/feed/main/detail/source-a/?from=share';
    const nonCanonicalErrors = await validateInterviewSourceHistory(root, nonCanonical);
    assert.deepEqual({
      missingPublishedRecord: missingPublishedErrors.some(
        error => error.includes('公开面经缺少已发布来源记录：bytedance-agent-1'),
      ),
      duplicateArticle: duplicateArticleErrors.some(
        error => error.includes('公开面经只能对应一条已发布来源记录：bytedance-agent-1'),
      ),
      nonCanonicalUrl: nonCanonicalErrors.some(error => error.includes('发布面经必须使用规范牛客 URL')),
    }, {
      missingPublishedRecord: true,
      duplicateArticle: true,
      nonCanonicalUrl: true,
    });

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
