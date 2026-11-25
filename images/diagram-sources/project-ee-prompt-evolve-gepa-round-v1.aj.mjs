export const meta = {
  name: 'project-ee-prompt-evolve-gepa-round-v1',
  article: 'project/eval-evolve/ee-prompt-evolve.md',
  alt: 'GEPA 一轮迭代：从候选池按胜出任务数加权抽一个父候选，在一小批进化集任务上运行并收集轨迹和评分理由，反思模型诊断问题并改写提示词，新候选在同一小批任务上和父候选比；更好就到完整筛选集上评分并加入候选池，不好就丢弃并记录这次尝试',
};

export default (k) => k.figure({
  h: 580,
  title: 'GEPA 一轮迭代：先小批试，过了才花钱跑完整评测',
  subtitle: '候选池里留的是一组各有所长的提示词，不是唯一的最高分',
  body: [
    k.box({ x: 40, y: 130, w: 150, h: 84, title: '候选池', tone: 'accent' }),
    k.arrow({ points: [[190, 172], [236, 172]] }),
    k.box({ x: 240, y: 130, w: 190, h: 84, title: '抽一个父候选', sub: '赢的任务越多越易抽中' }),
    k.arrow({ points: [[430, 172], [476, 172]] }),
    k.box({ x: 480, y: 130, w: 190, h: 84, title: '小批任务上运行', sub: '收集轨迹和评分理由' }),
    k.arrow({ points: [[670, 172], [716, 172]] }),
    k.box({ x: 720, y: 130, w: 200, h: 84, title: '反思模型', sub: '诊断问题，改写提示词', tone: 'accent' }),
    k.arrow({ points: [[820, 214], [820, 296]] }),
    k.box({ x: 720, y: 300, w: 200, h: 84, title: '新候选跑同一小批', sub: '和父候选比' }),
    k.arrow({ points: [[720, 342], [674, 342]] }),
    k.box({ x: 480, y: 300, w: 190, h: 84, title: '比父候选好吗', tone: 'warn' }),
    k.arrow({ points: [[480, 342], [434, 342]], tone: 'ok', label: '是', labelAt: [457, 332] }),
    k.box({ x: 240, y: 300, w: 190, h: 84, title: '完整筛选集上评分', sub: '更新每条任务的最优', tone: 'ok' }),
    k.arrow({ points: [[240, 342], [115, 342], [115, 218]], tone: 'ok', label: '加入候选池', labelAt: [125, 290], labelAnchor: 'start' }),
    k.arrow({ points: [[575, 384], [575, 426]], tone: 'bad', label: '否', labelAt: [587, 410], labelAnchor: 'start' }),
    k.box({ x: 480, y: 430, w: 190, h: 56, title: '丢弃，记录这次尝试', tone: 'bad' }),

    k.note({ x: 40, y: 506, w: 880, h: 56, lead: '省钱的关键：', text: '大多数改写不会带来提升，没有必要为它们付完整评测的钱。' }),
  ].join(''),
});
