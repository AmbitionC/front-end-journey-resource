export const meta = {
  name: 'agent-idempotency-ledger-v2',
  article: 'knowledge/llm/production/agent-idempotency.md',
  alt: 'Agent 幂等性靠服务端的操作账本。首次请求、网络重试、迟到或重复投递的请求，以及同一个 key 但意图已变的请求，都汇到同一处原子抢占：用 insert-if-absent 预留 key，key 的唯一范围包含租户、operation 和 key 本身，并比对 intentHash。抢到的请求在账本里从 NEW 进入 RUNNING，之后结束于 SUCCEEDED、FAILED_RETRYABLE 或 FAILED_TERMINAL。重复请求读账本：状态是 RUNNING 时返回进行中或等待；SUCCEEDED 时重放首次的语义结果；同一 key 而意图不同时拒绝，返回 parameter mismatch。调用外部服务时把自己的 operation ID 当作下游幂等键，并保存下游资源 ID；超时后状态是 unknown，要先查下游，证明原操作没生效才能重做；下游不支持幂等时，用单线程队列、业务唯一约束或发送前后对账降低风险。不要先查再写，两个并发请求都查到不存在就会各执行一次，要用原子插入争夺 ownership',
};

export default (k) => {
  const s = [];
  const req = [['首次请求', 'muted'], ['网络重试：同 key 同意图', 'info'], ['迟到 / 重复投递', 'info'], ['同 key，但意图变了', 'bad']];
  req.forEach(([t, tone], i) => {
    const y = 150 + i * 62;
    s.push(k.box({ x: 40, y, w: 220, h: 52, title: t, titleSize: 'label', tone }));
  });
  s.push(`<path d="M 260 176 H 280 M 260 238 H 280 M 260 300 H 280 M 260 362 H 280 M 280 176 V 362" fill="none" stroke="${k.t.line}" stroke-width="1.5"/>`);
  s.push(k.arrow({ points: [[280, 270], [300, 270]] }));
  s.push(k.box({ x: 300, y: 200, w: 220, h: 140, title: '原子抢占', sub: 'insert-if-absent\nkey 范围：租户 +\noperation + key\n并比对 intentHash', titleSize: 'body', tone: 'accent', strong: true }));

  s.push(k.text({ x: 560, y: 138, text: '操作账本', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.arrow({ points: [[520, 270], [540, 270], [540, 174], [560, 174]] }));
  s.push(k.box({ x: 560, y: 150, w: 150, h: 48, title: 'NEW', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[710, 174], [770, 174]] }));
  s.push(k.box({ x: 770, y: 150, w: 150, h: 48, title: 'RUNNING', titleSize: 'body', tone: 'info' }));
  s.push(`<path d="M 845 198 V 226 M 615 226 H 865" fill="none" stroke="${k.t.line}" stroke-width="1.5"/>`);
  [['SUCCEEDED', 'ok'], ['FAILED\nRETRYABLE', 'warn'], ['FAILED\nTERMINAL', 'bad']].forEach(([t, tone], i) => {
    const x = 560 + i * 125;
    s.push(k.arrow({ points: [[x + 55, 226], [x + 55, 244]] }));
    s.push(k.box({ x, y: 244, w: 110, h: 56, title: t, titleSize: 'label', tone }));
  });
  s.push(k.box({ x: 560, y: 324, w: 360, h: 112, title: '重复请求读账本', sub: 'RUNNING → 返回进行中或等待\nSUCCEEDED → 重放首次的语义结果\n意图不同 → 拒绝 parameter mismatch', titleSize: 'body', tone: 'muted', strong: true }));

  s.push(k.box({ x: 40, y: 460, w: 880, h: 84, title: '外部副作用：把 operation ID 当下游幂等键，保存下游资源 ID', sub: '超时后状态是 unknown：先查下游，证明原操作没生效才重做\n下游不支持幂等时：单线程队列、业务唯一约束、发送前后对账', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 650,
    title: 'Agent 幂等：所有重复请求汇到同一本账',
    subtitle: '同一 key + 同一意图只产生一次业务效果；同一 key 换了意图要明确拒绝',
    body: s.join('') + k.note({ x: 40, y: 568, w: 880, h: 52, lead: '不要先查再写：', text: '两个并发请求都查到「不存在」就会各执行一次，要用原子插入争 ownership。' }),
  });
};
