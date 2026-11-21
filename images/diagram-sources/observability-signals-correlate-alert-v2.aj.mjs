export const meta = {
  name: 'observability-signals-correlate-alert-v2',
  article: 'knowledge/backend/devops/logging-monitoring.md',
  alt: '一次用户请求同时产生 trace span、结构化日志和 RED 指标；日志和 trace 按 trace_id 关联，指标只带 service、version、route 这类有界标签；指标算出 SLI，与 SLO 允许的坏事件比例相除得到燃烧速率并触发告警，告警再回溯到同一服务、同一时段的 trace，再按 trace_id 读日志；user_id、session_id、原始 URL、IP、trace_id 这类高基数字段不能做指标标签',
};

export default (k) => {
  const s = [], Y = [120, 248, 376], H = 92;
  s.push(k.box({ x: 40, y: 270, w: 120, h: 48, title: '用户请求', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[160, 294], [180, 294]], head: false }));
  s.push(k.arrow({ points: [[180, Y[0] + 46], [180, Y[2] + 46]], head: false }));
  for (const y of Y) s.push(k.arrow({ points: [[180, y + 46], [204, y + 46]] }));

  s.push(k.box({ x: 204, y: Y[0], w: 296, h: H, title: 'Trace spans', sub: 'trace_id、span_id、parent\n跨服务调用树', tone: 'info' }));
  s.push(k.box({ x: 204, y: Y[1], w: 296, h: H, title: '结构化日志', sub: 'level、msg、trace_id\nservice、version', tone: 'info' }));
  s.push(k.box({ x: 204, y: Y[2], w: 296, h: H, title: 'RED 指标', sub: '请求率、错误率、耗时\n标签只用 service、version、route', tone: 'accent' }));
  s.push(k.arrow({ points: [[300, Y[0] + H], [300, Y[1]]], tone: 'info', both: true, label: '按 trace_id 关联', labelAt: [312, Y[1] - 12], labelAnchor: 'start' }));

  s.push(k.box({ x: 580, y: Y[2], w: 340, h: H, title: 'SLI → SLO', sub: '燃烧速率 = 实际坏事件比例\n÷ SLO 允许的坏事件比例', tone: 'accent' }));
  s.push(k.arrow({ points: [[500, Y[2] + 46], [580, Y[2] + 46]], tone: 'accent' }));
  s.push(k.box({ x: 580, y: Y[1], w: 340, h: H, title: '燃烧速率告警', sub: '多窗口评估，阈值按业务 SLO 校准', tone: 'warn' }));
  s.push(k.arrow({ points: [[750, Y[2]], [750, Y[1] + H]], tone: 'accent' }));
  s.push(k.arrow({ points: [[750, Y[1]], [750, Y[0] + 46], [500, Y[0] + 46]], tone: 'warn', label: '回溯到同服务、同时段的 trace', labelAt: [625, Y[0] + 36] }));

  s.push(k.box({ x: 40, y: 500, w: 880, h: 56, title: '高基数字段不做指标标签：user_id、session_id、原始 URL、IP、trace_id 放进日志和 trace', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 590,
    title: '可观测性：三类信号靠关联键连起来，告警能回溯',
    subtitle: '排障路径：指标告警发现问题 → 回溯到 trace 找慢或错的 span → 按 trace_id 读详细日志',
    body: s.join(''),
  });
};
