export const meta = {
  name: 'agent-benchmark-contract-report-v3',
  article: 'knowledge/llm/production/agent-benchmark.md',
  alt: '左侧是“怎么测”的实验合同：任务集写清目标、初始状态、工具权限、预算和可观察的成功条件；数据集记录来源、许可、去重和版本，开发、验证、保留测试分开，这里要防污染；Harness 固定夹具、模型参数和预算，并区分基础设施失败和任务失败；Scorer 先验后置条件和安全门禁，再看语义质量分。右侧是“怎么看”的解读卡：安全和关键后置条件是独立门禁，质量分不能抵消；按任务类型、难度和风险切片；报告均值、分位数、置信区间和失败频率；基础设施失败单列；记录模型、Prompt、Harness、数据和价格版本。聚合陷阱：95 个简单题全过、5 个高风险写任务全挂，总成功率 95% 仍不能上线',
};

export default (k) => {
  const s = [];
  s.push(k.frame({ x: 40, y: 112, w: 460, h: 432, label: '怎么测：一份实验合同' }));
  const L = [
    ['任务集', '目标、初始状态、工具权限、预算\n可观察的成功条件', null],
    ['数据集', '来源、许可、去重、版本\n开发 / 验证 / 保留测试分开', '防污染'],
    ['Harness', '固定夹具、模型参数、预算\n基础设施失败 ≠ 任务失败', null],
    ['Scorer', '先验后置条件和安全门禁\n再看语义质量分', null],
  ];
  L.forEach(([t, sub, trap], i) => {
    const y = 152 + i * 94;
    s.push(k.box({ x: 60, y, w: 320, h: 84, title: t, sub, titleSize: 'body', tone: 'info' }));
    if (trap) {
      s.push(k.arrow({ points: [[380, y + 42], [404, y + 42]], tone: 'bad', dashed: true }));
      s.push(k.box({ x: 404, y: y + 24, w: 80, h: 36, title: trap, titleSize: 'label', tone: 'bad' }));
    }
  });

  s.push(k.frame({ x: 520, y: 112, w: 400, h: 432, label: '怎么看：结果解读卡' }));
  [
    ['关键门禁独立', '安全、后置条件失败，质量分不能抵消'],
    ['按切片报告', '任务类型、难度、语言、风险'],
    ['报告不确定性', '均值 + 分位数 + 置信区间 + 失败频率'],
    ['版本写全', '模型、Prompt、Harness、数据、价格'],
  ].forEach(([t, d], i) => {
    s.push(k.text({ x: 540, y: 168 + i * 58, text: `${i + 1}. ${t}`, size: 'label', weight: 600 }));
    s.push(k.text({ x: 560, y: 190 + i * 58, text: d, size: 'note', tone: 'muted' }));
  });
  s.push(k.box({ x: 540, y: 412, w: 360, h: 112, title: '聚合陷阱', sub: '95 道简单题全过\n+ 5 个高风险写任务全挂\n= 总成功率 95%，仍不能上线', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 580,
    title: 'Agent Benchmark：不是一列分数，是一份实验合同',
    subtitle: '先写评估要回答的决策问题，再固定任务、数据、执行器和评分；报告要说清怎么解读',
    body: s.join(''),
  });
};
