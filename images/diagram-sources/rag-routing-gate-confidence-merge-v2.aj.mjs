export const meta = {
  name: 'rag-routing-gate-confidence-merge-v2',
  article: 'knowledge/llm/rag/rag-routing.md',
  alt: '查询先过授权门禁，只能在 allowedIndexes 内选择，拒绝时直接终止且没有 fallback；路由器先用确定性规则，模糊请求再交给分类器，参考意图、实体、数据形态、时效和复杂度；高置信走单路，中置信做有界 fan-out，低置信 abstain 并提一个最小澄清问题；单路和 fan-out 只查授权范围内的文档、表格、代码或图索引，索引故障可退回关键词检索并标记 degraded，实时数据缺失不能用旧文档代替；多路候选用 RRF 融合后按原问题 rerank，每条候选保留 route ID 和来源',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 120, w: 140, h: 52, title: '用户查询', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[180, 146], [220, 146]] }));
  s.push(k.box({ x: 220, y: 112, w: 300, h: 68, title: '授权门禁', sub: '只在 allowedIndexes 内选择', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[520, 146], [580, 146]], tone: 'bad' }));
  s.push(k.box({ x: 580, y: 112, w: 340, h: 68, title: 'DENY：直接终止', sub: '没有 fallback，也不换别的索引', titleSize: 'body', tone: 'bad' }));

  s.push(k.arrow({ points: [[370, 180], [370, 212]] }));
  s.push(k.box({ x: 220, y: 212, w: 300, h: 68, title: '路由器', sub: '先走确定性规则，模糊的再给分类器', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[580, 246], [520, 246]], dashed: true }));
  s.push(k.box({ x: 580, y: 212, w: 340, h: 68, title: '路由信号', sub: '意图、实体、数据形态、时效、复杂度', titleSize: 'body', tone: 'muted', dashed: true }));

  s.push(k.arrow({ points: [[370, 280], [370, 304]], head: false }));
  s.push(k.arrow({ points: [[180, 304], [780, 304]], head: false }));
  const B = [
    [40, '高置信：单路', '目标明确，只查一个索引', 'info'],
    [340, '中置信：有界 fan-out', '并行几路，各设超时和配额', 'info'],
    [640, '低置信：abstain', '信息不足或证据互相冲突', 'warn'],
  ];
  B.forEach(([x, t, sub, tone]) => {
    s.push(k.arrow({ points: [[x + 140, 304], [x + 140, 326]], tone }));
    s.push(k.box({ x, y: 326, w: 280, h: 68, title: t, sub, titleSize: 'body', tone }));
  });

  s.push(k.arrow({ points: [[180, 394], [180, 424]], tone: 'info' }));
  s.push(k.arrow({ points: [[480, 394], [480, 424]], tone: 'info' }));
  s.push(k.frame({ x: 40, y: 424, w: 580, h: 128, label: '只查授权范围内的索引' }));
  ['文档', '表格', '代码', '图'].forEach((t, i) => s.push(k.box({ x: 60 + i * 140, y: 458, w: 120, h: 44, title: t, titleSize: 'body', tone: 'info' })));
  s.push(k.text({ x: 60, y: 530, text: '索引故障可退回关键词检索并标 degraded；实时数据缺失不拿旧文档顶', size: 'note', tone: 'warn' }));

  s.push(k.arrow({ points: [[780, 394], [780, 424]], tone: 'warn' }));
  s.push(k.box({ x: 640, y: 424, w: 280, h: 68, title: '提一个最小澄清问题', sub: '如“哪个服务的 deploy？”', titleSize: 'body', tone: 'warn' }));

  s.push(k.arrow({ points: [[330, 552], [330, 576]] }));
  s.push(k.box({ x: 40, y: 576, w: 580, h: 68, title: 'RRF 融合 → 按原问题 rerank', sub: '每条候选保留 route ID 和来源，答案能说清走了哪条路', titleSize: 'body', tone: 'accent', strong: true }));

  return k.figure({
    h: 760,
    title: 'RAG 查询路由：先过门禁，再按置信度选路',
    subtitle: '授权是硬约束，置信度决定单路、fan-out 还是 abstain；fallback 只能在授权范围内降级',
    body: s.join('') + k.note({ x: 40, y: 672, w: 880, h: 52, lead: '置信度要校准：', text: '分类器给 0.9 不等于 90% 正确，阈值按错误成本在标注集上定。' }),
  });
};
