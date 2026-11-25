export const meta = {
  name: 'frontend-state-ownership-v2',
  article: 'knowledge/fe/design/design-state.md',
  alt: '前端状态先按所有权分六类，每类写明例子、放在哪里、怎样同步。URL state 是筛选、分页这类可分享、可书签的状态，放在路由和 query string，前进后退自然同步。local UI state 是焦点、展开、弹窗，放在最近的组件里，不外传。form draft 是未提交的输入、dirty 和校验，由表单 owner 管理，提交后才进入服务端。client domain state 是只在客户端存在的跨组件流程，放 Context 或 store 并按变化频率拆分，通过事件和 selector 同步。server state 是远端实体的客户端副本，放 query cache，key 要包含请求参数和身份边界，按 stale、invalidate、refetch 管理新鲜度。external state 是浏览器 API、WebSocket 和第三方组件，经订阅适配层接入，卸载时清理。派生值不存第二份：fullName、过滤后列表、总价、完成数都是从单一真相源算出的 selector，昂贵时可以 memo，但 memo 不拥有真相。状态放在能覆盖所有消费者的最低 owner，只有跨远距离组件时才提升；全局不等于持久化，持久化也不等于权威',
};

export default (k) => {
  const s = [];
  [['状态', 40], ['例子', 220], ['放在哪', 490], ['怎么同步', 710]].forEach(([t, x]) => s.push(k.text({ x, y: 136, text: t, size: 'label', tone: 'muted', weight: 600 })));
  const rows = [
    ['URL state', '筛选、分页：可分享、可书签', '路由 / query string', '前进后退自然同步', 'info'],
    ['local UI', '焦点、展开、弹窗', '最近的组件', '不外传', 'muted'],
    ['form draft', '未提交输入、dirty、校验', '表单 owner', '提交后才进服务端', 'muted'],
    ['client domain', '只在客户端的跨组件流程', 'Context / store\n按变化频率拆分', '事件 + selector', 'accent'],
    ['server state', '远端实体的客户端副本', 'query cache\nkey 含参数和身份', 'stale → invalidate\n→ refetch', 'ok'],
    ['external', '浏览器 API、WebSocket', '订阅适配层', '卸载时清理订阅', 'warn'],
  ];
  rows.forEach(([n, ex, at, sync, tone], i) => {
    const y = 150 + i * 62;
    s.push(k.box({ x: 40, y, w: 165, h: 54, title: n, titleSize: 'body', tone }));
    s.push(k.box({ x: 220, y, w: 255, h: 54, title: ex, titleSize: 'label', tone: 'muted' }));
    s.push(k.box({ x: 490, y, w: 205, h: 54, title: at, titleSize: 'label', tone: 'muted', strong: true }));
    s.push(k.box({ x: 710, y, w: 210, h: 54, title: sync, titleSize: 'label', tone: 'muted' }));
  });
  s.push(k.box({ x: 40, y: 534, w: 880, h: 84, title: '派生值不存第二份', sub: 'fullName、过滤后列表、总价、完成数都是 selector，从单一真相源算出来\n计算昂贵可以 memo，但 memo 不拥有真相', titleSize: 'body', tone: 'accent', strong: true }));

  return k.figure({
    h: 730,
    title: '前端状态：先分清谁是 owner，再选库',
    subtitle: '每类状态有自己的真相源和生命周期；靠事件和失效规则同步，而不是互相复制',
    body: s.join('') + k.note({ x: 40, y: 640, w: 880, h: 52, lead: '全局 ≠ 持久化 ≠ 权威：', text: '状态放在能覆盖所有消费者的最低 owner，跨远距离组件才提升。' }),
  });
};
