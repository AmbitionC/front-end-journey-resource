import still from './node-event-loop-phases-v2.aj.mjs';

export const meta = {
  name: 'node-event-loop-phases-anim',
  article: 'knowledge/backend/nodejs/node-event-loop-deep.md',
  alt: 'Node.js 事件循环逐步演示（可逐步播放）：fs.readFile 交给 libuv 线程池，读完后回调在 poll 阶段执行，回调里注册了 setTimeout C、setImmediate D、nextTick E 和 Promise F；poll 阶段结束先清微任务，nextTick 的 E 先于 Promise 的 F；接着 check 阶段执行 setImmediate 的 D；本轮结束进入下一轮 timers 才执行 C；所以在 I/O 回调里 setImmediate 一定先于 setTimeout 0，输出 E F D C',
};

const PH = [
  ['timers', '到期的 setTimeout / setInterval', 'info'],
  ['pending callbacks', '上一轮推迟的 I/O 错误回调', 'muted'],
  ['idle / prepare', 'libuv 内部用，用户代码不在这', 'muted'],
  ['poll', '取新 I/O 事件并执行回调；空了就等', 'ok'],
  ['check', 'setImmediate 回调', 'warn'],
  ['close callbacks', 'socket close 等关闭回调', 'muted'],
];
const CODE = [
  "fs.readFile('a.txt', () => {",
  "  setTimeout(() => log('C'), 0)",
  "  setImmediate(() => log('D'))",
  "  process.nextTick(() => log('E'))",
  "  Promise.resolve().then(() => log('F'))",
  '})',
];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const phase = (i) => hl('cur', 40, 140 + i * 80, 300, 64);
  const micro = (i) => k.keyed('cur', `<circle cx="190" cy="${140 + i * 80 + 72}" r="10" fill="none" stroke="${k.color('warn')}" stroke-width="3"/>`);
  const line = (a, b = a) => hl('code', 446, 171 + a * 26, 460, (b - a + 1) * 26 + 2, 'info');
  const out = (s) => k.text({ x: 450, y: 410, text: s || '（还没有输出）', size: 'heading', mono: true, weight: 600, tone: s ? 'ok' : 'muted' });
  const queues = (text) => k.text({ x: 450, y: 438, text, size: 'note', tone: 'sec' });
  const pool = (sub, tone = 'info') => k.box({ x: 430, y: 470, w: 490, h: 72, title: 'libuv 线程池', sub, titleSize: 'body', tone });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 720,
    title: 'Node.js 事件循环：六个阶段，阶段之间清微任务',
    subtitle: '左边是一轮循环的顺序；右边跟着一段代码走一遍，看输出顺序怎么来的',
    body: [
      ...PH.map(([t, sub, tone], i) => {
        const y = 140 + i * 80;
        return k.box({ x: 40, y, w: 300, h: 64, title: t, sub, titleSize: 'body', tone, strong: t === 'poll' }) +
          (i < PH.length - 1 ? k.arrow({ points: [[190, y + 64], [190, y + 80]] }) + `<circle cx="190" cy="${y + 72}" r="5" fill="${k.t.accent}"/>` : '');
      }),
      k.arrow({ points: [[340, 572], [366, 572], [366, 172], [340, 172]] }),
      k.text({ x: 376, y: 330, text: '下一轮', size: 'note', tone: 'muted' }),
      k.panel({ x: 430, y: 140, w: 490, h: 198, label: '代码' }),
      ...CODE.map((c, i) => k.text({ x: 456, y: 191 + i * 26, text: c, size: 'note', mono: true })),
      k.panel({ x: 430, y: 352, w: 490, h: 104, label: '输出' }),
      k.text({ x: 430, y: 574, text: '● 圆点：每个阶段结束后先清 nextTick，再清 Promise', size: 'note', tone: 'accent' }),
      k.note({ x: 40, y: 630, w: 880, h: 52, lead: '顺序陷阱：', text: '主模块顶层 setTimeout(0) 与 setImmediate 先后不定；在 I/O 回调里 setImmediate 一定先。' }),
    ].join(''),
    frames: [
      f('主模块执行 fs.readFile：读文件交给 libuv 线程池，主线程不等，直接进入事件循环', [line(0), out(''), queues('各队列都是空的'), pool('读 a.txt 中…')]),
      f('循环转到 poll 阶段等 I/O：线程池读完了，把回调交回 poll 执行。回调里注册了 C、D、E、F 四件事', [phase(3), line(1, 4), out(''), queues('timers: C　check: D　nextTick: E　Promise: F'), pool('读完 → 回调交回 poll', 'ok')]),
      f('poll 阶段的回调跑完，进下一个阶段之前先清微任务：nextTick 的 E 优先，然后才是 Promise 的 F', [micro(3), out('E F'), queues('timers: C　check: D'), pool('空闲')]),
      f('接着就是 check 阶段，执行 setImmediate 的 D', [phase(4), out('E F D'), queues('timers: C'), pool('空闲')]),
      f('close callbacks 没事做，本轮结束；下一轮从 timers 开始，C 这才执行', [phase(0), out('E F D C'), queues('各队列都空了'), pool('空闲')]),
      f('所以在 I/O 回调里，setImmediate 一定先于 setTimeout(0)：poll 之后紧跟着就是 check，timers 要等下一轮', [phase(4), hl('code', 446, 197, 460, 54, 'ok'), out('E F D C'), queues('D 在 C 前面'), pool('空闲')]),
    ],
  });
};
