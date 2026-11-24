export const meta = {
  name: 'agent-engineer-skill-map-layers-v2',
  article: 'knowledge/career/agent-skill-map.md',
  alt: 'Agent 工程师技能图谱，七层自底向上。最底层 L1 大模型基础：Transformer、Token、推理参数、模型选型。L1 之上并列两层：L2 Prompt 与上下文工程（System Prompt、CoT、Few-shot）和 L3 RAG 与数据管道（Embedding、向量数据库、Chunking）。两者共同汇入核心层 L4 Agent 范式与核心能力：ReAct、记忆、规划、工具调用。再往上依次是 L5 框架与工具链（LangChain-JS、Vercel AI SDK、MCP 协议）、L6 评估与调试（Tracing、评估框架、调试技巧）、L7 工程化与部署（容错、监控、成本控制）。右侧说明怎么用这张图：它不是逐条打勾的清单，而是用来找出自己最薄弱的一层有针对性地补；能力按可观察的产出分级，不按会几个工具品牌；SFIA 用自主性、复杂度、影响和责任四个维度描述成熟度',
};

export default (k) => {
  const s = [];
  const X = 40, W = 600, H = 56;
  const row = (y, t, sub, tone, x = X, w = W, strong = false) => s.push(k.box({ x, y, w, h: H, title: t, sub, titleSize: 'label', tone, strong }));
  const up = (x, y1, y2) => s.push(k.arrow({ points: [[x, y1], [x, y2]] }));

  row(112, 'L7 工程化与部署', '容错 · 监控 · 成本控制', 'ok');
  row(186, 'L6 评估与调试', 'Tracing · 评估框架 · 调试技巧', 'info');
  row(260, 'L5 框架与工具链', 'LangChain-JS · Vercel AI SDK · MCP', 'info');
  row(334, 'L4 Agent 范式与核心能力', 'ReAct · 记忆 · 规划 · 工具调用', 'accent', X, W, true);
  row(408, 'L2 Prompt 与上下文工程', 'System Prompt · CoT · Few-shot', 'info', 40, 290);
  row(408, 'L3 RAG 与数据管道', 'Embedding · 向量库 · Chunking', 'info', 350, 290);
  row(482, 'L1 大模型基础', 'Transformer · Token · 推理参数 · 模型选型', 'muted');

  up(340, 334, 316); up(340, 260, 242); up(340, 186, 168);
  up(185, 408, 390); up(495, 408, 390);
  up(185, 482, 464); up(495, 482, 464);

  s.push(k.panel({ x: 680, y: 112, w: 240, h: 426, label: '怎么用这张图', tone: 'accent' }));
  [
    ['不是打勾清单', '找出最薄弱的一层\n有针对性地补'],
    ['按产出分级', '看做出了什么\n不看会几个工具品牌'],
    ['SFIA 四个维度', '自主性 · 复杂度\n影响 · 责任'],
  ].forEach(([t, sub], i) => s.push(k.box({ x: 700, y: 160 + i * 116, w: 200, h: 92, title: t, sub, titleSize: 'body', tone: 'accent' })));

  return k.figure({
    h: 590,
    title: 'Agent 工程师技能图谱：七层自底向上',
    subtitle: 'L2 和 L3 都建在 L1 上，一起汇到核心层 L4；往上是工具链、评估和工程化',
    body: s.join(''),
  });
};
