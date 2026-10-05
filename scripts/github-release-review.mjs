import { spawnSync } from 'node:child_process';
import { gitPublicationFiles, publicInventory, sha256, validateContentReview, readPrivatePinned } from './content-review.mjs';

const REPOSITORY = 'AmbitionC/front-end-journey-resource';
const SHA = /^[a-f0-9]{40}$/u;

export async function githubRead(path) {
  // This repository uses public read endpoints. No token, new permission,
  // configurable API host or caller-supplied response file is accepted.
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}${path?`/${path}`:''}`, {
    headers: { Accept:'application/vnd.github+json' }, redirect:'error',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GitHub 审核证据无法读取（HTTP ${response.status}）`);
  return response.json();
}

async function allPages(path, read) {
  const items = [];
  for (let page=1; page<=100; page++) {
    const part = await read(`${path}${path.includes('?')?'&':'?'}per_page=100&page=${page}`);
    if (!Array.isArray(part)) throw new Error('GitHub 审核证据格式无效');
    items.push(...part); if (part.length<100) return items;
  }
  throw new Error('GitHub 审核证据未完整分页');
}

export function reviewReceiptSha256(review, head, digest) {
  const lines=(review.body??'').split(/\r?\n/u).map(line=>line.trim()).filter(line=>line.startsWith('content-release:'));
  if(lines.length!==1) return null;
  const prefix=`content-release:v2 head=${head} digest=${digest} receipt=`;
  if(!lines[0].startsWith(prefix)) return null;
  const pin=lines[0].slice(prefix.length);
  return /^[a-f0-9]{64}$/u.test(pin)?pin:null;
}

export function matchingReview(pr, reviews, digest, expectedReceiptSha256) {
  const latest = new Map();
  for (const review of reviews) {
    if (!review.submitted_at || !review.user?.login) continue;
    // A conversational COMMENTED/PENDING submission cannot resolve an
    // outstanding changes request. Only GitHub's substantive review states do.
    if(!['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(review.state)) continue;
    const id = review.user.login.toLowerCase(), before = latest.get(id);
    if (!before || Date.parse(review.submitted_at)>Date.parse(before.submitted_at)
        || review.submitted_at===before.submitted_at && review.id>before.id) latest.set(id,review);
  }
  const trusted = [...latest.values()].filter(r=>['OWNER','COLLABORATOR'].includes(r.author_association));
  if (trusted.some(r=>r.state==='CHANGES_REQUESTED')) return null;
  return trusted.find(r=>r.commit_id===pr.head.sha && reviewReceiptSha256(r,pr.head.sha,digest)
    && (!expectedReceiptSha256 || reviewReceiptSha256(r,pr.head.sha,digest)===expectedReceiptSha256)
    && r.state==='APPROVED' && r.user.login.toLowerCase()!==pr.user.login.toLowerCase());
}

// Independent private review and permission to publish are separate facts.
// A personal repository owner may authorize their own PR after the private
// check. This is release intent, never an independent GitHub APPROVED review.
export function matchingOwnerAuthorization(repository, pr, comments, digest, expected={}) {
  const owner=repository.owner?.login;
  if(repository.owner?.type!=='User' || !owner) return null;
  const candidates=comments.filter(comment=>comment.author_association==='OWNER'
    && comment.user?.type==='User' && comment.user.login?.toLowerCase()===owner.toLowerCase()
    && (comment.body??'').split(/\r?\n/u).some(line=>line.trim().startsWith('content-release:')))
    .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at) || b.id-a.id);
  const comment=candidates[0];
  if(!comment || !Number.isSafeInteger(comment.id) || comment.id<=0
      || !Number.isFinite(Date.parse(comment.created_at)) || comment.updated_at!==comment.created_at
      || comment.issue_url!==`https://api.github.com/repos/${REPOSITORY}/issues/${pr.number}`) return null;
  const lines=comment.body.split(/\r?\n/u).map(line=>line.trim()).filter(line=>line.startsWith('content-release:'));
  const match=lines.length===1 && /^content-release:v3 decision=authorize head=([a-f0-9]{40}) digest=([a-f0-9]{64}) receipt=([a-f0-9]{64}) independent=([a-f0-9]{64}) technical=([a-f0-9]{64})$/u.exec(lines[0]);
  if(!match || match[1]!==pr.head.sha || match[2]!==digest
      || [match[3],match[4],match[5]].some(pin=>/^0+$/u.test(pin))) return null;
  const pins={receipt:match[3],independent:match[4],technical:match[5]};
  if(Object.entries(expected).some(([key,value])=>pins[key]!==value)) return null;
  if(pr.merged && (pr.merged_by?.type!=='User' || pr.merged_by.login?.toLowerCase()!==owner.toLowerCase()
      || !Number.isFinite(Date.parse(pr.merged_at)) || Date.parse(comment.created_at)>Date.parse(pr.merged_at))) return null;
  return {comment,...pins,ownerLogin:owner};
}

async function requireNativePrCheck(pr,read) {
  const result=await read(`actions/runs?head_sha=${pr.head.sha}&per_page=100`);
  const runs=result.workflow_runs?.filter(run=>run.head_sha===pr.head.sha
    && run.path==='.github/workflows/sync.yml' && run.event==='pull_request'
    && run.head_repository?.full_name===REPOSITORY).sort((a,b)=>b.id-a.id);
  if(!runs?.length || runs[0].status!=='completed' || runs[0].conclusion!=='success') throw new Error('最终 PR head 的真实资源 CI 未通过');
  return runs[0].id;
}

function ownerAuthorizationProof(authorization,pr,digest,prCheckRunId) {
  return {reviewedHeadSha:pr.head.sha,publicationDigest:digest,
    privateReviewReceiptSha256:authorization.receipt,independentReviewSha256:authorization.independent,
    technicalReviewSha256:authorization.technical,authorizationActorLogin:authorization.ownerLogin,
    authorizationCommentId:authorization.comment.id,prNumber:pr.number,prCheckRunId,
    formalGithubIndependentApproval:false,
    privateEvidenceMode:'authenticated-owner-release-intent-with-independent-private-receipt'};
}

export async function validateGithubRelease(root, before, after, {read=githubRead}={}) {
  if (!SHA.test(before ?? '') || !SHA.test(after ?? '')) throw new Error('发布范围必须是完整 commit SHA');
  const head = spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
  if (head.status!==0 || head.stdout.trim()!==after) throw new Error('工作区未检出待发布最终提交');
  const ancestor = spawnSync('git',['merge-base','--is-ancestor',before,after],{cwd:root});
  if (ancestor.status!==0) throw new Error('发布范围非有效祖先链');
  const snapshot = await publicInventory(root), committed = gitPublicationFiles(root,after);
  if (JSON.stringify(snapshot.files)!==JSON.stringify(committed)) throw new Error('工作区资源与最终提交不一致');
  const repository=await read(''),branch=await read('branches/master');
  if(repository.default_branch!=='master' || branch.commit?.sha!==after) throw new Error('最终发布 SHA 不是当前默认分支 head，禁止旧任务重放');
  const prs = await allPages(`commits/${after}/pulls`,read);
  for (const item of prs) {
    const pr = await read(`pulls/${item.number}`);
    if (!pr.merged || pr.merge_commit_sha!==after || pr.base?.ref!=='master'
        || pr.base?.repo?.full_name!==REPOSITORY || pr.head?.repo?.full_name!==REPOSITORY) continue;
    if (!SHA.test(pr.head.sha)) continue;
    const available = spawnSync('git',['cat-file','-e',`${pr.head.sha}^{commit}`],{cwd:root});
    if (available.status!==0) {
      // Squash merges can remove the reviewed head from the checkout's graph.
      // Fetch that exact public commit using checkout's existing origin only.
      const fetched = spawnSync('git',['fetch','--no-tags','--depth=1','origin',pr.head.sha],{cwd:root});
      if (fetched.status!==0) throw new Error('无法读取实际已审 PR head，禁止发布');
    }
    const reviewedDigest = sha256(JSON.stringify(gitPublicationFiles(root,pr.head.sha)));
    if (reviewedDigest!==snapshot.digest) continue;
    const reviews = await allPages(`pulls/${pr.number}/reviews`,read);
    const review = matchingReview(pr,reviews,snapshot.digest);
    if (review) return {afterSha:after,reviewedHeadSha:pr.head.sha,publicationDigest:snapshot.digest,privateReviewReceiptSha256:reviewReceiptSha256(review,pr.head.sha,snapshot.digest),reviewerLogin:review.user.login,prNumber:pr.number,reviewId:review.id,privateEvidenceMode:'authenticated-reviewed-receipt-pointer'};
    if(review===null) continue; // A real changes-requested review also blocks owner intent.
    const comments=await allPages(`issues/${pr.number}/comments`,read);
    const authorization=matchingOwnerAuthorization(repository,pr,comments,snapshot.digest);
    if(authorization) return {afterSha:after,...ownerAuthorizationProof(authorization,pr,snapshot.digest,await requireNativePrCheck(pr,read))};
  }
  throw new Error('缺最终提交及实际资源快照绑定的可信 GitHub 审核回执');
}

// Run in the authorized private workspace after the final authenticated review
// and before merge. CI has no private files: its result attests the frozen
// receipt pointer, while this step verifies every input behind that pointer.
export async function validateGithubPrivateReview(root, historyPath, reviewPath, receiptSha256, prNumber, {read=githubRead}={}) {
  if (!Number.isSafeInteger(prNumber) || prNumber<=0) throw new Error('PR 编号无效');
  const errors=await validateContentReview(root,historyPath,reviewPath,receiptSha256);
  if(errors.length) throw new Error('认证发布前的私有最终版本校验失败；详情仅在私有审核中查看');
  const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
  if(!SHA.test(head)) throw new Error('最终已审 PR head 不可读');
  const snapshot=await publicInventory(root);
  if(JSON.stringify(snapshot.files)!==JSON.stringify(gitPublicationFiles(root,head))) throw new Error('最终私有审核工作区尚未冻结到提交');
  const privateReview=JSON.parse((await readPrivatePinned(root,{path:reviewPath,sha256:receiptSha256})).bytes);
  const pr=await read(`pulls/${prNumber}`);
  if(!SHA.test(pr.base?.sha??'') || privateReview.baseCommit!==pr.base.sha
      || spawnSync('git',['merge-base','--is-ancestor',pr.base.sha,head],{cwd:root}).status!==0) throw new Error('私有审核基线不是实际 PR base，禁止选择更早基线隐藏既有公开页');
  if(pr.head?.sha!==head || pr.base?.ref!=='master' || pr.base?.repo?.full_name!==REPOSITORY
      || pr.head?.repo?.full_name!==REPOSITORY) throw new Error('私有最终审核未对应实际仓库 PR head');
  const reviews=await allPages(`pulls/${prNumber}/reviews`,read);
  const review=matchingReview(pr,reviews,snapshot.digest,receiptSha256);
  if(review) return {reviewedHeadSha:head,publicationDigest:snapshot.digest,privateReviewReceiptSha256:receiptSha256,
    reviewerLogin:review.user.login,reviewId:review.id,prNumber,privateInputsVerified:true};
  if(review===null) throw new Error('可信 GitHub 审查要求修改，禁止使用 owner 发布意图覆盖');
  if(privateReview.reviewedHeadSha!==head) throw new Error('私有独立回执未绑定最终 PR head');
  const technical=JSON.parse((await readPrivatePinned(root,privateReview.technicalReview)).bytes);
  if(technical.decision!=='PASS_BOUNDED_LOCAL_SINGLE_OWNER_GATE' || technical.candidateCommit!==head
      || technical.publicationDigest!==snapshot.digest) throw new Error('缺最终 head 和内容摘要绑定的独立发布校验技术审核');
  const repository=await read(''),comments=await allPages(`issues/${prNumber}/comments`,read);
  const authorization=matchingOwnerAuthorization(repository,pr,comments,snapshot.digest,{
    receipt:receiptSha256,independent:privateReview.independentReview.sha256,technical:privateReview.technicalReview.sha256,
  });
  if(!authorization) throw new Error('私有审核回执与实际 GitHub owner 发布意图摘要不一致');
  return {...ownerAuthorizationProof(authorization,pr,snapshot.digest,await requireNativePrCheck(pr,read)),privateInputsVerified:true};
}

export async function requireSuccessfulSync(after, {read=githubRead}={}) {
  if (!SHA.test(after ?? '')) throw new Error('同步 SHA 无效');
  const result = await read(`actions/workflows/sync.yml/runs?head_sha=${after}&per_page=100`);
  const runs = result.workflow_runs?.filter(r=>r.head_sha===after && r.head_branch==='master'
    && r.path==='.github/workflows/sync.yml' && r.head_repository?.full_name===REPOSITORY
    && ['push','workflow_dispatch'].includes(r.event)).sort((a,b)=>b.id-a.id);
  if (!runs?.length || runs[0].status!=='completed' || runs[0].conclusion!=='success') throw new Error('同一最终 SHA 的内容同步未成功，禁止生成/上传正式 PDF');
  return {syncRunId:runs[0].id};
}
