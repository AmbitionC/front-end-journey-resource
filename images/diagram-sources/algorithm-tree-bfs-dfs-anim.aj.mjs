import still from './algorithm-tree-bfs-dfs-v1.aj.mjs';

export const meta = {
  name: 'algorithm-tree-bfs-dfs-anim',
  article: 'knowledge/data-structure/algorithm/algorithm-tree.md',
  alt: 'BFS 与 DFS 并排逐步演示（可逐步播放）：同一张图从 A 出发，每一步左右各访问一个点；BFS 用队列按层扩展，访问顺序 A B C D F E；DFS 用递归一路深入再回退，访问顺序 A B D C F E；第 3 步两边开始分叉；A-B-D-C 有环，靠 visited 不重复访问',
};

const P = { A: [220, 172], B: [130, 240], C: [310, 240], D: [220, 308], F: [400, 308], E: [220, 376] };
const E = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'F'], ['D', 'E']];
const BFS = { order: [...'ABCDFE'], tree: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'F'], ['D', 'E']],
  state: ['出队 A → 入队 B C\n队列 [B C]', '出队 B → 入队 D\n队列 [C D]', '出队 C → 入队 F\n队列 [D F]', '出队 D → 入队 E\n队列 [F E]', '出队 F\n队列 [E]', '出队 E\n队列空，结束'] };
const DFS = { order: [...'ABDCFE'], tree: [['A', 'B'], ['B', 'D'], ['D', 'C'], ['C', 'F'], ['D', 'E']],
  state: ['递归栈 A', '递归栈 A B', '递归栈 A B D', '递归栈 A B D C\nA 已访问，不回头', '递归栈 A B D C F', '回退到 D\n递归栈 A B D E'] };

export default (k) => {
  if (k.mode === 'still') return still(k);
  const panel = (ox, key, title, alg, n, layers, stateTitle) => {
    const s = [k.text({ x: ox + 20, y: 120, text: title, size: 'heading', weight: 600 })];
    if (layers) [172, 240, 308, 376].forEach((y, i) => s.push(k.text({ x: ox + 20, y: y + 5, text: `第 ${i} 层`, size: 'note', tone: 'muted' })));
    const seen = alg.order.slice(0, n);
    for (const [a, b] of E) {
      const inTree = alg.tree.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
      const done = seen.includes(a) && seen.includes(b);
      s.push(k.edge({ from: [ox + P[a][0], P[a][1]], to: [ox + P[b][0], P[b][1]], tone: inTree && done ? 'accent' : 'line', dashed: !(inTree && done) }));
    }
    for (const [name, [x, y]] of Object.entries(P)) {
      const i = seen.indexOf(name);
      const cur = i === n - 1;
      s.push(k.node({ x: ox + x, y, label: name, tone: i < 0 ? 'muted' : cur ? 'warn' : 'accent', filled: cur, badge: i < 0 ? undefined : i + 1, badgeTone: cur ? 'warn' : 'accent' }));
    }
    s.push(k.panel({ x: ox + 20, y: 410, w: 420, h: 96, label: stateTitle }));
    s.push(k.text({ x: ox + 36, y: 466, text: n ? alg.state[n - 1] : '', size: 'label', mono: true, tone: 'sec' }));
    return s.join('');
  };
  const both = (n, a, b) => panel(20, 'bfs', 'BFS：用队列，按层往外扩', BFS, n, true, a ?? '队列每一步（左边出队）') +
    panel(500, 'dfs', 'DFS：用栈或递归，走到底再回退', DFS, n, false, b ?? '递归路径每一步');
  const f = (caption, body) => ({ caption, body });

  return k.figure({
    h: 590,
    title: 'BFS 与 DFS：同一张图，两种走法',
    subtitle: '圆点上的数字是访问顺序；实线是遍历时真正走过的边',
    body: `<line x1="480" y1="104" x2="480" y2="506" stroke="${k.t.faint}"/>` +
      k.note({ x: 40, y: 524, w: 880, h: 48, lead: 'visited：', text: 'A-B-D-C 构成环，访问过的点不再入队或递归；树是没有环的特例。' }),
    frames: [
      f('两边都从 A 出发：BFS 把 A 的邻居 B、C 一起入队；DFS 只把 A 放进递归栈，准备往下走', both(1)),
      f('第 2 个都是 B：BFS 出队 B，把 D 排到队尾；DFS 从 B 继续往深处走', both(2)),
      f('从这里分叉：BFS 先把第 1 层的 C 走完；DFS 不管同层，沿着 B 直接走到 D', both(3)),
      f('BFS 进入第 2 层，访问 D 并把 E 入队；DFS 从 D 走到 C，C 的邻居 A 已在 visited 里，不再回去', both(4)),
      f('BFS 访问 F；DFS 从 C 走到 F，F 没有没访问过的邻居了', both(5)),
      f('BFS 最后访问 E，队列空了；DFS 从 F 一路回退到 D，再走到 E。顺序分别是 A B C D F E 和 A B D C F E', both(6)),
    ],
  });
};
