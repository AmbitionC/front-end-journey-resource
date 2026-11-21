export const meta = {
  name: 'agent-event-driven-envelope-consumer-dlq-v2',
  article: 'knowledge/llm/agent/agent-event-driven.md',
  alt: '生产者发出带标准信封的事件：event id 标识这一个事实，correlation id 关联同一业务流程，causation id 指向上一条消息；事件进入持久队列，按至少一次交付，可能重复、乱序或迟到；消费者在同一事务里按 source 加 id 去重并用唯一约束挡竞态，比对 expectedVersion 不让迟到的旧版本覆盖，再写投影并标记已处理，结果成为已验证的 observation，由调度器决定是否开启下一轮，而不是直接触发模型；处理失败先分类，暂时性错误退避加 jitter 后重试，永久错误和毒消息进入死信队列，修好根因后用新的 event id 重放并保留原 id 和 correlation',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 132, w: 120, h: 60, title: '生产者', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[160, 162], [190, 162]] }));
  s.push(k.box({ x: 190, y: 112, w: 250, h: 100, title: '事件信封', sub: 'id：这一个事实\ncorrelation：同一流程\ncausation：上一条消息', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[440, 162], [470, 162]] }));
  s.push(k.box({ x: 470, y: 112, w: 180, h: 100, title: '持久队列', sub: '至少一次交付\n会重复、乱序、迟到', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[650, 162], [680, 162]] }));

  s.push(k.frame({ x: 680, y: 112, w: 240, h: 268, label: '消费者：同一事务里' }));
  const C = [
    ['按 source + id 去重', '唯一约束，不先查再写'],
    ['比对 expectedVersion', '迟到的旧版本不覆盖'],
    ['写投影 + 标已处理', null],
  ];
  C.forEach(([t, sub], i) => {
    const y = 148 + i * 76;
    s.push(k.box({ x: 696, y, w: 208, h: sub ? 64 : 48, title: t, sub, titleSize: 'label', tone: 'accent', strong: i === 2 }));
    if (i < 2) s.push(k.arrow({ points: [[800, y + 64], [800, y + 76]], tone: 'accent' }));
  });
  s.push(k.arrow({ points: [[800, 380], [800, 412]], tone: 'ok' }));
  s.push(k.box({ x: 680, y: 412, w: 240, h: 68, title: '已验证 observation', sub: '调度器再决定开不开下一轮', titleSize: 'body', tone: 'ok', strong: true }));

  s.push(k.arrow({ points: [[680, 330], [650, 330]], tone: 'bad' }));
  s.push(k.box({ x: 470, y: 296, w: 180, h: 68, title: '失败先分类', sub: '暂时性 / 永久 / 毒消息', titleSize: 'body', tone: 'bad' }));
  s.push(k.arrow({ points: [[560, 296], [560, 212]], tone: 'warn' }));
  s.push(k.text({ x: 570, y: 260, text: '退避重试', size: 'note', tone: 'warn' }));
  s.push(k.arrow({ points: [[470, 330], [440, 330]], tone: 'bad' }));
  s.push(k.box({ x: 190, y: 296, w: 250, h: 68, title: '死信队列', sub: '永久错误、毒消息', titleSize: 'body', tone: 'bad' }));
  s.push(k.arrow({ points: [[400, 296], [400, 250], [500, 250], [500, 212]], tone: 'muted', dashed: true }));
  s.push(k.text({ x: 190, y: 392, text: '修好根因后用新 event id 重放，保留原 id 和 correlation', size: 'note', tone: 'muted' }));

  return k.figure({
    h: 590,
    title: '事件驱动 Agent：信封、幂等消费与死信',
    subtitle: '工具完成事件不直接触发模型：先进持久队列，经去重、版本和权限检查，写成已验证的 observation',
    body: s.join('') + k.note({ x: 40, y: 504, w: 880, h: 52, lead: '按至少一次设计：', text: '不假设 broker 有 exactly once；外部副作用再加幂等键或对账。' }),
  });
};
