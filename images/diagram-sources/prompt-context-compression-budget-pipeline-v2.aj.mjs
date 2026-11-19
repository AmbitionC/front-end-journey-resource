export const meta = {
  name: 'prompt-context-compression-budget-pipeline-v2',
  article: 'knowledge/llm/prompt/prompt-context-compression.md',
  alt: '原始上下文分成保护区和候选区：系统指令、用户目标、关键事实与引文、权限与来源 ID 原样进入预算；重复历史、寒暄、低相关片段等候选先排序，再删除、抽取，必要时才摘要；组成预算内上下文后做任务评估和保真检查，不过就降低压缩率或重新检索',
};

const seg = (k, x, y, w, h, label, tone, dashed = false) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tone === 'muted' ? k.t.box : k.color(tone)}" fill-opacity="${tone === 'muted' ? 1 : 0.16}" stroke="${tone === 'muted' ? k.t.line : k.color(tone)}" stroke-width="1.2"${dashed ? ' stroke-dasharray="5 4"' : ''}/>` +
  k.text({ x: x + w / 2, y: y + h / 2 + 6, text: label, size: 'label', anchor: 'middle', tone: tone === 'muted' ? 'sec' : tone });

const prot = ['系统指令', '用户目标', '关键事实与引文', '权限与来源 ID'];
const cand = ['重复历史', '寒暄', '低相关片段', '可重取的中间结果'];

export default (k) => k.figure({
  h: 610,
  title: '上下文压缩：先保护，再删减',
  subtitle: '先给指令、问题、输出和余量留好 token，剩下的预算才分给证据和历史',
  body: [
    k.text({ x: 125, y: 128, text: '原始上下文', size: 'label', tone: 'muted', anchor: 'middle' }),
    ...prot.map((t, i) => seg(k, 40, 140 + i * 36, 170, 36, t, 'accent')),
    ...cand.map((t, i) => seg(k, 40, 284 + i * 36, 170, 36, t, 'muted')),

    k.arrow({ points: [[214, 212], [756, 212]], tone: 'accent', label: '保护区：可以缩短，但语义和出处不能丢', labelAt: [485, 202] }),

    k.arrow({ points: [[214, 356], [236, 356]] }),
    k.box({ x: 240, y: 324, w: 120, h: 64, title: '排序', sub: '相关度、来源', titleSize: 'body' }),
    k.arrow({ points: [[360, 356], [386, 356]] }),
    k.box({ x: 390, y: 324, w: 100, h: 64, title: '删除', sub: '最便宜', titleSize: 'body' }),
    k.arrow({ points: [[490, 356], [516, 356]] }),
    k.box({ x: 520, y: 324, w: 100, h: 64, title: '抽取', sub: '保留原句', titleSize: 'body' }),
    k.arrow({ points: [[620, 356], [646, 356]] }),
    k.box({ x: 650, y: 324, w: 90, h: 64, title: '摘要', sub: '必要时', titleSize: 'body', dashed: true }),
    k.arrow({ points: [[740, 356], [756, 356]] }),
    k.text({ x: 240, y: 312, text: '候选区：按顺序逐步压缩', size: 'note', tone: 'muted' }),

    k.text({ x: 840, y: 128, text: '预算内上下文', size: 'label', tone: 'muted', anchor: 'middle' }),
    seg(k, 760, 140, 160, 96, '固定预留', 'muted', true),
    seg(k, 760, 236, 160, 96, '保护信息', 'accent'),
    seg(k, 760, 332, 160, 96, '压缩后的候选', 'info'),

    k.arrow({ points: [[840, 428], [840, 448]] }),
    k.box({ x: 600, y: 452, w: 320, h: 60, title: '任务评估 + 保真检查', sub: '证据、顺序、引用还在吗', titleSize: 'body' }),
    k.arrow({ points: [[600, 482], [300, 482], [300, 392]], tone: 'bad', dashed: true, label: '不过：降压缩率或重新检索', labelAt: [450, 474] }),

    k.note({ x: 40, y: 532, w: 880, h: 54, lead: '别只追压缩比例：', text: '以任务正确率和证据保真为约束，每个请求需要的最小上下文都不同。' }),
  ].join(''),
});
