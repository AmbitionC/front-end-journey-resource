import still from './algorithm-graph-traversal-topo-v1.aj.mjs';

export const meta = {
  name: 'algorithm-graph-traversal-topo-anim',
  article: 'knowledge/cs/algorithm/algorithm-graph.md',
  alt: '图遍历逐步演示（可逐步播放）：BFS 从 A 出发用队列分层访问，A，然后 B 和 C，再 D，最后 E；DFS 用栈一路深入 A B D，再到 C，C 的邻居都访问过就回溯到 D，最后访问 E；拓扑排序先算入度，A、B 入度为 0 先入队，取出它们后 C 的入度降到 0，再取 C、D，得到 A B C D',
};

const P = { A: [150, 160], B: [90, 245], C: [210, 245], D: [150, 330], E: [150, 415] };
const E = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']];
const T = { A: [720, 190], B: [860, 190], C: [790, 290], D: [790, 390] };
const TE = [['A', 'C'], ['B', 'C'], ['C', 'D']];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const has = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  // order：已访问顺序（角标）；cur：当前节点；tree：已走过的树边
  const graph = (ox, order, cur, tree) => {
    const s = [];
    for (const [a, b] of E) s.push(k.edge({ from: [ox + P[a][0], P[a][1]], to: [ox + P[b][0], P[b][1]], tone: has(tree, a, b) ? 'accent' : 'line', dashed: !has(tree, a, b) }));
    for (const [n, [x, y]] of Object.entries(P)) {
      const i = order.indexOf(n);
      s.push(k.node({ x: ox + x, y, label: n, tone: i >= 0 ? 'accent' : 'line', filled: n === cur, badge: i >= 0 ? i + 1 : undefined }));
    }
    return s.join('');
  };
  const topo = (done, cur, indeg) => {
    const s = [];
    for (const [a, b] of TE) s.push(k.edge({ from: T[a], to: T[b], arrow: true, tone: done.includes(a) ? 'muted' : 'accent', dashed: done.includes(a) }));
    for (const [n, [x, y]] of Object.entries(T)) {
      const i = done.indexOf(n);
      s.push(k.node({ x, y, label: n, tone: i >= 0 ? 'ok' : 'accent', filled: n === cur, badge: i >= 0 ? i + 1 : `${indeg[n]}`, badgeTone: i >= 0 ? 'ok' : 'warn' }));
    }
    return s.join('');
  };
  const line = (x, y, text, tone = 'sec') => k.text({ x, y, text, size: 'label', tone });
  const bfs = (order, cur, tree, q, layer) => graph(10, order, cur, tree) + line(40, 470, q) + (layer ? line(40, 494, layer, 'muted') : '');
  const dfs = (order, cur, tree, st, back) => graph(310, order, cur, tree) + line(340, 470, st) +
    (back ? k.arrow({ points: [[555, 260], [555, 330], [492, 330]], tone: 'warn', dashed: true, flow: true, label: '从 C 回溯', labelAt: [562, 300], labelAnchor: 'start' }) : '');
  const tp = (done, cur, indeg, q, out) => topo(done, cur, indeg) + line(660, 452, q) + line(660, 476, out, out.startsWith('结果') ? 'ok' : 'sec');
  const BFS_DONE = bfs([...'ABCDE'], null, [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'E']], '层：A | B C | D | E');
  const DFS_IDLE = dfs([], null, [], '栈：空');
  const DFS_DONE = dfs([...'ABDCE'], null, [['A', 'B'], ['B', 'D'], ['D', 'C'], ['D', 'E']], '顺序：A B D C E');
  const IN0 = { A: 0, B: 0, C: 2, D: 1 };
  const TP_IDLE = tp([], null, IN0, '角标 = 入度', '');
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 590,
    title: '图遍历：BFS 分层、DFS 深入、拓扑序',
    subtitle: '左、中是同一张无向图（AB、AC、BD、CD、DE）；右边是另一张有向图',
    body: [
      k.text({ x: 40, y: 124, text: 'BFS：按边数分层', size: 'heading', weight: 600 }),
      ...[160, 245, 330, 415].map((y, i) => k.text({ x: 40, y: y + 5, text: `${i}`, size: 'label', tone: 'muted' })),
      `<line x1="320" y1="104" x2="320" y2="500" stroke="${k.t.faint}"/>`,
      k.text({ x: 340, y: 124, text: 'DFS：首次访问顺序', size: 'heading', weight: 600 }),
      `<line x1="640" y1="104" x2="640" y2="500" stroke="${k.t.faint}"/>`,
      k.text({ x: 660, y: 124, text: '拓扑排序：只用于 DAG', size: 'heading', weight: 600 }),
      k.note({ x: 40, y: 512, w: 880, h: 56, text: '序列里相邻不代表有直接边；拓扑序常不唯一，但 A、B 都必须排在 C 前面。' }),
    ].join(''),
    frames: [
      f('BFS 从 A 出发：A 入队并标记已访问，它是第 0 层', [bfs(['A'], 'A', [], '队列：A', '第 0 层：A'), DFS_IDLE, TP_IDLE]),
      f('取出 A，把没见过的邻居 B、C 入队：它们离 A 一条边，是第 1 层', [bfs([...'ABC'], 'A', [['A', 'B'], ['A', 'C']], '队列：B C', '第 1 层：B C'), DFS_IDLE, TP_IDLE]),
      f('取出 B，发现 D 入队；再取出 C，它的邻居 D 已经标记过，不重复入队', [bfs([...'ABCD'], 'C', [['A', 'B'], ['A', 'C'], ['B', 'D']], '队列：D', '第 2 层：D'), DFS_IDLE, TP_IDLE]),
      f('取出 D，E 入队再取出：队列空了，按层得到 A | B C | D | E，这就是无权图最短边数', [BFS_DONE, DFS_IDLE, TP_IDLE]),
      f('DFS 用栈一路往深处走：A → B → D，每到一个新点就压栈', [BFS_DONE, dfs([...'ABD'], 'D', [['A', 'B'], ['B', 'D']], '栈：A B D'), TP_IDLE]),
      f('从 D 继续到 C；C 的邻居 A、D 都访问过了，没路可走，弹栈回到 D', [BFS_DONE, dfs([...'ABDC'], 'C', [['A', 'B'], ['B', 'D'], ['D', 'C']], '栈：A B D C → 弹出 C', true), TP_IDLE]),
      f('回到 D 后走向 E；全部访问完，首次访问顺序是 A B D C E', [BFS_DONE, DFS_DONE, TP_IDLE]),
      f('拓扑排序换一张有向无环图：先数每个点的入度（角标），A、B 入度为 0，先入队', [BFS_DONE, DFS_DONE, tp([], null, IN0, '队列：A B', '已输出：—')]),
      f('输出 A，删掉 A→C，C 的入度从 2 降到 1，还不能入队', [BFS_DONE, DFS_DONE, tp(['A'], 'A', { ...IN0, C: 1 }, '队列：B', '已输出：A')]),
      f('输出 B，C 的入度降到 0，入队；先 A 后 B 还是先 B 后 A 都合法', [BFS_DONE, DFS_DONE, tp(['A', 'B'], 'B', { ...IN0, C: 0 }, '队列：C', '已输出：A B')]),
      f('输出 C，D 入度归零，再输出 D：得到 A B C D。若最后有点出不来，说明图里有环', [BFS_DONE, DFS_DONE, tp(['A', 'B', 'C', 'D'], 'D', { A: 0, B: 0, C: 0, D: 0 }, '队列：空', '结果：A B C D')]),
    ],
  });
};
