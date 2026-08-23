#!/usr/bin/env node
import { readFile, readdir, realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

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

export async function inspectBatch(resourceRoot, batch) {
  if (!BATCH.test(batch) || batch.includes('..')) throw new Error('batch 标识无效');
  const root = await realpath(resolve(resourceRoot));
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
    if (meta?.sourceMetadata?.batchId !== batch) continue;
    const id = clusterId(meta);
    if (meta?.source !== 'nowcoder' || meta?.sourceMetadata?.planId !== 'nowcoder-agent-market' ||
      typeof id !== 'string' || id.length === 0 || candidateKinds(meta).length === 0) {
      malformed.push({ path: display, reason: '当前批次条目的来源、计划或候选元数据无效' });
      continue;
    }
    const originalPath = join(dirname(metaPath), 'original.md');
    try {
      await readFile(originalPath, 'utf8');
    } catch {
      malformed.push({ path: display, reason: '缺少 original.md' });
      continue;
    }
    inputs.push({ clusterId: id, source: sourceOf(root, metaPath, meta) });
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

  for (const cluster of clusters) {
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
    malformed: malformed.sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const root = args.shift();
  const batchIndex = args.indexOf('--batch');
  const batch = batchIndex >= 0 ? args[batchIndex + 1] : undefined;
  if (!root || !batch) throw new Error('用法：inspect-batch.mjs <resource-root> --batch <id>');
  return { root, batch };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { root, batch } = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(await inspectBatch(root, batch))}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
