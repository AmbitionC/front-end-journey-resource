export const meta = {
  name: 'project-general-agent-research-v2',
  article: 'project/general-agent/ga-research.md',
  alt: '研究模式的部件关系：用户问题进入主管 Agent，主管拆出子问题派给三个并行的研究员，研究员调用搜索、读网页正文、压缩与摘录三个工具，并把来源登记到来源库；证据足够后由报告生成按编号引用来源库',
};

export default (k) => k.figure({
  h: 612,
  title: '研究模式的部件关系：主管拆题，研究员各查各的',
  subtitle: '研究员是子任务，各有独立上下文，可以并行',
  body: [
    k.box({ x: 40, y: 120, w: 150, h: 70, title: '用户问题' }),
    k.arrow({ points: [[190, 155], [246, 155]] }),
    k.box({ x: 250, y: 120, w: 300, h: 70, title: '主管 Agent', sub: '澄清、拆子问题、判断够不够', tone: 'accent' }),
    k.arrow({ points: [[550, 155], [696, 155]], label: '证据足够', labelAt: [623, 145] }),
    k.box({ x: 700, y: 120, w: 220, h: 70, title: '报告生成', sub: '带引用的结构化报告', tone: 'info' }),

    k.arrow({ points: [[400, 190], [400, 232]], label: '派发', labelAt: [412, 216], labelAnchor: 'start' }),
    k.frame({ x: 40, y: 236, w: 600, h: 130, label: '研究员' }),
    k.box({ x: 56, y: 276, w: 176, h: 70, title: '研究员 A', sub: '子问题 1', tone: 'ok' }),
    k.box({ x: 252, y: 276, w: 176, h: 70, title: '研究员 B', sub: '子问题 2', tone: 'ok' }),
    k.box({ x: 448, y: 276, w: 176, h: 70, title: '研究员 C', sub: '子问题 3', tone: 'ok' }),

    k.arrow({ points: [[340, 366], [340, 406]], label: '调用', labelAt: [352, 392], labelAnchor: 'start' }),
    k.frame({ x: 40, y: 410, w: 600, h: 110, label: '研究工具' }),
    k.box({ x: 56, y: 450, w: 176, h: 52, title: '搜索' }),
    k.box({ x: 252, y: 450, w: 176, h: 52, title: '读网页正文' }),
    k.box({ x: 448, y: 450, w: 176, h: 52, title: '压缩与摘录' }),

    k.box({ x: 700, y: 276, w: 220, h: 70, title: '来源库', sub: '登记网址、原文片段、编号', tone: 'info' }),
    k.arrow({ points: [[640, 311], [696, 311]] }),
    k.arrow({ points: [[810, 276], [810, 194]], label: '按编号引用', labelAt: [822, 240], labelAnchor: 'start' }),

    k.note({ x: 40, y: 540, w: 880, h: 52, lead: '主管只做拆题和汇总：', text: '研究员只交回压缩后的结论和来源编号，网页原文不进主管的窗口。' }),
  ].join(''),
});
