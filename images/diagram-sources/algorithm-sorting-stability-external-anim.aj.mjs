import still from './algorithm-sorting-stability-external-v2.aj.mjs';

export const meta = {
  name: 'algorithm-sorting-stability-external-anim',
  article: 'knowledge/cs/algorithm/algorithm-sorting.md',
  alt: '排序稳定性和外部归并排序逐步演示（可逐步播放）：四条记录已按姓名排好，再按部门做稳定排序，Amy 仍在 Cat 前、Bob 仍在 Dan 前；不稳定排序可能把它们换位，打乱第一次的结果；外部排序先把大文件分块排成 3 个有序 run，再用小根堆做 3 路归并，每次弹出各 run 头元素里最小的一个，依次写出 1 到 9',
};

const REC = { Amy: '研发', Bob: '销售', Cat: '研发', Dan: '销售' };
const RUNS = [[1, 5, 9], [2, 6, 7], [3, 4, 8]];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const rowY = (r) => 176 + r * 92;
  const rec = (n, r, i, keyed) => {
    const b = k.box({ x: 40 + i * 106, y: rowY(r), w: 102, h: 48, title: `${REC[n]} · ${n}`, titleSize: 'label', tone: REC[n] === '研发' ? 'info' : 'warn' });
    return keyed ? k.keyed(n, b) : b;
  };
  const row = (r, label, tone, names, keyed = false) => k.text({ x: 40, y: rowY(r) - 10, text: label, size: 'note', tone }) + names.map((n, i) => rec(n, r, i, keyed)).join('');
  const R0 = (keyed) => row(0, '已按姓名排好', 'sec', ['Amy', 'Bob', 'Cat', 'Dan'], keyed);
  const R1 = (keyed) => row(1, '再按部门：稳定排序 ✓', 'ok', ['Amy', 'Cat', 'Bob', 'Dan'], keyed);
  const R2 = (keyed) => row(2, '再按部门：不稳定（可能）✕', 'bad', ['Cat', 'Amy', 'Dan', 'Bob'], keyed);

  // 外部排序：taken = 已经弹出的个数
  const ext = (stage, taken = 0) => {
    const s = [k.box({ x: 490, y: 156, w: 430, h: 44, title: '超出内存的大文件', titleSize: 'body', tone: 'muted', strong: stage === 0 })];
    if (stage < 1) return s.join('');
    s.push(k.arrow({ points: [[705, 200], [705, 236]], flow: stage === 1 }), k.text({ x: 715, y: 224, text: '① 分块排好，写成 3 个 run', size: 'note', tone: 'muted' }));
    const out = [1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, taken);
    const left = RUNS.map((r) => r.filter((v) => !out.includes(v)));
    left.forEach((r, i) => s.push(k.box({ x: 490 + i * 150, y: 236, w: 130, h: 44, title: r.length ? r.join(' · ') : '（空）', titleSize: 'label', tone: r.length ? 'info' : 'muted' })));
    if (stage < 2) return s.join('');
    const heads = left.map((r) => r[0]).filter((v) => v !== undefined);
    s.push(k.arrow({ points: [[555, 280], [650, 330]] }), k.arrow({ points: [[705, 280], [705, 330]] }), k.arrow({ points: [[855, 280], [760, 330]] }));
    s.push(k.box({ x: 595, y: 330, w: 220, h: 64, title: '② 小根堆 k 路归并', sub: heads.length ? `堆里：${heads.join('、')} → 下一个弹 ${Math.min(...heads)}` : '堆空了，归并结束', titleSize: 'body', tone: 'accent' }));
    s.push(k.arrow({ points: [[705, 394], [705, 420]], flow: true }));
    s.push(k.box({ x: 490, y: 420, w: 430, h: 44, title: out.length ? out.join(' · ') + (out.length < 9 ? ' …' : '（顺序写出）') : '（还没写出）', titleSize: 'label', tone: out.length === 9 ? 'ok' : 'default' }));
    return s.join('');
  };
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 600,
    title: '排序的两个工程问题：稳定性与超出内存',
    subtitle: '稳定性决定多轮排序能否叠加；外部排序用有序 run 和顺序 I/O 处理大数据',
    body: [
      k.text({ x: 40, y: 136, text: '稳定性：相等 key 保留原始顺序', size: 'label', tone: 'muted', weight: 600 }),
      k.text({ x: 490, y: 136, text: '外部归并排序：数据放不进内存', size: 'label', tone: 'muted', weight: 600 }),
      k.note({ x: 40, y: 500, w: 880, h: 52, lead: '要稳定时：', text: 'run 内排序和多路归并遇到相等 key，都按原始序号决定先后。' }),
    ].join(''),
    frames: [
      f('四条记录已经按姓名排好：Amy、Bob、Cat、Dan', [R0(true), ext(0)]),
      f('再按部门排一次。稳定排序遇到同部门的记录保留原来的先后：Amy 仍在 Cat 前，Bob 仍在 Dan 前，第一次按姓名的结果被叠加保留', [R0(false), R1(true), ext(0)]),
      f('不稳定排序只保证部门有序，同部门内可能换位：Cat 跑到 Amy 前面，第一次排好的姓名顺序被打乱', [R0(false), R1(false), R2(true), ext(0)]),
      f('数据大到内存装不下时用外部排序：先一块一块读进内存排好，写回磁盘成 3 个有序的 run', [R0(false), R1(false), R2(false), ext(1)]),
      f('再做 3 路归并：小根堆里放各 run 的头元素 1、2、3，每次弹出最小的写出去，再从同一个 run 补一个进堆', [R0(false), R1(false), R2(false), ext(2, 0)]),
      f('弹出 1、2、3 后，堆里是 5、6、4，下一个弹 4。整个过程只顺序读写磁盘', [R0(false), R1(false), R2(false), ext(2, 3)]),
      f('一直弹到堆空，按顺序写出 1 到 9。要稳定时，堆里遇到相等 key 就按原始序号决定先后', [R0(false), R1(false), R2(false), ext(2, 9)]),
    ],
  });
};
