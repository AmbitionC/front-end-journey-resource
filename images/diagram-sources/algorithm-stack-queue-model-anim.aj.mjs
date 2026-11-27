import still from './algorithm-stack-queue-model-v1.aj.mjs';

export const meta = {
  name: 'algorithm-stack-queue-model-anim',
  article: 'knowledge/cs/algorithm/algorithm-stack-queue.md',
  alt: '栈、队列与两个栈实现队列（可逐步播放）：栈依次 push a、b、c，pop 先出 c；队列从 tail 依次入队 a 到 d，dequeue 从 head 先出 a；两个栈实现队列时，1、2、3 先压进 in 栈，第一次出队发现 out 栈为空，把 in 栈全部倒进 out 栈，顺序反过来，弹出 1；之后入队 4 只进 in 栈，再出队时 out 栈不空，直接弹出 2，不用再倒',
};

function stack(k, x, y, items, { label, cw = 96, ch = 40, tone = 'accent', top }) {
  const s = [];
  items.forEach((v, i) => {
    const yy = y - (i + 1) * ch;
    const hot = top && i === items.length - 1;
    s.push(`<rect x="${x}" y="${yy}" width="${cw}" height="${ch}" fill="${k.t.box}" stroke="${k.color(hot ? top : tone)}" stroke-width="${hot ? 2.4 : 1.4}"/>`);
    s.push(k.text({ x: x + cw / 2, y: yy + ch / 2 + 6, text: v, size: 'body', anchor: 'middle', weight: 600 }));
  });
  s.push(`<path d="M${x - 6},${y - 4 * ch - 10} V${y} H${x + cw + 6} V${y - 4 * ch - 10}" fill="none" stroke="${k.t.line}" stroke-width="1.6"/>`);
  if (label) s.push(k.text({ x: x + cw / 2, y: y + 26, text: label, size: 'label', anchor: 'middle', tone: 'muted' }));
  return s.join('');
}

export default (k) => {
  if (k.mode === 'still') return still(k);
  const sPanel = (items, top, msg, tone = 'sec') => [
    stack(k, 122, 396, items, { label: '', top }),
    k.arrow({ points: [[124, 200], [160, 200], [160, 230]], tone: 'accent', label: 'push', labelAt: [80, 205], labelAnchor: 'start' }),
    k.arrow({ points: [[188, 230], [188, 200], [244, 200]], tone: 'warn', label: 'pop', labelAt: [250, 205], labelAnchor: 'start' }),
    k.text({ x: 170, y: 432, text: msg, size: 'label', tone, anchor: 'middle' }),
  ].join('');
  const qPanel = (values, head, msg, tone = 'sec') => {
    const tail = values.length - 1;
    const mark = {};
    if (head <= tail) mark[head] = 'warn';
    if (tail >= 0) mark[tail] = tail === head ? 'warn' : 'accent';
    return [
      values.length ? k.cells({ x: 360, y: 240, values, cw: 56, ch: 46, indices: false, mark, dim: values.map((_, i) => i).filter((i) => i < head) }) : '',
      values.length ? k.text({ x: 360 + head * 56 + 28, y: 220, text: 'head', size: 'label', tone: 'warn', anchor: 'middle' }) : '',
      values.length && tail !== head ? k.text({ x: 360 + tail * 56 + 28, y: 220, text: 'tail', size: 'label', tone: 'accent', anchor: 'middle' }) : '',
      k.arrow({ points: [[388, 290], [388, 330]], tone: 'warn', label: 'dequeue', labelAt: [400, 318], labelAnchor: 'start' }),
      k.arrow({ points: [[556, 350], [556, 292]], tone: 'accent', label: 'enqueue', labelAt: [544, 370], labelAnchor: 'middle' }),
      k.text({ x: 470, y: 432, text: msg, size: 'label', tone, anchor: 'middle' }),
    ].join('');
  };
  const tPanel = (inS, outS, { pour = false, inTop, outTop, msg = 'out 空了才把 in 全部倒过去', sub = '每个元素最多搬两次', tone = 'sec' } = {}) => [
    stack(k, 666, 360, inS, { label: 'in 栈', tone: 'accent', top: inTop }),
    stack(k, 806, 360, outS, { label: 'out 栈', tone: 'warn', cw: 90, top: outTop }),
    pour ? `<path d="M714,184 C714,136 851,136 851,180" fill="none" stroke="${k.t.accent}" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#m-accent)"/>` + k.text({ x: 782, y: 174, text: '倒入', size: 'label', tone: 'accent', anchor: 'middle', weight: 600 }) : '',
    k.text({ x: 780, y: 418, text: msg, size: 'label', tone, anchor: 'middle' }),
    k.text({ x: 780, y: 440, text: sub, size: 'note', tone: 'muted', anchor: 'middle' }),
  ].join('');

  const S0 = sPanel(['a', 'b', 'c'], null, '最后放进的 c 最先出来');
  const Q0 = qPanel(['a', 'b', 'c', 'd'], 0, '先到的 a 先出去');
  const T0 = tPanel([], [], { msg: '用两个栈拼出一个队列', sub: '入队进 in，出队从 out 拿' });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 560,
    title: '栈、队列与“两个栈实现队列”',
    subtitle: '抽象类型只规定能做哪些操作；数组、链表还是双栈，决定每步的成本',
    body: k.panel({ x: 40, y: 110, w: 260, h: 340, label: '栈：只动 top 一端（LIFO）' }) +
      k.panel({ x: 320, y: 110, w: 300, h: 340, label: '队列：tail 进、head 出（FIFO）' }) +
      k.panel({ x: 640, y: 110, w: 280, h: 340, label: '两个栈实现队列' }) +
      k.note({ x: 40, y: 476, w: 880, h: 56, text: '要撤销、回溯用栈；要按到达顺序公平处理用队列；摊还 O(1) 不等于每次都快。' }),
    frames: [
      f('栈只有一端能动：依次 push a、b、c，后放的压在上面，c 在 top', [sPanel(['a', 'b', 'c'], 'accent', 'push a → b → c，top 是 c', 'accent'), Q0, T0]),
      f('pop 只能从 top 拿：最后放进去的 c 最先出来，这就是后进先出', [sPanel(['a', 'b'], 'warn', 'pop 弹出 c：后进先出', 'warn'), Q0, T0]),
      f('队列两头分工：a、b、c、d 依次从 tail 进来，排在最前面的是 a', [S0, qPanel(['a', 'b', 'c', 'd'], 0, 'enqueue a → b → c → d', 'accent'), T0]),
      f('dequeue 从 head 拿：先到的 a 先出去，head 往后挪到 b', [S0, qPanel(['a', 'b', 'c', 'd'], 1, 'dequeue 取出 a：先进先出', 'warn'), T0]),
      f('用两个栈拼队列：入队 1、2、3 都只压进 in 栈，此时 out 栈是空的', [S0, Q0, tPanel(['1', '2', '3'], [], { inTop: 'accent', msg: '入队 1、2、3：只进 in 栈', tone: 'accent' })]),
      f('第一次出队：out 栈空，把 in 栈一个个弹出、压进 out，顺序正好反过来，最早的 1 到了 out 栈顶', [S0, Q0, tPanel([], ['3', '2', '1'], { pour: true, outTop: 'warn', msg: 'out 空：把 in 全部倒过去', tone: 'warn' })]),
      f('从 out 栈顶弹出 1：和普通队列一样，先进先出', [S0, Q0, tPanel([], ['3', '2'], { msg: '出队得到 1', tone: 'warn' })]),
      f('再入队 4 只进 in 栈；出队时 out 不空，直接弹出 2，不用再倒。每个元素最多被搬两次，摊还 O(1)', [S0, Q0, tPanel(['4'], ['3'], { inTop: 'accent', outTop: 'warn', msg: 'out 不空：直接弹出 2', tone: 'warn' })]),
    ],
  });
};
