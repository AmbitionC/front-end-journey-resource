export const meta = {
  name: 'algorithm-stack-queue-model-v1',
  article: 'knowledge/cs/algorithm/algorithm-stack-queue.md',
  alt: '栈只在 top 一端 push 和 pop，后进先出；队列从 tail 入队、head 出队，先进先出；两个栈实现队列时，out 栈为空才把 in 栈全部倒入',
};

function stack(k, x, y, items, { label, cw = 96, ch = 40, tone = 'accent' }) {
  const s = [];
  items.forEach((v, i) => {
    const yy = y - (i + 1) * ch;
    s.push(`<rect x="${x}" y="${yy}" width="${cw}" height="${ch}" fill="${k.t.box}" stroke="${k.color(tone)}" stroke-width="1.4"/>`);
    s.push(k.text({ x: x + cw / 2, y: yy + ch / 2 + 6, text: v, size: 'body', anchor: 'middle', weight: 600 }));
  });
  s.push(`<path d="M${x - 6},${y - 4 * ch - 10} V${y} H${x + cw + 6} V${y - 4 * ch - 10}" fill="none" stroke="${k.t.line}" stroke-width="1.6"/>`);
  if (label) s.push(k.text({ x: x + cw / 2, y: y + 26, text: label, size: 'label', anchor: 'middle', tone: 'muted' }));
  return s.join('');
}

export default (k) => k.figure({
  h: 560,
  title: '栈、队列与“两个栈实现队列”',
  subtitle: '抽象类型只规定能做哪些操作；数组、链表还是双栈，决定每步的成本',
  body: [
    k.panel({ x: 40, y: 110, w: 260, h: 340, label: '栈：只动 top 一端（LIFO）' }),
    stack(k, 122, 396, ['a', 'b', 'c'], { label: '' }),
    k.arrow({ points: [[124, 200], [160, 200], [160, 230]], tone: 'accent', label: 'push', labelAt: [80, 205], labelAnchor: 'start' }),
    k.arrow({ points: [[188, 230], [188, 200], [244, 200]], tone: 'warn', label: 'pop', labelAt: [250, 205], labelAnchor: 'start' }),
    k.text({ x: 170, y: 432, text: '最后放进的 c 最先出来', size: 'label', tone: 'sec', anchor: 'middle' }),

    k.panel({ x: 320, y: 110, w: 300, h: 340, label: '队列：tail 进、head 出（FIFO）' }),
    k.cells({ x: 360, y: 240, values: ['a', 'b', 'c', 'd'], cw: 56, ch: 46, indices: false, mark: { 0: 'warn', 3: 'accent' } }),
    k.text({ x: 388, y: 220, text: 'head', size: 'label', tone: 'warn', anchor: 'middle' }),
    k.text({ x: 556, y: 220, text: 'tail', size: 'label', tone: 'accent', anchor: 'middle' }),
    k.arrow({ points: [[388, 290], [388, 330]], tone: 'warn', label: 'dequeue', labelAt: [400, 318], labelAnchor: 'start' }),
    k.arrow({ points: [[556, 350], [556, 292]], tone: 'accent', label: 'enqueue', labelAt: [544, 370], labelAnchor: 'middle' }),
    k.text({ x: 470, y: 432, text: '先到的 a 先出去', size: 'label', tone: 'sec', anchor: 'middle' }),

    k.panel({ x: 640, y: 110, w: 280, h: 340, label: '两个栈实现队列' }),
    stack(k, 666, 360, ['2', '3'], { label: 'in 栈', tone: 'accent' }),
    stack(k, 806, 360, ['1'], { label: 'out 栈', tone: 'warn', cw: 90 }),
    `<path d="M714,184 C714,136 851,136 851,180" fill="none" stroke="${k.t.accent}" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#m-accent)"/>`,
    k.text({ x: 782, y: 174, text: '倒入', size: 'label', tone: 'accent', anchor: 'middle', weight: 600 }),
    k.text({ x: 780, y: 418, text: 'out 空了才把 in 全部倒过去', size: 'label', tone: 'sec', anchor: 'middle' }),
    k.text({ x: 780, y: 440, text: '每个元素最多搬两次', size: 'note', tone: 'muted', anchor: 'middle' }),

    k.note({ x: 40, y: 476, w: 880, h: 56, text: '要撤销、回溯用栈；要按到达顺序公平处理用队列；摊还 O(1) 不等于每次都快。' }),
  ].join(''),
});
