import still from './tcpip-model-encapsulation-path-v3.aj.mjs';

export const meta = {
  name: 'tcpip-model-encapsulation-path-anim',
  article: 'knowledge/network/tcpIp/tcpIp-model.md',
  alt: 'TCP/IP 封装与路径逐步演示（可逐步播放）：应用只交出字节；传输层在前面加 TCP 头写上端口和序号；网络层再加 IP 头写上源和目的地址；链路层最外面加帧头和末尾校验后交给网卡；客户端把帧交给默认网关；路由器拆掉旧帧头、按目的 IP 选下一跳、换上新帧头，IP 头不变；NAT 把私网源地址和端口改写成公网地址并记下映射；服务器逐层拆头，按端口把字节交给对应进程',
};

const W = { frame: 80, ip: 80, tcp: 80, app: 130, fcs: 54 };
const X0 = 120;
const XS = { frame: X0, ip: X0 + 80, tcp: X0 + 160, app: X0 + 240, fcs: X0 + 370 };
const ROWS = [['应用层', ['app']], ['传输层', ['tcp', 'app']], ['网络层', ['ip', 'tcp', 'app']], ['链路层', ['frame', 'ip', 'tcp', 'app', 'fcs']]];
const META = { frame: ['帧头', 'muted'], ip: ['IP 头', 'info'], tcp: ['TCP 头', 'accent'], app: ['应用字节', 'ok'], fcs: ['校验', 'muted'] };
const HOPS = [['客户端', '逐层封装', 'accent'], ['路由器', '按目的 IP 选下一跳', 'info'], ['NAT', '改写地址和端口', 'warn'], ['服务器', '逐层解封装交给进程', 'accent']];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  // n：已经封装到第几层；最新一层的各段带 key，会从上一层滑下来
  const stack = (n, over = {}) => ROWS.slice(0, n).map(([name, segs], r) => {
    const y = 120 + r * 54;
    return k.text({ x: 40, y: y + 27, text: name, size: 'label', weight: 600, tone: 'sec' }) + segs.map((g) => {
      const [title, tone] = META[g];
      const b = k.box({ x: XS[g], y, w: W[g], h: 42, title: over[g] && r === n - 1 ? over[g] : title, titleSize: 'label', tone, strong: r === n - 1 });
      return r === n - 1 ? k.keyed(g, b) : b;
    }).join('');
  }).join('');
  const note = (a, b = '') => k.text({ x: 40, y: 362, text: a, size: 'note', tone: 'sec' }) + (b ? k.text({ x: 40, y: 386, text: b, size: 'note', tone: 'sec' }) : '');
  const hop = (i, tone) => hl('hop', 600, 112 + i * 72, 180, 56, tone);
  const f = (caption, parts) => ({ caption, body: parts.join('') });
  const IP = 'IP 头：192.168.1.5 → 93.184.216.34（一路不变）';

  return k.figure({
    h: 700,
    title: 'TCP/IP：一次通信怎么封装、怎么走',
    subtitle: '分层是职责边界：应用给字节，TCP 标端点和可靠性，IP 跨网络路由，链路层装下一跳',
    body: [
      ...HOPS.map(([t, sub, tone], i) => {
        const y = 112 + i * 72;
        return k.box({ x: 600, y, w: 180, h: 56, title: t, sub, titleSize: 'label', tone }) + (i < 3 ? k.arrow({ points: [[690, y + 56], [690, y + 72]] }) : '');
      }),
      k.text({ x: 800, y: 188, text: '帧头每跳都换', size: 'note', tone: 'sec' }),
      k.text({ x: 800, y: 260, text: '映射有超时', size: 'note', tone: 'sec' }),
      k.text({ x: 800, y: 296, text: 'IP 通常端到端', size: 'note', tone: 'sec' }),
      k.text({ x: 800, y: 316, text: '保持，NAT 例外', size: 'note', tone: 'sec' }),
      ...[
        ['TCP 连接', '协议 + 源/目的 IP + 端口\n一次 write ≠ 对端一次 read'],
        ['UDP 与 QUIC', 'QUIC 在 UDP 上做加密和可靠流\n仍受 MTU、NAT、防火墙影响'],
        ['MTU', 'payload 加各层头部可能超 MTU\n挡掉必要 ICMP，大包会卡住'],
      ].map(([t, sub], i) => k.box({ x: 40 + i * 300, y: 412, w: 280, h: 84, title: t, sub, titleSize: 'body', tone: i === 2 ? 'warn' : 'info' })),
      k.panel({ x: 40, y: 520, w: 880, h: 104, label: '一次 HTTPS 请求出问题，按这个顺序排查', tone: 'accent' }),
      ...['DNS', '路由', 'ARP/NDP', 'TCP/QUIC\n握手', 'TLS/SNI', 'HTTP 状态', '应用下游'].map((t, i) => {
        const x = 56 + i * 124;
        return k.box({ x, y: 556, w: 106, h: 54, title: t, titleSize: 'label', tone: 'info' }) + (i < 6 ? k.arrow({ points: [[x + 106, 583], [x + 124, 583]] }) : '');
      }),
      k.note({ x: 40, y: 640, w: 880, h: 44, lead: 'ping 通不等于服务好：', text: '只说明某类 ICMP 路径可达，不保证 443、TLS 或应用健康。' }),
    ].join(''),
    frames: [
      f('应用层只管交出字节，比如一段 HTTP 请求；它不知道路怎么走', [stack(1), hop(0), note('应用只给字节，不关心端口以外的事')]),
      f('传输层在前面加 TCP 头：源端口、目的端口 443、序号和 flags，标明交给对端哪个进程、字节怎么排序', [stack(2), hop(0), note('TCP 头：源/目的端口、序号、flags')]),
      f('网络层再加 IP 头：源和目的地址、Hop Limit，靠它跨网络找到对方', [stack(3), hop(0), note('IP 头：源/目的地址、Hop Limit')]),
      f('链路层最外面包上帧头和末尾校验：帧头只写“下一跳”的链路地址，这里是默认网关', [stack(4, { frame: '→ 网关' }), hop(0), note('帧头：下一跳链路地址 · 末尾校验')]),
      f('路由器收到帧，拆掉旧帧头，按目的 IP 查路由表选下一跳，再换上新帧头。IP 头基本不动', [stack(4, { frame: '→ 下一跳' }), hop(1, 'info'), note('帧头每一跳都换', IP)]),
      f('出公网前经过 NAT：把私网源地址和端口改写成公网的，并记下一条有超时的映射，回包才找得回来', [stack(4, { ip: '源已改写' }), hop(2), note('源 192.168.1.5:51000 → 203.0.113.7:40001', '映射超时后，长连接的回包就找不到人了')]),
      f('服务器逐层拆头：校验帧、看 IP 是不是发给自己、按 TCP 端口 443 把字节交给对应进程', [stack(1), hop(3, 'ok'), note('拆到最后只剩应用字节，交给监听 443 的进程')]),
    ],
  });
};
