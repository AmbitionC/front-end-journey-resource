export const meta = {
  name: 'promise-state-chain-combinators-cancel-v2',
  article: 'knowledge/js-es6-ts/es6/promise.md',
  alt: 'Promise 四件事：状态从 pending 只能 settle 一次，resolve 变 fulfilled，reject 或抛错变 rejected，resolve 一个 thenable 会跟随它的最终状态；then 总返回新 Promise，返回普通值则下一步 fulfilled，抛错则 rejected，忘了 return 下一步拿到 undefined；组合器中 all 全部成功才成功、任一失败立即失败且不取消其余操作，allSettled 逐项报告，race 取第一个 settle，any 取第一个成功；Promise 本身不能取消，要把 AbortSignal 传给每一层，并用池子限制同时在途的任务数',
};

export default (k) => {
  const s = [];
  const rule = (x, y, lead, text, tone) => s.push(`<text x="${x}" y="${y}" font-size="${k.SIZE.label}" fill="${k.t.sec}"><tspan font-weight="600" fill="${k.color(tone)}">${lead}</tspan>${text}</text>`);

  s.push(k.panel({ x: 40, y: 116, w: 430, h: 204, label: '1 状态只 settle 一次' }));
  s.push(k.box({ x: 60, y: 156, w: 120, h: 48, title: 'pending', titleSize: 'body', tone: 'muted' }));
  s.push(k.box({ x: 300, y: 156, w: 150, h: 48, title: 'fulfilled', titleSize: 'body', tone: 'ok' }));
  s.push(k.box({ x: 300, y: 228, w: 150, h: 48, title: 'rejected', titleSize: 'body', tone: 'bad' }));
  s.push(k.arrow({ points: [[180, 180], [300, 180]], tone: 'ok', label: 'resolve', labelAt: [240, 170] }));
  s.push(k.arrow({ points: [[120, 204], [120, 252], [300, 252]], tone: 'bad', label: 'reject / throw', labelAt: [214, 242] }));
  s.push(k.text({ x: 60, y: 302, text: 'resolve(thenable) 会跟随它的最终状态', size: 'note', tone: 'muted' }));

  s.push(k.panel({ x: 490, y: 116, w: 430, h: 204, label: '2 then 总返回一个新 Promise' }));
  rule(510, 176, '返回普通值 → ', '下一步 fulfilled', 'ok');
  rule(510, 204, 'throw / 返回 rejected → ', '下一步 rejected', 'bad');
  rule(510, 232, '花括号里忘了 return → ', '拿到 undefined', 'warn');
  rule(510, 260, 'catch ', '在能恢复的层处理，别吞掉', 'info');
  rule(510, 288, 'finally ', '做清理；自身抛错会替换原错误', 'info');

  s.push(k.panel({ x: 40, y: 340, w: 430, h: 196, label: '3 组合器：结果按输入顺序' }));
  [['all', '全部成功才成功，一个失败就失败'], ['allSettled', '等全部结束，逐项报告状态'], ['race', '取第一个 settle 的结果'], ['any', '首个成功；全败抛 AggregateError']].forEach(([a, b], i) => {
    s.push(k.text({ x: 60, y: 390 + i * 32, text: a, size: 'label', mono: true, tone: 'accent' }));
    s.push(k.text({ x: 168, y: 390 + i * 32, text: b, size: 'label' }));
  });
  s.push(k.text({ x: 60, y: 520, text: '没赢的操作不会被自动取消', size: 'note', tone: 'warn' }));

  s.push(k.panel({ x: 490, y: 340, w: 430, h: 196, label: '4 取消和并发都要自己做' }));
  rule(510, 394, 'AbortController → ', 'signal 传给每一层', 'accent');
  rule(510, 422, '操作监听 signal → ', '停止、清理、AbortError', 'accent');
  rule(510, 450, 'race 超时 ', '不会停掉底层 fetch', 'warn');
  rule(510, 478, 'Promise.all(items.map) ', '一次全开', 'bad');
  rule(510, 506, '池子 / semaphore ', '只保持 N 个在途', 'ok');

  return k.figure({
    h: 640,
    title: 'Promise：状态、then 链、组合器、取消与并发',
    subtitle: 'Promise 不是线程、队列或取消令牌；reaction 总在后续 microtask 执行，不会同步插入当前调用',
    body: s.join('') + k.note({ x: 40, y: 560, w: 880, h: 52, lead: 'await 不让计算并行：', text: '它只挂起当前 async 函数，结果 settle 后再从 microtask 恢复。' }),
  });
};
