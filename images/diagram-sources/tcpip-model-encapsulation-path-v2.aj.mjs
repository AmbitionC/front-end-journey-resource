export const meta = {
  name: 'tcpip-model-encapsulation-path-v2',
  article: 'knowledge/network/tcpIp/tcpIp-model.md',
  alt: 'TCP/IP 的封装与端到端路径。左侧是发送端逐层封装：应用层只有应用字节；传输层加 TCP 头，含源和目的端口、序号和 flags；网络层再加 IP 头，含源和目的地址、Hop Limit；链路层最外面加帧头（下一跳链路地址）和末尾校验。接收端逐层验证和解封装，把字节交给正确进程。右侧是路径：客户端把帧交给默认网关，路由器按目的 IP 选下一跳，每一跳帧头都会换；NAT 会改写地址和端口并维护有超时的映射；服务器逐层解封装。源和目的 IP 通常端到端保持，除非 NAT 或隧道改写。三个要点：TCP 连接由协议加源、目的 IP 和端口标识，是有序字节流，一次 write 不等于对端一次 read，可靠也不等于请求只处理一次；QUIC 在 UDP 上实现加密和可靠 stream，仍受 MTU、NAT 和防火墙影响；应用 payload 加上各层头部可能超过路径 MTU，挡掉必要的 ICMP 会造成能连接但大包卡住。排障顺序：DNS、路由、ARP 或 NDP、TCP 或 QUIC 握手、TLS 证书和 SNI、HTTP 状态、应用下游；ping 通只说明某类 ICMP 路径可达',
};

export default (k) => {
  const s = [];
  const W = { frame: 80, ip: 80, tcp: 80, app: 130, fcs: 54 };
  const X0 = 120;
  const xs = { frame: X0, ip: X0 + 80, tcp: X0 + 160, app: X0 + 240, fcs: X0 + 370 };
  const rows = [
    ['应用层', ['app']],
    ['传输层', ['tcp', 'app']],
    ['网络层', ['ip', 'tcp', 'app']],
    ['链路层', ['frame', 'ip', 'tcp', 'app', 'fcs']],
  ];
  const meta = { frame: ['帧头', 'muted'], ip: ['IP 头', 'info'], tcp: ['TCP 头', 'accent'], app: ['应用字节', 'ok'], fcs: ['校验', 'muted'] };
  rows.forEach(([name, segs], r) => {
    const y = 120 + r * 54;
    s.push(k.text({ x: 40, y: y + 27, text: name, size: 'label', weight: 600, tone: 'sec' }));
    segs.forEach((g) => s.push(k.box({ x: xs[g], y, w: W[g], h: 42, title: meta[g][0], titleSize: 'label', tone: meta[g][1], strong: r === 0 })));
  });
  s.push(k.text({ x: 40, y: 362, text: 'TCP 头：源/目的端口、序号、flags', size: 'note', tone: 'muted' }));
  s.push(k.text({ x: 40, y: 386, text: 'IP 头：源/目的地址、Hop Limit · 帧头：下一跳链路地址', size: 'note', tone: 'muted' }));

  // 右侧路径
  const hops = [
    ['客户端', '逐层封装', 'accent'],
    ['路由器', '按目的 IP 选下一跳', 'info'],
    ['NAT', '改写地址和端口', 'warn'],
    ['服务器', '逐层解封装交给进程', 'accent'],
  ];
  hops.forEach(([t, sub, tone], i) => {
    const y = 112 + i * 72;
    s.push(k.box({ x: 600, y, w: 180, h: 56, title: t, sub, titleSize: 'label', tone }));
    if (i < 3) s.push(k.arrow({ points: [[690, y + 56], [690, y + 72]] }));
  });
  s.push(k.text({ x: 800, y: 188, text: '帧头每跳都换', size: 'note', tone: 'sec' }));
  s.push(k.text({ x: 800, y: 260, text: '映射有超时', size: 'note', tone: 'sec' }));
  s.push(k.text({ x: 800, y: 296, text: 'IP 通常端到端', size: 'note', tone: 'sec' }));
  s.push(k.text({ x: 800, y: 316, text: '保持，NAT 例外', size: 'note', tone: 'sec' }));

  [
    ['TCP 连接', '协议 + 源/目的 IP + 端口\n一次 write ≠ 对端一次 read'],
    ['UDP 与 QUIC', 'QUIC 在 UDP 上做加密和可靠流\n仍受 MTU、NAT、防火墙影响'],
    ['MTU', 'payload 加各层头部可能超 MTU\n挡掉必要 ICMP，大包会卡住'],
  ].forEach(([t, sub], i) => s.push(k.box({ x: 40 + i * 300, y: 412, w: 280, h: 84, title: t, sub, titleSize: 'body', tone: i === 2 ? 'warn' : 'info' })));

  s.push(k.panel({ x: 40, y: 520, w: 880, h: 104, label: '一次 HTTPS 请求出问题，按层往上查', tone: 'accent' }));
  ['DNS', '路由', 'ARP/NDP', 'TCP 握手', 'TLS/SNI', 'HTTP 状态', '应用下游'].forEach((t, i) => {
    const x = 56 + i * 124;
    s.push(k.box({ x, y: 560, w: 106, h: 44, title: t, titleSize: 'label', tone: 'info' }));
    if (i < 6) s.push(k.arrow({ points: [[x + 106, 582], [x + 124, 582]] }));
  });

  return k.figure({
    h: 700,
    title: 'TCP/IP：一次通信怎么封装、怎么走',
    subtitle: '分层是职责边界：应用给字节，TCP 标端点和可靠性，IP 跨网络路由，链路层装下一跳',
    body: s.join('') + k.note({ x: 40, y: 640, w: 880, h: 44, lead: 'ping 通不等于服务好：', text: '只说明某类 ICMP 路径可达，不保证 443、TLS 或应用健康。' }),
  });
};
