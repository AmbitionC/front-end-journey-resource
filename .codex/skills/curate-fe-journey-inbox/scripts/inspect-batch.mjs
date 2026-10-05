#!/usr/bin/env node
import { readFile, readdir, realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { isDirectExecution } from '../../../../scripts/resource-paths.mjs';
import { readInterviewSourceHistory, verifiedHistoricalFingerprint, normalizedSourceBody } from '../../../../scripts/interview-source-history.mjs';

const BATCH = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/u;
const PUBLIC_KINDS = new Set(['interview', 'knowledge']);
const PRIVATE_KINDS = new Set(['operation', 'project']);
const GRADE_RANK = { A: 3, B: 2, C: 1 };

async function walkMeta(root) {
  const output = [];
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name === 'meta.json' && !path.includes(`${sep}_reports${sep}`)) output.push(path);
    }
  }
  await visit(root);
  return output;
}

function evidenceGrade(meta) {
  const grade = meta?.sourceMetadata?.evidenceGrade;
  return grade === 'A' || grade === 'B' ? grade : 'C';
}

function candidateKinds(meta) {
  return Array.isArray(meta?.feJourney?.candidateKinds)
    ? [...new Set(meta.feJourney.candidateKinds.filter(kind =>
        PUBLIC_KINDS.has(kind) || PRIVATE_KINDS.has(kind)))]
    : [];
}

function clusterId(meta) {
  return meta?.feJourney?.clusterId
    ?? meta?.feJourney?.contentHash
    ?? meta?.contentHash
    ?? meta?.url;
}

function sourceOf(root, metaPath, meta) {
  return {
    id: String(meta.id ?? ''),
    title: String(meta.title ?? ''),
    url: String(meta.url ?? ''),
    contentHash: String(meta?.feJourney?.contentHash ?? meta?.contentHash ?? ''),
    grade: evidenceGrade(meta),
    path: relative(root, dirname(metaPath)),
    kinds: candidateKinds(meta),
    qualityScore: Number(meta?.feJourney?.qualityScore ?? 0),
    projectScore: Number(meta?.feJourney?.projectScore ?? 0),
    exclusions: Array.isArray(meta?.feJourney?.exclusionReasons)
      ? meta.feJourney.exclusionReasons.map(String)
      : [],
    truncated: meta?.truncated === true,
  };
}

function representative(members) {
  return [...members].sort((left, right) =>
    (GRADE_RANK[right.grade] - GRADE_RANK[left.grade])
    || (right.qualityScore - left.qualityScore)
    || left.path.localeCompare(right.path))[0];
}

function publicItem(cluster, eligible) {
  const sources = eligible.filter(member => member.grade === 'A' || member.grade === 'B');
  const kinds = [...new Set(sources.flatMap(member => member.kinds).filter(kind => PUBLIC_KINDS.has(kind)))].sort();
  if (kinds.length === 0) return undefined;
  return {
    clusterId: cluster.clusterId,
    representative: representative(sources),
    kinds,
    sources: sources.map(({ id, title, url, grade, path }) => ({ id, title, url, grade, path })),
  };
}

function privateItem(cluster, eligible, kind) {
  const sources = eligible.filter(member =>
    member.kinds.includes(kind) && (member.grade === 'A' || member.grade === 'B'));
  if (sources.length === 0) return undefined;
  return {
    clusterId: cluster.clusterId,
    representative: representative(sources),
    sources: sources.map(({ id, title, url, grade, path }) => ({ id, title, url, grade, path })),
  };
}

export async function inspectBatch(resourceRoot, batch, {historyPath}={}) {
  if (!BATCH.test(batch) || batch.includes('..')) throw new Error('batch 标识无效');
  const root = await realpath(resolve(resourceRoot));
  const history = await readInterviewSourceHistory(root,historyPath);
  const historyRecords = Object.values(history?.records ?? {});
  let unverifiedHistoricalFingerprint=false;
  for(const record of historyRecords.filter(r=>['prepared','published','merged'].includes(r.status))) {
    try { record.normalizedBodySha256=await verifiedHistoricalFingerprint(root,record); }
    catch { unverifiedHistoricalFingerprint=true; }
  }
  const malformed = [];
  const inputs = [];
  for (const requestedPath of await walkMeta(join(root, '_inbox', 'nowcoder'))) {
    const display = relative(root, requestedPath);
    let metaPath;
    try {
      metaPath = await realpath(requestedPath);
      const inside = relative(root, metaPath);
      if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {
        malformed.push({ path: display, reason: 'meta.json 指向仓库外部' });
        continue;
      }
    } catch {
      malformed.push({ path: display, reason: 'meta.json 不可读' });
      continue;
    }
    let meta;
    try {
      meta = JSON.parse(await readFile(metaPath, 'utf8'));
    } catch {
      malformed.push({ path: display, reason: 'meta.json 不是有效 JSON' });
      continue;
    }
    // Pooled fixed-plan delivery can reuse a source captured in an earlier run. Scope by the
    // delivery batch when present, while retaining batchId/sourceBatchId as immutable capture
    // provenance. Legacy single-run entries continue to use batchId.
    if ((meta?.sourceMetadata?.deliveryBatchId ?? meta?.sourceMetadata?.batchId) !== batch) continue;
    let id = clusterId(meta);
    const deliveryProvenance = meta?.sourceMetadata?.planId === 'nowcoder-agent-market'
      || meta?.sourceMetadata?.deliveryKind === 'nowcoder-directed';
    if (meta?.source !== 'nowcoder' || !deliveryProvenance ||
      typeof id !== 'string' || id.length === 0 || candidateKinds(meta).length === 0) {
      malformed.push({ path: display, reason: '当前批次条目的来源、交付类型或候选元数据无效' });
      continue;
    }
    const originalPath = join(dirname(metaPath), 'original.md');
    let original;
    try {
      const actual = await realpath(originalPath), location = relative(root,actual);
      if (location==='..' || location.startsWith(`..${sep}`) || isAbsolute(location)) throw new Error('original.md 越界');
      original = await readFile(actual,'utf8');
    } catch {
      malformed.push({ path: display, reason: '缺少 original.md' });
      continue;
    }
    const body = normalizedSourceBody(original);
    if (!body) { malformed.push({path:display,reason:'原始正文为空'}); continue; }
    const normalizedBodySha256 = createHash('sha256').update(body).digest('hex');
    // Actual frozen body wins over caller-editable clusterId/contentHash.
    id = `body-${normalizedBodySha256}`;
    inputs.push({ clusterId:id, source:{...sourceOf(root,metaPath,meta),normalizedBodySha256} });
  }

  const grouped = new Map();
  for (const input of inputs) {
    const members = grouped.get(input.clusterId) ?? [];
    members.push(input.source);
    grouped.set(input.clusterId, members);
  }
  const clusters = [...grouped.entries()]
    .map(([id, members]) => ({ clusterId: id, members: members.sort((a, b) => a.path.localeCompare(b.path)) }))
    .sort((left, right) => left.clusterId.localeCompare(right.clusterId));
  const publicContent = [];
  const operation = [];
  const project = [];
  const skipped = [];
  const blocked = [];
  const previouslyProcessed = [];

  for (const cluster of clusters) {
    if(unverifiedHistoricalFingerprint) {
      blocked.push({clusterId:cluster.clusterId,reason:'历史原文指纹缺少可复算的仓外冻结证据，停止去重推断',paths:cluster.members.map(item=>item.path)});continue;
    }
    if (cluster.members.some(member=>historyRecords.some(record=>record.url===member.url && !record.normalizedBodySha256))) {
      blocked.push({clusterId:cluster.clusterId,reason:'既有来源缺实际原文指纹，须审核回填；不使用可编辑元数据推断未变化',paths:cluster.members.map(item=>item.path)}); continue;
    }
    const changedExistingSource = cluster.members.some(member => {
      const previous = historyRecords.find(record => record?.url === member.url);
      return previous && previous.normalizedBodySha256 !== member.normalizedBodySha256;
    });
    const unchangedExistingSource = cluster.members.some(member => historyRecords.some(record =>
      record?.url === member.url && record.normalizedBodySha256 === member.normalizedBodySha256 &&
      record.status !== 'needs_review'));
    const finalizedCluster = historyRecords.some(record=>cluster.members.some(member=>
      record.normalizedBodySha256===member.normalizedBodySha256) && record.status!=='needs_review');
    if (!changedExistingSource && (unchangedExistingSource || finalizedCluster)) {
      previouslyProcessed.push({
        clusterId: cluster.clusterId,
        reason: '来源内容未变化且已有处理记录',
        paths: cluster.members.map(item => item.path),
        sources: cluster.members.map(item => ({
          id: item.id,
          url: item.url,
          contentHash: item.contentHash,
        })),
      });
      continue;
    }
    const clean = cluster.members.filter(member => !member.truncated);
    if (clean.length === 0) {
      blocked.push({ clusterId: cluster.clusterId, reason: '正文被截断', paths: cluster.members.map(item => item.path) });
      continue;
    }
    const eligible = clean.filter(member => member.exclusions.length === 0 && member.qualityScore >= 30);
    if (eligible.length === 0) {
      const reasons = [...new Set(clean.flatMap(member => member.exclusions))];
      skipped.push({
        clusterId: cluster.clusterId,
        reason: reasons.join('；') || '质量分低于 30',
        paths: cluster.members.map(item => item.path),
      });
      continue;
    }
    const publicCandidate = publicItem(cluster, eligible);
    if (publicCandidate) publicContent.push(publicCandidate);
    else if (eligible.some(member => member.kinds.some(kind => PUBLIC_KINDS.has(kind)))) {
      blocked.push({
        clusterId: cluster.clusterId,
        reason: '公开内容没有 A/B 证据',
        paths: cluster.members.map(item => item.path),
      });
    }
    const operationCandidate = privateItem(cluster, eligible, 'operation');
    if (operationCandidate) operation.push(operationCandidate);
    const projectCandidate = privateItem(cluster, eligible, 'project');
    if (projectCandidate) project.push(projectCandidate);
  }

  return {
    schemaVersion: 1,
    repo: root,
    batch,
    clusters: clusters.map(cluster => ({
      clusterId: cluster.clusterId,
      paths: cluster.members.map(item => item.path),
    })),
    publicContent,
    operation,
    project,
    skipped,
    blocked,
    previouslyProcessed,
    malformed: malformed.sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const root = args.shift();
  const batchIndex = args.indexOf('--batch');
  const batch = batchIndex >= 0 ? args[batchIndex + 1] : undefined;
  const historyIndex=args.indexOf('--history'), historyPath=historyIndex>=0?args[historyIndex+1]:undefined;
  if (!root || !batch || !historyPath) throw new Error('用法：inspect-batch.mjs <resource-root> --batch <id> --history /private/history.json');
  return { root, batch, historyPath };
}

if (isDirectExecution(import.meta.url)) {
  try {
    const { root, batch, historyPath } = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(await inspectBatch(root, batch,{historyPath}))}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
