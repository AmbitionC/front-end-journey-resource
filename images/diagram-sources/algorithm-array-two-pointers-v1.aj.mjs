export const meta = {
  name: 'algorithm-array-two-pointers-v1',
  article: 'knowledge/data-structure/algorithm/algorithm-array.md',
  alt: '有序数组 1 3 4 6 8 11 找两数之和 10：left 和 right 从两端向中间移动，每一步都排除一个不可能的数，第五步找到 4 和 6；下方滑动窗口在出现重复字符时收缩左边界',
};

const N = [1, 3, 4, 6, 8, 11];
const STEPS = [
  [0, 5, [], '1 + 11 = 12，太大 → right 左移'],
  [0, 4, [5], '1 + 8 = 9，太小 → left 右移'],
  [1, 4, [0, 5], '3 + 8 = 11，太大 → right 左移'],
  [1, 3, [0, 4, 5], '3 + 6 = 9，太小 → left 右移'],
  [2, 3, [0, 1, 4, 5], '4 + 6 = 10，找到'],
];

export default (k) => k.figure({
  h: 680,
  title: '双指针：每一步都排除一个不可能的数',
  subtitle: '有序数组里找两数之和等于 10；灰色是已经证明不可能参与答案的位置',
  body: [
    ...STEPS.map(([l, r, out, msg], i) => {
      const y = 140 + i * 58;
      return [
        k.text({ x: 40, y: y + 27, text: `第 ${i + 1} 步`, size: 'label', tone: 'muted' }),
        k.cells({ x: 130, y, values: N, cw: 52, ch: 42, indices: i === 0, mark: { [l]: i === 4 ? 'ok' : 'accent', [r]: i === 4 ? 'ok' : 'info' }, dim: out }),
        k.text({ x: 470, y: y + 27, text: msg, size: 'label', tone: i === 4 ? 'ok' : 'sec', weight: i === 4 ? 600 : 400 }),
      ].join('');
    }),
    k.text({ x: 470, y: 124, text: '绿框：left，蓝框：right', size: 'note', tone: 'muted' }),

    k.panel({ x: 40, y: 446, w: 880, h: 150, label: '滑动窗口：扩张右边，出了问题再收缩左边（例：最长不重复子串）' }),
    k.text({ x: 64, y: 512, text: '扩张', size: 'label', tone: 'muted' }),
    k.cells({ x: 130, y: 490, values: [...'abcabcbb'], cw: 40, ch: 38, indices: false, mark: { 0: 'bad', 1: 'accent', 2: 'accent', 3: 'bad' } }),
    k.text({ x: 470, y: 514, text: 'right 把 a 放进来，窗口里有了两个 a', size: 'label', tone: 'sec' }),
    k.text({ x: 64, y: 562, text: '收缩', size: 'label', tone: 'muted' }),
    k.cells({ x: 130, y: 540, values: [...'abcabcbb'], cw: 40, ch: 38, indices: false, mark: { 1: 'accent', 2: 'accent', 3: 'accent' }, dim: [0] }),
    k.text({ x: 470, y: 564, text: 'left 右移到窗口重新合法：bca', size: 'label', tone: 'sec' }),

    k.note({ x: 40, y: 612, w: 880, h: 50, text: '正确性来自不变量，不是“用了两个指针”；数组可原地改，JS 字符串不可变。' }),
  ].join(''),
});
