export const meta = {
  name: 'llm-capability-boundaries-confidence-loop-v1',
  article: 'knowledge/llm/basics/llm-capability-boundaries.md',
  alt: '模型按候选 token 的相对倾向生成答案；有证据支撑的可以使用，无依据的断言进入检索、工具核验、校准与人工复核的闭环',
};

export default (k) => k.figure({
  h: 560,
  title: '模型置信 ≠ 答案正确',
  subtitle: '柱子只示意相对倾向，不是概率读数；答案对不对要靠证据核验',
  body: [
    k.box({ x: 40, y: 122, w: 160, h: 96, title: '提示词\n+ 上下文', sub: '' }),
    k.panel({ x: 240, y: 108, w: 230, h: 136, label: '下一个 token 的相对倾向' }),
    k.barChart({ x: 262, y: 148, w: 186, h: 50, bars: ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ label: l, value: [9, 6, 4, 2.5, 1.2][i], tone: i ? 'muted' : 'accent' })), showValues: false }),
    k.box({ x: 510, y: 122, w: 150, h: 96, title: '生成答案', sub: '语言连贯\n≠ 事实正确', tone: 'accent' }),
    k.box({ x: 700, y: 104, w: 220, h: 60, title: '有证据支撑 · 可用', tone: 'ok' }),
    k.box({ x: 700, y: 178, w: 220, h: 60, title: '无依据断言 · 需核验', tone: 'bad' }),
    k.arrow({ points: [[200, 170], [236, 170]] }),
    k.arrow({ points: [[470, 170], [506, 170]] }),
    k.arrow({ points: [[660, 170], [680, 170], [680, 134], [696, 134]], tone: 'ok' }),
    k.arrow({ points: [[680, 170], [680, 208], [696, 208]], tone: 'bad' }),

    k.frame({ x: 40, y: 290, w: 880, h: 158, label: '可靠性闭环：证据不够就不输出', labelPos: 'bottom' }),
    k.box({ x: 730, y: 318, w: 170, h: 84, title: '检索证据', sub: '找原文与出处' }),
    k.box({ x: 510, y: 318, w: 170, h: 84, title: '工具核验', sub: '计算、测试、查链接' }),
    k.box({ x: 290, y: 318, w: 170, h: 84, title: '校准', sub: '写明假设与不确定' }),
    k.box({ x: 70, y: 318, w: 170, h: 84, title: '人工复核', sub: '高风险必须过' }),
    k.arrow({ points: [[812, 238], [812, 314]], tone: 'bad' }),
    k.arrow({ points: [[730, 360], [684, 360]], tone: 'accent' }),
    k.arrow({ points: [[510, 360], [464, 360]], tone: 'accent' }),
    k.arrow({ points: [[290, 360], [244, 360]], tone: 'accent' }),
    k.arrow({ points: [[155, 318], [155, 272], [585, 272], [585, 222]], tone: 'accent', dashed: true, label: '修正后重新生成', labelAt: [598, 256], labelAnchor: 'start' }),

    k.note({ x: 40, y: 476, w: 880, lead: '记住：', text: '调低温度只让输出更稳定，稳定地出错也是错。' }),
  ].join(''),
});
