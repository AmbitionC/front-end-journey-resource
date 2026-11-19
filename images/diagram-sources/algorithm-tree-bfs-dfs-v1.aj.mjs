export const meta = {
  name: 'algorithm-tree-bfs-dfs-v1',
  article: 'knowledge/data-structure/algorithm/algorithm-tree.md',
  alt: '同一张图从 A 出发：左侧 BFS 用队列按层扩展，访问顺序 A B C D F E；右侧 DFS 用递归或栈一路深入再回退，访问顺序 A B D C F E；图中有环，靠 visited 避免重复访问',
};

const P = { A: [220, 172], B: [130, 240], C: [310, 240], D: [220, 308], F: [400, 308], E: [220, 376] };
const E = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'F'], ['D', 'E']];

function panel(k, ox, { title, sub, order, tree, layers, stateTitle, state }) {
  const s = [k.text({ x: ox + 20, y: 120, text: title, size: 'heading', weight: 600 })];
  if (layers) [172, 240, 308, 376].forEach((y, i) => {
    s.push(k.text({ x: ox + 20, y: y + 5, text: `第 ${i} 层`, size: 'note', tone: 'muted' }));

  });
  for (const [a, b] of E) {
    const inTree = tree.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    s.push(k.edge({ from: [ox + P[a][0], P[a][1]], to: [ox + P[b][0], P[b][1]], tone: inTree ? 'accent' : 'line', dashed: !inTree }));
  }
  for (const [n, [x, y]] of Object.entries(P)) s.push(k.node({ x: ox + x, y, label: n, badge: order.indexOf(n) + 1 }));
  s.push(k.panel({ x: ox + 20, y: 410, w: 420, h: 96, label: stateTitle }));
  s.push(k.text({ x: ox + 36, y: 466, text: state, size: 'label', mono: true, tone: 'sec' }));
  return s.join('');
}

export default (k) => k.figure({
  h: 590,
  title: 'BFS 与 DFS：同一张图，两种走法',
  subtitle: '圆点上的数字是访问顺序；实线是遍历时真正走过的边',
  body: [
    panel(k, 20, { title: 'BFS：用队列，按层往外扩', order: [...'ABCDFE'], tree: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'F'], ['D', 'E']], layers: true,
      stateTitle: '队列每一步（左边出队）', state: '[A] → [B C] → [C D] → [D F]\n→ [F E] → [E] → 空' }),
    `<line x1="480" y1="104" x2="480" y2="506" stroke="${k.t.faint}"/>`,
    panel(k, 500, { title: 'DFS：用栈或递归，走到底再回退', order: [...'ABDCFE'], tree: [['A', 'B'], ['B', 'D'], ['D', 'C'], ['C', 'F'], ['D', 'E']], layers: false,
      stateTitle: '递归路径每一步', state: 'A → A B → A B D → A B D C\n→ A B D C F → 回退到 D → A B D E' }),
    k.note({ x: 40, y: 524, w: 880, h: 48, lead: 'visited：', text: 'A-B-D-C 构成环，访问过的点不再入队或递归；树是没有环的特例。' }),
  ].join(''),
});
