import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDirectExecution, boundedFiles, leafPath, readBounded, safeKey } from './resource-paths.mjs';
import { publicInterviewDisclosures, validatePublicKnowledgeRelations } from './public-interview-contract.mjs';

export function leaves(nodes) {
  if (!Array.isArray(nodes)) throw new Error('目录必须是数组');
  return nodes.flatMap(node => node?.isLeaf === true ? [node] : leaves(node?.children ?? []));
}

export async function validateTree(root) {
  const errors = [], warnings = [], trees = {};
  for (const module of ['interview', 'knowledge']) {
    try {
      const tree = JSON.parse((await readBounded(root, `${module}/_tree.json`, module)).toString());
      const ls = leaves(tree), expected = new Set(), seen = new Set();
      function groups(nodes) {
        for (const node of nodes) {
          if (!node || typeof node.key !== 'string' || !node.key.trim()) errors.push(`${module} 节点缺 key`);
          try { safeKey(node?.key); } catch { errors.push(`${module} 节点 key 路径无效`); }
          if (seen.has(node.key)) errors.push(`${module} 重复 key`); seen.add(node.key);
          if (!node.isLeaf) groups(node.children ?? []);
        }
      }
      groups(tree);
      for (const leaf of ls) {
        try { const path = leafPath(module, leaf); await readBounded(root, path, module); expected.add(path); }
        catch { errors.push(`${module} 叶子路径无效、越界或正文不存在`); }
      }
      for (const path of await boundedFiles(root, module)) {
        if (!path.endsWith('.md')) continue;
        if (!expected.has(path)) warnings.push(`${module} 孤儿正文`);
        if (module === 'interview') {
          const body = (await readBounded(root, path, module)).toString();
          const disclosures = publicInterviewDisclosures(body);
          if (disclosures.has('source-heading')) errors.push('公开面经不得包含来源标题');
          if (disclosures.has('nowcoder-destination')) errors.push('公开面经不得包含牛客 URL');
        }
      }
      trees[module] = ls;
    } catch { errors.push(`${module} 目录无法安全读取`); }
  }
  if (trees.interview && trees.knowledge) errors.push(...await validatePublicKnowledgeRelations(root, trees.interview, trees.knowledge));
  return { errors, warnings, counts: Object.fromEntries(Object.entries(trees).map(([m, ls]) => [m, ls.length])) };
}

if (isDirectExecution(import.meta.url)) {
  const result = await validateTree(resolve(import.meta.dirname, '..'));
  for (const error of result.errors) console.error(error);
  console.log(JSON.stringify({ ...result, errors: result.errors.length, warnings: result.warnings.length }));
  process.exitCode = result.errors.length ? 1 : 0;
}
