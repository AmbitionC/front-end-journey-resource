import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import * as weights from '../scripts/sync-interview-topic-weights.mjs';
import { sha256, normalizedOriginal, publicInventory } from '../scripts/content-review.mjs';
import { reviewFixture, freezeFixtureReview } from './release-review-fixture.mjs';

// All review/execution receipts in these fixtures are synthetic TEST ONLY data.
const input = async f => ({ history: await f.pin(f.historyPath), sources: [{ sourceId: 'aaaaaaaaaaaa', articleKey: 'article' }],
  sourceEvidence: f.review.sourceEvidence, keys: ['real-key'] });
const prepare = async (f, options) => {
  assert.equal(typeof weights.prepareInterviewTopicWeights, 'function', 'processing draft API must exist independently of final review');
  return weights.prepareInterviewTopicWeights(f.root, options ?? await input(f));
};

test('draft activates only explicit prepared pairs, preserves history and requires a fresh independent final review', () => reviewFixture(async f => {
  f.history.records.bbbbbbbbbbbb = { ...f.history.records.aaaaaaaaaaaa, status: 'prepared', articleKey: 'other-batch', clusterId: 'other-batch', normalizedBodySha256: 'b'.repeat(64) };
  await writeFile(f.historyPath, JSON.stringify(f.history));
  const historyBefore = await readFile(f.historyPath);
  const result = await prepare(f);
  assert.equal(result.status, 'needs_review');
  assert.equal(result.stage, 'processing');
  assert.equal(result.updatedTopics, 1);
  const [leaf] = JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8'));
  assert.equal(leaf.interviewCount, 1); assert.equal(leaf.heat, 1);
  assert.equal(leaf.interviewClusters, undefined);
  assert.deepEqual(await readFile(f.historyPath), historyBefore);
  const article = await readFile(join(f.root, 'knowledge/topic/real-key.md'), 'utf8');
  assert.doesNotMatch(article, /cluster-a|nowcoder|other-batch/u);
  await assert.rejects(weights.syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] }), /审核/u);
  await freezeFixtureReview(f); // TEST ONLY independent reviewer fixture; never production approval.
  const frozen = await publicInventory(f.root);
  assert.deepEqual(await weights.syncInterviewTopicWeights(f.root, { ...f.options, privacyMode: true, historyPath: f.historyPath, keys: ['real-key'] }),
    { updatedTopics: 0, addedClusters: 0, removedClusters: 0, updatedArticles: 0, treeOrderChanged: false });
  assert.deepEqual(await publicInventory(f.root), frozen);
  assert.deepEqual(await readFile(f.historyPath), historyBefore);
}));

test('actual originals merge aliases once and pending questions add no frequency', () => reviewFixture(async f => {
  const record = f.history.records.aaaaaaaaaaaa;
  Object.assign(record, { originalBodyEvidenceFile: f.sourcePath, originalBodySha256: (await f.pin(f.sourcePath)).sha256, originalBodyDocumentJson: true });
  f.history.records.bbbbbbbbbbbb = { ...record, status: 'merged', clusterId: 'alias-cluster', articleKey: 'article' };
  // A disconnected retired representative must not be revived by a merged alias.
  f.history.records.cccccccccccc = { status: 'merged', clusterId: 'inactive', knowledgeKeys: ['real-key'] };
  await writeFile(f.historyPath, JSON.stringify(f.history));
  await writeFile(join(f.root, 'interview/company/article.md'), `${await readFile(join(f.root, 'interview/company/article.md'), 'utf8')}\n<details data-binding-status="pending_semantic_verification"><summary>（2）待核实问题。关联知识点待核实。</summary></details>\n\n暂不绑定知识点。\n`);
  const options = await input(f); delete options.sourceEvidence;
  await prepare(f, options);
  const [leaf] = JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8'));
  assert.equal(leaf.interviewCount, 1);
  assert.equal(leaf.heat, 1);
}));

for (const [name, mutate] of [
  ['empty sources', (f, options) => { options.sources = []; }],
  ['duplicate pairs', (f, options) => { options.sources.push({ ...options.sources[0] }); }],
  ['wrong article pair', (f, options) => { options.sources[0].articleKey = 'other-article'; }],
  ['published selected record', (f) => { f.history.records.aaaaaaaaaaaa.status = 'published'; }],
  ['empty keys', (f, options) => { options.keys = []; }],
  ['unknown key', (f, options) => { options.keys.push('unknown-key'); }],
  ['duplicate keys', (f, options) => { options.keys.push('real-key'); }],
  ['stale history pin', (f, options) => { options.history.sha256 = '0'.repeat(64); }],
  ['invented normalized fingerprint', (f) => { f.history.records.aaaaaaaaaaaa.normalizedBodySha256 = '0'.repeat(64); }],
  ['missing stored normalized fingerprint', (f) => { delete f.history.records.aaaaaaaaaaaa.normalizedBodySha256; }],
  ['malformed document JSON cannot stand in for an original', async (f) => {
    const path = join(f.folder, 'malformed-document.json'), bytes = '{"metadata":"no original document"}';
    await writeFile(path, bytes);
    Object.assign(f.history.records.aaaaaaaaaaaa, { originalBodyEvidenceFile: path, originalBodySha256: sha256(bytes), originalBodyDocumentJson: true, normalizedBodySha256: sha256(normalizedOriginal(bytes)) });
  }],
  ['active alias without actual evidence', (f) => { f.history.records.bbbbbbbbbbbb = { status: 'merged', clusterId: 'cluster-a', knowledgeKeys: ['real-key'], normalizedBodySha256: sha256(normalizedOriginal('invented')) }; }],
  ['pending question incorrectly included in history', async (f) => {
    await writeFile(join(f.root, 'interview/company/article.md'), '<details data-binding-status="pending_semantic_verification"><summary>（1）问题😀。关联知识点待核实。</summary></details>\n\n暂不绑定。\n');
  }],
]) test(`${name} rejects the draft before any publication write`, () => reviewFixture(async f => {
  const options = await input(f);
  await mutate(f, options);
  await writeFile(f.historyPath, JSON.stringify(f.history));
  if (name !== 'stale history pin') options.history = await f.pin(f.historyPath);
  const before = await publicInventory(f.root), historyBefore = await readFile(f.historyPath);
  await assert.rejects(prepare(f, options));
  assert.deepEqual(await publicInventory(f.root), before);
  assert.deepEqual(await readFile(f.historyPath), historyBefore);
}));

test('CLI draft pins both private inputs and reports only preparation counts', () => reviewFixture(async f => {
  const options = await input(f), sourcesPath = join(f.folder, 'draft-sources.json');
  await writeFile(sourcesPath, JSON.stringify({ sources: options.sources, sourceEvidence: options.sourceEvidence }));
  const sources = await f.pin(sourcesPath);
  const result = spawnSync(process.execPath, [resolve(import.meta.dirname, '../scripts/sync-interview-topic-weights.mjs'), f.root,
    '--prepare', '--history', options.history.path, '--history-sha', options.history.sha256,
    '--sources', sources.path, '--sources-sha', sources.sha256, '--keys', 'real-key'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'needs_review'); assert.equal(report.updatedTopics, 1);
  assert.doesNotMatch(result.stdout, /nowcoder|cluster-a|aaaaaaaaaaaa|approved|completed|published/u);
}));
