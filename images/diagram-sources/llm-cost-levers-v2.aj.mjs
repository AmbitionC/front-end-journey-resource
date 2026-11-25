export const meta = {
  name: 'llm-cost-levers-v2',
  article: 'knowledge/llm/production/llm-cost-optimize.md',
  alt: 'LLM 成本优化的五个杠杆，按请求经过的顺序排列，每个都写明收益怎么量、主要质量风险是什么。模型路由：用小模型先把请求分成简单、中等、复杂三档，收益按各档请求量乘对应模型实际单价计算，风险是错误降级。语义缓存：相似度超过已校准阈值才算命中，收益是省下的生成费用减去检索成本，风险是误命中、陈旧和跨租户泄漏。Prompt 压缩：去冗余并改成结构化指令，比较压缩前后的实际 token 和任务分数，风险是丢掉约束或证据。上下文裁剪用于实时长会话，滑动窗口加摘要，量每轮输入 token 和任务分数，风险是遗忘早期约束。Batch API 用于可延迟的离线任务，与实时路径的同批账单对照，代价是完成更晚、要处理失败恢复。原则是先监控再优化：先建立每请求成本基线，每个策略都要有配置开关可快速回滚，计算净节省而不是毛节省',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 130, text: '杠杆', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.text({ x: 372, y: 130, text: '收益怎么量', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.text({ x: 662, y: 130, text: '主要质量风险', size: 'label', tone: 'muted', weight: 600 }));
  const rows = [
    ['1 模型路由', '小模型先分档：简单 / 中等 / 复杂', '各档请求量 × 对应模型单价', '错误降级'],
    ['2 语义缓存', '相似度超过校准阈值才算命中', '省下的生成费 − 检索成本', '误命中 · 陈旧 · 跨租户泄漏'],
    ['3 Prompt 压缩', '去冗余 + 结构化指令', '压缩前后 token 与任务分数', '丢掉约束或证据'],
    ['4 上下文裁剪（实时）', '长会话：滑动窗口 + 摘要', '每轮输入 token 与任务分数', '遗忘早期约束'],
    ['5 Batch API（离线）', '只给可延迟的离线任务', '与实时路径同批账单对照', '完成更晚 · 要做失败恢复'],
  ];
  rows.forEach(([t, sub, m, r], i) => {
    const y = 144 + i * 84;
    s.push(k.box({ x: 40, y, w: 310, h: 68, title: t, sub, titleSize: 'body', tone: 'accent' }));
    s.push(k.box({ x: 370, y, w: 270, h: 68, title: m, titleSize: 'label', tone: 'info' }));
    s.push(k.box({ x: 660, y, w: 260, h: 68, title: r, titleSize: 'label', tone: 'bad' }));
  });

  return k.figure({
    h: 660,
    title: 'LLM 成本：五个杠杆，各自量收益、盯风险',
    subtitle: '按请求经过的顺序排列；4 和 5 二选一，看请求是实时还是可延迟',
    body: s.join('') + k.note({ x: 40, y: 572, w: 880, h: 52, lead: '先监控再优化：', text: '先建每请求成本基线；每个策略配开关可快速回滚，算净节省而不是毛节省。' }),
  });
};
