import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inspectBatch } from './inspect-batch.mjs';

async function writeEntry(root, name, meta, original = '#### 如何设计 Agent 工具调用？\n') {
  const directory = join(root, '_inbox', 'nowcoder', name);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'meta.json'), `${JSON.stringify(meta)}\n`);
  await writeFile(join(directory, 'original.md'), original);
}

function meta(overrides = {}) {
  return {
    id: 'a1b2c3d4e5f6',
    source: 'nowcoder',
    title: '字节 Agent 面经',
    url: 'https://www.nowcoder.com/discuss/1001',
    contentHash: '0123456789abcdef',
    sourceMetadata: {
      batchId: 'batch-current',
      planId: 'nowcoder-agent-market',
      evidenceGrade: 'A',
    },
    feJourney: {
      candidateKinds: ['interview', 'knowledge'],
      qualityScore: 80,
      clusterId: 'cluster-agent-tools',
    },
    ...overrides,
  };
}

test('scopes one batch, deduplicates clusters, filters C evidence, and isolates operation-only candidates', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-inspect-batch-'));
  try {
    await writeEntry(root, 'a-primary', meta());
    await writeEntry(root, 'b-same-cluster', meta({
      id: 'b1b2c3d4e5f6',
      url: 'https://www.nowcoder.com/discuss/1002',
      sourceMetadata: { batchId: 'batch-current', planId: 'nowcoder-agent-market', evidenceGrade: 'B' },
    }));
    await writeEntry(root, 'c-same-cluster', meta({
      id: 'c1b2c3d4e5f6',
      url: 'https://www.nowcoder.com/discuss/1003',
      sourceMetadata: { batchId: 'batch-current', planId: 'nowcoder-agent-market', evidenceGrade: 'C' },
    }));
    await writeEntry(root, 'operation-only', meta({
      id: 'd1b2c3d4e5f6',
      title: '争议话题',
      url: 'https://www.nowcoder.com/discuss/2001',
      feJourney: { candidateKinds: ['operation'], qualityScore: 72, clusterId: 'cluster-operation' },
    }));
    await writeEntry(root, 'c-only-public', meta({
      id: 'e1b2c3d4e5f6',
      url: 'https://www.nowcoder.com/discuss/3001',
      sourceMetadata: { batchId: 'batch-current', planId: 'nowcoder-agent-market', evidenceGrade: 'C' },
      feJourney: { candidateKinds: ['interview'], qualityScore: 70, clusterId: 'cluster-c-only' },
    }));
    await writeEntry(root, 'wrong-batch', meta({
      id: 'f1b2c3d4e5f6',
      title: '历史批次',
      sourceMetadata: { batchId: 'batch-old', planId: 'nowcoder-agent-market', evidenceGrade: 'A' },
      feJourney: { candidateKinds: ['interview'], qualityScore: 90, clusterId: 'cluster-old' },
    }));
    const before = await readdir(join(root, '_inbox', 'nowcoder'));

    const report = await inspectBatch(root, 'batch-current');

    assert.equal(report.clusters.length, 3);
    assert.deepEqual(report.publicContent.map(item => item.clusterId), ['cluster-agent-tools']);
    assert.deepEqual(report.publicContent[0].sources.map(source => source.grade), ['A', 'B']);
    assert.deepEqual(report.operation.map(item => item.clusterId), ['cluster-operation']);
    assert.equal(report.operation.some(item => item.clusterId === 'cluster-agent-tools'), false);
    assert.deepEqual(report.blocked, [{
      clusterId: 'cluster-c-only',
      reason: '公开内容没有 A/B 证据',
      paths: ['_inbox/nowcoder/c-only-public'],
    }]);
    assert.equal(JSON.stringify(report).includes('历史批次'), false);
    assert.deepEqual(await readdir(join(root, '_inbox', 'nowcoder')), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scopes pooled delivery by deliveryBatchId while preserving the original capture batch', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-inspect-delivery-batch-'));
  try {
    await writeEntry(root, 'pooled-source', meta({
      sourceMetadata: {
        batchId: 'batch-captured-earlier',
        sourceBatchId: 'batch-captured-earlier',
        deliveryBatchId: 'batch-delivered-now',
        planId: 'nowcoder-agent-market',
        evidenceGrade: 'A',
      },
    }));

    const delivered = await inspectBatch(root, 'batch-delivered-now');
    const captured = await inspectBatch(root, 'batch-captured-earlier');

    assert.deepEqual(delivered.publicContent.map(item => item.clusterId), ['cluster-agent-tools']);
    assert.deepEqual(captured.publicContent, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('accepts an explicitly directed delivery without pretending it came from the fixed plan', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-inspect-directed-batch-'));
  try {
    await writeEntry(root, 'directed-source', meta({
      sourceMetadata: {
        deliveryBatchId: 'directed-run-1',
        deliveryKind: 'nowcoder-directed',
        evidenceGrade: 'A',
      },
    }));

    const report = await inspectBatch(root, 'directed-run-1');

    assert.deepEqual(report.publicContent.map(item => item.clusterId), ['cluster-agent-tools']);
    assert.deepEqual(report.malformed, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('separates exclusion, truncation, and malformed inputs without modifying files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-inspect-blocked-'));
  try {
    await writeEntry(root, 'excluded', meta({
      id: '111111111111',
      feJourney: {
        candidateKinds: ['interview'], qualityScore: 20, clusterId: 'cluster-excluded',
        exclusionReasons: ['营销内容'],
      },
    }));
    await writeEntry(root, 'truncated', meta({ id: '222222222222', truncated: true }));
    const broken = join(root, '_inbox', 'nowcoder', 'broken');
    await mkdir(broken, { recursive: true });
    await writeFile(join(broken, 'meta.json'), '{broken');
    await writeFile(join(broken, 'original.md'), '正文');
    const brokenBefore = await readFile(join(broken, 'meta.json'), 'utf8');

    const report = await inspectBatch(root, 'batch-current');

    assert.equal(report.skipped[0].reason, '营销内容');
    assert.equal(report.blocked.some(item => item.reason === '正文被截断'), true);
    assert.equal(report.malformed.length, 1);
    assert.equal(await readFile(join(broken, 'meta.json'), 'utf8'), brokenBefore);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('skips an unchanged source already recorded in committed history', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fe-inspect-history-'));
  try {
    await writeEntry(root, 'already-published', meta());
    await mkdir(join(root, '.codex'), { recursive: true });
    await writeFile(join(root, '.codex', 'interview-source-history.json'), `${JSON.stringify({
      schemaVersion: 1,
      updatedAt: '2026-08-23',
      records: {
        a1b2c3d4e5f6: {
          source: 'nowcoder',
          url: 'https://www.nowcoder.com/discuss/1001',
          contentHash: '0123456789abcdef',
          clusterId: 'cluster-agent-tools',
          company: 'bytedance',
          evidenceGrade: 'A',
          status: 'published',
          articleKey: 'bytedance-agent-1',
          publicFiles: ['interview/bytedance/ai/bytedance-agent-1.md'],
          knowledgeKeys: ['agent-tool-design'],
          processedAt: '2026-08-23T15:00:00.000Z',
        },
      },
    }, null, 2)}\n`);

    const report = await inspectBatch(root, 'batch-current');

    assert.deepEqual(report.publicContent, []);
    assert.deepEqual(report.previouslyProcessed, [{
      clusterId: 'cluster-agent-tools',
      reason: '来源内容未变化且已有处理记录',
      paths: ['_inbox/nowcoder/already-published'],
      sources: [{
        id: 'a1b2c3d4e5f6',
        url: 'https://www.nowcoder.com/discuss/1001',
        contentHash: '0123456789abcdef',
      }],
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
