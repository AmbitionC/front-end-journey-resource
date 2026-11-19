export const meta = {
  name: 'agent-tool-design-contract-v2',
  article: 'knowledge/llm/agent/agent-tool-design.md',
  alt: '工具调用依次经过输入 Schema 校验、授权、执行预算（超时、限流、幂等键）后才执行副作用；Schema 不合格直接拒绝，授权失败直接拒权；执行结果分为成功、部分成功、可重试错误和终止错误，都带结构化输出和 trace id，契约测试覆盖每一条路径',
};

const outs = [['成功', 'ok'], ['部分成功', 'info'], ['可重试错误', 'warn'], ['终止错误', 'bad']];

export default (k) => k.figure({
  h: 560,
  title: '工具契约：三道门之后才有副作用',
  subtitle: '模型只是提出调用；形状、权限、预算都由工具服务自己检查',
  body: [
    k.box({ x: 40, y: 172, w: 110, h: 80, title: '模型\n发起调用', titleSize: 'body' }),
    k.arrow({ points: [[150, 212], [176, 212]] }),
    k.box({ x: 180, y: 172, w: 124, h: 80, title: 'Schema', sub: '类型、必填\n枚举、范围', titleSize: 'body' }),
    k.arrow({ points: [[304, 212], [330, 212]] }),
    k.box({ x: 334, y: 172, w: 124, h: 80, title: '授权', sub: '可信会话的身份', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[458, 212], [484, 212]] }),
    k.box({ x: 488, y: 168, w: 130, h: 88, title: '执行预算', sub: '超时、限流\n幂等键', titleSize: 'body' }),
    k.arrow({ points: [[618, 212], [644, 212]] }),
    k.box({ x: 648, y: 172, w: 110, h: 80, title: '副作用', sub: '真正执行', titleSize: 'body', tone: 'accent' }),

    k.arrow({ points: [[242, 252], [242, 300]], tone: 'bad', dashed: true, label: '不合格', labelAt: [252, 282], labelAnchor: 'start' }),
    k.box({ x: 180, y: 304, w: 124, h: 48, title: '拒绝 REJECT', titleSize: 'label', tone: 'bad' }),
    k.arrow({ points: [[396, 252], [396, 300]], tone: 'bad', dashed: true, label: '无权', labelAt: [406, 282], labelAnchor: 'start' }),
    k.box({ x: 334, y: 304, w: 124, h: 48, title: '拒权 DENY', titleSize: 'label', tone: 'bad' }),

    `<path d="M758,212 H772 M772,144 V324" fill="none" stroke="${k.t.line}" stroke-width="1.7"/>`,
    ...outs.map(([t, tone], i) => k.arrow({ points: [[772, 144 + i * 60], [786, 144 + i * 60]], tone }) +
      k.box({ x: 790, y: 120 + i * 60, w: 130, h: 48, title: t, titleSize: 'label', tone })),
    k.text({ x: 920, y: 374, text: '都带结构化输出 + trace id', size: 'note', tone: 'muted', anchor: 'end' }),

    k.box({ x: 40, y: 400, w: 880, h: 56, title: '契约测试：拒绝、拒权、超时、重试、部分成功，每条路径都要有用例', titleSize: 'body', dashed: true }),

    k.note({ x: 40, y: 476, w: 880, h: 58, lead: 'Schema 不授予权限：', text: '参数合法不代表用户有权操作；授权要在读取敏感对象和副作用之前。' }),
  ].join(''),
});
