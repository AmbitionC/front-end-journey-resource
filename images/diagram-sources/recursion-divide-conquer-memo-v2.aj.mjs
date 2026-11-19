export const meta = {
  name: 'recursion-divide-conquer-memo-v2',
  article: 'knowledge/data-structure/algorithm/algorithm-loop.md',
  alt: '左侧归并排序把 [5,2,4,1] 一路对半拆到长度 1 的 base case，再两两合并成 [1,2,4,5]；右侧 fib(5) 的朴素递归树有 15 次调用，fib(3)、fib(2) 被重复求解，加 memo 后重复节点直接命中缓存，只剩 9 次调用、6 个状态各算一次',
};

// 左：归并排序沙漏（向下拆、向上合）
function mergeSort(k) {
  const H = 40, s = [];
  const row = (y, items, tone) => items.forEach(([cx, w, label]) =>
    s.push(k.box({ x: cx - w / 2, y, w, h: H, title: label, tone, titleSize: 'body' })));
  // 连线：父(cx, 底) → 子(cx, 顶)，只走横竖段
  const link = (px, py, cx, cy, tone) => {
    const mid = (py + cy) / 2;
    s.push(k.arrow({ points: [[px, py], [px, mid], [cx, mid], [cx, cy]], tone }));
  };
  const L = [
    { y: 140, label: '原问题' }, { y: 210, label: '拆一半' }, { y: 280, label: '长度 1' },
    { y: 350, label: '两两合并' }, { y: 420, label: '答案' },
  ];
  L.forEach(({ y, label }) => s.push(k.text({ x: 44, y: y + 26, text: label, size: 'note', tone: 'muted' })));
  row(140, [[290, 124, '5, 2, 4, 1']], 'info');
  row(210, [[210, 84, '5, 2'], [370, 84, '4, 1']], 'info');
  row(280, [[170, 52, '5'], [250, 52, '2'], [330, 52, '4'], [410, 52, '1']], 'ok');
  row(350, [[210, 84, '2, 5'], [370, 84, '1, 4']], 'accent');
  row(420, [[290, 124, '1, 2, 4, 5']], 'accent');
  link(290, 180, 210, 210, 'info'); link(290, 180, 370, 210, 'info');
  for (const [p, c] of [[210, 170], [210, 250], [370, 330], [370, 410]]) link(p, 250, c, 280, 'info');
  for (const [c, p] of [[170, 210], [250, 210], [330, 370], [410, 370]]) link(c, 320, p, 350, 'accent');
  link(210, 390, 290, 420, 'accent'); link(370, 390, 290, 420, 'accent');
  s.push(k.text({ x: 290, y: 492, text: '每层合并共 O(n)，共 log n 层 → O(n log n)', size: 'label', tone: 'sec', anchor: 'middle' }));
  return s.join('');
}

// 右：fib(5) 调用树；hit = 加 memo 后直接命中，skip = 命中后不再展开
function fibTree(k) {
  const r = 18, s = [];
  const N = {
    a: [712, 160, 'f5'], b: [602, 225, 'f4'], c: [823, 225, 'f3', 'hit'],
    d: [547, 290, 'f3'], e: [657, 290, 'f2', 'hit'], f: [777, 290, 'f2', 'skip'], g: [870, 290, 'f1', 'skip'],
    h: [517, 355, 'f2'], i: [577, 355, 'f1'], j: [632, 355, 'f1', 'skip'], l: [684, 355, 'f0', 'skip'],
    m: [750, 355, 'f1', 'skip'], n: [804, 355, 'f0', 'skip'],
    o: [497, 420, 'f1'], p: [541, 420, 'f0'],
  };
  const E = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['b', 'e'], ['c', 'f'], ['c', 'g'], ['d', 'h'], ['d', 'i'],
    ['e', 'j'], ['e', 'l'], ['f', 'm'], ['f', 'n'], ['h', 'o'], ['h', 'p']];
  const tone = (st) => (st === 'hit' ? 'ok' : st === 'skip' ? 'muted' : 'accent');
  for (const [u, v] of E) {
    const skip = N[v][3] === 'skip';
    const e = k.edge({ from: N[u], to: N[v], r, tone: skip ? 'line' : 'accent', dashed: skip });
    s.push(skip ? `<g opacity="0.5">${e}</g>` : e);
  }
  for (const [x, y, label, st] of Object.values(N)) {
    const n = k.node({ x, y, r, label, tone: tone(st), filled: st === 'hit' });
    s.push(st === 'skip' ? `<g opacity="0.45">${n}</g>` : n);
  }
  s.push(k.legend({ x: 500, y: 470, items: [
    { tone: 'accent', label: '真正计算' }, { tone: 'ok', label: '命中 memo' }, { tone: 'line', label: '不再展开', dashed: true },
  ], gap: 18 }));
  s.push(k.cells({ x: 560, y: 504, values: [0, 1, 1, 2, 3, 5], cw: 46, ch: 40, textSize: 'label' }));
  s.push(k.text({ x: 852, y: 530, text: 'memo[k]', size: 'label', tone: 'muted', mono: true }));
  return s.join('');
}

export default (k) => k.figure({
  h: 640,
  title: '子问题图：分治向下拆、向上合，memo 让重复子问题只算一次',
  subtitle: '左：归并排序 [5,2,4,1]；右：fib(5) 的朴素递归树，fk 表示调用 fib(k)',
  body: [
    k.text({ x: 40, y: 120, text: '分治：规模严格变小，再合并', size: 'heading', weight: 600 }),
    mergeSort(k),
    `<line x1="480" y1="104" x2="480" y2="510" stroke="${k.t.faint}"/>`,
    k.text({ x: 500, y: 120, text: '重复子问题：f3 算 2 次，f2 算 3 次', size: 'heading', weight: 600 }),
    fibTree(k),
    k.note({ x: 40, y: 568, w: 880, h: 52, lead: '调用次数：', text: '朴素递归 15 次；加 memo 后 9 次，f0~f5 六个状态各只算一次。' }),
  ].join(''),
});
