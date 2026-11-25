export const meta = {
  name: 'agent-metrics-five-layers-v2',
  article: 'knowledge/llm/production/agent-metrics.md',
  alt: 'Agent 指标分五层，每层回答一个问题、有自己的代表指标和下降时先查的方向。第一层业务结果回答为什么要跑这个 Agent，看一次解决率、转人工率、复访率和满意度，下降时先查任务构成是否变了。第二层任务质量回答做对了没有，看意图是否解决、事实是否有证据、引用是否支持论断、Schema 是否合规，异常时看失败切片。第三层可靠性回答是否稳定按约定完成，看 Run 完成率、工具失败率、超时率、重试率和人工接管率，异常时定位工具或模型依赖。第四层延迟回答用户等多久，看 p50、p95、p99，拆出首个可见输出时间、队列与审批等待，上升时进 Trace 瀑布。第五层成本回答付出多少，看每 Run、每成功任务和每合格结果成本，上涨时拆 token、重试和外部工具。发布门禁要多个条件同时满足：质量不低于基线、安全关键用例全过、p95 不超预算、单位合格结果成本在范围内，不能加权成一个分数。单位合格结果成本等于有资格的总成本除以合格成功数，分母为零时告警，不显示 0',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 130, text: '这一层回答', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.text({ x: 280, y: 130, text: '代表指标', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.text({ x: 640, y: 130, text: '变差时先查', size: 'label', tone: 'muted', weight: 600 }));
  const rows = [
    ['1 业务结果', '为什么要跑它', '一次解决率 · 转人工率\n复访率 · 满意度', '任务构成是否变了', 'accent'],
    ['2 任务质量', '做对了没有', '意图解决 · 事实有证据\n引用支持论断 · Schema 合规', '看失败切片', 'ok'],
    ['3 可靠性', '是否稳定按约定完成', 'Run 完成率 · 工具失败率\n超时率 · 重试率 · 人工接管率', '定位工具或模型依赖', 'info'],
    ['4 延迟', '用户等多久', 'p50 / p95 / p99\n首个可见输出 · 队列与审批等待', '进 Trace 瀑布', 'info'],
    ['5 成本', '付出了多少', '每 Run · 每成功任务\n每合格结果成本', '拆 token、重试和外部工具', 'warn'],
  ];
  rows.forEach(([t, sub, m, c, tone], i) => {
    const y = 144 + i * 80;
    s.push(k.box({ x: 40, y, w: 220, h: 66, title: t, sub, titleSize: 'body', tone }));
    s.push(k.box({ x: 280, y, w: 340, h: 66, title: m, titleSize: 'label', tone: 'muted' }));
    s.push(k.arrow({ points: [[620, y + 33], [640, y + 33]] }));
    s.push(k.box({ x: 640, y, w: 280, h: 66, title: c, titleSize: 'label', tone: 'muted', strong: true }));
  });
  s.push(k.box({ x: 40, y: 552, w: 880, h: 84, title: '发布门禁：多个条件同时满足，不加权成一个分数', sub: '质量 ≥ 基线 · 安全关键用例全过 · p95 ≤ 预算 · 单位合格结果成本在范围内\n一次严重安全失败，不能被低延迟「抵消」', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 750,
    title: 'Agent 指标：五层分开看，变差时各有下钻方向',
    subtitle: '流量不等于完成，完成不等于成功，成功也不一定带来持续的业务价值',
    body: s.join('') + k.note({ x: 40, y: 660, w: 880, h: 52, lead: '成本看单位合格结果：', text: '有资格的总成本 ÷ 合格成功数；分母为 0 时告警，不要显示成 0。' }),
  });
};
