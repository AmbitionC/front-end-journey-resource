import still from './ai-observability-trace-waterfall-v3.aj.mjs';

export const meta = {
  name: 'ai-observability-trace-waterfall-anim',
  article: 'knowledge/llm/production/ai-observability.md',
  alt: 'Agent 请求的 trace 瀑布图逐段长出来（可逐步播放）：用户请求开始时建根 span 和 trace_id；规划步骤里的模型调用结束后挂上模型版本、token、首 token 延迟和成本；回答步骤里依次跑检索、工具调用和生成答案，每个 span 结束时记录各自属性；请求结束后整棵树完整，再按用户和功能汇总成指标，PII 上报前脱敏',
};

const Y0 = 152, RP = 38, BX = 380, BW = 260;
const ROWS = [
  [0, 'user-request', 0, 100, 'muted', 'trace_id = 7f3a…'],
  [1, 'agent step · 规划', 2, 30, 'accent', ''],
  [2, 'model call · llm-plan', 4, 28, 'info', '模型版本、token、TTFT、成本'],
  [1, 'agent step · 回答', 32, 98, 'accent', ''],
  [2, 'rag-retrieval', 34, 50, 'info', '配置的 top_k、返回文档数'],
  [2, 'tool-search', 52, 72, 'warn', '输入校验、执行状态、耗时'],
  [2, 'model call · llm-answer', 74, 97, 'info', '模型版本、token、成本'],
];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const tree = (now) => ROWS.map(([d, label, a, b, tone, attr], i) => {
    if (now < a) return '';
    const y = Y0 + i * RP, end = Math.min(now, b), done = now >= b;
    const x1 = BX + (a / 100) * BW, w = Math.max(3, ((end - a) / 100) * BW);
    let s = k.text({ x: 44 + d * 24, y: y + 22, text: label, size: 'label', mono: true, tone: tone === 'muted' ? undefined : tone });
    s += `<rect x="${x1}" y="${y + 8}" width="${w}" height="20" rx="4" fill="${k.t[tone]}" fill-opacity="${done ? 0.35 : 0.18}" stroke="${k.t[tone]}" stroke-width="1.2"${done ? '' : ' stroke-dasharray="4 3"'}/>`;
    // 根 span 一开始就带 trace_id；其余 span 结束时才写入属性
    if (attr && (done || i === 0)) s += k.text({ x: 664, y: y + 22, text: attr, size: 'note', tone: 'sec' });
    else if (!done && i !== 0) s += k.text({ x: 664, y: y + 22, text: '进行中…', size: 'note', tone: 'muted' });
    return s;
  }).join('');
  const now = (t) => k.keyed('now', `<line x1="${BX + (t / 100) * BW}" y1="142" x2="${BX + (t / 100) * BW}" y2="${Y0 + ROWS.length * RP + 4}" stroke="${k.color('warn')}" stroke-width="2"/>`);
  const box = (hot) => k.box({ x: 40, y: 478, w: 430, h: 84, title: 'Metrics：按用户、功能拆分', sub: 'TTFT P95、token / 请求、成本 / 会话\n工具调用次数（识别失控循环）', titleSize: 'body', tone: 'info', strong: hot }) +
    k.box({ x: 490, y: 478, w: 430, h: 84, title: 'Span 输入：PII 先脱敏', sub: '手机号、身份证号等不直接进 trace\n上报前脱敏，或配置字段过滤', titleSize: 'body', tone: 'warn', strong: hot });
  const f = (caption, t, hot = false) => ({ caption, body: tree(t) + (t < 100 ? now(t) : '') + box(hot) });

  return k.figure({
    h: 600,
    title: 'LLM 可观测性：一次请求拆成一棵 trace 树',
    subtitle: '模型调用、检索、工具和 agent step 都是 span；token、成本和版本挂在对应 span 上',
    body: [
      ...[[40, '跨度（缩进 = 父子关系）'], [BX, '时间线'], [664, '关键属性']].map(([x, t]) => k.text({ x, y: 134, text: t, size: 'label', tone: 'muted' })),
      `<line x1="${BX}" y1="${Y0 + ROWS.length * RP + 4}" x2="${BX + BW}" y2="${Y0 + ROWS.length * RP + 4}" stroke="${k.t.line}" stroke-width="1"/>`,
    ].join(''),
    frames: [
      f('请求一进来就建根 span，生成全局 trace_id；后面每个子 span 都带着它，才能串成一棵树', 1),
      f('规划步骤里调了一次模型：这个 span 结束时记下模型版本、token、首 token 延迟和成本', 30),
      f('进入回答步骤，先做检索：记录配置的 top_k 和实际返回了几篇文档', 50),
      f('接着调工具：输入校验结果、执行状态、耗时都挂在这个 span 上；慢在哪一段一眼能看出', 72),
      f('最后一次模型调用生成答案，根 span 关闭：一次请求完整地摊成一张瀑布图', 100),
      f('单条 trace 用来排查；大量 trace 再按用户、功能汇总成指标。写入前先把 PII 脱敏', 100, true),
    ],
  });
};
