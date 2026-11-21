export const meta = {
  name: 'rag-query-rewrite-diagnose-guard-v2',
  article: 'knowledge/llm/rag/rag-query-rewrite.md',
  alt: '原始查询先被保留，再用规则和轻量分类诊断缺陷，只选最小必要变换：规范化要保护错误码和 SKU，多跳问题分解为继承过滤、按依赖先后执行的子查询，召回不足用有限数量的多查询并按排名融合，HyDE 假设文档只用来找邻居，指代不清就请求澄清并回到用户；改写结果先做漂移检查，确认实体、数字、否定、时间和版本都还在，再带着由代码构造的租户、权限、版本、时间硬过滤去真实语料检索，按排名融合并按块 ID 去重，只有真实文档才是答案证据；规范化查询、多查询和假设文档等生成文本只用于检索，不能被引用',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 112, w: 260, h: 68, title: '原始查询', sub: '原文保留，和改写一起记日志', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[300, 146], [340, 146]] }));
  s.push(k.box({ x: 340, y: 112, w: 580, h: 68, title: '先诊断，再选最小必要变换', sub: '规则 + 轻量分类：错误码、实体、否定、时间、多问题结构', titleSize: 'body', tone: 'accent', strong: true }));

  const C = [
    ['规范化', '错误码、SKU\n加保护规则', 'info'],
    ['分解子查询', '继承过滤，\n按依赖先后查', 'info'],
    ['多查询扩展', '限数量，\n按排名融合', 'info'],
    ['HyDE', '假设文档只用来\n找邻居', 'info'],
    ['请求澄清', '指代不清就问，\n回到用户', 'warn'],
  ];
  s.push(k.arrow({ points: [[630, 180], [630, 204]], head: false }));
  s.push(k.arrow({ points: [[120, 204], [840, 204]], head: false }));
  C.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 180;
    s.push(k.arrow({ points: [[x + 80, 204], [x + 80, 224]], tone }));
    s.push(k.box({ x, y: 224, w: 160, h: 84, title: t, sub, titleSize: 'body', tone }));
    if (i !== 4) s.push(k.arrow({ points: [[x + 80, 308], [x + 80, 332]], head: false }));
  });
  s.push(k.arrow({ points: [[120, 332], [660, 332]], head: false }));
  s.push(k.arrow({ points: [[320, 332], [320, 360]] }));

  s.push(k.box({ x: 40, y: 360, w: 560, h: 68, title: '漂移检查', sub: '实体、数字、否定、时间、版本都还在吗？', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[320, 428], [320, 460]] }));
  s.push(k.box({ x: 640, y: 380, w: 280, h: 72, title: '硬过滤由代码构造', sub: '租户、权限、版本、时间', titleSize: 'body', tone: 'accent' }));
  s.push(k.arrow({ points: [[780, 452], [780, 494], [600, 494]], tone: 'accent' }));
  s.push(k.box({ x: 40, y: 460, w: 560, h: 68, title: '真实语料检索', sub: '每条查询都带同一套硬过滤，改写器改不了', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[320, 528], [320, 556]] }));
  s.push(k.box({ x: 40, y: 556, w: 560, h: 68, title: '融合与去重', sub: '按排名融合，不直接相加相似度；按块 ID 去重', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[320, 624], [320, 652]], tone: 'ok' }));
  s.push(k.box({ x: 40, y: 652, w: 560, h: 52, title: '只有真实文档才是答案证据', titleSize: 'body', tone: 'ok', strong: true }));

  s.push(k.box({ x: 640, y: 556, w: 280, h: 148, title: '生成的文本不进证据链', sub: '规范化查询、多查询、\nHyDE 假设文档\n只用来检索，\n不能被引用', titleSize: 'body', tone: 'bad', dashed: true }));

  return k.figure({
    h: 820,
    title: '查询改写：先诊断，再改写，证据只认真实文档',
    subtitle: '不要每次把所有策略都跑一遍；原始查询和硬过滤全程保留',
    body: s.join('') + k.note({ x: 40, y: 732, w: 880, h: 52, lead: '评估分两层：', text: 'Recall@K 上升而答案变差，可能是噪声挤占上下文，或改写改了意图。' }),
  });
};
