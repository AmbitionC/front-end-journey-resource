export const meta = {
  name: 'function-calling-propose-validate-execute-v5',
  article: 'knowledge/llm/dev/function-calling.md',
  alt: '应用把消息和工具定义发给模型，模型要么直接给出最终回答，要么提出带工具名、JSON 参数和 call_id 的工具调用；应用依次做结构、业务和权限三层校验，不通过就返回可枚举的错误，通过后按风险等级执行，只读直接执行、可撤销写入给预览、高风险写入确认最终参数；结果绑定原 call_id 作为数据回到模型，模型继续调用或回答',
};

export default (k) => {
  const s = [];
  s.push(k.frame({ x: 28, y: 104, w: 284, h: 450, label: '模型：只提议' }));
  s.push(k.frame({ x: 336, y: 104, w: 596, h: 450, label: '应用：校验与执行' }));

  s.push(k.box({ x: 48, y: 140, w: 244, h: 64, title: '消息 + 工具定义', sub: '由应用组装后发送' }));
  s.push(k.arrow({ points: [[170, 204], [170, 240]] }));
  s.push(k.box({ x: 48, y: 240, w: 244, h: 72, title: '模型', sub: '决定调不调、调哪个', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[292, 276], [356, 276]], tone: 'accent' }));
  s.push(k.box({ x: 356, y: 240, w: 244, h: 72, title: 'tool_call', sub: '工具名 · JSON 参数 · call_id', tone: 'accent' }));
  s.push(k.arrow({ points: [[100, 312], [100, 466]], tone: 'ok', label: '不再调用', labelAt: [110, 400], labelAnchor: 'start' }));
  s.push(k.box({ x: 48, y: 466, w: 244, h: 64, title: '最终回答', sub: '仍按业务目标验收', tone: 'ok' }));

  s.push(k.arrow({ points: [[600, 276], [652, 276]], tone: 'accent' }));
  s.push(k.box({ x: 652, y: 140, w: 260, h: 172, title: '三层校验', sub: '结构：Schema、必填、枚举\n业务：订单在、金额不超限\n权限：userId 取自 session', tone: 'accent' }));
  s.push(k.arrow({ points: [[782, 312], [782, 350]], tone: 'accent', label: '通过', labelAt: [794, 336], labelAnchor: 'start' }));
  s.push(k.box({ x: 652, y: 350, w: 260, h: 180, title: '按风险执行', sub: '只读：直接执行\n可撤销：预览，可撤回\n高风险：确认最终参数\n都带超时与幂等键', tone: 'warn' }));

  s.push(k.box({ x: 356, y: 410, w: 244, h: 92, title: '工具结果', sub: '绑定原 call_id\n当数据，不当指令', tone: 'info' }));
  s.push(k.arrow({ points: [[652, 480], [600, 480]], tone: 'info' }));
  s.push(k.arrow({ points: [[652, 196], [626, 196], [626, 432], [600, 432]], tone: 'bad', dashed: true, label: '不通过：可枚举错误', labelAt: [614, 392], labelAnchor: 'end' }));
  s.push(k.arrow({ points: [[400, 410], [400, 344], [220, 344], [220, 312]], tone: 'info', label: '回传，继续', labelAt: [230, 372], labelAnchor: 'start' }));

  return k.figure({
    h: 660,
    title: 'Function Calling：模型提议，应用校验并执行',
    subtitle: '一次交互可能循环多轮；Responses API 里的工具结果叫 function_call_output',
    body: s.join('') + k.note({ x: 40, y: 580, w: 880, h: 52, lead: 'strict 只约束结构：', text: '权限只认登录态和服务端数据，不认模型给的参数。' }),
  });
};
