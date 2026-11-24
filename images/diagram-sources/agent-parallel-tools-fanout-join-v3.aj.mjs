export const meta = {
  name: 'agent-parallel-tools-fanout-join-v3',
  article: 'knowledge/llm/agent/agent-parallel-tools.md',
  alt: '输入已冻结的计划带着 planVersion 同时发出三个互不依赖的工具调用：读取数据源 A 和 B 是只读的，失败可以退避重试；工具 C 有副作用且结果未知，要先对账，不能盲目重发。三路结果汇入 Join，Join 是校验器：检查必需分支是否到齐、是否仍对应当前 planVersion、数据是否符合 schema 且有证据、迟到和重复结果怎么处理、结果是否互相矛盾。之后按执行前写定的策略继续：All-or-nothing 任一必需分支失败就取消同组，Quorum 达到法定数量即可继续，Best-effort 返回成功部分并附缺失清单；通过后才进入生成报告、校验审批和发布这些有依赖的步骤。并行度由下游容量决定，用 semaphore 和速率限制控制，fan-out 前先预留成本预算',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 206, w: 160, h: 76, title: '冻结输入的计划', sub: 'planVersion = 7', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[200, 244], [220, 244]], head: false }));
  s.push(k.arrow({ points: [[220, 154], [220, 338]], head: false }));
  const br = [
    ['读取数据源 A', '只读，可退避重试', 'info'],
    ['读取数据源 B', '只读，可退避重试', 'info'],
    ['工具 C：结果未知', '有副作用 → 先对账', 'bad'],
  ];
  br.forEach(([t, sub, tone], i) => {
    const y = 120 + i * 92;
    s.push(k.arrow({ points: [[220, y + 34], [240, y + 34]], tone }));
    s.push(k.box({ x: 240, y, w: 200, h: 68, title: t, sub, titleSize: 'body', tone }));
    s.push(k.arrow({ points: [[440, y + 34], [480, y + 34]], tone }));
  });
  s.push(k.box({ x: 480, y: 120, w: 220, h: 252, title: 'Join = 校验器', sub: '必需分支到齐了吗？\n还是当前 planVersion？\nschema 对、有证据吗？\n迟到、重复怎么处理？\n结果互相矛盾吗？', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.text({ x: 740, y: 112, text: '按执行前写定的策略继续', size: 'note', tone: 'muted' }));
  [
    ['All-or-nothing', '必需项失败就全取消'],
    ['Quorum', '够法定数量就继续'],
    ['Best-effort', '成功部分 + 缺失清单'],
  ].forEach(([t, sub], i) => {
    const y = 124 + i * 84;
    s.push(k.box({ x: 740, y, w: 180, h: 68, title: t, sub, titleSize: 'label', tone: 'info' }));
  });
  s.push(k.arrow({ points: [[700, 246], [740, 246]], tone: 'accent' }));
  s.push(k.arrow({ points: [[830, 376], [830, 412]], tone: 'ok' }));
  s.push(k.box({ x: 480, y: 412, w: 440, h: 56, title: '有依赖的步骤：生成报告 → 校验审批 → 发布', titleSize: 'label', tone: 'ok' }));
  s.push(k.box({ x: 40, y: 412, w: 400, h: 56, title: '并行度由下游容量定，不由模型一次发几个', titleSize: 'label', tone: 'warn', dashed: true }));

  return k.figure({
    h: 560,
    title: '并行工具调用：先证明独立，再 fan-out，Join 要校验',
    subtitle: '只有入度为零、输入已冻结、互不依赖的任务才能同时跑；子任务的生命周期不能逃出父任务',
    body: s.join('') + k.note({ x: 40, y: 484, w: 880, h: 52, lead: '策略不能临时放宽：', text: '运行中把 All-or-nothing 改成 Best-effort 等于悄悄降低验收标准。' }),
  });
};
