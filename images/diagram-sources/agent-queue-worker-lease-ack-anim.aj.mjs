import still from './agent-queue-worker-lease-ack-v2.aj.mjs';

export const meta = {
  name: 'agent-queue-worker-lease-ack-anim',
  article: 'knowledge/llm/production/agent-queue-worker.md',
  alt: '队列与 Worker 的一次长任务（可逐步播放）：客户端提交后，接口在一个事务里写 job 行和 outbox，返回 jobId 42；Broker 投递只带 jobId 的消息；worker-1 拿租约和 fencing token 7，执行计算、写检查点、带 operationId 发邮件，原子保存结果和 completed 终态；ACK 前断线，消息被重投；worker-2 拿到 token 8，读到 job 已 completed 就直接 ACK，不会再发一次邮件；另一次执行遇到限流错误，先分类再退避重投',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
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

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const client = (sub, tone = 'muted') => k.box({ x: 40, y: 140, w: 140, h: 84, title: '客户端', sub, titleSize: 'body', tone });
  const step = (i, tone) => hl('cur', 680, 140 + i * 62, 240, 52, tone);
  const go = (pts, tone = 'accent') => k.arrow({ points: pts, tone, flow: true });
  const who = (text, tone = 'sec') => k.text({ x: 680, y: 480, text, size: 'label', tone });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 600,
    title: '队列与 Worker：任务记录是事实，消息只是唤醒',
    subtitle: '提交时任务与 outbox 同事务落库；Worker 拿租约执行，副作用和终态落定后才确认消息',
    body: s.join('') + k.note({ x: 40, y: 512, w: 880, h: 52, lead: 'ACK 前断线会重投：', text: '新 Worker 读到 job 已 completed 就直接 ACK，不会再发一次邮件或扣一次款。' }),
    frames: [
      f('客户端提交长任务：接口在一个事务里写 job 行和 outbox 事件，马上返回 jobId 42，之后客户端轮询或订阅进度', [client('jobId 42\nqueued'), hl('cur', 205, 140, 215, 84), go([[180, 182], [205, 182]])]),
      f('relay 把 outbox 发到 Broker：消息里只有 jobId、租户、deadline 和 trace，大 payload 留在对象存储', [client('jobId 42\nqueued'), hl('cur', 445, 140, 210, 84), go([[420, 182], [445, 182]])]),
      f('worker-1 收到消息，先用条件更新拿租约，拿到 fencing token 7', [client('jobId 42\nrunning'), step(0), go([[655, 182], [680, 182]]), who('worker-1 · token 7')]),
      f('执行可重放的计算并在安全点写检查点；发邮件时带上 operationId，供应商那边能去重', [client('jobId 42\nrunning'), step(2), who('worker-1 · token 7')]),
      f('结果、检查点和 completed 终态在一个原子操作里落库', [client('jobId 42\ncompleted', 'ok'), step(3, 'ok'), who('worker-1 · token 7')]),
      f('偏偏在 ACK 之前断线了：Broker 没收到确认，租约到期后把消息重新投递', [client('jobId 42\ncompleted', 'ok'), step(4, 'bad'), hl('mq', 445, 140, 210, 84, 'bad'), who('worker-1 断线，未 ACK', 'bad')]),
      f('worker-2 拿到 token 8，先读 job：已经是 completed，直接 ACK。邮件不会再发一次', [client('jobId 42\ncompleted', 'ok'), step(4, 'ok'), go([[655, 182], [680, 182]]), who('worker-2 · token 8 · 直接 ACK', 'ok')]),
      f('另一种情况：执行时遇到 429 限流。先分类再决定，这类瞬态错误退避加 jitter 后重投，有 Retry-After 就听它的', [client('jobId 43\nretrying', 'warn'), hl('cur', 455, 248, 200, 84), hl('out', 40, 246, 375, 52, 'info'), go([[435, 272], [415, 272]], 'info'), who('worker-3 · 429 限流')]),
    ],
  });
};
