import still from './recursion-divide-conquer-memo-v2.aj.mjs';

export const meta = {
  name: 'recursion-fib-memo-anim',
  article: 'knowledge/data-structure/algorithm/algorithm-loop.md',
  alt: '带 memo 的 fib(5) 递归逐步演示（可逐步播放）：调用沿 f5、f4、f3、f2 一路压栈，f1、f0 是预置值直接命中；f2 算完写入 memo 后出栈，f3、f4、f5 需要的另一半都直接命中缓存，总共 9 次调用；朴素递归要 15 次',
};

const DX = -420;
const N = {
  a: [712, 160, 'f5'], b: [602, 225, 'f4'], c: [823, 225, 'f3'], d: [547, 290, 'f3'], e: [657, 290, 'f2'],
  f: [777, 290, 'f2'], g: [870, 290, 'f1'], h: [517, 355, 'f2'], i: [577, 355, 'f1'], j: [632, 355, 'f1'],
  l: [684, 355, 'f0'], m: [750, 355, 'f1'], n: [804, 355, 'f0'], o: [497, 420, 'f1'], p: [541, 420, 'f0'],
};
const PARENT = { b: 'a', c: 'a', d: 'b', e: 'b', f: 'c', g: 'c', h: 'd', i: 'd', j: 'e', l: 'e', m: 'f', n: 'f', o: 'h', p: 'h' };
const pos = (id) => [N[id][0] + DX, N[id][1]];

export default (k) => {
  if (k.mode === 'still') return still(k);
  // st: 节点 → 'run' | 'done' | 'hit' | 'ghost'
  const tree = (st) => {
    let s = '';
    for (const [id, state] of Object.entries(st)) {
      if (!PARENT[id]) continue;
      const e = k.edge({ from: pos(PARENT[id]), to: pos(id), r: 18, tone: state === 'ghost' ? 'line' : 'accent', dashed: state === 'ghost' });
      s += state === 'ghost' ? `<g opacity="0.5">${e}</g>` : e;
    }
    for (const [id, state] of Object.entries(st)) {
      const [x, y] = pos(id);
      const n = k.node({ x, y, r: 18, label: N[id][2], tone: state === 'hit' ? 'ok' : state === 'ghost' ? 'muted' : 'accent', filled: state === 'done' || state === 'hit' });
      s += state === 'ghost' ? `<g opacity="0.45">${n}</g>` : n;
    }
    return s;
  };
  const stack = (items) => items.map((t, i) => k.keyed(`s${i}-${t}`, k.box({ x: 560, y: 380 - i * 48, w: 150, h: 40, title: t, titleSize: 'label', tone: i === items.length - 1 ? 'accent' : 'default' }))).join('');
  const memo = (vals, fresh) => k.cells({ x: 560, y: 470, values: vals.map((v) => (v === null ? '' : v)), cw: 56, ch: 40, textSize: 'label', mark: { 0: 'ok', 1: 'ok', ...(fresh !== undefined ? { [fresh]: 'accent' } : {}) } });
  const calls = (n) => k.text({ x: 900, y: 150, text: `已调用 ${n} 次`, size: 'heading', weight: 600, anchor: 'end' });
  const M0 = [0, 1, null, null, null, null];
  const f = (caption, st, stk, mv, fresh, n) => ({ caption, body: tree(st) + stack(stk) + memo(mv, fresh) + calls(n) });

  return k.figure({
    h: 600,
    title: '递归 + memo：每个子问题只算一次',
    subtitle: 'fib(5)，fk 表示调用 fib(k)；memo 预置 f0 = 0、f1 = 1',
    body: [
      k.panel({ x: 540, y: 104, w: 380, h: 336, label: '调用栈（新调用压在上面）' }),
      k.text({ x: 548, y: 496, text: 'memo', size: 'label', tone: 'muted', mono: true, anchor: 'end' }),
      k.note({ x: 40, y: 528, w: 880, h: 52, lead: '调用次数：', text: '朴素递归 15 次；加 memo 后 9 次，只有 f2～f5 真正计算，其余都命中缓存。' }),
    ].join(''),
    frames: [
      f('调用 f5：memo 里没有，先去算 f4', { a: 'run', b: 'run' }, ['f5', 'f4'], M0, undefined, 2),
      f('f4 要 f3，f3 要 f2，一路往下压栈', { a: 'run', b: 'run', d: 'run', h: 'run' }, ['f5', 'f4', 'f3', 'f2'], M0, undefined, 4),
      f('f2 需要 f1 和 f0：都是预置值，直接命中，不再递归', { a: 'run', b: 'run', d: 'run', h: 'run', o: 'hit', p: 'hit' }, ['f5', 'f4', 'f3', 'f2'], M0, undefined, 6),
      f('f2 = 1 算完，写进 memo[2]，出栈回到 f3', { a: 'run', b: 'run', d: 'run', h: 'done', o: 'hit', p: 'hit' }, ['f5', 'f4', 'f3'], [0, 1, 1, null, null, null], 2, 6),
      f('f3 还要 f1：命中。f3 = 2，写进 memo[3]，出栈', { a: 'run', b: 'run', d: 'done', h: 'done', o: 'hit', p: 'hit', i: 'hit' }, ['f5', 'f4'], [0, 1, 1, 2, null, null], 3, 7),
      f('f4 还要 f2：memo 里已经有了，直接拿 1，不再展开。f4 = 3', { a: 'run', b: 'done', d: 'done', h: 'done', o: 'hit', p: 'hit', i: 'hit', e: 'hit' }, ['f5'], [0, 1, 1, 2, 3, null], 4, 8),
      f('f5 还要 f3：同样命中。f5 = 5，总共只调用了 9 次', { a: 'done', b: 'done', d: 'done', h: 'done', o: 'hit', p: 'hit', i: 'hit', e: 'hit', c: 'hit' }, [], [0, 1, 1, 2, 3, 5], 5, 9),
      f('对照：没有 memo 时，命中的 f2、f3 都要重新展开，虚线这 6 次就是多算的，一共 15 次', { a: 'done', b: 'done', d: 'done', h: 'done', o: 'hit', p: 'hit', i: 'hit', e: 'hit', c: 'hit', f: 'ghost', g: 'ghost', j: 'ghost', l: 'ghost', m: 'ghost', n: 'ghost' }, [], [0, 1, 1, 2, 3, 5], undefined, 9),
    ],
  });
};
