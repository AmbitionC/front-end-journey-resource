export const meta = {
  name: 'agent-model-fallback-decision-v2',
  article: 'knowledge/llm/production/agent-model-fallback.md',
  alt: '主模型失败后按顺序判断要不要切到备用模型。第一问：错误是否短暂、调用尚未提交、deadline 还够，是的话在同一模型上有限重试。第二问：主依赖的断路器是否已经打开，是的话跳过重试，直接看备用模型。第三问：备用模型是否通过能力、地区、数据和安全策略，否则显式失败。第四问：输入能否适配备用模型的上下文和 Schema 而不丢关键约束，否则显式失败或请用户缩小范围。第五问：该任务的评测是否达到质量底线，底线是绝对值，否则显式失败。第六问：切换是否会重复工具调用或外部副作用，是的话停下来先对账。全部通过才切到备用模型，并记录降级原因、bundle 版本，给用户可见的降级标识。降级链要短：primary、已批准的备用、异步或人工，请求带 routeHistory，禁止两个模型互相 fallback。恢复要防抖：Half-Open 探测通过后逐步放量，设置最小稳定窗口，避免在主备之间来回振荡。断路器按 provider、model、region、operation 的组合拆分，一个接口失败不拖垮全部模型',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 136, text: '主模型失败后，按顺序问', size: 'label', tone: 'muted', weight: 600 }));
  const rows = [
    ['① 错误短暂、调用未提交、deadline 还够？', '是 → 同一模型有限重试', 'info'],
    ['② 主依赖的断路器已经打开？', '是 → 跳过重试，直接看备用', 'warn'],
    ['③ 备用模型过能力、地区、数据、安全策略？', '否 → 显式失败', 'bad'],
    ['④ 输入能适配上下文和 Schema，不丢约束？', '否 → 显式失败或请用户缩小范围', 'bad'],
    ['⑤ 这个任务的评测达到质量底线（绝对值）？', '否 → 显式失败', 'bad'],
    ['⑥ 切换会重复工具调用或外部副作用？', '是 → 停下来先对账', 'warn'],
  ];
  rows.forEach(([q, out, tone], i) => {
    const y = 150 + i * 60;
    s.push(k.box({ x: 40, y, w: 500, h: 48, title: q, titleSize: 'label', tone: 'muted', strong: true }));
    s.push(k.arrow({ points: [[540, y + 24], [580, y + 24]], tone }));
    s.push(k.box({ x: 580, y, w: 340, h: 48, title: out, titleSize: 'label', tone }));
  });
  s.push(k.arrow({ points: [[290, 498], [290, 518]], tone: 'ok' }));
  s.push(k.box({ x: 40, y: 518, w: 880, h: 52, title: '全部通过 → 切到备用模型：记录降级原因和 bundle 版本，给用户可见的降级标识', titleSize: 'label', tone: 'ok', strong: true }));

  s.push(k.box({ x: 40, y: 594, w: 430, h: 84, title: '降级链要短', sub: 'primary → 已批准的备用 → 异步 / 人工\n带 routeHistory，禁止 A、B 互相 fallback', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 490, y: 594, w: 430, h: 84, title: '恢复要防抖', sub: 'Half-Open 探测通过后逐步放量\n设最小稳定窗口，避免主备来回振荡', titleSize: 'body', tone: 'accent' }));

  return k.figure({
    h: 790,
    title: '模型 Fallback：先过门禁，再换模型',
    subtitle: '熔断负责停止调用故障依赖；Fallback 要在能力、策略和质量约束内挑替代，两者不是一回事',
    body: s.join('') + k.note({ x: 40, y: 702, w: 880, h: 52, lead: '断路器按维度拆：', text: 'provider × model × region × operation，一个接口失败不拖垮全部模型。' }),
  });
};
