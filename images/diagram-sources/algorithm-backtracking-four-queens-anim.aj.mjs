import still from './algorithm-backtracking-four-queens-v1.aj.mjs';

export const meta = {
  name: 'algorithm-backtracking-four-queens-anim',
  article: 'knowledge/cs/algorithm/algorithm-backtracking.md',
  alt: '四皇后回溯逐步演示（可逐步播放）：左边决策树一层层长出来，右上棋盘同步摆皇后；第 0 行放第 0 列，第 1 行跳过冲突列放第 2 列，第 2 行无合法列，撤销；第 1 行改放第 3 列，第 2 行放第 1 列，第 3 行又无合法列，一路撤销回第 0 行；第 0 行改放第 1 列，依次放 3、0、2，找到解 [1, 3, 0, 2]',
};

const Y = [140, 220, 300, 380, 460];
// [id, x, row, label, 出现的步, 被撤销的步]
const N = [
  ['r', 360, 0, '·', 0, 99],
  ['a', 230, 1, '0', 1, 7], ['a2', 160, 2, '2', 2, 4], ['ax', 160, 3, '×', 3, 99],
  ['a3', 300, 2, '3', 4, 7], ['a31', 300, 3, '1', 5, 7], ['a3x', 300, 4, '×', 6, 99],
  ['b', 480, 1, '1', 7, 99], ['b3', 480, 2, '3', 8, 99], ['b30', 480, 3, '0', 9, 99], ['b302', 480, 4, '2', 10, 99],
];
const PARENT = { a: 'r', a2: 'a', ax: 'a2', a3: 'a', a31: 'a3', a3x: 'a31', b: 'r', b3: 'b', b30: 'b3', b302: 'b30' };
const BOARD = [
  [], [[0, 0]], [[0, 0], [1, 2]], [[0, 0], [1, 2]], [[0, 0], [1, 3]], [[0, 0], [1, 3], [2, 1]], [[0, 0], [1, 3], [2, 1]],
  [[0, 1]], [[0, 1], [1, 3]], [[0, 1], [1, 3], [2, 0]], [[0, 1], [1, 3], [2, 0], [3, 2]],
];
const DEAD = { 3: 2, 6: 3 };
const BX = 752, BY = 104, C = 34;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const tree = (n) => {
    const s = [];
    const pos = Object.fromEntries(N.map(([id, x, r]) => [id, [x, Y[r]]]));
    const last = Math.max(...N.filter((d) => d[4] <= n && d[3] !== '×').map((d) => d[4]));
    for (const [id, , , label, at, undo] of N) {
      if (at > n || !PARENT[id]) continue;
      const bad = label === '×', gone = n >= undo;
      s.push(k.edge({ from: pos[PARENT[id]], to: pos[id], tone: bad ? 'bad' : gone ? 'line' : id === 'b302' ? 'ok' : 'accent', dashed: bad || gone }));
    }
    for (const [id, x, r, label, at, undo] of N) {
      if (at > n) continue;
      const bad = label === '×', gone = n >= undo;
      const tone = bad ? 'bad' : id === 'b302' ? 'ok' : gone ? 'line' : at === last && n === at ? 'warn' : 'accent';
      s.push(k.node({ x, y: Y[r], label, tone, filled: id === 'b302' }));
    }
    if (n >= 3) s.push(k.text({ x: 160, y: Y[3] + 46, text: '无合法列\n撤销', size: 'note', tone: 'bad', anchor: 'middle' }));
    if (n >= 6) s.push(k.text({ x: 300, y: Y[4] + 46, text: '无合法列，撤销', size: 'note', tone: 'bad', anchor: 'middle' }));
    if (n >= 10) s.push(k.text({ x: 480, y: Y[4] + 46, text: '找到解 [1, 3, 0, 2]', size: 'label', tone: 'ok', anchor: 'middle', weight: 600 }));
    return s.join('');
  };
  const board = (n) => {
    const s = [];
    const qs = BOARD[n];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      s.push(`<rect x="${BX + c * C}" y="${BY + r * C}" width="${C}" height="${C}" fill="${(r + c) % 2 ? k.t.box : k.t.panel ?? k.t.box}" stroke="${k.t.line}" stroke-width="1"/>`);
      const q = qs.some(([qr, qc]) => qr === r && qc === c);
      const newest = q && qs[qs.length - 1][0] === r;
      if (q) s.push(k.text({ x: BX + c * C + C / 2, y: BY + r * C + C / 2 + 6, text: 'Q', size: 'body', anchor: 'middle', weight: 700, tone: n === 10 ? 'ok' : newest ? 'warn' : 'accent' }));
      else if (DEAD[n] === r) s.push(k.text({ x: BX + c * C + C / 2, y: BY + r * C + C / 2 + 6, text: '×', size: 'body', anchor: 'middle', tone: 'bad' }));
    }
    for (let r = 0; r < 4; r++) s.push(k.text({ x: BX - 10, y: BY + r * C + C / 2 + 5, text: String(r), size: 'note', tone: 'muted', anchor: 'end' }));
    return s.join('');
  };
  const LINES = ['1  选一个候选列', '2  冲突就跳过（剪枝）', '3  记下选择，递归下一行', '4  返回后撤销刚才的选择'];
  const steps = (i, tone = 'warn') => [
    k.panel({ x: 640, y: 286, w: 280, h: 228, label: '每一层做的事' }),
    ...LINES.map((t, j) => k.text({ x: 660, y: 338 + j * 32, text: t, size: 'label', tone: j === i ? tone : 'sec', weight: j === i ? 600 : undefined })),
    i >= 0 ? k.keyed('step', `<rect x="650" y="${318 + i * 32}" width="260" height="28" rx="6" fill="none" stroke="${k.color(tone)}" stroke-width="2"/>`) : '',
    k.text({ x: 660, y: 484, text: '撤销要和记录完全对称', size: 'label', tone: 'warn' }),
  ].join('');
  const f = (caption, n, i, tone) => ({ caption, body: tree(n) + board(n) + steps(i, tone) });

  return k.figure({
    h: 600,
    title: '回溯：选择 → 检查 → 递归 → 撤销',
    subtitle: '以四皇后为例：每层给一行选列，圆里的数字是列号',
    body: ['起点', '第 0 行', '第 1 行', '第 2 行', '第 3 行'].map((l, i) => k.text({ x: 40, y: Y[i] + 5, text: l, size: 'label', tone: 'muted' })).join('') +
      k.note({ x: 40, y: 534, w: 880, h: 50, text: '剪枝只能删掉已证明不可能出解的分支；“看起来不好”不算理由。' }),
    frames: [
      f('第 0 行先试第 0 列：记下选择，递归去处理第 1 行', 1, 2),
      f('第 1 行：第 0、1 列和上面的皇后同列或同斜线，直接剪掉；第 2 列合法，放下', 2, 1),
      f('第 2 行四个列全部冲突，没有合法选择：返回上一层，撤销第 1 行放的第 2 列', 3, 3, 'bad'),
      f('第 1 行接着试下一个候选：第 3 列合法，放下再往下走', 4, 0),
      f('第 2 行只有第 1 列合法，放下', 5, 2),
      f('第 3 行又没有合法列：撤销第 2 行；第 2、1 行都没有别的候选，一路撤销回第 0 行', 6, 3, 'bad'),
      f('第 0 行改试第 1 列，棋盘上之前的皇后都已撤掉，从干净状态重新开始', 7, 0),
      f('第 1 行跳过冲突列，只有第 3 列合法', 8, 1),
      f('第 2 行放第 0 列', 9, 2),
      f('第 3 行放第 2 列，四行都放满了：找到解 [1, 3, 0, 2]', 10, -1),
    ],
  });
};
