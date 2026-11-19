export const meta = {
  name: 'agent-permission-model-capability-approval-v2',
  article: 'knowledge/llm/production/agent-permission-model.md',
  alt: 'Agent 请求的主体、资源、操作和环境属性进入策略决策；低风险读取拿到绑定工具、目标、模式、TTL 和预算的能力票据，高风险写入还要经过绑定精确参数的升级审批；执行点在调用前重新校验票据和参数，放行或拒绝都写进审计',
};

export default (k) => {
  const s = [];
  s.push(k.panel({ x: 40, y: 110, w: 180, h: 340, label: 'Agent 请求的属性' }));
  [['主体', '用户 / Agent / 租户'], ['资源', '类型、ID、密级'], ['操作', '改哪些字段'], ['环境', '任务、网络、时间']]
    .forEach(([title, sub], i) => s.push(k.box({ x: 56, y: 148 + i * 72, w: 148, h: 60, title, sub, titleSize: 'body' })));
  s.push(k.arrow({ points: [[220, 280], [256, 280]], tone: 'accent' }));
  s.push(k.box({ x: 256, y: 222, w: 170, h: 116, title: '策略决策', sub: '允许 / 拒绝 / 送审\n属性来自可信服务\n不信模型自报', tone: 'accent', strong: true }));

  // 读取：能力票据
  s.push(k.panel({ x: 480, y: 110, w: 200, h: 200, label: '低风险读取：发能力票据', tone: 'accent' }));
  ['工具：search_docs', '目标：文档 d9', '模式：只读', 'TTL：15 分钟', '预算：最多 20 次'].forEach((t, i) =>
    s.push(k.text({ x: 500, y: 168 + i * 28, text: t, size: 'label', tone: 'sec' })));
  // 写入：升级审批
  s.push(k.box({ x: 480, y: 344, w: 200, h: 96, title: '高风险写入：升级审批', sub: '人看过精确参数\n只批这一次调用', tone: 'warn', titleSize: 'body' }));
  s.push(k.arrow({ points: [[426, 254], [452, 254], [452, 210], [480, 210]], tone: 'accent' }));
  s.push(k.arrow({ points: [[426, 306], [452, 306], [452, 392], [480, 392]], tone: 'warn' }));

  // 执行点 → 放行/拒绝 → 审计
  s.push(k.box({ x: 720, y: 160, w: 200, h: 96, title: '执行点', sub: '调用前重新校验\n票据、参数、预算', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[680, 208], [720, 208]], tone: 'accent' }));
  s.push(k.arrow({ points: [[680, 392], [700, 392], [700, 236], [720, 236]], tone: 'warn' }));
  s.push(k.box({ x: 720, y: 290, w: 92, h: 48, title: '放行', tone: 'accent', titleSize: 'body' }));
  s.push(k.box({ x: 828, y: 290, w: 92, h: 48, title: '拒绝', tone: 'bad', titleSize: 'body' }));
  s.push(k.arrow({ points: [[766, 256], [766, 290]], tone: 'accent' }));
  s.push(k.arrow({ points: [[874, 256], [874, 290]], tone: 'bad' }));
  s.push(k.box({ x: 720, y: 376, w: 200, h: 64, title: '审计', sub: '主体、票据、参数、结果', titleSize: 'body' }));
  s.push(k.arrow({ points: [[766, 338], [766, 376]] }));
  s.push(k.arrow({ points: [[874, 338], [874, 376]] }));

  return k.figure({
    h: 548,
    title: 'Agent 权限：先按属性决策，再在执行点复核',
    subtitle: '认证只证明是谁；能做什么由策略按主体、资源、操作、环境决定',
    body: s.join('') + k.note({ x: 40, y: 472, w: 880, h: 52, lead: '看得见 ≠ 能调用：', text: '工具出现在列表里不算权限；执行点每次都按票据和参数重新判断。' }),
  });
};
