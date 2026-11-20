export const meta = {
  name: 'agent-subagent-contract-envelope-v2',
  article: 'knowledge/llm/agent/agent-subagents.md',
  alt: '用户只和主 Agent 交互；主 Agent 用调用合同委派 Subagent，合同写明目标和验收标准、输入快照、最小工具集、预算、完成条件和输出 schema；Subagent 在隔离上下文里观察、工作、验证，返回带状态、证据、产物、风险和未完成项的结果信封；主 Agent 重新校验 schema、来源和副作用后再合并交付，Subagent 不获得用户所有权',
};

export default (k) => {
  const s = [], Y = 188, H = 228;
  s.push(k.box({ x: 40, y: 112, w: 180, h: 40, title: '用户', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[130, 152], [130, Y]], both: true }));
  s.push(k.box({ x: 40, y: Y, w: 180, h: H, title: '主 Agent', sub: '拥有用户会话\n负责最终交付', tone: 'accent', strong: true }));

  s.push(k.arrow({ points: [[220, Y + 118], [250, Y + 118]], tone: 'accent' }));
  s.push(k.box({ x: 250, y: Y, w: 210, h: H, title: '调用合同', sub: '目标与验收标准\n输入快照 / hash\n允许的最小工具集\n预算：轮数、时间\ndone-when\n输出 schema', tone: 'accent' }));

  s.push(k.arrow({ points: [[460, Y + 118], [490, Y + 118]], tone: 'accent' }));
  s.push(k.frame({ x: 490, y: Y, w: 190, h: H, label: '隔离上下文' }));
  s.push(k.box({ x: 506, y: Y + 40, w: 158, h: 48, title: '观察', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 506, y: Y + 108, w: 158, h: 48, title: '工作', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 506, y: Y + 176, w: 158, h: 48, title: '自查验收', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[585, Y + 88], [585, Y + 108]], tone: 'info' }));
  s.push(k.arrow({ points: [[585, Y + 156], [585, Y + 176]], tone: 'info' }));

  s.push(k.arrow({ points: [[680, Y + 118], [710, Y + 118]], tone: 'info' }));
  s.push(k.box({ x: 710, y: Y, w: 210, h: H, title: '结果信封', sub: 'completed 或 blocked\nclaims + evidence\nartifacts + sha256\nassumptions\nrisks、remaining', tone: 'info' }));

  s.push(k.arrow({ points: [[815, Y + H], [815, 448], [130, 448], [130, Y + H]], tone: 'accent', label: '主 Agent 重新校验 schema、来源和副作用，再合并', labelAt: [472, 440] }));

  return k.figure({
    h: 560,
    title: 'Subagent：按合同调用，交回可合并的结果',
    subtitle: '这是 agents-as-tools：专家不接管用户对话；需要转移会话所有权的是 handoff，责任和退出协议都不同',
    body: s.join('') + k.note({ x: 40, y: 480, w: 880, h: 52, lead: '权限只能收窄：', text: '主 Agent 不能委派自己无权做的事，Subagent 也不能再委派来扩大权限。' }),
  });
};
