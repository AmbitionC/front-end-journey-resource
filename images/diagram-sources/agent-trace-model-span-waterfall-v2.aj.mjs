export const meta = {
  name: 'agent-trace-model-span-waterfall-v2',
  article: 'knowledge/llm/production/agent-trace-model.md',
  alt: '一次带工具的 Agent 回答画成 Trace 瀑布图。整棵树共享同一个 Trace ID。agent.invoke 是根 Span，覆盖整个时间轴；它下面依次是 planner.decide、retrieval.search、model.generate、tool.execute 和 response.validate；tool.execute 下面还有 approval.wait 和 http.client 两个子 Span。圆点表示 Event，是 Span 内某一刻的事实：model.generate 里的首 token 到达、approval.wait 结束时的审批通过、http.client 里的重试被调度。下方区分三个对象：Run 是产品语义上的一次执行，可以跨多条 Trace，用 runId 关联；Span 是有开始和结束的一段工作，有自己的 spanId 和父 Span；Event 是 Span 内某一刻的点状事实，不要伪装成瞬时 Span。划分 Span 的判断法：某段工作只要有独立的依赖、超时、重试、成本、权限或失败责任中的任一项，就值得单独成 Span',
};

export default (k) => {
  const s = [];
  const T = k.t;
  s.push(k.text({ x: 40, y: 132, text: 'traceId 4bf92f…（整棵树共享）', size: 'label', tone: 'muted', mono: true }));
  s.push(k.text({ x: 920, y: 132, text: '时间 →', size: 'label', tone: 'muted', anchor: 'end' }));

  const rows = [
    ['agent.invoke', 0, 280, 920, 'accent'],
    ['planner.decide', 1, 290, 360, 'info'],
    ['retrieval.search', 1, 366, 460, 'info'],
    ['model.generate', 1, 466, 640, 'info'],
    ['tool.execute', 1, 646, 866, 'warn'],
    ['approval.wait', 2, 652, 760, 'warn'],
    ['http.client', 2, 766, 860, 'warn'],
    ['response.validate', 1, 872, 916, 'ok'],
  ];
  rows.forEach(([name, ind, x0, x1, tone], i) => {
    const y = 160 + i * 48;
    s.push(k.text({ x: 40 + ind * 22, y: y + 20, text: name, size: 'label', mono: true, tone: ind ? 'sec' : undefined }));
    s.push(`<rect x="${x0}" y="${y}" width="${x1 - x0}" height="28" rx="5" fill="${T[tone]}" fill-opacity="0.32" stroke="${T[tone]}" stroke-width="1.5"/>`);
  });
  const dot = (x, i) => `<circle cx="${x}" cy="${160 + i * 48 + 14}" r="5.5" fill="${T.text}" stroke="${T.bg}" stroke-width="2"/>`;
  s.push(dot(500, 3), k.text({ x: 652, y: 160 + 3 * 48 + 20, text: '● 首 token 到达', size: 'note', tone: 'sec' }));
  s.push(dot(754, 5), k.text({ x: 640, y: 160 + 5 * 48 + 20, text: '审批通过 ●', size: 'note', tone: 'sec', anchor: 'end' }));
  s.push(dot(800, 6), k.text({ x: 754, y: 160 + 6 * 48 + 20, text: '重试被调度 ●', size: 'note', tone: 'sec', anchor: 'end' }));

  const defs = [
    ['Run', '产品语义上的一次执行\n可跨多条 Trace，用 runId 关联', 'accent'],
    ['Span', '有开始和结束的一段工作\n自己的 spanId + 父 Span', 'info'],
    ['Event ●', 'Span 内某一刻的事实\n不要伪装成瞬时 Span', 'muted'],
  ];
  defs.forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 300, y: 556, w: 280, h: 84, title: t, sub, titleSize: 'body', tone })));

  return k.figure({
    h: 750,
    title: 'Agent Trace：Run、Trace、Span 与 Event',
    subtitle: '一次带工具的回答：同一个 Trace ID 下的 Span 树，圆点是 Span 内的点状事件',
    body: s.join('') + k.note({ x: 40, y: 664, w: 880, h: 52, lead: '怎么划 Span：', text: '有独立的依赖、超时、重试、成本、权限或失败责任，任一项为「是」就单独成 Span。' }),
  });
};
