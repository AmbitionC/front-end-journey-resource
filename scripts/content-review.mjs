import { readFile, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { boundedFiles, readBounded, safeRelativePath, leafPath } from './resource-paths.mjs';
import { validateTree, leaves } from './validate-tree.mjs';
import { isCanonicalNowcoderUrl, verifiedHistoricalFingerprint, normalizedSourceBody } from './interview-source-history.mjs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const normalizedOriginal = normalizedSourceBody;

export function gitPublicationFiles(root, commit) {
  if (!/^[a-f0-9]{40}$/u.test(commit ?? '')) throw new Error('审核基线必须是完整 commit SHA');
  const type = spawnSync('git', ['cat-file','-t',commit], {cwd:root,encoding:'utf8'});
  if (type.status !== 0 || type.stdout.trim() !== 'commit') throw new Error('审核 commit 不可读');
  const list = spawnSync('git', ['ls-tree','-rz',commit,'--','interview','knowledge','images','class','.codex/image-resync.txt'], {cwd:root,encoding:'utf8'});
  if (list.status !== 0) throw new Error('审核基线资源不可读');
  const files = [];
  for (const line of list.stdout.split('\0').filter(Boolean)) {
    const [metadata,path] = line.split('\t'), [mode,kind,oid] = metadata.split(' ');
    safeRelativePath(path);
    if (mode !== '100644' && mode !== '100755' || kind !== 'blob') throw new Error('审核基线包含非普通资源');
    const blob = spawnSync('git',['cat-file','blob',oid],{cwd:root,maxBuffer:64*1024*1024});
    if (blob.status !== 0) throw new Error('审核基线文件不可读');
    files.push({path,sha256:sha256(blob.stdout)});
  }
  return files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
}

export function changedPublicationPaths(before, after) {
  const a = new Map(before.map(x=>[x.path,x.sha256])), b = new Map(after.map(x=>[x.path,x.sha256]));
  return [...new Set([...a.keys(),...b.keys()])].filter(path=>a.get(path)!==b.get(path)).sort();
}

export async function publicInventory(root) {
  const files = [];
  for (const module of ['interview', 'knowledge', 'images', 'class']) {
    try { await lstat(resolve(root, module)); }
    catch (error) { if (error.code === 'ENOENT' && ['images','class'].includes(module)) continue; throw error; }
    for (const path of await boundedFiles(root, module)) files.push({ path, sha256: sha256(await readBounded(root, path, module)) });
  }
  try {
    const bytes = await readBounded(root,'.codex/image-resync.txt');
    files.push({path:'.codex/image-resync.txt',sha256:sha256(bytes)});
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return { files, digest: sha256(JSON.stringify(files)) };
}

export async function readPrivatePinned(root, descriptor) {
  if (!descriptor || !isAbsolute(descriptor.path ?? '') || !/^[a-f0-9]{64}$/u.test(descriptor.sha256 ?? '')) throw new Error('仓外审核输入缺少绝对路径及固定 SHA-256');
  const base = await realpath(root), file = await realpath(descriptor.path), location = relative(base, file);
  if (location !== '..' && !location.startsWith(`..${sep}`) && !isAbsolute(location)) throw new Error('私有审核输入必须位于公开仓库外');
  const bytes = await readFile(file);
  if (sha256(bytes) !== descriptor.sha256) throw new Error('审核回执或冻结输入指纹不一致');
  return { bytes, file };
}

// The pin is supplied by the reviewer outside the editable ledger. Local
// hashes establish binding, not reviewer identity; CI additionally requires
// an authenticated independent OWNER/COLLABORATOR review tied to this
// publication digest and the immutable private receipt pointer.
export async function validateContentReview(root, historyPath, reviewPath, reviewSha256) {
  const errors = [];
  try {
    const review = JSON.parse((await readPrivatePinned(root, {path:reviewPath, sha256:reviewSha256})).bytes);
    if (review.schemaVersion !== 1 || review.kind !== 'resource-content-review' || review.decision !== 'approved') throw new Error('缺少独立内容审核通过回执');
    const checkedHistory = await readPrivatePinned(root, review.history);
    if (await realpath(historyPath) !== checkedHistory.file) throw new Error('审核与发布使用的私账不一致');
    const history = JSON.parse(checkedHistory.bytes);
    const snapshot = await publicInventory(root);
    if (review.publicationDigest !== snapshot.digest || JSON.stringify(review.publicFiles) !== JSON.stringify(snapshot.files)) throw new Error('面经、知识、速读目录或图片与最终审核版本不一致');
    const baselineFiles=gitPublicationFiles(root,review.baseCommit);
    const changed = changedPublicationPaths(baselineFiles,snapshot.files);
    if(review.deletedPublicPaths!==undefined && (!Array.isArray(review.deletedPublicPaths)
        || new Set(review.deletedPublicPaths).size!==review.deletedPublicPaths.length)) throw new Error('审核删除范围无效');
    for(const path of review.deletedPublicPaths??[]) {
      safeRelativePath(path);
      if(snapshot.files.some(file=>file.path===path) || !baselineFiles.some(file=>file.path===path)) throw new Error('删除说明必须对应真正删除的基线文件，不能把保留正文伪装为删除或孤儿');
    }
    if (JSON.stringify(review.coveredPaths) !== JSON.stringify(changed)) throw new Error('独立审核未覆盖真实内容增量范围');
    const independent = JSON.parse((await readPrivatePinned(root, review.independentReview)).bytes);
    if (independent.decision !== 'approved' && !/^PASS_BOUNDED_LOCAL_CONTENT_WITH_/u.test(independent.status ?? '')) throw new Error('独立审查未通过');
    if (!Array.isArray(review.articleKeys) || new Set(review.articleKeys).size !== review.articleKeys.length || !Array.isArray(review.sourceEvidence)) throw new Error('审核批次范围不完整');
    const tree = leaves(JSON.parse((await readBounded(root, 'interview/_tree.json', 'interview')).toString()));
    const byKey = new Map(tree.map(n=>[n.key,n]));
    const baselineTree=spawnSync('git',['show',`${review.baseCommit}:interview/_tree.json`],{cwd:root,encoding:'utf8'});
    if(baselineTree.status!==0) throw new Error('审核基线面经目录不可读');
    const previousLeaves=new Map(leaves(JSON.parse(baselineTree.stdout)).map(n=>[n.key,n]));
    for(const leaf of tree) {
      const previous=previousLeaves.get(leaf.key);
      if((!previous || previous.filePath!==leaf.filePath) && !review.articleKeys.includes(leaf.key)) throw new Error('新增或迁移面经目录叶子缺本批原文审核');
    }
    for (const path of changed.filter(p=>p.startsWith('interview/') && p.endsWith('.md'))) {
      const leaf = tree.find(n=>`interview/${n.filePath}/${n.key}.md`===path);
      if (leaf && !review.articleKeys.includes(leaf.key)) throw new Error('变更面经被排除在本批原文审核之外');
      if (!leaf && !review.deletedPublicPaths?.includes(path)) throw new Error('删除或孤儿面经缺审核说明');
    }
    // A removed historical record cannot make a known public page disappear
    // from duplicate checks. This inspects provenance, not article rewriting.
    for (const key of previousLeaves.keys()) {
      if (review.articleKeys.includes(key)) continue;
      if (!byKey.has(key)) {
        const path=leafPath('interview',previousLeaves.get(key));
        if(snapshot.files.some(file=>file.path===path) || !review.deletedPublicPaths?.includes(path)) throw new Error('既有面经目录删除缺正文删除及明确独立审核；不能留下孤儿绕过去重');
      }
      if (!Object.values(history.records ?? {}).some(record => record.articleKey===key
          && ['prepared','published','merged'].includes(record.status))) throw new Error('既有公开面经缺历史来源覆盖，不能证明去重完整');
    }
    const historical=[];
    for(const record of Object.values(history.records??{})) {
      if(!review.articleKeys.includes(record.articleKey) && (byKey.has(record.articleKey) || previousLeaves.has(record.articleKey))
          && ['prepared','published','merged'].includes(record.status)) {
        historical.push({record,fingerprint:await verifiedHistoricalFingerprint(root,record)});
      }
    }
    const seenOriginals = new Map(), evidenceBySource = new Map();
    for (const source of review.sourceEvidence) {
      const frozen = await readPrivatePinned(root, source);
      const capture = source.documentJson ? JSON.parse(frozen.bytes).document : null;
      if (capture && (capture.canonicalUrl || capture.url)!==source.canonicalUrl) throw new Error('冻结采集文件 URL 与审核来源不一致');
      const document = capture ? capture.text : frozen.bytes.toString();
      if (typeof document !== 'string' || !document.trim()) throw new Error('冻结原文正文缺失');
      if (typeof source.processUnitId !== 'string' || !source.processUnitId.trim()) throw new Error('原始来源缺独立流程标识');
      const fingerprint = sha256(normalizedOriginal(document));
      const previous = seenOriginals.get(fingerprint);
      if (previous && previous.articleKey !== source.articleKey) throw new Error('跨 URL 同原文不得重复公开建页');
      if (previous && previous.processUnitId !== source.processUnitId) throw new Error('同内容不得增加独立过程频次');
      const existing=historical.find(item=>item.fingerprint===fingerprint && item.record.articleKey!==source.articleKey);
      if(existing) throw new Error('跨批同原文已存在公开页，必须复用已有 key');
      if (!source.sourceId || evidenceBySource.has(source.sourceId)) throw new Error('来源证据重复或缺失');
      seenOriginals.set(fingerprint, source); evidenceBySource.set(source.sourceId, { ...source, document, fingerprint });
      const previousPage = Object.values(history.records ?? {}).find(r=>r.processUnitId===source.processUnitId
        && (byKey.has(r.articleKey) || previousLeaves.has(r.articleKey)) && r.articleKey!==source.articleKey && ['prepared','published','merged'].includes(r.status));
      if (previousPage && !review.distinctRoundPairs?.some(pair=>pair.includes(previousPage.articleKey)&&pair.includes(source.articleKey))) throw new Error('既有流程必须复用已有 key；独立轮次例外须有已审证据');
    }
    for (const key of review.articleKeys) {
      if (!byKey.has(key)) throw new Error('已审面经不在公开目录');
      const records = Object.values(history.records ?? {}).filter(r => r.articleKey === key && ['prepared','published','merged'].includes(r.status));
      if (!records.length) throw new Error('已审面经缺来源记录');
      for (const record of records) {
        if (!isCanonicalNowcoderUrl(record.url)) throw new Error('本批原帖 URL 不规范');
        const source = [...evidenceBySource.values()].find(s=>s.articleKey===key && s.canonicalUrl===record.url);
        if (!source || source.processUnitId !== record.processUnitId) throw new Error('来源/过程与独立审核证据不一致');
        if (record.normalizedBodySha256 !== source.fingerprint) throw new Error('私账指纹必须来自实际冻结原文，不接受可编辑摘要代替');
        if (!['A','B'].includes(record.evidenceGrade)) throw new Error('本批来源未达到 A/B 审核门槛');
      }
    }
    // A final review must carry the exact question/category ledger. It records
    // intentional unbound groups, never guesses masked words or missing specs.
    const ledger = JSON.parse((await readPrivatePinned(root, review.questionLedger)).bytes);
    const { questionStructure } = await import('./public-interview-contract.mjs');
    for (const key of review.articleKeys) {
      const row = ledger.rows?.find(r=>r.articleKey===key);
      if (!row) throw new Error('本批面经缺逐题审核映射');
      const leaf = byKey.get(key), path = `interview/${leaf.filePath}/${leaf.key}.md`;
      const actual = questionStructure((await readBounded(root, path, 'interview')).toString()).questions;
      if(!Array.isArray(row.questions) || row.questions.length===0 || actual.length===0) throw new Error('本批来源面经必须含非空真实问题映射');
      if (actual.length !== row.questions.length) throw new Error('可见问题组数与审核映射不一致');
      for (let i=0; i<actual.length; i++) {
        const expected = row.questions[i], source = evidenceBySource.get(expected.sourceId);
        if (!source || source.articleKey!==key || !Array.isArray(expected.sourceSpan) || expected.sourceSpan.length !== 2
            || !expected.sourceSpan.every(Number.isInteger) || expected.sourceSpan[0] < 0
            || expected.sourceSpan[1] <= expected.sourceSpan[0]
            || expected.sourceSpan[1] > Array.from(source.document).length) throw new Error('原题坐标或冻结来源缺失');
        const [start,end] = expected.sourceSpan;
        if (Array.from(source.document).slice(start,end).join('') !== expected.sourceLiteral) throw new Error('原文 codepoint 坐标不匹配');
        if (actual[i].key !== expected.knowledgeKey || actual[i].summary !== `（${i+1}）${expected.publicQuestion}`
            || actual[i].answer.trim() !== expected.teachingAnswer) throw new Error('实际问题、短答或知识关联与审核映射不一致');
        if (expected.knowledgeKey === null && expected.bindingStatus !== 'pending_missing_keyword') throw new Error('未绑定问题缺少明确待补原因');
        if (expected.knowledgeKey !== null && expected.bindingStatus !== 'bound') throw new Error('已绑定问题缺少明确绑定状态');
      }
      for (const [sourceId, record] of Object.entries(history.records ?? {}).filter(([,record])=>record.articleKey===key
          && ['prepared','published','merged'].includes(record.status))) {
        const boundKeys=[...new Set(row.questions.filter(q=>q.sourceId===sourceId && q.bindingStatus==='bound'
          && typeof q.knowledgeKey==='string').map(q=>q.knowledgeKey))].sort();
        if (JSON.stringify([...(record.knowledgeKeys ?? [])].sort())!==JSON.stringify(boundKeys)) throw new Error('计热知识 key 必须与已审逐题绑定一致；待补题不得计热');
      }
    }
    errors.push(...(await validateTree(root)).errors);
  } catch (error) { errors.push(error.message); }
  return errors;
}
