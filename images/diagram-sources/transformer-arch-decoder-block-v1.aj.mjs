export const meta = {
  name: 'transformer-arch-decoder-block-v1',
  article: 'knowledge/llm/basics/transformer-arch.md',
  alt: '现代 Decoder-only 模型：Token ID 经 Embedding、N 个 Decoder Block、Final RMSNorm 和 LM Head 输出下一个 token 的概率；每个 Block 先 RMSNorm 后做因果自注意力和 SwiGLU FFN，两处都有残差旁路',
};

const L = 40, LW = 250, cx = 660;

export default (k) => k.figure({
  h: 660,
  title: '现代 Decoder-only Transformer',
  subtitle: '左边是整体数据流，右边放大一个 Decoder Block（Pre-Norm）',
  body: [
    k.box({ x: L, y: 112, w: LW, h: 50, title: 'Token ID' }),
    k.box({ x: L, y: 186, w: LW, h: 50, title: 'Token Embedding' }),
    k.box({ x: L, y: 260, w: LW, h: 64, title: 'Decoder Block × N', sub: '结构相同，参数不同', tone: 'accent' }),
    k.box({ x: L, y: 348, w: LW, h: 50, title: 'Final RMSNorm' }),
    k.box({ x: L, y: 422, w: LW, h: 64, title: 'LM Head', sub: '投影到词表维度' }),
    k.box({ x: L, y: 510, w: LW, h: 64, title: 'Softmax', sub: '下一个 token 的概率' }),
    ...[[162, 182], [236, 256], [324, 344], [398, 418], [486, 506]].map(([a, b]) => k.arrow({ points: [[L + LW / 2, a], [L + LW / 2, b]] })),

    k.arrow({ points: [[290, 262], [370, 108]], tone: 'accent', dashed: true, head: false, width: 1.2 }),
    k.arrow({ points: [[290, 322], [370, 586]], tone: 'accent', dashed: true, head: false, width: 1.2 }),
    k.panel({ x: 370, y: 100, w: 550, h: 486, label: '一个 Decoder Block' }),

    k.arrow({ points: [[cx, 136], [cx, 156]] }),
    k.box({ x: cx - 110, y: 160, w: 220, h: 42, title: 'RMSNorm', titleSize: 'body' }),
    k.arrow({ points: [[cx, 202], [cx, 218]] }),
    k.box({ x: cx - 160, y: 222, w: 320, h: 64, title: 'Causal Self-Attention', sub: 'RoPE 作用在 Q、K 上，可用 GQA', tone: 'accent' }),
    k.arrow({ points: [[cx, 286], [cx, 304]] }),
    k.sum({ x: cx, y: 318 }),
    k.arrow({ points: [[cx, 332], [cx, 352]] }),
    k.box({ x: cx - 110, y: 356, w: 220, h: 42, title: 'RMSNorm', titleSize: 'body' }),
    k.arrow({ points: [[cx, 398], [cx, 414]] }),
    k.box({ x: cx - 160, y: 418, w: 320, h: 64, title: 'SwiGLU FFN', sub: '每个位置独立做非线性变换', tone: 'accent' }),
    k.arrow({ points: [[cx, 482], [cx, 500]] }),
    k.sum({ x: cx, y: 514 }),
    k.arrow({ points: [[cx, 528], [cx, 566]], label: '送入下一个 Block', labelAt: [cx + 12, 554], labelAnchor: 'start' }),

    k.arrow({ points: [[cx, 146], [430, 146], [430, 318], [cx - 18, 318]], tone: 'ok', width: 1.8 }),
    k.arrow({ points: [[cx, 340], [430, 340], [430, 514], [cx - 18, 514]], tone: 'ok', width: 1.8 }),
    k.text({ x: 396, y: 240, text: '残差', size: 'label', tone: 'ok', weight: 600 }),
    k.text({ x: 396, y: 436, text: '残差', size: 'label', tone: 'ok', weight: 600 }),
    k.text({ x: cx + 12, y: 132, text: '上一层输出', size: 'label', tone: 'muted' }),

    k.note({ x: 40, y: 598, w: 880, h: 46, text: '残差旁路绕过 Attention 和 FFN；RoPE 只作用在 Q、K 上，不直接加到 Embedding。' }),
  ].join(''),
});
