export const meta = {
  name: 'embedding-similarity-metrics-v5',
  article: 'knowledge/llm/rag/embedding-basics.md',
  alt: '用二维玩具向量演示：同一个编码器把“猫在休息”“小猫在窗边睡觉”“数据库索引优化”映射成单位向量 q、a、b；q 和 a 方向接近，余弦相似度 0.96、欧氏距离 0.28，q 和 b 余弦 -0.35、距离 1.64；向量已 L2 归一化，所以点积与余弦相同',
};

// 单位向量：q=(0.8,0.6) a=(0.6,0.8) b=(0.28,-0.96)
const V = { q: [0.8, 0.6], a: [0.6, 0.8], b: [0.28, -0.96] };
const O = [400, 296], S = 120;
const P = (v) => [O[0] + v[0] * S, O[1] - v[1] * S];

export default (k) => {
  const s = [];
  s.push(k.panel({ x: 40, y: 110, w: 220, h: 340, label: '同一个编码器' }));
  [['q', '猫在休息', 'accent'], ['a', '小猫在窗边睡觉', 'accent'], ['b', '数据库索引优化', 'info']].forEach(([id, t, tone], i) => {
    s.push(k.box({ x: 56, y: 150 + i * 70, w: 188, h: 52, title: `${id}  ${t}`, titleSize: 'label', tone }));
  });
  s.push(k.text({ x: 56, y: 382, text: '输出 d 维向量', size: 'note', tone: 'muted' }));
  s.push(k.text({ x: 56, y: 406, text: '这里压成 2 维示意', size: 'note', tone: 'muted' }));
  s.push(k.arrow({ points: [[260, 280], [292, 280]], tone: 'line' }));

  s.push(k.panel({ x: 292, y: 110, w: 280, h: 340, label: '向量空间（示意）' }));
  s.push(`<line x1="312" y1="${O[1]}" x2="556" y2="${O[1]}" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  s.push(`<line x1="${O[0]}" y1="146" x2="${O[0]}" y2="436" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  for (const [id, v] of Object.entries(V)) {
    const tone = id === 'b' ? 'info' : 'accent', [x, y] = P(v);
    const len = Math.hypot(x - O[0], y - O[1]), ux = (x - O[0]) / len, uy = (y - O[1]) / len;
    s.push(`<line x1="${O[0]}" y1="${O[1]}" x2="${x - ux * 6}" y2="${y - uy * 6}" stroke="${k.color(tone)}" stroke-width="2.4" marker-end="url(#m-${tone})"/>`);
    const off = { q: [12, 8], a: [-6, -12], b: [12, 4] }[id];
    s.push(k.text({ x: x + off[0], y: y + off[1], text: id, size: 'heading', weight: 600, tone, anchor: id === 'a' ? 'end' : 'start' }));
  }

  s.push(k.panel({ x: 600, y: 110, w: 320, h: 340, label: '三种度量（数值按上面的向量算）' }));
  const cols = [700, 780, 860];
  ['', 'q 与 a', 'q 与 b'].forEach((t, i) => i && s.push(k.text({ x: cols[i], y: 168, text: t, size: 'note', tone: 'muted', anchor: 'middle' })));
  [['余弦相似度', '0.96', '-0.35', '越大越近'], ['点积', '0.96', '-0.35', '越大越近'], ['欧氏距离', '0.28', '1.64', '越小越近']]
    .forEach(([name, x1, x2, hint], i) => {
      const y = 214 + i * 62;
      s.push(k.text({ x: 616, y, text: name, size: 'label', weight: 600 }));
      s.push(k.text({ x: 616, y: y + 22, text: hint, size: 'note', tone: 'muted' }));
      s.push(k.text({ x: cols[1], y, text: x1, size: 'label', mono: true, weight: 600, tone: 'accent', anchor: 'middle' }));
      s.push(k.text({ x: cols[2], y, text: x2, size: 'label', mono: true, anchor: 'middle' }));
    });
  s.push(k.text({ x: 616, y: 410, text: '向量已 L2 归一化，点积 = 余弦；', size: 'note', tone: 'sec' }));
  s.push(k.text({ x: 616, y: 432, text: '没归一化时两者排序可能不同', size: 'note', tone: 'sec' }));

  return k.figure({
    h: 552,
    title: 'Embedding：语义相近，向量方向就相近',
    subtitle: '二维玩具向量；真实模型是几百到几千维，度量要和模型文档、索引配置一致',
    body: s.join('') + k.note({ x: 40, y: 476, w: 880, h: 52, lead: '距离近 ≠ 事实正确：', text: '查询和文档必须用同一套经过验证的编码器与预处理约定。' }),
  });
};
