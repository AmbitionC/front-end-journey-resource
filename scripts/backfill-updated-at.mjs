// scripts/backfill-updated-at.mjs
//
// 为 interview/knowledge 的每个叶子写入 updatedAt（该文章最近一次提交的日期）。
// 站点据此在导航树/索引上打「NEW」标记：只标最近的若干篇，新的进来就把旧的挤掉。
//
// 数据来源是**真实 git 历史**（`git log -1 --format=%aI -- <file>`），不臆造日期。
// 文件不在版本库中（尚未提交）时跳过该叶子，不写入字段。
//
// 之后的新增/更新由 curate-interview-posts / generate-knowledge-docs 两个 skill
// 在改动文章时顺手写入当天日期；本脚本用于存量回填，可安全重跑。
//
// 用法：node scripts/backfill-updated-at.mjs [--write]   （缺省仅预览）

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WRITE = process.argv.includes('--write');
const MODULES = ['interview', 'knowledge'];

/** 该文件最近一次提交的日期（YYYY-MM-DD）；未入库返回 undefined。 */
function lastCommitDate(relativePath) {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%aI', '--', relativePath], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    return iso ? iso.slice(0, 10) : undefined;
  } catch {
    return undefined;
  }
}

for (const module of MODULES) {
  const treePath = resolve(ROOT, module, '_tree.json');
  if (!existsSync(treePath)) continue;
  const tree = JSON.parse(readFileSync(treePath, 'utf8'));
  let filled = 0;
  let skipped = 0;

  (function walk(nodes) {
    for (const node of nodes) {
      if (node.isLeaf) {
        const relativePath = `${module}/${node.filePath ? `${node.filePath}/` : ''}${node.key}.md`;
        const date = existsSync(resolve(ROOT, relativePath))
          ? lastCommitDate(relativePath)
          : undefined;
        if (date) {
          node.updatedAt = date;
          filled += 1;
        } else {
          skipped += 1;
        }
      } else if (Array.isArray(node.children)) {
        walk(node.children);
      }
    }
  })(tree);

  const dates = [];
  (function collect(nodes) {
    for (const node of nodes) {
      if (node.isLeaf && node.updatedAt) dates.push(node.updatedAt);
      else if (node.children) collect(node.children);
    }
  })(tree);
  dates.sort();

  console.log(
    `[${module}] 回填 ${filled} 个叶子（跳过 ${skipped} 个未入库）` +
      (dates.length ? `，最早 ${dates[0]}，最新 ${dates[dates.length - 1]}` : ''),
  );
  if (WRITE) {
    writeFileSync(treePath, `${JSON.stringify(tree, null, 2)}\n`);
    console.log(`[${module}] 已写回 ${module}/_tree.json`);
  }
}

if (!WRITE) console.log('（预览模式，未写盘；加 --write 落盘）');
