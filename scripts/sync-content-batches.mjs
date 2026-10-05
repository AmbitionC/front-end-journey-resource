import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {isDirectExecution,readBounded,safeRelativePath} from './resource-paths.mjs';
import {expectedPinnedSync,validatePinnedSyncResult} from './validate-sync-result.mjs';
import {gitPublicationFiles,sha256} from './content-review.mjs';
import {githubRead} from './github-release-review.mjs';
import {requireReviewedRelease} from './validate-release.mjs';

export const BATCH_LIMIT=12;
const SHA=/^[a-f0-9]{40}$/u;
const counts=()=>({manifests:0,articles:0,images:0,deleted:0});
const category=p=>p.startsWith('images/')?'images':p.endsWith('/_tree.json')?'manifests':p.endsWith('.md')?'articles':null;

// A recovery is usable exactly once in the ancestry: the next release after
// the named failed commit, with identical reviewed public resource bytes.
export async function recoveryBaseline(root,before,after,{read=githubRead}={}) {
  let recovery;
  try{recovery=JSON.parse(await readFile(resolve(root,'.codex/content-sync-recovery.json'),'utf8'));}
  catch(e){if(e.code==='ENOENT')return before;throw e;}
  if(recovery.failedAfterSha!==before)return before;
  if(recovery.schemaVersion!==1 || !SHA.test(recovery.baselineSha??'') || !SHA.test(before) || !SHA.test(after??'')
      || !Number.isSafeInteger(recovery.failedRunId) || recovery.failedRunId<=0
      || !/^[a-f0-9]{64}$/u.test(recovery.publicationDigest??''))throw new Error('同步恢复说明无效');
  if(spawnSync('git',['merge-base','--is-ancestor',recovery.baselineSha,before],{cwd:root}).status!==0
      || spawnSync('git',['merge-base','--is-ancestor',before,after],{cwd:root}).status!==0)throw new Error('同步恢复范围不是有效祖先链');
  const old=gitPublicationFiles(root,before),current=gitPublicationFiles(root,after);
  if(JSON.stringify(old)!==JSON.stringify(current) || sha256(JSON.stringify(current))!==recovery.publicationDigest)throw new Error('恢复范围的公开内容已变化，必须重新审核');
  const parent=spawnSync('git',['rev-parse',after+'^1'],{cwd:root,encoding:'utf8'});
  if(parent.status!==0 || parent.stdout.trim()!==before)throw new Error('恢复仅允许失败提交的直接父提交关系');
  const run=await read('actions/runs/'+recovery.failedRunId);
  if(run.id!==recovery.failedRunId || run.head_sha!==before || run.status!=='completed' || run.conclusion!=='failure'
      || run.path!=='.github/workflows/sync.yml' || run.head_branch!=='master'
      || run.event!=='push' || run.head_repository?.full_name!=='AmbitionC/front-end-journey-resource')throw new Error('缺真实同版本同步失败证据');
  return recovery.baselineSha;
}

export async function buildSyncBatches(root,before,after) {
  if(!SHA.test(before??'') || !SHA.test(after??''))throw new Error('同步范围必须是完整提交');
  const expected=await expectedPinnedSync(root,before,after);
  const deleted=spawnSync('git',['diff','--name-only','--diff-filter=D','-z',before,after,'--','images','interview','knowledge','class'],{cwd:root,encoding:'utf8'});
  if(deleted.status!==0)throw new Error('无法读取真实删除范围');
  const removed=deleted.stdout.split('\0').filter(Boolean).filter(p=>p.startsWith('images/') || /^(interview|knowledge|class)\/.*\.md$/u.test(p) || /^(interview|knowledge|class)\/_tree\.json$/u.test(p));
  for(const p of removed)safeRelativePath(p);
  const byPath=new Map(expected.inputs.map(x=>[x.path,x])),queued=new Set(),groups=[];
  const resync=byPath.get('.codex/image-resync.txt');
  if(resync){
    const text=(await readBounded(root,resync.path)).toString('utf8');
    const images=[...new Set(text.split(/\r?\n/u).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')))];
    const paths=[resync.path,...images];
    if(paths.length>BATCH_LIMIT)throw new Error('重同步图片清单超过单次安全批量上限，须拆分已审清单');
    if(images.some(p=>!p.startsWith('images/') || !byPath.has(p)))throw new Error('重同步清单缺固定提交图片');
    groups.push(paths.map(path=>({path,status:'modified'})));paths.forEach(p=>queued.add(p));
  }
  const work=[...expected.inputs.filter(x=>!queued.has(x.path)).map(x=>({path:x.path,status:'modified'})),...removed.map(path=>({path,status:'removed'}))];
  // Publish navigation only after images and article bodies have succeeded.
  work.sort((a,b)=>(category(a.path)==='manifests')-(category(b.path)==='manifests') || (category(a.path)!=='images')-(category(b.path)!=='images') || a.path.localeCompare(b.path));
  let batch=[];
  for(const file of work){
    if(batch.length && (batch.length===BATCH_LIMIT || (category(file.path)==='manifests' && category(batch[0].path)!=='manifests'))){groups.push(batch);batch=[];}
    batch.push(file);
  }
  if(batch.length)groups.push(batch);
  const batches=groups.map(files=>{
    const batchCounts=counts(),inputs=[];
    for(const file of files){
      if(file.status==='removed'){batchCounts.deleted++;continue;}
      inputs.push(byPath.get(file.path));const field=category(file.path);if(field)batchCounts[field]++;
    }
    return {files,expected:{afterSha:after,inputs,counts:batchCounts}};
  });
  return {beforeSha:before,afterSha:after,expected,batches};
}

export async function runSyncBatches(plan,transport,onBatch=()=>{}) {
  const totals=counts(),sourceInputs=[];
  for(let index=0;index<plan.batches.length;index++){
    const batch=plan.batches[index];
    const result=await transport({beforeSha:plan.beforeSha,afterSha:plan.afterSha,files:batch.files});
    const data=validatePinnedSyncResult(result,batch.expected);
    for(const key of Object.keys(totals))totals[key]+=data[key];
    sourceInputs.push(...data.sourceInputs);onBatch({batch:index+1,batches:plan.batches.length,verifiedInputs:data.sourceInputs.length,counts:batch.expected.counts});
  }
  const result={success:true,data:{...totals,errors:[],sourceCommit:plan.afterSha,readMode:'commit_pinned',sourceInputs}};
  validatePinnedSyncResult(result,plan.expected);
  return result;
}

export async function readSyncResponse(response){
  if(!response.ok)throw new Error('同步服务 HTTP '+response.status);
  try{return await response.json();}
  catch{throw new Error('同步服务返回无效JSON');}
}

if(isDirectExecution(import.meta.url)){
  try{
    const root=resolve(import.meta.dirname,'..'),before=process.argv[2],after=process.argv[3];
    await requireReviewedRelease(root,before,after);
    const url=new URL(process.env.FAAS_SYNC_URL??'');
    if(url.protocol!=='https:' || url.username || url.password || !process.env.FAAS_SYNC_SECRET)throw new Error('同步服务配置无效');
    const baseline=await recoveryBaseline(root,before,after);
    const plan=await buildSyncBatches(root,baseline,after);
    console.log(JSON.stringify({sourceCommit:after,actualPushBefore:before,syncBaseline:baseline,batchLimit:BATCH_LIMIT,batches:plan.batches.length,expectedInputs:plan.expected.inputs.length,expectedCounts:plan.expected.counts}));
    await runSyncBatches(plan,async body=>{
      const response=await fetch(url,{method:'POST',redirect:'error',headers:{'x-sync-secret':process.env.FAAS_SYNC_SECRET,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(95000)});
      return readSyncResponse(response);
    },receipt=>console.log(JSON.stringify(receipt)));
    console.log(JSON.stringify({sourceCommit:after,readMode:'commit_pinned',verifiedInputCount:plan.expected.inputs.length,counts:plan.expected.counts,batches:plan.batches.length}));
  }catch(e){console.error(e instanceof Error?e.message:'内容批次同步失败');process.exitCode=1;}
}
