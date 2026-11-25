export const meta = {
  name: 'agent-timeout-budget-deadline-v2',
  article: 'knowledge/llm/production/agent-timeout-budget.md',
  alt: 'Agent 链路的超时是一笔沿路径递减的预算。上排从用户 SLO 反推：交互式回答 P95 为 8 秒，预留 0.5 秒网络与响应、0.5 秒状态提交，剩下 7 秒给模型与工具，排队、重试和并行都从这 7 秒里出，图中宽度是示意，不按比例。中排是每一跳都用同一个绝对 deadline 计算剩余预算：Gateway 算出绝对 deadline 并随请求往下传；Agent 用截止时间减去现在得到剩余预算，再扣掉响应和提交的预留；模型调用把首 token 超时、空闲超时和总 deadline 三种信号分开；工具在提交前再查一次 deadline，副作用带幂等键。deadline 向下传播，取消也沿链路向下传播。下排两条规则：重试共用同一个 deadline，例如还剩 3 秒、调用 P95 为 1.2 秒时可以试一次，失败后只剩 0.9 秒就不再启动同类重试；最低有效窗口，只剩 80 毫秒时不要启动通常要 2 秒的调用，直接返回超时或走更快的合格路径。deadline 和 lease 不要混用：deadline 是业务不再需要结果的时刻，lease 是当前 Worker 的所有权',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 130, text: '从用户 SLO 反推：交互式回答 P95 = 8s（宽度示意）', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 40, y: 142, w: 600, h: 44, title: '模型与工具 7s：排队、重试、并行都从这里出', titleSize: 'label', tone: 'accent', strong: true }));
  s.push(k.box({ x: 640, y: 142, w: 140, h: 44, title: '网络与响应 0.5s', titleSize: 'label', tone: 'info' }));
  s.push(k.box({ x: 780, y: 142, w: 140, h: 44, title: '状态提交 0.5s', titleSize: 'label', tone: 'ok' }));

  s.push(k.text({ x: 40, y: 230, text: '每一跳都用同一个绝对 deadline 算剩余预算', size: 'label', tone: 'muted', weight: 600 }));
  const nodes = [
    ['Gateway', '算出绝对 deadline\n随请求往下传', 'muted'],
    ['Agent', '剩余 = 截止 − 现在\n扣掉响应和提交预留', 'accent'],
    ['模型调用', '首 token / 空闲 / 总时限\n三种信号分开', 'info'],
    ['工具', '提交前再查 deadline\n副作用带幂等键', 'warn'],
  ];
  nodes.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 228;
    s.push(k.box({ x, y: 244, w: 196, h: 84, title: t, sub, titleSize: 'body', tone }));
    if (i < nodes.length - 1) {
      s.push(k.arrow({ points: [[x + 196, 272], [x + 228, 272]] }));
      s.push(k.arrow({ points: [[x + 196, 302], [x + 228, 302]], tone: 'bad', dashed: true }));
    }
  });
  s.push(k.text({ x: 40, y: 354, text: '实线：deadline 向下传；红虚线：取消也向下传，下游要真正停下手里的工作', size: 'note', tone: 'muted' }));

  s.push(k.box({ x: 40, y: 376, w: 430, h: 84, title: '重试共用一个 deadline', sub: '还剩 3s、调用 P95 1.2s：可以试一次\n失败后只剩 0.9s：不再启动同类重试', titleSize: 'body', tone: 'warn' }));
  s.push(k.box({ x: 490, y: 376, w: 430, h: 84, title: '最低有效窗口', sub: '只剩 80ms 时别启动要 2s 的调用\n直接返回超时，或走更快的合格路径', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 570,
    title: 'Agent 超时：一笔沿链路递减的预算',
    subtitle: '入口算一次绝对 deadline，每一跳扣掉已用时间和必要预留，不给每个组件重新发一份完整超时',
    body: s.join('') + k.note({ x: 40, y: 484, w: 880, h: 52, lead: 'deadline 和 lease 别混：', text: 'deadline 是业务不再需要结果的时刻，lease 是当前 Worker 的所有权。' }),
  });
};
