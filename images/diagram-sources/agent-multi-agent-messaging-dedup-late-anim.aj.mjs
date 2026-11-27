import still from './agent-multi-agent-messaging-dedup-late-v2.aj.mjs';

export const meta = {
  name: 'agent-multi-agent-messaging-dedup-late-anim',
  article: 'knowledge/llm/agent/agent-multi-agent-messaging.md',
  alt: '多智能体消息时序（可逐步播放）：Planner 经中间件发出 task.requested（msg-01，planVersion 5）；Researcher 回 received 只表示收到；中间件重投 msg-01，Researcher 查已处理列表发现重复后丢弃；随后回报 running；Planner 改计划到 v6；按 v5 生成的结果迟到，Planner 比较版本后只记录、不覆盖新计划',
};

const A = 120, M = 370, B = 600;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const arrow = (x1, x2, y, label, tone, { dashed = false, at, flow } = {}) => k.arrow({
    points: [[x1, y], [x2, y]], tone, dashed, flow, label, labelAt: [at ?? (x1 + x2) / 2, y - 10], labelAnchor: 'middle',
  });
  // 时序图逐条累积：第 i 帧显示前 i 条，最新一条带流动点
  const MSGS = [
    (fl) => arrow(A, B, 196, 'task.requested · msg-01', 'accent', { at: (A + M) / 2, flow: fl }),
    (fl) => arrow(B, A, 246, 'received：只代表收到', 'info', { dashed: true, at: (A + M) / 2, flow: fl }),
    (fl) => arrow(M, B, 296, '重投 msg-01', 'bad', { dashed: true, flow: fl }) + k.text({ x: B - 12, y: 320, text: '按 messageId 去重，丢弃', size: 'note', tone: 'bad', anchor: 'end' }),
    (fl) => arrow(B, A, 360, 'progress：running', 'info', { at: (A + M) / 2, flow: fl }),
    () => k.box({ x: A - 70, y: 384, w: 140, h: 34, title: '改计划 → v6', titleSize: 'label', tone: 'accent', strong: true }),
    (fl) => arrow(B, A, 450, 'result（plan v5）迟到', 'bad', { at: (A + M) / 2, flow: fl }) + k.text({ x: A + 14, y: 470, text: 'v5 < v6：只记录，不覆盖新计划', size: 'note', tone: 'bad' }),
  ];
  const seq = (n) => MSGS.slice(0, n).map((m, i) => m(i === n - 1)).join('');
  const state = (seen, seenTone, plan, planTone) =>
    k.box({ x: 700, y: 346, w: 220, h: 56, title: 'Researcher 已处理', sub: seen, titleSize: 'label', tone: seenTone, align: 'start' }) +
    k.box({ x: 700, y: 414, w: 220, h: 56, title: 'Planner 当前计划', sub: plan, titleSize: 'label', tone: planTone, align: 'start' });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  const lanes = [];
  for (const [x, title] of [[A, 'Planner'], [M, '消息中间件'], [B, 'Researcher']]) {
    lanes.push(k.box({ x: x - 80, y: 108, w: 160, h: 44, title, titleSize: 'body', tone: x === M ? 'default' : 'accent' }));
  }
  // Planner 那条生命线在“改计划”方框处断开，其余整条
  lanes.push(`<line x1="${A}" y1="152" x2="${A}" y2="384" stroke="${k.t.faint}" stroke-width="2"/>`, `<line x1="${A}" y1="418" x2="${A}" y2="474" stroke="${k.t.faint}" stroke-width="2"/>`);
  for (const x of [M, B]) lanes.push(`<line x1="${x}" y1="152" x2="${x}" y2="474" stroke="${k.t.faint}" stroke-width="2"/>`);
  const env = [k.panel({ x: 700, y: 108, w: 220, h: 222, label: '消息信封' })];
  [['messageId', 'msg-01'], ['correlationId', 'task-42'], ['causationId', 'msg-00'], ['type', 'task.requested'], ['planVersion', '5']]
    .forEach(([key, v], i) => {
      env.push(k.text({ x: 716, y: 166 + i * 36, text: key, size: 'note', tone: 'muted', mono: true }));
      env.push(k.text({ x: 904, y: 166 + i * 36, text: v, size: 'note', mono: true, anchor: 'end' }));
    });

  return k.figure({
    h: 576,
    title: '多智能体消息：收到、进行中、结果分开记',
    subtitle: '投递至少一次：重复按 messageId 去重，迟到结果按版本对账',
    body: lanes.join('') + env.join('') + k.note({ x: 40, y: 500, w: 880, h: 52, lead: '最危险的误解：', text: '把“消息已收到”当成“任务已完成”，或把重投的消息当成新指令。' }),
    frames: [
      f('Planner 经中间件发出任务：信封里的 messageId 用来去重，planVersion 记下是按哪版计划派的', [seq(1), state('msg-01', 'ok', 'v5', 'default')]),
      f('Researcher 先回 received：这只说明消息到了，任务还没开始，更没完成', [seq(2), state('msg-01', 'ok', 'v5', 'default')]),
      f('中间件没收到确认，又把 msg-01 投了一遍；Researcher 查到已处理过，直接丢弃，不会再做一遍', [seq(3), state('msg-01 ← 重复，丢弃', 'bad', 'v5', 'default')]),
      f('Researcher 开始干活后回报 running：进度和结果是两种消息，分开记', [seq(4), state('msg-01', 'ok', 'v5', 'default')]),
      f('这时 Planner 根据新信息改了计划，版本升到 v6', [seq(5), state('msg-01', 'ok', 'v6', 'accent')]),
      f('按 v5 做出的结果这才送到：Planner 比较版本，v5 < v6，只记录下来，不拿它覆盖新计划', [seq(6), state('msg-01', 'ok', 'v6；v5 结果只记录', 'bad')]),
    ],
  });
};
