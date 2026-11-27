import still from './dns-analysis-resolution-cache-failover-v3.aj.mjs';

export const meta = {
  name: 'dns-analysis-resolution-cache-failover-anim',
  article: 'knowledge/network/others/dns-analysis.md',
  alt: 'DNS 递归解析逐步演示（可逐步播放）：应用经 stub resolver 把查询交给递归解析器；缓存未命中时依次问 Root 拿到 .com 的委派、问 TLD 拿到权威 NS 和 glue、问权威服务器拿到答案和 TTL 300 秒；递归器把答案和委派都缓存起来再返回；一分钟后再查同一个名字直接命中缓存，剩余 TTL 240 秒；查同域下另一个名字时跳过 Root 和 TLD，直接问权威',
};

const CY = [144, 232, 320];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  s.push(k.box({ x: 40, y: 200, w: 120, h: 64, title: '应用', titleSize: 'body', tone: 'muted' }));
  s.push(k.box({ x: 190, y: 200, w: 150, h: 64, title: 'stub resolver', sub: '操作系统', titleSize: 'label', tone: 'muted' }));

  const up = [
    ['Root', '返回 TLD 的委派', 144, '①'],
    ['TLD', '返回权威 NS + glue', 232, '②'],
    ['权威服务器', '返回答案 RR + TTL', 320, '③'],
  ];
  up.forEach(([t, sub, cy, n], i) => {
    s.push(k.box({ x: 700, y: cy - 32, w: 220, h: 64, title: t, sub, titleSize: 'label', tone: i === 2 ? 'ok' : 'info' }));
    s.push(k.text({ x: 655, y: cy - 8, text: n, size: 'label', anchor: 'middle', tone: 'sec' }));
  });

  s.push(k.panel({ x: 40, y: 378, w: 880, h: 120, label: 'TTL 是缓存上限，不是生效时间：换记录这样走', tone: 'info' }));
  ['提前至少一个旧 TTL\n降 TTL', '等旧缓存过期', '再切记录', '稳定后恢复 TTL'].forEach((t, i) => {
    const x = 60 + i * 215;
    s.push(k.box({ x, y: 410, w: 190, h: 54, title: t, titleSize: 'label', tone: 'info' }));
    if (i < 3) s.push(k.arrow({ points: [[x + 190, 437], [x + 215, 437]] }));
  });
  s.push(k.text({ x: 480, y: 487, text: '浏览器、JVM、连接池还有自己的缓存；已有 TCP 连接可能比 TTL 活得更久', size: 'note', anchor: 'middle', tone: 'muted' }));

  [
    ['误删后恢复', '递归器仍按负 TTL\n返回不存在'],
    ['多个权威', '要独立故障域\n切换靠递归器重试'],
    ['DNSSEC 失败', '返回 SERVFAIL\n不退回未验证答案'],
    ['DNS failover', '改了答案，旧地址\n在 TTL 内仍被用'],
  ].forEach(([t, sub], i) => s.push(k.box({ x: 40 + i * 225, y: 516, w: 205, h: 84, title: t, sub, titleSize: 'label', tone: 'warn' })));

  const rec = (cache, tone = 'accent') => k.box({ x: 380, y: 112, w: 230, h: 240, title: '递归解析器', sub: cache, titleSize: 'body', tone, strong: true });
  const local = (q, a) => [
    k.arrow({ points: [[160, 224], [190, 224]], tone: 'accent', flow: q }), k.arrow({ points: [[340, 224], [380, 224]], tone: 'accent', flow: q }),
    k.arrow({ points: [[380, 244], [340, 244]], tone: 'ok', flow: a }), k.arrow({ points: [[190, 244], [160, 244]], tone: 'ok', flow: a }),
  ].join('');
  // i：问第几级；同一时刻只画正在发生的那一来一回
  const ask = (i) => k.arrow({ points: [[610, CY[i] + 10], [700, CY[i] + 10]], tone: 'accent', flow: true }) + k.arrow({ points: [[700, CY[i] + 24], [610, CY[i] + 24]], tone: 'ok', flow: true });
  const idle = () => CY.map((cy) => k.arrow({ points: [[610, cy + 10], [700, cy + 10]], tone: 'line' })).join('');
  const q = (text) => k.text({ x: 40, y: 312, text, size: 'label', tone: 'warn' });
  const C0 = '缓存：空';
  const C3 = '缓存：\n.com 的 NS（TTL 2 天）\nexample.com 的 NS + glue\nwww → 93.184.216.34\n（TTL 300 s）';
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 700,
    title: 'DNS：委派、缓存和旧答案',
    subtitle: 'DNS 是带委派和多层缓存的分布式数据库，不是一次「问服务器要 IP」的调用',
    body: s.join('') + k.note({ x: 40, y: 620, w: 880, h: 52, lead: '排障顺序：', text: 'dig 看 status 和 TTL → 直问权威 → +trace 看委派 → 比多个递归器 → 查应用缓存。' }),
    frames: [
      f('应用要访问 www.example.com：操作系统的 stub resolver 不自己跑腿，把递归查询交给递归解析器', [q('查 www.example.com'), local(true, false), rec(C0), idle()]),
      f('递归器缓存里什么都没有，先问根服务器：根不知道答案，只告诉它 .com 归谁管', [q('查 www.example.com'), local(false, false), rec('缓存：空\n→ 问 Root'), ask(0)]),
      f('再问 .com 的 TLD 服务器：它也不给答案，只返回 example.com 的权威 NS，以及 NS 的 IP（glue）', [q('查 www.example.com'), local(false, false), rec('缓存：\n.com 的 NS\n→ 问 TLD'), ask(1)]),
      f('最后问权威服务器，拿到真正的答案：93.184.216.34，TTL 300 秒', [q('查 www.example.com'), local(false, false), rec('缓存：\n.com 的 NS\nexample.com 的 NS + glue\n→ 问权威'), ask(2)]),
      f('递归器把答案和沿途拿到的委派都缓存起来，再把答案交回给应用。第一次查询走了三轮来回', [q('查 www.example.com'), local(false, true), rec(C3, 'ok'), idle()]),
      f('一分钟后再查同一个名字：缓存直接命中，剩余 TTL 240 秒，一次上游请求都不用发', [q('60 s 后再查 www'), local(true, true), rec('命中缓存\nwww → 93.184.216.34\n剩余 TTL 240 s', 'ok'), idle()]),
      f('查同一个域下的 api.example.com：缓存里还有 example.com 的 NS，跳过 Root 和 TLD，直接问权威', [q('查 api.example.com'), local(false, false), rec('答案没缓存\n但有 example.com 的 NS\n→ 直接问权威'), ask(2)]),
    ],
  });
};
