export const meta = {
  name: 'usecallback-usememo-memo-compare-v2',
  article: 'knowledge/framework/react/useCallback-useMemo.md',
  alt: '父组件 state 更新后，父组件函数重跑，并为子组件重新创建 props。之后分三种情况。第一种：每次 render 都新建对象字面量或箭头函数，memo 子组件用 Object.is 做浅比较时引用不相等，子组件照样 render。第二种：用 useMemo 或 useCallback 且依赖不变，传下去的引用和上次相同，memo 浅比较通过，跳过子组件 render。第三种：用了 useCallback，但子组件没有包 memo，也没有别的 Hook 依赖这个函数，没有人比较引用，子组件照样 render，包装白做。底部说明 render 不等于 commit：render 只计算下一棵 UI，commit 才把差异改到 DOM；应先用 Profiler 找到真正的慢点，再决定要不要 memo。Hook 依赖要写全，漏掉会形成 stale closure；依赖频繁变化时 memo 没有意义，应该删掉',
};

export default (k) => {
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

  return k.figure({
    h: 700,
    title: 'useMemo / useCallback：只有下游比较引用时才省事',
    subtitle: '它们稳定的是值和函数的引用；子组件要靠 memo 浅比较或 Hook 依赖才能用上',
    body: s.join('') + k.note({ x: 40, y: 608, w: 880, h: 52, lead: '依赖要写全：', text: '漏掉依赖会形成 stale closure；依赖频繁变化时 memo 没意义，直接删掉。' }),
  });
};
