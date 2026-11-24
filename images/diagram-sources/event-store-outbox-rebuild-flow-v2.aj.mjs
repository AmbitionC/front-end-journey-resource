export const meta = {
  name: 'event-store-outbox-rebuild-flow-v2',
  article: 'knowledge/backend/storage/event-store.md',
  alt: '事件存储、事务 outbox、消息投递、幂等投影与重建。命令（如 PlaceOrder）可能失败，通过规则后才产生事件。事件来源有两条：事件溯源系统把事件按聚合追加到事件存储，用 expectedVersion 条件写入，版本冲突就重读再判断；普通 CRUD 系统把业务表和 outbox 行写进同一事务，提交后由 relay 或 CDC 发布。消息投递至少一次，可能重复和乱序，死信要可见。消费者分两类：投影把 checkpoint、已处理 eventId 与读模型写在同一事务；邮件、支付、Webhook 等副作用消费者用 operationId 查幂等账本。重建走隔离的回放通道：从起点回放到新版本投影 orders_v2，追平实时增量，校验行数与业务摘要，再原子切换读别名；副作用消费者默认不接回放通道。快照只是性能优化，坏了要能回到完整事件流',
};

export default (k) => {
  const s = [];
  // 第一行：写入与投递
  s.push(k.box({ x: 40, y: 175, w: 150, h: 84, title: '命令', sub: 'PlaceOrder\n可能被拒绝', titleSize: 'body', tone: 'muted' }));
  s.push(k.box({ x: 240, y: 120, w: 220, h: 84, title: '事件存储', sub: 'expectedVersion 条件追加\n冲突就重读再判', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.box({ x: 240, y: 230, w: 220, h: 84, title: '业务表 + outbox 行', sub: '同一事务提交\nrelay / CDC 再发布', titleSize: 'body', tone: 'accent' }));
  s.push(k.arrow({ points: [[190, 217], [215, 217], [215, 162], [240, 162]] }));
  s.push(k.arrow({ points: [[215, 217], [215, 272], [240, 272]] }));

  s.push(k.box({ x: 510, y: 175, w: 180, h: 84, title: '消息 / 订阅', sub: '至少一次\n可能重复、乱序', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[460, 162], [485, 162], [485, 217], [510, 217]] }));
  s.push(k.arrow({ points: [[460, 272], [485, 272], [485, 217]], head: false }));

  s.push(k.box({ x: 740, y: 120, w: 180, h: 84, title: '投影', sub: 'checkpoint + eventId\n与读模型同事务', titleSize: 'body', tone: 'ok' }));
  s.push(k.box({ x: 740, y: 230, w: 180, h: 84, title: '副作用消费者', sub: '邮件 / 支付 / Webhook\n查 operationId 账本', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[690, 217], [715, 217], [715, 162], [740, 162]] }));
  s.push(k.arrow({ points: [[715, 217], [715, 272], [740, 272]] }));

  // 第二行：重建
  s.push(k.panel({ x: 40, y: 360, w: 880, h: 150, label: '重建：走隔离的回放通道，不清空线上表', tone: 'info' }));
  const steps = [['从起点回放', '事件存储'], ['写新投影', 'orders_v2'], ['追平增量', '接上实时流'], ['校验', '行数 + 业务摘要'], ['原子切换', '读别名指向 v2']];
  steps.forEach(([t, sub], i) => {
    const x = 60 + i * 172;
    s.push(k.box({ x, y: 404, w: 152, h: 64, title: t, sub, titleSize: 'label', tone: i === 4 ? 'ok' : 'info' }));
    if (i < 4) s.push(k.arrow({ points: [[x + 152, 436], [x + 172, 436]] }));
  });
  s.push(k.text({ x: 480, y: 494, text: '副作用消费者默认不接回放通道：重建不能再发一次邮件或再扣一次款', size: 'note', anchor: 'middle', tone: 'bad' }));

  return k.figure({
    h: 640,
    title: '事件存储、outbox 与投影：各管一段',
    subtitle: '事件存储记事实，outbox 保证记录与业务同提交，消息只负责投递，投影要自己幂等',
    body: s.join('') + k.note({ x: 40, y: 540, w: 880, h: 52, lead: '快照只是性能优化：', text: '存状态和最后版本号，之后只重放增量；坏了或过期就回到完整事件流。' }),
  });
};
