export const meta = {
  name: 'rag-cache-layer-keys-invalidation-v2',
  article: 'knowledge/llm/rag/rag-cache.md',
  alt: 'RAG 五层缓存各有自己的键：Embedding 键含文本、模型和预处理版本；召回键含 tenant、ACL 摘要、索引版本、query、filter 和 top_k；重排键含 query、候选顺序、reranker 版本和截断策略；上下文键含候选、token 预算、压缩器、引用策略和 ACL；答案键含 Prompt、模型版本、证据 hash、索引版本、tenant 和 ACL。下方矩阵列出事件让哪些层失效：来源变更或删除、ACL 变化走高优先级通道立即失效召回、上下文和答案；索引切换让召回之后全部换键；reranker 升级影响重排；生成模型升级影响答案；Prompt 变化影响上下文和答案；Embedding 模型变化影响 Embedding 并重建索引。TTL 只做兜底上限',
};

export default (k) => {
  const s = [], BY = 112, BH = 104, BW = 160;
  const layers = [
    ['Embedding', '文本\n模型版本\n预处理版本'],
    ['召回', 'tenant + ACL 摘要\n索引版本 + query\nfilter + top_k'],
    ['重排', 'query + 候选顺序\nreranker 版本\n截断 + top_n'],
    ['上下文', '候选 + token 预算\n压缩器 + 引用策略\nACL'],
    ['答案', 'Prompt + 模型版本\n证据 hash + 索引\ntenant + ACL'],
  ];
  layers.forEach(([t, sub], i) => {
    const x = 40 + i * (BW + 20);
    s.push(k.box({ x, y: BY, w: BW, h: BH, title: t, sub, titleSize: 'body', tone: i === 4 ? 'accent' : 'info', strong: i === 4 }));
    if (i < 4) s.push(k.arrow({ points: [[x + BW, BY + BH / 2], [x + BW + 20, BY + BH / 2]] }));
  });

  const FY = 252, LX = 60, C = [300, 395, 490, 585, 680], CH = 752, HY = FY + 62, RH = 34;
  s.push(k.frame({ x: 40, y: FY, w: 880, h: 330, label: '状态变化：哪层要失效' }));
  ['事件', 'Embed', '召回', '重排', '上下文', '答案', '怎么失效'].forEach((h, i) => {
    const x = i === 0 ? LX : i === 6 ? CH : C[i - 1];
    s.push(k.text({ x, y: HY, text: h, size: 'label', tone: 'muted', anchor: i >= 1 && i <= 5 ? 'middle' : 'start' }));
  });
  const rows = [
    ['来源变更 / 删除', [1, 3, 4], '立即删，不等 TTL', 'bad'],
    ['ACL 变化', [1, 3, 4], '立即删，不等 TTL', 'bad'],
    ['索引切换', [1, 2, 3, 4], '键带版本，自然 miss', 'info'],
    ['reranker 升级', [2], '键带版本，自然 miss', 'info'],
    ['生成模型升级', [4], '键带版本，自然 miss', 'info'],
    ['Prompt 变化', [3, 4], '键带版本，自然 miss', 'info'],
    ['Embedding 模型变化', [0, 1], '重算向量，重建索引', 'warn'],
  ];
  rows.forEach(([ev, cols, how, tone], r) => {
    const y = HY + 14 + r * RH;
    s.push(`<line x1="56" y1="${y}" x2="904" y2="${y}" stroke="${k.t.faint}" stroke-width="1"/>`);
    s.push(k.text({ x: LX, y: y + 23, text: ev, size: 'label' }));
    cols.forEach((c) => s.push(`<circle cx="${C[c]}" cy="${y + 17}" r="7" fill="${k.t[tone]}"/>`));
    s.push(k.text({ x: CH, y: y + 23, text: how, size: 'label', tone }));
  });

  return k.figure({
    h: 690,
    title: 'RAG 缓存：每层一把键，事件驱动失效',
    subtitle: '键里写全输入、权限、索引和模型版本；命中只说明键相同，不说明证据仍新鲜',
    body: s.join('') + k.note({ x: 40, y: 606, w: 880, h: 52, lead: 'TTL 只是最后一道上限：', text: '事件可能丢，所以键里仍带版本；每层分开看 fresh hit 和 stale serve。' }),
  });
};
