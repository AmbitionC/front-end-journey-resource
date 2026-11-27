export const meta = {
  name: 'project-ee-rsi-ladder-v1',
  article: 'project/eval-evolve/ee-rsi.md',
  alt: 'RSI 能改的对象从浅到深分五格：指令提示词、结构化上下文、工作流与配置、外壳代码、优化器自己的代码；本项目的四级进化对应前四格，分别是改系统提示词、维护经验手册、调配置与工具、改外壳代码；第五格改进改进器本身，本项目不做',
};

const STEPS = [
  ['指令提示词', '第一级', '改系统提示词'],
  ['结构化上下文', '第二级', '维护经验手册'],
  ['工作流', '第三级', '调配置与工具'],
  ['外壳代码', '第四级', '改外壳代码'],
  ['优化器的代码', '不做', '改进改进器本身'],
];

export default (k) => k.figure({
  h: 560,
  title: '模型不动，改的是外壳：从浅到深五格',
  subtitle: '阶梯取自 Lilian Weng 2026 年 7 月的 Harness 一文；下面一排是本项目对应的级别',
  body: [
    ...STEPS.map(([name, level, what], i) => {
      const x = 40 + i * 178;
      const y = 290 - i * 36;
      const last = i === STEPS.length - 1;
      return [
        k.box({ x, y, w: 168, h: 64, title: name, tone: last ? 'muted' : 'accent', dashed: last }),
        k.arrow({ points: [[x + 84, y + 64], [x + 84, 386]], tone: last ? 'muted' : 'line', dashed: last }),
        k.box({ x, y: 390, w: 168, h: 76, title: level, sub: what, tone: last ? 'muted' : 'info', dashed: last }),
      ].join('');
    }),
    k.text({ x: 40, y: 150, text: '越往右：能改的东西越多，改坏的风险也越大', size: 'label', tone: 'warn', anchor: 'start' }),
    k.note({ x: 40, y: 486, w: 880, h: 56, lead: '本项目做到第四格。', text: '提出修改的四个提案器是固定的，不会改自己。' }),
  ].join(''),
});
