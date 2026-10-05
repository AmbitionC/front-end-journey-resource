// Synthetic GitHub responses are confined to unit tests; never production receipts.
import assert from 'node:assert/strict';
import test from 'node:test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {reviewFixture,freezeFixtureReview,git} from './release-review-fixture.mjs';
import {matchingOwnerAuthorization,validateGithubRelease,validateGithubPrivateReview} from '../scripts/github-release-review.mjs';

const repo='AmbitionC/front-end-journey-resource',head='a'.repeat(40),digest='b'.repeat(64);
const pins={receipt:'c'.repeat(64),independent:'d'.repeat(64),technical:'e'.repeat(64)};
const repository={default_branch:'master',owner:{login:'AmbitionC',type:'User'}};
const pr={number:12,head:{sha:head},merged:false};
const authorization=(h=head,d=digest,p=pins)=>({id:1,author_association:'OWNER',user:{login:'AmbitionC',type:'User'},
  created_at:'2026-10-05T01:00:00Z',updated_at:'2026-10-05T01:00:00Z',
  issue_url:`https://api.github.com/repos/${repo}/issues/12`,
  body:`content-release:v3 decision=authorize head=${h} digest=${d} receipt=${p.receipt} independent=${p.independent} technical=${p.technical}`});

test('single owner intent is distinct from an independent GitHub approval and binds every pin',()=>{
  const proof=matchingOwnerAuthorization(repository,pr,[authorization()],digest,pins);
  assert.equal(proof.ownerLogin,'AmbitionC');assert.equal(proof.receipt,pins.receipt);
  for(const patch of [{author_association:'COLLABORATOR'},{user:{login:'other',type:'User'}},{user:{login:'AmbitionC',type:'Bot'}},
    {updated_at:'2026-10-05T01:01:00Z'},{created_at:'bad',updated_at:'bad'}, {id:0},
    {issue_url:`https://api.github.com/repos/${repo}/issues/13`},
    {body:authorization('f'.repeat(40)).body},{body:authorization(head,'f'.repeat(64)).body},
    {body:authorization().body+'\n'+authorization().body},{body:authorization().body.replace('technical='+pins.technical,'technical=bad')}]) {
    assert.equal(matchingOwnerAuthorization(repository,pr,[{...authorization(),...patch}],digest,pins),null);
  }
  assert.equal(matchingOwnerAuthorization({...repository,owner:{login:'AmbitionC',type:'Organization'}},pr,[authorization()],digest),null);
  assert.equal(matchingOwnerAuthorization(repository,pr,[authorization()],digest,{receipt:'f'.repeat(64)}),null);
});

test('newest withdrawal or malformed owner intent invalidates earlier authority',()=>{
  const later={...authorization(),id:2,created_at:'2026-10-05T01:01:00Z',updated_at:'2026-10-05T01:01:00Z',body:'content-release:v3 decision=withdraw'};
  assert.equal(matchingOwnerAuthorization(repository,pr,[authorization(),later],digest),null);
  for(const body of ['content-release:v4 decision=withdraw','content-release: decision=withdraw','content-release:v2 malformed']) {
    assert.equal(matchingOwnerAuthorization(repository,pr,[authorization(),{...later,body}],digest),null);
  }
});

test('real merge actor and pre-merge authorization time must be the personal owner',()=>{
  const merged={...pr,merged:true,merged_by:{login:'AmbitionC',type:'User'},merged_at:'2026-10-05T01:02:00Z'};
  assert.ok(matchingOwnerAuthorization(repository,merged,[authorization()],digest));
  for(const patch of [{merged_by:{login:'someone',type:'User'}},{merged_by:{login:'AmbitionC',type:'Bot'}},{merged_at:'bad'},{merged_at:'2026-10-05T00:59:00Z'}]) {
    assert.equal(matchingOwnerAuthorization(repository,{...merged,...patch},[authorization()],digest),null);
  }
});

async function ownerFixture(f){
  git(f.root,'add','.');git(f.root,'commit','-qm','actual fixture reviewed head');
  const reviewedHead=git(f.root,'rev-parse','HEAD');
  const technicalPath=join(f.folder,'technical-review.json');
  const technical={decision:'PASS_BOUNDED_LOCAL_SINGLE_OWNER_GATE',candidateCommit:reviewedHead,publicationDigest:f.review.publicationDigest};
  await writeFile(technicalPath,JSON.stringify(technical));
  f.review.reviewedHeadSha=reviewedHead;f.review.technicalReview=await f.pin(technicalPath);await freezeFixtureReview(f);
  git(f.root,'commit','--allow-empty','-qm','fixture publication merge');const after=git(f.root,'rev-parse','HEAD');
  const finalPr={number:12,user:{login:'AmbitionC'},merged:true,merge_commit_sha:after,merged_by:{login:'AmbitionC',type:'User'},merged_at:'2026-10-05T01:02:00Z',
    head:{sha:reviewedHead,repo:{full_name:repo}},base:{ref:'master',sha:f.baseCommit,repo:{full_name:repo}}};
  const comment=authorization(reviewedHead,f.review.publicationDigest,{receipt:f.options.reviewSha256,independent:f.review.independentReview.sha256,technical:f.review.technicalReview.sha256});
  const run={id:76,head_sha:reviewedHead,path:'.github/workflows/sync.yml',event:'pull_request',head_repository:{full_name:repo},status:'completed',conclusion:'success'};
  const reviews=[];
  const read=async path=>{
    if(path==='')return repository;
    if(path==='branches/master')return {commit:{sha:after}};
    if(path.startsWith(`commits/${after}/pulls?`))return [{number:12}];
    if(path==='pulls/12')return finalPr;
    if(path.startsWith('pulls/12/reviews?'))return reviews;
    if(path.startsWith('issues/12/comments?'))return [comment];
    if(path.startsWith('actions/runs?'))return {workflow_runs:[run]};
    throw new Error('unexpected unit-fixture API path');
  };
  return {reviewedHead,after,finalPr,comment,run,reviews,read,technical,technicalPath};
}

test('owner path verifies actual private originals and exact technical review before merge',()=>reviewFixture(async f=>{
  const g=await ownerFixture(f);git(f.root,'checkout','--detach',g.reviewedHead);g.finalPr.merged=false;
  const proof=await validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read});
  assert.equal(proof.privateInputsVerified,true);assert.equal(proof.formalGithubIndependentApproval,false);assert.equal(proof.prCheckRunId,76);
  await writeFile(g.technicalPath,JSON.stringify({...g.technical,candidateCommit:'f'.repeat(40)}));
  await assert.rejects(validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read}),/指纹不一致/u);
  await writeFile(g.technicalPath,JSON.stringify(g.technical));
  await writeFile(f.sourcePath,'changed frozen original');
  await assert.rejects(validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read}),/私有最终版本校验失败/u);
}));

test('publication still requires actual same-repo owner merge, current head, genuine green PR CI and no changes requested',()=>reviewFixture(async f=>{
  const g=await ownerFixture(f);
  const proof=await validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read});
  assert.equal(proof.privateEvidenceMode,'authenticated-owner-release-intent-with-independent-private-receipt');
  assert.equal(proof.formalGithubIndependentApproval,false);assert.equal(proof.independentReviewSha256,f.review.independentReview.sha256);
  g.run.conclusion='failure';await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/真实资源 CI/u);
  g.run.conclusion='success';g.run.head_sha='f'.repeat(40);await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/真实资源 CI/u);
  g.run.head_sha=g.reviewedHead;
  g.reviews.push({id:8,user:{login:'reviewer'},author_association:'COLLABORATOR',state:'CHANGES_REQUESTED',commit_id:g.reviewedHead,submitted_at:'2026-10-05T01:01:00Z'});
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/可信 GitHub/u);
  g.reviews.push({...g.reviews[0],id:9,state:'COMMENTED',submitted_at:'2026-10-05T01:01:30Z'});
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/可信 GitHub/u);
  g.reviews.push({...g.reviews[0],id:10,state:'DISMISSED',submitted_at:'2026-10-05T01:01:40Z'});
  assert.equal((await validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read})).formalGithubIndependentApproval,false);
  g.reviews.length=0;
  g.comment.body=g.comment.body.replace(g.reviewedHead,'f'.repeat(40));
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/可信 GitHub/u);
}));
