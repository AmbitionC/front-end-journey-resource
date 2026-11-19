export const meta = {
  name: 'rag-chunking-boundaries-overlap-v4',
  article: 'knowledge/llm/rag/rag-chunking.md',
  alt: '同一段 560 token 的文档用三种方式切分：固定 200 token 会把句子从中间切开；递归结构切分按段落切成两块并都带上标题路径，操作步骤和“仅限管理员”留在同一块；滑动窗口每块 200、重叠 40，边界附近内容出现两次。每个 chunk 带着 doc_id、标题路径、页码和权限一起向量化入库',
};

const X0 = 210, X1 = 920, TOTAL = 560;
const X = (t) => X0 + (t * (X1 - X0)) / TOTAL;
// 原文：标题 + 段落 1（句1、句2）+ 段落 2（操作步骤、仅管理员）
const SEG = [[0, 40, '标题'], [40, 160, '句 1'], [160, 300, '句 2'], [300, 460, '步骤'], [460, 560, '仅管理员']];

export default (k) => {
  const s = [];
  const bar = (a, b, y, h, title, tone = 'default', dashed = false) =>
    s.push(k.box({ x: X(a), y, w: X(b) - X(a), h, title, titleSize: 'label', tone, dashed }));
  const rowLabel = (y, title, sub) => {
    s.push(k.text({ x: 40, y: y + 18, text: title, size: 'label', weight: 600 }));
    if (sub) s.push(k.text({ x: 40, y: y + 40, text: sub, size: 'note', tone: 'muted' }));
  };

  rowLabel(124, '原文', '共 560 token');
  SEG.forEach(([a, b, t]) => bar(a, b, 124, 44, t));
  s.push(k.text({ x: X(170), y: 190, text: '段落 1', size: 'note', tone: 'muted', anchor: 'middle' }));
  s.push(k.text({ x: X(430), y: 190, text: '段落 2', size: 'note', tone: 'muted', anchor: 'middle' }));

  rowLabel(208, '固定 200 token', '实现简单，当基线');
  bar(0, 200, 208, 44, 'chunk 1'); bar(200, 400, 208, 44, 'chunk 2'); bar(400, 560, 208, 44, 'chunk 3');
  for (const t of [200, 400]) s.push(`<line x1="${X(t)}" y1="118" x2="${X(t)}" y2="258" stroke="${k.color('bad')}" stroke-width="2" stroke-dasharray="4 4"/>`);
  s.push(k.text({ x: X(560), y: 274, text: '红线：切在句子中间', size: 'note', tone: 'bad', anchor: 'end' }));

  rowLabel(292, '递归结构切分', '标题 → 段落 → 句子');
  bar(0, 300, 292, 44, '标题 + 段落 1', 'accent'); bar(300, 560, 292, 44, '标题路径 + 段落 2', 'accent');
  s.push(k.text({ x: X(560), y: 358, text: '步骤和“仅管理员”留在同一块', size: 'note', tone: 'accent', anchor: 'end' }));

  rowLabel(376, '滑动窗口', '每块 200，重叠 40');
  bar(0, 200, 376, 34, '窗口 1', 'info'); bar(320, 520, 376, 34, '窗口 3', 'info');
  bar(160, 360, 416, 34, '窗口 2', 'info'); bar(480, 560, 416, 34, '窗口 4', 'info');
  s.push(k.text({ x: X(0), y: 474, text: '重叠区内容出现两次：边界更保险，但块数、成本和重复召回都会增加', size: 'note', tone: 'muted' }));

  s.push(k.box({ x: 40, y: 494, w: 400, h: 60, title: '每个 chunk 带元数据入库', sub: 'doc_id · 标题路径 · 页码 · acl', titleSize: 'body' }));
  s.push(k.box({ x: 500, y: 494, w: 160, h: 60, title: 'Embedding', titleSize: 'body' }));
  s.push(k.box({ x: 720, y: 494, w: 200, h: 60, title: '向量索引', titleSize: 'body' }));
  s.push(k.arrow({ points: [[440, 524], [500, 524]] }));
  s.push(k.arrow({ points: [[660, 524], [720, 524]] }));

  return k.figure({
    h: 650,
    title: 'Chunking：先保结构，再控 token',
    subtitle: '同一段文档的三种切法；横向长度按 token 数示意',
    body: s.join('') + k.note({ x: 40, y: 576, w: 880, h: 52, lead: '重叠不是越大越好：', text: '优先用结构边界避免切断语义，重叠只在窗口边界做有限补救。' }),
  });
};
