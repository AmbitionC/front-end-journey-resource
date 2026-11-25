export const meta = {
  name: 'project-ee-harness-config-verify-steps-v1',
  article: 'project/eval-evolve/ee-harness-config.md',
  alt: '配置修改的验证顺序：候选配置先过范围检查，再只跑该弱点涉及的任务看有没有变好，然后跑回归集看有没有退步，最后跑验收集看总体是否更好且成本可接受；任何一步不过就拒绝，全部通过才合入',
};

export default (k) => k.figure({
  h: 500,
  title: '配置修改的验证：先跑最便宜、最能说明问题的',
  subtitle: '任何一步不过就拒绝；多个提案各自通过后，合成一个版本再完整过一次闸门',
  body: [
    k.box({ x: 40, y: 150, w: 130, h: 90, title: '候选配置' }),
    k.arrow({ points: [[170, 195], [206, 195]] }),
    k.box({ x: 210, y: 150, w: 150, h: 90, title: '范围检查', sub: '在允许范围内吗', tone: 'warn' }),
    k.arrow({ points: [[360, 195], [396, 195]] }),
    k.box({ x: 400, y: 150, w: 160, h: 90, title: '弱点涉及的任务', sub: '这几条变好了吗', tone: 'warn' }),
    k.arrow({ points: [[560, 195], [596, 195]] }),
    k.box({ x: 600, y: 150, w: 130, h: 90, title: '回归集', sub: '有退步吗', tone: 'warn' }),
    k.arrow({ points: [[730, 195], [766, 195]] }),
    k.box({ x: 770, y: 150, w: 150, h: 90, title: '验收集', sub: '更好、成本可接受', tone: 'warn' }),
    k.arrow({ points: [[285, 240], [285, 326]], tone: 'bad', dashed: true }),
    k.arrow({ points: [[480, 240], [480, 326]], tone: 'bad', dashed: true }),
    k.arrow({ points: [[665, 240], [665, 326]], tone: 'bad', dashed: true }),
    k.arrow({ points: [[800, 240], [800, 290], [710, 290], [710, 326]], tone: 'bad', dashed: true }),
    k.box({ x: 210, y: 330, w: 530, h: 60, title: '任何一步不过：拒绝', tone: 'bad' }),
    k.arrow({ points: [[880, 240], [880, 326]], tone: 'ok' }),
    k.box({ x: 790, y: 330, w: 130, h: 60, title: '合入', tone: 'ok' }),

    k.note({ x: 40, y: 420, w: 880, h: 56, lead: '权限规则不在可改范围里：', text: '提案器想改，也会在第一步被范围检查挡掉。' }),
  ].join(''),
});
