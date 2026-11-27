import still from './agent-trace-model-span-waterfall-v2.aj.mjs';

export const meta = {
  name: 'agent-trace-model-span-waterfall-anim',
  article: 'knowledge/llm/production/agent-trace-model.md',
  alt: 'Agent Trace 瀑布图逐段展开（可逐步播放）：agent.invoke 根 Span 先打开并分配 traceId；planner.decide、retrieval.search 依次完成；model.generate 中途记下首 token 到达这个 Event；tool.execute 下先有 approval.wait 子 Span，审批通过是一个 Event，再有 http.client 子 Span，其中记下重试被调度；最后 response.validate 完成、根 Span 关闭；下方区分 Run、Span 和 Event',
};

const ROWS = [
  ['agent.invoke', 0, 280, 920, 'accent'],
  ['planner.decide', 1, 290, 360, 'info'],
  ['retrieval.search', 1, 366, 460, 'info'],
  ['model.generate', 1, 466, 640, 'info'],
  ['tool.execute', 1, 646, 866, 'warn'],
  ['approval.wait', 2, 652, 760, 'warn'],
  ['http.client', 2, 766, 860, 'warn'],
  ['response.validate', 1, 872, 916, 'ok'],
];
const Y = (i) => 160 + i * 48;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const T = k.t;
  const tree = (now) => ROWS.map(([name, ind, x0, x1, tone], i) => {
    if (now <= x0) return '';
    const e = Math.min(now, x1), done = now >= x1;
    return k.text({ x: 40 + ind * 22, y: Y(i) + 20, text: name, size: 'label', mono: true, tone: ind ? 'sec' : undefined }) +
      `<rect x="${x0}" y="${Y(i)}" width="${Math.max(3, e - x0)}" height="28" rx="5" fill="${T[tone]}" fill-opacity="${done ? 0.32 : 0.16}" stroke="${T[tone]}" stroke-width="1.5"${done ? '' : ' stroke-dasharray="4 3"'}/>`;
  }).join('');
  const dot = (x, i) => `<circle cx="${x}" cy="${Y(i) + 14}" r="5.5" fill="${T.text}" stroke="${T.bg}" stroke-width="2"/>`;
  const events = (now) => [
    now >= 500 ? dot(500, 3) + k.text({ x: 652, y: Y(3) + 20, text: '● 首 token 到达', size: 'note', tone: 'sec' }) : '',
    now >= 754 ? dot(754, 5) + k.text({ x: 640, y: Y(5) + 20, text: '审批通过 ●', size: 'note', tone: 'sec', anchor: 'end' }) : '',
    now >= 800 ? dot(800, 6) + k.text({ x: 754, y: Y(6) + 20, text: '重试被调度 ●', size: 'note', tone: 'sec', anchor: 'end' }) : '',
  ].join('');
  const cursor = (now) => k.keyed('now', `<line x1="${now}" y1="144" x2="${now}" y2="156" stroke="${k.color('warn')}" stroke-width="3"/>`);
  const defs = (hot) => [
    ['Run', '产品语义上的一次执行\n可跨多条 Trace，用 runId 关联', 'accent'],
    ['Span', '有开始和结束的一段工作\n自己的 spanId + 父 Span', 'info'],
    ['Event ●', 'Span 内某一刻的事实\n不要伪装成瞬时 Span', 'muted'],
  ].map(([t, sub, tone], i) => k.box({ x: 40 + i * 300, y: 556, w: 280, h: 84, title: t, sub, titleSize: 'body', tone, strong: hot === i })).join('');
  const f = (caption, now, hot = -1) => ({ caption, body: tree(now) + events(now) + (now < 920 ? cursor(now) : '') + defs(hot) });

  return k.figure({
    h: 750,
    title: 'Agent Trace：Run、Trace、Span 与 Event',
    subtitle: '一次带工具的回答：同一个 Trace ID 下的 Span 树，圆点是 Span 内的点状事件',
    body: [
      k.text({ x: 40, y: 132, text: 'traceId 4bf92f…（整棵树共享）', size: 'label', tone: 'muted', mono: true }),
      k.text({ x: 920, y: 132, text: '时间 →', size: 'label', tone: 'muted', anchor: 'end' }),
      k.note({ x: 40, y: 664, w: 880, h: 52, lead: '怎么划 Span：', text: '有独立的依赖、超时、重试、成本、权限或失败责任，任一项为「是」就单独成 Span。' }),
    ].join(''),
    frames: [
      f('请求进来，先打开根 Span agent.invoke，分配 traceId：后面所有 Span 都挂在这棵树上', 286),
      f('planner.decide 决定要查资料、再调工具；retrieval.search 去检索：两个兄弟 Span 依次完成', 462),
      f('model.generate 生成中，首 token 到达只是一个时间点，记成 Span 里的 Event，不单独开 Span', 642, 2),
      f('tool.execute 需要人工审批：approval.wait 是独立的子 Span，因为它有自己的超时和责任人；审批通过记为 Event', 764, 1),
      f('审批后发 HTTP 请求：http.client 第一次失败，“重试被调度”记成 Event，整段仍是一个 Span', 868, 2),
      f('response.validate 校验通过，根 Span 关闭：整棵树共享同一个 traceId，按父子关系就能看出谁慢、谁错', 920),
      f('一次产品上的“运行”（Run）可能跨多条 Trace，用 runId 串起来；Span 有起止，Event 只是 Span 里的一个点', 920, 0),
    ],
  });
};
