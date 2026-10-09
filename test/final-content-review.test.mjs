import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile, readFile, mkdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { reviewFixture, freezeFixtureReview, git } from './release-review-fixture.mjs';
import { sha256, normalizedOriginal } from '../scripts/content-review.mjs';
import { syncInterviewTopicWeights } from '../scripts/sync-interview-topic-weights.mjs';
import { validatePrivateInterviewHistory } from '../scripts/validate-private-interview-history.mjs';

const check=f=>validatePrivateInterviewHistory(f.root,f.historyPath,f.options);

test('final content receipt binds external history, original, question ledger and all publication bytes',()=>reviewFixture(async f=>{
  assert.deepEqual(await check(f),[]);
  assert.match((await validatePrivateInterviewHistory(f.root,f.historyPath)).join(),/绝对路径及固定/u);
  const wrong={...f.options,reviewSha256:'0'.repeat(64)};
  assert.match((await validatePrivateInterviewHistory(f.root,f.historyPath,wrong)).join(),/指纹不一致/u);
  await mkdir(join(f.root,'private'));
  await writeFile(join(f.root,'private/review.json'),await readFile(f.reviewPath));
  assert.match((await validatePrivateInterviewHistory(f.root,f.historyPath,{...f.options,reviewPath:join(f.root,'private/review.json')})).join(),/公开仓库外/u);
  await symlink(join(f.root,'private/review.json'),join(f.folder,'outside-link.json'));
  assert.match((await validatePrivateInterviewHistory(f.root,f.historyPath,{...f.options,reviewPath:join(f.folder,'outside-link.json')})).join(),/公开仓库外/u);
}));

for(const status of ['published','merged']) test(`editing prepared into ${status} cannot bypass final review`,()=>reviewFixture(async f=>{
  f.history.records.aaaaaaaaaaaa.status=status;
  await writeFile(f.historyPath,JSON.stringify(f.history));
  assert.match((await check(f)).join(),/指纹不一致/u);
}));

for(const path of ['knowledge/topic/real-key.md','knowledge/_tree.json','interview/company/article.md','images/image.png']) {
  test(`review becomes invalid after changing ${path}`,()=>reviewFixture(async f=>{
    await writeFile(join(f.root,path),'changed after approval');
    assert.match((await check(f)).join(),/最终审核版本不一致/u);
  }));
}

test('source replacement and pending independent decision both fail closed',()=>reviewFixture(async f=>{
  const original=await readFile(f.sourcePath);
  await writeFile(f.sourcePath,'replaced original');
  assert.match((await check(f)).join(),/指纹不一致/u);
  await writeFile(f.sourcePath,original);
  await writeFile(f.review.independentReview.path,JSON.stringify({decision:'pending'}));
  f.review.independentReview=await f.pin(f.review.independentReview.path);
  await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/独立审查未通过/u);
}));

test('changed new article cannot be silently excluded from the reviewed source scope',()=>reviewFixture(async f=>{
  await writeFile(join(f.root,'interview/company/unreviewed.md'),'new unreviewed article');
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview,{...f.interview,key:'unreviewed'}]));
  await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/缺本批原文审核/u);
}));

test('actual identical originals across URLs reject a new page despite forged metadata hashes and clusters',()=>reviewFixture(async f=>{
  const source=join(f.folder,'other.json'),url='https://www.nowcoder.com/discuss/987654321';
  await writeFile(source,JSON.stringify({document:{canonicalUrl:url,text:'问 题😀\n'}}));
  f.review.sourceEvidence.push({...await f.pin(source),documentJson:true,sourceId:'bbbbbbbbbbbb',canonicalUrl:url,articleKey:'duplicate-page',processUnitId:'made-up-process'});
  f.history.records.bbbbbbbbbbbb={...f.history.records.aaaaaaaaaaaa,url,contentHash:'ffffffffffffffff',clusterId:'made-up-cluster',processUnitId:'made-up-process',articleKey:'duplicate-page'};
  await writeFile(f.historyPath,JSON.stringify(f.history)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/跨 URL 同原文/u);
}));

async function historicalBaseline(f,text,processUnitId) {
  const old={key:'prior-page',filePath:'company',isLeaf:true},url='https://www.nowcoder.com/discuss/987654321';
  await writeFile(join(f.root,'interview/company/prior-page.md'),'历史面经。');
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([old]));
  git(f.root,'add','interview/_tree.json','interview/company/prior-page.md');git(f.root,'commit','-qm','existing historical page');
  f.baseCommit=git(f.root,'rev-parse','HEAD');f.review.baseCommit=f.baseCommit;
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview,old]));
  const path=join(f.folder,'historical-source.json');await writeFile(path,JSON.stringify({document:{canonicalUrl:url,text}}));
  f.history.records.bbbbbbbbbbbb={...f.history.records.aaaaaaaaaaaa,url,articleKey:'prior-page',status:'published',processUnitId,normalizedBodySha256:sha256(normalizedOriginal(text)),originalBodyEvidenceFile:path,originalBodySha256:(await f.pin(path)).sha256,originalBodyDocumentJson:true};
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
}

test('existing process reuses its public key unless reviewed distinct-round evidence allows both',()=>reviewFixture(async f=>{
  await historicalBaseline(f,'旧轮次的不同原文','process-a');
  assert.match((await check(f)).join(),/既有流程必须复用已有 key/u);
}));

test('question spans use Unicode codepoints and reject overshooting or mismatched short answers',()=>reviewFixture(async f=>{
  f.ledger.rows[0].questions[0].sourceSpan[1]++; await writeFile(f.ledgerPath,JSON.stringify(f.ledger)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/原题坐标/u);
  f.ledger.rows[0].questions[0].sourceSpan[1]--; f.ledger.rows[0].questions[0].teachingAnswer='invented answer';
  await writeFile(f.ledgerPath,JSON.stringify(f.ledger)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/短答或知识关联/u);
}));

test('private bound ledger rejects actual pending states or notices after all hashes are refreshed',()=>reviewFixture(async f=>{
  const file=join(f.root,'interview/company/article.md'),original=await readFile(file,'utf8');
  for(const content of [
    original.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="pending_semantic_verification"').replace('</details>','<p>关联知识点待核实。</p></details>'),
    original.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="pending_missing_keyword"'),
    original.replace('</details>','<p>关联知识点待核实。</p></details>'),
  ]) {
    await writeFile(file,content);await freezeFixtureReview(f);
    assert.match((await check(f)).join(),/已绑定问题不得带待核实状态或说明/u);
  }
  await writeFile(file,original.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="bound"'));
  await freezeFixtureReview(f);assert.deepEqual(await check(f),[]);
}));

test('missing-keyword questions require an explicit frozen pending reason',()=>reviewFixture(async f=>{
  delete f.interview.contentFormat;
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview]));
  await writeFile(join(f.root,'interview/company/article.md'),'<details><summary>（1）问题😀</summary></details>\n\n教学短答。\n');
  f.ledger.rows[0].questions[0].knowledgeKey=null;
  await writeFile(f.ledgerPath,JSON.stringify(f.ledger)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/待补原因/u);
  f.ledger.rows[0].questions[0].bindingStatus='pending_missing_keyword';
  await writeFile(f.ledgerPath,JSON.stringify(f.ledger)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/待补题不得计热/u);
  await assert.rejects(syncInterviewTopicWeights(f.root,{...f.options,privacyMode:true,historyPath:f.historyPath,keys:['real-key']}),/不更新热度/u);
  f.history.records.aaaaaaaaaaaa.knowledgeKeys=[];
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  assert.deepEqual(await check(f),[]);
  await syncInterviewTopicWeights(f.root,{...f.options,privacyMode:true,historyPath:f.historyPath,keys:['real-key']});
  const tree=JSON.parse(await readFile(join(f.root,'knowledge/_tree.json'),'utf8'));
  assert.equal(tree[0].heat??0,0);assert.equal(tree[0].interviewCount??0,0);
}));

test('image resync input is covered by both snapshot and final version binding',()=>reviewFixture(async f=>{
  await mkdir(join(f.root,'.codex'));
  await writeFile(join(f.root,'.codex/image-resync.txt'),'images/image.png\n');
  await freezeFixtureReview(f); assert.deepEqual(await check(f),[]);
  await writeFile(join(f.root,'.codex/image-resync.txt'),'images/unreviewed.png\n');
  assert.match((await check(f)).join(),/最终审核版本不一致/u);
}));

test('removing format metadata does not let an empty question ledger approve a new source article',()=>reviewFixture(async f=>{
  delete f.interview.contentFormat;
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview]));
  await writeFile(join(f.root,'interview/company/article.md'),'候选人自述，无原题。');
  f.ledger.rows[0].questions=[];await writeFile(f.ledgerPath,JSON.stringify(f.ledger));await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/非空真实问题映射/u);
}));

test('historical same original cannot be republished under another URL or invented process',()=>reviewFixture(async f=>{
  await historicalBaseline(f,'问题😀','invented-other-process');
  assert.match((await check(f)).join(),/跨批同原文/u);
}));

test('historical fingerprint without frozen original proof cannot drive deduplication',()=>reviewFixture(async f=>{
  await historicalBaseline(f,'历史不同题','different-process');
  delete f.history.records.bbbbbbbbbbbb.originalBodyEvidenceFile;
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/历史原文缺仓外冻结证据/u);
}));

test('registering an unchanged orphan body as a new page still requires source review',()=>reviewFixture(async f=>{
  await writeFile(join(f.root,'interview/company/orphan.md'),'既有孤儿正文。');
  git(f.root,'add','interview/company/orphan.md');git(f.root,'commit','-qm','historical orphan');
  f.baseCommit=git(f.root,'rev-parse','HEAD');f.review.baseCommit=f.baseCommit;
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview,{key:'orphan',filePath:'company',isLeaf:true}]));
  await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/新增或迁移面经目录叶子缺本批原文审核/u);
}));


test('removing a historical normalized hash cannot conceal the frozen duplicate original',()=>reviewFixture(async f=>{
  await historicalBaseline(f,'问题😀','forged-older-process');
  delete f.history.records.bbbbbbbbbbbb.normalizedBodySha256;
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/跨批同原文/u);
}));

test('removing a known public-page history record cannot conceal historical dedup coverage',()=>reviewFixture(async f=>{
  await historicalBaseline(f,'问题😀','forged-older-process');
  delete f.history.records.bbbbbbbbbbbb;
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/历史来源覆盖/u);
}));


for(const removeRecord of [false,true]) test(`removing a baseline directory leaf with unchanged old body cannot conceal duplicate originals (${removeRecord})`,()=>reviewFixture(async f=>{
  await historicalBaseline(f,'问题😀','forged-older-process');
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview]));
  if(removeRecord) delete f.history.records.bbbbbbbbbbbb;
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/留下孤儿绕过去重/u);
}));


test('retained public body cannot be declared deleted to conceal a real earlier directory entry',()=>reviewFixture(async f=>{
  const earlierBase=f.baseCommit;
  await historicalBaseline(f,'问题😀','forged-older-process');
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview]));
  delete f.history.records.bbbbbbbbbbbb;
  f.baseCommit=earlierBase;f.review.baseCommit=earlierBase;
  f.review.deletedPublicPaths=['interview/company/prior-page.md'];
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/真正删除的基线文件/u);
}));
