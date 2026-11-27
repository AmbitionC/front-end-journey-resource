import still from './llm-error-retry-fallback-ladder-v2.aj.mjs';

export const meta = {
  name: 'llm-error-retry-fallback-ladder-anim',
  article: 'knowledge/llm/dev/llm-error-retry-fallback.md',
  alt: '大模型调用出错的处理顺序（可逐步播放）：400 请求错误不重试，直接修请求；429 限流按 Retry-After 等待后再试；5xx 做有界退避加抖动重试，每次重试一个新 attempt_id、共用同一个绝对 deadline；超时结果未知，先按 tool_operation_id 查状态；重试用完后先过降级硬门禁，再沿阶梯降级：同供应商其他部署不可用，换到评测通过的备用模型成功；全都不行时清楚失败；四种 ID 分开记录，只留一层主重试',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
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

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const row = (i, tone) => hl('row', 40, 144 + i * 56, 440, 48, tone);
  const lad = (i, tone) => hl('lad', 520 + i * 12, 352 + i * 46, 400 - i * 12, 38, tone);
  const budget = (tone = 'accent') => hl('budget', 520, 144, 400, 84, tone);
  const gate = (tone = 'warn') => hl('gate', 520, 248, 400, 84, tone);
  const ids = (tone = 'info') => hl('ids', 40, 496, 440, 84, tone);
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 690,
    title: '大模型调用出错：先分类，再在预算内重试或降级',
    subtitle: '不是所有错误都该重试；可靠性是一条受预算和安全门禁约束的阶梯',
    body: s.join('') + k.note({ x: 40, y: 604, w: 880, h: 52, lead: '只留一层主重试：', text: '网关、服务、SDK 各自重试，会把一次请求按乘法放大成重试风暴。' }),
    frames: [
      f('请求一进来就定一个总 deadline，比如 20 秒；后面的每次重试和降级都从这同一个预算里扣', [budget()]),
      f('返回 400：请求本身有问题，重试多少次结果都一样。不重试，修正请求', [row(0, 'bad'), budget('muted')]),
      f('返回 429：被限流了。按响应里的 Retry-After 等够时间再试，不要立刻重打', [row(3, 'info'), budget()]),
      f('返回 503：瞬时故障，有界指数退避加随机抖动再试。每次尝试一个新 attempt_id，但继承同一个绝对 deadline', [row(4, 'info'), budget('warn'), ids()]),
      f('第三次超时了：结果未知，可能已经生成、甚至已经调了工具。先按 tool_operation_id 查状态，别盲目再发', [row(5, 'warn'), budget('bad'), ids('warn')]),
      f('重试预算花完，准备降级：先过硬门禁，数据能不能发给备用供应商、区域合不合规、Schema 和质量够不够', [gate()]),
      f('门禁通过，沿阶梯往下走：同供应商的其他部署也不健康，跳过', [gate('ok'), lad(0, 'bad')]),
      f('换到评测通过的备用模型：调用成功，在剩余预算内返回结果', [gate('ok'), lad(1, 'ok')]),
      f('要是备用模型也不行，就继续关掉非关键功能、返回缓存或转异步；都不行时清楚地失败，让用户稍后重试', [lad(4, 'bad')]),
    ],
  });
};
