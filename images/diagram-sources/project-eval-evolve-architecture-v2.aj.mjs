export const meta = {
  name: 'project-eval-evolve-architecture-v2',
  article: 'project/eval-evolve/ee-architecture.md',
  alt: 'Agent 评测与自进化平台架构：左侧是被测对象和版本库；上半部分是评测链路，任务集经运行器和评分器产出报告，结果写入结果库，评分器另有审计；下半部分是自进化链路，失败分析读取结果库，提案器分四级提出修改，候选版本经准入闸门后合入版本库',
};

export default (k) => k.figure({
  h: 672,
  title: '评测与自进化平台架构：上面量，下面改',
  subtitle: '上半部分回答这一版 Agent 到底怎么样；下半部分提出新版本，只让真正变好的合入',
  body: [
    k.frame({ x: 40, y: 112, w: 180, h: 470, label: '被测对象', labelPos: 'bottom' }),
    k.box({ x: 54, y: 148, w: 152, h: 64, title: '通用 Agent', sub: '无界面模式运行' }),
    k.panel({ x: 54, y: 250, w: 152, h: 150 }),
    k.text({ x: 130, y: 284, text: '一个版本 =', size: 'body', weight: 600, anchor: 'middle' }),
    k.text({ x: 130, y: 314, text: '系统提示词\n经验手册\n配置与工具集\n外壳代码', size: 'label', tone: 'muted', anchor: 'middle' }),
    k.arrow({ points: [[130, 250], [130, 216]] }),
    k.box({ x: 54, y: 440, w: 152, h: 64, title: '版本库', sub: '可回放、可回退', tone: 'info' }),
    k.arrow({ points: [[130, 440], [130, 404]] }),
    k.arrow({ points: [[130, 148], [130, 128], [495, 128], [495, 144]], dashed: true }),

    k.frame({ x: 240, y: 112, w: 680, h: 236, label: '评测：先有尺子', labelPos: 'bottom' }),
    k.box({ x: 254, y: 148, w: 150, h: 64, title: '任务集', sub: '进化、验收、回归', tone: 'info' }),
    k.arrow({ points: [[404, 180], [416, 180]] }),
    k.box({ x: 420, y: 148, w: 150, h: 64, title: '运行器', sub: '隔离环境、多次跑', tone: 'info' }),
    k.arrow({ points: [[570, 180], [582, 180]] }),
    k.box({ x: 586, y: 148, w: 150, h: 64, title: '评分器', sub: '代码、裁判、抽检', tone: 'info' }),
    k.arrow({ points: [[736, 180], [748, 180]] }),
    k.box({ x: 752, y: 148, w: 154, h: 64, title: '报告', sub: '可靠性、成本', tone: 'info' }),
    k.arrow({ points: [[460, 212], [460, 244]] }),
    k.arrow({ points: [[610, 212], [610, 228], [540, 228], [540, 244]] }),
    k.box({ x: 254, y: 248, w: 316, h: 60, title: '结果库：轨迹、得分、用量' }),
    k.box({ x: 586, y: 248, w: 150, h: 60, title: '评分器审计', sub: '注入已知错误', tone: 'bad' }),
    k.arrow({ points: [[690, 248], [690, 216]], dashed: true }),

    k.frame({ x: 240, y: 372, w: 680, h: 210, label: '自进化：自己变好', labelPos: 'bottom' }),
    k.arrow({ points: [[390, 308], [390, 404]] }),
    k.box({ x: 254, y: 408, w: 150, h: 64, title: '失败分析', sub: '读轨迹，归因', tone: 'accent' }),
    k.arrow({ points: [[404, 440], [416, 440]] }),
    k.box({ x: 420, y: 408, w: 316, h: 64, title: '提案器（四级，由小到大）', sub: '提示词、手册、配置、外壳代码', tone: 'accent' }),
    k.arrow({ points: [[736, 440], [748, 440]] }),
    k.box({ x: 752, y: 408, w: 154, h: 64, title: '候选版本池', sub: '保留多个版本', tone: 'accent' }),
    k.arrow({ points: [[829, 472], [829, 530], [740, 530]] }),
    k.box({ x: 420, y: 500, w: 316, h: 60, title: '准入闸门', sub: '验收集更好且回归集不退步才合入', tone: 'ok' }),
    k.arrow({ points: [[420, 530], [228, 530], [228, 472], [210, 472]], label: '合入', labelAt: [330, 520] }),

    k.note({ x: 40, y: 600, w: 880, h: 52, lead: '三套任务互不重叠：', text: '进化只看进化集，验收集决定能否合入，回归集防止改好新的、改坏旧的。' }),
  ].join(''),
});
