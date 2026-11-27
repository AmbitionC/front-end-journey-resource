export const meta = {
  name: 'promise-combinators-timeline-anim',
  article: 'knowledge/js-es6-ts/es6/promise.md',
  alt: 'Promise 组合器时间线（可逐步播放）：三个请求同时发出，p1 在 300ms 成功得到 a，p2 在 500ms 失败抛出 E，p3 在 800ms 成功得到 c；race 和 any 在 300ms 就以 a 结束；all 在 500ms 遇到第一个失败立即 rejected，但 p3 仍在继续跑、没有被取消；allSettled 等到 800ms 三个都结束，按输入顺序报告三项状态；每个 Promise 只 settle 一次，之后的结果不再改变它',
};

const X = (t) => 200 + t * 0.7;
const P = [
  { name: 'p1', label: 'fetch A', at: 300, ok: true, v: "'a'" },
  { name: 'p2', label: 'fetch B', at: 500, ok: false, v: 'E' },
  { name: 'p3', label: 'fetch C', at: 800, ok: true, v: "'c'" },
];
const PY = [158, 204, 250];
const CY = [320, 362, 404, 446];

export default (k) => {
  const lane = (p, i, now) => {
    const y = PY[i], done = now >= p.at, end = X(Math.min(now, p.at));
    const out = [k.text({ x: 40, y: y + 21, text: `${p.name}  ${p.label}`, size: 'label', mono: true })];
    if (now > 0) out.push(`<rect x="200" y="${y + 10}" width="${end - 200}" height="12" rx="6" fill="${k.color('muted')}" fill-opacity="0.35"/>`);
    if (done) out.push(k.box({ x: X(p.at) - 4, y, w: 140, h: 32, title: `${p.ok ? 'fulfilled' : 'rejected'} ${p.v}`, titleSize: 'label', tone: p.ok ? 'ok' : 'bad' }));
    else out.push(k.box({ x: end + 6, y, w: 88, h: 32, title: 'pending', titleSize: 'label', tone: 'muted' }));
    return out.join('');
  };
  // 组合器结果：[状态, 文字, 旁注]
  const comb = (rows) => ['all', 'allSettled', 'race', 'any'].map((n, i) => {
    const [st, text, aside] = rows[i];
    const tone = st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : 'muted';
    return k.text({ x: 40, y: CY[i] + 23, text: `Promise.${n}`, size: 'label', mono: true, tone: 'accent' }) +
      k.box({ x: 230, y: CY[i], w: 300, h: 34, title: text, titleSize: 'label', tone }) +
      (aside ? k.text({ x: 548, y: CY[i] + 23, text: aside, size: 'note', tone: 'muted' }) : '');
  }).join('');
  const now = (t) => k.keyed('now', `<line x1="${X(t)}" y1="132" x2="${X(t)}" y2="282" stroke="${k.color('warn')}" stroke-width="2.2"/>`) +
    k.keyed('nowt', k.text({ x: X(t), y: 126, text: `t = ${t}ms`, size: 'note', tone: 'warn', anchor: 'middle' }));
  const f = (caption, t, rows) => ({ caption, body: now(t) + P.map((p, i) => lane(p, i, t)).join('') + comb(rows) });
  const PEND = ['pending', 'pending'];

  return k.figure({
    h: 564,
    title: 'Promise 组合器：谁先结束、结束后还会不会变',
    subtitle: '三个请求同时发出；横轴是时间，灰条是还在跑的部分',
    body: [
      ...[0, 200, 400, 600, 800, 1000].map((t) => k.text({ x: X(t), y: 304, text: String(t), size: 'note', tone: 'muted', anchor: 'middle' })),
      `<line x1="200" y1="286" x2="900" y2="286" stroke="${k.t.faint}" stroke-width="1.5"/>`,
      k.note({ x: 40, y: 492, w: 880, h: 52, lead: '没赢的操作不会被自动取消：', text: '要停掉底层请求，得把 AbortSignal 传给每一层。' }),
    ].join(''),
    frames: [
      f('t = 0：三个请求同时发出，三个 Promise 都是 pending，四个组合器也都在等', 0, [PEND, PEND, PEND, PEND]),
      f('t = 300ms：p1 成功。race 取第一个 settle 的，any 取第一个成功的，两者都以 a 结束', 300,
        [PEND, PEND, ['ok', "fulfilled 'a'"], ['ok', "fulfilled 'a'"]]),
      f('t = 500ms：p2 失败。all 遇到第一个失败立刻 rejected；race 已经结束，不会被改写', 500,
        [['bad', 'rejected E（来自 p2）', 'p3 还在跑，没人取消它'], PEND, ['ok', "fulfilled 'a'", '只 settle 一次'], ['ok', "fulfilled 'a'"]]),
      f('t = 800ms：p3 也成功了，但 all 早已失败，这个结果没人用。allSettled 这时才结束，按输入顺序报告三项', 800,
        [['bad', 'rejected E（来自 p2）', 'p3 的结果被丢掉'], ['ok', "[ok 'a', err E, ok 'c']"], ['ok', "fulfilled 'a'"], ['ok', "fulfilled 'a'"]]),
    ],
  });
};
