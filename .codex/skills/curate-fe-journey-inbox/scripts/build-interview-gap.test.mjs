import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildInterviewGap } from './build-interview-gap.mjs';

async function writeEntry(root, name, {
  clusterId,
  grade,
  url,
  title,
  candidateKinds = ['interview'],
  questions,
  batchId,
}) {
  const directory = join(root, '_inbox', 'nowcoder', name);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'meta.json'), `${JSON.stringify({
    source: 'nowcoder',
    title,
    url,
    publishedAt: '2026-08-18T08:00:00.000Z',
    sourceMetadata: {
      evidenceGrade: grade,
      company: grade === 'C' ? 'Unknown' : 'ByteDance',
      role: 'Agent 开发',
      round: '一面',
      ...(batchId ? { batchId } : {}),
    },
    feJourney: {
      clusterId,
      contentHash: `${clusterId}-hash`,
      candidateKinds,
      qualityScore: grade === 'C' ? 70 : 85,
    },
  }, null, 2)}\n`);
  await writeFile(
    join(directory, 'original.md'),
    `# ${title}\n\n${questions.map((question, index) => `${index + 1}. ${question}`).join('\n')}\n`,
  );
}

test('builds evidence-gated question gap and operation reports by content cluster', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-journey-gap-'));
  await mkdir(join(root, 'interview', 'common'), { recursive: true });
  await writeFile(join(root, 'interview', 'common', 'existing.md'), [
    '# 现有题库',
    '',
    '#### （1）什么是 Agent Loop？',
    '',
    '#### （2）如何避免工具调用失败？',
    '',
  ].join('\n'));

  const sharedQuestions = [
    '什么是 Agent Loop？',
    '如何避免 Agent 工具调用失败并实现降级？',
    'Context 压缩如何保留失败历史？',
  ];
  await writeEntry(root, 'a-primary', {
    clusterId: 'cluster-agent-loop',
    grade: 'A',
    url: 'https://www.nowcoder.com/discuss/a',
    title: '字节 Agent 一面',
    questions: sharedQuestions,
    candidateKinds: ['interview', 'operation'],
  });
  await writeEntry(root, 'a-repost', {
    clusterId: 'cluster-agent-loop',
    grade: 'B',
    url: 'https://www.nowcoder.com/discuss/a-repost',
    title: '字节 Agent 一面扩写',
    questions: sharedQuestions,
    candidateKinds: ['interview', 'operation'],
  });
  await writeEntry(root, 'b-rag', {
    clusterId: 'cluster-rag-eval',
    grade: 'B',
    url: 'https://www.nowcoder.com/discuss/b',
    title: '腾讯 Agent 面经',
    questions: ['如何用标注集评估 RAG 的召回质量？'],
    candidateKinds: ['interview'],
  });
  await writeEntry(root, 'c-marketing', {
    clusterId: 'cluster-marketing',
    grade: 'C',
    url: 'https://www.nowcoder.com/discuss/c',
    title: '营销汇编题',
    questions: ['未经验证的营销题能否直接进入题库？'],
    candidateKinds: ['interview', 'operation'],
  });

  const result = await buildInterviewGap(root, { date: '2026-08-23', write: true });

  assert.equal(result.summary.inputEntries, 4);
  assert.equal(result.summary.contentClusters, 3);
  assert.equal(result.summary.eligibleClusters, 2);
  assert.deepEqual(
    result.rows.map(row => [row.status, row.question]),
    [
      ['covered', '什么是 Agent Loop？'],
      ['evolved', '如何避免 Agent 工具调用失败并实现降级？'],
      ['new', 'Context 压缩如何保留失败历史？'],
      ['new', '如何用标注集评估 RAG 的召回质量？'],
    ],
  );
  assert.match(result.interviewMarkdown, /\| covered \| 什么是 Agent Loop？/);
  assert.match(result.interviewMarkdown, /\| evolved \| 如何避免 Agent 工具调用失败并实现降级？/);
  assert.match(result.interviewMarkdown, /\| new \| Context 压缩如何保留失败历史？/);
  assert.match(result.interviewMarkdown, /https:\/\/www\.nowcoder\.com\/discuss\/a/);
  assert.match(result.interviewMarkdown, /https:\/\/www\.nowcoder\.com\/discuss\/a-repost/);
  assert.doesNotMatch(result.interviewMarkdown, /未经验证的营销题能否直接进入题库/);
  assert.match(result.interviewMarkdown, /C 级证据排除：1 个内容簇/);
  assert.match(result.operationMarkdown, /字节 Agent 一面/);
  assert.doesNotMatch(result.operationMarkdown, /营销汇编题/);

  assert.equal(
    await readFile(join(root, '_inbox', '_reports', 'interview-gap-2026-08-23.md'), 'utf8'),
    result.interviewMarkdown,
  );
  assert.equal(
    await readFile(join(root, '_inbox', '_reports', 'operation-topics-2026-08-23.md'), 'utf8'),
    result.operationMarkdown,
  );
});

test('limits generated reports to the requested Data Collector batch', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-journey-gap-batch-'));
  await writeEntry(root, 'current', {
    clusterId: 'cluster-current',
    grade: 'A',
    url: 'https://www.nowcoder.com/discuss/current',
    title: '当前批次',
    questions: ['如何设计 Agent 记忆？'],
    batchId: 'batch-current',
  });
  await writeEntry(root, 'old', {
    clusterId: 'cluster-old',
    grade: 'A',
    url: 'https://www.nowcoder.com/discuss/old',
    title: '历史批次',
    questions: ['如何实现旧批次功能？'],
    batchId: 'batch-old',
  });

  const result = await buildInterviewGap(root, {
    date: '2026-08-23',
    batch: 'batch-current',
    write: false,
  });

  assert.equal(result.summary.inputEntries, 1);
  assert.match(result.interviewMarkdown, /如何设计 Agent 记忆/);
  assert.doesNotMatch(result.interviewMarkdown, /旧批次/);
});
