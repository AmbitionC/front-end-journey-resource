import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readInterviewSourceHistory, topicFrequencies } from './interview-source-history.mjs';

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
      parentByKey.set(node.key, nodes);
    } else mapLeaves(node?.children ?? [], byKey, parentByKey);
  }
}

export async function syncInterviewTopicWeights(resourceRoot) {
  const treePath = resolve(resourceRoot, 'knowledge', '_tree.json');
  const tree = JSON.parse(await readFile(treePath, 'utf8'));
  const frequencies = topicFrequencies(await readInterviewSourceHistory(resourceRoot));
  const byKey = new Map();
  const parentByKey = new Map();
  mapLeaves(tree, byKey, parentByKey);

  let updatedTopics = 0;
  let addedClusters = 0;
  const affectedParents = new Set();
  for (const frequency of frequencies) {
    const leaf = byKey.get(frequency.key);
    if (!leaf) throw new Error(`知识点不存在于 knowledge/_tree.json：${frequency.key}`);
    const previous = new Set(Array.isArray(leaf.interviewClusters) ? leaf.interviewClusters : []);
    const additions = frequency.clusters.filter(cluster => !previous.has(cluster));
    if (additions.length === 0) continue;
    const nextClusters = [...previous, ...additions].sort();
    leaf.interviewClusters = nextClusters;
    leaf.heat = Math.max(0, Number.isInteger(leaf.heat) ? leaf.heat : 0) + additions.length;
    leaf.currRank = rankForHeat(leaf.heat);
    updatedTopics += 1;
    addedClusters += additions.length;
    affectedParents.add(parentByKey.get(frequency.key));
  }

  if (updatedTopics > 0) {
    for (const children of affectedParents) {
      if (!children?.every(child => child?.isLeaf)) continue;
      children.sort((left, right) => (right.heat ?? 0) - (left.heat ?? 0));
    }
    await writeFile(treePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
  }
  return { updatedTopics, addedClusters };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const resourceRoot = process.argv[2] ? resolve(process.argv[2]) : resolve(fileURLToPath(new URL('..', import.meta.url)));
  console.log(JSON.stringify(await syncInterviewTopicWeights(resourceRoot)));
}
