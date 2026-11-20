export const meta = {
  name: 'context-engineering-gather-select-compress-verify-v2',
  article: 'knowledge/llm/agent/context-engineering.md',
  alt: '上下文工程四步：收集检索、工具和记忆里的候选信息，按相关性与可信度筛选，压缩时保留出处，调用前后校验；候选量逐步下降到上下文预算以内，重复、过期、无权限的内容被丢弃，缺证据时回到收集',
};

const stages = [
  ['收集 Gather', '检索、工具、记忆', 170, 'warn'],
  ['筛选 Select', '相关性、可信度', 110, 'warn'],
  ['压缩 Compress', '保留出处', 64, 'accent'],
  ['校验 Verify', '调用前后都查', 64, 'ok'],
];
const X = (i) => 40 + i * 230, BASE = 440, BUDGET = 76;

export default (k) => k.figure({
  h: 580,
  title: '上下文工程：收集、筛选、压缩、校验',
  subtitle: '目标是在固定预算里放进“刚好够用、有出处”的信息',
  body: [
    k.arrow({ points: [[830, 136], [830, 112], [130, 112], [130, 132]], tone: 'bad', dashed: true, label: '缺证据：回去补', labelAt: [480, 104] }),
    ...stages.map(([t, s, , tone], i) => k.box({ x: X(i), y: 136, w: 180, h: 64, title: t, sub: s, titleSize: 'body', tone: i === 3 ? 'ok' : 'default' })),
    ...[0, 1, 2].map((i) => k.arrow({ points: [[X(i) + 180, 168], [X(i) + 226, 168]] })),

    k.text({ x: 40, y: 250, text: '候选信息量', size: 'label', tone: 'muted' }),
    `<line x1="40" y1="${BASE}" x2="920" y2="${BASE}" stroke="${k.t.line}"/>`,
    ...stages.map(([, , h, tone], i) => `<rect x="${X(i) + 60}" y="${BASE - h}" width="60" height="${h}" rx="4" fill="${k.color(tone)}" fill-opacity="0.55"/>`),
    `<line x1="40" y1="${BASE - BUDGET}" x2="920" y2="${BASE - BUDGET}" stroke="${k.t.accent}" stroke-width="1.6" stroke-dasharray="7 5"/>`,
    k.text({ x: 920, y: BASE - BUDGET - 10, text: '上下文预算', size: 'label', tone: 'accent', anchor: 'end' }),
    k.text({ x: X(1) + 90, y: BASE + 28, text: '丢掉重复、过期、无权限', size: 'label', tone: 'sec', anchor: 'middle' }),
    k.text({ x: X(2) + 90, y: BASE + 28, text: '摘要或抽取，留来源 ID', size: 'label', tone: 'sec', anchor: 'middle' }),
    k.text({ x: X(0) + 90, y: BASE + 28, text: '超出预算很多', size: 'label', tone: 'sec', anchor: 'middle' }),
    k.text({ x: X(3) + 90, y: BASE + 28, text: '在预算内，可追溯', size: 'label', tone: 'sec', anchor: 'middle' }),

    k.note({ x: 40, y: 500, w: 880, h: 56, lead: '上下文不是越多越好：', text: '每一段都要说得出为什么放在这里、来自哪里。' }),
  ].join(''),
});
