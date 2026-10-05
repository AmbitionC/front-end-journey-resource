import { isDirectExecution } from './resource-paths.mjs';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateTree } from './validate-tree.mjs';
import { validatePrivateInterviewHistory } from './validate-private-interview-history.mjs';
import { validateGithubRelease, requireSuccessfulSync, validateGithubPrivateReview } from './github-release-review.mjs';

export async function requireReviewedRelease(root, before, after, options={}) {
  if (process.env.GITHUB_ACTIONS==='true' && after!==process.env.GITHUB_SHA) throw new Error('正式发布必须使用当前 Action 的最终 SHA，不支持跨提交重放');
  // Keep legacy provenance outside Git's current public tree. Removing it from
  // this candidate does not erase earlier public commits.
  let legacy = false;
  try { await access(resolve(root,'.codex/interview-source-history.json')); legacy=true; }
  catch(error) { if (error.code!=='ENOENT') throw error; }
  if (legacy) throw new Error('旧私有采集账本仍在公开树内，禁止发布');
  const result = await validateTree(root);
  if (result.errors.length) throw new Error(`公开结构校验失败：${result.errors.length} 项`);
  const approval = await validateGithubRelease(root,before,after,options);
  if (options.requireSync) Object.assign(approval,await requireSuccessfulSync(after,options));
  return approval;
}

if (isDirectExecution(import.meta.url)) {
  const root = resolve(import.meta.dirname,'..');
  try {
    if (process.argv[2]==='--private-pr') {
      const approval=await validateGithubPrivateReview(root,process.argv[4],process.argv[5],process.argv[6],Number(process.argv[3]));
      console.log(JSON.stringify(approval));
    } else if (process.argv[2]==='--ci') {
      const approval = await requireReviewedRelease(root,process.argv[3],process.argv[4]);
      if (process.argv.includes('--wait-sync')) {
        const deadline = Date.now()+10*60*1000;
        while (true) {
          try { Object.assign(approval,await requireSuccessfulSync(approval.afterSha)); break; }
          catch (error) {
            if (Date.now()>=deadline || !error.message.startsWith('同一最终 SHA')) throw error;
            await new Promise(r=>setTimeout(r,15000));
          }
        }
      }
      console.log(JSON.stringify(approval));
    } else {
      const result = await validateTree(root);
      const errors = [...result.errors,...await validatePrivateInterviewHistory(root,process.argv[2],{
        reviewPath:process.argv[3],reviewSha256:process.argv[4],
      })];
      if (errors.length) throw new Error(`本地最终版本审核失败：${errors.length} 项；原因只在私有工作区查看`);
      console.log('本地冻结绑定通过；正式同步/PDF仍须最终提交的受信 GitHub 发布证明。');
    }
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
