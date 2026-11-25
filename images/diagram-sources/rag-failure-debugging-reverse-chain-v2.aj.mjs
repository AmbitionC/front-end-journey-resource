export const meta = {
  name: 'rag-failure-debugging-reverse-chain-v2',
  article: 'knowledge/llm/rag/rag-failure-debugging.md',
  alt: 'RAG 故障诊断是一条逆向证据链。先冻结可回放现场：记录 query、用户权限摘要、route、source 与 index version、候选与分数、rerank、最终 context、Prompt 与 model、答案和 citation，用 Trace ID 关联。然后从答案往回逐层检查，每层做一个单变量反事实实验：Generation 换确定性抽取答案或换 Prompt，context 完整而多个生成器都失败才是生成问题；Context 装配强制插入 gold evidence、保持生成配置不变，恢复说明装配或上游选择有问题；Rerank 跳过重排或把 gold 放第一，gold 根本没召回时不要调 rerank；Recall 用 gold query、分别跑 BM25 和向量，绝不为诊断绕过 ACL；Index 按 ID 直读、新旧索引分别查询、重算单条 embedding；Source 与 Parser 看原文件、换 parser、对比 checksum，事实本来不在语料时补数据或 abstain，而不是让模型猜。最终根因以反事实证据确认，并把事故固化进 Golden Set',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 112, w: 880, h: 84, title: '先冻结可回放现场，用 Trace ID 串起来', sub: 'query · 权限摘要 · route · source / index version · 候选与分数 · rerank\n最终 context · Prompt / model · 答案与 citation', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[140, 196], [140, 220]] }));

  const rows = [
    ['Generation', '换确定性抽取答案或换 Prompt；context 完整仍都失败 → 生成问题', 'info'],
    ['Context 装配', '强制插入 gold evidence，生成配置不变；恢复 → 装配或上游选择', 'info'],
    ['Rerank', '跳过重排、把 gold 放第一；gold 没召回就别调 rerank', 'info'],
    ['Recall', '用 gold query、分别跑 BM25 / 向量；绝不为诊断绕过 ACL', 'warn'],
    ['Index', '按 ID 直读、新旧索引对查、重算单条 embedding', 'info'],
    ['Source / Parser', '看原文件、换 parser、比 checksum；本来没有就补数据或 abstain', 'info'],
  ];
  rows.forEach(([t, cf, tone], i) => {
    const y = 220 + i * 72;
    s.push(k.box({ x: 40, y, w: 200, h: 52, title: `${i + 1}  ${t}`, titleSize: 'body', tone }));
    s.push(k.arrow({ points: [[240, y + 26], [272, y + 26]], dashed: true }));
    s.push(k.box({ x: 272, y, w: 648, h: 52, title: cf, titleSize: 'label', tone: 'muted' }));
    if (i < rows.length - 1) s.push(k.arrow({ points: [[140, y + 52], [140, y + 72]] }));
  });

  return k.figure({
    h: 740,
    title: 'RAG 失败诊断：从答案往回查，每层一个反事实',
    subtitle: '左边按 Generation → Source 逆向走，右边是该层只改一个变量的实验',
    body: s.join('') + k.note({ x: 40, y: 658, w: 880, h: 52, lead: '根因要有证据：', text: 'Trace 只负责把异常路由到可能的层，确认靠反事实；事故最后固化进 Golden Set。' }),
  });
};
