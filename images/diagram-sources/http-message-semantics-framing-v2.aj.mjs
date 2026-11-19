export const meta = {
  name: 'http-message-semantics-framing-v2',
  article: 'knowledge/network/http/http-message.md',
  alt: '请求和响应报文并排：都由起始行、字段区、一个空行和可选内容组成，请求例子是 POST /orders 带 13 字节 JSON，响应例子是 201 Created 带 16 字节 JSON；下方把 RFC 9110 的语义层和 RFC 9112 的 HTTP/1.1 定界层分开，并标出同时带 Content-Length 和 Transfer-Encoding 会让前后节点切出不同边界，需要拒绝或规范化',
};

const ROWS = [162, 190, 218, 246, 274, 302];

function message(k, x, label, lines) {
  const s = [k.panel({ x, y: 112, w: 420, h: 214, label })];
  const tags = { 0: '起始行', 1: '字段区', 4: '空行', 5: '内容' };
  lines.forEach((text, i) => {
    if (tags[i]) s.push(k.text({ x: x + 16, y: ROWS[i], text: tags[i], size: 'note', tone: 'muted' }));
    s.push(k.text({ x: x + 84, y: ROWS[i], text, size: 'note', mono: true, tone: i === 4 ? 'muted' : (i === 0 ? 'accent' : undefined), weight: i === 0 ? 600 : 400 }));
  });
  s.push(`<line x1="${x + 72}" y1="${ROWS[1] - 14}" x2="${x + 72}" y2="${ROWS[3] + 4}" stroke="${k.t.faint}" stroke-width="2"/>`);
  return s.join('');
}

export default (k) => k.figure({
  h: 588,
  title: 'HTTP 报文：先按结构读，再分清语义与定界',
  subtitle: '请求和响应都是 起始行 → 字段区 → 空行 → 可选内容；HTTP/1.1 每行以 CRLF 结束',
  body: [
    message(k, 40, '请求', ['POST /orders?dry_run=true HTTP/1.1', 'Host: api.example.com', 'Content-Type: application/json', 'Content-Length: 13', '（CRLF）', '{"sku":"A-1"}']),
    message(k, 500, '响应', ['HTTP/1.1 201 Created', 'Content-Type: application/json', 'Content-Length: 16', 'Cache-Control: no-store', '（CRLF）', '{"id":"ord_123"}']),
    k.box({ x: 40, y: 350, w: 420, h: 92, title: '语义层 · RFC 9110', sub: '方法、状态码、字段、内容是什么意思\nHTTP/1.1、HTTP/2、HTTP/3 共用', tone: 'accent' }),
    k.box({ x: 500, y: 350, w: 420, h: 92, title: '定界层 · HTTP/1.1 · RFC 9112', sub: '按行切出起始行和字段\nContent-Length 或 chunked 决定内容在哪结束', tone: 'info' }),
    k.box({ x: 40, y: 474, w: 270, h: 88, title: '两个长度字段同时出现', sub: 'Content-Length\n+ Transfer-Encoding', titleSize: 'body' }),
    k.box({ x: 345, y: 474, w: 270, h: 88, title: '前后节点各认一个', sub: '切出不同边界：请求走私', tone: 'bad', titleSize: 'body' }),
    k.box({ x: 650, y: 474, w: 270, h: 88, title: '按规范拒绝或规范化', sub: '发送方不要同时发送两者', titleSize: 'body' }),
    k.arrow({ points: [[710, 442], [710, 458], [175, 458], [175, 474]], tone: 'info' }),
    k.arrow({ points: [[310, 518], [345, 518]], tone: 'bad' }),
    k.arrow({ points: [[615, 518], [650, 518]], tone: 'bad' }),
  ].join(''),
});
