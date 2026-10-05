import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { reviewFixture, git } from './release-review-fixture.mjs';
import { matchingReview, validateGithubRelease, requireSuccessfulSync, validateGithubPrivateReview } from '../scripts/github-release-review.mjs';
import { requireReviewedRelease } from '../scripts/validate-release.mjs';

const repo='AmbitionC/front-end-journey-resource',head='a'.repeat(40),digest='b'.repeat(64),receipt='f'.repeat(64);
const pr={number:12,user:{login:'author'},head:{sha:head,repo:{full_name:repo}},base:{ref:'master',repo:{full_name:repo}}};
const approved=()=>({id:1,user:{login:'reviewer'},author_association:'COLLABORATOR',state:'APPROVED',commit_id:head,submitted_at:'2026-10-05T01:00:00Z',body:`content-release:v2 head=${head} digest=${digest} receipt=${receipt}`});

test('GitHub approval must be trusted, independent, current head and exact digest',()=>{
  assert.equal(matchingReview(pr,[approved()],digest).id,1);
  for(const patch of [{author_association:'CONTRIBUTOR'},{commit_id:'c'.repeat(40)},{state:'COMMENTED'},{state:'DISMISSED'},{user:{login:'author'}},{body:`content-release:v2 head=${head} digest=${'d'.repeat(64)} receipt=${receipt}`}]) {
    assert.equal(matchingReview(pr,[{...approved(),...patch}],digest),undefined);
  }
  const dismissed={...approved(),id:2,submitted_at:'2026-10-05T02:00:00Z',state:'DISMISSED'};
  assert.equal(matchingReview(pr,[approved(),dismissed],digest),undefined);
  const changes={...approved(),user:{login:'other-reviewer'},state:'CHANGES_REQUESTED'};
  assert.equal(matchingReview(pr,[approved(),changes],digest),null);
});

test('author/owner comments cannot substitute for an independent authenticated approval',()=>{
  const owner={...approved(),user:{login:'author'},author_association:'OWNER',state:'COMMENTED'};
  assert.equal(matchingReview(pr,[owner],digest),undefined);
  owner.body+='\nprivate-independent-review:verified';
  assert.equal(matchingReview(pr,[owner],digest),undefined);
  assert.equal(matchingReview(pr,[{...owner,state:'APPROVED'}],digest),undefined);
});

async function githubFixture(f) {
  git(f.root,'add','.');git(f.root,'commit','-qm','reviewed content');
  const reviewedHead=git(f.root,'rev-parse','HEAD');
  git(f.root,'commit','--allow-empty','-qm','merged publication');
  const after=git(f.root,'rev-parse','HEAD');
  const finalPr={...structuredClone(pr),base:{...structuredClone(pr.base),sha:f.baseCommit},merged:true,merge_commit_sha:after,head:{sha:reviewedHead,repo:{full_name:repo}}};
  const review={...approved(),commit_id:reviewedHead,body:`content-release:v2 head=${reviewedHead} digest=${f.review.publicationDigest} receipt=${f.options.reviewSha256}`};
  const read=async path=>{
    if(path==='') return {default_branch:'master'};
    if(path==='branches/master') return {commit:{sha:after}};
    if(path.startsWith(`commits/${after}/pulls?`)) return [{number:12}];
    if(path==='pulls/12') return finalPr;
    if(path.startsWith('pulls/12/reviews?')) return [review];
    throw new Error('unexpected fixture API path');
  };
  return {after,finalPr,review,read};
}

test('release proof uses actual committed inventory and actual merged PR, not a caller approval JSON',()=>reviewFixture(async f=>{
  const g=await githubFixture(f);
  const proof=await validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read});
  assert.equal(proof.afterSha,g.after);assert.equal(proof.prNumber,12);
  g.finalPr.merged=false;
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/可信 GitHub/u);
  g.finalPr.merged=true;g.finalPr.head.repo.full_name='someone/fork';
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/可信 GitHub/u);
  g.finalPr.head.repo.full_name=repo;
  await writeFile(join(f.root,'images/image.png'),'uncommitted image replacement');
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read}),/最终提交不一致/u);
}));

test('old approved commits cannot be replayed after the actual default branch advances',()=>reviewFixture(async f=>{
  const g=await githubFixture(f);
  const read=async path=>path==='branches/master'?{commit:{sha:'c'.repeat(40)}}:g.read(path);
  await assert.rejects(validateGithubRelease(f.root,f.baseCommit,g.after,{read}),/旧任务重放/u);
}));

test('formal entry rejects legacy public private ledger and cross-SHA Action replay',()=>reviewFixture(async f=>{
  const g=await githubFixture(f);
  assert.equal((await requireReviewedRelease(f.root,f.baseCommit,g.after,{read:g.read})).afterSha,g.after);
  await mkdir(join(f.root,'.codex'));await writeFile(join(f.root,'.codex/interview-source-history.json'),'private legacy ledger');
  await assert.rejects(requireReviewedRelease(f.root,f.baseCommit,g.after,{read:g.read}),/旧私有采集账本/u);
  const oldActions=process.env.GITHUB_ACTIONS,oldSha=process.env.GITHUB_SHA;
  try {
    process.env.GITHUB_ACTIONS='true';process.env.GITHUB_SHA='e'.repeat(40);
    await assert.rejects(requireReviewedRelease(f.root,f.baseCommit,g.after,{read:g.read}),/跨提交重放/u);
  } finally {
    if(oldActions===undefined)delete process.env.GITHUB_ACTIONS;else process.env.GITHUB_ACTIONS=oldActions;
    if(oldSha===undefined)delete process.env.GITHUB_SHA;else process.env.GITHUB_SHA=oldSha;
  }
}));

const syncRun=()=>({id:8,head_sha:head,head_branch:'master',path:'.github/workflows/sync.yml',head_repository:{full_name:repo},event:'push',status:'completed',conclusion:'success'});
test('PDF requires latest successful same-SHA sync; unrelated or failed runs cannot substitute',async()=>{
  const read=runs=>async()=>({workflow_runs:runs});
  assert.equal((await requireSuccessfulSync(head,{read:read([syncRun()])})).syncRunId,8);
  for(const patch of [{conclusion:'failure'},{conclusion:'cancelled'},{status:'in_progress'},{head_sha:'f'.repeat(40)},{event:'pull_request'},{path:'.github/workflows/other.yml'},{head_repository:{full_name:'someone/fork'}}]) {
    await assert.rejects(requireSuccessfulSync(head,{read:read([{...syncRun(),...patch}])}),/同步未成功/u);
  }
  await assert.rejects(requireSuccessfulSync(head,{read:read([syncRun(),{...syncRun(),id:9,status:'queued',conclusion:null}])}),/同步未成功/u);
});


test('authenticated final private check binds actual external originals to the real review receipt pin',()=>reviewFixture(async f=>{
  const g=await githubFixture(f);
  git(f.root,'checkout','--detach',g.finalPr.head.sha);
  const proof=await validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read});
  assert.equal(proof.privateInputsVerified,true);
  assert.equal(proof.privateReviewReceiptSha256,f.options.reviewSha256);
  g.review.body=g.review.body.replace(f.options.reviewSha256,'c'.repeat(64));
  await assert.rejects(validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read}),/摘要不一致/u);
  g.review.body=g.review.body.replace('c'.repeat(64),f.options.reviewSha256);
  await writeFile(f.sourcePath,'replaced original after authentic review');
  await assert.rejects(validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read}),/私有最终版本校验失败/u);
  // CI has no private files. Its scope is explicitly the approved frozen
  // pointer; this result cannot replace the required private final step.
  git(f.root,'checkout','--detach',g.after);
  const pointer=await validateGithubRelease(f.root,f.baseCommit,g.after,{read:g.read});
  assert.equal(pointer.privateEvidenceMode,'authenticated-reviewed-receipt-pointer');
  assert.equal(pointer.privateReviewReceiptSha256,f.options.reviewSha256);
}));

test('missing, malformed, ambiguous or mismatched authenticated receipt pins are rejected',()=>{
  for(const body of [
    `content-release:v1 head=${head} digest=${digest}`,
    `content-release:v2 head=${head} digest=${digest}`,
    `content-release:v2 head=${head} digest=${digest} receipt=bad`,
    approved().body+'\n'+approved().body,
  ]) assert.equal(matchingReview(pr,[{...approved(),body}],digest),undefined);
  assert.equal(matchingReview(pr,[approved()],digest,'e'.repeat(64)),undefined);
  assert.equal(matchingReview(pr,[approved()],digest,receipt).id,1);
});


test('authenticated private review cannot use a caller-selected earlier baseline than actual PR base',()=>reviewFixture(async f=>{
  const g=await githubFixture(f);git(f.root,'checkout','--detach',g.finalPr.head.sha);
  assert.equal((await validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read})).privateInputsVerified,true);
  g.finalPr.base.sha=g.finalPr.head.sha;
  await assert.rejects(validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read}),/实际 PR base/u);
  delete g.finalPr.base.sha;
  await assert.rejects(validateGithubPrivateReview(f.root,f.historyPath,f.reviewPath,f.options.reviewSha256,12,{read:g.read}),/实际 PR base/u);
}));
