export const meta = {
  name: 'project-ee-overview-improve-loop-v1',
  article: 'project/eval-evolve/ee-overview.md',
  alt: '一轮自我改进的四步：先在练习题上摸底留下失败记录，Agent 自己复盘找共同原因，再动手改自己的提示词、手册、配置或代码，最后参加考试；考过了新版本上线并成为下一轮的起点，没过就原样退回',
};

export default (k) => k.figure({
  h: 500,
  title: '一轮自我改进：四步走完，考过才上线',
  subtitle: '被改进的是一个会修 bug 的编程 Agent；每一轮结束，下一轮从新版本接着改',
  body: [
    k.box({ x: 40, y: 130, w: 190, h: 100, title: '① 先摸底', sub: '在练习题上跑一遍\n留下失败记录' }),
    k.arrow({ points: [[230, 180], [266, 180]] }),
    k.box({ x: 270, y: 130, w: 190, h: 100, title: '② 自己复盘', sub: '读失败记录\n找共同原因', tone: 'accent' }),
    k.arrow({ points: [[460, 180], [496, 180]] }),
    k.box({ x: 500, y: 130, w: 190, h: 100, title: '③ 动手改自己', sub: '提示词、经验手册\n配置、代码', tone: 'accent' }),
    k.arrow({ points: [[690, 180], [726, 180]] }),
    k.box({ x: 730, y: 130, w: 190, h: 100, title: '④ 考试', sub: '新题要做得更好\n老题不能退步', tone: 'warn' }),

    k.arrow({ points: [[770, 230], [770, 268], [615, 268], [615, 306]], tone: 'ok', label: '考过', labelAt: [692, 260] }),
    k.arrow({ points: [[860, 230], [860, 306]], tone: 'bad', label: '没过', labelAt: [870, 274], labelAnchor: 'start' }),
    k.box({ x: 520, y: 310, w: 190, h: 76, title: '新版本上线', sub: '成为下一轮的起点', tone: 'ok' }),
    k.box({ x: 750, y: 310, w: 170, h: 76, title: '原样退回', sub: '留下拒绝原因', tone: 'bad' }),
    k.arrow({ points: [[520, 348], [135, 348], [135, 234]], tone: 'ok', dashed: true, label: '下一轮从新版本接着改', labelAt: [328, 338] }),

    k.note({ x: 40, y: 420, w: 880, h: 56, lead: '为什么要考试：', text: '改的人看不到考卷。只在练习题上变好不算数，换一批没见过的题还更好才算。' }),
  ].join(''),
});
