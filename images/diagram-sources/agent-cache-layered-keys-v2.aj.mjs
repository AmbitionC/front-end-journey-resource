export const meta = {
  name: 'agent-cache-layered-keys-v2',
  article: 'knowledge/llm/production/agent-cache.md',
  alt: 'Agent 缓存分四层，共用一个 Key Builder。请求先规范化输入、去掉 traceId 这类瞬时字段，再由 Key Builder 加入租户与主体作用域、模型与 revision、Prompt 模板版本、工具 Schema 版本、索引版本与 filters 与 embedding 版本、策略与输出 Schema 版本、locale 与新鲜度等级，计算摘要作为 key。之后分别进入四层缓存：模型缓存只在确定输入下复用，答案含时间敏感事实时要带数据快照或不缓存；工具缓存遵循工具自身的新鲜度，有 ETag 或版本号时用条件请求重新验证；检索缓存绑定索引版本和过滤条件，新索引发布自然换 key；结果缓存绑定工作流、用户上下文和策略，命中后返回前仍要重新检查授权。四层由同一组失效事件驱动：数据变更、策略撤销、工具 Schema、模型与 Prompt、索引和安全事件，按版本或 tag 失效；先发布新的不可变版本让 key 自然切换，关键缓存另设最大 TTL 并周期对账。写操作、支付、发信这类副作用不进缓存，用幂等账本防重复',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 256, w: 150, h: 84, title: '请求', sub: '规范化输入\n去掉 traceId', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[190, 298], [220, 298]] }));
  s.push(k.box({ x: 220, y: 112, w: 240, h: 372, title: 'Key Builder', sub: '租户 + 主体作用域\n模型 + revision\nPrompt 模板 + 版本\n工具 + Schema 版本\n索引 + filters + embedding\n策略 + 输出 Schema 版本\nlocale + 新鲜度等级', titleSize: 'body', tone: 'accent', strong: true }));

  const layers = [
    ['模型缓存', '确定输入才复用\n含时间敏感事实：带快照或不缓存'],
    ['工具缓存', '按工具自己的新鲜度\n有 ETag / 版本就条件请求重验'],
    ['检索缓存', '绑定 indexVersion + filters\n新索引发布，key 自然换掉'],
    ['结果缓存', '绑定工作流、用户上下文和策略\n命中后返回前仍要重查授权'],
  ];
  s.push(`<path d="M 460 298 H 480 M 480 154 V 442" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  s.push(`<path d="M 890 154 V 510" fill="none" stroke="${k.t.faint}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
  layers.forEach(([t, sub], i) => {
    const y = 112 + i * 96;
    s.push(k.arrow({ points: [[480, y + 42], [500, y + 42]] }));
    s.push(k.box({ x: 500, y, w: 360, h: 84, title: t, sub, titleSize: 'body', tone: 'info' }));
    s.push(k.arrow({ points: [[890, y + 42], [860, y + 42]], dashed: true }));
  });

  s.push(k.box({ x: 40, y: 510, w: 880, h: 84, title: '失效事件统一驱动四层（按版本或 tag）', sub: '数据变更 · 策略撤销 · 工具 Schema · 模型 / Prompt · 索引 · 安全事件\n先发布新的不可变版本让 key 自然切换；关键缓存另设最大 TTL 并定期对账', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 700,
    title: 'Agent 缓存：一个 Key Builder，四层不同的复用规则',
    subtitle: '凡是能改变可见内容或行为的版本都进 key；一个 TTL 管不了所有一致性',
    body: s.join('') + k.note({ x: 40, y: 618, w: 880, h: 52, lead: '副作用不进缓存：', text: '写操作、支付、发信靠幂等账本防重复，不能「返回上次响应」冒充执行。' }),
  });
};
