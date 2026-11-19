export const meta = {
  name: 'algorithm-complexity-growth-v1',
  article: 'knowledge/cs/algorithm/algorithm-complexity.md',
  alt: '对数坐标下 O(1)、O(log n)、O(n)、O(n log n)、O(n²) 的操作次数随 n 增长；n 等于一百万时，n² 约一万亿次、n log n 约两千万次',
};

const xs = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const f = (g) => xs.map((x) => [x, g(10 ** x)]);

export default (k) => k.figure({
  h: 560,
  title: '复杂度增长：差距在 n 变大时才显现',
  subtitle: '横轴是输入规模 n，纵轴是操作次数，两轴都按 10 倍刻度',
  body: [
    k.lineChart({
      x: 130, y: 130, w: 470, h: 300, xDomain: [1, 6], yDomain: [1, 1e12], logY: true,
      xTicks: [1, 2, 3, 4, 5, 6].map((v, i) => ({ value: v, label: ['10', '100', '1千', '1万', '10万', '100万'][i] })),
      yTicks: [1, 1e3, 1e6, 1e9, 1e12].map((v, i) => ({ value: v, label: ['1', '千', '百万', '十亿', '万亿'][i] })),
      xLabel: '输入规模 n', yLabel: '操作次数',
      series: [
        { label: 'O(n²)', tone: 'bad', points: f((n) => n * n) },
        { label: 'O(n log n)', tone: 'warn', points: f((n) => n * Math.log2(n)) },
        { label: 'O(n)', tone: 'accent', points: f((n) => n) },
        { label: 'O(log n)', tone: 'info', points: f((n) => Math.log2(n)) },
        { label: 'O(1)', tone: 'muted', points: f(() => 1.0001) },
      ],
    }),
    k.panel({ x: 720, y: 130, w: 200, h: 300, label: 'n = 100 万时' }),
    k.text({ x: 738, y: 190, text: 'n²', size: 'body', tone: 'bad', weight: 600 }),
    k.text({ x: 738, y: 216, text: '约一万亿次，不可接受', size: 'label', tone: 'sec' }),
    k.text({ x: 738, y: 266, text: 'n log n', size: 'body', tone: 'warn', weight: 600 }),
    k.text({ x: 738, y: 292, text: '约两千万次', size: 'label', tone: 'sec' }),
    k.text({ x: 738, y: 342, text: 'n', size: 'body', tone: 'accent', weight: 600 }),
    k.text({ x: 738, y: 368, text: '一百万次', size: 'label', tone: 'sec' }),
    k.note({ x: 40, y: 490, w: 880, h: 50, text: 'Big-O 只说增长趋势；对象分配、缓存命中、GC 和 I/O 仍要实测。' }),
  ].join(''),
});
