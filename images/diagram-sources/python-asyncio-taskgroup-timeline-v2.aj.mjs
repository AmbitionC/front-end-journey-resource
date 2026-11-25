export const meta = {
  name: 'python-asyncio-taskgroup-timeline-v2',
  article: 'knowledge/data/python/python-async.md',
  alt: 'asyncio 用一个事件循环在单线程里调度三个 Task，按时间从左到右画。事件循环同一时刻只运行一个 Task：先运行 A，A 在 await I/O 处挂起并让出，再运行 B，B 挂起后运行 C，C 也挂起后循环空闲等待 I/O。A 的 I/O 就绪后恢复运行，接着 C 恢复运行并抛出异常。三个 Task 都在同一个 TaskGroup 里，C 的异常会取消尚未完成的兄弟任务：A 和 B 收到取消，依次在 finally 里做清理，之后 TaskGroup 退出 async with 时以 ExceptionGroup 向外传播异常。下方两点：await 只在等待 I/O 时让出，time.sleep 或 CPU 计算会冻结整个循环，阻塞调用要用 asyncio.to_thread；要一起成功或一起失败时用 TaskGroup，需要容许局部失败、逐项返回结果时用 gather 并设置 return_exceptions=True',
};

export default (k) => {
  const s = [];
  const T = k.t;
  const bar = (x0, x1, y, tone, dashed = false) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="28" rx="5" fill="${dashed ? 'none' : T[tone]}" fill-opacity="${dashed ? 0 : 0.32}" stroke="${T[tone]}" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
  const lab = (x, y, text, tone = 'sec') => k.text({ x, y: y + 20, text, size: 'note', tone, anchor: 'middle' });

  const rows = { loop: 140, A: 210, B: 270, C: 330 };
  s.push(k.text({ x: 40, y: rows.loop + 20, text: 'event loop', size: 'label', mono: true, weight: 600 }));
  for (const n of ['A', 'B', 'C']) s.push(k.text({ x: 40, y: rows[n] + 20, text: `Task ${n}`, size: 'label', mono: true, tone: 'sec' }));

  [[220, 280, 'A'], [280, 340, 'B'], [340, 400, 'C'], [470, 530, 'A'], [530, 580, 'C'], [590, 640, 'A'], [640, 690, 'B']].forEach(([a, b, n]) => {
    s.push(bar(a, b, rows.loop, 'accent'), lab((a + b) / 2, rows.loop, n, 'text'));
  });
  s.push(lab(435, rows.loop, '空闲', 'muted'));

  s.push(bar(220, 280, rows.A, 'info'), bar(280, 470, rows.A, 'info', true), lab(375, rows.A, 'await I/O'), bar(470, 530, rows.A, 'info'), bar(530, 590, rows.A, 'info', true), bar(590, 640, rows.A, 'warn'));
  s.push(bar(280, 340, rows.B, 'info'), bar(340, 640, rows.B, 'info', true), lab(490, rows.B, 'await I/O'), bar(640, 690, rows.B, 'warn'));
  s.push(bar(340, 400, rows.C, 'info'), bar(400, 530, rows.C, 'info', true), lab(465, rows.C, 'await I/O'), bar(530, 580, rows.C, 'bad'));
  s.push(k.text({ x: 590, y: rows.C + 20, text: '✕ 抛异常 → 取消兄弟任务', size: 'note', tone: 'bad' }));

  s.push(k.arrow({ points: [[220, 384], [700, 384]] }));
  s.push(k.text({ x: 710, y: 389, text: '时间', size: 'note', tone: 'muted' }));
  s.push(k.box({ x: 730, y: 140, w: 190, h: 162, title: 'TaskGroup 退出', sub: 'A、B 的 finally\n清理完以后\n抛出 ExceptionGroup', titleSize: 'body', tone: 'bad' }));

  const lg = [['info', false, '运行'], ['info', true, 'await 挂起'], ['warn', false, 'finally 清理'], ['bad', false, '出错']];
  lg.forEach(([tone, d, t], i) => {
    const x = 220 + i * 150;
    s.push(`<rect x="${x}" y="412" width="26" height="16" rx="3" fill="${d ? 'none' : T[tone]}" fill-opacity="${d ? 0 : 0.32}" stroke="${T[tone]}" stroke-width="1.5"${d ? ' stroke-dasharray="4 3"' : ''}/>`);
    s.push(k.text({ x: x + 34, y: 426, text: t, size: 'note', tone: 'muted' }));
  });

  s.push(k.box({ x: 40, y: 456, w: 430, h: 84, title: 'await 只在等 I/O 时让出', sub: 'time.sleep、CPU 计算会冻结整个循环\n阻塞调用交给 asyncio.to_thread', titleSize: 'body', tone: 'warn' }));
  s.push(k.box({ x: 490, y: 456, w: 430, h: 84, title: 'TaskGroup 还是 gather', sub: '要一起成功或一起失败：TaskGroup\n容许局部失败、逐项返回：gather', titleSize: 'body', tone: 'accent' }));

  return k.figure({
    h: 580,
    title: 'asyncio：一个循环轮流跑 Task，TaskGroup 一起失败',
    subtitle: 'Task 在 await I/O 处让出执行权；组内一个出错，其余的被取消并在 finally 清理',
    body: s.join(''),
  });
};
