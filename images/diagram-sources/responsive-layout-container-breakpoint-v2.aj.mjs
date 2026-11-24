export const meta = {
  name: 'responsive-layout-container-breakpoint-v2',
  article: 'knowledge/html-css/css/responsive-layout.md',
  alt: '媒体查询和容器查询各管一层。左侧是一个 viewport：@media 根据视口和媒体特征决定页面结构，比如分几栏、导航怎么排。同一个视口里，主栏容器宽、侧栏容器窄；同一个卡片组件放进两处，用 @container 看自己的父容器宽度：在宽容器里图文横排，在窄容器里图文竖排，而不是猜设备。右侧是四条配套规则：一条轴的内容分配用 Flex，两条轴对齐用 Grid；用 min-inline-size: 0 和 minmax(0, 1fr) 让元素允许缩小、防止长文本撑破；字号和间距用 clamp() 在上下限之间平滑缩放；用 hover 和 pointer 判断输入方式，不用宽度猜是不是触屏。底部提示：断点来自内容失败点，而不是设备名单；连续拖动宽度找溢出，放大到 400% 也不该出现横向滚动，视觉顺序要和 DOM 顺序一致',
};

export default (k) => {
  const s = [];
  s.push(k.frame({ x: 40, y: 112, w: 540, h: 366, label: 'viewport：@media 决定页面分几栏', tone: 'info' }));
  s.push(k.panel({ x: 60, y: 160, w: 330, h: 290, label: '主栏容器（宽）', tone: 'accent' }));
  s.push(k.panel({ x: 410, y: 160, w: 150, h: 290, label: '侧栏容器（窄）', tone: 'accent' }));

  const card = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.t.ok}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
  // 宽：横排
  s.push(card(74, 204, 302, 112));
  s.push(k.box({ x: 86, y: 216, w: 100, h: 88, title: '图片', titleSize: 'label', tone: 'muted' }));
  s.push(k.box({ x: 198, y: 216, w: 166, h: 88, title: '标题', sub: '摘要\n操作按钮', titleSize: 'label', tone: 'ok' }));
  s.push(k.text({ x: 225, y: 346, text: '容器宽 → 图文横排', size: 'label', anchor: 'middle', tone: 'ok', weight: 600 }));
  // 窄：竖排
  s.push(card(420, 204, 130, 176));
  s.push(k.box({ x: 430, y: 214, w: 110, h: 60, title: '图片', titleSize: 'label', tone: 'muted' }));
  s.push(k.box({ x: 430, y: 284, w: 110, h: 86, title: '标题', sub: '摘要\n操作', titleSize: 'label', tone: 'ok' }));
  s.push(k.text({ x: 485, y: 408, text: '容器窄 → 竖排', size: 'label', anchor: 'middle', tone: 'ok', weight: 600 }));
  s.push(k.text({ x: 225, y: 400, text: '同一个卡片组件', size: 'note', anchor: 'middle', tone: 'sec' }));
  s.push(k.text({ x: 225, y: 422, text: '@container 看父容器，不猜设备', size: 'note', anchor: 'middle', tone: 'sec' }));

  [
    ['Flex / Grid', '一条轴分配用 Flex\n两条轴对齐用 Grid'],
    ['允许缩小，防撑破', 'min-inline-size: 0\nminmax(0, 1fr)'],
    ['clamp()', '字号和间距在上下限间\n平滑缩放'],
    ['输入方式', 'hover / pointer 判断\n不用宽度猜触屏'],
  ].forEach(([t, sub], i) => s.push(k.box({ x: 610, y: 112 + i * 94, w: 310, h: 84, title: t, sub, titleSize: 'body', tone: 'info' })));

  return k.figure({
    h: 590,
    title: '响应式布局：页面看视口，组件看容器',
    subtitle: '@media 管页面结构和环境偏好，@container 让可复用组件按自己的可用空间变形',
    body: s.join('') + k.note({ x: 40, y: 504, w: 880, h: 52, lead: '断点来自内容失败点：', text: '连续拖宽度找溢出；放大 400% 也不该横向滚动；视觉顺序跟 DOM 一致。' }),
  });
};
