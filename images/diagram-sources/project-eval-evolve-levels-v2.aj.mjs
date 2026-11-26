export const meta = {
  name: 'project-eval-evolve-levels-v2',
  article: 'project/eval-evolve/ee-architecture.md',
  alt: '自进化的四个级别：第一级改提示词，对应 GEPA；第二级改经验手册，对应 ACE；第三级改配置与工具，对应 Self-Harness；第四级改外壳代码，对应 Meta-Harness；四级共用同一道准入闸门',
};

export default (k) => k.figure({
  h: 556,
  title: '自进化的四个级别：改得越多，风险越高',
  subtitle: '每升一级，能改的东西更多，可能的收益更大，改坏的风险和验证成本也更高',
  body: [
    k.box({ x: 40, y: 120, w: 250, h: 70, title: '第一级：改提示词', tone: 'accent' }),
    k.text({ x: 312, y: 150, text: '读失败轨迹，让模型说出哪里没讲清楚，\n改写提示词，保留多个各有所长的版本', size: 'label', tone: 'sec' }),
    k.box({ x: 760, y: 130, w: 160, h: 50, title: 'GEPA', titleSize: 'body' }),
    k.arrow({ points: [[165, 190], [165, 206]] }),

    k.box({ x: 40, y: 210, w: 250, h: 70, title: '第二级：改经验手册', tone: 'accent' }),
    k.text({ x: 312, y: 240, text: '执行、反思、整理三个角色；\n手册只做增量增补和去重，不整体重写', size: 'label', tone: 'sec' }),
    k.box({ x: 760, y: 220, w: 160, h: 50, title: 'ACE', titleSize: 'body' }),
    k.arrow({ points: [[165, 280], [165, 296]] }),

    k.box({ x: 40, y: 300, w: 250, h: 70, title: '第三级：改配置与工具', tone: 'warn' }),
    k.text({ x: 312, y: 330, text: '从轨迹里找薄弱环节，提出最小修改；\n通过回归测试才合入', size: 'label', tone: 'sec' }),
    k.box({ x: 760, y: 310, w: 160, h: 50, title: 'Self-Harness', titleSize: 'body' }),
    k.arrow({ points: [[165, 370], [165, 386]] }),

    k.box({ x: 40, y: 390, w: 250, h: 70, title: '第四级：改外壳代码', tone: 'bad' }),
    k.text({ x: 312, y: 420, text: '让编程 Agent 读历史版本的源码、得分和轨迹，\n直接写出新版代码', size: 'label', tone: 'sec' }),
    k.box({ x: 760, y: 400, w: 160, h: 50, title: 'Meta-Harness', titleSize: 'body' }),

    k.note({ x: 40, y: 484, w: 880, h: 52, lead: '四级共用同一道准入闸门：', text: '验收集上更好、回归集上不退步，才成为新的当前版本。' }),
  ].join(''),
});
