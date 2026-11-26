export const meta = {
  name: 'project-general-agent-context-window-v2',
  article: 'project/general-agent/ga-context.md',
  alt: '一次模型调用的上下文从上到下依次是系统提示词、工具定义、项目说明与长期记忆摘要、历史摘要、最近若干轮对话、本轮用户输入；越靠上越稳定，超过预算时先丢弃工具结果正文，再把早期对话合成摘要',
};

const rows = [
  ['系统提示词：身份、行为准则、输出约定', '全程不变，可命中缓存', 'info'],
  ['工具定义：名称、用途、参数格式', '随模式和 MCP 接入变化', 'info'],
  ['项目说明文件与长期记忆摘要', '会话开始时读入', 'default'],
  ['历史摘要：被压缩掉的早期对话', '超限时由压缩器生成', 'warn'],
  ['最近若干轮：模型回复、工具调用、工具结果', '原样保留，调用与结果成对', 'accent'],
  ['本轮用户输入', '最新', 'accent'],
];

export default (k) => k.figure({
  h: 590,
  title: '一次模型调用的上下文由什么组成',
  subtitle: '从上到下是拼装顺序；越靠上越稳定，越靠下变化越快',
  body: [
    ...rows.map(([title, side, tone], i) =>
      k.box({ x: 40, y: 120 + i * 64, w: 560, h: 52, title, tone }) +
      k.text({ x: 624, y: 152 + i * 64, text: side, size: 'label', tone: 'sec' })),
    k.note({ x: 40, y: 518, w: 880, h: 52, lead: '超过窗口 80% 触发压缩：', text: '先丢过长的工具结果，再合并最早几轮；调用和结果不拆散。' }),
  ].join(''),
});
