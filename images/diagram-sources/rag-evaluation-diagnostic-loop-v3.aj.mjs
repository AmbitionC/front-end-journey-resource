export const meta = {
  name: 'rag-evaluation-diagnostic-loop-v3',
  article: 'knowledge/llm/rag/rag-evaluation.md',
  alt: '评测集同时喂给检索层、生成层和端到端三层指标：检索看 Recall@K、Precision@K、MRR 与 nDCG，生成看忠实度和答案相关性，端到端看任务成功率、延迟与成本；三层结果汇入错误切片，每次只改一个主要变量，在冻结回归集上和基线对比，人工复核校准 Judge、抽查争议样本，再把新失败样本加回评测集；另留不参与调优的 holdout 做最终结论',
};

const layers = [
  [40, '检索层：证据进来了吗', ['Recall@K', 'Precision@K', 'MRR、nDCG']],
  [340, '生成层：答案忠于证据吗', ['忠实度', '答案相关性', 'LLM Judge + 人工抽查']],
  [640, '端到端：任务完成了吗', ['任务成功率', 'P95 延迟', '每次查询成本']],
];

export default (k) => k.figure({
  h: 620,
  title: 'RAG 评估：分层定位，再单变量回归',
  subtitle: '自动指标、LLM Judge 和人工复核互补，不要压成一个看似精确的总分',
  body: [
    k.box({ x: 300, y: 106, w: 360, h: 60, title: '评测集', sub: '开发集、冻结回归集、holdout', titleSize: 'body', tone: 'accent' }),
    k.arrow({ points: [[480, 166], [480, 194]] }),
    `<path d="M180,180 H780" fill="none" stroke="${k.t.line}" stroke-width="1.7"/>`,
    k.arrow({ points: [[180, 180], [180, 194]] }),
    k.arrow({ points: [[780, 180], [780, 194]] }),
    ...layers.map(([x, label, ms]) => k.panel({ x, y: 198, w: 280, h: 140, label }) +
      ms.map((m, i) => k.text({ x: x + 20, y: 254 + i * 28, text: `· ${m}`, size: 'label', tone: 'sec' })).join('')),

    k.arrow({ points: [[180, 338], [180, 410], [336, 410]] }),
    k.arrow({ points: [[480, 338], [480, 376]] }),
    k.arrow({ points: [[780, 338], [780, 410], [624, 410]] }),
    k.box({ x: 340, y: 380, w: 280, h: 60, title: '错误切片', sub: '按问题类型、来源、失败层分组', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[480, 440], [480, 466]] }),
    k.box({ x: 340, y: 470, w: 280, h: 60, title: '只改一个主要变量', sub: '切块、召回、重排或 Prompt', titleSize: 'body' }),
    k.arrow({ points: [[340, 500], [304, 500]] }),
    k.box({ x: 40, y: 470, w: 260, h: 60, title: '回归测试', sub: '在冻结集上和基线对比', titleSize: 'body', tone: 'ok' }),
    k.arrow({ points: [[40, 500], [24, 500], [24, 136], [296, 136]], tone: 'accent', dashed: true, label: '新失败样本加回评测集', labelAt: [150, 128] }),
    k.arrow({ points: [[660, 500], [624, 500]], dashed: true }),
    k.box({ x: 660, y: 470, w: 260, h: 60, title: '人工复核', sub: '校准 Judge，抽查争议样本', titleSize: 'body', dashed: true }),

    k.note({ x: 40, y: 550, w: 880, h: 52, lead: '调参会过拟合评测集：', text: '冻结回归集用来和基线对比；另留一份不参与调优的 holdout，结论以它为准。' }),
  ].join(''),
});
