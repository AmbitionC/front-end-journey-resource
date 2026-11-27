import still from './websocket-handshake-frame-lifecycle-v2.aj.mjs';

export const meta = {
  name: 'websocket-handshake-frame-lifecycle-anim',
  article: 'knowledge/backend/api/websocket.md',
  alt: 'WebSocket 连接生命周期逐步演示（可逐步播放）：客户端发带 Upgrade 和 Sec-WebSocket-Key 的 GET；服务端回 101 和 Sec-WebSocket-Accept，之后同一条 TCP 连接改走帧；客户端发出的数据帧必须掩码；服务端把一条长消息分三片发，首片 opcode 0x1 且 FIN=0，中间是延续帧，最后一片 FIN=1 时接收方才拼出整条消息；Ping 和 Pong 只说明连接活着；最后双方交换 Close 帧关闭',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  const CX = 100, SX = 500;
  s.push(k.box({ x: CX - 60, y: 110, w: 120, h: 44, title: '客户端', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: SX - 60, y: 110, w: 120, h: 44, title: '服务端', titleSize: 'body', tone: 'accent' }));
  s.push(`<line x1="${CX}" y1="154" x2="${CX}" y2="560" stroke="${k.t.faint}" stroke-width="1.5" stroke-dasharray="4 5"/>`);
  s.push(`<line x1="${SX}" y1="154" x2="${SX}" y2="560" stroke="${k.t.faint}" stroke-width="1.5" stroke-dasharray="4 5"/>`);

  const msgs = [
    // y, dir(1 = C→S), label, tone, dashed
    [200, 1, 'GET · Upgrade: websocket · Sec-WebSocket-Key', 'info', false],
    [256, -1, '101 Switching Protocols · Sec-WebSocket-Accept', 'ok', false, 'Accept 由 Key + GUID 算出，不是身份认证', 290],
    [340, 1, '数据帧（客户端发出的必须掩码）', 'line', false],
    [376, -1, '数据帧（服务端发出的不掩码）', 'line', false],
    [420, 1, 'Ping', 'muted', true],
    [450, -1, 'Pong', 'muted', true],
    [520, 1, 'Close 1000', 'warn', false],
    [550, -1, 'Close 回应', 'warn', false],
  ];
  [['握手', 228], ['收发', 358], ['心跳', 435], ['关闭', 535]].forEach(([t, y]) => s.push(k.text({ x: 40, y: y + 5, text: t, size: 'label', tone: 'muted', weight: 600 })));

  // 右侧：帧头 + 分片
  s.push(k.panel({ x: 580, y: 110, w: 340, h: 250, label: '帧头关键字段', tone: 'info' }));
  [
    ['FIN', '1 位', '消息最后一帧为 1'],
    ['opcode', '4 位', '文本 / 二进制 / 控制'],
    ['MASK', '1 位', '客户端 → 服务端必须为 1'],
    ['Payload len', '7 位', '126 / 127 扩展到 16 / 64 位'],
  ].forEach(([f, bits, d], i) => {
    const y = 162 + i * 48;
    s.push(k.text({ x: 600, y, text: f, size: 'label', mono: true, weight: 600 }));
    s.push(k.text({ x: 730, y, text: bits, size: 'label', tone: 'muted' }));
    s.push(k.text({ x: 600, y: y + 22, text: d, size: 'note', tone: 'sec' }));
  });

  s.push(k.panel({ x: 580, y: 380, w: 340, h: 180, label: '一条消息分三片发', tone: 'accent' }));
  s.push(k.text({ x: 750, y: 530, text: '接收方拼完 FIN=1 那片才得到整条消息', size: 'note', anchor: 'middle', tone: 'sec' }));

  const MSGS = [
    [200, 1, 'GET · Upgrade: websocket · Sec-WebSocket-Key', 'info', false],
    [256, -1, '101 Switching Protocols · Sec-WebSocket-Accept', 'ok', false, 'Accept 由 Key + GUID 算出，不是身份认证', 290],
    [340, 1, '数据帧（客户端发出的必须掩码）', 'line', false],
    [376, -1, '数据帧（服务端发出的不掩码）', 'line', false],
    [420, 1, 'Ping', 'muted', true],
    [450, -1, 'Pong', 'muted', true, '只说明连接活着，不代表业务消息已处理', 478],
    [520, 1, 'Close 1000', 'warn', false],
    [550, -1, 'Close 回应', 'warn', false],
  ];
  const seq = (n) => MSGS.slice(0, n).map(([y, dir, label, tone, dashed, note, ny], i) => {
    const pts = dir === 1 ? [[CX, y], [SX, y]] : [[SX, y], [CX, y]];
    let s = k.arrow({ points: pts, tone: tone === 'line' ? undefined : tone, dashed, flow: i === n - 1 }) +
      k.text({ x: (CX + SX) / 2, y: y - 8, text: label, size: 'label', anchor: 'middle', tone: tone === 'line' ? 'sec' : tone });
    if (note) s += k.text({ x: (CX + SX) / 2, y: ny, text: note, size: 'note', anchor: 'middle', tone: 'muted' });
    return s;
  }).join('');
  // 帧头里用左侧橙条标出某一行（0 FIN / 1 opcode / 2 MASK / 3 len）
  const field = (...rows) => rows.map((r, i) => k.keyed(`fld${i}`, `<rect x="586" y="${145 + r * 48}" width="6" height="44" rx="3" fill="${k.color('warn')}"/>`)).join('');
  const frags = (n) => [['0x1 文本', 'FIN=0'], ['0x0 延续', 'FIN=0'], ['0x0 延续', 'FIN=1']].map(([t, fin], i) =>
    k.box({ x: 596 + i * 108, y: 428, w: 96, h: 64, title: t, sub: fin, titleSize: 'label', tone: i >= n ? 'muted' : i === 2 ? 'ok' : 'info', dashed: i >= n })).join('');
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 680,
    title: 'WebSocket：握手、帧与关闭',
    subtitle: 'HTTP/1.1 Upgrade 换成 101 之后，同一条 TCP 连接改走 WebSocket 帧',
    body: s.join('') + k.note({ x: 40, y: 590, w: 880, h: 52, lead: '协议之外归应用：', text: '升级前核身份和 Origin，逐条消息授权，看 bufferedAmount 自定背压，断线靠游标重放。' }),
    frames: [
      f('客户端先发一个普通的 HTTP GET，带上 Upgrade: websocket 和随机的 Sec-WebSocket-Key：身份和 Origin 要在这一步核对', [seq(1), frags(0)]),
      f('服务端回 101 和 Accept：Accept 由 Key 拼上固定 GUID 再 SHA-1、Base64 算出，只证明对方懂这个协议。从这里起，同一条 TCP 连接改走帧', [seq(2), frags(0)]),
      f('客户端发数据帧：MASK 必须为 1，负载用 4 字节掩码异或过，防止中间代理被投毒', [seq(3), field(2), frags(0)]),
      f('服务端发一条长消息，分成三片：第一片 opcode 0x1 表示文本，FIN=0 说明后面还有', [seq(4), field(0, 1), frags(1)]),
      f('中间片 opcode 0x0 是延续帧；最后一片 FIN=1，接收方拼完这一片才拿到整条消息', [seq(4), field(0), frags(3)]),
      f('空闲时用 Ping / Pong 控制帧探活：收到 Pong 只说明连接还在，不代表业务消息已处理', [seq(6), frags(3)]),
      f('关闭也要握手：一方发 Close（如 1000 正常关闭），另一方回 Close，然后才断 TCP', [seq(8), frags(3)]),
    ],
  });
};
