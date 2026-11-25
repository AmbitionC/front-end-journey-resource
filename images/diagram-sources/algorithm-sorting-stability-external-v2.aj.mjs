export const meta = {
  name: 'algorithm-sorting-stability-external-v2',
  article: 'knowledge/cs/algorithm/algorithm-sorting.md',
  alt: '左边演示排序稳定性。四条记录已经按姓名排好：研发 Amy、销售 Bob、研发 Cat、销售 Dan。再按部门排序时，稳定排序保留相等 key 的原始顺序，结果是研发 Amy、研发 Cat、销售 Bob、销售 Dan，同部门内仍按姓名；不稳定排序可能得到研发 Cat、研发 Amy、销售 Dan、销售 Bob，第一次按姓名排好的顺序被打乱。右边演示外部归并排序：数据超出内存时，第一阶段把文件分块读进内存排好，写成有序的 run，例如 1 5 9、2 6 7、3 4 8；第二阶段用小根堆做 k 路归并，每次弹出各 run 头元素中最小的一个，顺序写出 1 到 9 的完整有序结果。需要稳定时，run 内排序和归并遇到相等 key 都按原始序号决定先后',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 136, text: '稳定性：相等 key 保留原始顺序', size: 'label', tone: 'muted', weight: 600 }));
  const rows = [
    ['已按姓名排好', [['研发', 'Amy'], ['销售', 'Bob'], ['研发', 'Cat'], ['销售', 'Dan']], 'muted'],
    ['再按部门：稳定排序 ✓', [['研发', 'Amy'], ['研发', 'Cat'], ['销售', 'Bob'], ['销售', 'Dan']], 'ok'],
    ['再按部门：不稳定（可能）✕', [['研发', 'Cat'], ['研发', 'Amy'], ['销售', 'Dan'], ['销售', 'Bob']], 'bad'],
  ];
  rows.forEach(([label, cells, tone], r) => {
    const y = 176 + r * 92;
    s.push(k.text({ x: 40, y: y - 10, text: label, size: 'note', tone: tone === 'muted' ? 'sec' : tone }));
    cells.forEach(([d, n], i) => s.push(k.box({ x: 40 + i * 106, y, w: 102, h: 48, title: `${d} · ${n}`, titleSize: 'label', tone: d === '研发' ? 'info' : 'warn' })));
  });

  s.push(k.text({ x: 490, y: 136, text: '外部归并排序：数据放不进内存', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 490, y: 156, w: 430, h: 44, title: '超出内存的大文件', titleSize: 'body', tone: 'muted', strong: true }));
  s.push(k.arrow({ points: [[705, 200], [705, 236]] }));
  s.push(k.text({ x: 715, y: 224, text: '① 分块排好，写成 3 个 run', size: 'note', tone: 'muted' }));
  const runs = ['1 · 5 · 9', '2 · 6 · 7', '3 · 4 · 8'];
  runs.forEach((t, i) => s.push(k.box({ x: 490 + i * 150, y: 236, w: 130, h: 44, title: t, titleSize: 'label', tone: 'info' })));
  s.push(k.arrow({ points: [[555, 280], [650, 330]] }), k.arrow({ points: [[705, 280], [705, 330]] }), k.arrow({ points: [[855, 280], [760, 330]] }));
  s.push(k.box({ x: 595, y: 330, w: 220, h: 64, title: '② 小根堆 k 路归并', sub: '每次弹出最小的头元素', titleSize: 'body', tone: 'accent' }));
  s.push(k.arrow({ points: [[705, 394], [705, 420]] }));
  s.push(k.box({ x: 490, y: 420, w: 430, h: 44, title: '1 · 2 · 3 · 4 · 5 · 6 · 7 · 8 · 9（顺序写出）', titleSize: 'label', tone: 'ok' }));

  return k.figure({
    h: 600,
    title: '排序的两个工程问题：稳定性与超出内存',
    subtitle: '稳定性决定多轮排序能否叠加；外部排序用有序 run 和顺序 I/O 处理大数据',
    body: s.join('') + k.note({ x: 40, y: 500, w: 880, h: 52, lead: '要稳定时：', text: 'run 内排序和多路归并遇到相等 key，都按原始序号决定先后。' }),
  });
};
