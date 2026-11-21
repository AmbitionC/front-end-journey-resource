export const meta = {
  name: 'rag-testing-layers-golden-gate-v2',
  article: 'knowledge/llm/rag/rag-testing.md',
  alt: 'RAG 测试分四层：最底层是不调模型也能跑的确定性契约，测分块、ACL、缓存键、引用 span 和 schema；组件层把召回、排名和路由分开测，看 Recall@K、MRR、nDCG 和路由准确率；端到端层把答案和引用一起评，无答案题要说证据不足，权限题检查候选和 trace；最上层线上监控只有零结果、fallback、用户纠正等代理信号。当前版本的 Golden Set 保持冻结，包含问题、gold 证据、gold 答案、来源快照和代表性、难例、对抗三类切片，驱动组件和端到端测试；线上样本先进候选池脱敏、去重、补快照和专家标签，复核后才成为下一版。发布门禁三条：越权、泄露、删除残留必须为零，关键切片不退化，同一批 case 新旧配对比较并看置信区间',
};

export default (k) => {
  const s = [], CX = 300;
  const rows = [
    [300, '线上监控：只有代理信号', '零结果、fallback、用户纠正', 'muted'],
    [380, '端到端：答案和引用一起评', '无答案要说证据不足；权限题查 trace', 'info'],
    [460, '组件：召回、排名、路由分开测', 'Recall@K · MRR · nDCG · 路由准确率', 'info'],
    [520, '单元：确定性契约', '分块、ACL、缓存键、引用 span、schema，不调模型', 'accent'],
  ];
  rows.forEach(([w, t, sub, tone], i) => s.push(k.box({ x: CX - w / 2, y: 112 + i * 80, w, h: 68, title: t, sub, titleSize: 'body', tone, strong: i === 3 })));

  s.push(k.arrow({ points: [[450, 146], [600, 146]], tone: 'muted' }));
  s.push(k.box({ x: 600, y: 112, w: 320, h: 68, title: '候选池', sub: '脱敏、去重、补快照、专家标签', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[800, 180], [800, 200]], tone: 'muted' }));
  s.push(k.box({ x: 680, y: 200, w: 240, h: 52, title: 'v4：复核后的下一版', titleSize: 'label', tone: 'muted', dashed: true }));
  s.push(k.box({ x: 600, y: 276, w: 320, h: 100, title: 'Golden Set v3：当前冻结', sub: '问题 + gold 证据 + gold 答案\n来源快照；切片：代表性 / 难例 / 对抗', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[600, 306], [530, 306]], tone: 'accent' }));
  s.push(k.arrow({ points: [[640, 276], [640, 226], [490, 226]], tone: 'accent' }));
  s.push(k.text({ x: 600, y: 400, text: '线上反馈不直接改当前版本，指标才可比', size: 'note', tone: 'muted' }));

  s.push(k.frame({ x: 40, y: 440, w: 880, h: 132, label: 'Release Gate：任一条不过就不发' }));
  [
    ['硬约束必须为零', '越权、泄露、删除残留', 'bad'],
    ['关键切片不退化', 'Recall@K、abstain、引用', 'warn'],
    ['新旧配对比较', '同一批 case，看置信区间', 'info'],
  ].forEach(([t, sub, tone], i) => s.push(k.box({ x: 60 + i * 290, y: 476, w: 260, h: 72, title: t, sub, titleSize: 'body', tone })));

  return k.figure({
    h: 620,
    title: 'RAG 测试：分层定位，冻结的 Golden Set 做回归',
    subtitle: '越往下越确定、越便宜；越往上越接近真实，但越难定位是召回、排名还是生成出了问题',
    body: s.join(''),
  });
};
