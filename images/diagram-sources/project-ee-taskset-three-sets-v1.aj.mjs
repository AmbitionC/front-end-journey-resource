export const meta = {
  name: 'project-ee-taskset-three-sets-v1',
  article: 'project/eval-evolve/ee-taskset.md',
  alt: '三套任务集的可见范围：进化集给失败分析和提案器看，用来找问题和提出候选版本；验收集和回归集只有准入闸门能看，提案器不许看，闸门用它们决定候选合入还是拒绝',
};

export default (k) => k.figure({
  h: 510,
  title: '三套题分开用：教材和考卷不能是同一批',
  subtitle: '进化集给改进者看；验收集和回归集只有准入闸门能碰',
  body: [
    k.box({ x: 40, y: 130, w: 250, h: 90, title: '进化集（约一半）', sub: '找问题、提出修改', tone: 'accent' }),
    k.arrow({ points: [[290, 175], [376, 175]], label: '失败轨迹', labelAt: [333, 165] }),
    k.box({ x: 380, y: 130, w: 250, h: 90, title: '失败分析 + 提案器', sub: '读轨迹，提出候选' }),
    k.arrow({ points: [[630, 175], [716, 175]] }),
    k.box({ x: 720, y: 130, w: 200, h: 90, title: '候选版本' }),

    k.frame({ x: 40, y: 290, w: 590, h: 130, label: '只有准入闸门能看', labelPos: 'bottom' }),
    k.box({ x: 60, y: 306, w: 260, h: 80, title: '验收集（约四分之一）', sub: '是不是真的更好', tone: 'warn' }),
    k.box({ x: 350, y: 306, w: 260, h: 80, title: '回归集（约四分之一）', sub: '原来会的有没有改坏', tone: 'warn' }),
    k.arrow({ points: [[505, 220], [505, 286]], tone: 'bad', dashed: true, head: false, label: '提案器不许看', labelAt: [515, 258], labelAnchor: 'start' }),
    k.arrow({ points: [[630, 346], [716, 346]] }),
    k.arrow({ points: [[820, 220], [820, 302]] }),
    k.box({ x: 720, y: 306, w: 200, h: 80, title: '准入闸门', sub: '合入或拒绝', tone: 'ok' }),

    k.note({ x: 40, y: 436, w: 880, h: 56, lead: '相似的任务放进同一套：', text: '同一个 bug 的两种问法分到进化集和验收集，等于泄题。' }),
  ].join(''),
});
