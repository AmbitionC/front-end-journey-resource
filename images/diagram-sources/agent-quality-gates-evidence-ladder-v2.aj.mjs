export const meta = {
  name: 'agent-quality-gates-evidence-ladder-v2',
  article: 'knowledge/llm/production/agent-quality-gates.md',
  alt: 'Agent 发布门禁是一道六级证据阶梯，所有层都读取同一份候选清单（代码镜像、Prompt、模型不可变版本、工具 Schema、权限策略、检索索引）：静态与确定性检查、单元与契约、离线评估、安全评估、Canary 小流量、生产持续验证；越往上越接近生产，证据越真实、成本越高，前层失败不能被后层好成绩抵消；Canary 和生产都保留回滚到上一个已验证版本的路径；每道门的结果分四种：Pass 证据完整且满足策略，Review 样本不足或需要领域判断，Block 确定性规则或安全不变量失败，Error 是评估设施故障，既不算通过也不算失败',
};

export default (k) => {
  const s = [], W = 136, H = 84;
  s.push(k.box({ x: 40, y: 112, w: 560, h: 64, title: '每一层都读同一份候选清单', sub: '代码镜像 · Prompt · 模型不可变版本 · 工具 Schema · 权限 · 索引', titleSize: 'body', tone: 'muted' }));
  const steps = [
    ['静态检查', 'Schema、权限\n依赖签名', 'info'],
    ['单元与契约', '状态机、幂等\n高风险全过', 'info'],
    ['离线评估', '同批任务比基线\n看关键切片', 'info'],
    ['安全评估', '对抗集、注入\n零容忍项', 'warn'],
    ['Canary', '小流量、低风险\n异常自动停', 'accent'],
    ['生产持续验证', 'SLO、漂移\n在线评估', 'accent'],
  ];
  const pos = steps.map((_, i) => [40 + i * 148, 380 - i * 40]);
  steps.forEach(([t, sub, tone], i) => {
    const [x, y] = pos[i];
    s.push(k.box({ x, y, w: W, h: H, title: t, sub, titleSize: 'body', tone, strong: i === 5 }));
  });
  s.push(k.arrow({ points: [[700, 304], [700, 396]], tone: 'bad', dashed: true }));
  s.push(k.arrow({ points: [[848, 264], [848, 396]], tone: 'bad', dashed: true }));
  s.push(k.box({ x: 632, y: 396, w: 284, h: 52, title: '回滚到上一个已验证版本', titleSize: 'label', tone: 'bad' }));

  s.push(k.arrow({ points: [[40, 492], [916, 492]], tone: 'muted' }));
  s.push(k.text({ x: 40, y: 518, text: '快、便宜、离线', size: 'note', tone: 'muted' }));
  s.push(k.text({ x: 916, y: 518, text: '真实流量、证据更贴近生产、更贵', size: 'note', tone: 'muted', anchor: 'end' }));

  [
    ['Pass', '证据完整且满足策略', 'ok'],
    ['Review', '样本不足或需领域判断', 'warn'],
    ['Block', '确定性规则或安全项失败', 'bad'],
    ['Error', '评估设施故障，不算结论', 'muted'],
  ].forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 222, y: 544, w: 210, h: 68, title: t, sub, titleSize: 'body', tone })));

  return k.figure({
    h: 650,
    title: 'Agent 发布门禁：一级级攒证据，任何一级都能拦',
    subtitle: '越往上越接近生产；前层失败不能被后层好成绩抵消，上线后仍要能回滚',
    body: s.join(''),
  });
};
