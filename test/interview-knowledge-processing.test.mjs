import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { reviewFixture, freezeFixtureReview } from './release-review-fixture.mjs';
import { validateContentReview } from '../scripts/content-review.mjs';

const check = f => validateContentReview(f.root, f.historyPath, f.reviewPath, f.options.reviewSha256);
const persist = async f => {
  await writeFile(f.ledgerPath, JSON.stringify(f.ledger));
  await freezeFixtureReview(f, { refreshKnowledgeEvidence: false });
};

test('read-only preparation exposes the actual skill and inventory without claiming execution or changing content', () => reviewFixture(async f => {
  const before = await readFile(join(f.root, 'knowledge/_tree.json'));
  const result = spawnSync(process.execPath, [resolve(import.meta.dirname, '../scripts/interview-knowledge-processing.mjs'), f.root, '--keys', 'real-key'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.status, 'needs_execution');
  assert.equal(plan.stage, 'processing');
  assert.equal(plan.skill.name, 'generate-knowledge-docs');
  assert.equal(plan.targets[0].key, 'real-key');
  assert.match(plan.skill.sha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(await readFile(join(f.root, 'knowledge/_tree.json')), before);
}));

test('missing per-question semantic association evidence blocks final publication review', () => reviewFixture(async f => {
  delete f.ledger.rows[0].questions[0].knowledgeAssociation;
  await persist(f);
  assert.match((await check(f)).join(), /知识关联证据/u);
}));

test('missing real skill execution evidence blocks review even with approved history and quality', () => reviewFixture(async f => {
  const q = f.ledger.rows[0].questions[0];
  q.knowledgeAssociation ??= { action: 'create', searchQuery: '问题', candidates: [], rationale: '新考点。' };
  delete q.knowledgeAssociation.skillExecution;
  await persist(f);
  assert.match((await check(f)).join(), /技能执行证据/u);
}));

test('missing independent knowledge quality conclusions block publication', () => reviewFixture(async f => {
  const independent = JSON.parse(await readFile(f.review.independentReview.path, 'utf8'));
  delete independent.knowledgeQuality;
  await writeFile(f.review.independentReview.path, JSON.stringify(independent));
  f.review.independentReview = await f.pin(f.review.independentReview.path);
  await persist(f);
  assert.match((await check(f)).join(), /知识质量审核/u);
}));

test('duplicate approved and rejected quality rows cannot conceal a rejected question', () => reviewFixture(async f => {
  const independent = JSON.parse(await readFile(f.review.independentReview.path, 'utf8'));
  independent.knowledgeQuality.questions.push({ ...independent.knowledgeQuality.questions[0], decision: 'rejected' });
  await writeFile(f.review.independentReview.path, JSON.stringify(independent));
  f.review.independentReview = await f.pin(f.review.independentReview.path);
  await persist(f);
  assert.match((await check(f)).join(), /知识质量审核.*范围/u);
}));

test('a claimed reuse cannot silently replace existing knowledge prose', () => reviewFixture(async f => {
  // Make this a genuinely existing article and re-freeze its reuse evidence.
  const { git } = await import('./release-review-fixture.mjs');
  git(f.root, 'add', '.'); git(f.root, 'commit', '-qm', 'existing article');
  f.baseCommit = git(f.root, 'rev-parse', 'HEAD'); f.review.baseCommit = f.baseCommit;
  await freezeFixtureReview(f);
  await writeFile(join(f.root, 'knowledge/topic/real-key.md'), '替换后的新机制。\n\n- [面经](../../interview/company/article.md)\n');
  await freezeFixtureReview(f);
  assert.match((await check(f)).join(), /reuse.*正文变化/u);
}));

for (const [name, mutate] of [
  ['pending run', run => { run.status = 'pending'; }],
  ['browser collection run', run => { run.stage = 'collection'; }],
  ['different skill instructions', run => { run.skill.sha256 = '0'.repeat(64); }],
  ['different source', run => { run.sourceId = 'bbbbbbbbbbbb'; }],
  ['stale knowledge output', run => { run.output.sha256 = '0'.repeat(64); }],
  ['missing actual transcript', run => { delete run.trace; }],
]) test(`rehashed ${name} cannot count as actual processing skill evidence`, () => reviewFixture(async f => {
  const association = f.ledger.rows[0].questions[0].knowledgeAssociation;
  const execution = JSON.parse(await readFile(association.skillExecution.path, 'utf8'));
  mutate(execution);
  await writeFile(association.skillExecution.path, JSON.stringify(execution));
  association.skillExecution = await f.pin(association.skillExecution.path);
  await persist(f);
  assert.ok((await check(f)).length > 0);
}));

for (const [name, mutate] of [
  ['rejected quality', quality => { quality.questions[0].decision = 'rejected'; }],
  ['unchecked accuracy', quality => { quality.questions[0].accuracy = false; }],
  ['stale publication digest', quality => { quality.publicationDigest = '0'.repeat(64); }],
  ['stale question mapping', quality => { quality.questionLedgerSha256 = '0'.repeat(64); }],
]) test(`${name} blocks publication despite refreshed outer pins`, () => reviewFixture(async f => {
  const independent = JSON.parse(await readFile(f.review.independentReview.path, 'utf8'));
  mutate(independent.knowledgeQuality);
  await writeFile(f.review.independentReview.path, JSON.stringify(independent));
  f.review.independentReview = await f.pin(f.review.independentReview.path);
  await persist(f);
  assert.match((await check(f)).join(), /知识质量审核/u);
}));

test('new knowledge without an explicit zero baseline blocks publication', () => reviewFixture(async f => {
  delete f.knowledge.interviewBaseHeat;
  await writeFile(join(f.root, 'knowledge/_tree.json'), JSON.stringify([f.knowledge]));
  await freezeFixtureReview(f);
  assert.match((await check(f)).join(), /interviewBaseHeat=0/u);
}));
