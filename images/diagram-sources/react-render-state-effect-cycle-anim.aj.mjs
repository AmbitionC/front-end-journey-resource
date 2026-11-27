import still from './react-render-state-effect-cycle-v2.aj.mjs';

export const meta = {
  name: 'react-render-state-effect-cycle-anim',
  article: 'knowledge/framework/react/react-hooks.md',
  alt: 'React 一轮更新逐步演示（可逐步播放）：渲染时 React 按调用顺序认出各 Hook 的状态槽位；点击时事件处理器里 count 是快照 0，连写两次 setCount(count + 1) 都是 setCount(1)；更新队列处理完得到 1 而不是 2；render 用 count 为 1 算出 UI 快照；commit 把 DOM 从 0 改成 1；Effect 先用旧值 0 cleanup，再用新值 1 setup；换成 setCount(c => c + 1) 写两次，updater 依次拿到 0、1，结果是 2',
};

const MAIN = [['事件处理器', 'muted'], ['更新队列', 'info'], ['render', 'accent'], ['commit', 'info'], ['Effect', 'ok']];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  s.push(k.panel({ x: 40, y: 112, w: 880, h: 96, label: 'Hook 只在顶层调用：React 按调用顺序认状态槽位', tone: 'info' }));
  ['① useState', '② useState', '③ useEffect', '④ 自定义 Hook'].forEach((t, i) => s.push(k.box({ x: 60 + i * 140, y: 150, w: 125, h: 40, title: t, titleSize: 'label', tone: 'info' })));
  s.push(k.text({ x: 630, y: 176, text: '不能放进条件、循环、提前 return 后', size: 'note', tone: 'bad' }));


  s.push(k.box({ x: 40, y: 380, w: 430, h: 112, title: '不需要 Effect', sub: 'render 里能算的直接算，贵了再 memo\n用户点击的提交放进事件处理器\n别写「A 变了就 set B」的 Effect', titleSize: 'body', tone: 'warn' }));
  s.push(k.box({ x: 490, y: 380, w: 430, h: 112, title: '需要 Effect：同步外部系统', sub: '连 WebSocket、订阅浏览器 API\n控制非 React 组件、发曝光事件\nsetup 做什么，cleanup 就撤销什么', titleSize: 'body', tone: 'ok' }));

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  // subs：五个阶段框里的文字；cur：当前阶段
  const flow = (subs, cur) => MAIN.map(([t, tone], i) => {
    const x = 40 + i * 180;
    return k.box({ x, y: 236, w: 156, h: 88, title: t, sub: subs[i], titleSize: 'body', tone, strong: i === cur }) +
      (i < 4 ? k.arrow({ points: [[x + 156, 280], [x + 180, 280]], flow: i === cur - 1 }) : '') +
      (i === cur ? hl('cur', x, 236, 156, 88) : '');
  }).join('');
  const tip = (text, tone = 'warn') => k.text({ x: 480, y: 356, text, size: 'note', anchor: 'middle', tone });
  const IDLE = ['调用 setter\n请求下一次渲染', 'updater 依次执行\n拿最新待处理值', '当次 props + state\n算出 UI 快照', '更新 DOM\n宿主变化落地', '依赖变了先 cleanup\n再用新值 setup'];
  const S = (i, text) => IDLE.map((x, j) => (j === i ? text : x));
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 600,
    title: 'React Hooks：快照、提交和外部同步',
    subtitle: '每次渲染用当次 props 和 state 算快照；commit 更新宿主；Effect 只负责和外部系统同步',
    body: s.join('') + k.note({ x: 40, y: 516, w: 880, h: 52, lead: '其他 Hook：', text: 'useRef 改值不重渲染；useReducer 管状态机；memo 先用 Profiler 证明值得。' }),
    frames: [
      f('每次渲染，React 都按调用顺序把第 1、2、3、4 个 Hook 对上各自的状态槽位：顺序一变，状态就串了', [hl('slots', 56, 146, 556, 48), flow(IDLE, -1), tip('count 当前是 0', 'muted')]),
      f('用户点了按钮：处理器里的 count 是这次渲染的快照 0，连写两次 setCount(count + 1)，其实是两次 setCount(1)', [flow(S(0, 'count = 0（快照）\nsetCount(1) × 2'), 0), tip('setter 只是请求下一次渲染，count 不会马上变')]),
      f('两个更新进队列，依次处理：1，再 1。结果是 1，不是 2', [flow(S(1, '[ 1, 1 ]\n→ 下次 count = 1'), 1), tip('写两次 setCount(count + 1) 只加 1')]),
      f('render 用 count = 1 重新算出整棵 UI 的快照：纯计算，不碰 DOM，也不发请求', [flow(S(2, 'count = 1\n算出显示 1 的快照'), 2), tip('render 可能被打断、重来，所以必须纯')]),
      f('commit 把差异落到 DOM：页面上的 0 变成 1', [flow(S(3, 'DOM：0 → 1'), 3), tip('浏览器这时才看到变化', 'muted')]),
      f('Effect 依赖了 count，变了：先用旧值 0 跑 cleanup，再用新值 1 跑 setup', [flow(S(4, 'cleanup(0)\nsetup(1)'), 4), tip('setup 做什么，cleanup 就撤销什么', 'ok')]),
      f('换成 setCount(c => c + 1) 写两次：队列里的 updater 依次拿到最新待处理值 0、1，最后是 2', [flow(S(1, 'c => c + 1 两次\n0 → 1 → 2'), 1), tip('依赖上一个值时用函数式 updater', 'ok')]),
    ],
  });
};
