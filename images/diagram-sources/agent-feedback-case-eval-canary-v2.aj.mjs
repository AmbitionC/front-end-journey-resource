export const meta = {
  name: 'agent-feedback-case-eval-canary-v2',
  article: 'knowledge/llm/production/agent-feedback-loop.md',
  alt: '生产 Trace 和用户反馈经过分诊与失败分类，变成带输入夹具、环境夹具、期望属性、禁止副作用和切片的可重放案例，进入版本化评估集；只改一个组件的候选变更先跑离线多维评分和人工校准，再进影子或金丝雀发布；出现回归就暂停回滚，并把 trace 固化成新案例；评分分别看任务成功、证据、工具、权限安全、拒答、延迟和成本，并按切片报告',
};

export default (k) => {
  const s = [], R1 = 116, R2 = 256, R3 = 380, H = 96, W = 196, X = [40, 268, 496, 724];
  const row1 = [
    ['生产信号', 'Trace + 显式反馈\n隐式信号只算候选'],
    ['分诊', '去重、排除外部故障\n按失败阶段分类'],
    ['可重放案例', '输入 / 环境夹具\n期望属性、禁止副作用'],
    ['版本化评估集', '回归、安全、事故\n长尾；holdout 分开'],
  ];
  row1.forEach(([t, sub], i) => s.push(k.box({ x: X[i], y: R1, w: W, h: H, title: t, sub, tone: 'accent', strong: i === 2 })));
  for (let i = 0; i < 3; i++) s.push(k.arrow({ points: [[X[i] + W, R1 + 40], [X[i + 1], R1 + 40]], tone: 'accent' }));

  s.push(k.box({ x: X[2], y: R2, w: W, h: 84, title: '候选变更', sub: '只改一个组件\n记录完整 bundle', tone: 'info' }));
  s.push(k.box({ x: X[3], y: R2, w: W, h: 84, title: '离线评估', sub: '多维评分\n+ 人工校准', tone: 'info' }));
  s.push(k.arrow({ points: [[X[3] + 98, R1 + H], [X[3] + 98, R2]], tone: 'accent' }));
  s.push(k.arrow({ points: [[X[2] + W, R2 + 42], [X[3], R2 + 42]], tone: 'info' }));
  s.push(k.box({ x: X[3], y: R3, w: W, h: 84, title: '影子 / 金丝雀', sub: '预设窗口与阈值\n达标才扩量', tone: 'warn' }));
  s.push(k.arrow({ points: [[X[3] + 98, R2 + 84], [X[3] + 98, R3]], tone: 'info', label: '通过', labelAt: [X[3] + 110, R2 + 108], labelAnchor: 'start' }));
  s.push(k.box({ x: X[2], y: R3, w: W, h: 84, title: '回归就暂停回滚', sub: '把这条 trace\n固化成新案例', tone: 'bad' }));
  s.push(k.arrow({ points: [[X[3], R3 + 42], [X[2] + W, R3 + 42]], tone: 'bad' }));
  s.push(k.arrow({ points: [[X[2], R3 + 60], [480, R3 + 60], [480, R1 + 76], [X[2], R1 + 76]], tone: 'bad', dashed: true }));

  s.push(k.panel({ x: 40, y: R2, w: 412, h: 208, label: '分别评分，不用一个总分掩盖退化' }));
  const dims = ['任务成功', '事实 / 证据', '工具选择', '参数与后置验证', '权限 / 安全', '拒答是否恰当', '延迟', '成本'];
  dims.forEach((d, i) => s.push(k.box({ x: 58 + (i % 2) * 194, y: R2 + 40 + Math.floor(i / 2) * 40, w: 182, h: 32, title: d, titleSize: 'label' })));

  return k.figure({
    h: 572,
    title: '反馈闭环：生产信号先变成可重放案例，再验证候选',
    subtitle: '按语言、客户、工具、风险和上下文长度切片：总平均改善可能掩盖高风险小切片的退化',
    body: s.join('') + k.note({ x: 40, y: 492, w: 880, h: 52, lead: '不追单例改 wording：', text: '新案例要证明旧版本失败、候选通过，并检查相邻切片。' }),
  });
};
