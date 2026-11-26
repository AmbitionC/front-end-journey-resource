export const meta = {
  name: 'project-ecom-growth-architecture-v2',
  article: 'project/ecom-growth/eg-architecture.md',
  alt: '电商营销增长助手架构：营销任务进入活动主管 Agent，主管与投放看板双向交互；生产区包含商品理解、人群分层、素材生成和合规与调性审核；试投区包含预算分配、试投环境、效果归因和素材进化；审核通过的素材进入试投，进化后的素材重新送审；底部是商品库、人群画像库、素材库、规则库和投放日志组成的数据层',
};

export default (k) => k.figure({
  h: 664,
  title: '电商营销增长助手架构：生产、试投、再改写',
  subtitle: '给一个商品和一个目标，系统自己圈人群、出素材、审核、试投、看数据、改写再投',
  body: [
    k.box({ x: 40, y: 120, w: 170, h: 70, title: '营销任务', sub: '商品、目标、预算' }),
    k.arrow({ points: [[210, 155], [246, 155]] }),
    k.box({ x: 250, y: 120, w: 380, h: 70, title: '活动主管 Agent', sub: '拆任务、安排每一轮、决定何时停', tone: 'accent' }),
    k.arrow({ points: [[630, 155], [666, 155]], both: true }),
    k.box({ x: 670, y: 120, w: 250, h: 70, title: '投放看板', sub: '关键节点等人确认', tone: 'info' }),
    k.arrow({ points: [[330, 190], [330, 222]] }),
    k.arrow({ points: [[590, 190], [590, 222]] }),

    k.frame({ x: 40, y: 226, w: 420, h: 214, label: '生产：把商品变成可投的素材' }),
    k.box({ x: 54, y: 262, w: 120, h: 64, title: '商品理解', sub: '卖点、禁区' }),
    k.arrow({ points: [[174, 294], [186, 294]] }),
    k.box({ x: 190, y: 262, w: 120, h: 64, title: '人群分层', sub: '谁会买' }),
    k.arrow({ points: [[310, 294], [322, 294]] }),
    k.box({ x: 326, y: 262, w: 120, h: 64, title: '素材生成', sub: '多版文案' }),
    k.arrow({ points: [[386, 326], [386, 352]] }),
    k.box({ x: 54, y: 356, w: 392, h: 64, title: '合规与调性审核', sub: '规则先拦，模型再判，通过才投', tone: 'bad' }),

    k.frame({ x: 500, y: 226, w: 420, h: 214, label: '试投：小流量先试，再决定钱花在哪' }),
    k.box({ x: 514, y: 262, w: 120, h: 64, title: '预算分配', sub: '先探索后倾斜', tone: 'info' }),
    k.arrow({ points: [[634, 294], [646, 294]] }),
    k.box({ x: 650, y: 262, w: 120, h: 64, title: '试投环境', sub: '模拟用户池', tone: 'info' }),
    k.arrow({ points: [[770, 294], [782, 294]] }),
    k.box({ x: 786, y: 262, w: 120, h: 64, title: '效果归因', sub: '哪种写法有效', tone: 'info' }),
    k.arrow({ points: [[846, 326], [846, 352]] }),
    k.box({ x: 514, y: 356, w: 392, h: 64, title: '素材进化', sub: '淘汰差的、改写好的，重新送审', tone: 'accent' }),

    k.arrow({ points: [[446, 374], [480, 374], [480, 294], [510, 294]] }),
    k.arrow({ points: [[514, 404], [450, 404]], dashed: true }),

    k.frame({ x: 40, y: 464, w: 880, h: 110, label: '数据层' }),
    k.box({ x: 54, y: 500, w: 160, h: 60, title: '商品库', sub: '详情、评价' }),
    k.box({ x: 227, y: 500, w: 160, h: 60, title: '人群画像库', sub: '公开数据构造' }),
    k.box({ x: 400, y: 500, w: 160, h: 60, title: '素材库', sub: '素材及来历' }),
    k.box({ x: 573, y: 500, w: 160, h: 60, title: '规则库', sub: '禁用词、品牌' }),
    k.box({ x: 746, y: 500, w: 160, h: 60, title: '投放日志', sub: '曝光、点击、下单' }),

    k.note({ x: 40, y: 592, w: 880, h: 52, lead: '试投里的用户是模拟的：', text: '能让闭环跑起来，不代表真实投放效果，数字都注明来自模拟。' }),
  ].join(''),
});
