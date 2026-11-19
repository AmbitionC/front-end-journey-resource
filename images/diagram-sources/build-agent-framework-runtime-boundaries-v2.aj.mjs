export const meta = {
  name: 'build-agent-framework-runtime-boundaries-v2',
  article: 'knowledge/llm/agent/build-agent-framework.md',
  alt: '最小 Agent 运行时：运行循环依次调用模型、权限检查、执行工具、校验结果、写回状态、装配下一轮上下文；模型只提出动作，策略决定允许、拒绝或要确认，工具注册表提供 Schema 和超时，记忆在装配上下文时按需检索，状态保存进度和恢复点，遇到完成、失败、取消或超预算就终止',
};

const R1 = 228, R2 = 344;

export default (k) => k.figure({
  h: 610,
  title: '从零搭 Agent 运行时：模型提议，运行时执行',
  subtitle: '一个最小 Harness 要管六件事：上下文、循环、工具、状态、权限、终止',
  body: [
    k.box({ x: 393, y: 106, w: 180, h: 58, title: '策略', sub: '允许 / 拒绝 / 要确认', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[483, 164], [483, R1 - 4]], tone: 'warn' }),

    k.panel({ x: 250, y: 186, w: 460, h: 236, label: '运行循环' }),
    k.box({ x: 270, y: R1, w: 126, h: 60, title: '调用模型', titleSize: 'body' }),
    k.arrow({ points: [[396, R1 + 30], [416, R1 + 30]] }),
    k.box({ x: 420, y: R1, w: 126, h: 60, title: '权限检查', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[546, R1 + 30], [566, R1 + 30]] }),
    k.box({ x: 570, y: R1, w: 126, h: 60, title: '执行工具', titleSize: 'body' }),
    k.arrow({ points: [[633, R1 + 60], [633, R2 - 4]] }),
    k.box({ x: 570, y: R2, w: 126, h: 60, title: '校验结果', titleSize: 'body', tone: 'ok' }),
    k.arrow({ points: [[570, R2 + 30], [550, R2 + 30]] }),
    k.box({ x: 420, y: R2, w: 126, h: 60, title: '写回状态', titleSize: 'body', tone: 'info' }),
    k.arrow({ points: [[420, R2 + 30], [400, R2 + 30]] }),
    k.box({ x: 270, y: R2, w: 126, h: 60, title: '装配上下文', titleSize: 'body' }),
    k.arrow({ points: [[333, R2], [333, R1 + 64]], tone: 'accent', dashed: true, label: '下一轮', labelAt: [342, R2 - 22], labelAnchor: 'start' }),

    k.box({ x: 40, y: R1, w: 180, h: 60, title: '模型', sub: '只提出动作', titleSize: 'body' }),
    k.arrow({ points: [[224, R1 + 30], [266, R1 + 30]], both: true }),
    k.box({ x: 40, y: R2, w: 180, h: 60, title: '记忆', sub: '跨会话，按需检索', titleSize: 'body' }),
    k.arrow({ points: [[224, R2 + 30], [266, R2 + 30]], both: true }),

    k.box({ x: 740, y: R1, w: 180, h: 60, title: '工具注册表', sub: 'Schema、超时', titleSize: 'body' }),
    k.arrow({ points: [[700, R1 + 30], [736, R1 + 30]], both: true }),
    k.box({ x: 740, y: R2, w: 180, h: 60, title: '终止条件', sub: '完成、失败、超预算', titleSize: 'body', tone: 'bad' }),
    k.arrow({ points: [[700, R2 + 30], [736, R2 + 30]], tone: 'bad' }),

    k.arrow({ points: [[483, R2 + 60], [483, 448]], tone: 'info' }),
    k.box({ x: 250, y: 452, w: 460, h: 52, title: '状态：进度、工具结果、恢复点', titleSize: 'body', tone: 'info' }),

    k.note({ x: 40, y: 528, w: 880, h: 56, lead: '模型提出动作，运行时负责执行：', text: '权限在执行前检查，结果校验通过才写回状态。' }),
  ].join(''),
});
