export const meta = {
  name: 'project-ee-graders-judge-calibration-v1',
  article: 'project/eval-evolve/ee-graders.md',
  alt: '模型裁判的校准流程：抽 50 条待评样本，人按细则标注，模型裁判也判一遍，对比两者并把误放和误杀分开看；一致程度够就冻结裁判版本投入使用，不够就逐条看分歧、修改细则或提示词后让裁判重判',
};

export default (k) => k.figure({
  h: 520,
  title: '模型裁判上岗前，先和人对一遍答案',
  subtitle: '同一批样本，人和裁判各判一遍；误放比误杀更危险',
  body: [
    k.box({ x: 40, y: 180, w: 180, h: 80, title: '50 条待评样本' }),
    k.arrow({ points: [[220, 220], [255, 220], [255, 165], [286, 165]] }),
    k.arrow({ points: [[220, 220], [255, 220], [255, 285], [286, 285]] }),
    k.box({ x: 290, y: 130, w: 200, h: 70, title: '人按细则标注' }),
    k.box({ x: 290, y: 250, w: 200, h: 70, title: '模型裁判判定', tone: 'info' }),
    k.arrow({ points: [[490, 165], [515, 165], [515, 205], [536, 205]] }),
    k.arrow({ points: [[490, 285], [515, 285], [515, 235], [536, 235]] }),
    k.box({ x: 540, y: 180, w: 150, h: 80, title: '对比两者', sub: '误放、误杀分开看' , tone: 'accent'}),
    k.arrow({ points: [[690, 220], [766, 220]], tone: 'ok', label: '够', labelAt: [728, 210] }),
    k.box({ x: 770, y: 180, w: 150, h: 80, title: '冻结裁判版本', sub: '投入使用', tone: 'ok' }),
    k.arrow({ points: [[615, 260], [615, 385], [494, 385]], tone: 'bad', dashed: true, label: '一致程度不够', labelAt: [625, 330], labelAnchor: 'start' }),
    k.box({ x: 290, y: 350, w: 200, h: 70, title: '逐条看分歧', sub: '改细则或提示词' }),
    k.arrow({ points: [[250, 385], [250, 300], [286, 300]], dashed: true }),
    k.arrow({ points: [[290, 385], [250, 385]], head: false, dashed: true }),

    k.note({ x: 40, y: 444, w: 880, h: 56, lead: '冻结的含义：', text: '裁判的提示词、所用模型、细则，任何一项改了都算新版本，新旧分数不能混着比。' }),
  ].join(''),
});
