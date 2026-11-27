export const meta = {
  name: 'ai-rate-limit-token-bucket-anim',
  article: 'knowledge/llm/production/ai-rate-limiting.md',
  alt: '令牌桶逐步演示（可逐步播放，容量 C 为 10，每秒补充 2 个）：t 为 0 时满桶，权重 6 的请求放行剩 4；0.5 秒时补到 5，权重 5 的请求放行剩 0；1 秒时只补到 1，权重 3 的请求被拒并返回 429 和 Retry-After 1 秒，拒绝不扣额度；2 秒时补到 3，再次放行；空闲很久后最多也只积到 10，多出的补充被丢弃，所以突发上限就是 C',
};

const N = 10;
const LOG = [
  ['t = 0', 'w = 6', '放行，剩 4', 'ok'],
  ['t = 0.5', 'w = 5', '放行，剩 0', 'ok'],
  ['t = 1.0', 'w = 3', '拒绝 429，仍剩 1', 'bad'],
  ['t = 2.0', 'w = 3', '放行，剩 0', 'ok'],
];

export default (k) => {
  // have：本帧开始时的令牌数；take：被本次请求取走的数量（标橙）；fresh：本帧新补充的数量（标绿）
  const bucket = (have, take = 0, fresh = 0) => {
    const s = [];
    for (let i = 0; i < N; i++) {
      let fill = 'none', op = 0, stroke = k.t.accent;
      if (i < have - take) { fill = k.t.accent; op = 0.6; }
      if (i >= have - take && i < have) { fill = k.color('warn'); op = 0.75; stroke = k.color('warn'); }
      if (fresh && i >= have - fresh && i < have && !take) { fill = k.color('ok'); op = 0.7; stroke = k.color('ok'); }
      s.push(`<rect x="${60 + i * 44}" y="216" width="38" height="52" rx="6" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="1.6"/>`);
    }
    return s.join('');
  };
  const clock = (t) => k.text({ x: 60, y: 150, text: `t = ${t}`, size: 'title', weight: 600, tone: 'warn' });
  const req = (title, sub, tone) => k.box({ x: 60, y: 300, w: 434, h: 72, title, sub, titleSize: 'body', tone });
  const log = (n) => LOG.slice(0, n).map(([t, w, r, tone], i) =>
    k.text({ x: 556, y: 170 + i * 40, text: t, size: 'label', mono: true, tone: 'muted' }) +
    k.text({ x: 656, y: 170 + i * 40, text: w, size: 'label', mono: true }) +
    k.text({ x: 740, y: 170 + i * 40, text: r, size: 'label', tone })).join('');
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 500,
    title: '令牌桶：按速率补充，满了就不再攒',
    subtitle: '容量 C = 10，补充速率 r = 2 个 / 秒；请求按权重 w 取令牌，不够就拒绝，拒绝不扣额度',
    body: [
      k.text({ x: 60, y: 200, text: '令牌（最多 10 个）　橙 = 本次取走　绿 = 新补充', size: 'label', tone: 'muted' }),
      k.panel({ x: 536, y: 112, w: 384, h: 270, label: '请求记录', tone: 'info' }),
      k.note({ x: 40, y: 410, w: 880, h: 56, lead: '突发上限就是 C：', text: '空闲时最多攒满 10 个，满桶能一次放行 10；长期速率仍是每秒 2 个。' }),
    ].join(''),
    frames: [
      f('起点：桶是满的，10 个令牌', [clock('0 s'), bucket(10), req('等待请求', 'available = min(C, 上次剩余 + 经过时间 × r)', 'muted'), log(0)]),
      f('一个权重 6 的请求进来：10 ≥ 6，放行，取走 6 个，剩 4。满桶允许一次性的突发', [clock('0 s'), bucket(10, 6), req('请求 w = 6', 'available 10 ≥ 6 → 放行，剩 4', 'ok'), log(1)]),
      f('0.5 秒后补了 1 个，有 5 个；权重 5 的请求刚好够，取完桶空了', [clock('0.5 s'), bucket(5, 5), req('请求 w = 5', 'available 4 + 0.5 × 2 = 5 ≥ 5 → 放行，剩 0', 'ok'), log(2)]),
      f('1 秒时只补回 1 个，权重 3 的请求不够用：返回 429 和 Retry-After 1 秒，桶里的 1 个不扣', [clock('1.0 s'), bucket(1, 0, 1), req('请求 w = 3', 'available 1 < 3 → 429，Retry-After 1 s，不扣额度', 'bad'), log(3)]),
      f('2 秒时攒到 3 个，客户端按 Retry-After 重试，这次放行', [clock('2.0 s'), bucket(3, 3), req('重试 w = 3', 'available 1 + 1 × 2 = 3 ≥ 3 → 放行，剩 0', 'ok'), log(4)]),
      f('之后空闲了 30 秒，按速率能补 60 个，但桶只装得下 10 个，多的直接丢掉：突发量永远不超过 C', [clock('32 s'), bucket(10, 0, 10), req('空闲 30 s', '0 + 30 × 2 = 60，但 min(C, …) = 10', 'info'), log(4)]),
    ],
  });
};
