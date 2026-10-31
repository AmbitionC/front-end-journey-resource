import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath, lstat, open, rename, rm } from 'node:fs/promises';
import { resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import { isDirectExecution, leafPath, readBounded } from './resource-paths.mjs';
import { leaves } from './validate-tree.mjs';
import { createImmutableGitReader } from './git-immutable.mjs';

export const KNOWLEDGE_SKILL_PATH = '.codex/skills/generate-knowledge-docs/SKILL.md';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const teachingBody = text => text.replace(/^## 出现于（热度来源）[^\n]*\n[\s\S]*?(?=^## |$(?![\s\S]))/gmu, '').trim();

async function readKnowledgeSkill(root) {
  // The public asset path validator intentionally forbids dot-directories.
  // Read only this fixed skill path, checking every ancestor for symlinks.
  let path = await realpath(root);
  for (const part of KNOWLEDGE_SKILL_PATH.split('/')) {
    path = resolve(path, part);
    if ((await lstat(path)).isSymbolicLink()) throw new Error('技能执行证据的实际 skill 不得使用符号链接');
  }
  if (!(await lstat(path)).isFile()) throw new Error('实际知识 skill 必须是普通文件');
  return readFile(path);
}

// Preparation is deliberately read-only. Only an actual agent skill run and
// its independent reviewer can supply execution and quality evidence.
export async function prepareInterviewKnowledgeProcessing(root, keys) {
  if (!Array.isArray(keys) || !keys.length || keys.some(key => !nonempty(key))) throw new Error('必须限定本批知识 key');
  const skill = { name: 'generate-knowledge-docs', path: KNOWLEDGE_SKILL_PATH, sha256: hash(await readKnowledgeSkill(root)) };
  const tree = leaves(JSON.parse((await readBounded(root, 'knowledge/_tree.json', 'knowledge')).toString()));
  const inventory = [];
  for (const leaf of tree) {
    const path = leafPath('knowledge', leaf);
    inventory.push({ key: leaf.key, label: leaf.label, path, sha256: hash(await readBounded(root, path, 'knowledge')) });
  }
  const targets = keys.map(key => {
    const item = inventory.find(row => row.key === key);
    if (!item) throw new Error(`知识 key 不在本批目录：${key}`);
    return item;
  });
  return { schemaVersion: 1, kind: 'interview-knowledge-processing-plan', stage: 'processing', status: 'needs_execution', skill, targets, inventory };
}

async function writePrivatePacket(root, packet, requested) {
  if (!isAbsolute(requested ?? '')) throw new Error('准备输出必须指定仓库外绝对路径');
  const base = await realpath(root), parent = await realpath(dirname(requested)), target = resolve(parent, basename(requested));
  const location = relative(base, target);
  if (location !== '..' && !location.startsWith(`..${sep}`) && !isAbsolute(location)) throw new Error('准备输出必须位于公开仓库外');
  try {
    const existing = await lstat(target);
    if (existing.isSymbolicLink() || !existing.isFile()) throw new Error('准备输出必须是普通文件，不得使用符号链接');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const bytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`);
  const temporary = resolve(parent, `.knowledge-packet-${randomUUID()}.tmp`);
  try {
    const handle = await open(temporary, 'wx', 0o600);
    try { await handle.chmod(0o600); await handle.writeFile(bytes); }
    finally { await handle.close(); }
    await rename(temporary, target);
  } finally { await rm(temporary, { force: true }); }
  return { stage: packet.stage, status: packet.status, targetCount: packet.targets.length, inventoryCount: packet.inventory.length, path: requested, sha256: hash(bytes) };
}

export async function requireKnowledgeAssociation(root, { question, articleKey, questionIndex, snapshot, baselineFiles, baseCommit, knowledgeLeaves, quality, gitReader = createImmutableGitReader(root) }) {
  const { readPrivatePinned } = await import('./content-review.mjs');
  const association = question.knowledgeAssociation;
  if (!association || !['reuse', 'update', 'create'].includes(association.action)
      || !nonempty(association.rationale) || !nonempty(association.searchQuery) || !Array.isArray(association.candidates)) throw new Error('每个已绑定问题必须有逐题语义检索与知识关联证据');
  const leaf = knowledgeLeaves.find(node => node.key === question.knowledgeKey);
  if (!leaf) throw new Error('知识关联证据指向不存在的知识 key');
  const path = leafPath('knowledge', leaf), output = snapshot.files.find(file => file.path === path);
  const baseline = baselineFiles.find(file => file.path === path);
  if (association.action === 'create' && baseline) throw new Error('已有相近知识必须复用，不能声明创建已有 key');
  if (association.action !== 'create' && !baseline) throw new Error('新知识必须记录 create 并明确零面经基线');
  if (!baseline && leaf.interviewBaseHeat !== 0) throw new Error('新面经知识必须显式 interviewBaseHeat=0，避免首次来源双计');
  if (association.action === 'reuse') {
    const before = gitReader.readFile(baseCommit, path).toString();
    if (teachingBody(before) !== teachingBody((await readBounded(root, path, 'knowledge')).toString())) throw new Error('reuse 知识正文变化必须改为 update 并审查新角度');
  }
  const existingArticles = baselineFiles.filter(file => file.path.startsWith('knowledge/') && file.path.endsWith('.md'));
  if (existingArticles.length && !association.candidates.length) throw new Error('知识关联证据缺实际已读相近候选');
  for (const candidate of association.candidates) {
    const candidateLeaf = knowledgeLeaves.find(node => node.key === candidate.key);
    const candidatePath = candidateLeaf ? leafPath('knowledge', candidateLeaf) : null;
    if (!candidatePath || !baselineFiles.some(file => file.path === candidatePath && file.sha256 === candidate.sha256)) throw new Error('语义候选证据必须绑定实际基线知识正文');
  }
  if (association.action !== 'create' && !association.candidates.some(candidate => candidate.key === question.knowledgeKey)) throw new Error('复用知识必须包含已读命中候选');
  if (!association.skillExecution) throw new Error('缺少实际 generate-knowledge-docs 技能执行证据');
  const execution = JSON.parse((await readPrivatePinned(root, association.skillExecution)).bytes);
  const skillSha = hash(await readKnowledgeSkill(root));
  if (execution.schemaVersion !== 1 || execution.kind !== 'knowledge-skill-execution' || execution.status !== 'completed'
      || execution.stage !== 'processing' || execution.skill?.name !== 'generate-knowledge-docs'
      || execution.skill?.path !== KNOWLEDGE_SKILL_PATH || execution.skill?.sha256 !== skillSha
      || execution.sourceId !== question.sourceId || execution.articleKey !== articleKey
      || execution.knowledgeKey !== question.knowledgeKey || execution.action !== association.action
      || execution.output?.path !== path || execution.output?.sha256 !== output?.sha256) throw new Error('技能执行证据未绑定本题、处理阶段、实际 skill 或最终知识正文');
  if (!(await readPrivatePinned(root, execution.trace)).bytes.toString().trim()) throw new Error('技能执行证据缺实际运行记录');
  const row = quality?.questions?.find(item => item.articleKey === articleKey && item.sourceId === question.sourceId
    && item.questionIndex === questionIndex && item.knowledgeKey === question.knowledgeKey);
  if (!row || row.decision !== 'approved' || row.skillExecutionSha256 !== association.skillExecution.sha256
      || !nonempty(row.rationale) || !['accuracy', 'pedagogy', 'sources', 'semanticReuse'].every(check => row[check] === true)) throw new Error('逐题知识质量审核缺失、未通过或未绑定实际技能执行');
}

if (isDirectExecution(import.meta.url)) {
  try {
    const keysAt = process.argv.indexOf('--keys');
    const root = resolve(process.argv[2] ?? '.'), outAt = process.argv.indexOf('--out');
    const packet = await prepareInterviewKnowledgeProcessing(root, keysAt < 0 ? [] : process.argv[keysAt + 1]?.split(',').filter(Boolean));
    console.log(JSON.stringify(outAt < 0 ? packet : await writePrivatePacket(root, packet, process.argv[outAt + 1]), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
