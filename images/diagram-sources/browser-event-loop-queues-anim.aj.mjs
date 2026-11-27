import still from './browser-event-loop-round-order-v2.aj.mjs';

export const meta = {
  name: 'browser-event-loop-queues-anim',
  article: 'knowledge/js-es6-ts/js/event-loop.md',
  alt: '事件循环逐步演示（可逐步播放）：示例代码同步执行输出 A、F，setTimeout 回调 B 进 task 队列，C 和 E 进 microtask 队列；调用栈清空后依次执行 C、E，C 新排入的 D 也在本轮执行；之后浏览器可能渲染，再取下一个 task 输出 B',
};

const NB = '  ';
const CODE = [
  "console.log('A');",
  "setTimeout(() => console.log('B'), 0);",
  'queueMicrotask(() => {',
  NB + "console.log('C');",
  NB + "queueMicrotask(() => console.log('D'));",
  '});',
  "Promise.resolve().then(() => console.log('E'));",
  "console.log('F');",
];
const LY = (i) => 164 + i * 34;
const LANES = [['stack', '调用栈', 104], ['micro', 'microtask 队列', 190], ['task', 'task 队列', 276], ['out', '控制台输出', 362]];
const laneY = Object.fromEntries(LANES.map(([id, , y]) => [id, y]));

export default (k) => {
  if (k.mode === 'still') return still(k);
  const chip = (key, lane, slot, label, tone) => k.keyed(key, k.box({ x: 660 + slot * 88, y: laneY[lane] + 17, w: 80, h: 40, title: label, titleSize: 'label', tone }));
  const out = (chars) => chars.map((c, i) => k.keyed(`o${c}`, k.box({ x: 660 + i * 44, y: laneY.out + 17, w: 36, h: 40, title: c, titleSize: 'body', tone: 'ok' }))).join('');
  const line = (i, tone = 'accent') => `<rect x="54" y="${LY(i) - 22}" width="432" height="30" rx="6" fill="${k.color(tone)}" fill-opacity="0.16"/>`;
  const phase = (t) => k.text({ x: 40, y: 498, text: t, size: 'body', tone: 'sec', weight: 600 });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 600,
    title: '事件循环：回调在哪个队列里排队，决定了输出顺序',
    subtitle: '简化自 HTML 标准；渲染时机由浏览器决定，不保证每轮都画',
    body: [
      k.panel({ x: 40, y: 104, w: 460, h: 332, label: '示例代码' }),
      '<style>text{font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0}</style>',
      ...CODE.map((l, i) => k.text({ x: 62, y: LY(i), text: l, size: 'note', mono: true })),
      ...LANES.map(([, label, y]) => k.panel({ x: 520, y, w: 400, h: 74 }) + k.text({ x: 536, y: y + 43, text: label, size: 'label', tone: 'muted' })),
      k.note({ x: 40, y: 524, w: 880, h: 52, lead: '规则只有一条：', text: '调用栈一空，先把 microtask 清空（包括途中新加的），才轮到下一个 task。' }),
    ].join(''),
    frames: [
      f('整段脚本本身就是第一个 task：main 入栈，执行第 1 行，输出 A', [line(0), chip('main', 'stack', 0, 'main'), out(['A']), phase('阶段：执行同步代码')]),
      f('setTimeout 只是登记计时器：0ms 到期后，回调 B 排进 task 队列，不会马上执行', [line(1), chip('main', 'stack', 0, 'main'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A']), phase('阶段：执行同步代码')]),
      f('queueMicrotask：回调 C 排进 microtask 队列', [line(2), chip('main', 'stack', 0, 'main'), chip('cbC', 'micro', 0, '回调 C', 'info'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A']), phase('阶段：执行同步代码')]),
      f('Promise.then：回调 E 也进 microtask 队列，排在 C 后面', [line(6), chip('main', 'stack', 0, 'main'), chip('cbC', 'micro', 0, '回调 C', 'info'), chip('cbE', 'micro', 1, '回调 E', 'info'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A']), phase('阶段：执行同步代码')]),
      f('输出 F，脚本跑完，main 出栈，调用栈空了', [line(7), chip('cbC', 'micro', 0, '回调 C', 'info'), chip('cbE', 'micro', 1, '回调 E', 'info'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A', 'F']), phase('阶段：同步代码结束')]),
      f('调用栈一空就清 microtask：C 出队执行，输出 C，同时把 D 排到队尾', [line(3), line(4, 'info'), chip('cbC', 'stack', 0, '回调 C', 'info'), chip('cbE', 'micro', 0, '回调 E', 'info'), chip('cbD', 'micro', 1, '回调 D', 'info'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A', 'F', 'C']), phase('阶段：清空 microtask')]),
      f('E 出队执行，输出 E', [line(6), chip('cbE', 'stack', 0, '回调 E', 'info'), chip('cbD', 'micro', 0, '回调 D', 'info'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A', 'F', 'C', 'E']), phase('阶段：清空 microtask')]),
      f('D 是途中新加的，也在这一轮跑完，输出 D；microtask 队列这才清空', [line(4), chip('cbD', 'stack', 0, '回调 D', 'info'), chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A', 'F', 'C', 'E', 'D']), phase('阶段：清空 microtask')]),
      f('这一轮结束，浏览器可能在这里渲染一帧（rAF、样式、布局、绘制）', [chip('cbB', 'task', 0, '回调 B', 'warn'), out(['A', 'F', 'C', 'E', 'D']), phase('阶段：可能渲染')]),
      f('下一轮：取出 task 队列里的回调 B 执行，输出 B。最终顺序 A F C E D B', [line(1, 'warn'), chip('cbB', 'stack', 0, '回调 B', 'warn'), out(['A', 'F', 'C', 'E', 'D', 'B']), phase('阶段：下一个 task')]),
    ],
  });
};
