import still from './agent-timeout-budget-deadline-v2.aj.mjs';

export const meta = {
  name: 'agent-timeout-budget-deadline-anim',
  article: 'knowledge/llm/production/agent-timeout-budget.md',
  alt: 'Agent 超时预算逐跳演示（可逐步播放）：用户 SLO 8 秒，预留响应和提交各 0.5 秒；Gateway 在 10:00:00 收到请求，算出绝对 deadline 10:00:08 往下传；Agent 剩 7.8 秒，扣掉预留后可用 6.8 秒；模型调用用掉 3.8 秒后失败，还剩 3 秒、P95 1.2 秒，可以重试一次；重试又失败只剩 0.9 秒，不再启动同类重试；工具提交前再查 deadline；超时后取消沿链路向下传播；只剩 80 毫秒时不再启动要 2 秒的调用',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
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

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const hop = (i, tone = 'warn') => hl('hop', 40 + i * 228, 244, 196, 84, tone);
  const left = (text, tone = 'accent') => k.text({ x: 920, y: 230, text, size: 'label', tone, anchor: 'end', weight: 600 });
  const f = (caption, parts) => ({ caption, body: parts.join('') });
  const cancel = () => [0, 1, 2].map((i) => k.arrow({ points: [[40 + i * 228 + 196, 302], [40 + i * 228 + 228, 302]], tone: 'bad', flow: true })).join('');

  return k.figure({
    h: 570,
    title: 'Agent 超时：一笔沿链路递减的预算',
    subtitle: '入口算一次绝对 deadline，每一跳扣掉已用时间和必要预留，不给每个组件重新发一份完整超时',
    body: s.join('') + k.note({ x: 40, y: 484, w: 880, h: 52, lead: 'deadline 和 lease 别混：', text: 'deadline 是业务不再需要结果的时刻，lease 是当前 Worker 的所有权。' }),
    frames: [
      f('先从用户能接受的时间反推：交互式回答 P95 8 秒，留 0.5 秒给网络和响应、0.5 秒给状态提交，模型和工具一共只有 7 秒', [hl('slo', 40, 142, 880, 44, 'accent'), left('总预算 8s')]),
      f('Gateway 在 10:00:00 收到请求，只算一次绝对 deadline = 10:00:08，随请求往下传，而不是传“8 秒”', [hop(0), left('deadline 10:00:08')]),
      f('Agent 在 10:00:00.2 开始干活：剩余 = 截止 − 现在 = 7.8 秒，再扣掉响应和提交的 1 秒预留，能花的是 6.8 秒', [hop(1), left('可用 6.8s')]),
      f('模型调用把首 token、空闲、总时限三种超时分开盯。这次卡了 3.8 秒后失败，可用预算还剩 3 秒', [hop(2), left('还剩 3s', 'warn')]),
      f('还剩 3 秒，这类调用 P95 是 1.2 秒：够试一次。重试继承同一个 deadline，不是重新开一个 8 秒', [hop(2), hl('rule', 40, 376, 430, 84), left('还剩 3s', 'warn')]),
      f('重试又失败，只剩 0.9 秒，不够一次 P95：不再启动同类重试，转去返回超时或更快的合格路径', [hop(2, 'bad'), hl('rule', 40, 376, 430, 84, 'bad'), left('还剩 0.9s', 'bad')]),
      f('如果走到了工具，提交副作用前再查一次 deadline；已经过期就不提交，提交时带幂等键防止重复', [hop(3), left('提交前再查', 'warn')]),
      f('deadline 一到，取消沿着同一条链往下传：下游要真正停掉手里的模型调用和工具，而不只是上游不再等', [hop(1, 'bad'), cancel(), left('已过期：取消下传', 'bad')]),
      f('最低有效窗口：只剩 80 毫秒时，不要再启动通常要 2 秒的调用，直接返回超时或走更快的合格路径', [hl('rule', 490, 376, 430, 84, 'bad'), left('还剩 80ms', 'bad')]),
    ],
  });
};
