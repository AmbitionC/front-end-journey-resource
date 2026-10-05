import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readInterviewSourceHistory, topicFrequencies } from './interview-source-history.mjs';
import { validatePrivateInterviewHistory } from './validate-private-interview-history.mjs';
import { isDirectExecution, leafPath, readBounded } from './resource-paths.mjs';

const MANAGED_START = '<!-- interview-source-history:start -->';
const MANAGED_END = '<!-- interview-source-history:end -->';

function rankForHeat(heat) {
  if (heat <= 0) return 0;
  if (heat === 1) return 1;
  if (heat === 2) return 2;
  if (heat <= 4) return 3;
  if (heat <= 7) return 4;
  return 5;
}

function mapLeaves(nodes, byKey, parentByKey) {
  for (const node of nodes) {
    if (node?.isLeaf) {
      byKey.set(node.key, node);
      if (parentByKey) parentByKey.set(node.key, nodes);
    } else mapLeaves(node?.children ?? [], byKey, parentByKey);
  }
}

function managedSourceSection(markdown, entries) {
  const block = `${MANAGED_START}\n${entries.join('\n')}\n${MANAGED_END}`;
  const heading = '## 出现于（热度来源）';
  const headingAt = markdown.indexOf(heading);
  if (headingAt < 0) {
    const referencesAt = markdown.indexOf('\n## 参考资料');
    const insertAt = referencesAt < 0 ? markdown.length : referencesAt;
    return `${markdown.slice(0, insertAt).trimEnd()}\n\n${heading}\n\n${block}\n${markdown.slice(insertAt)}`;
  }

  const sectionEndCandidate = markdown.indexOf('\n## ', headingAt + heading.length);
  const sectionEnd = sectionEndCandidate < 0 ? markdown.length : sectionEndCandidate;
  let body = markdown.slice(headingAt + heading.length, sectionEnd);
  body = body.replace(new RegExp(`${MANAGED_START}[\\s\\S]*?${MANAGED_END}`, 'u'), '');
  body = body
    .split('\n')
    .filter(line => !(line.trimStart().startsWith('- ') && line.includes('cluster-')))
    .join('\n')
    .trim();
  const remaining = markdown.slice(sectionEnd).replace(/^\n/u, '');
  const nextSection = `${heading}\n\n${body ? `${body}\n\n` : ''}${block}${remaining ? '\n\n' : '\n'}`;
  return `${markdown.slice(0, headingAt)}${nextSection}${remaining}`;
}

function markdownPath(fromFile, toFile) {
  const path = relative(dirname(fromFile), toFile).split(sep).join('/');
  return path.startsWith('.') ? path : `./${path}`;
}

export async function syncInterviewTopicWeights(resourceRoot, options = {}) {
  if (options.privacyMode) {
    const errors = await validatePrivateInterviewHistory(resourceRoot, options.historyPath, options);
    if (errors.length) throw new Error(`私有来源审核未通过：${errors.length} 项，不更新热度或公开反链`);
    if (!Array.isArray(options.keys) || options.keys.length === 0) throw new Error('必须限定本批知识 key，不能隐式治理全库');
  }
  const treePath = resolve(resourceRoot, 'knowledge', '_tree.json');
  const interviewTreePath = resolve(resourceRoot, 'interview', '_tree.json');
  const tree = JSON.parse((await readBounded(resourceRoot,'knowledge/_tree.json','knowledge')).toString());
  const interviewTree = JSON.parse((await readBounded(resourceRoot,'interview/_tree.json','interview')).toString());
  const originalHistory = options.privacyMode
    ? JSON.parse(await readFile(options.historyPath, 'utf8'))
    : await readInterviewSourceHistory(resourceRoot, options.historyPath);
  const history = options.privacyMode ? {
    ...originalHistory,
    records: Object.fromEntries(Object.entries(originalHistory.records).map(([id, record]) => [
      id, record.status === 'prepared' ? { ...record, status: 'published' } : record,
    ])),
  } : originalHistory;
  const frequencies = topicFrequencies(history);
  const frequencyByKey = new Map(frequencies.map(item => [item.key, item]));
  const byKey = new Map();
  const parentByKey = new Map();
  const interviewByKey = new Map();
  mapLeaves(tree, byKey, parentByKey);
  mapLeaves(interviewTree, interviewByKey);

  const publishedByCluster = new Map();
  for (const record of Object.values(history.records ?? {})) {
    if (record?.status === 'published') publishedByCluster.set(record.clusterId, record);
  }

  let updatedTopics = 0;
  let addedClusters = 0;
  let removedClusters = 0;
  let updatedArticles = 0;
  const affectedParents = new Set();
  const keys = new Set([
    ...frequencyByKey.keys(),
    ...[...byKey.values()]
      .filter(leaf => Array.isArray(leaf.interviewClusters) || Number.isInteger(leaf.interviewBaseHeat))
      .map(leaf => leaf.key),
  ]);

  for (const key of keys) {
    if (options.privacyMode && !options.keys.includes(key)) continue;
    const leaf = byKey.get(key);
    if (!leaf) throw new Error(`知识点不存在于 knowledge/_tree.json：${key}`);
    const previous = [...new Set(Array.isArray(leaf.interviewClusters) ? leaf.interviewClusters : [])].sort();
    const desired = [...(frequencyByKey.get(key)?.clusters ?? [])].sort();
    const previousSet = new Set(previous);
    const desiredSet = new Set(desired);
    if (!options.privacyMode) {
      addedClusters += desired.filter(cluster => !previousSet.has(cluster)).length;
      removedClusters += previous.filter(cluster => !desiredSet.has(cluster)).length;
    }
    const baseHeat = Number.isInteger(leaf.interviewBaseHeat)
      ? leaf.interviewBaseHeat
      : Math.max(0, (Number.isInteger(leaf.heat) ? leaf.heat : 0) - previous.length);
    const nextCount = frequencyByKey.get(key)?.count ?? 0;
    if (options.privacyMode) {
      const previousCount = leaf.interviewCount ?? previous.length;
      addedClusters += Math.max(0, nextCount - previousCount);
      removedClusters += Math.max(0, previousCount - nextCount);
    }
    const nextHeat = baseHeat + nextCount;
    const metadataChanged = leaf.interviewBaseHeat !== baseHeat ||
      (options.privacyMode ? leaf.interviewCount !== nextCount || leaf.interviewClusters !== undefined
        : JSON.stringify(previous) !== JSON.stringify(desired)) ||
      leaf.heat !== nextHeat || leaf.currRank !== rankForHeat(nextHeat);
    if (metadataChanged) {
      leaf.interviewBaseHeat = baseHeat;
      if (options.privacyMode) {
        leaf.interviewCount = nextCount;
        delete leaf.interviewClusters;
      } else leaf.interviewClusters = desired;
      leaf.heat = nextHeat;
      leaf.currRank = rankForHeat(nextHeat);
      updatedTopics += 1;
      affectedParents.add(parentByKey.get(key));
    }

    if (desired.length === 0 && previous.length === 0) continue;
    const knowledgeFile = resolve(resourceRoot, leafPath('knowledge',leaf));
    const entries = desired.map(cluster => {
      const record = publishedByCluster.get(cluster);
      if (!record) throw new Error(`来源 cluster 没有公开面经可供反链：${cluster}`);
      const interviewLeaf = interviewByKey.get(record.articleKey);
      if (!interviewLeaf) throw new Error(`公开面经不在 interview/_tree.json：${record.articleKey}`);
      const interviewFile = resolve(
        resourceRoot,
        'interview',
        interviewLeaf.filePath,
        `${interviewLeaf.key}.md`,
      );
      return `- [${interviewLeaf.label}](${markdownPath(knowledgeFile, interviewFile)})${options.privacyMode ? '' : `（${cluster}）`}`;
    });
    const current = (await readBounded(resourceRoot,leafPath('knowledge',leaf),'knowledge')).toString();
    const next = managedSourceSection(current, entries);
    if (next !== current) {
      await writeFile(knowledgeFile, next, 'utf8');
      updatedArticles += 1;
    }
  }

  if (updatedTopics > 0) {
    for (const children of affectedParents) {
      if (!children?.every(child => child?.isLeaf)) continue;
      children.sort((left, right) => (right.heat ?? 0) - (left.heat ?? 0));
    }
    await writeFile(treePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
  }
  return { updatedTopics, addedClusters, removedClusters, updatedArticles };
}

const isMain = isDirectExecution(import.meta.url);
if (isMain) {
  const resourceRoot = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(fileURLToPath(new URL('..', import.meta.url)));
  const historyAt = process.argv.indexOf('--history');
  const keysAt = process.argv.indexOf('--keys');
  const reviewAt=process.argv.indexOf('--review'), pinAt=process.argv.indexOf('--review-sha');
  if (historyAt < 0 || keysAt < 0) {
    console.error('同步热度必须提供 --history 仓库外私有路径 和 --keys 本批知识key列表；缺失时不写入。');
    process.exit(1);
  }
  try {
    console.log(JSON.stringify(await syncInterviewTopicWeights(resourceRoot, {
      privacyMode: true, historyPath: process.argv[historyAt + 1],
      reviewPath:reviewAt>=0?process.argv[reviewAt+1]:undefined,
      reviewSha256:pinAt>=0?process.argv[pinAt+1]:undefined,
      keys: (process.argv[keysAt + 1] ?? '').split(',').filter(Boolean),
    })));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
