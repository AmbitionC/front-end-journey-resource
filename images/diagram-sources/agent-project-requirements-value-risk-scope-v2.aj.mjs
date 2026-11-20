export const meta = {
  name: 'agent-project-requirements-value-risk-scope-v2',
  article: 'knowledge/career/agent-project-requirements.md',
  alt: '定义 Agent 项目先摸清六件事：工作流痛点、谁在用、现状基线、可衡量价值、数据与权限、风险；再收敛成带验收标准的最小闭环，第一版只做流程可观察、数据权限已确认、成功标准可量化的部分，其余明确先不做',
};

const steps = [
  ['工作流痛点', '耗时、重复\n易出错'],
  ['谁在用', '谁痛、谁用\n谁拍板'],
  ['现状基线', '现在几步\n多久、多少钱'],
  ['可衡量价值', '省时、降本\n质量提升'],
  ['数据与权限', '数据从哪来\n工具能不能调'],
  ['风险', '出错代价\n隐私与合规'],
];
const cx = (i) => 105 + i * 150;

export default (k) => k.figure({
  h: 590,
  title: '定义 Agent 项目：从真实痛点收敛到第一版',
  subtitle: '先摸清六件事，再决定做多小；“接个聊天框”不是需求',
  body: [
    ...steps.map(([t, s], i) => k.box({ x: 40 + i * 150, y: 116, w: 130, h: 104, title: t, sub: s, titleSize: 'body', tone: i === 5 ? 'warn' : 'default' })),
    `<path d="${steps.map((_, i) => `M${cx(i)},220 V250`).join(' ')} M${cx(0)},250 H${cx(5)}" fill="none" stroke="${k.t.line}" stroke-width="1.6"/>`,
    k.arrow({ points: [[480, 250], [480, 276]] }),
    k.box({ x: 330, y: 280, w: 300, h: 60, title: '收敛第一版', sub: '最小闭环 + 验收标准', titleSize: 'body', tone: 'accent' }),
    `<path d="M480,340 V360 M295,360 H665" fill="none" stroke="${k.t.line}" stroke-width="1.6"/>`,
    k.arrow({ points: [[295, 360], [295, 380]], tone: 'ok' }),
    k.arrow({ points: [[665, 360], [665, 380]], tone: 'bad' }),
    k.box({ x: 130, y: 384, w: 330, h: 104, title: '第一版做', sub: '一段可观察的流程\n数据和权限已确认\n成功标准能量化', titleSize: 'body', tone: 'ok' }),
    k.box({ x: 500, y: 384, w: 330, h: 104, title: '明确先不做', sub: '数据或权限没落实\n出错代价太高\n成功标准说不清', titleSize: 'body', tone: 'bad' }),

    k.note({ x: 40, y: 512, w: 880, h: 56, lead: '能力清单替代不了结果标准：', text: '“支持 20 个工具”说明不了用户的事有没有变好。' }),
  ].join(''),
});
