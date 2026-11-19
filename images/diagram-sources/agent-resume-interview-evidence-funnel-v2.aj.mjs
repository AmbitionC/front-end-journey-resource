export const meta = {
  name: 'agent-resume-interview-evidence-funnel-v2',
  article: 'knowledge/career/agent-resume-interview.md',
  alt: '求职证据漏斗：简历成果要点、作品集、技术筛选、Agent 系统设计、评测调试练习、行为面试逐层加深，每一层验证的能力不同，但都要回到同一个项目的可验证事实',
};

const rows = [
  ['简历成果要点', '问题、方案、指标、优化写清楚', 'accent'],
  ['作品集 / 产出物', '能打开的代码、文档、评测数据', 'accent'],
  ['技术筛选', '基础题和小任务能独立做完', 'info'],
  ['Agent 系统设计', '结构、接口、取舍讲得清', 'info'],
  ['评测 / 调试练习', '给日志能定位问题、验证修复', 'warn'],
  ['行为面试', '协作里你具体做了什么', 'warn'],
];
const Y0 = 120, RH = 54, GAP = 12;
const mid = (i) => Y0 + i * (RH + GAP) + RH / 2;

export default (k) => k.figure({
  h: 600,
  title: 'AI / Agent 求职：一层层验证同一个项目',
  subtitle: '越往下越难靠包装通过；每一轮追问的都是你写在简历上的那件事',
  body: [
    ...rows.map(([t, , tone], i) => {
      const w = 300 - i * 26;
      return k.box({ x: 190 - w / 2, y: Y0 + i * (RH + GAP), w, h: RH, title: `${i + 1}  ${t}`, titleSize: 'body', tone });
    }),
    ...rows.map(([, d], i) => k.text({ x: 364, y: mid(i) + 6, text: d, size: 'label', tone: 'sec' })),
    ...rows.map((_, i) => `<line x1="610" y1="${mid(i)}" x2="728" y2="${mid(i)}" stroke="${k.t.line}" stroke-width="1.5"/>`),
    `<line x1="728" y1="${mid(0)}" x2="728" y2="${mid(5)}" stroke="${k.t.line}" stroke-width="1.5"/>`,
    k.arrow({ points: [[728, (mid(0) + mid(5)) / 2], [756, (mid(0) + mid(5)) / 2]], tone: 'accent' }),
    k.box({ x: 760, y: (mid(0) + mid(5)) / 2 - 60, w: 160, h: 120, title: '同一个\n项目事实', sub: '代码、文档、\n评测记录', tone: 'accent', strong: true }),
    k.note({ x: 40, y: 524, w: 880, h: 54, lead: '数字要能追溯：', text: '简历上拿不出证据的指标，系统设计和调试那两轮一定会被问穿。' }),
  ].join(''),
});
