import assert from 'node:assert/strict';
import test from 'node:test';
import {validatePinnedSyncResult,expectedPinnedSync} from '../scripts/validate-sync-result.mjs';
import {reviewFixture,git} from './release-review-fixture.mjs';

test('actual FaaS input receipts require the reviewed SHA, complete exact bytes and expected counts',()=>{
  const expected={afterSha:'a'.repeat(40),inputs:[{path:'knowledge/topic/key.md',sha256:'b'.repeat(64),bytes:31}],counts:{manifests:0,articles:1,images:0,deleted:0}};
  const result={success:true,data:{...expected.counts,errors:[],sourceCommit:expected.afterSha,readMode:'commit_pinned',sourceInputs:structuredClone(expected.inputs)}};
  assert.equal(validatePinnedSyncResult(result,expected).articles,1);
  for(const patch of [{sourceCommit:'c'.repeat(40)},{readMode:'legacy_unversioned_manual'},{sourceInputs:[]},{sourceInputs:[...expected.inputs,...expected.inputs]},
    {sourceInputs:[{...expected.inputs[0],sha256:'c'.repeat(64)}]},{sourceInputs:[{...expected.inputs[0],bytes:30}]},
    {sourceInputs:[{...expected.inputs[0],path:'knowledge/other.md'}]},{articles:0},{deleted:1}]) {
    assert.throws(()=>validatePinnedSyncResult({...result,data:{...result.data,...patch}},expected));
  }
});

test('production expectations derive from real commits and current pinned files, not a supplied receipt JSON',()=>reviewFixture(async f=>{
  git(f.root,'add','.');git(f.root,'commit','-qm','real fixture target');const after=git(f.root,'rev-parse','HEAD');
  const expected=await expectedPinnedSync(f.root,f.baseCommit,after);
  assert.deepEqual(expected.counts,{manifests:2,articles:2,images:1,deleted:0});assert.equal(expected.inputs.length,5);
  await assert.rejects(expectedPinnedSync(f.root,f.baseCommit,f.baseCommit),/最终提交/u);
}));
