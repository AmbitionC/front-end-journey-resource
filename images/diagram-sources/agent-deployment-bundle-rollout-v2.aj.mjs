export const meta = {
  name: 'agent-deployment-bundle-rollout-v2',
  article: 'knowledge/llm/production/agent-deployment.md',
  alt: 'Agent 的发布单元是一个版本化 bundle，包含模型与 routing、Prompt、工具 Schema、策略、检索索引、运行时和评估集，bundle ID 写进每条 trace。发布按五步推进：第一步构建，固定依赖、镜像 digest、生成 SBOM 并签名；第二步离线门，跑单元、安全、回归和任务评测，并与生产基线比较；第三步 Shadow，把脱敏的真实请求复制给候选版本，写工具换成 dry-run，不产生真实副作用；第四步 Canary，小比例真实流量，按会话粘性路由，避免同一会话在两个版本间跳；第五步逐步放量到全量，门槛要在观察窗口内连续满足才放大。每一步都要过质量、安全、延迟、成本和错误率门禁；异常时先 Pause 停止放量，再 Rollback 回旧 bundle，或做 Forward fix。长任务要绑定启动时的 bundle，执行中途不要悄悄换 Prompt 或工具策略；滚动期间新旧版本并存，状态要外置或保持兼容',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 140, w: 220, h: 338, title: 'Versioned Bundle', sub: '模型 + routing\nPrompt\n工具 Schema\n策略\n检索索引\n运行时 + 评估集\n\nbundle ID 写进\n每条 trace', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[260, 309], [290, 309]] }));
  const st = [
    ['① 构建', '固定依赖 · 镜像 digest · SBOM · 签名', 'muted'],
    ['② 离线门', '单元 / 安全 / 回归 / 任务评测，比基线', 'info'],
    ['③ Shadow', '脱敏真实请求，写工具 dry-run', 'info'],
    ['④ Canary', '小比例真实流量，按会话粘性路由', 'warn'],
    ['⑤ 逐步放量到全量', '门槛在观察窗口内连续满足才放大', 'ok'],
  ];
  st.forEach(([t, sub, tone], i) => {
    const y = 140 + i * 70;
    s.push(k.box({ x: 290, y, w: 400, h: 58, title: t, sub, titleSize: 'body', tone }));
    if (i < st.length - 1) s.push(k.arrow({ points: [[490, y + 58], [490, y + 70]] }));
  });
  s.push(`<path d="M 690 169 H 705 M 690 239 H 705 M 690 309 H 705 M 690 379 H 705 M 690 449 H 705 M 705 169 V 449" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  s.push(k.arrow({ points: [[705, 240], [720, 240]] }));
  s.push(k.box({ x: 720, y: 140, w: 200, h: 220, title: '每一步都过门禁', sub: '质量\n安全\n延迟\n成本\n错误率', titleSize: 'body', tone: 'muted', strong: true }));
  s.push(k.arrow({ points: [[820, 360], [820, 376]], tone: 'bad' }));
  s.push(k.box({ x: 720, y: 376, w: 200, h: 102, title: '异常时', sub: '先 Pause 停放量\nRollback 回旧 bundle\n或 Forward fix', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 600,
    title: 'Agent 发布：版本化 bundle，分阶段放量',
    subtitle: '行为由模型、Prompt、工具、策略、索引共同决定，要作为一个可追踪、可回滚的单元发布',
    body: s.join('') + k.note({ x: 40, y: 506, w: 880, h: 52, lead: '长任务绑定 bundle：', text: '执行中途别换 Prompt 或工具策略；滚动期间新旧并存，状态要外置或兼容。' }),
  });
};
