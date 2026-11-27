export const meta = {
  name: 'project-ee-rsi-generations-v1',
  article: 'project/eval-evolve/ee-rsi.md',
  alt: '在线试用里那次五代运行的版本树：起点版本新题通过率 56%，第 1 代改提示词没涨分被拦下，第 2 代调配置涨了分但用量超标被拦下，第 3 代补经验手册考到 89% 上线成为新的当前版本，第 4 代再改手册分数反而下降被拦下，第 5 代改外壳代码试跑出错被拦下；被拦下的候选留在旁支上不生效',
};

export default (k) => k.figure({
  h: 540,
  title: '递归：上线的版本，是下一代的起点',
  subtitle: '在线试用里那次五代运行的版本树；实线是上线的版本链，虚线旁支是被拦下的候选',
  body: [
    k.box({ x: 150, y: 140, w: 220, h: 76, title: '起点版本', sub: '新题通过率 56%' }),
    k.arrow({ points: [[370, 178], [586, 178]], tone: 'ok', label: '第 3 代：补经验手册', labelAt: [478, 166] }),
    k.box({ x: 590, y: 140, w: 220, h: 76, title: '当前版本', sub: '新题通过率 89%', tone: 'ok', strong: true }),

    k.arrow({ points: [[205, 216], [205, 306]], tone: 'bad', dashed: true }),
    k.box({ x: 40, y: 310, w: 200, h: 84, title: '第 1 代：改提示词', sub: '新题没涨分\n拦下', tone: 'bad', dashed: true }),
    k.arrow({ points: [[315, 216], [315, 262], [360, 262], [360, 306]], tone: 'bad', dashed: true }),
    k.box({ x: 260, y: 310, w: 200, h: 84, title: '第 2 代：调配置', sub: '涨分了但用量超标\n拦下', tone: 'bad', dashed: true }),

    k.arrow({ points: [[645, 216], [645, 262], [600, 262], [600, 306]], tone: 'bad', dashed: true }),
    k.box({ x: 500, y: 310, w: 200, h: 84, title: '第 4 代：再改手册', sub: '新题分数反而降了\n拦下', tone: 'bad', dashed: true }),
    k.arrow({ points: [[755, 216], [755, 262], [820, 262], [820, 306]], tone: 'bad', dashed: true }),
    k.box({ x: 720, y: 310, w: 200, h: 84, title: '第 5 代：改外壳代码', sub: '试跑就出错\n拦下', tone: 'bad', dashed: true }),

    k.note({ x: 40, y: 440, w: 880, h: 56, lead: '被拦下的候选不生效，但留档：', text: '版本树上能看到它当时考了多少分、为什么没过。' }),
  ].join(''),
});
