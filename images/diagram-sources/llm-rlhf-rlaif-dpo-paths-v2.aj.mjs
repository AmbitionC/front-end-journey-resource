export const meta = {
  name: 'llm-rlhf-rlaif-dpo-paths-v2',
  article: 'knowledge/llm/basics/llm-rlhf-dpo.md',
  alt: '三条路径都从同一 prompt 的 chosen 优于 rejected 的偏好数据出发：RLHF 由人工排序训练奖励模型，再采样当前策略用 PPO 加 KL 约束更新；RLAIF 由人定原则、AI 比较回答产生偏好，再训练奖励模型做强化学习；DPO 用 chosen、rejected 对和参考策略直接计算偏好损失更新策略，不需要显式奖励模型和 rollout；三者分别有奖励投机、放大反馈偏差、离线覆盖不足的风险，都依赖偏好质量和独立评估',
};

export default (k) => {
  const s = [], FY = 222, FH = 268, X = [40, 340, 640], W = 280;
  s.push(k.box({ x: 40, y: 112, w: 880, h: 72, title: '偏好样本：同一 prompt 下 chosen ≻ rejected', sub: '例：“为什么需要数据库事务” — 先讲原子性再举转账例子 ≻ “事务就是让数据库更快”', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[480, 184], [480, 204]], head: false }));
  s.push(k.arrow({ points: [[180, 204], [780, 204]], head: false }));
  for (const x of X) s.push(k.arrow({ points: [[x + W / 2, 204], [x + W / 2, FY]] }));

  const cols = [
    ['RLHF', 'info', [['人工排序', null], ['奖励模型 r(x, y)', null], ['PPO 更新 + KL 约束', '持续采样当前策略']], '风险：奖励投机、不稳定、成本高'],
    ['RLAIF', 'info', [['人定原则，AI 比较', null], ['奖励模型', null], ['强化学习更新', '仍要人工抽检与红队']], '风险：更便宜地复制反馈偏差'],
    ['DPO', 'accent', [['偏好对 + 参考策略', null], ['直接偏好损失（β）', '没有奖励模型和 rollout'], ['策略更新', null]], '风险：离线数据覆盖不足'],
  ];
  cols.forEach(([name, tone, steps, risk], c) => {
    const x = X[c];
    s.push(k.frame({ x, y: FY, w: W, h: FH, label: name }));
    let y = FY + 40;
    steps.forEach(([t, sub], i) => {
      const h = sub ? 64 : 48;
      s.push(k.box({ x: x + 20, y, w: W - 40, h, title: t, sub, titleSize: 'body', tone, strong: i === steps.length - 1 }));
      if (i < steps.length - 1) s.push(k.arrow({ points: [[x + W / 2, y + h], [x + W / 2, y + h + 16]], tone }));
      y += h + 16;
    });
    s.push(k.text({ x: x + 20, y: FY + FH - 18, text: risk, size: 'note', tone: 'warn' }));
  });

  return k.figure({
    h: 600,
    title: 'RLHF、RLAIF、DPO：偏好从哪来，策略怎么更新',
    subtitle: '先分开两个问题：反馈来自人还是 AI，更新走奖励模型 + 强化学习，还是直接优化偏好对',
    body: s.join('') + k.note({ x: 40, y: 516, w: 880, h: 52, lead: '三条路都靠偏好质量：', text: '训练损失下降不等于业务效果，要用独立评估验收。' }),
  });
};
