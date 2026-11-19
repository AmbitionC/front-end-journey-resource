export const meta = {
  name: 'agent-engineer-role-landscape-v2',
  article: 'knowledge/career/agent-role-landscape.md',
  alt: 'Agent 工程师五个方向围绕产品交付分工：应用做面向用户的功能，平台和运行时做模型接入、状态恢复、推理与成本，评估和质量做评测集与回归门禁，安全和治理做权限、审批与审计，研究工程做数据、训练与微调；每个方向列出核心产出和可核验的证据',
};

const ROWS = [
  ['应用', '文中：应用层', '面向用户的 Agent 功能、工具编排', '用户流程、可运行功能、任务评测'],
  ['平台 / 运行时', '文中：框架层 + Infra', '模型接入、状态恢复、推理与成本', '接口文档、恢复机制、成本观测'],
  ['评估 / 质量', '各方向都依赖', '评测集、自动评估、上线回归门禁', '评测报告、问题清单、回归结果'],
  ['安全 / 治理', '各方向都依赖', '权限、审批、防注入、审计', '策略文档、审计记录、红队结果'],
  ['研究工程', '文中：RL 训练 / 微调', '训练数据、RLHF / DPO 实验', '训练配置、模型能力回归结果'],
];

export default (k) => {
  const s = [], Y0 = 142, RH = 64, GAP = 10;
  s.push(k.text({ x: 40, y: 126, text: '方向', size: 'label', tone: 'muted' }));
  s.push(k.text({ x: 276, y: 126, text: '核心产出', size: 'label', tone: 'muted' }));
  s.push(k.text({ x: 612, y: 126, text: '面试和简历里能拿出来的证据', size: 'label', tone: 'muted' }));
  ROWS.forEach(([name, from, out, proof], i) => {
    const y = Y0 + i * (RH + GAP);
    const tone = i === 2 || i === 3 ? 'info' : 'accent';
    s.push(k.box({ x: 40, y, w: 220, h: RH, title: name, sub: from, tone }));
    s.push(k.box({ x: 276, y, w: 320, h: RH, title: out, titleSize: 'body', align: 'start' }));
    s.push(k.box({ x: 612, y, w: 308, h: RH, title: proof, titleSize: 'body', align: 'start' }));
  });
  return k.figure({
    h: 600,
    title: 'Agent 工程师：五个方向，围绕同一个产品交付',
    subtitle: '按产出判断方向，不按岗位名称；评估和安全单列，是因为每个方向都要对它们负责',
    body: s.join('') + k.note({ x: 40, y: 524, w: 880, h: 52, lead: '职责会交叉：', text: '这不是岗位分级或转型顺序，同一个人可以同时跨几个方向。' }),
  });
};
