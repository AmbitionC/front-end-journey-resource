export const meta = {
  name: 'vector-db-selection-start-poc-v5',
  article: 'knowledge/llm/rag/vector-db-selection.md',
  alt: '向量库选型先按现状形成起始候选：核心数据已在 PostgreSQL、需要关系联结和强一致删除时从 pgvector 开始；原型、个人工具或想自己控制部署时从 Chroma 开始；不想运维、需要托管弹性时从 Pinecone 开始。起点只是候选，三者都要用同一套 PoC 验证：严格过滤后召回是否还够 top-k，多租户与 ACL 隔离，更新和删除的一致性与延迟，P95 延迟、吞吐和写入，运维能力与总成本；复杂过滤和多租户不能单独决定产品，要用真实数据和查询跑完 PoC 再定',
};

export default (k) => {
  const s = [];
  const rows = [
    ['核心数据已在 PostgreSQL', '要关系联结、强一致删除', 'pgvector', '向量留在 Postgres'],
    ['原型、个人工具', '想自己控制部署', 'Chroma', '本地 / 自托管上手快'],
    ['不想自己运维', '要托管和弹性扩容', 'Pinecone', '托管向量检索'],
  ];
  rows.forEach(([c, csub, p, psub], i) => {
    const y = 136 + i * 100;
    s.push(k.box({ x: 40, y, w: 250, h: 80, title: c, sub: csub, titleSize: 'body', tone: 'muted' }));
    s.push(k.arrow({ points: [[290, y + 40], [320, y + 40]] }));
    s.push(k.box({ x: 320, y, w: 210, h: 80, title: p, sub: psub, titleSize: 'body', tone: 'info' }));
    s.push(k.arrow({ points: [[530, y + 40], [580, y + 40]], tone: 'accent' }));
  });
  s.push(k.text({ x: 40, y: 124, text: '起点：按现状选一个起始候选', size: 'label', tone: 'muted' }));

  s.push(k.panel({ x: 580, y: 120, w: 340, h: 316, label: '三者都要用同一套 PoC 验证', tone: 'accent' }));
  [
    ['过滤后召回', '严格过滤时还够 top-k 吗'],
    ['多租户与 ACL', '隔离在索引层还是查询层'],
    ['更新与删除', '一致性和生效延迟'],
    ['P95、吞吐、写入', '用真实数据和查询测'],
    ['运维与总成本', '团队扛不扛得住'],
  ].forEach(([t, d], i) => {
    s.push(k.text({ x: 600, y: 178 + i * 52, text: `${i + 1}. ${t}`, size: 'label', weight: 600 }));
    s.push(k.text({ x: 620, y: 200 + i * 52, text: d, size: 'note', tone: 'muted' }));
  });

  return k.figure({
    h: 540,
    title: '向量库选型：现状给起点，PoC 定结论',
    subtitle: 'pgvector、Chroma、Pinecone 没有脱离场景的绝对胜负；先定约束和评测数据，再选产品',
    body: s.join('') + k.note({ x: 40, y: 460, w: 880, h: 52, lead: '箭头只是起点：', text: '复杂过滤、多租户不能单独决定产品，三个候选都要过右边五项。' }),
  });
};
