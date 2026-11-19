export const meta = {
  name: 'agent-portfolio-evidence-stack-v2',
  article: 'knowledge/career/agent-project-portfolio.md',
  alt: 'GitHub 主页汇总多个项目，展开其中一个 Agent 作品，它的证据栈包括：清晰问题、在线演示、README 架构、评测集与结果、Trace 可观测、失败分析、安全与局限、可复现设置',
};

const items = [
  ['清晰问题', '用户、痛点、成功标准'],
  ['在线演示', '打开就能跑的入口'],
  ['README 架构', '组件、数据流、取舍'],
  ['评测集与结果', '指标定义 + 基线对比'],
  ['Trace / 可观测', '每步调用、耗时、成本'],
  ['失败分析', '失败案例、归因、改进'],
  ['安全与局限', '权限边界、已知不足'],
  ['可复现', '环境、数据、一键启动'],
];

export default (k) => k.figure({
  h: 580,
  title: 'Agent 作品集：每个项目都是一摞证据',
  subtitle: '主页负责让人找到项目，单个项目负责证明你真的做过、做得对',
  body: [
    k.panel({ x: 40, y: 110, w: 200, h: 370, label: 'GitHub 主页' }),
    ...['项目 A', '项目 B', '项目 C', '项目 D'].map((t, i) => k.box({ x: 56, y: 150 + i * 64, w: 168, h: 50, title: t, titleSize: 'body', tone: i === 2 ? 'accent' : 'default' })),
    k.text({ x: 140, y: 438, text: '更多项目…', size: 'label', tone: 'muted', anchor: 'middle' }),
    k.arrow({ points: [[224, 303], [266, 303]], tone: 'accent' }),

    k.panel({ x: 270, y: 110, w: 650, h: 370, label: '项目 C 展开：一个作品条目的证据栈', tone: 'accent' }),
    ...items.map(([t, s], i) => k.box({ x: 290 + (i % 2) * 320, y: 150 + Math.floor(i / 2) * 80, w: 290, h: 66, title: `${i + 1}  ${t}`, sub: s, titleSize: 'body', align: 'left' })),

    k.note({ x: 40, y: 500, w: 880, h: 56, lead: '截图合集不是作品集：', text: '能跑、有评测、有失败分析，面试官才相信你真的做过。' }),
  ].join(''),
});
