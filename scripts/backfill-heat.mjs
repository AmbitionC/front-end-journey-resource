// scripts/backfill-heat.mjs
//
// 存量知识点热度回填：为 knowledge/_tree.json 的每个叶子写入 heat（复现权重基线）
// 与 currRank（0~5 火苗展示），并把「全叶子」的兄弟列表按 heat 降序稳定重排，
// 使目录树/索引从热点→冷门。
//
// heat 基线用「面试高频度」启发式：按考点关键词分档（核心高频→次高频→专项→其它），
// 匹配叶子的 label + filePath + tags。这只是可复现的起点；真实复现数据由
// curate-interview-posts / generate-knowledge-docs 在归档新面经时增量维护
//（见 .codex/skills/curate-interview-posts/references/dedup-and-heat.md）。
//
// 幂等：每次运行都按启发式重算 heat/currRank 并重排，可安全重跑。
// 用法：node scripts/backfill-heat.mjs [--write]   （缺省仅预览，不落盘）

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WRITE = process.argv.includes('--write');

// 关键词分档 → heat 基线。命中多档时取最高档。
const TIERS = [
  {
    heat: 10, // 核心高频：几乎每场前端面试都问
    kw: [
      '闭包', '原型', 'this', '作用域', '事件循环', 'event loop', 'promise', 'async', 'await',
      '防抖', '节流', '深拷贝', '浅拷贝', '拷贝', '跨域', 'cors', 'http', 'https', '缓存', 'cache',
      'tcp', '握手', '浏览器', '渲染', '重排', '重绘', 'reflow', 'repaint', '垃圾回收', 'gc',
      '事件', '冒泡', '委托', 'vue', 'react', 'diff', '虚拟 dom', 'virtual dom', 'vdom', 'hooks',
      '响应式', '生命周期', 'webpack', '手写', '盒模型', 'flex', '居中', 'bfc', '继承',
      '数据类型', '类型转换', 'es6', 'typescript', 'ts ',
    ],
  },
  {
    heat: 6, // 次高频：常见但非必问
    kw: [
      '模块化', 'commonjs', 'esm', '状态管理', 'redux', 'vuex', 'pinia', '路由', 'router',
      '性能优化', '性能', '首屏', '懒加载', 'lazy', 'dom', 'ajax', 'fetch', 'xhr',
      'cookie', 'storage', 'localstorage', 'sessionstorage', '同源', 'jwt', '鉴权', '登录',
      'oauth', 'websocket', '设计模式', '算法', '排序', '二叉树', '链表', '动态规划', '递归',
      '上传', '下载', '断点', '微前端', 'ssr', '服务端渲染', 'node', '中间件', 'koa', 'express',
      'css', 'grid', 'position', '选择器', 'flex 布局', '布局', 'agent', 'llm', 'rag', 'mcp', 'skill',
    ],
  },
  {
    heat: 3, // 专项/框架内部：进阶或特定方向
    kw: [
      'fiber', '调度', 'scheduler', '编译', 'ast', 'babel', 'tree shaking', 'vite', 'rollup',
      'esbuild', 'pwa', 'service worker', 'web worker', 'canvas', 'svg', 'webgl', '动画',
      'requestanimationframe', '国际化', 'i18n', '无障碍', 'a11y', '安全', 'xss', 'csrf',
      '点击劫持', '沙箱', '正则', 'generator', '迭代器', 'iterator', 'proxy', 'reflect', 'symbol',
      'weakmap', '装饰器', 'decorator', 'graphql', 'grpc', 'docker', 'k8s', '限流', '熔断',
    ],
  },
];

function heatFor(leaf) {
  const hay = `${leaf.label ?? ''} ${leaf.filePath ?? ''} ${(leaf.tags ?? []).join(' ')}`.toLowerCase();
  for (const tier of TIERS) {
    if (tier.kw.some(k => hay.includes(k.toLowerCase().trim()))) return tier.heat;
  }
  return 1; // 其它：冷门基线
}

// heat → currRank（0~5）分档，与 dedup-and-heat.md 一致。
function currRankFor(heat) {
  if (heat >= 8) return 5;
  if (heat >= 5) return 4;
  if (heat >= 3) return 3;
  if (heat >= 2) return 2;
  return 1;
}

const stats = { leaves: 0, byRank: {} };

function walk(nodes) {
  for (const node of nodes) {
    if (node.isLeaf) {
      const heat = heatFor(node);
      node.heat = heat;
      node.currRank = currRankFor(heat);
      stats.leaves++;
      stats.byRank[node.currRank] = (stats.byRank[node.currRank] ?? 0) + 1;
    } else if (Array.isArray(node.children)) {
      walk(node.children);
    }
  }
  // 仅当某节点的孩子全是叶子时，按 heat 降序稳定重排（不打乱分类结构）。
  return nodes;
}

function sortLeafSiblings(nodes) {
  for (const node of nodes) {
    if (Array.isArray(node.children)) sortLeafSiblings(node.children);
  }
  const allLeaves = nodes.length > 0 && nodes.every(n => n.isLeaf);
  if (allLeaves) {
    nodes
      .map((n, i) => ({ n, i }))
      .sort((a, b) => (b.n.heat ?? 0) - (a.n.heat ?? 0) || a.i - b.i)
      .forEach(({ n }, idx) => (nodes[idx] = n));
  }
  return nodes;
}

const treePath = resolve(ROOT, 'knowledge', '_tree.json');
const tree = JSON.parse(readFileSync(treePath, 'utf8'));
walk(tree);
sortLeafSiblings(tree);

console.log(`[knowledge] 回填叶子 ${stats.leaves} 个`);
console.log(`[knowledge] currRank 分布：`, stats.byRank);
if (WRITE) {
  writeFileSync(treePath, JSON.stringify(tree, null, 2) + '\n');
  console.log('[knowledge] 已写回 knowledge/_tree.json');
} else {
  console.log('（预览模式，未写盘；加 --write 落盘）');
}
