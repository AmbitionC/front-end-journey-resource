import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { syncInterviewTopicWeights } from '../scripts/sync-interview-topic-weights.mjs';
import { reviewFixture, freezeFixtureReview, git } from './release-review-fixture.mjs';

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
    await writeFile(`${root}.private-history.json`, JSON.stringify({
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

    assert.deepEqual(await syncInterviewTopicWeights(root,{historyPath:`${root}.private-history.json`}), {
      updatedTopics: 1, addedClusters: 2, removedClusters: 0, updatedArticles: 1, treeOrderChanged: true,
    });
    assert.deepEqual(await syncInterviewTopicWeights(root,{historyPath:`${root}.private-history.json`}), {
      updatedTopics: 0, addedClusters: 0, removedClusters: 0, updatedArticles: 0, treeOrderChanged: false,
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

    const historyPath = `${root}.private-history.json`;
    const history = JSON.parse(await readFile(historyPath, 'utf8'));
    history.records.cccccccccccc.status = 'skipped';
    await writeFile(historyPath, JSON.stringify(history));
    assert.deepEqual(await syncInterviewTopicWeights(root,{historyPath:`${root}.private-history.json`}), {
      updatedTopics: 1, addedClusters: 0, removedClusters: 1, updatedArticles: 1, treeOrderChanged: false,
    });
    tree = JSON.parse(await readFile(join(root, 'knowledge', '_tree.json'), 'utf8'));
    assert.equal(tree[0].children[0].heat, 7);
    assert.deepEqual(tree[0].children[0].interviewClusters, ['cluster-a']);
    article = await readFile(join(root, 'knowledge', 'llm', 'agent-memory.md'), 'utf8');
    assert.doesNotMatch(article, /cluster-b/u);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(`${root}.private-history.json`,{force:true});
  }
});

test('private heat activates only prepared sourceId/articleKey pairs in the pinned current review', () => reviewFixture(async f => {
  f.history.records.bbbbbbbbbbbb = {
    ...f.history.records.aaaaaaaaaaaa, clusterId: 'other-batch', processUnitId: 'other-process',
    url: 'https://www.nowcoder.com/discuss/other', articleKey: 'other-article',
    normalizedBodySha256: 'b'.repeat(64),
  };
  await writeFile(f.historyPath, JSON.stringify(f.history));
  await freezeFixtureReview(f);
  await syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] });
  const [leaf] = JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8'));
  assert.equal(leaf.interviewCount, 1);
  assert.equal(leaf.heat, 1);
}));

async function weightFixture(run, children) {
  const root = await mkdtemp(join(tmpdir(), 'weight-order-')), historyPath = `${root}.history.json`;
  try {
    await mkdir(join(root, 'knowledge/topic'), { recursive: true });
    await mkdir(join(root, 'interview/company'), { recursive: true });
    await writeFile(join(root, 'knowledge/_tree.json'), JSON.stringify([{ key: 'category', children }]));
    await writeFile(join(root, 'knowledge/topic/hot.md'), '知识内容。\n');
    await writeFile(join(root, 'interview/_tree.json'), JSON.stringify([{ key: 'article', label: '面经', isLeaf: true, filePath: 'company' }]));
    await writeFile(historyPath, JSON.stringify({ records: { first: { status: 'published', clusterId: 'cluster-a', articleKey: 'article', knowledgeKeys: ['hot'] } } }));
    await run(root, { historyPath });
  } finally { await rm(root, { recursive: true, force: true }); await rm(historyPath, { force: true }); }
}

const hot = { key: 'hot', isLeaf: true, filePath: 'topic', heat: 1, currRank: 1, interviewBaseHeat: 0, interviewClusters: ['cluster-a'] };
test('corrects stale sibling order independently of unchanged heat and keeps a rerun byte-identical', () => weightFixture(async (root, options) => {
  // Prepare the already-correct backlink first, then deliberately reverse order.
  await syncInterviewTopicWeights(root, options);
  const treePath = join(root, 'knowledge/_tree.json'), tree = JSON.parse(await readFile(treePath, 'utf8'));
  tree[0].children.sort((a, b) => a.heat - b.heat);
  await writeFile(treePath, JSON.stringify(tree));
  const changed = await syncInterviewTopicWeights(root, options);
  assert.equal(changed.updatedTopics, 0);
  assert.equal(changed.treeOrderChanged, true);
  assert.deepEqual(JSON.parse(await readFile(treePath, 'utf8'))[0].children.map(n => n.key), ['hot', 'cold']);
  const before = await readFile(treePath), articleBefore = await readFile(join(root, 'knowledge/topic/hot.md'));
  const rerun = await syncInterviewTopicWeights(root, options);
  assert.equal(rerun.treeOrderChanged, false);
  assert.deepEqual(await readFile(treePath), before);
  assert.deepEqual(await readFile(join(root, 'knowledge/topic/hot.md')), articleBefore);
}, [{ key: 'cold', isLeaf: true, heat: 0 }, hot]));

test('keeps equal heat stable and category slots fixed while sorting leaf slots', () => weightFixture(async (root, options) => {
  await syncInterviewTopicWeights(root, options);
  const tree = JSON.parse(await readFile(join(root, 'knowledge/_tree.json'), 'utf8'));
  assert.deepEqual(tree[0].children.map(n => n.key), ['hot', 'subcategory', 'tie-a', 'tie-b']);
}, [{ key: 'tie-a', isLeaf: true, heat: 0 }, { key: 'subcategory', children: [] }, { key: 'tie-b', isLeaf: true, heat: 0 }, hot]));

test('explicit zero baseline prevents the first interview source from doubling initial heat', () => weightFixture(async (root, options) => {
  await syncInterviewTopicWeights(root, options);
  const leaf = JSON.parse(await readFile(join(root, 'knowledge/_tree.json'), 'utf8'))[0].children[0];
  assert.equal(leaf.heat, 1);
  assert.equal(leaf.interviewBaseHeat, 0);
}, [{ ...hot, interviewClusters: undefined }]));

test('retracting a bound question clears its private count and managed backlink', () => reviewFixture(async f => {
  await syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] });
  f.history.records.aaaaaaaaaaaa.knowledgeKeys = [];
  const question = f.ledger.rows[0].questions[0];
  question.knowledgeKey = null; question.bindingStatus = 'pending_missing_keyword';
  delete f.interview.contentFormat;
  await writeFile(join(f.root, 'interview/_tree.json'), JSON.stringify([f.interview]));
  await writeFile(f.historyPath, JSON.stringify(f.history));
  await writeFile(join(f.root, 'interview/company/article.md'), '<details><summary>（1）问题😀</summary></details>\n\n教学短答。\n');
  await freezeFixtureReview(f);
  const { validateContentReview } = await import('../scripts/content-review.mjs');
  assert.deepEqual(await validateContentReview(f.root, f.historyPath, f.reviewPath, f.options.reviewSha256), []);
  await syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] });
  const [leaf] = JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8'));
  assert.equal(leaf.heat, 0); assert.equal(leaf.interviewCount, 0);
  const article = await readFile(join(f.root, 'knowledge/topic/real-key.md'), 'utf8');
  const managed = article.split('<!-- interview-source-history:start -->')[1].split('<!-- interview-source-history:end -->')[0];
  assert.doesNotMatch(managed, /article\.md/u);
}));

async function legacyCountOnly(f) {
  delete f.knowledge.interviewBaseHeat;
  Object.assign(f.knowledge, { heat: 7, currRank: 4, interviewCount: 1 });
  await writeFile(join(f.root, 'knowledge/_tree.json'), JSON.stringify([f.knowledge]));
  const path = join(f.root, 'knowledge/topic/real-key.md');
  await writeFile(path, `${await readFile(path, 'utf8')}\n## 出现于（热度来源）\n\n<!-- interview-source-history:start -->\n- [旧面经](../../interview/company/article.md)\n<!-- interview-source-history:end -->\n`);
  git(f.root, 'add', '.'); git(f.root, 'commit', '-qm', 'existing count-only legacy knowledge');
  f.baseCommit = git(f.root, 'rev-parse', 'HEAD'); f.review.baseCommit = f.baseCommit;
  await freezeFixtureReview(f);
}

test('legacy count-only leaves retain their baseline instead of adding a source twice', () => reviewFixture(async f => {
  await legacyCountOnly(f);
  await syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] });
  const [leaf] = JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8'));
  assert.equal(leaf.heat, 7); assert.equal(leaf.interviewBaseHeat, 6); assert.equal(leaf.interviewCount, 1);
  await freezeFixtureReview(f);
  const before = await readFile(join(f.root, 'knowledge/_tree.json'));
  const rerun = await syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] });
  assert.deepEqual(rerun, { updatedTopics: 0, addedClusters: 0, removedClusters: 0, updatedArticles: 0, treeOrderChanged: false });
  assert.deepEqual(await readFile(join(f.root, 'knowledge/_tree.json')), before);
}));

test('retracting the last source recalculates legacy count-only leaves', () => reviewFixture(async f => {
  await legacyCountOnly(f);
  f.history.records.aaaaaaaaaaaa.knowledgeKeys = [];
  const question = f.ledger.rows[0].questions[0];
  question.knowledgeKey = null; question.bindingStatus = 'pending_missing_keyword';
  delete f.interview.contentFormat;
  await writeFile(join(f.root, 'interview/_tree.json'), JSON.stringify([f.interview]));
  await writeFile(join(f.root, 'interview/company/article.md'), '<details><summary>（1）问题😀</summary></details>\n\n教学短答。\n');
  await writeFile(f.historyPath, JSON.stringify(f.history));
  await freezeFixtureReview(f);
  await syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] });
  const [leaf] = JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8'));
  assert.equal(leaf.heat, 6); assert.equal(leaf.interviewBaseHeat, 6); assert.equal(leaf.interviewCount, 0);
  const article = await readFile(join(f.root, 'knowledge/topic/real-key.md'), 'utf8');
  const managed = article.split('<!-- interview-source-history:start -->')[1].split('<!-- interview-source-history:end -->')[0];
  assert.doesNotMatch(managed, /article\.md/u);
}));
