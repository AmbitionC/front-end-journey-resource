export const meta = {
  name: 'algorithm-hash-buckets-resize-v1',
  article: 'knowledge/data-structure/algorithm/algorithm-hash.md',
  alt: 'key 经过哈希函数取模落进桶；apple 和 grape 都落在 5 号桶发生碰撞，拉链法串成链，开放寻址则探测下一个空槽；负载因子到阈值后扩容，并按新容量重新定位',
};

const B = 8, X = 400, CW = 60;

export default (k) => k.figure({
  h: 664,
  title: '哈希表：从 key 到桶，碰撞与扩容',
  subtitle: '下标是示意；桶数 8，index = hash(key) mod 8',
  body: [
    ...['apple', 'grape', 'pear'].map((s, i) => k.box({ x: 40, y: 118 + i * 54, w: 110, h: 42, title: s, titleSize: 'body' })),
    `<path d="M152,139 H166 V247 H152" fill="none" stroke="${k.t.line}" stroke-width="1.5"/>`,
    k.arrow({ points: [[166, 193], [196, 193]] }),
    k.box({ x: 200, y: 150, w: 150, h: 86, title: 'hash(key)', sub: 'mod 8 → 下标' }),
    k.cells({ x: X, y: 192, values: Array.from({ length: B }, (_, i) => (i === 5 ? '●' : i === 2 ? '●' : '')), cw: CW, ch: 46, mark: { 5: 'bad', 2: 'accent' } }),
    k.arrow({ points: [[350, 180], [375, 180], [375, 130], [X + 2.5 * CW, 130], [X + 2.5 * CW, 160]], tone: 'accent', label: 'pear → 2', labelAt: [X + 2.5 * CW + 10, 124], labelAnchor: 'start' }),
    k.arrow({ points: [[X + 3.5 * CW, 130], [X + 5.5 * CW, 130], [X + 5.5 * CW, 160]], tone: 'bad', head: true }),
    k.text({ x: X + 5.5 * CW + 10, y: 124, text: 'apple、grape → 5', size: 'label', tone: 'bad' }),
    k.arrow({ points: [[X + 5.5 * CW, 238], [X + 5.5 * CW, 260]], tone: 'bad' }),
    k.box({ x: X + 5.5 * CW - 50, y: 264, w: 100, h: 36, title: 'apple', titleSize: 'label', tone: 'bad' }),
    k.arrow({ points: [[X + 5.5 * CW, 300], [X + 5.5 * CW, 316]], tone: 'bad' }),
    k.box({ x: X + 5.5 * CW - 50, y: 320, w: 100, h: 36, title: 'grape', titleSize: 'label', tone: 'bad' }),
    k.text({ x: X, y: 290, text: '拉链法：碰撞的 key 串在同一个桶里，', size: 'label', tone: 'sec' }),
    k.text({ x: X, y: 314, text: '查找时还要逐个比较 key 本身', size: 'label', tone: 'sec' }),

    k.panel({ x: 40, y: 384, w: 490, h: 180, label: '另一种做法：开放寻址' }),
    k.cells({ x: 54, y: 444, values: ['', '', 'pear', '', '', 'apple', 'grape', ''], cw: 58, ch: 44, mark: { 5: 'bad', 6: 'ok', 2: 'accent' }, indices: true, textSize: 'label' }),
    `<path d="M${54 + 5.5 * 58},490 C${54 + 5.5 * 58},524 ${54 + 6.5 * 58},524 ${54 + 6.5 * 58},494" fill="none" stroke="${k.t.ok}" stroke-width="1.7" marker-end="url(#m-ok)"/>`,
    k.text({ x: 54, y: 548, text: 'grape 撞上 5 号，探测到下一个空槽 6', size: 'label', tone: 'sec' }),

    k.panel({ x: 546, y: 384, w: 374, h: 180, label: '负载因子 α = 元素数 / 桶数' }),
    k.cells({ x: 558, y: 434, values: Array(8).fill(''), cw: 22, ch: 26, indices: false, mark: { 0: 'accent', 2: 'accent', 3: 'accent', 5: 'accent', 6: 'accent', 7: 'accent' } }),
    k.text({ x: 748, y: 453, text: '6 / 8 = 0.75', size: 'label', tone: 'warn', weight: 600 }),
    k.arrow({ points: [[644, 466], [644, 490]], label: '到阈值就扩容', labelAt: [656, 484], labelAnchor: 'start' }),
    k.cells({ x: 558, y: 494, values: Array(16).fill(''), cw: 22, ch: 26, indices: false, mark: { 0: 'accent', 3: 'accent', 5: 'accent', 8: 'accent', 10: 'accent', 15: 'accent' } }),
    k.text({ x: 558, y: 548, text: '扩到 16 桶，按新容量重新定位', size: 'label', tone: 'sec' }),

    k.note({ x: 40, y: 586, w: 880, h: 56, text: '扩容单次 O(n)，摊到多次插入上约 O(1)；大量 key 落进同一个桶时会退化到 O(n)。' }),
  ].join(''),
});
