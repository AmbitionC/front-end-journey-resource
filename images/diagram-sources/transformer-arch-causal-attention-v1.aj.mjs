export const meta = {
  name: 'transformer-arch-causal-attention-v1',
  article: 'knowledge/llm/basics/transformer-arch.md',
  alt: 'Token 向量投影为 Q、K、V；Q 与 K 打分后经过因果掩码和 Softmax 得到下三角注意力权重，再对 V 加权求和得到每个位置的新表示',
};

const W = [[1], [0.4, 0.6], [0.2, 0.3, 0.5], [0.1, 0.2, 0.3, 0.4]];

export default (k) => k.figure({
  h: 500,
  title: '因果自注意力：只看自己和前面',
  subtitle: '权重数值只是示意；每行加起来等于 1，右上角被掩码屏蔽',
  body: [
    ...['x1', 'x2', 'x3', 'x4'].map((l, i) => k.box({ x: 40, y: 128 + i * 52, w: 70, h: 40, title: l, titleSize: 'body' })),
    k.text({ x: 75, y: 354, text: 'Token 向量', size: 'label', tone: 'muted', anchor: 'middle' }),
    k.box({ x: 168, y: 128, w: 92, h: 46, title: 'Q', tone: 'accent' }),
    k.box({ x: 168, y: 202, w: 92, h: 46, title: 'K', tone: 'accent' }),
    k.box({ x: 168, y: 276, w: 92, h: 46, title: 'V', tone: 'info' }),
    `<path d="M112,148 H124 V316 H112" fill="none" stroke="${k.t.line}" stroke-width="1.5"/>`,
    k.arrow({ points: [[124, 151], [164, 151]], label: '×Wq', labelAt: [144, 143] }),
    k.arrow({ points: [[124, 225], [164, 225]], label: '×Wk', labelAt: [144, 217] }),
    k.arrow({ points: [[124, 299], [164, 299]], label: '×Wv', labelAt: [144, 291] }),

    k.box({ x: 300, y: 150, w: 140, h: 76, title: '打分', sub: 'Q · K / √d' }),
    k.arrow({ points: [[260, 151], [282, 151], [282, 176], [296, 176]] }),
    k.arrow({ points: [[260, 225], [282, 225], [282, 200], [296, 200]] }),
    k.arrow({ points: [[440, 188], [556, 188]], label: '掩码 + Softmax', labelAt: [498, 214] }),

    k.text({ x: 560, y: 118, text: '注意力权重（行=查询，列=被看的位置）', size: 'label', tone: 'muted' }),
    k.matrix({
      x: 600, y: 148, rows: 4, cols: 4, size: 40,
      rowLabels: ['x1', 'x2', 'x3', 'x4'], colLabels: ['x1', 'x2', 'x3', 'x4'],
      cell: (r, c) => (c <= r ? { tone: 'accent', alpha: 0.15 + W[r][c] * 0.6, text: W[r][c].toFixed(1) } : { text: '0', textTone: 'muted' }),
    }),
    k.text({ x: 580, y: 334, text: '右上角被屏蔽：看不到未来', size: 'label', tone: 'bad' }),

    k.box({ x: 790, y: 140, w: 130, h: 96, title: '加权求和', sub: '权重 × V\n得到新表示', tone: 'ok' }),
    k.arrow({ points: [[760, 188], [786, 188]] }),
    k.arrow({ points: [[260, 299], [282, 299], [282, 396], [855, 396], [855, 240]], tone: 'info', label: 'V 不参与打分，算出权重后才被汇总', labelAt: [565, 388] }),

    k.note({ x: 40, y: 428, w: 880, h: 50, text: '训练时整段一起算，但每个位置只读 j ≤ i 的位置，所以不会偷看答案。' }),
  ].join(''),
});
