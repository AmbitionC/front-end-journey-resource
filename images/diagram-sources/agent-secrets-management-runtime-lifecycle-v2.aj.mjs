export const meta = {
  name: 'agent-secrets-management-runtime-lifecycle-v2',
  article: 'knowledge/llm/production/agent-secrets-management.md',
  alt: 'Agent 密钥管理分运行时和生命周期两部分。运行时：Agent 规划层只看到已授权的能力，看不到秘密值；安全 SDK 在真正发请求时才用工作负载身份向 Secret Manager 申请凭证，Secret Manager 认证身份后签发几分钟有效、绑定 audience 和 scope 的短期凭证；SDK 只把它发给绑定的目标服务，目标服务拒收发给别人的 token。秘密值永不出现在 Prompt、工具参数和结果、日志、Trace、错误信息里，也尽量不放环境变量。生命周期依次是 Create 随机生成、Store 加密托管、Issue 短期签发、Deliver 经 TLS 拉取、Use 用完即清、Rotate 发新版本、Revoke 让旧的失效、Destroy 清除材料；Audit 贯穿全程，记录谁读了哪个秘密 ID 和版本、目的、受众和 Run，但不记录值。Rotate、Revoke、Destroy 含义不同：Rotate 发行替代凭证并留重叠窗口，Revoke 让旧凭证失效，Destroy 清除材料和可恢复副本',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 132, text: '运行时：Agent 用能力，不碰秘密值', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 40, y: 146, w: 200, h: 84, title: 'Agent 规划层', sub: '只看到「已授权能力」\n看不到秘密值', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[240, 188], [290, 188]] }));
  s.push(k.box({ x: 290, y: 146, w: 220, h: 84, title: '安全 SDK', sub: '真正发请求时才取 token\n只发给绑定的 audience', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[400, 230], [400, 270]], both: true }));
  s.push(k.box({ x: 290, y: 270, w: 220, h: 84, title: 'Secret Manager', sub: '认证工作负载身份\n签发几分钟有效的凭证', titleSize: 'body', tone: 'ok' }));
  s.push(k.arrow({ points: [[510, 188], [560, 188]] }));
  s.push(k.box({ x: 560, y: 146, w: 180, h: 84, title: '目标服务', sub: '只收发给自己的 token\n（audience 校验）', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 770, y: 146, w: 150, h: 208, title: '值永不出现在', sub: 'Prompt\n工具参数 / 结果\n日志 · Trace\n错误信息\n环境变量（尽量）', titleSize: 'body', tone: 'bad', dashed: true }));

  s.push(k.text({ x: 40, y: 390, text: '生命周期：每一步都留审计，不留值', size: 'label', tone: 'muted', weight: 600 }));
  const steps = [
    ['Create', '随机生成'], ['Store', '加密托管'], ['Issue', '短期签发'], ['Deliver', 'TLS 拉取'],
    ['Use', '用完即清'], ['Rotate', '发新版本'], ['Revoke', '旧的失效'], ['Destroy', '清除材料'],
  ];
  steps.forEach(([t, sub], i) => {
    const x = 40 + i * 111;
    s.push(k.box({ x, y: 404, w: 98, h: 64, title: t, sub, titleSize: 'label', tone: i >= 5 ? 'warn' : 'info' }));
    if (i < steps.length - 1) s.push(k.arrow({ points: [[x + 98, 436], [x + 111, 436]] }));
  });
  s.push(k.box({ x: 40, y: 488, w: 880, h: 56, title: 'Audit 贯穿全程：谁读了哪个秘密 ID / 版本、目的、受众、Run，不记值', titleSize: 'body', tone: 'muted', strong: true }));

  return k.figure({
    h: 660,
    title: 'Agent 密钥：身份换短期凭证，值只活在 SDK 里',
    subtitle: '上半是一次调用怎么拿到凭证，下半是一个秘密从生成到销毁的完整生命周期',
    body: s.join('') + k.note({ x: 40, y: 566, w: 880, h: 52, lead: '三者别混：', text: 'Rotate 发行替代凭证并留重叠窗口；Revoke 让旧凭证失效；Destroy 清除材料和可恢复副本。' }),
  });
};
