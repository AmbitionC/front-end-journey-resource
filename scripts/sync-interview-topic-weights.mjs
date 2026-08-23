import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readInterviewSourceHistory, topicFrequencies } from './interview-source-history.mjs';

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
  const nextSection = `${heading}\n\n${body ? `${body}\n\n` : ''}${block}\n\n`;
  return `${markdown.slice(0, headingAt)}${nextSection}${markdown.slice(sectionEnd).replace(/^\n/u, '')}`;
}

function markdownPath(fromFile, toFile) {
  const path = relative(dirname(fromFile), toFile).split(sep).join('/');
  return path.startsWith('.') ? path : `./${path}`;
}

export async function syncInterviewTopicWeights(resourceRoot) {
  const treePath = resolve(resourceRoot, 'knowledge', '_tree.json');
  const interviewTreePath = resolve(resourceRoot, 'interview', '_tree.json');
  const tree = JSON.parse(await readFile(treePath, 'utf8'));
  const interviewTree = JSON.parse(await readFile(interviewTreePath, 'utf8'));
  const history = await readInterviewSourceHistory(resourceRoot);
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
    const leaf = byKey.get(key);
    if (!leaf) throw new Error(`知识点不存在于 knowledge/_tree.json：${key}`);
    const previous = [...new Set(Array.isArray(leaf.interviewClusters) ? leaf.interviewClusters : [])].sort();
    const desired = [...(frequencyByKey.get(key)?.clusters ?? [])].sort();
    const previousSet = new Set(previous);
    const desiredSet = new Set(desired);
    addedClusters += desired.filter(cluster => !previousSet.has(cluster)).length;
    removedClusters += previous.filter(cluster => !desiredSet.has(cluster)).length;
    const baseHeat = Number.isInteger(leaf.interviewBaseHeat)
      ? leaf.interviewBaseHeat
      : Math.max(0, (Number.isInteger(leaf.heat) ? leaf.heat : 0) - previous.length);
    const nextHeat = baseHeat + desired.length;
    const metadataChanged = leaf.interviewBaseHeat !== baseHeat ||
      JSON.stringify(previous) !== JSON.stringify(desired) ||
      leaf.heat !== nextHeat || leaf.currRank !== rankForHeat(nextHeat);
    if (metadataChanged) {
      leaf.interviewBaseHeat = baseHeat;
      leaf.interviewClusters = desired;
      leaf.heat = nextHeat;
      leaf.currRank = rankForHeat(nextHeat);
      updatedTopics += 1;
      affectedParents.add(parentByKey.get(key));
    }

    if (desired.length === 0 && previous.length === 0) continue;
    const knowledgeFile = resolve(resourceRoot, 'knowledge', leaf.filePath, `${leaf.key}.md`);
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
      return `- [${interviewLeaf.label}](${markdownPath(knowledgeFile, interviewFile)})（${cluster}）`;
    });
    const current = await readFile(knowledgeFile, 'utf8');
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

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const resourceRoot = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(fileURLToPath(new URL('..', import.meta.url)));
  console.log(JSON.stringify(await syncInterviewTopicWeights(resourceRoot)));
}
