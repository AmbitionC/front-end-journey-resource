export const meta = {
  name: 'agent-guardrails-five-boundaries-v2',
  article: 'knowledge/llm/production/agent-guardrails.md',
  alt: 'Agent Guardrails 分布在五个边界上，按请求经过的顺序排列。输入边界检查长度、编码、文件类型和 schema，把外部网页、邮件、文档标记为 untrusted。模型决策边界：模型只提出 action proposal，由受信任的 orchestrator 校验后才执行。工具调用边界依次检查工具 allowlist、参数 schema、授权、风险审批、速率与预算、幂等键和沙箱。工具结果边界：返回同样不可信，要做 schema、大小和恶意文件检查，不能拼回 system prompt，声称写入成功时要回读权威状态核实。最终输出边界检查泄密、个人信息、越权内容和引用证据，按渠道转义，被拦截时给安全替代。右侧说明四种控制互补、谁也替不了谁：Guardrail 判断内容和行为是否合规，权限模型决定主体有没有权，沙箱限制获权后能碰到什么，人工审批把高影响决定交还给人。观测覆盖全链路，每个 guardrail 返回 pass、block 或 review，以及规则 ID、版本和理由码。Block 在副作用发生前阻断，Alert 只负责发现和响应，不能代替预防控制',
};

export default (k) => {
  const s = [];
  const rows = [
    ['1 输入', '长度 · 编码 · 文件类型 · schema\n网页 / 邮件 / 文档标成 untrusted'],
    ['2 模型决策', '模型只提 action proposal\n受信任的 orchestrator 校验后才执行'],
    ['3 工具调用', 'allowlist → 参数 schema → 授权 → 审批\n→ 速率 / 预算 → 幂等键 → 沙箱'],
    ['4 工具结果', '同样不可信：schema · 大小 · 恶意文件\n不拼回 system prompt；写入成功要回读'],
    ['5 最终输出', '泄密 · 个人信息 · 越权 · 引用证据\n按渠道转义；被拦截时给安全替代'],
  ];
  s.push(k.text({ x: 40, y: 130, text: '按请求经过的顺序', size: 'label', tone: 'muted', weight: 600 }));
  rows.forEach(([t, c], i) => {
    const y = 144 + i * 80;
    s.push(k.box({ x: 40, y, w: 190, h: 66, title: t, titleSize: 'body', tone: i === 2 ? 'warn' : 'accent' }));
    s.push(k.box({ x: 250, y, w: 440, h: 66, title: c, titleSize: 'label', tone: 'muted' }));
    if (i < rows.length - 1) s.push(k.arrow({ points: [[135, y + 66], [135, y + 80]] }));
  });

  s.push(k.text({ x: 720, y: 130, text: '四者互补，谁也替不了谁', size: 'label', tone: 'muted', weight: 600 }));
  const four = [
    ['Guardrail', '判内容和行为合不合规', 'accent'],
    ['权限模型', '决定主体有没有权', 'info'],
    ['沙箱', '限制获权后能碰到什么', 'info'],
    ['人工审批', '高影响决定交还给人', 'warn'],
  ];
  four.forEach(([t, sub, tone], j) => s.push(k.box({ x: 720, y: 144 + j * 98, w: 200, h: 84, title: t, sub, titleSize: 'body', tone })));

  s.push(k.box({ x: 40, y: 554, w: 880, h: 56, title: '观测覆盖全链路：每个 guardrail 返回 pass / block / review + 规则 ID + 版本 + 理由码', titleSize: 'label', tone: 'muted', strong: true }));

  return k.figure({
    h: 720,
    title: 'Agent Guardrails：五个边界，各管一段',
    subtitle: '没有哪一个过滤器能单独证明安全；控制要分布在输入、决策、工具、结果和输出上',
    body: s.join('') + k.note({ x: 40, y: 632, w: 880, h: 52, lead: 'Block 与 Alert 不同：', text: 'Block 在副作用发生前阻断；Alert 只负责发现和响应，替代不了预防控制。' }),
  });
};
