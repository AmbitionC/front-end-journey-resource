export const meta = {
  name: 'browser-event-loop-round-order-anim',
  article: 'knowledge/js-es6-ts/js/event-loop.md',
  alt: '浏览器一轮事件循环（可逐步播放）：取一个 task，执行 JavaScript 直到调用栈为空，清空 microtask 队列且期间新加入的也在本轮执行，然后宿主可能更新渲染，再进入下一轮；示例代码同步阶段输出 A F，microtask 阶段输出 C E D，下一个 task 输出 B',
};

export default (k) => {
  const Y = 116, H = 100, W = 196, X = [40, 268, 496, 724];
  const flow = (i) => k.arrow({ points: [[X[i] + W, Y + 50], [X[i + 1], Y + 50]], tone: 'accent' });
  const NB = '  ';
  const code = [
    "console.log('A');",
    "setTimeout(() => console.log('B'), 0);",
    'queueMicrotask(() => {',
    NB + "console.log('C');",
    NB + "queueMicrotask(() => console.log('D'));",
    '});',
    "Promise.resolve().then(() => console.log('E'));",
    "console.log('F');",
  ];
  const lane = (y, label, vals, tone) =>
    k.text({ x: 536, y: y + 28, text: label, size: 'label', tone: 'muted' }) +
    k.cells({ x: 700, y, values: vals, cw: 48, ch: 42, indices: false, mark: Object.fromEntries(vals.map((_, i) => [i, tone])) });

  const base = [
    k.panel({ x: 40, y: 280, w: 458, h: 236, label: '示例代码' }),
    '<style>text{font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0}</style>',
    ...code.map((l, i) => k.text({ x: 60, y: 334 + i * 22, text: l, size: 'note', mono: true })),
    k.panel({ x: 518, y: 280, w: 402, h: 236, label: '实际执行顺序' }),
  ];

  return k.figure({
    h: 620,
    title: '一轮事件循环：task → 清空 microtask → 可能渲染',
    subtitle: '简化自 HTML 标准；渲染时机由宿主决定，不保证每轮都画，也不保证固定 16.7ms',
    steps: [
      '取出第一个 task：整段脚本本身就是一个 task',
      '执行同步代码：A、F 立刻输出；setTimeout 把 B 排进 task 队列，C 和 E 进 microtask 队列',
      '调用栈空了，清空 microtask：C 执行时又把 D 入队，D 仍在这一轮跑完',
      '宿主决定要不要更新渲染：rAF、样式、布局、绘制',
      '进入下一轮，取出计时器 task：输出 B',
    ],
    body: [
      ...base,
      k.step(1, [k.box({ x: X[0], y: Y, w: W, h: H, title: '1 取一个 task', sub: '计时器、输入、网络\n来自不同 task source', tone: 'accent' })]),
      k.step(2, [flow(0), k.box({ x: X[1], y: Y, w: W, h: H, title: '2 执行 JS', sub: '一直跑到\n调用栈为空', tone: 'accent' })]),
      k.step(2, [lane(320, '同步代码', ['A', 'F'], 'accent')], { mode: 'reveal' }),
      k.step(3, [flow(1), k.box({ x: X[2], y: Y, w: W, h: H, title: '3 清空 microtask', sub: '期间新入队的\n也在这一轮跑完', tone: 'accent', strong: true })]),
      k.step(3, [lane(376, 'microtask 阶段', ['C', 'E', 'D'], 'info'), k.text({ x: 536, y: 500, text: 'D 由 C 入队，仍在同一个 checkpoint 里跑', size: 'note', tone: 'muted' })], { mode: 'reveal' }),
      k.step(4, [flow(2), k.box({ x: X[3], y: Y, w: W, h: H, title: '4 可能更新渲染', sub: 'rAF → 样式\n→ 布局 → 绘制', tone: 'warn', dashed: true })]),
      k.step(5, [k.arrow({ points: [[X[3] + W / 2, Y + H], [X[3] + W / 2, 252], [X[0] + W / 2, 252], [X[0] + W / 2, Y + H]], tone: 'accent', dashed: true, label: '下一轮', labelAt: [480, 244] })]),
      k.step(5, [lane(432, '下一个 task', ['B'], 'warn')], { mode: 'reveal' }),
      k.step(5, [k.note({ x: 40, y: 540, w: 880, h: 52, lead: '输出 A F C E D B：', text: 'microtask 若不停给自己入队，后续 task 和渲染会一直等。' })], { mode: 'reveal' }),
    ].join(''),
  });
};
