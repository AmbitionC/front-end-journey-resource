import { writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readInterviewSourceHistory, topicFrequencies, activeFrequencySources, isCanonicalNowcoderUrl } from './interview-source-history.mjs';
import { validatePrivateInterviewHistory } from './validate-private-interview-history.mjs';
import { isDirectExecution, leafPath, readBounded, safeKey } from './resource-paths.mjs';
import { readPrivatePinned, sha256, normalizedOriginal } from './content-review.mjs';
import { leaves } from './validate-tree.mjs';
import { questionStructure } from './public-interview-contract.mjs';

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
  const review = options.privacyMode
    ? JSON.parse((await readPrivatePinned(resourceRoot, { path: options.reviewPath, sha256: options.reviewSha256 })).bytes)
    : null;
  const originalHistory = options.privacyMode
    ? JSON.parse((await readPrivatePinned(resourceRoot, review.history)).bytes)
    : await readInterviewSourceHistory(resourceRoot, options.historyPath);
  const reviewedSources = new Set((review?.sourceEvidence ?? [])
    .filter(source => review.articleKeys.includes(source.articleKey))
    .map(source => `${source.sourceId}\0${source.articleKey}`));
  const history = options.privacyMode ? {
    ...originalHistory,
    records: Object.fromEntries(Object.entries(originalHistory.records).map(([id, record]) => [
      id, record.status === 'prepared' && reviewedSources.has(`${id}\0${record.articleKey}`)
        ? { ...record, status: 'published' } : record,
    ])),
  } : originalHistory;
  return applyInterviewTopicWeights(resourceRoot, history, options);
}

// A processing draft never reads or manufactures an approval. The exact pairs
// are projected only in memory; final sync still runs the full review validator.
export async function prepareInterviewTopicWeights(resourceRoot, options = {}) {
  const originalHistory = JSON.parse((await readPrivatePinned(resourceRoot, options.history)).bytes);
  if (originalHistory?.schemaVersion !== 1 || !originalHistory.records || typeof originalHistory.records !== 'object' || Array.isArray(originalHistory.records)) throw new Error('私有来源历史格式无效');
  if (!Array.isArray(options.keys) || !options.keys.length || new Set(options.keys).size !== options.keys.length) throw new Error('准备热度必须限定非空唯一知识 key');
  const knowledge = leaves(JSON.parse((await readBounded(resourceRoot, 'knowledge/_tree.json', 'knowledge')).toString()));
  const knownKeys = new Set(knowledge.map(leaf => leaf.key));
  for (const key of options.keys) {
    safeKey(key);
    if (!knownKeys.has(key)) throw new Error('准备热度的知识 key 不存在');
  }
  if (!Array.isArray(options.sources) || !options.sources.length) throw new Error('准备热度必须显式指定非空来源/面经对');
  const interviews = new Map(leaves(JSON.parse((await readBounded(resourceRoot, 'interview/_tree.json', 'interview')).toString())).map(leaf => [leaf.key, leaf]));
  const selected = new Set();
  for (const pair of options.sources) {
    if (!pair || !/^[a-f0-9]{12}$/u.test(pair.sourceId ?? '')) throw new Error('准备热度的来源 ID 无效');
    safeKey(pair.articleKey);
    const identity = `${pair.sourceId}\0${pair.articleKey}`, record = originalHistory.records[pair.sourceId];
    if (selected.has(identity)) throw new Error('准备热度的来源/面经对重复');
    if (record?.status !== 'prepared' || record.articleKey !== pair.articleKey || !interviews.has(pair.articleKey)) throw new Error('准备热度只接受匹配现有目录的 prepared 来源/面经对');
    if (!isCanonicalNowcoderUrl(record.url) || !['A', 'B', 'B-partial'].includes(record.evidenceGrade)
        || typeof record.processUnitId !== 'string' || !record.processUnitId.trim()) throw new Error('准备热度缺规范来源与独立过程证据');
    const path = leafPath('interview', interviews.get(pair.articleKey));
    if (!Array.isArray(record.publicFiles) || !record.publicFiles.includes(path)) throw new Error('准备来源的公开文件与面经目录不一致');
    for (const file of record.publicFiles) await readBounded(resourceRoot, file, 'interview');
    const structure = questionStructure((await readBounded(resourceRoot, path, 'interview')).toString());
    if (!structure.questions.length || structure.activeStyles || structure.duplicateAttributes
        || structure.questions.some(question => !question.valid || question.key !== null
          && (question.bindingStatus !== null && question.bindingStatus !== 'bound' || question.pendingNotice || question.missingKeywordNotice))) throw new Error('准备来源的问题绑定结构无效');
    const bound = [...new Set(structure.questions.filter(question => question.key !== null).map(question => question.key))].sort();
    if (!Array.isArray(record.knowledgeKeys) || new Set(record.knowledgeKeys).size !== record.knowledgeKeys.length
        || record.knowledgeKeys.some(key => !knownKeys.has(key))
        || JSON.stringify([...record.knowledgeKeys].sort()) !== JSON.stringify(bound)) throw new Error('准备来源的计热 key 必须等于实际已绑定问题；待核实题不得计热');
    selected.add(identity);
  }
  const history = { ...originalHistory, records: Object.fromEntries(Object.entries(originalHistory.records).map(([id, record]) => [
    id, selected.has(`${id}\0${record?.articleKey}`) ? { ...record, status: 'published' } : record,
  ])) };
  if (options.sourceEvidence !== undefined && !Array.isArray(options.sourceEvidence)) throw new Error('冻结来源证据必须是显式数组');
  const descriptors = new Map();
  for (const source of options.sourceEvidence ?? []) {
    const identity = `${source?.sourceId}\0${source?.articleKey}`;
    if (descriptors.has(identity)) throw new Error('冻结来源证据重复');
    descriptors.set(identity, source);
  }
  const contributors = new Set(activeFrequencySources(history));
  for (const [id, record] of Object.entries(history.records)) {
    if (!contributors.has(record)) continue;
    if (!/^[a-f0-9]{64}$/u.test(record.normalizedBodySha256 ?? '')) throw new Error('计热来源缺实际原文指纹');
    const source = record.originalBodyEvidenceFile !== undefined || record.originalBodySha256 !== undefined
      ? { path: record.originalBodyEvidenceFile, sha256: record.originalBodySha256, documentJson: record.originalBodyDocumentJson, canonicalUrl: record.url, processUnitId: record.processUnitId }
      : descriptors.get(`${id}\0${record.articleKey}`);
    if (!source || source.canonicalUrl !== record.url || source.processUnitId !== record.processUnitId) throw new Error('计热来源缺显式冻结原文证据');
    const frozen = await readPrivatePinned(resourceRoot, source);
    const capture = source.documentJson ? JSON.parse(frozen.bytes).document : null;
    if (source.documentJson && (!capture || (capture.canonicalUrl || capture.url) !== record.url)) throw new Error('冻结原文 URL 与来源不一致');
    const body = capture ? capture.text : frozen.bytes.toString();
    if (typeof body !== 'string' || !body.trim() || sha256(normalizedOriginal(body)) !== record.normalizedBodySha256) throw new Error('计热来源指纹未由实际冻结原文复算确认');
  }
  return { stage: 'processing', status: 'needs_review', ...await applyInterviewTopicWeights(resourceRoot, history, { privacyMode: true, keys: options.keys }) };
}

async function applyInterviewTopicWeights(resourceRoot, history, options) {
  const treePath = resolve(resourceRoot, 'knowledge', '_tree.json');
  const tree = JSON.parse((await readBounded(resourceRoot,'knowledge/_tree.json','knowledge')).toString());
  const interviewTree = JSON.parse((await readBounded(resourceRoot,'interview/_tree.json','interview')).toString());
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
  let treeOrderChanged = false;
  const affectedParents = new Set();
  const articleWrites = [];
  const keys = new Set([
    ...frequencyByKey.keys(),
    ...[...byKey.values()]
      .filter(leaf => Array.isArray(leaf.interviewClusters) || Number.isInteger(leaf.interviewBaseHeat) || Number.isInteger(leaf.interviewCount))
      .map(leaf => leaf.key),
  ]);

  for (const key of keys) {
    if (options.privacyMode && !options.keys.includes(key)) continue;
    const leaf = byKey.get(key);
    if (!leaf) throw new Error(`知识点不存在于 knowledge/_tree.json：${key}`);
    affectedParents.add(parentByKey.get(key));
    const priorCount = leaf.interviewCount ?? (leaf.interviewClusters?.length ?? 0);
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
      : Math.max(0, (Number.isInteger(leaf.heat) ? leaf.heat : 0)
        - (Number.isInteger(leaf.interviewCount) ? leaf.interviewCount : previous.length));
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
    }

    if (desired.length === 0 && previous.length === 0 && priorCount === 0) continue;
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
      articleWrites.push({ path: knowledgeFile, contents: next });
      updatedArticles += 1;
    }
  }

  for (const children of affectedParents) {
    if (!children) continue;
    // Stable sorting only leaf slots keeps categories in their original place.
    const sorted = children.filter(child => child?.isLeaf)
      .sort((left, right) => (right.heat ?? 0) - (left.heat ?? 0));
    let index = 0;
    for (let slot = 0; slot < children.length; slot += 1) {
      if (!children[slot]?.isLeaf) continue;
      if (children[slot] !== sorted[index]) treeOrderChanged = true;
      children[slot] = sorted[index++];
    }
  }
  for (const file of articleWrites) await writeFile(file.path, file.contents, 'utf8');
  if (updatedTopics > 0 || treeOrderChanged) {
    await writeFile(treePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
  }
  return { updatedTopics, addedClusters, removedClusters, updatedArticles, treeOrderChanged };
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
    if (process.argv.includes('--prepare')) {
      const historyShaAt = process.argv.indexOf('--history-sha'), sourcesAt = process.argv.indexOf('--sources'), sourcesShaAt = process.argv.indexOf('--sources-sha');
      const sourceInput = JSON.parse((await readPrivatePinned(resourceRoot, { path: sourcesAt < 0 ? undefined : process.argv[sourcesAt + 1], sha256: sourcesShaAt < 0 ? undefined : process.argv[sourcesShaAt + 1] })).bytes);
      console.log(JSON.stringify(await prepareInterviewTopicWeights(resourceRoot, {
        history: { path: process.argv[historyAt + 1], sha256: historyShaAt < 0 ? undefined : process.argv[historyShaAt + 1] },
        sources: Array.isArray(sourceInput) ? sourceInput : sourceInput.sources, sourceEvidence: sourceInput.sourceEvidence,
        keys: (process.argv[keysAt + 1] ?? '').split(',').filter(Boolean),
      })));
    } else console.log(JSON.stringify(await syncInterviewTopicWeights(resourceRoot, {
      privacyMode: true, historyPath: process.argv[historyAt + 1],
      reviewPath:reviewAt>=0?process.argv[reviewAt+1]:undefined,
      reviewSha256:pinAt>=0?process.argv[pinAt+1]:undefined,
      keys: (process.argv[keysAt + 1] ?? '').split(',').filter(Boolean),
    })));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
