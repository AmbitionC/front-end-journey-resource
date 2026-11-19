export const meta = {
  name: 'rag-hybrid-search-pipeline-v3',
  article: 'knowledge/llm/rag/rag-hybrid-search.md',
  alt: '混合检索流水线：查询先按租户、权限、版本和时间过滤，再并行走 BM25 和向量检索；示例中 BM25 排名 A、B、C，向量排名 C、A、D，用 RRF（k=60）按名次融合得到 A、C、B、D，再重排并组装上下文',
};

const row = (k, x, y, rank, id, tone, score) =>
  k.text({ x, y, text: `${rank}`, size: 'label', tone: 'muted' }) +
  k.text({ x: x + 28, y, text: id, size: 'body', weight: 600, tone }) +
  (score ? k.text({ x: x + 128, y, text: score, size: 'label', tone: 'sec', anchor: 'end', mono: true }) : '');

export default (k) => k.figure({
  h: 560,
  title: '混合检索：先过滤，再并行召回，按名次融合',
  subtitle: '例子：BM25 和向量各返回 3 条，A、C 两边都排得靠前，融合后排在最前面',
  body: [
    k.box({ x: 40, y: 236, w: 120, h: 60, title: '查询', titleSize: 'body' }),
    k.arrow({ points: [[160, 266], [186, 266]] }),
    k.box({ x: 190, y: 220, w: 140, h: 92, title: '过滤', sub: '租户、权限\n版本、时间', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[330, 266], [350, 266]], head: false }),
    `<path d="M350,195 V375" fill="none" stroke="${k.t.line}" stroke-width="1.7"/>`,
    k.arrow({ points: [[350, 195], [366, 195]] }),
    k.arrow({ points: [[350, 375], [366, 375]] }),

    k.panel({ x: 370, y: 120, w: 180, h: 150, label: 'BM25（词法）' }),
    row(k, 392, 176, 1, 'A', 'accent'), row(k, 392, 206, 2, 'B'), row(k, 392, 236, 3, 'C', 'accent'),
    k.panel({ x: 370, y: 300, w: 180, h: 150, label: '向量（语义）' }),
    row(k, 392, 356, 1, 'C', 'accent'), row(k, 392, 386, 2, 'A', 'accent'), row(k, 392, 416, 3, 'D'),

    k.arrow({ points: [[550, 195], [570, 195], [570, 285], [586, 285]] }),
    k.arrow({ points: [[550, 375], [570, 375], [570, 285]], head: false }),
    k.panel({ x: 590, y: 170, w: 170, h: 230, label: 'RRF 融合（k=60）', tone: 'accent' }),
    row(k, 610, 228, 1, 'A', 'accent', '0.0325'), row(k, 610, 262, 2, 'C', 'accent', '0.0323'),
    row(k, 610, 296, 3, 'B', undefined, '0.0161'), row(k, 610, 330, 4, 'D', undefined, '0.0159'),
    k.text({ x: 610, y: 378, text: '分数 = Σ 1/(k+名次)', size: 'label', tone: 'muted' }),

    k.arrow({ points: [[760, 210], [786, 210]] }),
    k.box({ x: 790, y: 178, w: 130, h: 64, title: '重排', sub: '小候选集精排', titleSize: 'body' }),
    k.arrow({ points: [[855, 242], [855, 282]] }),
    k.box({ x: 790, y: 286, w: 130, h: 90, title: '组装上下文', sub: '去重、控 token\n保留来源', titleSize: 'body', tone: 'ok' }),

    k.note({ x: 40, y: 476, w: 880, h: 58, lead: '不要直接把两种分数相加：', text: 'BM25 可能十几分，余弦相似度在 0 到 1，单位不同；RRF 只看名次。' }),
  ].join(''),
});
