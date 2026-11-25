export const meta = {
  name: 'agent-api-gateway-pipeline-v2',
  article: 'knowledge/llm/production/agent-api-gateway.md',
  alt: 'Agent Gateway 是所有外部请求进入平台的统一边界，内部按固定顺序处理请求。第一步限制请求大小，拒绝解析歧义；第二步认证，校验令牌签名、受众、有效期和防重放；第三步解析 tenant、principal 和 workload identity；第四步授权，依据资源、动作、主体和策略版本；第五步做配额与成本准入，放在昂贵调用之前；第六步路由，从已批准的后端里选出满足约束的一个；第七步接续 Trace，只转发允许列表里的头。之后请求进入执行平面：模型后端、工具，以及任务服务，长任务由 Gateway 返回 202 和 jobId，状态查询和取消由任务服务承载。响应离开前经过第八步出口检查：Schema、内容、敏感数据和流式边界。下方两点：每次路由决策记录 routeId、policyVersion、modelBundle 和 reason，长对话保持版本粘性；过载时先拒绝新的低优先级工作，用租户桶加操作桶，返回 429 或 503 并带 Retry-After，不在 Gateway 里无限排队',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 220, w: 120, h: 84, title: '客户端', titleSize: 'body', tone: 'muted', strong: true }));
  s.push(k.arrow({ points: [[160, 262], [184, 262]] }));
  s.push(k.text({ x: 184, y: 128, text: 'Agent Gateway：固定流水线，薄而强、无状态', size: 'label', tone: 'muted', weight: 600 }));
  s.push(`<rect x="184" y="140" width="520" height="268" rx="12" fill="none" stroke="${k.t.line}" stroke-width="1.5" stroke-dasharray="6 5"/>`);
  const steps = [
    ['① 限制请求大小，拒绝解析歧义', 'muted'],
    ['② 认证：签名、受众、有效期、防重放', 'info'],
    ['③ 解析 tenant、principal、workload', 'info'],
    ['④ 授权：资源 × 动作 × 主体 × 策略版本', 'accent'],
    ['⑤ 配额与成本准入，在昂贵调用之前', 'warn'],
    ['⑥ 路由：从已批准后端里选满足约束的', 'accent'],
    ['⑦ 接续 Trace，只转发允许列表头', 'muted'],
  ];
  steps.forEach(([t, tone], i) => s.push(k.box({ x: 204, y: 152 + i * 36, w: 480, h: 30, title: t, titleSize: 'label', tone })));
  s.push(k.arrow({ points: [[704, 274], [740, 274]] }));
  s.push(k.text({ x: 740, y: 128, text: '执行平面', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 740, y: 140, w: 180, h: 64, title: '模型后端', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 740, y: 220, w: 180, h: 64, title: '工具', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 740, y: 300, w: 180, h: 108, title: '任务服务', sub: '长任务回 202\n+ jobId；状态\n和取消在这里', titleSize: 'body', tone: 'ok' }));

  s.push(k.arrow({ points: [[830, 408], [830, 450], [704, 450]] }));
  s.push(k.box({ x: 184, y: 426, w: 520, h: 48, title: '⑧ 响应出口：Schema · 内容 · 敏感数据 · 流式边界', titleSize: 'label', tone: 'bad' }));
  s.push(k.arrow({ points: [[184, 450], [100, 450], [100, 304]] }));

  s.push(k.box({ x: 40, y: 500, w: 430, h: 84, title: '路由决策可追溯', sub: 'routeId · policyVersion · modelBundle · reason\n长对话保持版本粘性', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 490, y: 500, w: 430, h: 84, title: '过载先拒新活', sub: '租户桶 + 操作桶；429 / 503 带 Retry-After\n不在 Gateway 里无限排队', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 620,
    title: 'Agent Gateway：统一入口的固定处理顺序',
    subtitle: '认证回答「是谁」，授权回答「能做什么」；任务状态和长任务生命周期留在执行平面',
    body: s.join(''),
  });
};
