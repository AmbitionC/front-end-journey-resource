import still from './transformer-arch-causal-attention-v1.aj.mjs';

export const meta = {
  name: 'transformer-arch-causal-attention-anim',
  article: 'knowledge/llm/basics/transformer-arch.md',
  alt: '因果自注意力（可逐步播放）：四个 token 投影出 Q、K、V；Q 与 K 两两打分得到 4×4 分数；因果掩码把右上角看未来的位置置为负无穷；再逐行 Softmax，第 i 行只在前 i 个位置上分配权重，用这些权重对 V 加权求和得到 y1 到 y4；训练时四行同时算',
};

// 原始分数（示意）：下三角做 Softmax 后正好是 1.0 / 0.4 0.6 / 0.2 0.3 0.5 / 0.1 0.2 0.3 0.4
const S = [[1.2, 0.3, 0.8, 2.0], [0.5, 0.9, 1.4, 0.2], [0.1, 0.5, 1.0, 0.7], [-0.3, 0.4, 0.7, 1.0]];
const W = [[1], [0.4, 0.6], [0.2, 0.3, 0.5], [0.1, 0.2, 0.3, 0.4]];
const Y = [
  'y1 = 1.0·v1',
  'y2 = 0.4·v1\n+ 0.6·v2',
  'y3 = 0.2·v1\n+ 0.3·v2\n+ 0.5·v3',
  'y4 = 0.1·v1\n+ 0.2·v2\n+ 0.3·v3\n+ 0.4·v4',
];
const MX = 600, MY = 148, SZ = 40;

export default (k) => {
  if (k.mode === 'still') return still(k);
  // stage: 0 空 / 1 原始分数 / 2 已掩码 / 3+r 已做完前 r 行 Softmax
  const grid = (stage) => k.matrix({
    x: MX, y: MY, rows: 4, cols: 4, size: SZ,
    rowLabels: ['x1', 'x2', 'x3', 'x4'], colLabels: ['x1', 'x2', 'x3', 'x4'],
    cell: (r, c) => {
      if (stage === 0) return {};
      if (stage >= 2 && c > r) return { tone: 'bad', alpha: 0.18, text: '−∞', textTone: 'bad' };
      if (stage >= 3 && r < stage - 2) return { tone: 'accent', alpha: 0.15 + W[r][c] * 0.6, text: W[r][c].toFixed(1) };
      return { text: S[r][c].toFixed(1), textTone: 'muted' };
    },
  });
  const rowBox = (r) => k.keyed('row', `<rect x="${MX - 4}" y="${MY + r * SZ - 4}" width="${SZ * 4 + 8}" height="${SZ + 8}" rx="6" fill="none" stroke="${k.t.warn}" stroke-width="2.2"/>`);
  const out = (text, tone = 'ok') => k.box({ x: 790, y: 130, w: 130, h: 180, title: '加权求和', sub: text, tone });
  const label = (text, tone = 'muted') => k.text({ x: 560, y: 334, text, size: 'label', tone });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
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
      k.arrow({ points: [[760, 220], [786, 220]] }),
      k.arrow({ points: [[260, 299], [282, 299], [282, 396], [855, 396], [855, 314]], tone: 'info', label: 'V 不参与打分，算出权重后才被汇总', labelAt: [565, 388] }),
      k.note({ x: 40, y: 428, w: 880, h: 50, text: '训练时整段一起算，但每个位置只读 j ≤ i 的位置，所以不会偷看答案。' }),
    ].join(''),
    frames: [
      f('每个 token 向量分别乘三套权重，投影出 Q、K、V', [grid(0), out('等待权重', 'default'), label('还没有分数')]),
      f('Q 和 K 两两点积再除以 √d：得到 4×4 原始分数，此时每个位置都能“看见”全部 4 个 token', [grid(1), out('等待权重', 'default'), label('右上角是在看未来', 'warn')]),
      f('因果掩码：把右上角（第 i 行里 j > i 的格子）置为 −∞，Softmax 之后它们的权重就是 0', [grid(2), out('等待权重', 'default'), label('右上角被屏蔽：看不到未来', 'bad')]),
      f('第 1 行做 Softmax：x1 只能看自己，权重全给 x1，输出 y1 就是 v1', [grid(3), rowBox(0), out(Y[0]), label('右上角被屏蔽：看不到未来', 'bad')]),
      f('第 2 行：x2 只在 x1、x2 上分配权重 0.4 和 0.6，y2 是这两个 V 的加权和', [grid(4), rowBox(1), out(Y[1]), label('右上角被屏蔽：看不到未来', 'bad')]),
      f('第 3 行：x3 能看前三个位置，权重 0.2 / 0.3 / 0.5', [grid(5), rowBox(2), out(Y[2]), label('右上角被屏蔽：看不到未来', 'bad')]),
      f('第 4 行：最后一个位置能看全部 4 个，权重加起来仍是 1', [grid(6), rowBox(3), out(Y[3]), label('右上角被屏蔽：看不到未来', 'bad')]),
      f('训练时四行是同时算出来的；掩码保证每个位置只用到自己和前面的信息，不会偷看答案', [grid(6), out('4 行同时得出\ny1 … y4'), label('右上角被屏蔽：看不到未来', 'bad')]),
    ],
  });
};
