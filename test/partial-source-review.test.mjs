// Synthetic source permissions exercise binding only, not semantic source approval.
import assert from 'node:assert/strict';
import test from 'node:test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {reviewFixture,freezeFixtureReview} from './release-review-fixture.mjs';
import {validateContentReview} from '../scripts/content-review.mjs';

async function partialFixture(f){
  f.history.records.aaaaaaaaaaaa.evidenceGrade='B-partial';
  await writeFile(f.historyPath,JSON.stringify(f.history));await freezeFixtureReview(f);
  const permit={sourceId:'aaaaaaaaaaaa',articleKey:'article',grade:'B-partial',decision:'approved_limited_source_use',
    sourceSha256:(await f.pin(f.sourcePath)).sha256,
    articleSha256:f.review.publicFiles.find(p=>p.path==='interview/company/article.md').sha256,
    limitations:['Synthetic reviewer fixture: unverified image pixels are not reconstructed.']};
  const report={kind:'independent-partial-source-permissions',decision:'approved_limited_source_use',publicationDigest:f.review.publicationDigest,permits:[permit]};
  const reportPath=join(f.folder,'partial-review.json');
  const freeze=async()=>{await writeFile(reportPath,JSON.stringify(report));f.review.partialSourceReview=await f.pin(reportPath);await freezeFixtureReview(f);};
  return {permit,report,reportPath,freeze};
}
const check=f=>validateContentReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256);

test('B-partial stays separate and requires an independently pinned permission for the exact source and article',()=>reviewFixture(async f=>{
  const p=await partialFixture(f);assert.ok((await check(f)).length);
  await p.freeze();assert.deepEqual(await check(f),[]);assert.equal(f.history.records.aaaaaaaaaaaa.evidenceGrade,'B-partial');
  for(const [field,value] of [['sourceSha256','f'.repeat(64)],['articleSha256','f'.repeat(64)],['articleKey','other'],['sourceId','bbbbbbbbbbbb'],['limitations',[]],['decision','pending']]){
    const previous=p.permit[field];p.permit[field]=value;await p.freeze();assert.ok((await check(f)).length);p.permit[field]=previous;
  }
}));

test('partial permissions do not certify unknown or C sources or a different resource snapshot',()=>reviewFixture(async f=>{
  const p=await partialFixture(f);await p.freeze();
  f.history.records.aaaaaaaaaaaa.evidenceGrade='C';await writeFile(f.historyPath,JSON.stringify(f.history));await p.freeze();assert.ok((await check(f)).length);
  f.history.records.aaaaaaaaaaaa.evidenceGrade='B-partial';await writeFile(f.historyPath,JSON.stringify(f.history));
  p.report.publicationDigest='f'.repeat(64);await p.freeze();assert.ok((await check(f)).length);
}));

test('replacement of the independent partial report invalidates its receipt',()=>reviewFixture(async f=>{
  const p=await partialFixture(f);await p.freeze();
  await writeFile(p.reportPath,JSON.stringify({...p.report,decision:'pending'}));assert.ok((await check(f)).length);
}));
