export const meta = {
  name: 'node-event-loop-phases-v2',
  article: 'knowledge/backend/nodejs/node-event-loop-deep.md',
  alt: 'Node.js 事件循环每一轮按顺序经过六个阶段：timers 执行到期的 setTimeout 和 setInterval 回调；pending callbacks 执行上一轮推迟的 I/O 错误回调；idle 和 prepare 只供 libuv 内部使用；poll 获取新 I/O 事件并执行回调，队列空了就等待；check 执行 setImmediate 回调；close callbacks 执行 socket close 等关闭回调；还有待处理任务就进入下一轮。阶段之间的圆点表示清空微任务：每个阶段结束后，以及 timers 里每个回调执行完，都先清空 process.nextTick 队列，再清空 Promise 队列。递归调用 nextTick 会让清空永不结束，I/O 和定时器永远轮不到，需要递归时改用 setImmediate 让出。libuv 线程池处理文件系统、dns.lookup、部分 crypto 和原生插件，做完把回调交回 poll 阶段；网络 I/O 不占线程池，用非阻塞 socket 加 epoll、kqueue 或 IOCP，由内核通知，同样在 poll 阶段回调。在主模块顶层，setTimeout 0 和 setImmediate 的先后不确定；在 I/O 回调里，setImmediate 一定先执行',
};

export default (k) => {
  const s = [];
  const phases = [
    ['timers', '到期的 setTimeout / setInterval', 'info'],
    ['pending callbacks', '上一轮推迟的 I/O 错误回调', 'muted'],
    ['idle / prepare', 'libuv 内部用，用户代码不在这', 'muted'],
    ['poll', '取新 I/O 事件并执行回调；空了就等', 'ok'],
    ['check', 'setImmediate 回调', 'warn'],
    ['close callbacks', 'socket close 等关闭回调', 'muted'],
  ];
  phases.forEach(([t, sub, tone], i) => {
    const y = 140 + i * 80;
    s.push(k.box({ x: 40, y, w: 300, h: 64, title: t, sub, titleSize: 'body', tone, strong: t === 'poll' }));
    if (i < phases.length - 1) {
      s.push(k.arrow({ points: [[190, y + 64], [190, y + 80]] }));
      s.push(`<circle cx="190" cy="${y + 72}" r="5" fill="${k.t.accent}"/>`);
    }
  });
  s.push(k.arrow({ points: [[340, 572], [366, 572], [366, 172], [340, 172]] }));
  s.push(k.text({ x: 376, y: 330, text: '下一轮', size: 'note', tone: 'muted' }));

  s.push(k.box({ x: 430, y: 140, w: 490, h: 112, title: '● 每个阶段结束后清空微任务', sub: '① process.nextTick 队列（优先）\n② Promise 队列\ntimers 里每个回调执行完也会清空一次', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 430, y: 270, w: 490, h: 84, title: 'nextTick 递归会饿死事件循环', sub: '清空停不下来，I/O 和定时器永远轮不到\n需要递归时改用 setImmediate 让出', titleSize: 'body', tone: 'bad' }));
  s.push(k.box({ x: 430, y: 372, w: 490, h: 84, title: 'libuv 线程池', sub: 'fs · dns.lookup · 部分 crypto · 原生插件\n做完把回调交回 poll 阶段', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 430, y: 520, w: 490, h: 84, title: '网络 I/O 不占线程池', sub: '非阻塞 socket + epoll / kqueue / IOCP\n内核通知后，同样在 poll 阶段回调', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[430, 412], [340, 412]], dashed: true }));
  s.push(k.arrow({ points: [[430, 562], [400, 562], [400, 412]], dashed: true, head: false }));

  return k.figure({
    h: 720,
    title: 'Node.js 事件循环：六个阶段，阶段之间清微任务',
    subtitle: '左边是一轮循环的顺序；右边是微任务、线程池和网络 I/O 怎么接进来',
    body: s.join('') + k.note({ x: 40, y: 630, w: 880, h: 52, lead: '顺序陷阱：', text: '主模块顶层 setTimeout(0) 与 setImmediate 先后不定；在 I/O 回调里 setImmediate 一定先。' }),
  });
};
