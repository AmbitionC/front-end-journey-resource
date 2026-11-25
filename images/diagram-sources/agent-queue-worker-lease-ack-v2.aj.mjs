export const meta = {
  name: 'agent-queue-worker-lease-ack-v2',
  article: 'knowledge/llm/production/agent-queue-worker.md',
  alt: '长任务的队列与 Worker 设计。客户端提交后拿到 jobId，之后轮询或订阅进度。提交接口在一个本地事务里写 job 行和 outbox 事件，大 Prompt、文件和工具结果放对象存储。Broker 里的消息只带 jobId、tenant、deadline 和 trace context。Worker 按固定顺序执行：第一步用条件更新拿租约和递增的 fencing token；第二步执行可重放的计算，在安全点写检查点；第三步对外部副作用使用 operationId 或幂等键；第四步原子保存结果、检查点和终态；第五步最后才 ACK 消息。执行失败先分类，不是一律重试：瞬态和限流退避加 jitter 后重投，Retry-After 优先；参数、权限和永久业务错误直接进入终态，不消耗重试次数；副作用状态未知时先用 operationId 对账，判断不了转人工；超过最大次数进入 DLQ 隔离，仍需有人处理。如果第四步完成、ACK 前断线，消息会重投，新 Worker 读到 job 已 completed 就直接 ACK，不会再发邮件或扣款',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 140, w: 140, h: 84, title: '客户端', sub: '提交后拿 jobId\n轮询或订阅进度', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[180, 182], [205, 182]] }));
  s.push(k.box({ x: 205, y: 140, w: 215, h: 84, title: '提交接口：一个事务', sub: '写 job 行 + outbox 事件\n大 payload 放对象存储', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[420, 182], [445, 182]] }));
  s.push(k.box({ x: 445, y: 140, w: 210, h: 84, title: 'Broker', sub: '消息只带 jobId、tenant\ndeadline、trace context', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[655, 182], [680, 182]] }));

  s.push(k.text({ x: 680, y: 128, text: 'Worker 按这个顺序', size: 'label', tone: 'muted', weight: 600 }));
  const steps = ['① 拿租约 + fencing token', '② 可重放计算 · 写检查点', '③ 副作用带 operationId', '④ 原子存结果和终态', '⑤ 最后才 ACK'];
  steps.forEach((t, i) => {
    const y = 140 + i * 62;
    s.push(k.box({ x: 680, y, w: 240, h: 52, title: t, titleSize: 'label', tone: i === 4 ? 'ok' : 'accent' }));
    if (i < steps.length - 1) s.push(k.arrow({ points: [[800, y + 52], [800, y + 62]] }));
  });

  s.push(`<path d="M 680 228 H 668 V 352 H 680" fill="none" stroke="${k.t.bad}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
  s.push(k.arrow({ points: [[668, 290], [655, 290]], tone: 'bad' }));
  s.push(k.box({ x: 455, y: 248, w: 200, h: 84, title: '执行失败：先分类', sub: '看错误类型\n不是一律重试', titleSize: 'body', tone: 'warn' }));
  s.push(`<path d="M 455 290 H 435 M 435 272 V 458" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  const out = [
    ['瞬态 / 限流：退避 + jitter 重投', 'info'],
    ['参数 / 权限 / 永久：直接终态，不耗次数', 'bad'],
    ['副作用未知：先用 operationId 对账', 'warn'],
    ['超过次数：进 DLQ 隔离，仍要有人处理', 'muted'],
  ];
  out.forEach(([t, tone], i) => {
    const y = 246 + i * 62;
    s.push(k.arrow({ points: [[435, y + 26], [415, y + 26]] }));
    s.push(k.box({ x: 40, y, w: 375, h: 52, title: t, titleSize: 'label', tone }));
  });

  return k.figure({
    h: 600,
    title: '队列与 Worker：任务记录是事实，消息只是唤醒',
    subtitle: '提交时任务与 outbox 同事务落库；Worker 拿租约执行，副作用和终态落定后才确认消息',
    body: s.join('') + k.note({ x: 40, y: 512, w: 880, h: 52, lead: 'ACK 前断线会重投：', text: '新 Worker 读到 job 已 completed 就直接 ACK，不会再发一次邮件或扣一次款。' }),
  });
};
