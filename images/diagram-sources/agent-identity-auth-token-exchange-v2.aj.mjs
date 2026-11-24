export const meta = {
  name: 'agent-identity-auth-token-exchange-v2',
  article: 'knowledge/llm/production/agent-identity-auth.md',
  alt: '用户提出目标，是 subject；Agent 工作负载持有短期工作负载凭证，是 actor，模型本身不接触 token；Agent 用自身身份向授权服务器发起交换请求，声明 subject、actor、目标服务和最小 scope，授权服务器检查用户授权、Agent 角色和风险后签发短期委托 token，里面同时保留 sub 和 act，并绑定 aud、scope 和 exp；Agent 带这个 token 调用目标服务，目标服务先验签名、issuer 和 token 类型，再确认 aud 是自己且未过期、scope 足够，最后按 subject 对具体资源授权以防 confused deputy，批量或不可逆动作还要 step-up 或人工批准；委托不是模拟，审计同时记录 subject 和 actor，子 Agent 要换更窄的 token 而不是转发原 token',
};

export default (k) => {
  const s = [], Y = 112, H = 84;
  const B = [
    [40, 170, '用户', '提出目标\n= subject', 'muted'],
    [250, 210, 'Agent 工作负载', '短期工作负载凭证\n= actor，模型不碰 token', 'info'],
    [500, 190, '授权服务器', '查用户授权、角色\n和风险后签发', 'accent'],
    [730, 190, '目标服务', '先验 token\n再对资源授权', 'info'],
  ];
  B.forEach(([x, w, t, sub, tone]) => s.push(k.box({ x, y: Y, w, h: H, title: t, sub, titleSize: 'body', tone, strong: t === '授权服务器' })));
  s.push(k.arrow({ points: [[210, 154], [250, 154]] }));
  s.push(k.text({ x: 230, y: 144, text: '①', size: 'label', tone: 'muted', anchor: 'middle' }));
  s.push(k.arrow({ points: [[460, 136], [500, 136]] }));
  s.push(k.text({ x: 480, y: 128, text: '②', size: 'label', tone: 'muted', anchor: 'middle' }));
  s.push(k.arrow({ points: [[500, 176], [460, 176]], tone: 'accent' }));
  s.push(k.text({ x: 480, y: 168, text: '③', size: 'label', tone: 'accent', anchor: 'middle' }));
  s.push(k.arrow({ points: [[355, 196], [355, 232], [825, 232], [825, 196]], tone: 'info' }));
  s.push(k.text({ x: 590, y: 254, text: '④ 带短期委托 token 调用', size: 'note', tone: 'info', anchor: 'middle' }));

  s.push(k.panel({ x: 40, y: 274, w: 420, h: 196, label: '③ 签发的短期委托 token' }));
  const rows = [
    ['sub: user_42', '谁的权利'],
    ['act: expense-agent/pod-7', '谁在执行'],
    ['aud: billing-api', '只给这个服务'],
    ['scope: invoice:read', '最小权限'],
    ['exp: 5 分钟', '短期，可撤销'],
  ];
  rows.forEach(([c, d], i) => {
    s.push(k.text({ x: 60, y: 330 + i * 30, text: c, size: 'label', mono: true, tone: i < 2 ? 'accent' : undefined }));
    s.push(k.text({ x: 440, y: 330 + i * 30, text: d, size: 'note', tone: 'muted', anchor: 'end' }));
  });

  s.push(k.panel({ x: 480, y: 274, w: 440, h: 196, label: '⑤ 目标服务按顺序检查' }));
  [
    ['签名、issuer、token 类型', undefined],
    ['aud 是不是我，有没有过期', undefined],
    ['scope 够不够这个动作', undefined],
    ['sub 对这条资源有没有权', 'warn'],
    ['批量、不可逆 → step-up 或人工批准', 'bad'],
  ].forEach(([t, tone], i) => s.push(k.text({ x: 500, y: 330 + i * 30, text: `${i + 1}. ${t}`, size: 'label', tone })));

  return k.figure({
    h: 580,
    title: 'Agent 身份与授权：委托 token 同时记住“谁的”和“谁在做”',
    subtitle: '用户、Agent 工作负载、授权服务器、目标服务各管一段；目标服务不能只看 token 格式对不对',
    body: s.join('') + k.note({ x: 40, y: 494, w: 880, h: 52, lead: '委托不是模拟：', text: '审计同时记 subject 和 actor；子 Agent 换更窄的 token，不转发原 token。' }),
  });
};
