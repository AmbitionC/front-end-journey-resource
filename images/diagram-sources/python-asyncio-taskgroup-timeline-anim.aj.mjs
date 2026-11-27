import still from './python-asyncio-taskgroup-timeline-v2.aj.mjs';

export const meta = {
  name: 'python-asyncio-taskgroup-timeline-anim',
  article: 'knowledge/data/python/python-async.md',
  alt: 'asyncio 时间线逐步展开（可逐步播放）：事件循环先跑 A，A 在 await I/O 处挂起让出，接着跑 B、C，三个都挂起后循环空闲；A 的 I/O 就绪后恢复，随后 C 恢复并抛出异常；同一个 TaskGroup 里还没完成的 A、B 被取消，依次在 finally 里清理，最后 TaskGroup 退出 async with 时抛出 ExceptionGroup',
};

const ROW = { loop: 140, A: 210, B: 270, C: 330 };
// [行, 起, 止, tone, 虚线(挂起), 标签]
const SEG = [
  ['loop', 220, 280, 'accent', false, 'A'], ['A', 220, 280, 'info'],
  ['A', 280, 470, 'info', true, 'await I/O'], ['loop', 280, 340, 'accent', false, 'B'], ['B', 280, 340, 'info'],
  ['B', 340, 640, 'info', true, 'await I/O'], ['loop', 340, 400, 'accent', false, 'C'], ['C', 340, 400, 'info'],
  ['C', 400, 530, 'info', true, 'await I/O'],
  ['loop', 470, 530, 'accent', false, 'A'], ['A', 470, 530, 'info'], ['A', 530, 590, 'info', true],
  ['loop', 530, 580, 'accent', false, 'C'], ['C', 530, 580, 'bad'],
  ['loop', 590, 640, 'accent', false, 'A'], ['A', 590, 640, 'warn'],
  ['loop', 640, 690, 'accent', false, 'B'], ['B', 640, 690, 'warn'],
];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const T = k.t;
  const bar = (x0, x1, y, tone, dashed) => `<rect x="${x0}" y="${y}" width="${Math.max(2, x1 - x0)}" height="28" rx="5" fill="${dashed ? 'none' : T[tone]}" fill-opacity="${dashed ? 0 : 0.32}" stroke="${T[tone]}" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
  const lab = (x, y, text, tone = 'sec') => k.text({ x, y: y + 20, text, size: 'note', tone, anchor: 'middle' });
  const upto = (now) => SEG.filter(([, a]) => a < now).map(([r, a, b, tone, dashed, label]) => {
    const e = Math.min(b, now);
    let s = bar(a, e, ROW[r], tone, dashed);
    if (label && e >= b) s += lab((a + e) / 2, ROW[r], label, r === 'loop' ? 'text' : 'sec');
    return s;
  }).join('') + (now > 430 ? lab(435, ROW.loop, '空闲', 'muted') : '') +
    (now >= 580 ? k.text({ x: 590, y: ROW.C + 20, text: '✕ 抛异常 → 取消兄弟任务', size: 'note', tone: 'bad' }) : '');
  const cursor = (now) => k.keyed('now', `<line x1="${now}" y1="128" x2="${now}" y2="176" stroke="${k.color('warn')}" stroke-width="2"/>`);
  const tg = (sub, tone = 'muted') => k.box({ x: 730, y: 140, w: 190, h: 162, title: 'TaskGroup', sub, titleSize: 'body', tone });
  const f = (caption, now, tgs, done = false) => ({ caption, body: upto(now) + (done ? '' : cursor(now)) + tg(...tgs) });

  return k.figure({
    h: 580,
    title: 'asyncio：一个循环轮流跑 Task，TaskGroup 一起失败',
    subtitle: 'Task 在 await I/O 处让出执行权；组内一个出错，其余的被取消并在 finally 清理',
    body: [
      k.text({ x: 40, y: ROW.loop + 20, text: 'event loop', size: 'label', mono: true, weight: 600 }),
      ...['A', 'B', 'C'].map((n) => k.text({ x: 40, y: ROW[n] + 20, text: `Task ${n}`, size: 'label', mono: true, tone: 'sec' })),
      k.arrow({ points: [[220, 384], [700, 384]] }),
      k.text({ x: 710, y: 389, text: '时间', size: 'note', tone: 'muted' }),
      ...[['info', false, '运行'], ['info', true, 'await 挂起'], ['warn', false, 'finally 清理'], ['bad', false, '出错']].map(([tone, d, t], i) => {
        const x = 220 + i * 150;
        return `<rect x="${x}" y="412" width="26" height="16" rx="3" fill="${d ? 'none' : T[tone]}" fill-opacity="${d ? 0 : 0.32}" stroke="${T[tone]}" stroke-width="1.5"${d ? ' stroke-dasharray="4 3"' : ''}/>` +
          k.text({ x: x + 34, y: 426, text: t, size: 'note', tone: 'muted' });
      }),
      k.box({ x: 40, y: 456, w: 430, h: 84, title: 'await 只在等 I/O 时让出', sub: 'time.sleep、CPU 计算会冻结整个循环\n阻塞调用交给 asyncio.to_thread', titleSize: 'body', tone: 'warn' }),
      k.box({ x: 490, y: 456, w: 430, h: 84, title: 'TaskGroup 还是 gather', sub: '要一起成功或一起失败：TaskGroup\n容许局部失败、逐项返回：gather', titleSize: 'body', tone: 'accent' }),
    ].join(''),
    frames: [
      f('事件循环同一时刻只跑一个 Task：先跑 A，A 走到 await 网络请求就挂起，把执行权还给循环', 290, ['A、B、C 都在跑\nasync with 里等着']),
      f('循环接着跑 B，B 也 await 挂起；再跑 C', 370, ['A、B、C 都在跑\nasync with 里等着']),
      f('C 也挂起了，三个都在等 I/O：循环空闲，不占 CPU，等操作系统通知哪个 I/O 好了', 460, ['A、B、C 都在跑\nasync with 里等着']),
      f('A 的 I/O 先就绪，A 恢复运行一小段，又去等下一次 I/O', 535, ['A、B、C 都在跑\nasync with 里等着']),
      f('C 恢复后抛出异常：同一个 TaskGroup 里的兄弟任务都要被取消', 585, ['C 失败\n→ 取消 A、B', 'bad']),
      f('A 收到 CancelledError，在 finally 里关连接、释放资源', 645, ['等 A、B\n清理完', 'warn']),
      f('B 同样在 finally 里清理完', 695, ['等 A、B\n清理完', 'warn']),
      f('都清理完以后，TaskGroup 退出 async with，把 C 的异常包成 ExceptionGroup 抛出去', 700, ['退出 async with\n抛出 ExceptionGroup', 'bad'], true),
    ],
  });
};
