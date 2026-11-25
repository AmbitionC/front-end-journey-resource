export const meta = {
  name: 'prompt-template-design-render-pipeline-v3',
  article: 'knowledge/llm/prompt/prompt-template-design.md',
  alt: 'Prompt 模板的分区与渲染流水线。三类输入分开：固定区域由开发者维护并受版本控制，包括任务、成功标准、输出格式和拒答条件；带类型的变量用枚举、数字和结构表达，比如 language 走白名单、maxBullets 有上限、sourceId 由服务端生成，不允许调用方传入额外的系统指令；不可信正文要限长、带来源并放进分隔区，其中出现的命令都只是数据。变量和正文先过输入 Schema 校验和值域与长度检查，固定区域不用校验，三者在渲染这一步汇合：渲染并按目标格式转义、保证数据不逃出边界，渲染后静态检查（没有 {{ }} 残留、token 不超预算），按供应商适配消息角色、顺序和工具定义，最后发送并记录模板版本与内容哈希。测试要检查最终渲染结果，而不是模板源码。两条边界：转义防止数据破坏模板或标记结构，分隔符帮模型分清任务和文档，但两者都挡不住数据里的恶意自然语言；版本约定是 Patch 只改措辞，Minor 新增向后兼容的可选变量，Major 改变输出 Schema、权限、工具或核心行为，比较快照之外还要跑任务评估。普通用户只提交结构化变量，模板本身只由受信管理员编辑，预览和发布分离',
};

export default (k) => {
  const s = [];
  [
    ['带类型的变量', 'language 走白名单\nmaxBullets 有上限\nsourceId 由服务端生成', 'info'],
    ['不可信正文', '限长、带来源\n放进分隔区\n其中的命令都是数据', 'warn'],
    ['固定区域', '开发者维护，受版本控制\n任务、成功标准、输出格式\n拒答条件', 'accent'],
  ].forEach(([t, sub, tone], i) => {
    s.push(k.box({ x: 40 + i * 300, y: 112, w: 280, h: 112, title: t, sub, titleSize: 'body', tone }));
  });
  s.push(`<path d="M 180 224 V 250 M 480 224 V 250 M 105 250 H 480" fill="none" stroke="${k.t.line}" stroke-width="1.7"/>`);
  s.push(k.arrow({ points: [[105, 250], [105, 276]] }));
  s.push(k.arrow({ points: [[780, 224], [780, 262], [405, 262], [405, 276]], tone: 'accent' }));

  const steps = [
    ['Schema 校验', '输入结构\n对不对'],
    ['值域与长度', '上限、白名单\n限长'],
    ['渲染 + 转义', '数据不逃出\n边界'],
    ['渲染后检查', '无 {{ }} 残留\ntoken 不超预算'],
    ['消息适配', '角色、顺序\n工具定义'],
    ['发送', '记版本\n和内容哈希'],
  ];
  steps.forEach(([t, sub], i) => {
    const x = 40 + i * 150;
    s.push(k.box({ x, y: 276, w: 130, h: 84, title: t, sub, titleSize: 'label', tone: i === 5 ? 'ok' : 'info', strong: i === 2 }));
    if (i < 5) s.push(k.arrow({ points: [[x + 130, 318], [x + 150, 318]] }));
  });
  s.push(k.text({ x: 480, y: 388, text: '测试看最终渲染出的消息，不看模板源码；快照里的时间和 ID 先归一化', size: 'note', anchor: 'middle', tone: 'sec' }));

  s.push(k.box({ x: 40, y: 410, w: 430, h: 112, title: '转义 ≠ 分隔符 ≠ 防注入', sub: '转义：防数据破坏模板结构\n分隔符：帮模型分清任务和文档\n两者都挡不住数据里的恶意自然语言', titleSize: 'body', tone: 'warn' }));
  s.push(k.box({ x: 490, y: 410, w: 430, h: 112, title: '版本约定', sub: 'Patch 改措辞 · Minor 加可选变量\nMajor 改 Schema、权限、工具或核心行为\n比完快照还要跑任务评估', titleSize: 'body', tone: 'info' }));

  return k.figure({
    h: 620,
    title: 'Prompt 模板：分区、校验、渲染、再检查',
    subtitle: '模板只负责把数据变成文本；权限和业务规则仍在 Prompt 之外执行',
    body: s.join('') + k.note({ x: 40, y: 546, w: 880, h: 52, lead: '模板本身不开放：', text: '普通用户只交结构化变量；模板由受信管理员编辑，预览和发布分离。' }),
  });
};
