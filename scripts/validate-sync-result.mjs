import { isDirectExecution } from './resource-paths.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import {gitPublicationFiles,changedPublicationPaths,sha256} from './content-review.mjs';
import {readBounded} from './resource-paths.mjs';

export function validateSyncResult(result) {
  if (!result || result.success!==true || !result.data || !Array.isArray(result.data.errors) || result.data.errors.length) throw new Error('内容同步返回失败或错误列表无效');
  for (const field of ['manifests','articles','images','deleted']) if (!Number.isInteger(result.data[field]) || result.data[field]<0) throw new Error('内容同步计数无效');
  return result.data;
}

export function validatePinnedSyncResult(result,expected) {
  const data=validateSyncResult(result);
  if(data.sourceCommit!==expected.afterSha || data.readMode!=='commit_pinned' || !Array.isArray(data.sourceInputs)) throw new Error('同步读取版本未绑定最终提交');
  const seen=new Set();
  for(const input of data.sourceInputs) {
    const pinned=expected.inputs.find(file=>file.path===input?.path);
    if(!pinned || seen.has(input.path) || input.sha256!==pinned.sha256 || input.bytes!==pinned.bytes) throw new Error('同步实际输入与最终已审字节不一致');
    seen.add(input.path);
  }
  if(seen.size!==expected.inputs.length) throw new Error('同步缺少实际输入回执');
  for(const [field,count] of Object.entries(expected.counts)) if(data[field]!==count) throw new Error('同步处理计数与提交实际差异不一致');
  return data;
}

export async function expectedPinnedSync(root,before,after) {
  const beforeFiles=gitPublicationFiles(root,before),afterFiles=gitPublicationFiles(root,after);
  const committed=new Map(afterFiles.map(file=>[file.path,file.sha256]));
  const changed=changedPublicationPaths(beforeFiles,afterFiles),paths=new Set();
  const counts={manifests:0,articles:0,images:0,deleted:0};
  const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
  if(head.status!==0 || head.stdout.trim()!==after) throw new Error('同步核验必须检出当前最终提交');
  for(const path of changed) {
    if(path==='.codex/image-resync.txt' && committed.has(path)) {
      paths.add(path);
      const text=(await readBounded(root,path)).toString('utf8');
      for(const line of text.split(/\r?\n/u).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'))) {
        if(!line.startsWith('images/') || !committed.has(line)) throw new Error('重同步清单不是已审图片');
        paths.add(line);
      }
      continue;
    }
    if(path.startsWith('images/') || /^(interview|knowledge|class)\/.*\.md$/u.test(path)
        || /^(interview|knowledge|class)\/_tree\.json$/u.test(path)) {
      if(committed.has(path)) paths.add(path); else counts.deleted++;
    }
  }
  const inputs=[];
  for(const path of [...paths].sort()) {
    const bytes=await readBounded(root,path);
    if(sha256(bytes)!==committed.get(path)) throw new Error('同步核验文件已偏离最终提交');
    inputs.push({path,sha256:sha256(bytes),bytes:bytes.length});
    if(path.startsWith('images/'))counts.images++;
    else if(path.endsWith('/_tree.json'))counts.manifests++;
    else if(path.endsWith('.md'))counts.articles++;
  }
  return {afterSha:after,inputs,counts};
}

if (isDirectExecution(import.meta.url)) {
  try {
    const expected=await expectedPinnedSync(resolve(import.meta.dirname,'..'),process.argv[3],process.argv[4]);
    const data=validatePinnedSyncResult(JSON.parse(await readFile(process.argv[2],'utf8')),expected);
    console.log(JSON.stringify({sourceCommit:data.sourceCommit,readMode:data.readMode,verifiedInputCount:expected.inputs.length,counts:expected.counts}));
  }
  catch { console.error('内容同步终态核验失败'); process.exitCode=1; }
}
