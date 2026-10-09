import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {questionStructure} from '../scripts/public-interview-contract.mjs';

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
    if(old.key==='redbook-ai-2') {
      assert.equal(leaf.label,'小红书与百度 Agent 面试合并记录：LangGraph 子图、Skill 与工程校验（2026 年 8 月发帖）');
      assert.deepEqual(leaf.tags,[...old.tags,'百度']);
      assert.deepEqual(leaf.companies,['小红书','百度']);
    } else {
      assert.equal(leaf.label,old.label);
      assert.deepEqual(leaf.tags,old.tags);
    }
    assert.ok(leaf.roleCategory,'previous role direction must remain metadata');
  }
});

test('combined-company page preserves one identity and names the Baidu questions and backlinks',async()=>{
  const combined=leaves.filter(p=>p.key==='redbook-ai-2');
  assert.equal(combined.length,1);
  assert.equal(combined[0].filePath,'redbook/ai');
  const markdown=await readFile(resolve(root,'interview/redbook/ai/redbook-ai-2.md'),'utf8');
  assert.match(markdown,/第（6）至（8）题归百度/);
  const questions=questionStructure(markdown).questions;
  assert.equal(questions[5].key,'agent-tool-result-validation');
  assert.equal(questions[6].key,'agent-failure-recovery');
  for(const file of ['knowledge/llm/agent/agent-tool-result-validation.md','knowledge/llm/production/agent-failure-recovery.md']) {
    const backlink=(await readFile(resolve(root,file),'utf8')).split('\n').find(line=>line.includes('/redbook-ai-2.md)'));
    assert.match(backlink,/^- \[百度部分（小红书与百度合并记录）/);
  }
});

test('general enterprise RAG question uses the full pipeline and does not count as an ACL question',async()=>{
  const page=await readFile(resolve(root,'interview/bytedance/base/bytedance-base-28.md'),'utf8');
  assert.equal(questionStructure(page).questions[7].key,'rag-pipeline');
  const acl=await readFile(resolve(root,'knowledge/llm/rag/rag-access-control.md'),'utf8');
  assert.ok(!acl.includes('/bytedance-base-28.md)'));
  const collect=nodes=>nodes.flatMap(n=>n.isLeaf?[n]:collect(n.children??[]));
  const knowledge=collect(JSON.parse(await readFile(resolve(root,'knowledge/_tree.json'),'utf8')));
  const topic=knowledge.find(n=>n.key==='rag-access-control');
  assert.equal(topic.interviewCount,0);
  assert.equal(topic.heat,topic.interviewBaseHeat);
});

test('role and stack words cannot silently become company departments',()=>{
  for(const key of ['bytedance-base-18','bytedance-base-25','bytedance-base-33','oppo-ai-3']) {
    assert.equal(leaves.find(p=>p.key===key).department,'其他');
  }
  assert.equal(leaves.find(p=>p.key==='bytedance-base-24').department,'飞书');
  assert.equal(leaves.find(p=>p.key==='bytedance-base-53').department,'中国交易与广告');
  assert.equal(leaves.find(p=>p.key==='tencent-ai-5').department,'WXG');
});
