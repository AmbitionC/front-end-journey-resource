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
    await mkdir(join(root, 'knowledge', 'llm'), { recursive: true });
    await mkdir(join(root, 'interview', 'bytedance'), { recursive: true });
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
        aaaaaaaaaaaa: { status: 'published', clusterId: 'cluster-a', articleKey: 'byte-a', publicFiles: ['interview/bytedance/byte-a.md'], knowledgeKeys: ['agent-memory'] },
        bbbbbbbbbbbb: { status: 'merged', clusterId: 'cluster-a', knowledgeKeys: ['agent-memory'] },
        cccccccccccc: { status: 'published', clusterId: 'cluster-b', articleKey: 'byte-b', publicFiles: ['interview/bytedance/byte-b.md'], knowledgeKeys: ['agent-memory'] },
      },
    }));
    await writeFile(join(root, 'interview', '_tree.json'), JSON.stringify([{
      label: '字节', key: 'byte', children: [
        { label: '面经 A', key: 'byte-a', isLeaf: true, filePath: 'bytedance' },
        { label: '面经 B', key: 'byte-b', isLeaf: true, filePath: 'bytedance' },
      ],
    }]));
    await writeFile(join(root, 'knowledge', 'llm', 'agent-memory.md'), '# 记忆\n\n## 参考资料\n');

    assert.deepEqual(await syncInterviewTopicWeights(root), {
      updatedTopics: 1, addedClusters: 2, removedClusters: 0, updatedArticles: 1,
    });
    assert.deepEqual(await syncInterviewTopicWeights(root), {
      updatedTopics: 0, addedClusters: 0, removedClusters: 0, updatedArticles: 0,
    });

    let tree = JSON.parse(await readFile(join(root, 'knowledge', '_tree.json'), 'utf8'));
    assert.equal(tree[0].children[0].key, 'agent-memory');
    assert.equal(tree[0].children[0].heat, 8);
    assert.equal(tree[0].children[0].currRank, 5);
    assert.equal(tree[0].children[0].interviewBaseHeat, 6);
    assert.deepEqual(tree[0].children[0].interviewClusters, ['cluster-a', 'cluster-b']);
    let article = await readFile(join(root, 'knowledge', 'llm', 'agent-memory.md'), 'utf8');
    assert.match(article, /面经 A.*cluster-a/u);
    assert.match(article, /面经 B.*cluster-b/u);

    const historyPath = join(root, '.codex', 'interview-source-history.json');
    const history = JSON.parse(await readFile(historyPath, 'utf8'));
    history.records.cccccccccccc.status = 'skipped';
    await writeFile(historyPath, JSON.stringify(history));
    assert.deepEqual(await syncInterviewTopicWeights(root), {
      updatedTopics: 1, addedClusters: 0, removedClusters: 1, updatedArticles: 1,
    });
    tree = JSON.parse(await readFile(join(root, 'knowledge', '_tree.json'), 'utf8'));
    assert.equal(tree[0].children[0].heat, 7);
    assert.deepEqual(tree[0].children[0].interviewClusters, ['cluster-a']);
    article = await readFile(join(root, 'knowledge', 'llm', 'agent-memory.md'), 'utf8');
    assert.doesNotMatch(article, /cluster-b/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
