import assert from 'node:assert/strict';
import { writeFile, readFile, rm, symlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { inlineKnowledgeBindings, questionStructure, validatePublicKnowledgeRelations } from '../scripts/public-interview-contract.mjs';
import { validatePrivateInterviewHistory } from '../scripts/validate-private-interview-history.mjs';
import { validateInterviewSourceHistory, topicFrequencies } from '../scripts/interview-source-history.mjs';
import { syncInterviewTopicWeights } from '../scripts/sync-interview-topic-weights.mjs';
import { readBounded, safeRelativePath } from '../scripts/resource-paths.mjs';
import { validateTree } from '../scripts/validate-tree.mjs';
import { reviewFixture, freezeFixtureReview } from './release-review-fixture.mjs';

const question='<details data-knowledge-key="real-key"><summary>（1）问题😀</summary></details>\n\n教学短答。\n';
const relations=f=>validatePublicKnowledgeRelations(f.root,[f.interview],[f.knowledge]);

test('bindings require parsed details, excluding attributes, scripts, fences, comments and hidden nodes',()=>{
  const cases=[
    '<div title="<details data-knowledge-key=\'fake\'>">attribute text</div>',
    '<script>"<details data-knowledge-key=\'fake\'>"</script>',
    '<!-- <details data-knowledge-key="fake"> -->',
    '```html\n<details data-knowledge-key="fake">\n```',
    '<div hidden><details data-knowledge-key="fake"><summary>hidden</summary></details></div>',
    '<div style="display: none"><details data-knowledge-key="fake"></details></div>',
  ];
  for(const content of cases) assert.deepEqual(inlineKnowledgeBindings(content),[],content);
  assert.deepEqual(inlineKnowledgeBindings(question),[{key:'real-key'}]);
  assert.deepEqual(inlineKnowledgeBindings('<details data-knowledge-key="one" data-knowledge-key="two"><summary>问题</summary></details>'),[{key:null}]);
});

test('visible question structure requires first summary, one summary and adjacent independent answer',()=>{
  for(const content of [
    '<details><p>wrong first node</p><summary>问题</summary></details>\n\n短答。',
    '<details><summary>问题</summary><summary>another</summary></details>\n\n短答。',
    '<details><summary>问题</summary></details>\n\n## title\n\n短答。',
    '<details><summary hidden>hidden</summary></details>\n\n短答。',
    '<details><summary>问题</summary><p>answer inside collapsed details</p></details>',
    '<details><summary>outer</summary><details><summary>nested</summary></details><p>answer</p></details>',
  ]) assert.ok(questionStructure(content).questions.some(q=>!q.valid),content);
});

test('public relation validation blocks nonexistent keys, files, backlinks, missing quickRead and short-answer bindings',()=>reviewFixture(async f=>{
  assert.deepEqual(await relations(f),[]);
  await writeFile(join(f.root,'interview/company/article.md'),'候选人自述。');
  assert.match((await relations(f)).join(),/没有问题 details/u);
  await writeFile(join(f.root,'interview/company/article.md'),question.replace('real-key','invented'));
  assert.match((await relations(f)).join(),/知识点不存在/u);
  await writeFile(join(f.root,'interview/company/article.md'),question.replace(' data-knowledge-key="real-key"',''));
  assert.match((await relations(f)).join(),/缺少唯一知识 key/u);
  await writeFile(join(f.root,'interview/company/article.md'),question);
  delete f.knowledge.quickRead;
  assert.match((await relations(f)).join(),/quickRead/u);
  f.knowledge.quickRead={text:'有效速读。'};
  for(const backlink of ['没有反链。','```md\n- [面经](../../interview/company/article.md)\n```','<div hidden><a href="../../interview/company/article.md">面经</a></div>']) {
    await writeFile(join(f.root,'knowledge/topic/real-key.md'),backlink);
    assert.match((await relations(f)).join(),/缺少面经反链/u);
  }
  await rm(join(f.root,'knowledge/topic/real-key.md'));
  assert.match((await relations(f)).join(),/知识点正文不存在/u);
}));

test('audited short-qa-v2 preserves an unbound question and answer with an explicit pending notice',()=>reviewFixture(async f=>{
  f.interview.contentFormat='short-qa-v2';
  const pending=question.replace('data-knowledge-key="real-key"','data-binding-status="pending_semantic_verification"')
    .replace('</details>','<p>关联知识点待核实。</p></details>');
  await writeFile(join(f.root,'interview/company/article.md'),pending);
  assert.deepEqual(await relations(f),[]);
  assert.equal(questionStructure(pending).questions[0].key,null);
  for(const invalid of [pending.replace('关联知识点待核实。',''),pending.replace(' data-binding-status="pending_semantic_verification"','')]) {
    await writeFile(join(f.root,'interview/company/article.md'),invalid);
    assert.match((await relations(f)).join(),/明确待核实说明/u);
  }
}));

test('bound keys reject pending states and notices even with a valid article and backlink',()=>reviewFixture(async f=>{
  f.interview.contentFormat='short-qa-v2';
  for(const content of [
    question.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="pending_semantic_verification"').replace('</details>','<p>关联知识点待核实。</p></details>'),
    question.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="pending_missing_keyword"'),
    question.replace('</details>','<p>关联知识点待核实。</p></details>'),
    question.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="unknown"'),
  ]) {
    await writeFile(join(f.root,'interview/company/article.md'),content);
    assert.match((await relations(f)).join(),/待核实状态或说明不得与知识 key 并存/u);
  }
  await writeFile(join(f.root,'interview/company/article.md'),question.replace('data-knowledge-key="real-key"','data-binding-status="bound"'));
  assert.match((await relations(f)).join(),/bound 状态必须有知识 key/u);
  for(const content of [question,question.replace('data-knowledge-key="real-key"','data-knowledge-key="real-key" data-binding-status="bound"')]) {
    await writeFile(join(f.root,'interview/company/article.md'),content);
    assert.deepEqual(await relations(f),[]);
  }
}));

test('paths reject traversal, absolute locations, slash keys and outside symlink targets before reading',()=>reviewFixture(async f=>{
  for(const path of ['../private.json','/tmp/private.json','interview/../../secret','interview\\secret','interview//article.md']) assert.throws(()=>safeRelativePath(path));
  await assert.rejects(readBounded(f.root,'../history.json','interview'));
  const privateFile=join(f.folder,'secret.md'); await writeFile(privateFile,'PRIVATE MARKER');
  await rm(join(f.root,'knowledge/topic/real-key.md')); await symlink(privateFile,join(f.root,'knowledge/topic/real-key.md'));
  const errors=(await relations(f)).join(); assert.match(errors,/正文不存在/u); assert.doesNotMatch(errors,/PRIVATE MARKER/u);
  await mkdir(join(f.root,'knowledge/inside')); await writeFile(join(f.root,'knowledge/inside/ordinary.md'),'ordinary');
  await symlink(join(f.root,'knowledge/inside'),join(f.root,'knowledge/alias'));
  await assert.rejects(readBounded(f.root,'knowledge/alias/ordinary.md','knowledge'),/符号链接/u);
  f.interview.filePath='../../outside';
  assert.match((await relations(f)).join(),/面经正文不存在/u);
}));

test('legacy history validation retains coverage, canonical URL, A/B, duplicate URL and cluster checks',()=>reviewFixture(async f=>{
  const options={includePrepared:true,requireClusterAnnotations:false};
  assert.deepEqual(await validateInterviewSourceHistory(f.root,f.history,options),[]);
  const missing=structuredClone(f.history);missing.records={};
  assert.match((await validateInterviewSourceHistory(f.root,missing,options)).join(),/缺少已发布来源记录/u);
  const duplicate=structuredClone(f.history);duplicate.records.bbbbbbbbbbbb={...f.history.records.aaaaaaaaaaaa};
  const errors=(await validateInterviewSourceHistory(f.root,duplicate,options)).join();
  assert.match(errors,/重复 URL/u);assert.match(errors,/同一 cluster/u);assert.match(errors,/只能对应一条/u);
  f.history.records.aaaaaaaaaaaa.evidenceGrade='C';
  assert.match((await validateInterviewSourceHistory(f.root,f.history,options)).join(),/A\/B/u);
}));

test('private history rejects repository-contained ledgers and does not use editable privateReviewStatus',()=>reviewFixture(async f=>{
  f.history.records.aaaaaaaaaaaa.privateReviewStatus='approved';
  await writeFile(f.historyPath,JSON.stringify(f.history));
  assert.ok((await validatePrivateInterviewHistory(f.root,f.historyPath)).length>0);
  const internal=join(f.root,'history.json');await writeFile(internal,JSON.stringify(f.history));
  f.review.history=await f.pin(internal);await freezeFixtureReview(f);
  f.review.history=await f.pin(internal);await writeFile(f.reviewPath,JSON.stringify(f.review));f.options.reviewSha256=(await f.pin(f.reviewPath)).sha256;
  assert.match((await validatePrivateInterviewHistory(f.root,internal,f.options)).join(),/公开仓库外/u);
}));

test('distinct rounds in one interview process count once per topic while retaining both source links',()=>{
  const record={status:'published',knowledgeKeys:['topic'],processUnitId:'one-process'};
  const [topic]=topicFrequencies({records:{first:{...record,clusterId:'round-one'},second:{...record,clusterId:'round-two'},third:{...record,clusterId:'different',processUnitId:'another-process'}}});
  assert.equal(topic.count,2);assert.deepEqual(topic.clusters,['different','round-one','round-two']);
});

test('private weight draft generation requires scope and final pin, emits aggregate counts and invalidates its old review',()=>reviewFixture(async f=>{
  await assert.rejects(syncInterviewTopicWeights(f.root,{privacyMode:true,keys:['real-key']}),/私有来源审核未通过/u);
  await assert.rejects(syncInterviewTopicWeights(f.root,{privacyMode:true,historyPath:f.historyPath,...f.options}),/限定本批/u);
  const options={privacyMode:true,historyPath:f.historyPath,keys:['real-key'],...f.options};
  const first=await syncInterviewTopicWeights(f.root,options);assert.equal(first.updatedTopics,1);
  const [tree]=JSON.parse(await readFile(join(f.root,'knowledge/_tree.json'),'utf8'));
  assert.equal(tree.interviewCount,1);assert.equal(tree.heat,1);assert.equal(tree.interviewClusters,undefined);
  assert.doesNotMatch(await readFile(join(f.root,'knowledge/topic/real-key.md'),'utf8'),/cluster-a|nowcoder|process-a/u);
  await assert.rejects(syncInterviewTopicWeights(f.root,options),/私有来源审核未通过/u);
  await freezeFixtureReview(f);
  const second=await syncInterviewTopicWeights(f.root,{...options,...f.options});
  assert.deepEqual(second,{updatedTopics:0,addedClusters:0,removedClusters:0,updatedArticles:0});
}));

test('opacity and author CSS cannot satisfy visible questions, independent short answers or backlinks',()=>reviewFixture(async f=>{
  for(const body of [question.replace('<details ','<details style="opacity:0" '),question.replace('教学短答。','<p style="opacity:0">教学短答。</p>')]) {
    await writeFile(join(f.root,'interview/company/article.md'),body);
    assert.match((await relations(f)).join(),/真实首个 summary/u);
  }
  await writeFile(join(f.root,'interview/company/article.md'),question);
  for(const body of ['<a href="../../interview/company/article.md"></a>','<style>a{display:none}</style><a href="../../interview/company/article.md">面经</a>','<p style="opacity:0"><a href="../../interview/company/article.md">面经</a></p>']) {
    await writeFile(join(f.root,'knowledge/topic/real-key.md'),body);
    assert.match((await relations(f)).join(),/反链/u);
  }
}));

test('unsafe category keys are rejected before they can become PDF output paths',()=>reviewFixture(async f=>{
  for(const key of ['../../escape','/tmp/escape','group/child','..']) {
    await writeFile(join(f.root,'knowledge/_tree.json'),JSON.stringify([{key,children:[f.knowledge]}]));
    assert.match((await validateTree(f.root)).errors.join(),/节点 key 路径无效/u);
  }
}));


test('styles in hidden containers or SVG still invalidate visible questions and backlinks',()=>reviewFixture(async f=>{
  const root=f.root;
  const original=await readFile(join(root,'interview/company/article.md'),'utf8');
  const body=await readFile(join(root,'knowledge/topic/real-key.md'),'utf8');
  for(const style of [
    '<div hidden><style>details,p {display:none}</style></div>',
    '<svg><style>a {opacity:0}</style></svg>',
    '<div hidden><link rel="stylesheet" href="https://example.invalid/hide.css"></div>',
    '<div hidden><link rel="StyleSheet" href="https://example.invalid/hide.css"></div>',
  ]) {
    await writeFile(join(root,'interview/company/article.md'),style+'\n'+original);
    assert.match((await validateTree(root)).errors.join(),/注入改变可见结构的样式/u);
    await writeFile(join(root,'interview/company/article.md'),original);
    await writeFile(join(root,'knowledge/topic/real-key.md'),style+'\n'+body);
    assert.match((await validateTree(root)).errors.join(),/不可证明可见|缺少面经反链/u);
  }
}));
