import still from './algorithm-hash-buckets-resize-v1.aj.mjs';

export const meta = {
  name: 'algorithm-hash-buckets-resize-anim',
  article: 'knowledge/data-structure/algorithm/algorithm-hash.md',
  alt: '哈希表插入与扩容逐步演示（可逐步播放）：8 个桶，key 按 hash mod 8 落桶，owl 和 cat 都落进 5 号桶用链表串起来；放到 6 个元素负载因子 0.75 时扩容到 16 桶，每个 key 按 hash mod 16 要么留在原下标要么搬到下标加 8，碰撞随之拆开',
};

const H = { cat: 13, dog: 2, owl: 21, fox: 8, bee: 3, elk: 14 };
const Y = 232, CH = 56;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const table = (n, keys, hl) => {
    const cw = 832 / n, x0 = 64;
    const buckets = {};
    for (const key of keys) (buckets[H[key] % n] ??= []).push(key);
    let s = k.cells({ x: x0, y: Y, values: Array(n).fill(''), cw, ch: CH, indices: true, textSize: 'label' });
    for (const [b, list] of Object.entries(buckets)) {
      const cx = x0 + (Number(b) + 0.5) * cw;
      list.forEach((key, j) => {
        const y = Y + 10 + j * 62;
        if (j) s += k.arrow({ points: [[cx, y - 16], [cx, y - 2]], tone: 'bad' });
        s += k.keyed(key, k.box({ x: cx - 23, y, w: 46, h: 36, title: key, titleSize: 'label', tone: key === hl ? 'accent' : list.length > 1 ? 'bad' : 'default' }));
      });
    }
    return s;
  };
  const calc = (title, sub, tone = 'default') => k.box({ x: 40, y: 104, w: 880, h: 72, title, sub, tone });
  const alpha = (n, m, tone) => k.text({ x: 920, y: 408, text: `负载因子 α = ${n} / ${m} = ${(n / m).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`, size: 'heading', weight: 600, anchor: 'end', tone });
  const f = (caption, parts) => ({ caption, body: parts.join('') });
  const ins = (key, keys, extra = '', tone) => [calc(`hash("${key}") = ${H[key]}，${H[key]} mod 8 = ${H[key] % 8}`, extra || `放进 ${H[key] % 8} 号桶`, tone), table(8, keys, key), alpha(keys.length, 8, keys.length >= 6 ? 'warn' : 'muted')];

  return k.figure({
    h: 560,
    title: '哈希表：落桶、碰撞，到阈值就扩容重排',
    subtitle: 'hash 值是示意；下标 = hash(key) mod 桶数，扩容阈值 0.75',
    body: k.note({ x: 40, y: 480, w: 880, h: 52, lead: '扩容单次 O(n)：', text: '摊到每次插入约 O(1)；大量 key 挤进同一个桶时查找会退化成 O(n)。' }),
    frames: [
      f('一个空的哈希表：8 个桶，下标由 hash(key) mod 8 决定', [calc('index = hash(key) mod 8', '同一个 key 每次都落进同一个桶，所以查找能直接定位'), table(8, []), alpha(0, 8, 'muted')]),
      f('插入 cat：hash 是 13，13 mod 8 = 5，放进 5 号桶', ins('cat', ['cat'])),
      f('插入 dog：hash 是 2，放进 2 号桶', ins('dog', ['cat', 'dog'])),
      f('插入 owl：21 mod 8 也是 5，撞上 cat。拉链法把它串在 cat 后面，查 owl 时要先比过 cat', ins('owl', ['cat', 'dog', 'owl'], '碰撞：5 号桶已经有 cat，串成链表', 'bad')),
      f('继续插入 fox 和 bee，分别落进 0 号和 3 号桶', [calc('hash("fox") = 8 → 0，hash("bee") = 3 → 3', '没有碰撞'), table(8, ['cat', 'dog', 'owl', 'fox', 'bee']), alpha(5, 8, 'muted')]),
      f('插入 elk 后有 6 个元素，6 / 8 = 0.75，到了扩容阈值', ins('elk', ['cat', 'dog', 'owl', 'fox', 'bee', 'elk'], '6 个元素 / 8 个桶 = 0.75，触发扩容', 'warn')),
      f('扩容到 16 个桶，每个 key 按 hash mod 16 重新定位：要么留在原下标，要么搬到原下标 + 8。cat 搬走，和 owl 的碰撞拆开了', [calc('index = hash(key) mod 16', 'cat 5 → 13，fox 0 → 8，elk 6 → 14；dog、owl、bee 留在原位', 'accent'), table(16, ['cat', 'dog', 'owl', 'fox', 'bee', 'elk']), alpha(6, 16, 'ok')]),
    ],
  });
};
