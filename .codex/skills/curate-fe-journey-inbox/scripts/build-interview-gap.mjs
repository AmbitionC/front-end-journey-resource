#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EVIDENCE_RANK = { A: 3, B: 2, C: 1 };
const QUESTION_SIGNAL = /[?？]|什么|如何|为什么|区别|差异|设计|实现|优化|流程|机制|场景|介绍|解释|能否|怎么|哪些|是否/iu;

async function walk(root, predicate) {
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
      else if (predicate(path)) output.push(path);
    }
  }
  await visit(root);
  return output;
}

function normalizeQuestion(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[(（]?\d+[)）.、:]?\s*/, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function cleanQuestion(value) {
  return value
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[(（]?\d+[)）.、:]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function validQuestion(value) {
  const normalized = normalizeQuestion(value);
  return normalized.length >= 5 && normalized.length <= 180 && QUESTION_SIGNAL.test(value);
}

/**
 * 只做结构化候选抽取，不把答案段落或模型猜测伪装成真实问题。
 * 支持 Markdown 问题标题、逐行编号题，以及被网页清洗成单行的连续编号题。
 */
export function extractQuestions(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/u, '');
  const candidates = [];
  for (const line of body.split(/\r?\n/u)) {
    if (/^#{3,6}\s+/u.test(line) || /^\s*[(（]?\d{1,3}[)）.、:]\s*/u.test(line)) {
      candidates.push(cleanQuestion(line));
    }
  }
  const inline = /(?:^|\s)(?:[(（]?\d{1,3}[)）.、:])\s*([^\n]{4,240}?)(?=(?:\s+[(（]?\d{1,3}[)）.、:])|$)/gu;
  for (const match of body.matchAll(inline)) candidates.push(cleanQuestion(match[1] ?? ''));

  const unique = new Map();
  for (const candidate of candidates) {
    if (!validQuestion(candidate)) continue;
    const key = normalizeQuestion(candidate);
    if (!unique.has(key)) unique.set(key, candidate);
  }
  return [...unique.values()];
}

function grams(value) {
  const normalized = normalizeQuestion(value);
  if (normalized.length < 2) return new Set([normalized]);
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

function similarity(left, right) {
  const a = grams(left);
  const b = grams(right);
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return a.size + b.size === 0 ? 0 : (2 * intersection) / (a.size + b.size);
}

async function existingQuestions(resourceRoot) {
  const files = await walk(join(resourceRoot, 'interview'), path => path.endsWith('.md'));
  const output = [];
  for (const path of files) {
    const markdown = await readFile(path, 'utf8');
    for (const match of markdown.matchAll(/^####\s+(.+)$/gmu)) {
      const question = cleanQuestion(match[1] ?? '');
      if (question) output.push({ question, path: relative(resourceRoot, path) });
    }
  }
  return output;
}

function evidenceGrade(meta) {
  const raw = meta?.sourceMetadata?.evidenceGrade ?? meta?.evidenceGrade;
  return raw === 'A' || raw === 'B' ? raw : 'C';
}

async function inboxEntries(resourceRoot, batch) {
  const paths = await walk(
    join(resourceRoot, '_inbox'),
    path => basename(path) === 'meta.json' && !path.includes(`${join('_inbox', '_reports')}`),
  );
  const output = [];
  for (const metaPath of paths) {
    let meta;
    try {
      meta = JSON.parse(await readFile(metaPath, 'utf8'));
    } catch {
      continue;
    }
    const deliveryBatch = meta?.sourceMetadata?.deliveryBatchId ?? meta?.sourceMetadata?.batchId;
    if (batch && deliveryBatch !== batch) continue;
    const originalPath = join(dirname(metaPath), 'original.md');
    let markdown = '';
    try {
      markdown = await readFile(originalPath, 'utf8');
    } catch {
      continue;
    }
    const kinds = Array.isArray(meta?.feJourney?.candidateKinds)
      ? meta.feJourney.candidateKinds.filter(value => typeof value === 'string')
      : [];
    if (!kinds.some(kind => kind === 'interview' || kind === 'operation')) continue;
    output.push({
      meta,
      metaPath,
      markdown,
      grade: evidenceGrade(meta),
      kinds,
      clusterId: meta?.feJourney?.clusterId
        ?? meta?.feJourney?.contentHash
        ?? meta?.contentHash
        ?? meta?.url
        ?? relative(resourceRoot, dirname(metaPath)),
      questions: extractQuestions(markdown),
    });
  }
  return output;
}

function groupEntries(entries) {
  const groups = new Map();
  for (const entry of entries) groups.set(entry.clusterId, [...(groups.get(entry.clusterId) ?? []), entry]);
  return [...groups.entries()].map(([clusterId, members]) => ({ clusterId, members }));
}

function bestMember(members) {
  return [...members].sort((left, right) => {
    const grade = EVIDENCE_RANK[right.grade] - EVIDENCE_RANK[left.grade];
    if (grade !== 0) return grade;
    const quality = (right.meta?.feJourney?.qualityScore ?? 0) - (left.meta?.feJourney?.qualityScore ?? 0);
    if (quality !== 0) return quality;
    return String(left.meta?.url ?? '').localeCompare(String(right.meta?.url ?? ''));
  })[0];
}

function markdownEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function sourceLinks(sources) {
  return sources.map((source, index) => `[${index + 1}](${source})`).join(' ');
}

function renderInterview(date, summary, rows, cOnlyClusters) {
  const lines = [
    `# ${date} 真实面经与现有题库差距初筛`,
    '',
    '> 本报告由确定性脚本生成。状态是候选判断：Codex 必须结合题意、追问深度和现有答案做语义确认后，才能修改公开题库。C 级证据只列入排除统计，不能形成更新建议。',
    '',
    '## 摘要',
    '',
    `- 输入条目：${summary.inputEntries}`,
    `- 内容簇：${summary.contentClusters}`,
    `- A/B 合格内容簇：${summary.eligibleClusters}`,
    `- 问题簇：${rows.length}`,
    `- C 级证据排除：${cOnlyClusters} 个内容簇`,
    '',
    '## 问题簇',
    '',
    '| 状态 | 真实面试问题 | 现有最接近问题 | 证据 | 来源 |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.status} | ${markdownEscape(row.question)} | ${markdownEscape(row.closest || '—')} | ${row.grade} | ${sourceLinks(row.sources)} |`),
    '',
    '## 语义复核契约',
    '',
    '- `covered`：题意、回答深度和生产追问均已覆盖，只补来源证据或热度。',
    '- `evolved`：概念相关但真实面试增加了生产约束、追问或项目证据，应升级现有题。',
    '- `new`：现有面试题库没有同题意问题，确认 A/B 证据后才建议新增。',
    '- 机器结果若与人工语义判断冲突，以人工复核为准，并在报告中记录理由。',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function renderOperations(date, clusters) {
  const lines = [
    `# ${date} 运营选题候选`,
    '',
    '> 仅保存在本机 `_inbox/_reports/`。这里只列 A/B 证据簇，C 级汇编或营销内容不能形成选题建议。',
    '',
    '| 主题 | 目标读者 | 可复用观点 | 证据 | 来源 | clusterId |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const cluster of clusters) {
    const eligible = cluster.members.filter(member => member.grade === 'A' || member.grade === 'B');
    if (!eligible.some(member => member.kinds.includes('operation'))) continue;
    const representative = bestMember(eligible);
    const sources = [...new Set(eligible.map(member => member.meta?.url).filter(Boolean))];
    lines.push(`| ${markdownEscape(representative.meta?.title ?? cluster.clusterId)} | Agent 求职者与研发者 | 从真实追问提炼选题，发布前核验事实与时效 | ${representative.grade} | ${sourceLinks(sources)} | ${markdownEscape(cluster.clusterId)} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function atomicWrite(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, content);
  await rename(temporary, path);
}

export async function buildInterviewGap(resourceRoot, options = {}) {
  const root = resolve(resourceRoot);
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const entries = await inboxEntries(root, options.batch);
  const clusters = groupEntries(entries);
  const eligibleClusters = clusters.filter(cluster =>
    cluster.members.some(member => member.grade === 'A' || member.grade === 'B'));
  const cOnlyClusters = clusters.length - eligibleClusters.length;
  const current = await existingQuestions(root);
  const questionGroups = new Map();

  for (const cluster of eligibleClusters) {
    const eligible = cluster.members.filter(member => member.grade === 'A' || member.grade === 'B');
    if (!eligible.some(member => member.kinds.includes('interview'))) continue;
    for (const member of eligible) {
      for (const question of member.questions) {
        const key = normalizeQuestion(question);
        const existing = questionGroups.get(key) ?? {
          question,
          grades: new Set(),
          sources: new Set(),
          contentClusters: new Set(),
        };
        existing.grades.add(member.grade);
        if (member.meta?.url) existing.sources.add(member.meta.url);
        existing.contentClusters.add(cluster.clusterId);
        questionGroups.set(key, existing);
      }
    }
  }

  const rows = [...questionGroups.values()].map(group => {
    const exact = current.find(item => normalizeQuestion(item.question) === normalizeQuestion(group.question));
    let closest = exact;
    let best = exact ? 1 : 0;
    if (!exact) {
      for (const candidate of current) {
        const score = similarity(group.question, candidate.question);
        if (score > best) {
          best = score;
          closest = candidate;
        }
      }
    }
    return {
      status: exact ? 'covered' : best >= 0.45 ? 'evolved' : 'new',
      question: group.question,
      closest: closest?.question,
      closestPath: closest?.path,
      grade: group.grades.has('A') ? 'A' : 'B',
      sources: [...group.sources].sort(),
      contentClusters: [...group.contentClusters].sort(),
    };
  });

  const summary = {
    inputEntries: entries.length,
    contentClusters: clusters.length,
    eligibleClusters: eligibleClusters.length,
    questionClusters: rows.length,
  };
  const interviewMarkdown = renderInterview(date, summary, rows, cOnlyClusters);
  const operationMarkdown = renderOperations(date, eligibleClusters);
  const reportRoot = join(root, '_inbox', '_reports');
  const interviewPath = join(reportRoot, `interview-gap-${date}.md`);
  const operationPath = join(reportRoot, `operation-topics-${date}.md`);
  if (options.write !== false) {
    await atomicWrite(interviewPath, interviewMarkdown);
    await atomicWrite(operationPath, operationMarkdown);
  }
  return {
    summary,
    rows,
    interviewMarkdown,
    operationMarkdown,
    interviewPath,
    operationPath,
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const root = args.shift();
  if (!root) throw new Error('用法：build-interview-gap.mjs <resource-root> [--date YYYY-MM-DD] [--batch ID]');
  let date;
  let batch;
  while (args.length > 0) {
    const flag = args.shift();
    if (flag === '--date') {
      date = args.shift();
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(date ?? '')) throw new Error('--date 必须是 YYYY-MM-DD');
    } else if (flag === '--batch') {
      batch = args.shift();
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/u.test(batch ?? '') || batch.includes('..')) {
        throw new Error('--batch 标识无效');
      }
    } else throw new Error(`未知参数：${flag}`);
  }
  return { root, date, batch };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { root, date, batch } = parseArgs(process.argv.slice(2));
    const result = await buildInterviewGap(root, {
      ...(date ? { date } : {}),
      ...(batch ? { batch } : {}),
      write: true,
    });
    process.stdout.write(`${result.interviewPath}\n${result.operationPath}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
