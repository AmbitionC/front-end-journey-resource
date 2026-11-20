export const meta = {
  name: 'agent-multi-agent-messaging-dedup-late-v2',
  article: 'knowledge/llm/agent/agent-multi-agent-messaging.md',
  alt: 'Planner 经消息中间件向 Researcher 发出 task.requested，信封带 messageId、correlationId、causationId、type 和 planVersion；Researcher 回 received 只表示收到；中间件重投同一条消息，Researcher 按 messageId 去重丢弃；随后回报 running；Planner 改计划到版本 6 后，按版本 5 生成的结果迟到，只记录不覆盖新计划',
};

const A = 120, M = 370, B = 600;

export default (k) => {
  const s = [];
  const lane = (x, title, tone) => {
    s.push(k.box({ x: x - 80, y: 108, w: 160, h: 44, title, titleSize: 'body', tone }));
    const gaps = x === A ? [[152, 384], [418, 474]] : [[152, 474]];
    for (const [y1, y2] of gaps) s.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${k.t.faint}" stroke-width="2"/>`);
  };
  lane(A, 'Planner', 'accent'); lane(M, '消息中间件'); lane(B, 'Researcher', 'accent');
  const msg = (x1, x2, y, label, tone, { dashed = false, at } = {}) => s.push(k.arrow({
    points: [[x1, y], [x2, y]], tone, dashed, label, labelAt: [at ?? (x1 + x2) / 2, y - 10], labelAnchor: 'middle',
  }));

  msg(A, B, 196, 'task.requested · msg-01', 'accent', { at: (A + M) / 2 });
  msg(B, A, 246, 'received：只代表收到', 'info', { dashed: true, at: (A + M) / 2 });
  msg(M, B, 296, '重投 msg-01', 'bad', { dashed: true });
  s.push(k.text({ x: B - 12, y: 320, text: '按 messageId 去重，丢弃', size: 'note', tone: 'bad', anchor: 'end' }));
  msg(B, A, 360, 'progress：running', 'info', { at: (A + M) / 2 });
  s.push(k.box({ x: A - 70, y: 384, w: 140, h: 34, title: '改计划 → v6', titleSize: 'label', tone: 'accent', strong: true }));
  msg(B, A, 450, 'result（plan v5）迟到', 'bad', { at: (A + M) / 2 });
  s.push(k.text({ x: A + 14, y: 470, text: 'v5 < v6：只记录，不覆盖新计划', size: 'note', tone: 'bad' }));

  s.push(k.panel({ x: 700, y: 108, w: 220, h: 222, label: '消息信封' }));
  [['messageId', 'msg-01'], ['correlationId', 'task-42'], ['causationId', 'msg-00'], ['type', 'task.requested'], ['planVersion', '5']]
    .forEach(([key, v], i) => {
      s.push(k.text({ x: 716, y: 166 + i * 36, text: key, size: 'note', tone: 'muted', mono: true }));
      s.push(k.text({ x: 904, y: 166 + i * 36, text: v, size: 'note', mono: true, anchor: 'end' }));
    });

  return k.figure({
    h: 576,
    title: '多智能体消息：收到、进行中、结果分开记',
    subtitle: '投递至少一次：重复按 messageId 去重，迟到结果按版本对账',
    body: s.join('') + k.note({ x: 40, y: 500, w: 880, h: 52, lead: '最危险的误解：', text: '把“消息已收到”当成“任务已完成”，或把重投的消息当成新指令。' }),
  });
};
