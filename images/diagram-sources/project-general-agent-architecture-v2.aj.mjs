export const meta = {
  name: 'project-general-agent-architecture-v2',
  article: 'project/general-agent/ga-architecture.md',
  alt: '通用 Agent 系统架构：交互层在上，内核层包含执行循环、上下文管理器、权限闸门和子任务调度器，能力层通过工具注册表挂载编程工具、研究工具、技能加载器和 MCP 客户端，左侧为状态层，右侧为外部依赖',
};

export default (k) => k.figure({
  h: 756,
  title: '通用 Agent 系统架构：一套内核，挂不同工具',
  subtitle: '挂文件和命令工具是编程助手，挂搜索和网页工具是研究助手',
  body: [
    k.frame({ x: 230, y: 112, w: 500, h: 106, label: '交互层' }),
    k.box({ x: 246, y: 146, w: 148, h: 60, title: '终端界面', sub: '流式输出、确认', tone: 'info' }),
    k.box({ x: 406, y: 146, w: 148, h: 60, title: '研究进度页', sub: '计划、来源、报告', tone: 'info' }),
    k.box({ x: 566, y: 146, w: 148, h: 60, title: '无界面模式', sub: '给评测脚本调用', tone: 'info' }),
    k.arrow({ points: [[480, 218], [480, 272]] }),

    k.frame({ x: 230, y: 240, w: 500, h: 206, label: '内核层' }),
    k.box({ x: 246, y: 276, w: 468, h: 64, title: '执行循环（两种模式共用）', sub: '调模型、派发工具调用、判断何时停', tone: 'accent' }),
    k.arrow({ points: [[320, 340], [320, 364]], both: true }),
    k.arrow({ points: [[480, 340], [480, 364]] }),
    k.arrow({ points: [[640, 340], [640, 364]] }),
    k.box({ x: 246, y: 368, w: 148, h: 64, title: '上下文管理器', sub: '拼装、计数、压缩', tone: 'accent' }),
    k.box({ x: 406, y: 368, w: 148, h: 64, title: '权限闸门', sub: '危险操作先问人', tone: 'warn' }),
    k.box({ x: 566, y: 368, w: 148, h: 64, title: '子任务调度器', sub: '只收回结论', tone: 'accent' }),
    k.arrow({ points: [[480, 432], [480, 502]], label: '放行后执行', labelAt: [492, 462], labelAnchor: 'start' }),

    k.frame({ x: 230, y: 470, w: 500, h: 196, label: '能力层（按模式装配）' }),
    k.box({ x: 246, y: 506, w: 468, h: 52, title: '工具注册表：名称、用途、参数、执行器' }),
    k.arrow({ points: [[300, 558], [300, 578]] }),
    k.arrow({ points: [[420, 558], [420, 578]] }),
    k.arrow({ points: [[540, 558], [540, 578]] }),
    k.arrow({ points: [[660, 558], [660, 578]] }),
    k.box({ x: 246, y: 582, w: 108, h: 64, title: '编程工具', sub: '读写、命令', titleSize: 'body' }),
    k.box({ x: 366, y: 582, w: 108, h: 64, title: '研究工具', sub: '搜索、网页', titleSize: 'body' }),
    k.box({ x: 486, y: 582, w: 108, h: 64, title: '技能加载器', sub: '按需读说明', titleSize: 'body' }),
    k.box({ x: 606, y: 582, w: 108, h: 64, title: 'MCP 客户端', sub: '接外部服务', titleSize: 'body' }),

    k.frame({ x: 40, y: 240, w: 170, h: 426, label: '状态层' }),
    k.box({ x: 54, y: 276, w: 142, h: 64, title: '会话记录', sub: '每步一行' }),
    k.box({ x: 54, y: 368, w: 142, h: 64, title: '长期记忆', sub: 'SQLite' }),
    k.box({ x: 54, y: 500, w: 142, h: 64, title: '检查点', sub: '断点续跑' }),
    k.arrow({ points: [[246, 308], [200, 308]] }),
    k.arrow({ points: [[246, 400], [200, 400]], both: true }),
    k.arrow({ points: [[246, 532], [200, 532]], dashed: true }),

    k.frame({ x: 750, y: 240, w: 170, h: 426, label: '外部依赖' }),
    k.box({ x: 764, y: 276, w: 142, h: 64, title: '模型接口', sub: 'OpenAI 兼容' }),
    k.box({ x: 764, y: 582, w: 142, h: 64, title: '文件、搜索', sub: 'MCP 服务' }),
    k.arrow({ points: [[714, 308], [760, 308]], both: true }),
    k.arrow({ points: [[714, 614], [760, 614]] }),

    k.note({ x: 40, y: 684, w: 880, h: 52, lead: '内核不认识具体工具：', text: '只和注册表打交道，每次工具调用都先过权限闸门。' }),
  ].join(''),
});
