import still from './usecallback-usememo-memo-compare-v2.aj.mjs';

export const meta = {
  name: 'usecallback-usememo-memo-compare-anim',
  article: 'knowledge/framework/react/useCallback-useMemo.md',
  alt: 'useMemo 和 useCallback 逐步演示（可逐步播放）：父组件 state 更新后函数重跑；每次新建箭头函数时，memo 子组件用 Object.is 比较新旧引用发现不相等，照样重渲染；用 useCallback 且依赖没变时，引用和上次相同，跳过子组件渲染；用了 useCallback 但子组件没包 memo，没人比较引用，照样渲染；最后提醒 render 不等于 commit，先用 Profiler 找慢点',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  s.push(k.box({ x: 40, y: 130, w: 880, h: 56, title: '父组件 state 更新 → 父组件函数重跑，为子组件重新创建 props', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(`<path d="M 46 186 V 438" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  const rows = [
    ['每次新建 {} / () => {}', 'memo 浅比较（Object.is）\n引用不相等', '子组件照样 render', 'bad'],
    ['useMemo / useCallback\n依赖没变', 'memo 浅比较\n引用相同', '跳过子组件 render', 'ok'],
    ['用了 useCallback\n但子组件没包 memo', '没有人比较引用', '照样 render，包装白做', 'warn'],
  ];
  rows.forEach(([a, b, c, tone], i) => {
    const y = 210 + i * 92;
    s.push(k.arrow({ points: [[46, y + 34], [60, y + 34]] }));
    s.push(k.box({ x: 60, y, w: 260, h: 68, title: a, titleSize: 'label', tone: 'muted' }));
    s.push(k.arrow({ points: [[320, y + 34], [340, y + 34]] }));
    s.push(k.box({ x: 340, y, w: 280, h: 68, title: b, titleSize: 'label', tone: 'muted' }));
    s.push(k.arrow({ points: [[620, y + 34], [640, y + 34]], tone }));
    s.push(k.box({ x: 640, y, w: 280, h: 68, title: c, titleSize: 'body', tone }));
  });

  s.push(k.box({ x: 40, y: 500, w: 880, h: 84, title: 'render ≠ commit', sub: 'render 只计算下一棵 UI，commit 才把差异改到 DOM\n先用 Profiler 找到真正慢的地方，再决定要不要 memo', titleSize: 'body', tone: 'info' }));

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const row = (i, tone) => hl('row', 60, 210 + i * 92, 860, 68, tone);
  const ref = (i, text, tone) => k.text({ x: 340, y: 210 + i * 92 + 86, text, size: 'note', tone, mono: true });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 700,
    title: 'useMemo / useCallback：只有下游比较引用时才省事',
    subtitle: '它们稳定的是值和函数的引用；子组件要靠 memo 浅比较或 Hook 依赖才能用上',
    body: s.join('') + k.note({ x: 40, y: 608, w: 880, h: 52, lead: '依赖要写全：', text: '漏掉依赖会形成 stale closure；依赖频繁变化时 memo 没意义，直接删掉。' }),
    frames: [
      f('父组件的 state 变了：父组件函数整个重跑一遍，给子组件的 props 也跟着重新创建', [hl('row', 40, 130, 880, 56)]),
      f('直接写一个内联箭头函数传给子组件：每次渲染都是一个新函数。memo 用 Object.is 比较，旧的和新的不是同一个，子组件照样渲染', [row(0, 'bad'), ref(0, 'Object.is(fn#1, fn#2) → false', 'bad')]),
      f('用 useCallback 包住、依赖 [id] 没变：拿到的还是上次那个函数，浅比较通过，子组件这一轮直接跳过', [row(1, 'ok'), ref(1, 'Object.is(fn#1, fn#1) → true', 'ok')]),
      f('用了 useCallback，可子组件没包 memo，也没有 Hook 依赖它：没人比较引用，子组件照样渲染，这层包装白做了', [row(2, 'warn'), ref(2, '没人调用 Object.is', 'warn')]),
      f('就算子组件重新 render，也只是算出下一棵 UI；commit 才改 DOM。先用 Profiler 找到真正慢的组件，再决定要不要 memo', [hl('row', 40, 500, 880, 84, 'info')]),
    ],
  });
};
