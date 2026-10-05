import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile, readFile, mkdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { reviewFixture, freezeFixtureReview } from './release-review-fixture.mjs';
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
  assert.match((await check(f)).join(),/排除在本批原文审核之外/u);
}));

test('actual identical originals across URLs reject a new page despite forged metadata hashes and clusters',()=>reviewFixture(async f=>{
  const source=join(f.folder,'other.json'),url='https://www.nowcoder.com/discuss/987654321';
  await writeFile(source,JSON.stringify({document:{canonicalUrl:url,text:'问 题😀\n'}}));
  f.review.sourceEvidence.push({...await f.pin(source),documentJson:true,sourceId:'bbbbbbbbbbbb',canonicalUrl:url,articleKey:'duplicate-page',processUnitId:'made-up-process'});
  f.history.records.bbbbbbbbbbbb={...f.history.records.aaaaaaaaaaaa,url,contentHash:'ffffffffffffffff',clusterId:'made-up-cluster',processUnitId:'made-up-process',articleKey:'duplicate-page'};
  await writeFile(f.historyPath,JSON.stringify(f.history)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/跨 URL 同原文/u);
}));

test('existing process reuses its public key unless reviewed distinct-round evidence allows both',()=>reviewFixture(async f=>{
  const old={...f.interview,key:'prior-page'};
  await writeFile(join(f.root,'interview/_tree.json'),JSON.stringify([f.interview,old]));
  await writeFile(join(f.root,'interview/company/prior-page.md'),'历史面经。');
  f.history.records.bbbbbbbbbbbb={...f.history.records.aaaaaaaaaaaa,url:'https://www.nowcoder.com/discuss/987654321',articleKey:'prior-page',status:'published'};
  f.review.articleKeys.push('prior-page');
  await writeFile(f.historyPath,JSON.stringify(f.history));
  await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/复用已有 key/u);
}));

test('question spans use Unicode codepoints and reject overshooting or mismatched short answers',()=>reviewFixture(async f=>{
  f.ledger.rows[0].questions[0].sourceSpan[1]++; await writeFile(f.ledgerPath,JSON.stringify(f.ledger)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/原题坐标/u);
  f.ledger.rows[0].questions[0].sourceSpan[1]--; f.ledger.rows[0].questions[0].teachingAnswer='invented answer';
  await writeFile(f.ledgerPath,JSON.stringify(f.ledger)); await freezeFixtureReview(f);
  assert.match((await check(f)).join(),/短答或知识关联/u);
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
  assert.deepEqual(await check(f),[]);
}));

test('image resync input is covered by both snapshot and final version binding',()=>reviewFixture(async f=>{
  await mkdir(join(f.root,'.codex'));
  await writeFile(join(f.root,'.codex/image-resync.txt'),'images/image.png\n');
  await freezeFixtureReview(f); assert.deepEqual(await check(f),[]);
  await writeFile(join(f.root,'.codex/image-resync.txt'),'images/unreviewed.png\n');
  assert.match((await check(f)).join(),/最终审核版本不一致/u);
}));
