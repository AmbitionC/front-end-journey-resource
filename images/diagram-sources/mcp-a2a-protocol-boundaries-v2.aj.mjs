export const meta = {
  name: 'mcp-a2a-protocol-boundaries-v2',
  article: 'knowledge/llm/agent/mcp-protocol.md',
  alt: '左侧 MCP：Host 内有模型、策略与授权和 MCP Client（每个 Server 各一个），Client 与文件系统、GitHub、数据库等 MCP Server 依次 initialize、initialized 通知、tools/list、tools/call；右侧 A2A：委托方读取 Agent Card 后把 Task 交给远程智能体，对方返回 Artifact，远程智能体内部仍可用 MCP 调工具',
};

const servers = [['文件系统', 170], ['GitHub', 260], ['数据库', 350]];

export default (k) => k.figure({
  h: 550,
  title: 'MCP 与 A2A：一个接工具，一个托任务',
  subtitle: '两者可以组合，但不是必须逐层叠加的协议栈',
  body: [
    k.panel({ x: 40, y: 110, w: 540, h: 340, label: 'MCP：应用接入外部能力' }),
    k.frame({ x: 60, y: 146, w: 220, h: 248, label: 'Host（你的应用）', labelPos: 'bottom' }),
    k.box({ x: 80, y: 156, w: 180, h: 60, title: '模型', sub: '决定调哪个工具', titleSize: 'body' }),
    k.box({ x: 80, y: 224, w: 180, h: 60, title: '策略与授权', sub: '用户确认、权限', titleSize: 'body', tone: 'warn' }),
    k.box({ x: 80, y: 292, w: 180, h: 60, title: 'MCP Client', sub: '每个 Server 各一个', titleSize: 'body', tone: 'accent' }),
    k.arrow({ points: [[260, 322], [320, 322]], head: false, tone: 'accent' }),
    `<line x1="320" y1="202" x2="320" y2="382" stroke="${k.t.accent}" stroke-width="1.7"/>`,
    ...servers.map(([t, y]) => k.box({ x: 380, y, w: 180, h: 64, title: t, sub: 'MCP Server', titleSize: 'body' })),
    ...servers.map(([, y]) => k.arrow({ points: [[320, y + 32], [376, y + 32]], tone: 'accent' })),
    k.text({ x: 60, y: 438, text: 'initialize 协商 → initialized 通知 → tools/list → tools/call', size: 'note', tone: 'sec' }),

    k.panel({ x: 600, y: 110, w: 320, h: 340, label: 'A2A：智能体之间委托任务' }),
    k.box({ x: 650, y: 148, w: 220, h: 60, title: '智能体 A', sub: '委托方', titleSize: 'body', tone: 'info' }),
    k.text({ x: 760, y: 236, text: '先读 Agent Card 了解对方能力', size: 'note', tone: 'muted', anchor: 'middle' }),
    k.arrow({ points: [[720, 250], [720, 322]], tone: 'info', label: 'Task', labelAt: [710, 292], labelAnchor: 'end' }),
    k.arrow({ points: [[800, 322], [800, 250]], tone: 'ok', label: 'Artifact', labelAt: [810, 292], labelAnchor: 'start' }),
    k.box({ x: 650, y: 326, w: 220, h: 64, title: '远程智能体 B', sub: '内部可再用 MCP 调工具', titleSize: 'body', tone: 'info' }),
    k.text({ x: 620, y: 438, text: '委托方仍要校验结果、超时与取消', size: 'note', tone: 'sec' }),

    k.note({ x: 40, y: 470, w: 880, h: 56, lead: '“都支持 MCP”不等于能互通：', text: '协议版本、认证方式、业务语义都要在初始化和验收时核对。' }),
  ].join(''),
});
