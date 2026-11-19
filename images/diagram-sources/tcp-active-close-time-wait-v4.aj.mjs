export const meta = {
  name: 'tcp-active-close-time-wait-v4',
  article: 'knowledge/network/tcpIp/tcp-handshake.md',
  alt: '无丢包且 FIN 与 ACK 分开发送的常规主动关闭：A 发 FIN 进入 FIN-WAIT-1，收到 ACK 进入 FIN-WAIT-2；B 收到 FIN 回 ACK 进入 CLOSE-WAIT，应用 close 后发 FIN 进入 LAST-ACK；A 收到 FIN 并发送最后 ACK 后进入 TIME-WAIT，等待 2MSL 后关闭，B 收到最后 ACK 后关闭',
};

const AX = 300, BX = 700;

export default (k) => {
  const s = [];
  const dot = (x, y, tone = 'line') => s.push(`<circle cx="${x}" cy="${y}" r="5" fill="${k.color(tone)}"/>`);
  const state = (side, y, name, sub, tone) => {
    const x = side === 'A' ? AX - 18 : BX + 18, anchor = side === 'A' ? 'end' : 'start';
    s.push(k.text({ x, y: y + 6, text: name, size: 'label', weight: 600, anchor, mono: true, tone }));
    if (sub) s.push(k.text({ x, y: y + 27, text: sub, size: 'note', tone: 'muted', anchor }));
  };
  // 斜向报文：时间往下走
  const msg = (x1, y1, x2, y2, label, tone, below = false) => {
    const dir = Math.sign(x2 - x1), pad = 7;
    s.push(`<line x1="${x1 + dir * pad}" y1="${y1}" x2="${x2 - dir * (pad + 4)}" y2="${y2}" stroke="${k.color(tone)}" stroke-width="2" marker-end="url(#m-${tone})"/>`);
    s.push(k.text({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 + (below ? 24 : -16), text: label, size: 'label', weight: 600, anchor: 'middle', mono: true, tone }));
  };

  s.push(k.box({ x: AX - 90, y: 108, w: 180, h: 44, title: 'A 主动关闭方', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: BX - 90, y: 108, w: 180, h: 44, title: 'B 被动关闭方', titleSize: 'body', tone: 'info' }));
  s.push(`<line x1="${AX}" y1="152" x2="${AX}" y2="404" stroke="${k.t.faint}" stroke-width="2"/>`);
  s.push(`<line x1="${AX}" y1="404" x2="${AX}" y2="474" stroke="${k.color('warn')}" stroke-width="2.5" stroke-dasharray="6 5"/>`);
  s.push(`<line x1="${BX}" y1="152" x2="${BX}" y2="494" stroke="${k.t.faint}" stroke-width="2"/>`);

  for (const x of [AX, BX]) dot(x, 182);
  state('A', 182, 'ESTABLISHED'); state('B', 182, 'ESTABLISHED');

  msg(AX, 222, BX, 258, 'FIN, seq=u', 'accent');
  dot(AX, 222, 'accent'); state('A', 222, 'FIN-WAIT-1', '发出 FIN，不再发新数据', 'accent');
  dot(BX, 258, 'info'); state('B', 258, 'CLOSE-WAIT', '收到 FIN，回 ACK', 'info');

  msg(BX, 258, AX, 294, 'ACK, ack=u+1', 'info', true);
  dot(AX, 294, 'accent'); state('A', 294, 'FIN-WAIT-2', '仍可接收 B 剩余的数据', 'accent');

  s.push(k.text({ x: BX + 18, y: 330, text: '应用发完剩余数据，调用 close()', size: 'note', tone: 'muted' }));
  msg(BX, 352, AX, 388, 'FIN, seq=v', 'info');
  dot(BX, 352, 'info'); state('B', 352, 'LAST-ACK', '发出 FIN，等最后的 ACK', 'info');

  msg(AX, 388, BX, 424, 'ACK, ack=v+1', 'accent', true);
  dot(AX, 388, 'accent'); state('A', 388, 'TIME-WAIT', '收到 FIN，回最后的 ACK', 'accent');
  dot(BX, 424, 'info'); state('B', 424, 'CLOSED', '收到最后的 ACK', 'info');

  s.push(k.text({ x: AX - 18, y: 448, text: '等待 2MSL', size: 'label', weight: 600, anchor: 'end', tone: 'warn' }));
  dot(AX, 480, 'line'); state('A', 480, 'CLOSED');

  return k.figure({
    h: 600,
    title: 'TCP 主动关闭：两个方向各自 FIN、各自确认',
    subtitle: '无丢包、FIN 与 ACK 分开发送的常规路径；状态是处理完该事件之后的状态，纵向间距只是示意',
    body: s.join('') + k.note({ x: 40, y: 524, w: 880, h: 52, lead: 'TIME-WAIT 为什么要等：', text: '最后的 ACK 丢了还能重发；旧报文过期，不会混进同一四元组的新连接。' }),
  });
};
