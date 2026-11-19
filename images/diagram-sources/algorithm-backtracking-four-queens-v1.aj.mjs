export const meta = {
  name: 'algorithm-backtracking-four-queens-v1',
  article: 'knowledge/cs/algorithm/algorithm-backtracking.md',
  alt: '四皇后的回溯决策树：每层选一行的列，冲突的列直接剪掉，走不通就撤销回到上一层，最终找到解 1 3 0 2',
};

const Y = [140, 220, 300, 380, 460];

export default (k) => k.figure({
  h: 600,
  title: '回溯：选择 → 检查 → 递归 → 撤销',
  subtitle: '以四皇后为例：每层给一行选列，圆里的数字是列号',
  body: [
    ...['起点', '第 0 行', '第 1 行', '第 2 行', '第 3 行'].map((l, i) => k.text({ x: 40, y: Y[i] + 5, text: l, size: 'label', tone: 'muted' })),
    k.node({ x: 360, y: Y[0], label: '·' }),
    k.node({ x: 230, y: Y[1], label: '0' }),
    k.node({ x: 480, y: Y[1], label: '1' }),
    k.node({ x: 580, y: Y[1], label: '2', tone: 'line' }),
    k.node({ x: 660, y: Y[1], label: '3', tone: 'line' }),
    k.text({ x: 620, y: Y[1] + 48, text: '同理，略', size: 'note', tone: 'muted', anchor: 'middle' }),
    ...[230, 480, 580, 660].map((x) => k.edge({ from: [360, Y[0]], to: [x, Y[1]], tone: x > 500 ? 'line' : 'accent', dashed: x > 500 })),

    k.node({ x: 160, y: Y[2], label: '2' }), k.node({ x: 300, y: Y[2], label: '3' }), k.node({ x: 480, y: Y[2], label: '3' }),
    k.edge({ from: [230, Y[1]], to: [160, Y[2]], tone: 'accent' }), k.edge({ from: [230, Y[1]], to: [300, Y[2]], tone: 'accent' }),
    k.edge({ from: [480, Y[1]], to: [480, Y[2]], tone: 'accent' }),

    k.node({ x: 160, y: Y[3], label: '×', tone: 'bad' }),
    k.edge({ from: [160, Y[2]], to: [160, Y[3]], tone: 'bad', dashed: true }),
    k.node({ x: 300, y: Y[3], label: '1' }), k.edge({ from: [300, Y[2]], to: [300, Y[3]], tone: 'accent' }),
    k.node({ x: 480, y: Y[3], label: '0' }), k.edge({ from: [480, Y[2]], to: [480, Y[3]], tone: 'accent' }),

    k.node({ x: 300, y: Y[4], label: '×', tone: 'bad' }), k.edge({ from: [300, Y[3]], to: [300, Y[4]], tone: 'bad', dashed: true }),
    k.node({ x: 480, y: Y[4], label: '2', tone: 'ok', filled: true }), k.edge({ from: [480, Y[3]], to: [480, Y[4]], tone: 'ok' }),

    k.text({ x: 160, y: Y[3] + 46, text: '无合法列\n撤销', size: 'note', tone: 'bad', anchor: 'middle' }),
    k.text({ x: 300, y: Y[4] + 46, text: '无合法列，撤销', size: 'note', tone: 'bad', anchor: 'middle' }),
    k.text({ x: 480, y: Y[4] + 46, text: '找到解 [1, 3, 0, 2]', size: 'label', tone: 'ok', anchor: 'middle', weight: 600 }),

    k.panel({ x: 640, y: 286, w: 280, h: 228, label: '每一层做的事' }),
    k.text({ x: 660, y: 338, text: '1  选一个候选列', size: 'label', tone: 'sec' }),
    k.text({ x: 660, y: 370, text: '2  冲突就跳过（剪枝）', size: 'label', tone: 'sec' }),
    k.text({ x: 660, y: 402, text: '3  记下选择，递归下一行', size: 'label', tone: 'sec' }),
    k.text({ x: 660, y: 434, text: '4  返回后撤销刚才的选择', size: 'label', tone: 'sec' }),
    k.text({ x: 660, y: 484, text: '撤销要和记录完全对称', size: 'label', tone: 'warn' }),

    k.note({ x: 40, y: 534, w: 880, h: 50, text: '剪枝只能删掉已证明不可能出解的分支；“看起来不好”不算理由。' }),
  ].join(''),
});
