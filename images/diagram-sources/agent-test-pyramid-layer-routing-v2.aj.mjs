export const meta = {
  name: 'agent-test-pyramid-layer-routing-v2',
  article: 'knowledge/llm/production/agent-test-pyramid.md',
  alt: 'Agent 测试金字塔四层：最底层单元与契约测试覆盖 Prompt 构造、Schema、权限、状态机和脱敏，毫秒级、不调模型和网络；工具集成测试用真实协议或高保真替身，注入 429、超时、旧 Schema 等故障；场景测试在沙箱里跑完整 Agent 循环，断言状态和工具轨迹；端到端测试走真实部署链路，数量要少。分配一条测试时从下往上问：不调模型和网络就能确定地证伪的放单元层，只涉及一个外部工具契约的放集成层，需要完整循环和世界状态但不需要生产设施的放场景层，只有跨组件部署、身份和队列才能验证的放端到端层。评估是横向能力，每层都可能用到确定性规则、模型评分器和人工评审，评分器本身也要用标注集校准',
};

export default (k) => {
  const s = [], CX = 250, Y0 = 140, RH = 96;
  const rows = [
    [220, '端到端', '真实部署链路\n数量要少', 'muted', '只有跨组件部署、身份、队列才能验证？'],
    [300, '场景', '完整 Agent 循环 + 沙箱世界\n断言状态和工具轨迹', 'info', '要完整循环和世界状态，不要生产设施？'],
    [380, '工具集成', '真协议或高保真替身\n注入 429、超时、旧 Schema', 'info', '只涉及一个外部工具的契约？'],
    [420, '单元与契约', 'Prompt 构造、Schema、权限、状态机\n毫秒级，不调模型和网络', 'accent', '不调模型、网络就能确定地证伪？'],
  ];
  s.push(k.text({ x: 520, y: 126, text: '分配一条测试：从下往上问，先命中哪层放哪层', size: 'label', tone: 'muted' }));
  rows.forEach(([w, t, sub, tone, q], i) => {
    const y = Y0 + i * RH;
    s.push(k.box({ x: CX - w / 2, y, w, h: 84, title: t, sub, titleSize: 'body', tone, strong: i === 3 }));
    s.push(k.box({ x: 520, y: y + 18, w: 400, h: 48, title: `${4 - i}. ${q}`, titleSize: 'label', tone: 'default', align: 'left' }));
    s.push(k.arrow({ points: [[520, y + 42], [CX + w / 2, y + 42]], tone }));
  });
  s.push(k.box({ x: 40, y: 540, w: 880, h: 68, title: '横向能力：每层都可能需要评估，而不只是断言', sub: '确定性规则 + 模型评分器 + 人工评审；评分器本身也要用人工标注集校准', titleSize: 'body', tone: 'warn', dashed: true }));

  return k.figure({
    h: 640,
    title: 'Agent 测试金字塔：一条测试该放哪一层',
    subtitle: '越往上环境越真实、成本越高、失败越难归因；越往下越快、越隔离、覆盖越广',
    body: s.join(''),
  });
};
