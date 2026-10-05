import { spawnSync } from 'node:child_process';
import { gitPublicationFiles, publicInventory, sha256 } from './content-review.mjs';

const REPOSITORY = 'AmbitionC/front-end-journey-resource';
const SHA = /^[a-f0-9]{40}$/u;

export async function githubRead(path) {
  // This repository uses public read endpoints. No token, new permission,
  // configurable API host or caller-supplied response file is accepted.
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/${path}`, {
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

export function matchingReview(pr, reviews, digest) {
  const latest = new Map();
  for (const review of reviews) {
    if (!review.submitted_at || !review.user?.login) continue;
    const id = review.user.login.toLowerCase(), before = latest.get(id);
    if (!before || Date.parse(review.submitted_at)>Date.parse(before.submitted_at)
        || review.submitted_at===before.submitted_at && review.id>before.id) latest.set(id,review);
  }
  const trusted = [...latest.values()].filter(r=>['OWNER','COLLABORATOR'].includes(r.author_association));
  if (trusted.some(r=>r.state==='CHANGES_REQUESTED')) return null;
  const marker = `content-release:v1 head=${pr.head.sha} digest=${digest}`;
  return trusted.find(r=>r.commit_id===pr.head.sha && r.body?.split(/\r?\n/u).some(line=>line.trim()===marker)
    && (r.state==='APPROVED' && r.user.login.toLowerCase()!==pr.user.login.toLowerCase()
      // A sole repository owner can attest that the private independent review
      // was checked. This is a publication attestation, never a claim that the
      // author performed an independent review of their own work.
      || r.state==='COMMENTED' && r.author_association==='OWNER'
        && r.body.split(/\r?\n/u).some(line=>line.trim()==='private-independent-review:verified')));
}

export async function validateGithubRelease(root, before, after, {read=githubRead}={}) {
  if (!SHA.test(before ?? '') || !SHA.test(after ?? '')) throw new Error('发布范围必须是完整 commit SHA');
  const head = spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
  if (head.status!==0 || head.stdout.trim()!==after) throw new Error('工作区未检出待发布最终提交');
  const ancestor = spawnSync('git',['merge-base','--is-ancestor',before,after],{cwd:root});
  if (ancestor.status!==0) throw new Error('发布范围非有效祖先链');
  const snapshot = await publicInventory(root), committed = gitPublicationFiles(root,after);
  if (JSON.stringify(snapshot.files)!==JSON.stringify(committed)) throw new Error('工作区资源与最终提交不一致');
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
    if (review) return {afterSha:after,reviewedHeadSha:pr.head.sha,publicationDigest:snapshot.digest,prNumber:pr.number,reviewId:review.id};
  }
  throw new Error('缺最终提交及实际资源快照绑定的可信 GitHub 审核回执');
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
