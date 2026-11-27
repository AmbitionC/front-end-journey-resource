import still from './agent-tool-timeout-cancel-reconcile-v2.aj.mjs';

export const meta = {
  name: 'agent-tool-timeout-cancel-reconcile-anim',
  article: 'knowledge/llm/agent/agent-tool-timeout.md',
  alt: '工具超时处理（可逐步播放，全局 deadline 10 秒）：第 1 次尝试带 operationId op-7 调用，4 秒没拿到结果就请求取消并查询状态，确认已取消后过重试闸门，退避 0.8 秒；第 2 次尝试仍用 op-7，又超时，查询发现远端其实已提交，于是取回原结果校验后完成，用时 9.5 秒，没有重复执行',
};

const H = 64, R1 = 116, R2 = 228, R3 = 316;
// 各方框位置，用来画“当前在这一步”的高亮框
const POS = {
  calc: [40, R1, 200, H], call: [280, R1, 200, H], check: [540, R1, 160, H], done: [740, R1, 180, H],
  cancel: [280, R2, 200, H], query: [540, R2, 160, H], committed: [740, R2, 180, H],
  cancelled: [540, R3, 160, H], gate: [280, R3, 200, 112], backoff: [40, R3, 200, H],
};
const EDGE = {
  calcCall: [[240, R1 + 32], [280, R1 + 32]],
  timeout: [[380, R1 + H], [380, R2]],
  cancelQuery: [[480, R2 + 32], [540, R2 + 32]],
  queryCancelled: [[620, R2 + H], [620, R3]],
  cancelledGate: [[540, R3 + 32], [480, R3 + 32]],
  gateBackoff: [[280, R3 + 32], [240, R3 + 32]],
  retry: [[140, R3], [140, R1 + H]],
  queryCommitted: [[700, R2 + 32], [740, R2 + 32]],
  fetch: [[830, R2], [830, 204], [620, 204], [620, R1 + H]],
  checkDone: [[700, R1 + 32], [740, R1 + 32]],
};
const T0 = 240, T1 = 920, DL = 10;

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
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

  const cur = (key) => {
    const [x, y, w, h] = POS[key];
    return k.keyed('cur', `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color('warn')}" stroke-width="3.2"/>`);
  };
  const go = (...edges) => edges.map((e) => k.arrow({ points: EDGE[e], tone: 'warn', flow: true })).join('');
  // 全局 deadline 预算条：按 10 秒画满
  const budget = (used, text, tone = 'accent') => {
    const X = (t) => T0 + ((T1 - T0) * t) / DL;
    return [
      k.text({ x: 40, y: 551, text: '全局 deadline 10 s', size: 'label', weight: 600 }),
      `<rect x="${T0}" y="536" width="${T1 - T0}" height="20" rx="5" fill="${k.t.box}" stroke="${k.t.faint}"/>`,
      k.keyed('used', `<rect x="${T0}" y="536" width="${X(used) - T0}" height="20" rx="5" fill="${k.color(tone)}" fill-opacity="0.55"/>`),
      k.text({ x: T0, y: 582, text: `已用 ${used.toFixed(1)} s · 剩 ${(DL - used).toFixed(1)} s　${text}`, size: 'label', tone: 'sec' }),
    ].join('');
  };
  const fr = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 676,
    title: '工具超时：先查清状态，再决定能不能重试',
    subtitle: '超时只说明这段时间没拿到结果，不说明远端失败，更不说明副作用已回滚',
    body: s.join('') + k.note({ x: 40, y: 604, w: 880, h: 52, lead: '迟到结果：', text: '带 operationId 进对账；同一操作出现冲突结果要报警，不能按最后到达覆盖。' }),
    frames: [
      fr('第 1 次尝试：先算全局还剩多少时间，本次超时取“剩余时间”和“单次上限 4 s”里小的那个', [cur('calc'), budget(0, '第 1 次尝试')]),
      fr('带稳定的 operationId（op-7）调用工具：之后无论重试还是对账，都靠它认出是同一个操作', [cur('call'), go('calcCall'), budget(0, '调用 op-7，单次超时 4 s')]),
      fr('4 s 到了还没结果：只能说明“没等到”，远端可能失败、可能还在跑、也可能已经做完。先请求取消', [cur('cancel'), go('timeout'), budget(4, '超时，请求取消', 'warn')]),
      fr('取消只是意图，不等于回滚，所以要查 op-7 的真实状态：这次远端确认已取消，没有产生效果', [cur('cancelled'), go('cancelQuery', 'queryCancelled'), budget(4.3, '查询：op-7 已取消', 'warn')]),
      fr('过重试闸门：网络超时是暂时性错误，工具按 operationId 去重，剩 5.7 s、才用了 1 次，四项都满足', [cur('gate'), go('cancelledGate'), budget(4.3, '闸门通过（1 / 3 次）')]),
      fr('退避 0.8 s 再加一点随机抖动，免得一群调用同时重试；等待的时间也算在 deadline 里', [cur('backoff'), go('gateBackoff'), budget(5.1, '退避 0.8 s')]),
      fr('第 2 次尝试：剩 4.9 s，仍用同一个 op-7 调用。不换新 ID，远端才能认出这是重试', [cur('call'), go('retry', 'calcCall'), budget(5.1, '第 2 次尝试，仍是 op-7')]),
      fr('又超时了。查状态，这次远端说 op-7 已经提交：其实上一轮已经做完，只是响应丢了', [cur('committed'), go('timeout', 'cancelQuery', 'queryCommitted'), budget(9.3, '查询：op-7 已提交', 'warn')]),
      fr('不重做，直接取回原结果，照常校验后完成：9.5 s 收尾，副作用只发生了一次', [cur('done'), go('fetch', 'checkDone'), budget(9.5, '取回原结果，完成', 'ok')]),
    ],
  });
};
