export const meta = {
  name: 'agent-tool-timeout-cancel-reconcile-v2',
  article: 'knowledge/llm/agent/agent-tool-timeout.md',
  alt: '每次尝试前先算全局剩余时间，再带稳定 operationId 调用工具；成功就校验结果后完成；超时则请求取消并查询操作状态：已提交就取回原结果校验、不重做，状态未知就隔离对账或转人工，确认已取消才进入重试闸门，暂时性错误、幂等或可去重、时间和次数都够时退避加抖动后再试，任一不满足就停止或升级',
};

export default (k) => {
  const s = [], H = 64, R1 = 116, R2 = 228, R3 = 316;
  s.push(k.box({ x: 40, y: R1, w: 200, h: H, title: '算剩余时间', sub: 'deadline − now', tone: 'accent' }));
  s.push(k.box({ x: 280, y: R1, w: 200, h: H, title: '调用工具', sub: '带稳定 operationId', tone: 'accent', strong: true }));
  s.push(k.box({ x: 540, y: R1, w: 160, h: H, title: '校验结果', sub: 'schema、来源', tone: 'accent' }));
  s.push(k.box({ x: 740, y: R1, w: 180, h: H, title: '完成', tone: 'accent' }));
  s.push(k.arrow({ points: [[240, R1 + 32], [280, R1 + 32]], tone: 'accent' }));
  s.push(k.arrow({ points: [[480, R1 + 32], [540, R1 + 32]], tone: 'accent', label: '成功', labelAt: [510, R1 + 22], labelAnchor: 'middle' }));
  s.push(k.arrow({ points: [[700, R1 + 32], [740, R1 + 32]], tone: 'accent' }));

  s.push(k.arrow({ points: [[380, R1 + H], [380, R2]], tone: 'bad', label: '超时', labelAt: [392, R1 + H + 30], labelAnchor: 'start' }));
  s.push(k.box({ x: 280, y: R2, w: 200, h: H, title: '请求取消', sub: '只是意图，不是回滚' }));
  s.push(k.box({ x: 540, y: R2, w: 160, h: H, title: '查询操作状态', sub: 'GET operation/{id}' }));
  s.push(k.arrow({ points: [[480, R2 + 32], [540, R2 + 32]] }));

  s.push(k.box({ x: 740, y: R2, w: 180, h: H, title: '已提交', sub: '取回原结果，不重做', tone: 'info' }));
  s.push(k.box({ x: 740, y: R3, w: 180, h: H, title: '状态未知', sub: '隔离，对账或转人工', tone: 'bad' }));
  s.push(k.box({ x: 540, y: R3, w: 160, h: H, title: '确认已取消', sub: '远端没有产生效果' }));
  s.push(k.arrow({ points: [[700, R2 + 32], [740, R2 + 32]], tone: 'info' }));
  s.push(k.arrow({ points: [[830, R2], [830, 204], [620, 204], [620, R1 + H]], tone: 'info', label: '取回后同样校验', labelAt: [725, 198], labelAnchor: 'middle' }));
  s.push(k.arrow({ points: [[700, R2 + 52], [720, R2 + 52], [720, R3 + 32], [740, R3 + 32]], tone: 'bad' }));
  s.push(k.arrow({ points: [[620, R2 + H], [620, R3]] }));

  s.push(k.box({ x: 280, y: R3, w: 200, h: 112, title: '重试闸门', sub: '暂时性错误？\n幂等或有去重 key？\n剩余时间、次数都够？', tone: 'accent' }));
  s.push(k.arrow({ points: [[540, R3 + 32], [480, R3 + 32]] }));
  s.push(k.box({ x: 40, y: R3, w: 200, h: H, title: '退避 + jitter', sub: '等待也计入 deadline', tone: 'accent' }));
  s.push(k.arrow({ points: [[280, R3 + 32], [240, R3 + 32]], tone: 'accent' }));
  s.push(k.arrow({ points: [[140, R3], [140, R1 + H]], tone: 'accent', label: '下一次尝试', labelAt: [152, R2 + 38], labelAnchor: 'start' }));
  s.push(k.box({ x: 280, y: 458, w: 200, h: 52, title: '停止或升级', tone: 'bad', titleSize: 'body' }));
  s.push(k.arrow({ points: [[380, R3 + 112], [380, 458]], tone: 'bad', label: '任一不满足', labelAt: [392, 446], labelAnchor: 'start' }));

  return k.figure({
    h: 610,
    title: '工具超时：先查清状态，再决定能不能重试',
    subtitle: '超时只说明这段时间没拿到结果，不说明远端失败，更不说明副作用已回滚',
    body: s.join('') + k.note({ x: 40, y: 534, w: 880, h: 52, lead: '迟到结果：', text: '带 operationId 进对账；同一操作出现冲突结果要报警，不能按最后到达覆盖。' }),
  });
};
