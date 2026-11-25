export const meta = {
  name: 'project-ee-side-effects-admission-gate-v1',
  article: 'project/eval-evolve/ee-side-effects.md',
  alt: '配套源码里准入闸门的判定顺序：候选版本依次过回归、没涨、噪声、成本四条规则，回归集里基线稳定通过的任务一条都不能退步，验收集通过率要有提高，涨幅要超过设定的门槛，平均用量不能超过基线的 1.5 倍；命中任何一条就不合入，全部通过才合入',
};

export default (k) => k.figure({
  h: 510,
  title: '准入闸门：四条规则挨个过，命中哪条写进结论',
  subtitle: '配套源码的判定顺序：先跑回归集，因为它便宜而且一票否决',
  body: [
    k.box({ x: 40, y: 150, w: 120, h: 96, title: '候选版本' }),
    k.arrow({ points: [[160, 198], [196, 198]] }),
    k.box({ x: 200, y: 150, w: 150, h: 96, title: '① 回归', sub: '稳定通过的任务\n一条都不能退', tone: 'warn' }),
    k.arrow({ points: [[350, 198], [386, 198]] }),
    k.box({ x: 390, y: 150, w: 150, h: 96, title: '② 没涨', sub: '验收集通过率\n要有提高', tone: 'warn' }),
    k.arrow({ points: [[540, 198], [576, 198]] }),
    k.box({ x: 580, y: 150, w: 150, h: 96, title: '③ 噪声', sub: '涨幅要超过\n设定的门槛', tone: 'warn' }),
    k.arrow({ points: [[730, 198], [766, 198]] }),
    k.box({ x: 770, y: 150, w: 150, h: 96, title: '④ 成本', sub: '用量不超过\n基线的 1.5 倍', tone: 'warn' }),
    k.arrow({ points: [[275, 246], [275, 326]], tone: 'bad', dashed: true }),
    k.arrow({ points: [[465, 246], [465, 326]], tone: 'bad', dashed: true }),
    k.arrow({ points: [[655, 246], [655, 326]], tone: 'bad', dashed: true }),
    k.arrow({ points: [[800, 246], [800, 290], [720, 290], [720, 326]], tone: 'bad', dashed: true }),
    k.box({ x: 200, y: 330, w: 550, h: 60, title: '不合入：结论里写明命中的是哪一条', tone: 'bad' }),
    k.arrow({ points: [[880, 246], [880, 326]], tone: 'ok' }),
    k.box({ x: 790, y: 330, w: 130, h: 60, title: '合入', tone: 'ok' }),

    k.note({ x: 40, y: 424, w: 880, h: 56, lead: '可信的前提：', text: '提案器只看得到进化集，验收集和回归集只有闸门会碰。' }),
  ].join(''),
});
