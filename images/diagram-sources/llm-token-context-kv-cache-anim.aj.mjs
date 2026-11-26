import still from './llm-token-context-kv-cache-v1.aj.mjs';

export const meta = {
  name: 'llm-token-context-kv-cache-anim',
  article: 'knowledge/llm/basics/llm-token-context.md',
  alt: 'KV Cache 逐步演示（可逐步播放）：6 个输入 token 进入上下文窗口，Prefill 一次并行算出 6 个位置的 K、V 写入缓存；Decode 每生成一个 token 只算这个新位置，新 Q 和缓存里全部 K 比较后追加一格 K、V；窗口用满后只能截断或停止',
};

const X0 = 150, CW = 64, SLOTS = 10;
const sx = (i) => X0 + i * CW + CW / 2;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const window_ = (n, fresh) => k.cells({
    x: X0, y: 134, cw: CW, ch: 44, indices: false, textSize: 'label',
    values: Array.from({ length: SLOTS }, (_, i) => (i < n ? `t${i + 1}` : '')),
    mark: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i === fresh ? 'ok' : 'accent'])),
  });
  const cache = (n, fresh) => {
    const mark = Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i === fresh ? 'ok' : 'accent']));
    const row = (y) => k.cells({ x: X0, y, cw: CW, ch: 34, indices: false, values: Array(SLOTS).fill(''), mark });
    return row(318) + row(356);
  };
  const stats = (calc, len, used) => [
    k.box({ x: 40, y: 420, w: 280, h: 76, title: calc, sub: '本步新算 K、V 的位置', titleSize: 'title', tone: 'accent' }),
    k.box({ x: 340, y: 420, w: 280, h: 76, title: `${len} 格`, sub: '缓存长度（每层各一份）', titleSize: 'title' }),
    k.box({ x: 640, y: 420, w: 280, h: 76, title: `${used} / ${SLOTS}`, sub: '上下文窗口已用', titleSize: 'title', tone: used === SLOTS ? 'warn' : 'default' }),
  ].join('');
  // 新位置的 Q 去和缓存里所有 K 比较
  const attend = (q, n) => k.keyed('q', [
    `<circle cx="${sx(q)}" cy="226" r="17" fill="${k.t.box}" stroke="${k.color('ok')}" stroke-width="2"/>`,
    k.text({ x: sx(q), y: 232, text: 'Q', size: 'label', tone: 'ok', weight: 700, anchor: 'middle' }),
    ...Array.from({ length: n }, (_, i) => `<path d="M${sx(q)},244 L${sx(i)},314" fill="none" stroke="${k.color('ok')}" stroke-opacity="0.45" stroke-width="1.2"/>`),
  ]);
  const prefill = k.keyed('calc', [
    `<rect x="${X0 + 4}" y="196" width="${6 * CW - 8}" height="58" rx="10" fill="none" stroke="${k.color('accent')}" stroke-width="1.6" stroke-dasharray="6 5"/>`,
    k.text({ x: X0 + 3 * CW, y: 231, text: '6 个位置同时算', size: 'label', tone: 'accent', weight: 600, anchor: 'middle' }),
  ]);

  return k.figure({
    h: 600,
    title: 'KV Cache：Prefill 一次写满，Decode 每步只追加一格',
    subtitle: '缓存里的 K、V 不用重算，但每一步都要把整份缓存读一遍',
    body: [
      k.text({ x: 40, y: 162, text: '上下文\n窗口', size: 'label', tone: 'muted' }),
      k.text({ x: 40, y: 340, text: 'KV\nCache', size: 'label', tone: 'muted' }),
      k.text({ x: X0 - 12, y: 340, text: 'K', size: 'label', tone: 'muted', anchor: 'end' }),
      k.text({ x: X0 - 12, y: 378, text: 'V', size: 'label', tone: 'muted', anchor: 'end' }),
      k.note({ x: 40, y: 516, w: 880, h: 52, lead: '代价：', text: '计算从每步重算全部变成只算一格，显存却随长度线性增长。' }),
    ].join(''),
    frames: [
      { caption: '分词：输入文本切成 6 个 token，放进上下文窗口；缓存还是空的', body: window_(6) + cache(0) + stats('0 个', 0, 6) },
      { caption: 'Prefill：6 个位置一起并行计算，每一层的 K、V 一次写满缓存，同时得到第一个输出 t7', body: window_(6) + prefill + cache(6) + stats('6 个', 6, 6) },
      { caption: 'Decode：t7 进入窗口，只算 t7 这一个位置。它的 Q 和缓存里全部 7 个 K 比较，再把自己的 K、V 追加到末尾', body: window_(7, 6) + attend(6, 7) + cache(7, 6) + stats('1 个', 7, 7) },
      { caption: '再生成 t8：仍然只算 1 个位置，但要读的缓存变成 8 格，越往后每步读得越多', body: window_(8, 7) + attend(7, 8) + cache(8, 7) + stats('1 个', 8, 8) },
      { caption: '生成到 t10，窗口用满：要继续就只能截断或摘要前面的内容，否则只能停止', body: window_(10, 9) + attend(9, 10) + cache(10, 9) + stats('1 个', 10, 10) },
    ],
  });
};
