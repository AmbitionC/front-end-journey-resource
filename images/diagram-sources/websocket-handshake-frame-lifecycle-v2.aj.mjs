export const meta = {
  name: 'websocket-handshake-frame-lifecycle-v2',
  article: 'knowledge/backend/api/websocket.md',
  alt: 'WebSocket 连接生命周期与帧结构。左侧时序：客户端发送带 Upgrade: websocket 和 Sec-WebSocket-Key 的 GET 请求；服务端返回 101 Switching Protocols 和 Sec-WebSocket-Accept，Accept 由 Key 拼接 GUID 后做 SHA-1 再 Base64 得到，只证明服务端理解握手，不是身份认证；之后双方收发文本或二进制数据帧，客户端发往服务端的帧必须掩码；Ping 控制帧由对端回 Pong，只说明连接存活，不代表业务消息已处理；关闭时一方发 Close 帧（如 1000），另一方回 Close 帧。右侧帧头：FIN 1 位标记消息最后一帧，opcode 4 位表示帧类型，MASK 1 位，Payload len 7 位、126 和 127 时扩展为 16 或 64 位。一条消息可以分片：首帧 opcode 0x1 且 FIN=0，中间是 0x0 延续帧 FIN=0，最后一帧 0x0 且 FIN=1。协议之外归应用负责：升级前核对身份和 Origin、逐条消息授权、用 bufferedAmount 观察排队并自定背压阈值、断线后用游标重放恢复',
};

export default (k) => {
  const s = [];
  const CX = 100, SX = 500;
  s.push(k.box({ x: CX - 60, y: 110, w: 120, h: 44, title: '客户端', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: SX - 60, y: 110, w: 120, h: 44, title: '服务端', titleSize: 'body', tone: 'accent' }));
  s.push(`<line x1="${CX}" y1="154" x2="${CX}" y2="560" stroke="${k.t.faint}" stroke-width="1.5" stroke-dasharray="4 5"/>`);
  s.push(`<line x1="${SX}" y1="154" x2="${SX}" y2="560" stroke="${k.t.faint}" stroke-width="1.5" stroke-dasharray="4 5"/>`);

  const msgs = [
    // y, dir(1 = C→S), label, tone, dashed
    [200, 1, 'GET · Upgrade: websocket · Sec-WebSocket-Key', 'info', false],
    [256, -1, '101 Switching Protocols · Sec-WebSocket-Accept', 'ok', false],
    [340, 1, '数据帧（客户端发出的必须掩码）', 'line', false],
    [376, -1, '数据帧（服务端发出的不掩码）', 'line', false],
    [420, 1, 'Ping', 'muted', true],
    [450, -1, 'Pong', 'muted', true],
    [520, 1, 'Close 1000', 'warn', false],
    [550, -1, 'Close 回应', 'warn', false],
  ];
  msgs.forEach(([y, dir, label, tone, dashed]) => {
    const a = dir === 1 ? [[CX, y], [SX, y]] : [[SX, y], [CX, y]];
    s.push(k.arrow({ points: a, tone: tone === 'line' ? undefined : tone, dashed }));
    s.push(k.text({ x: (CX + SX) / 2, y: y - 8, text: label, size: 'label', anchor: 'middle', tone: tone === 'line' ? 'sec' : tone }));
  });
  s.push(k.text({ x: (CX + SX) / 2, y: 290, text: 'Accept 由 Key + GUID 算出，不是身份认证', size: 'note', anchor: 'middle', tone: 'muted' }));
  s.push(k.text({ x: (CX + SX) / 2, y: 478, text: '只说明连接活着，不代表业务消息已处理', size: 'note', anchor: 'middle', tone: 'muted' }));
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
  [['0x1 文本', 'FIN=0'], ['0x0 延续', 'FIN=0'], ['0x0 延续', 'FIN=1']].forEach(([t, fin], i) => {
    const x = 596 + i * 108;
    s.push(k.box({ x, y: 428, w: 96, h: 64, title: t, sub: fin, titleSize: 'label', tone: i === 2 ? 'ok' : 'info' }));
  });
  s.push(k.text({ x: 750, y: 530, text: '接收方拼完 FIN=1 那片才得到整条消息', size: 'note', anchor: 'middle', tone: 'sec' }));

  return k.figure({
    h: 680,
    title: 'WebSocket：握手、帧与关闭',
    subtitle: 'HTTP/1.1 Upgrade 换成 101 之后，同一条 TCP 连接改走 WebSocket 帧',
    body: s.join('') + k.note({ x: 40, y: 590, w: 880, h: 52, lead: '协议之外归应用：', text: '升级前核身份和 Origin，逐条消息授权，看 bufferedAmount 自定背压，断线靠游标重放。' }),
  });
};
