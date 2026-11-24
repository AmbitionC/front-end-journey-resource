export const meta = {
  name: 'agent-markdown-code-ui-safe-render-pipeline-v2',
  article: 'knowledge/frontend/agent-ui/agent-markdown-code-ui.md',
  alt: 'Agent 输出的安全渲染管线：parse、policy、sanitize、render。模型输出是不可信输入，先交给 CommonMark 解析器生成 AST，而不是用正则替换；AST 节点带稳定 ID；节点策略按类型执行白名单，允许段落、列表、表格和代码，拒绝原始 HTML。之后分四条线处理：代码块当文本渲染，复制按钮复制原始代码，运行代码只能进 sandbox 并经用户审批，不能在页面 origin 里 eval；Mermaid 图表用 strict 安全级别，禁用 HTML 标签和点击回调，限制节点数和布局时间，失败时显示原文；链接和图片用标准 URL API 比较规范化 host，禁止 javascript: 和 data:text/html 等协议，远程图片默认点击加载或经受控代理；原始 HTML 尽量不进 innerHTML，确实需要时在写 DOM 前用 sanitizer 白名单，并加 CSP 和 Trusted Types 做纵深防御。最终目标：无论模型输出什么文本，都拿不到应用脚本、会话凭据或任意网络能力。流式输出时，已完成的 block 固化，只重新解析最后一个未完成的 block，高亮和图表等 fence 结束后再异步渲染',
};

export default (k) => {
  const s = [];
  const top = [
    ['模型输出', '不可信输入', 'bad'],
    ['Markdown 解析器', 'CommonMark，不用正则', 'info'],
    ['AST', '节点带稳定 ID', 'info'],
    ['节点策略', '按类型白名单\n拒绝原始 HTML', 'accent'],
  ];
  top.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 230;
    s.push(k.box({ x, y: 116, w: 200, h: 84, title: t, sub, titleSize: 'body', tone, strong: i === 3 }));
    if (i < 3) s.push(k.arrow({ points: [[x + 200, 158], [x + 230, 158]] }));
  });

  // 分发总线
  const lanesX = [40, 270, 500, 730];
  s.push(`<path d="M 830 200 V 228 M 140 228 H 830" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  lanesX.forEach((x) => s.push(k.arrow({ points: [[x + 100, 228], [x + 100, 252]] })));
  const lanes = [
    ['代码块', '当文本渲染，不当 HTML\n复制原始代码\n运行只进 sandbox + 审批', 'accent'],
    ['Mermaid 图表', 'strict 模式，禁 HTML 标签\n限节点数和布局时间\n失败就显示原文', 'accent'],
    ['链接与图片', '标准 URL API 比 host\n禁 javascript: 等协议\n远程图默认点击加载', 'warn'],
    ['确需子集 HTML', '尽量不进 innerHTML\n确需时 sanitizer 白名单\n加 CSP / Trusted Types', 'bad'],
  ];
  lanes.forEach(([t, sub, tone], i) => s.push(k.box({ x: lanesX[i], y: 252, w: 200, h: 112, title: t, sub, titleSize: 'body', tone })));
  s.push(`<path d="M 140 364 V 392 M 370 364 V 392 M 600 364 V 392 M 830 364 V 392 M 140 392 H 830" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  s.push(k.arrow({ points: [[480, 392], [480, 418]] }));
  s.push(k.box({ x: 40, y: 418, w: 880, h: 56, title: '安全 DOM：无论模型写什么，都拿不到应用脚本、会话凭据或任意网络能力', titleSize: 'body', tone: 'ok', strong: true }));

  return k.figure({
    h: 580,
    title: 'Agent 输出渲染：parse → policy → sanitize → render',
    subtitle: 'Markdown、代码高亮和图表各是一条信任边界；代码只展示不执行，执行是另一种能力',
    body: s.join('') + k.note({ x: 40, y: 498, w: 880, h: 52, lead: '流式输出：', text: '已完成的 block 固化，只重解析最后一个；高亮和图表等 fence 结束再异步渲染。' }),
  });
};
