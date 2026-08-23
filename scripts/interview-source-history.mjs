import { access, readFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const INTERVIEW_SOURCE_HISTORY = '.codex/interview-source-history.json';
const STATUSES = new Set(['published', 'merged', 'skipped', 'retired', 'needs_review']);
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

export async function readInterviewSourceHistory(resourceRoot) {
  try {
    return JSON.parse(await readFile(join(resourceRoot, INTERVIEW_SOURCE_HISTORY), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyHistory();
    throw error;
  }
}

export async function validateInterviewSourceHistory(resourceRoot, history) {
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
    treeLeaves = leaves(JSON.parse(await readFile(join(resourceRoot, 'interview', '_tree.json'), 'utf8')));
  } catch {
    errors.push('无法读取 interview/_tree.json');
  }
  try {
    knowledgeLeaves = leaves(JSON.parse(await readFile(join(resourceRoot, 'knowledge', '_tree.json'), 'utf8')));
  } catch {
    errors.push('无法读取 knowledge/_tree.json');
  }
  const leafByKey = new Map(treeLeaves.map(leaf => [leaf.key, leaf]));
  const knowledgeKeys = new Set(knowledgeLeaves.map(leaf => leaf.key));
  const seenUrls = new Map();
  const publishedClusters = new Map();

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

    if (record.status !== 'published') continue;
    if (record.evidenceGrade !== 'A' && record.evidenceGrade !== 'B') {
      errors.push(`${prefix} 发布面经必须是 A/B 级证据`);
    }
    if (typeof record.articleKey !== 'string' || record.articleKey.length === 0) {
      errors.push(`${prefix} 发布面经缺少 articleKey`);
    } else if (!leafByKey.has(record.articleKey)) {
      errors.push(`${prefix} 的 articleKey 不在 interview/_tree.json`);
    } else {
      const leaf = leafByKey.get(record.articleKey);
      const expectedFile = `interview/${leaf.filePath}/${leaf.key}.md`;
      if (!Array.isArray(record.publicFiles) || !record.publicFiles.includes(expectedFile)) {
        errors.push(`${prefix} 的 articleKey 与 publicFiles 不匹配：应包含 ${expectedFile}`);
      }
    }
    if (!Array.isArray(record.publicFiles) || record.publicFiles.length === 0) {
      errors.push(`${prefix} 发布面经缺少 publicFiles`);
    } else {
      for (const relativePath of record.publicFiles) {
        const normalized = normalize(relativePath);
        if (!normalized.startsWith(`interview${sep}`) || normalized.includes(`..${sep}`)) {
          errors.push(`${prefix} 的公开文件路径越界：${relativePath}`);
          continue;
        }
        if (!await pathExists(join(resourceRoot, normalized))) {
          errors.push(`${prefix} 的公开文件不存在：${relativePath}`);
        }
      }
    }
    const previous = publishedClusters.get(record.clusterId);
    if (previous) {
      errors.push(`同一 cluster 只能有一篇公开面经：${record.clusterId}（${previous}、${id}）`);
    } else publishedClusters.set(record.clusterId, id);
  }

  for (const topic of topicFrequencies(history)) {
    const knowledgeLeaf = knowledgeLeaves.find(leaf => leaf.key === topic.key);
    if (!knowledgeLeaf) continue;
    const knowledgeFile = join(resourceRoot, 'knowledge', knowledgeLeaf.filePath, `${knowledgeLeaf.key}.md`);
    let contents;
    try {
      contents = await readFile(knowledgeFile, 'utf8');
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
      if (!contents.includes(`](${link.startsWith('.') ? link : `./${link}`})（${cluster}）`)) {
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
        companies: new Set(),
        lastSeenAt: '',
      };
      if (!counted.has(identity)) {
        counted.add(identity);
        current.clusters.add(record.clusterId);
      }
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
      count: topic.clusters.size,
      clusters: [...topic.clusters].sort(),
      companies: [...topic.companies].sort(),
      lastSeenAt: topic.lastSeenAt,
    }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const resourceRoot = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(fileURLToPath(new URL('..', import.meta.url)));
  console.log(JSON.stringify(topicFrequencies(await readInterviewSourceHistory(resourceRoot)), null, 2));
}
