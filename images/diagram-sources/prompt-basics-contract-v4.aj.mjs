export const meta = {
  name: 'prompt-basics-contract-v4',
  article: 'knowledge/llm/prompt/prompt-basics.md',
  alt: '生产 Prompt 是一份可测试的合同。左侧六个组成部分：目标只写本轮的单一任务和验收标准；上下文只给决策所需的事实；输入数据要标明不可信，XML 或代码块分隔符能帮模型分清边界，但不是安全隔离；约束要可观察，并写清信息不足时怎么失败；输出合同优先用原生 schema，让下游程序可以验证；示例是可选的，用来覆盖容易混淆的情况。其中目标和约束是可信指令，上下文和输入是数据，输出合同面向下游。右侧是迭代方法：用真实样本跑一遍，先把失败分类，再只改对应的一处并回归。任务理解错就查目标是否唯一、术语是否定义；遗漏事实查上下文有没有、是否被截断；输出不可解析查有没有用原生 schema；过度猜测查是否定义了缺失值和证据要求；工具误用查工具描述、权限和应用层校验；某类输入退化查测试集覆盖、示例分布和顺序。修改要连同模型版本、参数、检索和工具变更一起记录。提示注入方面，分隔符和角色声明只能降低混淆，还需要最小权限、服务器端鉴权和参数校验',
};

export default (k) => {
  const s = [];
  const parts = [
    ['① 目标', '单一任务，写明验收标准', 'accent', false],
    ['② 上下文', '只给决策所需的事实', 'info', false],
    ['③ 输入数据', '标为不可信；分隔符不是安全隔离', 'warn', false],
    ['④ 约束', '可观察；信息不足时怎么失败', 'accent', false],
    ['⑤ 输出合同', '原生 schema，下游可以验证', 'ok', false],
    ['⑥ 示例（可选）', '覆盖容易混淆的情况', 'muted', true],
  ];
  parts.forEach(([t, sub, tone, dashed], i) => s.push(k.box({ x: 40, y: 112 + i * 64, w: 420, h: 56, title: t, sub, titleSize: 'label', tone, dashed })));

  s.push(k.panel({ x: 490, y: 112, w: 430, h: 376, label: '失败先分类，再只改对应的一处', tone: 'info' }));
  [
    ['任务理解错', '目标是否唯一、术语是否定义'],
    ['遗漏事实', '上下文有没有、是否被截断'],
    ['输出不可解析', '有没有用原生 schema'],
    ['过度猜测', '是否定义缺失值和证据要求'],
    ['工具误用', '工具描述、权限、应用层校验'],
    ['某类输入退化', '测试集覆盖、示例分布和顺序'],
  ].forEach(([f, c], i) => {
    const y = 180 + i * 44;
    s.push(k.text({ x: 510, y, text: f, size: 'label', weight: 600 }));
    s.push(k.text({ x: 640, y, text: c, size: 'note', tone: 'sec' }));
  });
  s.push(k.text({ x: 705, y: 448, text: '真实样本 → 分类 → 改一处 → 回归', size: 'label', anchor: 'middle', tone: 'ok', weight: 600 }));
  s.push(k.text({ x: 705, y: 472, text: '连同模型版本、参数、检索、工具一起记录', size: 'note', anchor: 'middle', tone: 'muted' }));

  return k.figure({
    h: 600,
    title: 'Prompt 是合同：写清、可验、可回归',
    subtitle: '目标和约束是可信指令，上下文和输入是数据，输出合同给下游程序验证',
    body: s.join('') + k.note({ x: 40, y: 512, w: 880, h: 52, lead: '提示注入：', text: '分隔符和角色声明只能降低混淆；还要最小权限、服务器端鉴权和参数校验。' }),
  });
};
