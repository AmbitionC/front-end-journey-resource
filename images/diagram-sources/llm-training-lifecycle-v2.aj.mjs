export const meta = {
  name: 'llm-training-lifecycle-v2',
  article: 'knowledge/llm/basics/llm-training-overview.md',
  alt: '大模型生命周期分两段：预训练段依次是目标与数据契约、清洗去重、Tokenizer 与样本构造、预训练、预训练评估，评估结果会回头调整数据配比和清洗规则；后训练与上线段依次是监督微调、偏好优化、安全评估与发布门禁、部署与监控，安全评估和线上问题再回流到数据、后训练或检索等不同环节',
};

const R1 = 160, R2 = 290, H = 72;
const X1 = [64, 237, 410, 583, 756], W1 = 152;
const X2 = [64, 281, 498, 715], W2 = 193;

export default (k) => {
  const s = [];
  [['目标与数据契约', '用途、许可、质量'], ['清洗去重', '过滤、去重、去敏'], ['Tokenizer', '切分、构造样本'],
    ['预训练', '预测下一个 token'], ['预训练评估', '基准、数据污染']]
    .forEach(([title, sub], i) => s.push(k.box({ x: X1[i], y: R1, w: W1, h: H, title, sub, tone: 'info', strong: i === 3 })));
  [['SFT 监督微调', '用示范教会回答格式'], ['偏好优化', 'RLHF / DPO'], ['安全评估与门禁', '红队、回归、发布标准'], ['部署与监控', '版本、漂移、失败类型']]
    .forEach(([title, sub], i) => s.push(k.box({ x: X2[i], y: R2, w: W2, h: H, title, sub, tone: 'accent', strong: i === 0 })));
  for (let i = 0; i < 4; i++) s.push(k.arrow({ points: [[X1[i] + W1, R1 + H / 2], [X1[i + 1], R1 + H / 2]], tone: 'info' }));
  for (let i = 0; i < 3; i++) s.push(k.arrow({ points: [[X2[i] + W2, R2 + H / 2], [X2[i + 1], R2 + H / 2]], tone: 'accent' }));
  const c1 = (i) => X1[i] + W1 / 2, c2 = (i) => X2[i] + W2 / 2;
  // 预训练 → 后训练
  s.push(k.arrow({ points: [[c1(4), R1 + H], [c1(4), 261], [c2(0), 261], [c2(0), R2]], tone: 'accent' }));
  // 预训练评估回流
  s.push(k.arrow({ points: [[c1(4), R1], [c1(4), 138], [c1(0), 138], [c1(0), R1]], tone: 'info', dashed: true,
    label: '预训练评估回流：调数据配比、清洗规则', labelAt: [c1(2), 128], labelAnchor: 'middle' }));
  // 安全评估与线上回流
  s.push(k.arrow({ points: [[c2(3), R2 + H], [c2(3), 404], [44, 404], [44, R1 + H / 2], [X1[0], R1 + H / 2]], tone: 'accent', dashed: true,
    label: '线上与安全问题回流：补数据、改后训练或先修检索', labelAt: [300, 394], labelAnchor: 'middle' }));
  s.push(k.arrow({ points: [[c2(2), R2 + H], [c2(2), 404]], tone: 'accent', dashed: true, head: false }));
  return k.figure({
    h: 520,
    title: '大模型生命周期：预训练给能力，后训练塑造行为',
    subtitle: '蓝框是预训练段，绿框是后训练与上线段；虚线是评估结果往回推',
    body: s.join('') + k.note({ x: 40, y: 438, w: 880, h: 52, lead: '评估不是最后一步：', text: '每一段的出口都有评估，问题回到最便宜能修好的环节。' }),
  });
};
