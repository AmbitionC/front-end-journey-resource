export const meta = {
  name: 'algorithm-string-frequency-split-v1',
  article: 'knowledge/data-structure/algorithm/algorithm-string.md',
  alt: '左边 ababbc 在 k 等于 2 时按只出现一次的 c 切开，剩余 ababb 中 a 出现 2 次、b 出现 3 次，答案为 5；右边 aabcabb 在 k 等于 3 时也按 c 切开，但 aab 与 abb 必须重新计数，两段均不合法，答案为 0',
};

export default (k) => k.figure({
  h: 620,
  title: '字符至少出现 k 次：低频字符是分隔点',
  subtitle: '教学合同：返回最长连续子串长度；每个出现的字符都至少出现 k 次',
  body: [
    k.panel({ x: 40, y: 112, w: 430, h: 408, label: '例一：切掉坏字符后，整段合法' }),
    k.panel({ x: 490, y: 112, w: 430, h: 408, label: '例二：切开后要重新计数' }),
    k.box({ x: 75, y: 156, w: 360, h: 68, title: 'ababbc   |   k = 2', sub: 'a: 2，b: 3，c: 1', tone: 'warn' }),
    k.box({ x: 525, y: 156, w: 360, h: 68, title: 'aabcabb   |   k = 3', sub: 'a: 3，b: 3，c: 1', tone: 'warn' }),
    k.arrow({ points: [[255, 224], [255, 284]], tone: 'bad' }),
    k.text({ x: 270, y: 260, text: '按 c 切开', size: 'label', tone: 'bad' }),
    k.box({ x: 75, y: 284, w: 360, h: 68, title: 'ababb', sub: 'a: 2，b: 3，均达到 k', tone: 'accent' }),
    k.arrow({ points: [[705, 224], [705, 250], [607, 250], [607, 284]], tone: 'bad' }),
    k.arrow({ points: [[705, 250], [802, 250], [802, 284]], tone: 'bad' }),
    k.text({ x: 705, y: 274, text: '按 c 切开', size: 'label', tone: 'bad', anchor: 'middle' }),
    k.box({ x: 525, y: 284, w: 165, h: 68, title: 'aab', sub: 'a: 2，b: 1', tone: 'bad' }),
    k.box({ x: 720, y: 284, w: 165, h: 68, title: 'abb', sub: 'a: 1，b: 2', tone: 'bad' }),
    k.arrow({ points: [[255, 352], [255, 408]], tone: 'accent' }),
    k.box({ x: 75, y: 408, w: 360, h: 72, title: '答案 5', sub: '没有低频字符，整段即可取用', tone: 'accent' }),
    k.arrow({ points: [[607, 352], [607, 380], [705, 380], [705, 408]], tone: 'bad' }),
    k.arrow({ points: [[802, 352], [802, 380], [705, 380]], tone: 'bad', head: false }),
    k.box({ x: 525, y: 408, w: 360, h: 72, title: '答案 0', sub: '分段后，出现的字符均不足 3 次', tone: 'bad' }),
    k.note({ x: 40, y: 548, w: 880, h: 52, text: '低频字符不可能进入合法解；对子区间重新计数，再取各段答案的最大值。' }),
  ].join(''),
});
