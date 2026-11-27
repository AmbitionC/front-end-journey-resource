import still from './tcp-active-close-time-wait-v4.aj.mjs';

export const meta = {
  name: 'tcp-active-close-time-wait-anim',
  article: 'knowledge/network/tcpIp/tcp-handshake.md',
  alt: 'TCP 主动关闭逐步演示（可逐步播放）：A 发 FIN 进入 FIN-WAIT-1；B 回 ACK 进入 CLOSE-WAIT，A 收到后进入 FIN-WAIT-2；B 发完剩余数据后发 FIN 进入 LAST-ACK；A 回最后的 ACK 进入 TIME-WAIT，B 收到后关闭；A 等待 2MSL 后关闭',
};

const AX = 300, BX = 700;
const MSGS = [
  [AX, 222, BX, 258, 'FIN, seq=u', 'accent', false],
  [BX, 258, AX, 294, 'ACK, ack=u+1', 'info', true],
  [BX, 352, AX, 388, 'FIN, seq=v', 'info', false],
  [AX, 388, BX, 424, 'ACK, ack=v+1', 'accent', true],
];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const msg = ([x1, y1, x2, y2, label, tone, below], latest) => {
    const dir = Math.sign(x2 - x1), pad = 7;
    return k.arrow({ points: [[x1 + dir * pad, y1], [x2 - dir * (pad + 4), y2]], tone: latest ? tone : 'line', width: 2, flow: latest }) +
      k.text({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 + (below ? 24 : -16), text: label, size: 'label', weight: 600, anchor: 'middle', mono: true, tone: latest ? tone : 'muted' });
  };
  const dot = (x, y, tone = 'line') => `<circle cx="${x}" cy="${y}" r="5" fill="${k.color(tone)}"/>`;
  const state = (side, y, name, sub, tone, now) => {
    const x = side === 'A' ? AX - 18 : BX + 18, anchor = side === 'A' ? 'end' : 'start';
    return dot(side === 'A' ? AX : BX, y, now ? tone : 'line') +
      k.text({ x, y: y + 6, text: name, size: 'label', weight: 600, anchor, mono: true, tone: now ? tone : 'muted' }) +
      (sub ? k.text({ x, y: y + 27, text: sub, size: 'note', tone: 'muted', anchor }) : '');
  };
  const head = (a, b) => k.box({ x: AX - 110, y: 104, w: 220, h: 64, title: 'A 主动关闭方', sub: a, titleSize: 'body', tone: 'accent' }) +
    k.box({ x: BX - 110, y: 104, w: 220, h: 64, title: 'B 被动关闭方', sub: b, titleSize: 'body', tone: 'info' });
  // 每帧：报文数 n、A/B 状态行
  const ST = [
    ['A', 182, 'ESTABLISHED'], ['B', 182, 'ESTABLISHED'],
    ['A', 222, 'FIN-WAIT-1', '发出 FIN，不再发新数据', 'accent'],
    ['B', 258, 'CLOSE-WAIT', '收到 FIN，回 ACK', 'info'], ['A', 294, 'FIN-WAIT-2', '仍可接收 B 剩余的数据', 'accent'],
    ['B', 352, 'LAST-ACK', '发出 FIN，等最后的 ACK', 'info'],
    ['A', 388, 'TIME-WAIT', '收到 FIN，回最后的 ACK', 'accent'], ['B', 424, 'CLOSED', '收到最后的 ACK', 'info'],
    ['A', 480, 'CLOSED', '', 'line'],
  ];
  const build = (n, upto, fresh, a, b, extra = '') =>
    head(a, b) + MSGS.slice(0, n).map((m, i) => msg(m, i === n - 1 && fresh)).join('') +
    ST.slice(0, upto).map(([side, y, name, sub, tone], i) => state(side, y, name, sub, tone ?? 'line', i >= upto - (fresh ?? 0))).join('') + extra;
  const close = k.text({ x: BX + 18, y: 330, text: '应用发完剩余数据，调用 close()', size: 'note', tone: 'muted' });
  const wait = (active) => `<line x1="${AX}" y1="404" x2="${AX}" y2="474" stroke="${k.color('warn')}" stroke-width="2.5" stroke-dasharray="6 5"/>` +
    k.text({ x: AX - 18, y: 448, text: '等待 2MSL', size: 'label', weight: 600, anchor: 'end', tone: active ? 'warn' : 'muted' });

  return k.figure({
    h: 600,
    title: 'TCP 主动关闭：两个方向各自 FIN、各自确认',
    subtitle: '无丢包、FIN 与 ACK 分开发送的常规路径；纵向间距只是示意',
    body: [
      `<line x1="${AX}" y1="168" x2="${AX}" y2="500" stroke="${k.t.faint}" stroke-width="2"/>`,
      `<line x1="${BX}" y1="168" x2="${BX}" y2="500" stroke="${k.t.faint}" stroke-width="2"/>`,
      k.note({ x: 40, y: 524, w: 880, h: 52, lead: 'TIME-WAIT 为什么要等：', text: '最后的 ACK 丢了还能重发；旧报文过期，不会混进同一四元组的新连接。' }),
    ].join(''),
    frames: [
      { caption: '连接正常，双方都是 ESTABLISHED，可以互相收发数据', body: build(0, 2, 2, 'ESTABLISHED', 'ESTABLISHED') },
      { caption: 'A 调用 close()，发出 FIN：表示自己不再发数据了，进入 FIN-WAIT-1', body: build(1, 3, 1, 'FIN-WAIT-1', 'ESTABLISHED') },
      { caption: 'B 收到 FIN 回 ACK，进入 CLOSE-WAIT；A 收到 ACK 进入 FIN-WAIT-2。此时只关了 A→B 这个方向，B 还能继续发数据', body: build(2, 5, 2, 'FIN-WAIT-2', 'CLOSE-WAIT') },
      { caption: 'B 的应用把剩余数据发完、调用 close()，发出自己的 FIN，进入 LAST-ACK', body: build(3, 6, 1, 'FIN-WAIT-2', 'LAST-ACK', close) },
      { caption: 'A 收到 FIN，回最后一个 ACK，进入 TIME-WAIT；B 收到这个 ACK 就直接关闭', body: build(4, 8, 2, 'TIME-WAIT', 'CLOSED', close + wait(false)) },
      { caption: 'A 还要等 2MSL：万一最后的 ACK 丢了，B 会重发 FIN，A 得还在才能再回一次；同时让旧报文在网络里过期', body: build(4, 8, 0, 'TIME-WAIT（等 2MSL）', 'CLOSED', close + wait(true)) },
      { caption: '2MSL 到期，A 也关闭，四次挥手结束', body: build(4, 9, 1, 'CLOSED', 'CLOSED', close + wait(false)) },
    ],
  });
};
