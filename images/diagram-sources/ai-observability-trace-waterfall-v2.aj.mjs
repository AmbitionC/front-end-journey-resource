export const meta = {
  name: 'ai-observability-trace-waterfall-v2',
  article: 'knowledge/llm/production/ai-observability.md',
  alt: '一次 Agent 请求的 trace 瀑布图：根 span 是用户请求，带全局 trace_id；下面有规划和回答两个 agent step；规划步骤里有一次模型调用，记录模型版本、token、首 token 延迟和成本；回答步骤里依次是检索（记录索引版本和 top_k）、工具调用 search（记录状态和重试次数，其下还有一次数据库查询）和生成答案的模型调用。缩进表示父子关系，横条表示各 span 在时间线上的起止。指标按用户和功能拆分，看首 token 延迟 P95、每请求 token、每会话成本和工具调用次数；日志带 trace_id 和 span_id 关联，prompt 和正文等敏感字段要先脱敏再记录',
};

export default (k) => {
  const s = [], Y0 = 152, RP = 38, BX = 380, BW = 260;
  [[40, '跨度（缩进 = 父子关系）'], [BX, '时间线'], [664, '关键属性']].forEach(([x, t]) => s.push(k.text({ x, y: 134, text: t, size: 'label', tone: 'muted' })));
  const rows = [
    [0, 'user-request', 0, 100, 'muted', 'trace_id = 7f3a…'],
    [1, 'agent step · 规划', 2, 30, 'accent', ''],
    [2, 'model call · llm-plan', 4, 28, 'info', '模型版本、token、TTFT、成本'],
    [1, 'agent step · 回答', 32, 98, 'accent', ''],
    [2, 'retrieval · rag', 34, 50, 'info', '索引版本、top_k'],
    [2, 'tool call · search', 52, 72, 'warn', '状态、重试次数'],
    [3, 'db query', 56, 68, 'muted', ''],
    [2, 'model call · llm-answer', 74, 97, 'info', '模型版本、token、成本'],
  ];
  rows.forEach(([d, label, a, b, tone, attr], i) => {
    const y = Y0 + i * RP;
    s.push(k.text({ x: 44 + d * 24, y: y + 22, text: label, size: 'label', mono: true, tone: tone === 'muted' ? undefined : tone }));
    const x1 = BX + (a / 100) * BW, w = ((b - a) / 100) * BW;
    s.push(`<rect x="${x1}" y="${y + 8}" width="${w}" height="20" rx="4" fill="${k.t[tone]}" fill-opacity="0.35" stroke="${k.t[tone]}" stroke-width="1.2"/>`);
    if (attr) s.push(k.text({ x: 664, y: y + 22, text: attr, size: 'note', tone: 'sec' }));
  });
  s.push(`<line x1="${BX}" y1="${Y0 + rows.length * RP + 4}" x2="${BX + BW}" y2="${Y0 + rows.length * RP + 4}" stroke="${k.t.line}" stroke-width="1"/>`);

  s.push(k.box({ x: 40, y: 478, w: 430, h: 84, title: 'Metrics：按用户、功能拆分', sub: 'TTFT P95、token / 请求、成本 / 会话\n工具调用次数（识别失控循环）', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 490, y: 478, w: 430, h: 84, title: 'Logs：带 trace_id、span_id 关联', sub: 'prompt、正文等敏感字段\n先脱敏（redact）再记录', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 600,
    title: 'LLM 可观测性：一次请求拆成一棵 trace 树',
    subtitle: '模型调用、检索、工具和 agent step 都是 span；token、成本和版本挂在对应 span 上',
    body: s.join(''),
  });
};
