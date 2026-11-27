import still from './event-store-outbox-rebuild-flow-v2.aj.mjs';

export const meta = {
  name: 'event-store-outbox-rebuild-flow-anim',
  article: 'knowledge/backend/storage/event-store.md',
  alt: '事件存储与 outbox 逐步演示（可逐步播放）：PlaceOrder 命令通过规则后，按 expectedVersion 条件追加事件 e-101；CRUD 系统则把业务表和 outbox 行同事务提交，再由 relay 发布；消息至少投递一次，e-101 被投了两次；投影按 eventId 发现第二次是重复，直接跳过；副作用消费者查 operationId 账本，邮件只发一次；重建时从起点回放到新投影 orders_v2，追平增量、校验后原子切换读别名，回放通道不接副作用消费者',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
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

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const ev = (x, text = 'e-101 OrderPlaced', tone = 'info', key = 'ev') => k.keyed(key, k.box({ x, y: 322, w: 180, h: 30, title: text, titleSize: 'note', tone }));
  const go = (pts, tone = 'warn') => k.arrow({ points: pts, tone, flow: true });
  const rebuild = (i, tone = 'warn') => hl('cur', 60 + i * 172, 404, 152, 64, tone);
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 640,
    title: '事件存储、outbox 与投影：各管一段',
    subtitle: '事件存储记事实，outbox 保证记录与业务同提交，消息只负责投递，投影要自己幂等',
    body: s.join('') + k.note({ x: 40, y: 540, w: 880, h: 52, lead: '快照只是性能优化：', text: '存状态和最后版本号，之后只重放增量；坏了或过期就回到完整事件流。' }),
    frames: [
      f('命令 PlaceOrder 进来：先过业务规则，库存不够之类的可能直接被拒，被拒就不产生事件', [hl('cur', 40, 175, 150, 84)]),
      f('事件溯源系统：带 expectedVersion = 4 条件追加 e-101。别人抢先写了版本 5，就重读再判断，不会覆盖', [hl('cur', 240, 120, 220, 84), go([[190, 217], [215, 217], [215, 162], [240, 162]]), ev(260)]),
      f('普通 CRUD 系统走 outbox：订单行和 outbox 行在同一个事务里提交，relay 事后再把 outbox 发出去，不会“库写了消息没发”', [hl('cur', 240, 230, 220, 84), go([[460, 272], [485, 272], [485, 217], [510, 217]]), ev(260, 'outbox 行 e-101')]),
      f('消息系统只保证至少一次：网络抖动后 e-101 被投了两遍，顺序也不保证', [hl('cur', 510, 175, 180, 84), ev(510, 'e-101 ×2（重复）', 'warn')]),
      f('投影第一次处理 e-101：读模型、checkpoint、已处理 eventId 在同一事务写入；第二次来时查到 eventId 已处理，直接跳过', [hl('cur', 740, 120, 180, 84, 'ok'), go([[690, 217], [715, 217], [715, 162], [740, 162]], 'ok'), ev(740, '第 2 次：已处理，跳过', 'ok')]),
      f('发邮件这类副作用消费者：按 operationId 查幂等账本，重复投递也只发一封', [hl('cur', 740, 230, 180, 84), go([[715, 217], [715, 272], [740, 272]]), ev(740, 'op-mail-101 已发过', 'ok')]),
      f('要改读模型结构时重建：开一条隔离的回放通道，从第一条事件开始重放，写进新表 orders_v2，线上表不动', [rebuild(0), hl('nx', 232, 404, 152, 64, 'info')]),
      f('回放追上后接上实时增量，再校验行数和业务摘要：对得上才算重建成功', [rebuild(2), hl('nx', 576, 404, 152, 64, 'info')]),
      f('最后把读别名原子地切到 v2。整个过程副作用消费者没接回放通道：重建不会再发一次邮件或再扣一次款', [rebuild(4, 'ok'), hl('nx', 196, 478, 568, 24, 'bad')]),
    ],
  });
};
