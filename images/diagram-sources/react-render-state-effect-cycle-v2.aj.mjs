export const meta = {
  name: 'react-render-state-effect-cycle-v2',
  article: 'knowledge/framework/react/react-hooks.md',
  alt: 'React 函数组件的一轮更新。顶部：Hook 只能在组件或自定义 Hook 顶层调用，React 按调用顺序认出第一个 useState、第二个 useState、useEffect、自定义 Hook 各自的状态槽位，所以不能放进条件、循环或提前 return 之后。主流程：事件处理器调用 setter，只是请求下一次渲染；更新进入队列，函数式 updater 依次拿到最新待处理值；render 用当次 props 和 state 算出 UI 快照，是纯计算；commit 把变化更新到 DOM；之后 Effect 先用旧值运行 cleanup，再用新值运行 setup。同一次 render 里 count 是快照，写两次 setCount(count + 1) 只加 1。下方区分两类：不需要 Effect 的情况，render 里能算的直接算、贵了再 memo，用户点击引发的提交放进事件处理器，不写「A 变了就 set B」的 Effect；需要 Effect 的是同步外部系统，比如连 WebSocket、订阅浏览器 API、控制非 React 组件、发曝光事件，setup 做什么 cleanup 就撤销什么。其他 Hook：useRef 改值不触发重新渲染，useReducer 适合多个事件驱动同一个状态机，useMemo 和 useCallback 只是性能优化，要先用 Profiler 证明值得',
};

export default (k) => {
  const s = [];
  s.push(k.panel({ x: 40, y: 112, w: 880, h: 96, label: 'Hook 只在顶层调用：React 按调用顺序认状态槽位', tone: 'info' }));
  ['① useState', '② useState', '③ useEffect', '④ 自定义 Hook'].forEach((t, i) => s.push(k.box({ x: 60 + i * 140, y: 150, w: 125, h: 40, title: t, titleSize: 'label', tone: 'info' })));
  s.push(k.text({ x: 630, y: 176, text: '不能放进条件、循环、提前 return 后', size: 'note', tone: 'bad' }));

  const main = [
    ['事件处理器', '调用 setter\n请求下一次渲染', 'muted'],
    ['更新队列', 'updater 依次执行\n拿最新待处理值', 'info'],
    ['render', '当次 props + state\n算出 UI 快照', 'accent'],
    ['commit', '更新 DOM\n宿主变化落地', 'info'],
    ['Effect', '先用旧值 cleanup\n再用新值 setup', 'ok'],
  ];
  main.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 180;
    s.push(k.box({ x, y: 236, w: 156, h: 88, title: t, sub, titleSize: 'body', tone, strong: t === 'render' }));
    if (i < 4) s.push(k.arrow({ points: [[x + 156, 280], [x + 180, 280]] }));
  });
  s.push(k.text({ x: 480, y: 356, text: 'count 是这次 render 的快照：写两次 setCount(count + 1) 只加 1', size: 'note', anchor: 'middle', tone: 'warn' }));

  s.push(k.box({ x: 40, y: 380, w: 430, h: 112, title: '不需要 Effect', sub: 'render 里能算的直接算，贵了再 memo\n用户点击的提交放进事件处理器\n别写「A 变了就 set B」的 Effect', titleSize: 'body', tone: 'warn' }));
  s.push(k.box({ x: 490, y: 380, w: 430, h: 112, title: '需要 Effect：同步外部系统', sub: '连 WebSocket、订阅浏览器 API\n控制非 React 组件、发曝光事件\nsetup 做什么，cleanup 就撤销什么', titleSize: 'body', tone: 'ok' }));

  return k.figure({
    h: 600,
    title: 'React Hooks：快照、提交和外部同步',
    subtitle: '每次渲染用当次 props 和 state 算快照；commit 更新宿主；Effect 只负责和外部系统同步',
    body: s.join('') + k.note({ x: 40, y: 516, w: 880, h: 52, lead: '其他 Hook：', text: 'useRef 改值不重渲染；useReducer 管状态机；memo 先用 Profiler 证明值得。' }),
  });
};
