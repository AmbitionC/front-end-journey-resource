export const meta = {
  name: 'algorithm-graph-traversal-topo-v1',
  article: 'knowledge/cs/algorithm/algorithm-graph.md',
  alt: '左侧 BFS 在无向无权图上从 A 分层：A，B 和 C，D，E；中间 DFS 首次访问顺序 A B D C E，访问 E 前从 C 回溯到 D；右侧另一张有向无环图 A 到 C、B 到 C、C 到 D，A 和 B 可交换顺序',
};

const P = { A: [150, 160], B: [90, 245], C: [210, 245], D: [150, 330], E: [150, 415] };
const E = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']];

function graph(k, ox, order, tree) {
  const s = [];
  for (const [a, b] of E) {
    const t = tree.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    s.push(k.edge({ from: [ox + P[a][0], P[a][1]], to: [ox + P[b][0], P[b][1]], tone: t ? 'accent' : 'line', dashed: !t }));
  }
  for (const [n, [x, y]] of Object.entries(P)) s.push(k.node({ x: ox + x, y, label: n, badge: order ? order.indexOf(n) + 1 : undefined }));
  return s.join('');
}

export default (k) => k.figure({
  h: 590,
  title: '图遍历：BFS 分层、DFS 深入、拓扑序',
  subtitle: '左、中是同一张无向图（AB、AC、BD、CD、DE）；右边是另一张有向图',
  body: [
    k.text({ x: 40, y: 124, text: 'BFS：按边数分层', size: 'heading', weight: 600 }),
    ...[160, 245, 330, 415].map((y, i) => k.text({ x: 40, y: y + 5, text: `${i}`, size: 'label', tone: 'muted' })),
    graph(k, 10, null, [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'E']]),
    k.text({ x: 40, y: 470, text: '层：A | B C | D | E', size: 'label', tone: 'sec' }),

    `<line x1="320" y1="104" x2="320" y2="490" stroke="${k.t.faint}"/>`,
    k.text({ x: 340, y: 124, text: 'DFS：首次访问顺序', size: 'heading', weight: 600 }),
    graph(k, 310, [...'ABDCE'], [['A', 'B'], ['B', 'D'], ['D', 'C'], ['D', 'E']]),
    k.arrow({ points: [[555, 260], [555, 330], [492, 330]], tone: 'warn', dashed: true, label: '从 C 回溯', labelAt: [562, 300], labelAnchor: 'start' }),
    k.text({ x: 340, y: 470, text: '顺序：A B D C E', size: 'label', tone: 'sec' }),

    `<line x1="640" y1="104" x2="640" y2="490" stroke="${k.t.faint}"/>`,
    k.text({ x: 660, y: 124, text: '拓扑排序：只用于 DAG', size: 'heading', weight: 600 }),
    k.node({ x: 720, y: 190, label: 'A' }), k.node({ x: 860, y: 190, label: 'B' }),
    k.node({ x: 790, y: 290, label: 'C' }), k.node({ x: 790, y: 390, label: 'D' }),
    k.edge({ from: [720, 190], to: [790, 290], arrow: true, tone: 'accent' }),
    k.edge({ from: [860, 190], to: [790, 290], arrow: true, tone: 'accent' }),
    k.edge({ from: [790, 290], to: [790, 390], arrow: true, tone: 'accent' }),
    k.text({ x: 660, y: 452, text: '合法：A B C D', size: 'label', tone: 'ok' }),
    k.text({ x: 660, y: 476, text: '合法：B A C D', size: 'label', tone: 'ok' }),

    k.note({ x: 40, y: 512, w: 880, h: 56, text: '序列里相邻不代表有直接边；拓扑序常不唯一，但 A、B 都必须排在 C 前面。' }),
  ].join(''),
});
