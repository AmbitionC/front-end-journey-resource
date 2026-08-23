// scripts/validate-tree.mjs
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  readInterviewSourceHistory,
  validateInterviewSourceHistory,
} from './interview-source-history.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const MODULES = ['interview', 'knowledge'];
let errors = 0;
let missingFiles = 0;

function leaves(nodes) {
  return nodes.flatMap(n => (n.isLeaf ? [n] : leaves(n.children || [])));
}
function allMd(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) allMd(p, acc);
    else if (name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

for (const mod of MODULES) {
  const treePath = resolve(ROOT, mod, '_tree.json');
  if (!existsSync(treePath)) { console.error(`[${mod}] 缺少 _tree.json`); errors++; continue; }
  const tree = JSON.parse(readFileSync(treePath, 'utf8'));
  const ls = leaves(tree);

  // 规则 1:每个叶子必须有对应 .md 文件(缺失降为警告)
  const expected = new Set();
  for (const leaf of ls) {
    if (!leaf.filePath || !leaf.key) { console.error(`[${mod}] 叶子缺 filePath/key: ${JSON.stringify(leaf)}`); errors++; continue; }
    const file = resolve(ROOT, mod, leaf.filePath, `${leaf.key}.md`);
    expected.add(file);
    if (!existsSync(file)) { console.warn(`[${mod}] 缺少文件: ${mod}/${leaf.filePath}/${leaf.key}.md`); missingFiles++; }
  }

  // 规则 1.5:非叶子节点也必须有 key —— faas 的 upsertLeaf 按 parentKey 定位父节点，
  // 缺 key 的分组无法从后台挂载文章（历史上 5 个公司分组曾缺 key）。
  const groupsMissingKey = [];
  (function walkGroups(nodes) {
    for (const n of nodes) {
      if (n.isLeaf) continue;
      if (!n.key) groupsMissingKey.push(n.label || JSON.stringify(n));
      if (n.children) walkGroups(n.children);
    }
  })(tree);
  if (groupsMissingKey.length) {
    console.error(`[${mod}] 分组缺少 key: ${groupsMissingKey.join(', ')}`);
    errors++;
  }

  // 规则 2:key 在模块内唯一
  const keys = ls.map(l => l.key);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dup.length) { console.error(`[${mod}] 重复 key: ${[...new Set(dup)].join(', ')}`); errors++; }

  // 规则 3:孤儿 .md(存在文件但 manifest 没引用)仅警告
  for (const file of allMd(resolve(ROOT, mod))) {
    if (!expected.has(file)) console.warn(`[${mod}] 孤儿文件(manifest 未引用): ${file.replace(ROOT + '/', '')}`);
  }
  console.log(`[${mod}] 叶子 ${ls.length} 个,校验完成`);
}

const interviewHistory = await readInterviewSourceHistory(ROOT);
const interviewHistoryErrors = await validateInterviewSourceHistory(ROOT, interviewHistory);
for (const error of interviewHistoryErrors) {
  console.error(`[interview-history] ${error}`);
  errors++;
}
console.log(`[interview-history] 来源记录 ${Object.keys(interviewHistory.records ?? {}).length} 条,校验完成`);

if (errors > 0) { console.error(`\n校验失败:${errors} 个错误`); process.exit(1); }
if (missingFiles > 0) {
  console.log(`\n校验通过(警告:缺 ${missingFiles} 个待写文件)`);
} else {
  console.log('\n校验通过');
}
process.exit(0);
