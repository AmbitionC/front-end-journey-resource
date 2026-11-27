import still from './prompt-context-compression-budget-pipeline-v2.aj.mjs';

export const meta = {
  name: 'prompt-context-compression-budget-anim',
  article: 'knowledge/llm/prompt/prompt-context-compression.md',
  alt: '上下文压缩逐步演示（可逐步播放）：原始上下文 17.5k token，预算 9k；先锁定 4.5k 保护区，再给候选排序，删除寒暄和重复历史，抽取工具中间结果，必要时摘要较早对话，最后降到 7k 并做保真检查',
};

const X0 = 40, PX = 48, BUDGET = 9;
const bx = (k) => X0 + k * PX;

export default (k) => {
  if (k.mode === 'still') return still(k);
  // segs: [key, 标签, k token, tone, 序号]
  const bar = (segs) => {
    let x = X0;
    return segs.map(([key, label, kt, tone, order]) => {
      const w = kt * PX, s = k.keyed(key, k.box({ x, y: 200, w, h: 60, title: label, titleSize: 'label', tone, strong: tone === 'accent' }) +
        (order ? k.text({ x: x + w / 2, y: 188, text: order, size: 'label', tone: 'warn', weight: 700, anchor: 'middle' }) : ''));
      x += w;
      return s;
    }).join('');
  };
  const total = (segs) => segs.reduce((a, s) => a + s[2], 0);
  const over = (segs) => {
    const t = total(segs);
    return t > BUDGET ? `<rect x="${bx(BUDGET)}" y="272" width="${(t - BUDGET) * PX}" height="10" rx="5" fill="${k.color('bad')}" fill-opacity="0.55"/>` +
      k.text({ x: bx(BUDGET) + 8, y: 304, text: `超出 ${(t - BUDGET).toFixed(1)}k`, size: 'label', tone: 'bad', weight: 600 }) : '';
  };
  const step = (title, sub, tone) => k.box({ x: 40, y: 340, w: 880, h: 76, title, sub, tone });
  const sum = (segs) => k.text({ x: 920, y: 150, text: `合计 ${total(segs).toFixed(1)}k / 预算 ${BUDGET}k`, size: 'heading', weight: 600, anchor: 'end', tone: total(segs) > BUDGET ? 'bad' : 'ok' });
  const P = ['prot', '保护区 4.5k', 4.5, 'accent'];
  const f = (caption, segs, s1, s2, tone) => ({ caption, body: bar(segs) + over(segs) + sum(segs) + step(s1, s2, tone) });
  const S0 = [['prot', '关键信息 4.5k', 4.5, 'default'], ['dup', '重复历史 5k', 5, 'default'], ['chat', '寒暄', 1, 'default'], ['tool', '工具中间结果 3k', 3, 'default'], ['old', '较早对话 4k', 4, 'default']];

  return k.figure({
    h: 560,
    title: '上下文压缩：先保护，再按代价从低到高删减',
    subtitle: '1 格 = 1k token；预算 9k = 窗口减去输出和安全余量',
    body: [
      `<path d="M${bx(BUDGET)},170 V196 M${bx(BUDGET)},264 V292" stroke="${k.color('warn')}" stroke-width="2" stroke-dasharray="6 5" fill="none"/>`,
      k.text({ x: bx(BUDGET) - 8, y: 150, text: '预算线 9k', size: 'label', tone: 'warn', weight: 600, anchor: 'end' }),
      k.note({ x: 40, y: 480, w: 880, h: 52, lead: '别只追压缩比例：', text: '以任务正确率和证据保真为约束，能删就不摘要，摘要最容易丢出处。' }),
    ].join(''),
    frames: [
      f('原始上下文 17.5k，预算只有 9k，超了 8.5k', S0, '原始上下文', '系统指令、用户目标、关键事实、权限与来源 ID，加上一堆历史和中间结果'),
      f('第一步先锁定保护区：指令、目标、关键事实和来源 ID 可以缩短措辞，但语义和出处不能丢', [P, ...S0.slice(1)], '锁定保护区', '后面的删减只动候选区', 'accent'),
      f('给候选排序：越便宜、越不影响答案的越先动。寒暄和重复历史最先删，工具结果能重新获取，较早对话最后才摘要', [P, ['dup', '重复历史 5k', 5, 'default', '1'], ['chat', '寒暄', 1, 'default', '1'], ['tool', '工具中间结果 3k', 3, 'default', '2'], ['old', '较早对话 4k', 4, 'default', '3']], '排序候选', '1 删除 → 2 抽取 → 3 摘要，代价和风险依次升高'),
      f('删除：寒暄和重复历史直接去掉，最便宜，也不会引入错误。还超 2.5k', [P, ['tool', '工具中间结果 3k', 3, 'default', '2'], ['old', '较早对话 4k', 4, 'default', '3']], '1 删除', '去掉 6k，剩 11.5k', 'info'),
      f('抽取：工具中间结果只保留和问题相关的原句，原文需要时可以重新取。还超 0.5k', [P, ['tool', '抽取', 1, 'info'], ['old', '较早对话 4k', 4, 'default', '3']], '2 抽取', '3k 留下 1k 原句，剩 9.5k', 'info'),
      f('摘要：实在不够才摘要较早的对话，降到 7k，进入预算', [P, ['tool', '抽取', 1, 'info'], ['old', '摘要', 1.5, 'warn']], '3 摘要（必要时）', '4k 压成 1.5k，合计 7k', 'warn'),
      f('最后做保真检查：引用、顺序、关键证据都还在才放行；不过就降低压缩率或重新检索', [P, ['tool', '抽取', 1, 'info'], ['old', '摘要', 1.5, 'warn']], '保真检查通过', '任务评估 + 引用与证据核对；不过就退回上一步', 'ok'),
    ],
  });
};
