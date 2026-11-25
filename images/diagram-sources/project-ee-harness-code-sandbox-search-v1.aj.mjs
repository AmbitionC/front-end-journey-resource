export const meta = {
  name: 'project-ee-harness-code-sandbox-search-v1',
  article: 'project/eval-evolve/ee-harness-code.md',
  alt: '第四级进化的一轮搜索：提案器在无外网的沙箱里查阅只读的历史目录，写出新的外壳代码和 note.md；候选代码先过静态检查，再在进化集上评测，结果无论好坏都写回历史目录供下一轮查阅',
};

export default (k) => k.figure({
  h: 570,
  title: '让 Agent 改自己的代码：关在沙箱里，历史只读',
  subtitle: '提案器就是你的编程 Agent；候选是模型写的代码，按不可信代码对待',
  body: [
    k.frame({ x: 40, y: 120, w: 560, h: 240, label: '沙箱（无外网）', labelPos: 'bottom' }),
    k.box({ x: 60, y: 140, w: 220, h: 90, title: '历史目录（只读）', sub: '各版本源码、得分、轨迹', tone: 'info' }),
    k.arrow({ points: [[280, 185], [356, 185]], label: '查阅', labelAt: [318, 175] }),
    k.box({ x: 360, y: 140, w: 220, h: 90, title: '提案器', sub: '读历史，写新外壳代码', tone: 'accent' }),
    k.arrow({ points: [[470, 230], [470, 256]] }),
    k.box({ x: 360, y: 260, w: 220, h: 60, title: '候选代码 + note.md' }),
    k.arrow({ points: [[580, 290], [640, 290], [640, 180], [676, 180]] }),
    k.box({ x: 680, y: 140, w: 240, h: 80, title: '静态检查', sub: '改动范围、接口、禁改文件', tone: 'warn' }),
    k.arrow({ points: [[800, 220], [800, 256]] }),
    k.box({ x: 680, y: 260, w: 240, h: 80, title: '进化集上评测', sub: '候选也在沙箱里运行' }),
    k.arrow({ points: [[800, 340], [800, 432], [284, 432]] }),
    k.box({ x: 60, y: 400, w: 220, h: 64, title: '写入历史', sub: '无论好坏都记' }),
    k.arrow({ points: [[240, 400], [240, 234]], dashed: true }),

    k.note({ x: 40, y: 492, w: 880, h: 56, lead: '搜索时只用进化集：', text: '结束后取前沿上最好的几个版本交给准入闸门，进闸门之前人先读一遍代码差异。' }),
  ].join(''),
});
