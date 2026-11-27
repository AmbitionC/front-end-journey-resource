import still from './tcp-udp-stream-vs-datagram-v2.aj.mjs';

export const meta = {
  name: 'tcp-udp-stream-vs-datagram-anim',
  article: 'knowledge/network/tcpIp/tcp-udp.md',
  alt: 'TCP 与 UDP 收发过程（可逐步播放）：TCP 把两次 send 的 100 和 50 字节切成 1–60、61–120、121–150 三段发出，中间一段丢了，后面先到的字节只能在缓冲区等，接收端回累计 ACK 61，发送端重传后字节连续，应用 recv 读到 120 加 30 字节，边界和发送时不同；UDP 三次 send 是三个独立数据报，D2 丢了、D1 重复、顺序变成 D3 D1 D1，每次能拿到完整数据报，去重和重传交给上层',
};

const CX = [52, 144, 236], NX = [352, 444, 536], RX = [652, 744, 836], CW = 84;
const TY = 176, UY = 360;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const chip = (key, x, y, title, tone = 'default', dashed = false) => k.keyed(key, k.box({ x, y, w: CW, h: 40, title, titleSize: 'label', tone, dashed }));
  const say = (x, y, text, tone = 'sec') => k.text({ x, y, text, size: 'label', tone });
  const SEG = ['1–60', '61–120', '121–150'];
  const D = ['D1', 'D2', 'D3'];
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  // TCP 各阶段
  const tcp = {
    send: () => [...SEG.map((t, i) => chip(`s${i}`, CX[i], TY, t, 'accent')), say(52, 244, '两次 send：100 + 50 字节，切成 3 段')].join(''),
    fly: () => [...SEG.map((t, i) => chip(`s${i}`, NX[i], TY, t, 'accent')), say(352, 244, '三段上路，各带序号')].join(''),
    gap: () => [
      chip('s0', RX[0], TY, '1–60', 'ok'), chip('s1', NX[1], TY, '61–120 ✕', 'bad'), k.box({ x: RX[1], y: TY, w: CW, h: 40, title: '缺口', titleSize: 'label', tone: 'muted', dashed: true }), chip('s2', RX[2], TY, '121–150', 'warn'),
      say(652, 244, '121–150 先到，只能等', 'warn'),
      k.arrow({ points: [[640, 272], [320, 272]], tone: 'info', dashed: true, flow: true, label: 'ACK 61：61 之前都收到了', labelAt: [480, 264] }),
    ].join(''),
    resend: () => [
      chip('s0', RX[0], TY, '1–60', 'ok'), chip('s1', RX[1], TY, '61–120', 'ok'), chip('s2', RX[2], TY, '121–150', 'ok'),
      k.arrow({ points: [[320, 196], [640, 196]], tone: 'accent', flow: true }), say(352, 244, '重传 61–120'), say(652, 244, '1–150 连续了', 'ok'),
    ].join(''),
    read: () => [
      k.box({ x: RX[0], y: TY, w: 176, h: 40, title: 'recv #1：120 字节', titleSize: 'label', tone: 'accent' }), k.box({ x: RX[2], y: TY, w: CW, h: 40, title: '#2：30', titleSize: 'label', tone: 'accent' }),
      say(652, 244, '边界变了：要自己定帧', 'bad'),
    ].join(''),
  };
  const udp = {
    send: () => [...D.map((t, i) => chip(`d${i}`, CX[i], UY, t, 'info')), say(52, 428, '三次 send：每次就是一个数据报')].join(''),
    fly: () => [chip('d0', NX[0], UY, 'D1', 'info'), chip('d1', NX[1], UY, 'D2 ✕', 'bad'), chip('d2', NX[2], UY, 'D3', 'info'), say(352, 428, 'D2 丢了，D1 被网络复制了一份', 'bad')].join(''),
    recv: () => [chip('d2', RX[0], UY, 'D3', 'info'), chip('d0', RX[1], UY, 'D1', 'info'), chip('d0b', RX[2], UY, 'D1', 'warn'), say(652, 428, '收到顺序：D3、D1、D1', 'warn')].join(''),
    app: () => [chip('d2', RX[0], UY, 'D3', 'ok'), chip('d0', RX[1], UY, 'D1', 'ok'), chip('d0b', RX[2], UY, 'D1 重复', 'muted', true), say(652, 428, '上层去重、重传、排序', 'sec')].join(''),
  };

  return k.figure({
    h: 566,
    title: 'TCP 与 UDP：先问要字节流还是独立消息',
    subtitle: '同样发 150 字节，看两边在网络出问题时各自怎么表现',
    body: [
      k.panel({ x: 40, y: 132, w: 880, h: 166, label: 'TCP：可靠、有序的字节流' }),
      k.panel({ x: 40, y: 316, w: 880, h: 150, label: 'UDP：独立的数据报' }),
      k.text({ x: 52, y: 118, text: '发送端', size: 'label', tone: 'muted' }),
      k.text({ x: 352, y: 118, text: '网络', size: 'label', tone: 'muted' }),
      k.text({ x: 652, y: 118, text: '接收端', size: 'label', tone: 'muted' }),
      ...[332, 632].map((x) => `<line x1="${x}" y1="160" x2="${x}" y2="456" stroke="${k.t.faint}" stroke-width="1.5" stroke-dasharray="5 5"/>`),
      k.note({ x: 40, y: 490, w: 880, h: 52, lead: '别手写“可靠 UDP”：', text: '要完整有序用 TCP，旧数据宁可丢用 RTP / WebRTC，要可靠又要多流用 QUIC。' }),
    ].join(''),
    frames: [
      f('TCP 不认“消息”，只认字节：两次 send 的 100 + 50 字节被当成一串，按网络情况切成三段', [tcp.send()]),
      f('三段各带字节序号上路', [tcp.fly()]),
      f('中间一段丢了：121–150 虽然先到，也只能在缓冲区里等，应用一个字节都读不到后面的。接收端回累计 ACK 61', [tcp.gap()]),
      f('发送端发现 61–120 没被确认，重传；补上之后 1–150 连续，才交给应用', [tcp.resend()]),
      f('应用 recv 读到的可能是 120 + 30 字节，和发送时的 100 + 50 对不上：消息边界要自己定', [tcp.read()]),
      f('UDP 每次 send 就是一个独立的数据报，边界天然保留', [tcp.read(), udp.send()]),
      f('网络不替你兜底：D2 丢了，D1 还可能被复制一份', [tcp.read(), udp.fly()]),
      f('接收端按到达顺序拿到 D3、D1、D1：乱序、重复、缺失都可能发生', [tcp.read(), udp.recv()]),
      f('好处是每次拿到的都是完整的一条消息；按消息 ID 去重、超时重传、排序都得上层自己做', [tcp.read(), udp.app()]),
    ],
  });
};
