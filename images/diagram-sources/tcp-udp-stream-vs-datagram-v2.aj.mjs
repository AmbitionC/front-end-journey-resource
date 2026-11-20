export const meta = {
  name: 'tcp-udp-stream-vs-datagram-v2',
  article: 'knowledge/network/tcpIp/tcp-udp.md',
  alt: 'TCP 把应用两次写入的 100 字节和 50 字节当成连续字节流，用累计 ACK、重传、接收窗口和拥塞控制保证有序；中间一段丢失时后面已到的字节也要等重传，接收端读到的边界可能是 120 加 30 字节，需要自己定义帧格式；UDP 每次发送是一个独立数据报，边界保留，但可能丢失、乱序或重复，可靠性由上层负责；要完整有序选 TCP，旧数据过期宁可丢选 RTP 或 WebRTC 等成熟协议，要可靠又要多条独立流可用跑在 UDP 上的 QUIC',
};

export default (k) => {
  const s = [];
  s.push(k.panel({ x: 40, y: 116, w: 430, h: 264, label: 'TCP：可靠、有序的字节流' }));
  s.push(k.text({ x: 60, y: 168, text: '应用两次 send：100 字节 + 50 字节', size: 'label', tone: 'muted' }));
  s.push(k.cells({ x: 60, y: 180, values: ['1–60', '61–120', '121–150'], cw: 128, ch: 40, indices: false, mark: { 0: 'accent', 1: 'bad', 2: 'warn' }, textSize: 'label' }));
  s.push(k.text({ x: 60, y: 246, text: '61–120 丢了：121–150 已到也要等重传', size: 'label', tone: 'bad' }));
  s.push(k.box({ x: 60, y: 262, w: 390, h: 64, title: 'recv 可能读到 120 + 30 字节', sub: '边界不保留，要自己 framing（如长度前缀）', titleSize: 'body' }));
  s.push(k.text({ x: 60, y: 356, text: '累计 ACK · 重传 · 接收窗口 · 拥塞控制', size: 'label', tone: 'sec' }));

  s.push(k.panel({ x: 490, y: 116, w: 430, h: 264, label: 'UDP：独立的数据报' }));
  s.push(k.text({ x: 510, y: 168, text: '应用三次 send：一次就是一个数据报', size: 'label', tone: 'muted' }));
  [['D1', 'info'], ['D2', 'bad'], ['D3', 'info']].forEach(([t, tone], i) => s.push(k.box({ x: 510 + i * 134, y: 180, w: 120, h: 40, title: t, titleSize: 'body', tone })));
  s.push(k.text({ x: 510, y: 246, text: '可能丢失、乱序、重复：如收到 D3、D1、D1', size: 'label', tone: 'bad' }));
  s.push(k.box({ x: 510, y: 262, w: 390, h: 64, title: '每次拿到一个完整数据报', sub: '可靠性交给上层：消息 ID、去重、超时、限速', titleSize: 'body' }));
  s.push(k.text({ x: 510, y: 356, text: '首部：源端口、目的端口、长度、校验和', size: 'label', tone: 'sec' }));

  s.push(k.box({ x: 40, y: 404, w: 280, h: 72, title: '必须完整有序', sub: 'TCP：文件、HTTP、数据库协议', tone: 'accent' }));
  s.push(k.box({ x: 340, y: 404, w: 280, h: 72, title: '旧数据过期宁可丢', sub: 'RTP / WebRTC 等成熟协议', tone: 'info' }));
  s.push(k.box({ x: 640, y: 404, w: 280, h: 72, title: '可靠又要多条独立流', sub: 'QUIC：跑在 UDP 之上', tone: 'info' }));

  return k.figure({
    h: 584,
    title: 'TCP 与 UDP：先问要字节流还是独立消息',
    subtitle: '不是“可靠但慢 / 不可靠但快”：连接复用、RTT 和 TLS 都会影响成本，要按场景实测',
    body: s.join('') + k.note({ x: 40, y: 500, w: 880, h: 52, lead: '别手写“可靠 UDP”：', text: 'NAT、企业网络限制和拥塞控制都要实测，做不到就用成熟协议。' }),
  });
};
