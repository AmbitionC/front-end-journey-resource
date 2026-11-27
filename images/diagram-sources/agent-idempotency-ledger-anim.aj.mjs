import still from './agent-idempotency-ledger-v2.aj.mjs';

export const meta = {
  name: 'agent-idempotency-ledger-anim',
  article: 'knowledge/llm/production/agent-idempotency.md',
  alt: 'Agent 幂等账本逐步演示（可逐步播放）：首次请求用 insert-if-absent 抢到 key k-77，账本从 NEW 进入 RUNNING；执行中网络重试同 key 同意图，读账本返回进行中；首次执行成功记为 SUCCEEDED；迟到的重复投递读到 SUCCEEDED，重放首次结果；同一个 key 但意图变了，intentHash 对不上，拒绝 parameter mismatch；调下游超时时状态未知，先查下游再决定能否重做',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  const reqs = [['首次请求', 'muted'], ['网络重试：同 key 同意图', 'info'], ['迟到 / 重复投递', 'info'], ['同 key，但意图变了', 'bad']];
  reqs.forEach(([t, tone], i) => {
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

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const req = (i, tone) => hl('req', 40, 150 + i * 62, 220, 52, tone);
  const ST = { NEW: [560, 150, 150, 48], RUNNING: [770, 150, 150, 48], SUCCEEDED: [560, 244, 110, 56] };
  const st = (n, tone) => hl('st', ...ST[n], tone);
  const reply = (tone) => hl('reply', 560, 324, 360, 112, tone);
  const say = (text, tone = 'sec') => k.text({ x: 300, y: 372, text, size: 'note', tone });
  const say2 = (text, tone = 'sec') => k.text({ x: 300, y: 396, text, size: 'note', tone });
  const grab = (tone = 'accent') => hl('grab', 300, 200, 220, 140, tone);
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 650,
    title: 'Agent 幂等：所有重复请求汇到同一本账',
    subtitle: '同一 key + 同一意图只产生一次业务效果；同一 key 换了意图要明确拒绝',
    body: s.join('') + k.note({ x: 40, y: 568, w: 880, h: 52, lead: '不要先查再写：', text: '两个并发请求都查到「不存在」就会各执行一次，要用原子插入争 ownership。' }),
    frames: [
      f('首次请求带 key k-77：用 insert-if-absent 原子地插一行，插成功就拿到执行权，账本从 NEW 进入 RUNNING', [req(0), grab(), st('RUNNING', 'info'), say('k-77 插入成功：拿到 ownership'), say2('intentHash = h(退款 ¥30)')]),
      f('还在执行时，客户端超时重发了同一个请求：插入失败，读账本看到 RUNNING，返回“进行中”，不再执行第二次', [req(1, 'info'), grab('info'), st('RUNNING', 'info'), reply('info'), say('k-77 已存在：读账本'), say2('RUNNING → 返回进行中')]),
      f('首次执行成功：账本记为 SUCCEEDED，并把这次的语义结果存下来', [req(0, 'ok'), st('SUCCEEDED', 'ok'), say('退款单 rf-901 已创建', 'ok'), say2('结果存进账本')]),
      f('几分钟后消息队列又迟到地投递了一次：读到 SUCCEEDED，直接重放首次的结果，退款只发生一次', [req(2, 'info'), grab('info'), st('SUCCEEDED', 'ok'), reply('ok'), say('k-77 已 SUCCEEDED'), say2('重放 rf-901，不再退款', 'ok')]),
      f('有人拿同一个 k-77 发了“退款 ¥50”：intentHash 对不上，明确拒绝 parameter mismatch，而不是悄悄重放旧结果', [req(3, 'bad'), grab('bad'), reply('bad'), say('intentHash 不一致', 'bad'), say2('拒绝：parameter mismatch', 'bad')]),
      f('调下游时把自己的 operation ID 当幂等键传下去。超时了状态就是未知：先查下游，证明没生效才能重做', [hl('ext', 40, 460, 880, 84), st('RUNNING', 'warn'), say('下游超时：状态 unknown', 'warn'), say2('先查再决定，不盲目重试')]),
    ],
  });
};
