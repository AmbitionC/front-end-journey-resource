export const meta = {
  name: 'llm-alignment-four-layers-v3',
  article: 'knowledge/llm/basics/llm-alignment.md',
  alt: '对齐后训练栈四层：示范数据进入监督微调 SFT，主要教格式、对话模板、工具 schema 和拒答方式，风险是示范太简单，遇到长任务和工具错误就失灵；偏好对进入偏好优化（奖励模型加强化学习，或 DPO），用于没有唯一答案时选出更好的回答，风险是 reward hacking，比如过度冗长、过度自信；原则与红队样本进入原则、安全政策和红队这一层，划清危险类别的边界，既不放行也不过度拒答，风险是覆盖不到新的绕过方式；系统级控制不在模型参数里，由权限、工具白名单、人工审批和审计这些确定性代码负责，风险是权限给得过宽时，一次错误工具调用就会造成真实损失。每层都降低风险，但没有一层是零风险保证，评估要同时看帮助性、真实性、安全拒答和过度拒答',
};

export default (k) => {
  const s = [], Y0 = 152, RP = 96, RH = 80;
  [[40, '输入数据'], [260, '后训练层'], [512, '主要改变什么'], [732, '典型风险']].forEach(([x, t]) => s.push(k.text({ x, y: 134, text: t, size: 'label', tone: 'muted' })));
  const rows = [
    ['示范', '输入 → 理想输出', 'SFT 监督微调', '格式、对话模板\n工具 schema、拒答方式', '示范太简单，长任务\n和工具出错时失灵', 'info'],
    ['偏好对', '同一问题 A ≻ B', '偏好优化', '没有唯一答案时\n选出更好的回答', 'reward hacking：\n冗长、过度自信', 'info'],
    ['原则与红队样本', '自然语言原则、攻击', '原则、安全政策、红队', '危险类别的边界\n不放行也不过度拒答', '覆盖不到\n新的绕过方式', 'warn'],
    ['运行时上下文', '用户、工具、数据', '系统级控制', '权限、工具白名单\n审批、审计', '权限给宽了，一次错误\n工具调用就是真实损失', 'accent'],
  ];
  rows.forEach(([d, dsub, layer, change, risk, tone], i) => {
    const y = Y0 + i * RP;
    if (i) s.push(`<line x1="40" y1="${y - 8}" x2="920" y2="${y - 8}" stroke="${k.t.faint}" stroke-width="1"/>`);
    s.push(k.box({ x: 40, y, w: 190, h: RH, title: d, sub: dsub, titleSize: 'body', tone: 'muted' }));
    s.push(k.arrow({ points: [[230, y + RH / 2], [260, y + RH / 2]], tone }));
    s.push(k.box({ x: 260, y, w: 226, h: RH, title: layer, sub: i === 1 ? 'RM + RL，或 DPO' : null, titleSize: 'body', tone, strong: true }));
    s.push(k.text({ x: 512, y: y + 34, text: change, size: 'label' }));
    s.push(k.text({ x: 732, y: y + 34, text: risk, size: 'label', tone: 'bad' }));
  });

  return k.figure({
    h: 610,
    title: '对齐后训练栈：不同数据进不同层，各管一类问题',
    subtitle: '“符合人类价值”要拆成可观察行为：完成允许的任务、不编造、安全但不过度拒答、尊重权限',
    body: s.join('') + k.note({ x: 40, y: 534, w: 880, h: 52, lead: '每层降低风险，没有一层是零风险保证：', text: '评估同时看帮助性、真实性、安全拒答和过度拒答。' }),
  });
};
