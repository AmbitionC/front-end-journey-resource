export const meta = {
  name: 'rag-latency-budget-degrade-v2',
  article: 'knowledge/llm/rag/rag-latency-cost.md',
  alt: '一次在线 RAG 查询按阶段记延迟：排队时间也要计入，路由示例预算 40 毫秒，关键词、向量和表格检索并行、共用 160 毫秒的 deadline，关键路径取最慢一路，重排 220 毫秒，再组装上下文，生成的首 token 900 毫秒，总预算 5000 毫秒，这些数只是示例；容量压力下按显式阶梯降级：Full 是多路召回加重排和完整模型，Degraded 减少变体和候选、走快路径或缓存，Abstain 在高风险或证据不足时拒答，响应要标明 degraded 和证据时间；离线摄取的解析、OCR、分块、embedding 和建索引另记一本账，看新鲜度延迟和吞吐，删除与 ACL 更新优先于批量回填',
};

export default (k) => {
  const s = [], Y = 170, H = 48, LY = 272;
  s.push(k.frame({ x: 40, y: 112, w: 880, h: 188, label: '在线一次查询（示例预算，不是通用值）' }));
  const st = [
    [60, 80, '排队', 'muted', '也要计入'],
    [152, 100, '路由', 'info', '40 ms'],
    [476, 130, '重排', 'info', '220 ms'],
    [618, 90, '组装', 'info', '按证据分 token'],
    [720, 180, '生成', 'accent', '首 token 900 ms'],
  ];
  st.forEach(([x, w, t, tone, lab]) => {
    s.push(k.box({ x, y: Y, w, h: H, title: t, titleSize: 'body', tone, strong: t === '生成' }));
    s.push(k.text({ x: x + w / 2, y: LY, text: lab, size: 'note', tone: 'muted', anchor: 'middle' }));
  });
  [[140, 152], [252, 264], [464, 476], [606, 618], [708, 720]].forEach(([a, b]) => s.push(k.arrow({ points: [[a, Y + H / 2], [b, Y + H / 2]], head: false })));
  [['关键词', 100], ['向量', 180], ['表格', 140]].forEach(([t, w], i) => s.push(k.box({ x: 264, y: 150 + i * 30, w, h: 26, title: t, titleSize: 'note', tone: 'info' })));
  s.push(`<line x1="464" y1="144" x2="464" y2="246" stroke="${k.t.warn}" stroke-width="2" stroke-dasharray="5 4"/>`);
  s.push(k.text({ x: 364, y: LY, text: '160 ms，取最慢一路', size: 'note', tone: 'warn', anchor: 'middle' }));

  s.push(k.frame({ x: 40, y: 324, w: 560, h: 184, label: '容量压力下显式降级' }));
  const L = [
    ['Full', '多路召回 + 重排\n完整模型', 'ok'],
    ['Degraded', '少变体、少候选\n快路径或缓存', 'warn'],
    ['Abstain', '高风险或证据不足\n直接拒答', 'bad'],
  ];
  L.forEach(([t, sub, tone], i) => {
    const x = 60 + i * 180;
    s.push(k.box({ x, y: 360, w: 160, h: 84, title: t, sub, titleSize: 'body', tone }));
    if (i < 2) s.push(k.arrow({ points: [[x + 160, 402], [x + 180, 402]], tone: L[i + 1][2] }));
  });
  s.push(k.text({ x: 60, y: 482, text: '响应标明 degraded 和证据时间；不静默换旧索引', size: 'note', tone: 'muted' }));

  s.push(k.frame({ x: 620, y: 324, w: 300, h: 184, label: '离线摄取另记一本账' }));
  s.push(k.box({ x: 640, y: 360, w: 260, h: 84, title: '解析 · OCR · 分块', sub: 'embedding 按 token 批处理\n建索引、重建', titleSize: 'body', tone: 'muted' }));
  s.push(k.text({ x: 640, y: 470, text: '看新鲜度延迟和吞吐', size: 'note', tone: 'muted' }));
  s.push(k.text({ x: 640, y: 494, text: '删除、ACL 更新先于批量回填', size: 'note', tone: 'warn' }));

  return k.figure({
    h: 620,
    title: 'RAG 延迟与成本：分阶段记账，压力下显式降级',
    subtitle: '在线延迟 = 排队 + 路由 + 最慢的检索分支 + 重排 + 组装 + 生成；并行分支共用 deadline、取最大值',
    body: s.join('') + k.note({ x: 40, y: 532, w: 880, h: 52, lead: '发布门禁同时卡三条：', text: '质量不低于阈值、p95 不超预算、单位请求成本可接受。' }),
  });
};
