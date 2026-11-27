import still from './rate-limit-circuit-breaker-v2.aj.mjs';

export const meta = {
  name: 'rate-limit-circuit-breaker-anim',
  article: 'knowledge/backend/auth/rate-limit-circuit.md',
  alt: '限流与熔断逐步演示（可逐步播放）：正常时请求经限流器和处于 Closed 的熔断器到达下游；突发超出容量的请求被限流器返回 429；下游开始出错，错误率超过阈值且样本足够后熔断器转为 Open；Open 时请求在熔断器处快速失败并走降级；等 resetTimeout 后进入 Half-open 只放少量探测，探测失败回到 Open，再等一轮探测成功才回到 Closed',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  s.push(k.box({ x: 40, y: 130, w: 120, h: 84, title: '请求', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[160, 172], [190, 172]] }));
  s.push(k.box({ x: 190, y: 130, w: 220, h: 84, title: '限流器：保护容量', sub: '按 IP / 用户 / Key / 模型\n令牌桶允许受控突发', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[410, 172], [440, 172]] }));
  s.push(k.arrow({ points: [[640, 172], [670, 172]] }));
  s.push(k.box({ x: 670, y: 130, w: 250, h: 84, title: 'LLM / 下游服务', titleSize: 'body', tone: 'muted', strong: true }));

  s.push(k.arrow({ points: [[300, 214], [300, 250]], tone: 'bad' }));
  s.push(k.box({ x: 190, y: 250, w: 220, h: 84, title: '超限 → 429', sub: '可附 Retry-After\n（不是必带）', titleSize: 'body', tone: 'bad' }));
  s.push(k.box({ x: 40, y: 360, w: 370, h: 112, title: '分层限流维度', sub: 'IP：防爬虫和 DDoS\n用户 / API Key：控制单方消耗\n模型：控制高成本模型用量', titleSize: 'body', tone: 'info' }));

  s.push(k.text({ x: 450, y: 252, text: '熔断器的三个状态', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 450, y: 270, w: 130, h: 52, title: 'Closed', titleSize: 'body', tone: 'ok' }));
  s.push(k.box({ x: 790, y: 270, w: 130, h: 52, title: 'Open', titleSize: 'body', tone: 'bad' }));
  s.push(k.box({ x: 620, y: 420, w: 130, h: 52, title: 'Half-open', titleSize: 'body', tone: 'warn' }));
  s.push(k.arrow({ points: [[580, 296], [790, 296]], tone: 'bad', label: '错误率超阈值且样本够', labelAt: [685, 286] }));
  s.push(k.arrow({ points: [[800, 322], [720, 420]] }));
  s.push(k.text({ x: 758, y: 362, text: '等 resetTimeout', size: 'note', tone: 'muted', anchor: 'end' }));
  s.push(k.arrow({ points: [[650, 420], [570, 322]], tone: 'ok' }));
  s.push(k.text({ x: 598, y: 400, text: '探测成功', size: 'note', tone: 'ok', anchor: 'end' }));
  s.push(k.arrow({ points: [[750, 446], [870, 446], [870, 322]], tone: 'bad' }));
  s.push(k.text({ x: 862, y: 400, text: '探测失败', size: 'note', tone: 'bad', anchor: 'end' }));
  s.push(k.arrow({ points: [[905, 322], [905, 510]], dashed: true }));

  s.push(k.box({ x: 40, y: 510, w: 880, h: 84, title: 'Open 时走降级，保住核心功能', sub: '返回缓存结果 · 换更小的模型 · 排队（非实时任务）· 友好错误带 retryAfter\n降级不是掩盖故障：状态变化和降级次数都要进告警', titleSize: 'body', tone: 'accent' }));

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const ST = { closed: [450, 270, 130, 52], open: [790, 270, 130, 52], half: [620, 420, 130, 52] };
  const state = (st) => hl('st', ...ST[st], st === 'closed' ? 'ok' : st === 'open' ? 'bad' : 'warn');
  const breaker = (sub, tone = 'warn') => k.box({ x: 440, y: 130, w: 200, h: 84, title: '熔断器：隔离故障', sub, titleSize: 'body', tone });
  const go = (pts, tone = 'accent') => k.arrow({ points: pts, tone, flow: true });
  const PASS = [go([[160, 172], [190, 172]]), go([[410, 172], [440, 172]]), go([[640, 172], [670, 172]])];
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 710,
    title: '限流、熔断与降级：各管一件事',
    subtitle: '限流挡住超出容量的请求，熔断在下游出故障时快速失败，降级让核心功能还能用',
    body: s.join('') + k.note({ x: 40, y: 618, w: 880, h: 52, lead: 'Half-open 很关键：', text: '只放行少量探测请求，成功才回到 Closed，避免下游刚恢复就被流量再次打垮。' }),
    frames: [
      f('平时：请求先过限流器，再过处于 Closed 的熔断器，正常到达下游', [breaker('Closed：正常放行\n错误率 0.5%', 'ok'), state('closed'), ...PASS]),
      f('流量突增，超出容量：限流器直接回 429，挡住的是“太多”，和下游健不健康无关', [breaker('Closed：正常放行\n错误率 0.5%', 'ok'), state('closed'), go([[160, 172], [190, 172]]), go([[300, 214], [300, 250]], 'bad'), hl('cur', 190, 250, 220, 84, 'bad')]),
      f('下游开始出故障：最近 40 个请求错了 25 个，错误率超过阈值，样本也够，熔断器打开', [breaker('错误率 62%\n样本 40 个 ≥ 20', 'bad'), state('open'), go([[580, 296], [790, 296]], 'bad')]),
      f('Open 期间请求不再打到下游，在熔断器这里快速失败，转去降级：返回缓存、换小模型或排队', [breaker('Open：快速失败\n不打下游', 'bad'), state('open'), go([[160, 172], [190, 172]]), go([[410, 172], [440, 172]]), go([[905, 322], [905, 510]], 'accent'), hl('cur', 40, 510, 880, 84, 'accent')]),
      f('等满 resetTimeout（比如 30 秒）进入 Half-open：只放 3 个探测请求过去试试', [breaker('Half-open\n只放 3 个探测', 'warn'), state('half'), go([[800, 322], [720, 420]], 'warn'), go([[640, 172], [670, 172]], 'warn')]),
      f('探测里有失败的，说明下游还没好：立刻回到 Open，再等一轮', [breaker('探测 3 个，失败 2 个\n→ 回到 Open', 'bad'), state('open'), go([[750, 446], [870, 446], [870, 322]], 'bad')]),
      f('又过了一轮，3 个探测都成功：回到 Closed，流量恢复正常。状态变化和降级次数都要进告警', [breaker('探测 3 / 3 成功\n→ Closed', 'ok'), state('closed'), go([[650, 420], [570, 322]], 'ok'), ...PASS]),
    ],
  });
};
