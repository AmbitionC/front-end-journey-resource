export const meta = {
  name: 'aigc-frontend-gate-six-scenarios-v4',
  article: 'knowledge/fe/aigc/aigc-frontend.md',
  alt: '先用三个问题判断是否值得用大模型：输入是自然语言、图片等非结构化内容，输出允许概率性且能被验证，错误能被发现、纠正或回退；不满足时让确定性代码做最终决策。六类可落地场景：对话问答与检索，前端要做流式、引用、停止和“不知道”，风险是流畅不等于事实；内容生成与编辑，让用户控制参数，结果可比较可编辑，风险是版权和事实；结构化工作流，用 Schema 约束后放进可编辑表单确认再提交，风险是结构对不等于字段对；多模态理解，告诉用户模型实际收到了什么，风险是小字丢失和隐私；实时语音与翻译，用 WebRTC 处理打断、静音和连接状态，风险是端到端延迟；工具与自动化，模型提议、应用执行，高风险写入要二次确认，风险是越权和不可逆',
};

export default (k) => {
  const s = [];
  [
    ['输入非结构化', '规则写起来成本高'],
    ['输出允许概率性', '且能被验证'],
    ['错误能发现', '纠正或回退'],
  ].forEach(([t, sub], i) => {
    s.push(k.box({ x: 40 + i * 200, y: 112, w: 184, h: 64, title: `${i + 1}. ${t}`, sub, titleSize: 'label', tone: 'accent' }));
  });
  s.push(k.box({ x: 640, y: 112, w: 280, h: 64, title: '任一不满足 → 确定性代码决策', sub: '付款、删除、法律承诺不交给模型', titleSize: 'label', tone: 'bad', dashed: true }));
  s.push(k.text({ x: 40, y: 206, text: '三问都满足，再看落在哪类场景：', size: 'label', tone: 'muted' }));

  const C = [
    ['对话问答与检索', '流式、引用、停止\n重新生成、“不知道”', '流畅不等于事实'],
    ['内容生成与编辑', '用户控制受众、语气\n结果可比较、可编辑', '版权、事实、品牌'],
    ['结构化工作流', 'Schema 约束 → 可编辑\n表单，确认后再提交', '结构对 ≠ 字段对'],
    ['多模态理解', '告诉用户模型实际\n收到原图、裁剪还是 OCR', '小字丢失、隐私'],
    ['实时语音与翻译', 'WebRTC，处理打断\n静音和连接状态', '端到端延迟'],
    ['工具与自动化', '模型提议、应用执行\n高风险写入二次确认', '越权、不可逆'],
  ];
  C.forEach(([t, ui, risk], i) => {
    const x = 40 + (i % 3) * 300, y = 226 + Math.floor(i / 3) * 170;
    s.push(k.box({ x, y, w: 280, h: 108, title: t, sub: ui, titleSize: 'body', tone: 'info' }));
    s.push(k.text({ x: x + 140, y: y + 136, text: `风险：${risk}`, size: 'note', tone: 'warn', anchor: 'middle' }));
  });

  return k.figure({
    h: 590,
    title: '大模型 + 前端：先判断值不值得做，再选场景',
    subtitle: '价值不在“放个聊天框”，而在把语言、图像、语音和工具能力嵌进原有流程',
    body: s.join(''),
  });
};
