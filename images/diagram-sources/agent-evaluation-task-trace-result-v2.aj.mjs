export const meta = {
  name: 'agent-evaluation-task-trace-result-v2',
  article: 'knowledge/llm/agent/agent-evaluation.md',
  alt: 'Agent 评估按任务、轨迹、结果三层记录和判定：任务层固定输入、初始状态和允许的工具，轨迹层记录工具名、参数、返回值、重试和副作用，结果层检查环境终态和用户看到的输出；在同一任务集上同时比较任务成功、鲁棒性、效率、成本与延迟，不只看准确率',
};

export default (k) => {
  const s = [], Y = [140, 228, 316], H = 72;
  s.push(k.text({ x: 40, y: 126, text: '层次', size: 'label', tone: 'muted' }));
  s.push(k.text({ x: 216, y: 126, text: '要记录什么', size: 'label', tone: 'muted' }));
  s.push(k.text({ x: 572, y: 126, text: '示例判定（改签任务）', size: 'label', tone: 'muted' }));
  const rows = [
    ['任务', '先冻结版本', '输入、初始状态、允许的工具', '用户要求改签，且不得重复扣款'],
    ['轨迹', '过程对不对', '工具名、参数、返回值、重试、副作用', '没调未授权工具，写操作带幂等键'],
    ['结果', '环境说了算', '环境终态 + 用户看到的输出', '订单状态、金额、通知都符合预期'],
  ];
  rows.forEach(([t, sub, rec, judge], i) => {
    s.push(k.box({ x: 40, y: Y[i], w: 160, h: H, title: t, sub, tone: 'accent', strong: i === 2 }));
    s.push(k.box({ x: 216, y: Y[i], w: 340, h: H, title: rec, titleSize: 'body', align: 'left' }));
    s.push(k.box({ x: 572, y: Y[i], w: 348, h: H, title: judge, titleSize: 'body', align: 'left', tone: 'ok' }));
    if (i < 2) s.push(k.arrow({ points: [[120, Y[i] + H], [120, Y[i + 1]]], tone: 'accent' }));
  });

  s.push(k.text({ x: 40, y: 432, text: '在同一任务集、同一运行配置下一起比较', size: 'label', tone: 'muted' }));
  const m = [
    ['任务成功', '规则判定环境终态', 'accent'],
    ['鲁棒性', '换说法、加噪声、断工具', 'warn'],
    ['效率', 'token、调用次数、步骤', 'info'],
    ['成本与延迟', '同一价格快照下比较', 'info'],
  ];
  m.forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 226, y: 448, w: 202, h: 72, title: t, sub, tone })));

  return k.figure({
    h: 630,
    title: 'Agent 评估：按任务、轨迹、结果三层判定',
    subtitle: '借鉴 AgentBench 的分环境切片和 WebArena 的可执行判定；公开基准分数不能直接外推到生产',
    body: s.join('') + k.note({ x: 40, y: 548, w: 880, h: 52, lead: '准确率不够：', text: '成功率最高的方案，可能成本、延迟或鲁棒性不达标。' }),
  });
};
