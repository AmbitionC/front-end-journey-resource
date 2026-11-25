export const meta = {
  name: 'rate-limit-circuit-breaker-v2',
  article: 'knowledge/backend/auth/rate-limit-circuit.md',
  alt: '请求先经过限流器，再经过熔断器，最后到 LLM 或下游服务。限流器保护容量，可按 IP、用户、API Key 和模型分层限制，令牌桶允许受控突发；超限返回 429，可以附 Retry-After，但不是必带。分层维度的用途：IP 防爬虫和 DDoS，用户与 API Key 控制单方消耗，模型维度控制高成本模型用量。熔断器隔离故障，它看下游错误率，不限制总量。熔断器有三个状态：Closed 时正常放行，错误率超过阈值且样本量足够就转为 Open；Open 时直接快速失败，等待 resetTimeout 后进入 Half-open；Half-open 只放行少量探测请求，探测成功回到 Closed，探测失败回到 Open。Open 时走降级：返回缓存结果、换更小的模型、排队，或返回带 retryAfter 的友好错误；降级是为了保住核心功能，不是掩盖故障',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 130, w: 120, h: 84, title: '请求', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[160, 172], [190, 172]] }));
  s.push(k.box({ x: 190, y: 130, w: 220, h: 84, title: '限流器：保护容量', sub: '按 IP / 用户 / Key / 模型\n令牌桶允许受控突发', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[410, 172], [440, 172]] }));
  s.push(k.box({ x: 440, y: 130, w: 200, h: 84, title: '熔断器：隔离故障', sub: '看下游错误率\n不限制总量', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[640, 172], [670, 172]] }));
  s.push(k.box({ x: 670, y: 130, w: 250, h: 84, title: 'LLM / 下游服务', titleSize: 'body', tone: 'muted', strong: true }));

  s.push(k.arrow({ points: [[300, 214], [300, 250]], tone: 'bad' }));
  s.push(k.box({ x: 190, y: 250, w: 220, h: 84, title: '超限 → 429', sub: '可附 Retry-After\n（不是必带）', titleSize: 'body', tone: 'bad' }));
  s.push(k.box({ x: 40, y: 360, w: 370, h: 112, title: '分层限流维度', sub: 'IP：防爬虫和 DDoS\n用户 / API Key：控制单方消耗\n模型：控制高成本模型用量', titleSize: 'body', tone: 'info' }));

  s.push(k.text({ x: 450, y: 252, text: '熔断器的三个状态', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 450, y: 270, w: 130, h: 52, title: 'Closed', titleSize: 'body', tone: 'ok' }));
  s.push(k.box({ x: 790, y: 270, w: 130, h: 52, title: 'Open', titleSize: 'body', tone: 'bad' }));
  s.push(k.box({ x: 620, y: 420, w: 130, h: 52, title: 'Half-open', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[580, 296], [790, 296]], tone: 'bad', label: '错误率超阈值且样本够', labelAt: [685, 286] }));
  s.push(k.arrow({ points: [[800, 322], [720, 420]] }));
  s.push(k.text({ x: 758, y: 362, text: '等 resetTimeout', size: 'note', tone: 'muted', anchor: 'end' }));
  s.push(k.arrow({ points: [[650, 420], [570, 322]], tone: 'ok' }));
  s.push(k.text({ x: 598, y: 400, text: '探测成功', size: 'note', tone: 'ok', anchor: 'end' }));
  s.push(k.arrow({ points: [[750, 446], [870, 446], [870, 322]], tone: 'bad' }));
  s.push(k.text({ x: 862, y: 400, text: '探测失败', size: 'note', tone: 'bad', anchor: 'end' }));
  s.push(k.arrow({ points: [[905, 322], [905, 510]], dashed: true }));

  s.push(k.box({ x: 40, y: 510, w: 880, h: 84, title: 'Open 时走降级，保住核心功能', sub: '返回缓存结果 · 换更小的模型 · 排队（非实时任务）· 友好错误带 retryAfter\n降级不是掩盖故障：状态变化和降级次数都要进告警', titleSize: 'body', tone: 'accent' }));

  return k.figure({
    h: 710,
    title: '限流、熔断与降级：各管一件事',
    subtitle: '限流挡住超出容量的请求，熔断在下游出故障时快速失败，降级让核心功能还能用',
    body: s.join('') + k.note({ x: 40, y: 618, w: 880, h: 52, lead: 'Half-open 很关键：', text: '只放行少量探测请求，成功才回到 Closed，避免下游刚恢复就被流量再次打垮。' }),
  });
};
