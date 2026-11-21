export const meta = {
  name: 'prompt-structured-output-validation-path-v4',
  article: 'knowledge/llm/prompt/prompt-structured-output.md',
  alt: 'Prompt-only 或 JSON mode 的输出和原生结构化输出都要在应用端依次检查：响应是否完整（拒答、截断、出错）、JSON 能否解析、是否通过 Schema 校验、是否通过语义和业务校验，全部通过才得到可信对象；拒答或截断按状态处理，格式错误带错误信息重试一次后降级，高风险语义错误降级或转人工',
};

export default (k) => {
  const s = [], R1 = 116, R2 = 240, R3 = 384, W = 160, X = [40, 220, 400, 580, 760];
  s.push(k.box({ x: 40, y: R1, w: 420, h: 64, title: 'Prompt-only / JSON mode', sub: '最多保证 JSON 语法，不保证字段' }));
  s.push(k.box({ x: 500, y: R1, w: 420, h: 64, title: '原生 Structured Outputs', sub: '约束解码到所支持的 Schema 子集', tone: 'accent' }));
  s.push(k.arrow({ points: [[110, R1 + 64], [110, R2]] }));
  s.push(k.arrow({ points: [[710, R1 + 64], [710, 212], [150, 212], [150, R2]], tone: 'accent', label: '应用端照样要验', labelAt: [430, 204] }));

  s.push(k.box({ x: X[0], y: R2, w: W, h: 84, title: '响应完整？', sub: '拒答、截断、出错' }));
  s.push(k.box({ x: X[1], y: R2, w: W, h: 84, title: 'JSON 解析', sub: '不静默用半个对象' }));
  s.push(k.box({ x: X[2], y: R2, w: W, h: 84, title: 'Schema 校验', sub: '必填、类型、枚举' }));
  s.push(k.box({ x: X[3], y: R2, w: W, h: 84, title: '业务校验', sub: 'ID 存在？有权限？' }));
  s.push(k.box({ x: X[4], y: R2, w: W, h: 84, title: '可信对象', sub: '才交给下游', tone: 'ok', strong: true }));
  for (let i = 0; i < 4; i++) s.push(k.arrow({ points: [[X[i] + W, R2 + 42], [X[i + 1], R2 + 42]], tone: 'accent' }));

  s.push(k.box({ x: X[0], y: R3, w: W, h: 76, title: '按状态处理', sub: '不当成功结果', tone: 'bad', titleSize: 'body' }));
  s.push(k.box({ x: X[1], y: R3, w: 340, h: 76, title: '格式错误', sub: '带上错误信息重试一次，再失败就降级', tone: 'warn', titleSize: 'body' }));
  s.push(k.box({ x: X[3], y: R3, w: W, h: 76, title: '高风险语义错误', sub: '降级或转人工', tone: 'bad', titleSize: 'body' }));
  s.push(k.arrow({ points: [[X[0] + 80, R2 + 84], [X[0] + 80, R3]], tone: 'bad', dashed: true }));
  s.push(k.arrow({ points: [[X[1] + 80, R2 + 84], [X[1] + 80, R3]], tone: 'warn', dashed: true }));
  s.push(k.arrow({ points: [[X[2] + 80, R2 + 84], [X[2] + 80, R3]], tone: 'warn', dashed: true }));
  s.push(k.arrow({ points: [[X[3] + 80, R2 + 84], [X[3] + 80, R3]], tone: 'bad', dashed: true }));
  s.push(k.text({ x: X[4], y: R3 + 30, text: '失败时记录错误类型、\n模型版本和原始响应', size: 'label', tone: 'muted' }));

  return k.figure({
    h: 570,
    title: '结构化输出：约束解码之后，应用端还要验四道',
    subtitle: '原生能力加强的是结构合同；Prompt-only 没有约束解码，直接从完整性和解析开始',
    body: s.join('') + k.note({ x: 40, y: 490, w: 880, h: 52, lead: '格式正确 ≠ 事实正确：', text: 'Schema 合法只证明结构，confidence 也不是校准概率。' }),
  });
};
