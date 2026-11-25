export const meta = {
  name: 'llm-long-context-working-context-v2',
  article: 'knowledge/llm/basics/llm-long-context.md',
  alt: '长上下文有三个不同的长度，从长到短：声明窗口是接口允许的最大 token 数；可运行长度受显存、KV Cache 和并发约束；有效上下文是模型在具体任务里还能稳定利用的部分。窗口变大解决的是放得进，不解决取得出。因此要装配工作上下文，而不是把窗口塞满：第一步把所有原始材料作为最大上下文，去重并去掉样板；第二步检索证据，保留来源、时间和段落标识；第三步分区，直接证据和背景分开，冲突证据并列呈现；第四步估算预算，输入加期望输出再加安全余量；第五步得到工作上下文，约束固定在前，关键证据放在清晰的位置。模型回答时要引用证据，证据不足就说明；之后校验引用，不命中就回到检索。测试不要只做针测试，要把证据挪到开头、中间、结尾，加入相似干扰和冲突证据，看正确率和引用命中率',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 128, w: 880, h: 40, title: '声明窗口：接口允许的最大 token 数', titleSize: 'label', tone: 'muted' }));
  s.push(k.box({ x: 40, y: 176, w: 660, h: 40, title: '可运行长度：受显存、KV Cache、并发约束', titleSize: 'label', tone: 'info' }));
  s.push(k.box({ x: 40, y: 224, w: 420, h: 40, title: '有效上下文：模型还能稳定利用的部分', titleSize: 'label', tone: 'ok', strong: true }));
  s.push(k.text({ x: 480, y: 250, text: '窗口变大解决「放得进」，不解决「取得出」', size: 'label', tone: 'muted' }));

  s.push(k.text({ x: 40, y: 308, text: '装配工作上下文，而不是塞满窗口', size: 'label', tone: 'muted', weight: 600 }));
  const steps = [
    ['① 最大上下文', '所有原始材料\n去重、去样板', 'muted'],
    ['② 检索证据', '保留来源、时间\n段落标识', 'info'],
    ['③ 分区', '直接证据 / 背景\n冲突证据并列', 'info'],
    ['④ 算预算', '输入 + 期望输出\n+ 安全余量', 'warn'],
    ['⑤ 工作上下文', '约束固定在前\n关键证据放清晰处', 'accent'],
  ];
  steps.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 180;
    s.push(k.box({ x, y: 322, w: 160, h: 84, title: t, sub, titleSize: 'body', tone, strong: i === 4 }));
    if (i < steps.length - 1) s.push(k.arrow({ points: [[x + 160, 364], [x + 180, 364]] }));
  });
  s.push(k.arrow({ points: [[840, 406], [840, 440]] }));
  s.push(k.box({ x: 620, y: 440, w: 300, h: 64, title: '模型回答', sub: '引用证据；证据不足就说明', titleSize: 'body', tone: 'ok' }));
  s.push(k.arrow({ points: [[620, 472], [560, 472]] }));
  s.push(k.box({ x: 300, y: 440, w: 260, h: 64, title: '校验引用', sub: '不命中就回到检索', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[300, 488], [290, 488], [290, 424], [300, 424], [300, 406]], dashed: true, tone: 'warn' }));

  return k.figure({
    h: 620,
    title: '长上下文：能放进去，不等于能用好',
    subtitle: '把最大上下文当原料仓库，每一步只把需要的指令、证据和约束装进工作上下文',
    body: s.join('') + k.note({ x: 40, y: 532, w: 880, h: 52, lead: '别只做针测试：', text: '把证据挪到开头、中间、结尾，再加相似干扰和冲突，看正确率和引用命中率。' }),
  });
};
