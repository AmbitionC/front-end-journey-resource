export const meta = {
  name: 'agent-failure-recovery-classify-verify-v3',
  article: 'knowledge/llm/production/agent-failure-recovery.md',
  alt: '先给错误分类：瞬态或限流就有上限地退避重试，参数或计划无效就修参或重新规划，未知或部分副作用先对账、必要时补偿，策略拒绝或永久错误直接停止或升级；前三类连同持久检查点进入继续处理，再由独立验收判断，通过才是已验证结果，失败或证据不足就成为未解决终态，按策略终止或升级',
};

export default (k) => {
  const s = [], R = [136, 220, 304, 388], H = 64;
  s.push(k.text({ x: 40, y: 124, text: '1 先分类', size: 'label', tone: 'muted' }));
  s.push(k.text({ x: 280, y: 124, text: '2 按类别处理', size: 'label', tone: 'muted' }));
  const cls = [
    ['瞬态 / 限流', '超时、429、部分 5xx', 'info', '退避重试', '遵守 Retry-After，有上限'],
    ['参数或计划无效', 'validation', 'info', '修参或重新规划', '修的是语义，不是重试'],
    ['未知 / 部分副作用', 'unknown · partial', 'warn', '先对账', '已提交就读结果，或补偿'],
    ['策略拒绝 / 永久', 'permission · permanent', 'bad', '停止或升级', '不重试'],
  ];
  cls.forEach(([a, as, tone, b, bs], i) => {
    s.push(k.box({ x: 40, y: R[i], w: 200, h: H, title: a, sub: as, tone, titleSize: 'body' }));
    s.push(k.box({ x: 280, y: R[i], w: 200, h: H, title: b, sub: bs, tone: i === 3 ? 'bad' : 'default', titleSize: 'body' }));
    s.push(k.arrow({ points: [[240, R[i] + 32], [280, R[i] + 32]], tone }));
    if (i < 3) s.push(k.arrow({ points: [[480, R[i] + 32], [520, R[i] + 32]] }));
  });

  s.push(k.box({ x: 520, y: R[0], w: 170, h: 232, title: '继续处理', sub: '只做仍必要、\n获准且安全的步骤', tone: 'accent' }));
  s.push(k.box({ x: 520, y: R[3], w: 170, h: H, title: '持久检查点', sub: '计划、operation ID', titleSize: 'body' }));
  s.push(k.arrow({ points: [[605, R[3]], [605, 368]] }));

  s.push(k.arrow({ points: [[690, 252], [730, 252]], tone: 'accent' }));
  s.push(k.box({ x: 730, y: 210, w: 190, h: 84, title: '独立验收', sub: '看外部终态', tone: 'accent', strong: true }));
  s.push(k.box({ x: 730, y: 116, w: 190, h: 52, title: '已验证结果', tone: 'ok', titleSize: 'body' }));
  s.push(k.arrow({ points: [[825, 210], [825, 168]], tone: 'ok', label: '通过', labelAt: [837, 194], labelAnchor: 'start' }));
  s.push(k.box({ x: 730, y: R[3], w: 190, h: H, title: '未解决终态', sub: '按策略终止或升级', tone: 'bad', titleSize: 'body' }));
  s.push(k.arrow({ points: [[825, 294], [825, R[3]]], tone: 'bad', label: '失败或证据不足', labelAt: [813, 346], labelAnchor: 'end' }));

  return k.figure({
    h: 560,
    title: '失败恢复：先分类，恢复以后还要验收',
    subtitle: '类别来自工具适配器映射的稳定错误码，不让模型从错误文案猜能不能重试',
    body: s.join('') + k.note({ x: 40, y: 480, w: 880, h: 52, lead: '修参、补偿、恢复都不等于成功：', text: '重试受总次数和 deadline 限制，每层只占一份预算。' }),
  });
};
