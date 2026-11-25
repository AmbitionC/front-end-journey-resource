export const meta = {
  name: 'llm-error-retry-fallback-ladder-v2',
  article: 'knowledge/llm/dev/llm-error-retry-fallback.md',
  alt: '大模型调用出错时先分类，再决定动作。请求错误不重试，修正请求；身份与权限错误不重试，告警或重新授权；资源与策略问题按策略换能力或安全失败；限流 429 遵守 Retry-After 再试；瞬时 5xx 做有界指数退避加抖动重试；超时或断线时结果未知，先查状态。右边说明重试和降级都在同一个预算里：总 deadline 例如 20 秒，再分给连接 2 秒、首 token 8 秒、空闲 5 秒，每次重试继承同一个绝对 deadline。降级前先过硬门禁：数据能否发往备用供应商、区域是否合规、工具和输出 Schema 是否支持、质量是否达到任务最低线。通过后按顺序降级：同供应商其他健康部署、评测通过的备用模型、关掉非关键功能、返回缓存的安全信息或转为异步，最后清楚地失败并允许稍后重试。左下说明四种 ID 要分开记录：logical_request_id 代表用户一次意图，attempt_id 代表每次网络尝试，tool_operation_id 代表一次外部副作用，provider_request_id 是供应商追踪标识。只保留一层主要重试，网关、服务和 SDK 各自重试会把一次请求按乘法放大成重试风暴',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 130, text: '先分类：谁能修，值不值得重试', size: 'label', tone: 'muted', weight: 600 }));
  const rows = [
    ['请求错误', '不重试，修正请求', 'bad'],
    ['身份与权限', '不重试，告警或重新授权', 'bad'],
    ['资源与策略', '换能力或安全失败', 'warn'],
    ['限流 429', '遵守 Retry-After 再试', 'info'],
    ['瞬时 5xx', '有界退避 + 抖动重试', 'info'],
    ['超时 / 断线', '结果未知：先查状态', 'warn'],
  ];
  rows.forEach(([c, a, tone], i) => {
    const y = 144 + i * 56;
    s.push(k.box({ x: 40, y, w: 170, h: 48, title: c, titleSize: 'body', tone: 'muted', strong: true }));
    s.push(k.arrow({ points: [[210, y + 24], [230, y + 24]] }));
    s.push(k.box({ x: 230, y, w: 250, h: 48, title: a, titleSize: 'label', tone }));
  });
  s.push(k.box({ x: 40, y: 496, w: 440, h: 84, title: '四种 ID 分开记', sub: 'logical_request_id · attempt_id\ntool_operation_id · provider_request_id', titleSize: 'body', tone: 'muted' }));

  s.push(k.text({ x: 520, y: 130, text: '重试和降级都在同一个预算里', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 520, y: 144, w: 400, h: 84, title: '总 deadline，例如 20s', sub: '连接 2s · 首 token 8s · 空闲 5s\n每次重试继承同一个绝对 deadline', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[720, 228], [720, 248]] }));
  s.push(k.box({ x: 520, y: 248, w: 400, h: 84, title: '降级前先过硬门禁', sub: '数据能否发往备用供应商 · 区域合规\n工具、Schema、质量达到最低线', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[720, 332], [720, 352]] }));
  const ladder = ['① 同供应商其他健康部署', '② 评测通过的备用模型', '③ 关掉非关键功能', '④ 缓存的安全信息 / 转异步', '⑤ 清楚失败，允许稍后重试'];
  ladder.forEach((t, i) => s.push(k.box({ x: 520 + i * 12, y: 352 + i * 46, w: 400 - i * 12, h: 38, title: t, titleSize: 'label', tone: i === 4 ? 'bad' : 'info' })));

  return k.figure({
    h: 690,
    title: '大模型调用出错：先分类，再在预算内重试或降级',
    subtitle: '不是所有错误都该重试；可靠性是一条受预算和安全门禁约束的阶梯',
    body: s.join('') + k.note({ x: 40, y: 604, w: 880, h: 52, lead: '只留一层主重试：', text: '网关、服务、SDK 各自重试，会把一次请求按乘法放大成重试风暴。' }),
  });
};
