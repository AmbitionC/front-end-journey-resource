import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(new URL('../',import.meta.url).pathname);
const tree=JSON.parse(await readFile(resolve(root,'interview/_tree.json'),'utf8'));
const baseline=JSON.parse(await readFile(new URL('fixtures/interview-leaf-contract.json',import.meta.url),'utf8'));
const leaves=tree.flatMap(c=>c.children.flatMap(d=>d.children));

test('company → department → post has unique keys and preserves historical leaf identity',async()=>{
  const keys=new Set();
  for(const company of tree){
    assert.equal(company.nodeType,'company');
    for(const department of company.children){
      assert.equal(department.nodeType,'department');
      assert.ok(department.children.length);
      for(const post of department.children){
        assert.equal(post.isLeaf,true);
        assert.equal(post.department,department.label);
        assert.equal(post.children,undefined);
        assert.ok(!keys.has(post.key));keys.add(post.key);
        await access(resolve(root,`interview/${post.filePath}/${post.key}.md`));
      }
    }
  }
  for(const old of baseline){
    const leaf=leaves.find(l=>l.key===old.key);
    assert.ok(leaf,`lost historical post ${old.key}`);
    assert.equal(leaf.filePath,old.filePath);
    assert.equal(leaf.label,old.label);
    assert.deepEqual(leaf.tags,old.tags);
    assert.ok(leaf.roleCategory,'previous role direction must remain metadata');
  }
});

test('role and stack words cannot silently become company departments',()=>{
  for(const key of ['bytedance-base-18','bytedance-base-25','bytedance-base-33','oppo-ai-3']) {
    assert.equal(leaves.find(p=>p.key===key).department,'其他');
  }
  assert.equal(leaves.find(p=>p.key==='bytedance-base-24').department,'飞书');
  assert.equal(leaves.find(p=>p.key==='bytedance-base-53').department,'中国交易与广告');
  assert.equal(leaves.find(p=>p.key==='tencent-ai-5').department,'WXG');
});
