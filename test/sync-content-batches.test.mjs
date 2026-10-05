import assert from 'node:assert/strict';
import test from 'node:test';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {reviewFixture,git} from './release-review-fixture.mjs';
import {buildSyncBatches,runSyncBatches,recoveryBaseline,BATCH_LIMIT,readSyncResponse} from '../scripts/sync-content-batches.mjs';
import {publicInventory} from '../scripts/content-review.mjs';

const result=batch=>({success:true,data:{...batch.expected.counts,errors:[],sourceCommit:batch.expected.afterSha,readMode:'commit_pinned',sourceInputs:structuredClone(batch.expected.inputs)}});

test('malformed response JSON never becomes response text in public failure logs',async()=>{
  for(const text of ['TEST_ONLY_SENSITIVE_RESPONSE','{"unfinished":"TEST_ONLY_SENSITIVE_RESPONSE']){
    await assert.rejects(readSyncResponse(new Response(text,{status:200})),e=>e.message==='同步服务返回无效JSON'&&!e.message.includes('TEST_ONLY'));
  }
  await assert.rejects(readSyncResponse(new Response('TEST_ONLY_SENSITIVE_RESPONSE',{status:502})),e=>e.message==='同步服务 HTTP 502');
  assert.deepEqual(await readSyncResponse(new Response('{"success":true}',{status:200})),{success:true});
});

test('real Git input set is partitioned into bounded requests with navigation last and complete receipts',()=>reviewFixture(async f=>{
  await mkdir(join(f.root,'knowledge/topic'),{recursive:true});
  for(let i=0;i<31;i++)await writeFile(join(f.root,'knowledge/topic','extra-'+i+'.md'),'# extra '+i);
  git(f.root,'add','.');git(f.root,'commit','-qm','bounded content');const after=git(f.root,'rev-parse','HEAD');
  const plan=await buildSyncBatches(f.root,f.baseCommit,after);
  assert.ok(plan.batches.length>3);assert.ok(plan.batches.every(b=>b.files.length<=BATCH_LIMIT));
  assert.ok(plan.batches.at(-1).files.every(f=>f.path.endsWith('/_tree.json')));
  assert.deepEqual(plan.batches.flatMap(b=>b.expected.inputs).map(i=>i.path).sort(),plan.expected.inputs.map(i=>i.path).sort());
  const bodies=[],receipts=[];let index=0;
  const actual=await runSyncBatches(plan,async body=>{bodies.push(body);return result(plan.batches[index++]);},r=>receipts.push(r));
  assert.ok(bodies.every(b=>b.afterSha===after&&b.beforeSha===f.baseCommit));assert.equal(receipts.length,plan.batches.length);
  assert.equal(actual.data.sourceInputs.length,plan.expected.inputs.length);assert.equal(actual.data.articles,33);
}));

test('one failed, absent, wrong-version, corrupt or duplicate receipt stops subsequent batches',()=>reviewFixture(async f=>{
  await mkdir(join(f.root,'knowledge/topic'),{recursive:true});
  for(let i=0;i<26;i++)await writeFile(join(f.root,'knowledge/topic','extra-'+i+'.md'),'# extra '+i);
  git(f.root,'add','.');git(f.root,'commit','-qm','multiple requests');const after=git(f.root,'rev-parse','HEAD');
  const plan=await buildSyncBatches(f.root,f.baseCommit,after);
  for(const patch of [{errors:['failure']},{sourceInputs:[]},{sourceCommit:'a'.repeat(40)},
    {sourceInputs:[{...plan.batches[0].expected.inputs[0],sha256:'0'.repeat(64)}]},
    {sourceInputs:[...plan.batches[0].expected.inputs,...plan.batches[0].expected.inputs]}]){
    let calls=0;await assert.rejects(runSyncBatches(plan,async()=>{calls++;const r=result(plan.batches[0]);Object.assign(r.data,patch);return r;}));assert.equal(calls,1);
  }
  let calls=0;await assert.rejects(runSyncBatches(plan,async()=>{calls++;throw new Error('HTTP 502');}),/502/u);assert.equal(calls,1);
}));

test('recovery requires actual failed workflow at the exact parent with unchanged public bytes',()=>reviewFixture(async f=>{
  git(f.root,'add','.');git(f.root,'commit','-qm','failed publication');const failed=git(f.root,'rev-parse','HEAD');
  const recovery={schemaVersion:1,failedAfterSha:failed,baselineSha:f.baseCommit,failedRunId:7,publicationDigest:(await publicInventory(f.root)).digest};
  await mkdir(join(f.root,'.codex'),{recursive:true});await writeFile(join(f.root,'.codex/content-sync-recovery.json'),JSON.stringify(recovery));
  git(f.root,'add','.');git(f.root,'commit','-qm','code-only repair');const after=git(f.root,'rev-parse','HEAD');
  const run={id:7,head_sha:failed,status:'completed',conclusion:'failure',path:'.github/workflows/sync.yml',head_branch:'master',event:'push',head_repository:{full_name:'AmbitionC/front-end-journey-resource'}};
  assert.equal(await recoveryBaseline(f.root,failed,after,{read:async p=>{assert.equal(p,'actions/runs/7');return run;}}),f.baseCommit);
  for(const patch of [{id:8},{head_sha:after},{status:'in_progress'},{conclusion:'success'},{path:'other.yml'},{head_branch:'topic'},{event:'pull_request'},{head_repository:{full_name:'untrusted/repo'}}])await assert.rejects(recoveryBaseline(f.root,failed,after,{read:async()=>({...run,...patch})}));
  assert.equal(await recoveryBaseline(f.root,after,after,{read:async()=>assert.fail('consumed recovery must not call GitHub')}),after);
  await writeFile(join(f.root,'later-code.txt'),'later code-only release');git(f.root,'add','.');git(f.root,'commit','-qm','later code');
  await assert.rejects(recoveryBaseline(f.root,failed,git(f.root,'rev-parse','HEAD'),{read:async()=>run}),/直接父提交/u);
  await writeFile(join(f.root,'knowledge/topic/topic-key.md'),'# changed public bytes');git(f.root,'add','.');git(f.root,'commit','-qm','changed content');const changed=git(f.root,'rev-parse','HEAD');
  await assert.rejects(recoveryBaseline(f.root,failed,changed,{read:async()=>run}),/已变化/u);
}));

test('small pinned image-resync group stays together, large manifests fail closed',()=>reviewFixture(async f=>{
  await mkdir(join(f.root,'.codex'),{recursive:true});await writeFile(join(f.root,'.codex/image-resync.txt'),'# replay\nimages/image.png\n');
  git(f.root,'add','.');git(f.root,'commit','-qm','small resync');const after=git(f.root,'rev-parse','HEAD');
  const plan=await buildSyncBatches(f.root,f.baseCommit,after);
  assert.deepEqual(plan.batches[0].files.map(f=>f.path),['.codex/image-resync.txt','images/image.png']);
  let index=0;await runSyncBatches(plan,async()=>result(plan.batches[index++]));
  const names=Array.from({length:BATCH_LIMIT},(_,i)=>'images/replay-'+i+'.png');
  for(const name of names)await writeFile(join(f.root,name),await readFile(join(f.root,'images/image.png')));
  await writeFile(join(f.root,'.codex/image-resync.txt'),names.join('\n')+'\n');git(f.root,'add','.');git(f.root,'commit','-qm','oversize resync');
  await assert.rejects(buildSyncBatches(f.root,after,git(f.root,'rev-parse','HEAD')),/上限/u);
}));
