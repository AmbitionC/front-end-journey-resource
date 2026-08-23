import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { syncInterviewTopicWeights } from '../scripts/sync-interview-topic-weights.mjs';

test('adds one heat per new source cluster and stays idempotent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'interview-topic-weights-'));
  try {
    await mkdir(join(root, 'knowledge'), { recursive: true });
    await mkdir(join(root, '.codex'), { recursive: true });
    await writeFile(join(root, 'knowledge', '_tree.json'), JSON.stringify([{
      label: 'Agent',
      key: 'agent',
      children: [
        { label: '低频', key: 'low', isLeaf: true, filePath: 'llm', heat: 1, currRank: 1 },
        { label: '记忆', key: 'agent-memory', isLeaf: true, filePath: 'llm', heat: 6, currRank: 4 },
      ],
    }]));
    await writeFile(join(root, '.codex', 'interview-source-history.json'), JSON.stringify({
      schemaVersion: 1,
      updatedAt: '2026-08-23',
      records: {
        aaaaaaaaaaaa: { status: 'published', clusterId: 'cluster-a', knowledgeKeys: ['agent-memory'] },
        bbbbbbbbbbbb: { status: 'merged', clusterId: 'cluster-a', knowledgeKeys: ['agent-memory'] },
        cccccccccccc: { status: 'published', clusterId: 'cluster-b', knowledgeKeys: ['agent-memory'] },
      },
    }));

    assert.deepEqual(await syncInterviewTopicWeights(root), { updatedTopics: 1, addedClusters: 2 });
    assert.deepEqual(await syncInterviewTopicWeights(root), { updatedTopics: 0, addedClusters: 0 });

    const tree = JSON.parse(await readFile(join(root, 'knowledge', '_tree.json'), 'utf8'));
    assert.equal(tree[0].children[0].key, 'agent-memory');
    assert.equal(tree[0].children[0].heat, 8);
    assert.equal(tree[0].children[0].currRank, 5);
    assert.deepEqual(tree[0].children[0].interviewClusters, ['cluster-a', 'cluster-b']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
