export const meta = {
  name: 'agent-debugging-freeze-replay-regress-v2',
  article: 'knowledge/llm/production/agent-debugging.md',
  alt: 'Agent 调试七步：把失败写成可观察断言，冻结输入、不可变版本、状态和随机种子等复现快照，按 Trace 对齐找最早差异，在隔离副作用的沙箱里先用记录回放重放，最小化失败案例，只修最早可控的原因，最后把案例变成回归用例；跳过冻结直接改 Prompt 只是在追随机波动',
};

export default (k) => {
  const s = [], R1 = 116, R2 = 252, H = 92, W = 196, X = [40, 268, 496, 724];
  const top = [
    ['1 定义失败', '写成可观察断言\n结果、工具、边界'],
    ['2 冻结快照', '输入、不可变版本\n状态、时钟、种子'],
    ['3 还原因果链', '按 Span 对齐\n找最早的差异'],
    ['4 沙箱重放', '先用记录回放\n写操作进模拟服务'],
  ];
  top.forEach(([t, sub], i) => s.push(k.box({ x: X[i], y: R1, w: W, h: H, title: t, sub, tone: 'accent', strong: i === 1 })));
  for (let i = 0; i < 3; i++) s.push(k.arrow({ points: [[X[i] + W, R1 + 46], [X[i + 1], R1 + 46]], tone: 'accent' }));
  const bottom = [
    [3, '5 最小化', '删到刚好还能复现\n保留触发语义'],
    [2, '6 修最早原因', '一次只改一处\n才能归因'],
    [1, '7 变回归用例', '断言工具、授权\n幂等键、成本'],
  ];
  bottom.forEach(([i, t, sub]) => s.push(k.box({ x: X[i], y: R2, w: W, h: H, title: t, sub, tone: 'accent' })));
  s.push(k.arrow({ points: [[X[3] + W / 2, R1 + H], [X[3] + W / 2, R2]], tone: 'accent' }));
  s.push(k.arrow({ points: [[X[3], R2 + 46], [X[2] + W, R2 + 46]], tone: 'accent' }));
  s.push(k.arrow({ points: [[X[2], R2 + 46], [X[1] + W, R2 + 46]], tone: 'accent' }));
  s.push(k.box({ x: X[0], y: R2, w: W, h: H, title: '跳过第 2 步', sub: '直接改 Prompt\n只是在追随机波动', tone: 'bad', dashed: true }));

  s.push(k.panel({ x: 40, y: 380, w: 880, h: 132, label: '示意 · 概率性失败：同一批样本、同样次数、同一执行器，修复前后比较通过率' }));
  s.push(k.cells({ x: 64, y: 428, values: ['✗', '✓', '✓', '✗', '✓', '✓', '✗', '✓', '✓', '✓'], cw: 38, ch: 38, indices: false, mark: { 0: 'bad', 3: 'bad', 6: 'bad' } }));
  s.push(k.text({ x: 64, y: 494, text: '修复前：10 次失败 3 次', size: 'label', tone: 'muted' }));
  s.push(k.arrow({ points: [[464, 447], [500, 447]] }));
  s.push(k.cells({ x: 516, y: 428, values: ['✓', '✓', '✓', '✓', '✓', '✓', '✓', '✓', '✓', '✓'], cw: 38, ch: 38, indices: false, mark: Object.fromEntries([...Array(10).keys()].map((i) => [i, 'ok'])) }));
  s.push(k.text({ x: 516, y: 494, text: '修复后：同样 10 次全过，再看置信范围', size: 'label', tone: 'muted' }));

  return k.figure({
    h: 620,
    title: 'Agent 调试：先冻结证据，再重放，最后变成回归',
    subtitle: '顺序不能倒：修复前后若换了模型别名、工具 Schema 或索引，输出变好也无法归因',
    body: s.join('') + k.note({ x: 40, y: 540, w: 880, h: 52, lead: '单次重放成功不算修好：', text: '固定种子和 temperature 也不保证逐字确定，要比较行为不变量。' }),
  });
};
