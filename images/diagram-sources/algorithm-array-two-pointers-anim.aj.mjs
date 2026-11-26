import still from './algorithm-array-two-pointers-v1.aj.mjs';

export const meta = {
  name: 'algorithm-array-two-pointers-anim',
  article: 'knowledge/data-structure/algorithm/algorithm-array.md',
  alt: '有序数组 1 3 4 6 8 11 找两数之和 10（可逐步播放）：left 和 right 从两端向中间移动，和太大就排除右边的数，和太小就排除左边的数，第五次比较找到 4 和 6',
};

const N = [1, 3, 4, 6, 8, 11];
const X0 = 192, CW = 96, Y = 176, CH = 64;
const cx = (i) => X0 + i * CW + CW / 2;
// [left, right, 已排除, 算式, 结论, 理由]
const F = [
  [0, 5, [], '1 + 11 = 12', '比 10 大', '11 配上最小的 1 都超了，11 不可能在答案里 → right 左移'],
  [0, 4, [5], '1 + 8 = 9', '比 10 小', '1 配上剩下最大的 8 都不够，1 不可能在答案里 → left 右移'],
  [1, 4, [0, 5], '3 + 8 = 11', '比 10 大', '8 配上剩下最小的 3 都超了，排除 8 → right 左移'],
  [1, 3, [0, 4, 5], '3 + 6 = 9', '比 10 小', '3 配上剩下最大的 6 都不够，排除 3 → left 右移'],
  [2, 3, [0, 1, 4, 5], '4 + 6 = 10', '找到', '比较 5 次就结束；两两枚举最多要比 15 次'],
];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const pointer = (key, i, label, tone) => k.keyed(key, [
    k.arrow({ points: [[cx(i), Y + CH + 66], [cx(i), Y + CH + 12]], tone }),
    k.text({ x: cx(i), y: Y + CH + 92, text: label, size: 'heading', tone, weight: 600, anchor: 'middle' }),
  ]);
  return k.figure({
    h: 600,
    title: '双指针：每比较一次，就排除一个不可能的数',
    subtitle: '有序数组里找两数之和等于 10',
    frames: F.map(([l, r, out, sum, verdict, why], i) => {
      const done = i === F.length - 1;
      const tone = done ? 'ok' : verdict === '比 10 大' ? 'warn' : 'info';
      const mark = Object.fromEntries(out.map((j) => [j, 'muted']));
      mark[l] = done ? 'ok' : 'accent';
      mark[r] = done ? 'ok' : 'info';
      return {
        caption: `第 ${i + 1} 次比较：${sum}，${verdict}。${why}`,
        body: [
          k.cells({ x: X0, y: Y, values: N, cw: CW, ch: CH, mark, dim: out, textSize: 'title' }),
          pointer('left', l, 'left', done ? 'ok' : 'accent'),
          pointer('right', r, 'right', done ? 'ok' : 'info'),
          k.box({ x: 40, y: 380, w: 880, h: 108, title: `${sum}　${verdict}`, sub: why, tone, titleSize: 'title' }),
          k.text({ x: 920, y: 140, text: `已排除 ${out.length} 个 · 比较 ${i + 1} 次`, size: 'label', tone: 'muted', anchor: 'end' }),
        ].join(''),
      };
    }),
    body: k.note({ x: 40, y: 512, w: 880, h: 52, lead: '为什么能一次排除一个：', text: '数组有序，和太大只能让右边变小，和太小只能让左边变大。' }),
  });
};
