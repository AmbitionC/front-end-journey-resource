export const meta = {
  name: 'llm-vision-app-two-pipelines-v2',
  article: 'knowledge/llm/dev/llm-vision-app.md',
  alt: '视觉模型应用有两条独立受控的管线。上排是理解，从图像得到字段和判断：先做素材授权与解码，再按任务裁剪或切片，发出视觉请求，之后做 Schema 校验和业务证据校验，最后按风险接受结果或交给人工复核。下排是生成，从意图得到图像：先写 brief 并明确主体不变量，规范化成提示规格，生成多个候选，候选要过安全、文字 OCR、不变量和品牌规则等门禁，批准后的资产连同来源记录一起交付。两条管线都把数据汇入中间的评测集与闭环数据：被拒原因、人工修改、理解模型的错误和线上投诉，用来更新提示模板、前处理和评测集。下方两点：理解模型可以帮忙检查生成候选，但同类模型共享盲点，不能当唯一裁判，要和规则、专用检测器、不同模型、人工一起用；模型自报的置信度不是校准过的概率，是否人工复核按任务影响和风险决定，高风险图像即使看似确定也要专业复核',
};

export default (k) => {
  const s = [];
  const lane = (y, label, steps, tone) => {
    s.push(k.text({ x: 40, y: y - 12, text: label, size: 'label', tone: 'muted', weight: 600 }));
    steps.forEach(([t, sub], i) => {
      const x = 40 + i * 180;
      s.push(k.box({ x, y, w: 160, h: 84, title: t, sub, titleSize: 'body', tone: i === 4 ? 'ok' : tone }));
      if (i < steps.length - 1) s.push(k.arrow({ points: [[x + 160, y + 42], [x + 180, y + 42]] }));
    });
  };
  lane(142, '理解：从图像得到字段和判断', [
    ['授权与解码', '旋转、色彩空间\n异常尺寸'],
    ['裁剪或切片', '按任务决定\n要不要高分辨率'],
    ['视觉请求', '输出结构化结果\n和不确定项'],
    ['两层校验', 'Schema 合法\n+ 业务证据'],
    ['接受或人工', '按风险分流\n不看自报置信度'],
  ], 'info');
  s.push(k.arrow({ points: [[800, 226], [800, 252]], dashed: true }));
  s.push(k.box({ x: 40, y: 252, w: 880, h: 52, title: '评测集与闭环数据：被拒原因 · 人工修改 · 理解错误 · 线上投诉 → 更新模板、前处理和评测集', titleSize: 'label', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[800, 344], [800, 304]], dashed: true }));
  lane(344, '生成：从意图得到图像', [
    ['brief', '业务意图\n主体不变量'],
    ['提示规格', '规范化、版本化\n不只存 prompt'],
    ['生成候选', '多个候选\n存自有存储'],
    ['候选门禁', '安全 · 文字 OCR\n不变量 · 品牌'],
    ['批准并交付', '附来源记录\n模型、参数、审批'],
  ], 'warn');

  s.push(k.box({ x: 40, y: 456, w: 430, h: 84, title: '理解模型能帮查候选，但不当唯一裁判', sub: '同类模型共享盲点，自评会放大偏差\n规则、专用检测器、不同模型和人工一起上', titleSize: 'body', tone: 'muted' }));
  s.push(k.box({ x: 490, y: 456, w: 430, h: 84, title: '自报置信度不是概率', sub: '是否人工复核看任务影响和风险\n高风险图像看似确定也要专业复核', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 580,
    title: '视觉应用：理解和生成是两条独立受控的管线',
    subtitle: '理解要证据和复核，生成要门禁和来源记录；两边的失败都回流到评测集',
    body: s.join(''),
  });
};
