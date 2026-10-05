import { access, readFile, realpath } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep, isAbsolute } from 'node:path';
import { isDirectExecution, leafPath, readBounded, safeRelativePath } from './resource-paths.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { visibleLinkTargets } from './public-interview-contract.mjs';
import { createHash } from 'node:crypto';

export const INTERVIEW_SOURCE_HISTORY = '.codex/interview-source-history.json';
const STATUSES = new Set(['published', 'prepared', 'merged', 'skipped', 'retired', 'needs_review']);
const EVIDENCE_GRADES = new Set(['A', 'B', 'C']);

function emptyHistory() {
  return { schemaVersion: 1, updatedAt: '', records: {} };
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0);
}

function normalizedNowcoderUrl(value) {
  const url = new URL(value);
  url.hostname = url.hostname.replace(/^www\./u, '');
  url.pathname = url.pathname.replace(/\/+$/u, '') || '/';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function isCanonicalNowcoderUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'www.nowcoder.com'
      && url.username === ''
      && url.password === ''
      && url.port === ''
      && url.search === ''
      && url.hash === ''
      && !url.pathname.endsWith('/')
      && url.toString() === value;
  } catch {
    return false;
  }
}

function leaves(nodes) {
  return nodes.flatMap(node => node?.isLeaf ? [node] : leaves(node?.children ?? []));
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readInterviewSourceHistory(resourceRoot, historyPath) {
  if (!isAbsolute(historyPath ?? '')) throw new Error('来源历史必须显式指定仓库外绝对路径');
  const root = await realpath(resourceRoot), file = await realpath(historyPath), location = relative(root,file);
  if (location !== '..' && !location.startsWith(`..${sep}`) && !isAbsolute(location)) throw new Error('来源历史必须位于公开仓库外');
  return JSON.parse(await readFile(file,'utf8'));
}

export function normalizedSourceBody(text) {
  return text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u,'').normalize('NFKC').replace(/\s/gu,'');
}

export async function verifiedHistoricalFingerprint(root, record) {
  if (!isAbsolute(record.originalBodyEvidenceFile??'') || !/^[a-f0-9]{64}$/u.test(record.originalBodySha256??'')) throw new Error('历史原文缺仓外冻结证据');
  const base=await realpath(root),file=await realpath(record.originalBodyEvidenceFile),location=relative(base,file);
  if(location!=='..' && !location.startsWith(`..${sep}`) && !isAbsolute(location)) throw new Error('历史原文证据必须在公开仓外');
  const bytes=await readFile(file),hash=value=>createHash('sha256').update(value).digest('hex');
  if(hash(bytes)!==record.originalBodySha256) throw new Error('历史冻结原文指纹不一致');
  const capture=record.originalBodyDocumentJson?JSON.parse(bytes).document:null;
  if(capture && (capture.canonicalUrl||capture.url)!==record.url) throw new Error('历史冻结原文 URL 不一致');
  const text=capture?capture.text:bytes.toString();
  if(typeof text!=='string' || !text.trim()) throw new Error('历史冻结原文正文为空');
  const actual=hash(normalizedSourceBody(text));
  if(actual!==record.normalizedBodySha256) throw new Error('历史正文指纹未由冻结原文复算确认');
  return actual;
}

export async function validateInterviewSourceHistory(resourceRoot, history, options = {}) {
  const errors = [];
  if (!isObject(history) || history.schemaVersion !== 1 || !isObject(history.records)) {
    return ['面经来源历史格式无效：需要 schemaVersion=1 和 records 对象'];
  }
  if (typeof history.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(history.updatedAt)) {
    errors.push('面经来源历史 updatedAt 必须是 YYYY-MM-DD');
  }

  let treeLeaves = [];
  let knowledgeLeaves = [];
  try {
    treeLeaves = leaves(JSON.parse((await readBounded(resourceRoot,'interview/_tree.json','interview')).toString()));
  } catch {
    errors.push('无法读取 interview/_tree.json');
  }
  try {
    knowledgeLeaves = leaves(JSON.parse((await readBounded(resourceRoot,'knowledge/_tree.json','knowledge')).toString()));
  } catch {
    errors.push('无法读取 knowledge/_tree.json');
  }
  const leafByKey = new Map(treeLeaves.map(leaf => [leaf.key, leaf]));
  const knowledgeKeys = new Set(knowledgeLeaves.map(leaf => leaf.key));
  const seenUrls = new Map();
  const publishedClusters = new Map();
  const publishedArticles = new Map();

  for (const [id, record] of Object.entries(history.records)) {
    const prefix = `来源记录 ${id}`;
    if (!/^[a-f0-9]{12}$/u.test(id)) errors.push(`${prefix} 的内容 ID 必须是 12 位小写十六进制`);
    if (!isObject(record)) {
      errors.push(`${prefix} 不是对象`);
      continue;
    }
    if (record.source !== 'nowcoder') errors.push(`${prefix} 的 source 必须是 nowcoder`);
    if (typeof record.url !== 'string' || !/^https:\/\/(?:www\.)?nowcoder\.com\//u.test(record.url)) {
      errors.push(`${prefix} 的 URL 不是牛客 HTTPS 地址`);
    } else {
      const canonicalUrl = normalizedNowcoderUrl(record.url);
      if (seenUrls.has(canonicalUrl)) {
        errors.push(`${prefix} 与 ${seenUrls.get(canonicalUrl)} 使用了重复 URL`);
      } else seenUrls.set(canonicalUrl, id);
    }
    if (typeof record.contentHash !== 'string' || !/^[a-f0-9]{16}$/u.test(record.contentHash)) {
      errors.push(`${prefix} 的 contentHash 必须是 16 位小写十六进制`);
    }
    if (typeof record.clusterId !== 'string' || record.clusterId.length === 0) {
      errors.push(`${prefix} 缺少 clusterId`);
    }
    if (!EVIDENCE_GRADES.has(record.evidenceGrade)) errors.push(`${prefix} 的 evidenceGrade 无效`);
    if (!STATUSES.has(record.status)) errors.push(`${prefix} 的 status 无效`);
    if ((record.processUnitId !== undefined || (options.includePrepared && record.status === 'prepared'))
      && (typeof record.processUnitId !== 'string' || !record.processUnitId.trim())) {
      errors.push(`${prefix} 的独立面试过程 processUnitId 不能为空`);
    }
    if (!stringArray(record.publicFiles)) errors.push(`${prefix} 的 publicFiles 必须是字符串数组`);
    if (!stringArray(record.knowledgeKeys) && !(Array.isArray(record.knowledgeKeys) && record.knowledgeKeys.length === 0)) {
      errors.push(`${prefix} 的 knowledgeKeys 必须是字符串数组`);
    }
    if (Array.isArray(record.knowledgeKeys) && new Set(record.knowledgeKeys).size !== record.knowledgeKeys.length) {
      errors.push(`${prefix} 的 knowledgeKeys 含重复项`);
    }
    for (const knowledgeKey of Array.isArray(record.knowledgeKeys) ? record.knowledgeKeys : []) {
      if (!knowledgeKeys.has(knowledgeKey)) errors.push(`${prefix} 的知识点不存在：${knowledgeKey}`);
    }
    if (typeof record.processedAt !== 'string' || Number.isNaN(Date.parse(record.processedAt))) {
      errors.push(`${prefix} 的 processedAt 必须是 ISO 时间`);
    }

    if (record.status !== 'published' && !(options.includePrepared && record.status === 'prepared')) continue;
    if (!isCanonicalNowcoderUrl(record.url)) {
      errors.push(`${prefix} 发布面经必须使用规范牛客 URL`);
    }
    if (record.evidenceGrade !== 'A' && record.evidenceGrade !== 'B') {
      errors.push(`${prefix} 发布面经必须是 A/B 级证据`);
    }
    if (typeof record.articleKey !== 'string' || record.articleKey.length === 0) {
      errors.push(`${prefix} 发布面经缺少 articleKey`);
    } else {
      const sourceIds = publishedArticles.get(record.articleKey) ?? [];
      sourceIds.push(id);
      publishedArticles.set(record.articleKey, sourceIds);
      if (!leafByKey.has(record.articleKey)) {
        errors.push(`${prefix} 的 articleKey 不在 interview/_tree.json`);
      } else {
        const leaf = leafByKey.get(record.articleKey);
        let expectedFile;
        try { expectedFile = leafPath('interview',leaf); await readBounded(resourceRoot,expectedFile,'interview'); }
        catch { errors.push(`${prefix} 的公开文件不存在或面经路径无效、越界`); }
        if (expectedFile && (!Array.isArray(record.publicFiles) || !record.publicFiles.includes(expectedFile))) {
          errors.push(`${prefix} 的 articleKey 与 publicFiles 不匹配：应包含 ${expectedFile}`);
        }
      }
    }
    if (!Array.isArray(record.publicFiles) || record.publicFiles.length === 0) {
      errors.push(`${prefix} 发布面经缺少 publicFiles`);
    } else {
      for (const relativePath of record.publicFiles) {
        try { safeRelativePath(relativePath); await readBounded(resourceRoot,relativePath,'interview'); }
        catch(error) {
          errors.push(`${prefix} 的${error.code==='ENOENT'?'公开文件不存在':'公开文件路径越界'}：${relativePath}`);
          continue;
        }
      }
    }
    const previous = publishedClusters.get(record.clusterId);
    if (previous) {
      errors.push(`同一 cluster 只能有一篇公开面经：${record.clusterId}（${previous}、${id}）`);
    } else publishedClusters.set(record.clusterId, id);
  }

  for (const leaf of treeLeaves) {
    const sourceIds = publishedArticles.get(leaf.key) ?? [];
    if (sourceIds.length === 0) {
      errors.push(`公开面经缺少已发布来源记录：${leaf.key}`);
    } else if (sourceIds.length > 1) {
      errors.push(`公开面经只能对应一条已发布来源记录：${leaf.key}（${sourceIds.join('、')}）`);
    }
  }

  const relationHistory = options.includePrepared ? {
    ...history, records: Object.fromEntries(Object.entries(history.records).map(([id, record]) => [
      id, record.status === 'prepared' ? { ...record, status: 'published' } : record,
    ])),
  } : history;
  for (const topic of topicFrequencies(relationHistory)) {
    const knowledgeLeaf = knowledgeLeaves.find(leaf => leaf.key === topic.key);
    if (!knowledgeLeaf) continue;
    const knowledgeFile = join(resourceRoot, 'knowledge', knowledgeLeaf.filePath, `${knowledgeLeaf.key}.md`);
    let contents;
    try {
      contents = (await readBounded(resourceRoot,leafPath('knowledge',knowledgeLeaf),'knowledge')).toString();
    } catch {
      errors.push(`知识点正文不存在：${topic.key}`);
      continue;
    }
    for (const cluster of topic.clusters) {
      const sourceId = publishedClusters.get(cluster);
      const articleKey = sourceId ? history.records[sourceId]?.articleKey : undefined;
      const interviewLeaf = articleKey ? leafByKey.get(articleKey) : undefined;
      if (!interviewLeaf) {
        errors.push(`知识点 ${topic.key} 的来源 cluster 没有公开面经：${cluster}`);
        continue;
      }
      const interviewFile = join(
        resourceRoot,
        'interview',
        interviewLeaf.filePath,
        `${interviewLeaf.key}.md`,
      );
      const link = relative(dirname(knowledgeFile), interviewFile).split(sep).join('/');
      const suffix = options.requireClusterAnnotations === false ? '' : `（${cluster}）`;
      let realLink=false;
      try { realLink=visibleLinkTargets(contents,leafPath('knowledge',knowledgeLeaf)).has(leafPath('interview',interviewLeaf)); } catch {}
      if (!realLink || suffix && !contents.includes(`](${link.startsWith('.') ? link : `./${link}`})${suffix}`)) {
        errors.push(`知识点 ${topic.key} 缺少来源反链：${cluster}`);
      }
    }
  }
  return errors;
}

export function topicFrequencies(history) {
  if (!isObject(history?.records)) return [];
  const topics = new Map();
  const counted = new Set();
  for (const record of Object.values(history.records)) {
    if (!isObject(record) || (record.status !== 'published' && record.status !== 'merged')) continue;
    for (const key of Array.isArray(record.knowledgeKeys) ? record.knowledgeKeys : []) {
      const identity = `${key}\0${record.clusterId}`;
      const current = topics.get(key) ?? {
        key,
        clusters: new Set(),
        processes: new Set(),
        companies: new Set(),
        lastSeenAt: '',
      };
      if (!counted.has(identity)) {
        counted.add(identity);
        current.clusters.add(record.clusterId);
      }
      current.processes.add(record.processUnitId ?? record.clusterId);
      if (typeof record.company === 'string' && record.company.length > 0) {
        current.companies.add(record.company);
      }
      if (typeof record.processedAt === 'string' && record.processedAt > current.lastSeenAt) {
        current.lastSeenAt = record.processedAt;
      }
      topics.set(key, current);
    }
  }
  return [...topics.values()]
    .map(topic => ({
      key: topic.key,
      count: topic.processes.size,
      clusters: [...topic.clusters].sort(),
      companies: [...topic.companies].sort(),
      lastSeenAt: topic.lastSeenAt,
    }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

const isMain = isDirectExecution(import.meta.url);
if (isMain) {
  const resourceRoot = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(fileURLToPath(new URL('..', import.meta.url)));
  console.log(JSON.stringify(topicFrequencies(await readInterviewSourceHistory(resourceRoot, process.argv[3])), null, 2));
}
