export const meta = {
  name: 'dns-analysis-resolution-cache-failover-v3',
  article: 'knowledge/network/others/dns-analysis.md',
  alt: 'DNS 解析、缓存与容灾。应用调用操作系统的 stub resolver，stub 把递归查询交给递归解析器。递归解析器缓存未命中时依次询问：Root 返回 TLD 的委派，TLD 返回该域权威服务器的 NS 和必要的 glue，权威服务器返回答案记录和 TTL。递归解析器会缓存三类东西：按 TTL 缓存的答案、委派 NS 与 glue、以及 NXDOMAIN 和 NODATA 等负答案。TTL 是缓存可复用的上限，不是全球生效时间：换记录要提前至少一个旧 TTL 先降 TTL，等旧缓存过期再切记录，稳定后恢复 TTL；操作系统、浏览器、JVM 和连接池还有自己的缓存，已有 TCP 连接活得更久。常见故障：误删记录后即使立刻恢复，递归器仍按负 TTL 返回不存在；多个权威要放在独立故障域，切换取决于递归器自己的超时和重试，并非无感；DNSSEC 验签失败返回 SERVFAIL，不会退回未验证的答案；健康检查式 failover 改了答案，旧地址在 TTL 内仍会被用。排障顺序：dig 看 status、答案和 TTL，直接问权威，用 +trace 看委派链，比较多个递归器，最后查应用缓存和连接池',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 200, w: 120, h: 64, title: '应用', titleSize: 'body', tone: 'muted' }));
  s.push(k.box({ x: 190, y: 200, w: 150, h: 64, title: 'stub resolver', sub: '操作系统', titleSize: 'label', tone: 'muted' }));
  s.push(k.arrow({ points: [[160, 232], [190, 232]] }));
  s.push(k.arrow({ points: [[340, 232], [380, 232]] }));
  s.push(k.box({ x: 380, y: 112, w: 230, h: 240, title: '递归解析器', sub: '缓存三类东西：\n答案（按 TTL）\n委派 NS + glue\n负答案 NXDOMAIN / NODATA', titleSize: 'body', tone: 'accent', strong: true }));

  const up = [
    ['Root', '返回 TLD 的委派', 144, '①'],
    ['TLD', '返回权威 NS + glue', 232, '②'],
    ['权威服务器', '返回答案 RR + TTL', 320, '③'],
  ];
  up.forEach(([t, sub, cy, n], i) => {
    s.push(k.box({ x: 700, y: cy - 32, w: 220, h: 64, title: t, sub, titleSize: 'label', tone: i === 2 ? 'ok' : 'info' }));
    s.push(k.arrow({ points: [[610, cy], [700, cy]] }));
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

  return k.figure({
    h: 700,
    title: 'DNS：委派、缓存和旧答案',
    subtitle: 'DNS 是带委派和多层缓存的分布式数据库，不是一次「问服务器要 IP」的调用',
    body: s.join('') + k.note({ x: 40, y: 620, w: 880, h: 52, lead: '排障顺序：', text: 'dig 看 status 和 TTL → 直问权威 → +trace 看委派 → 比多个递归器 → 查应用缓存。' }),
  });
};
