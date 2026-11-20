export const meta = {
  name: 'browser-state-where-to-store-v2',
  article: 'knowledge/network/others/localStorage-sessionStorage.md',
  alt: '按状态语义选择浏览器存储：可分享、可回退的筛选放 URL；组件瞬时交互放内存 state；当前标签页的短期草稿放 sessionStorage，作用域是 origin 加页面会话；非敏感偏好放 localStorage，同源跨标签页持久；大量离线结构化数据放异步的 IndexedDB；服务器会话标识放 Secure、HttpOnly Cookie，脚本读不到但会按 Domain 和 Path 自动随请求发送；除 HttpOnly Cookie 外，同源脚本都能读到',
};

export default (k) => {
  const s = [], Y0 = 150, RH = 56, C = [40, 226, 450, 690, 810];
  ['存在哪里', '适合存什么', '作用域与生命周期', '脚本可读', '随请求发送'].forEach((h, i) => s.push(k.text({ x: C[i], y: 132, text: h, size: 'label', tone: 'muted' })));
  const rows = [
    ['URL', '可分享、可回退的筛选', '导航历史', '可读', '随导航', 'accent'],
    ['内存 state', '组件瞬时交互', '当前页面', '可读', '否', 'accent'],
    ['sessionStorage', '本标签页的短期草稿', 'origin + 页面会话', '可读', '否', 'info'],
    ['localStorage', '非敏感偏好', 'origin，跨标签页持久', '可读', '否', 'info'],
    ['IndexedDB', '大量离线结构化数据', 'origin，异步、有事务', '可读', '否', 'info'],
    ['HttpOnly Cookie', '服务器会话标识', 'Domain / Path 匹配', '读不到', '自动发送', 'warn'],
  ];
  rows.forEach(([a, b, c, d, e, tone], i) => {
    const y = Y0 + i * RH;
    s.push(k.box({ x: C[0], y: y + 6, w: 170, h: RH - 12, title: a, titleSize: 'label', tone }));
    s.push(k.text({ x: C[1], y: y + 34, text: b, size: 'body' }));
    s.push(k.text({ x: C[2], y: y + 34, text: c, size: 'label', tone: 'sec' }));
    s.push(k.text({ x: C[3], y: y + 34, text: d, size: 'body', tone: d === '可读' ? undefined : 'ok' }));
    s.push(k.text({ x: C[4], y: y + 34, text: e, size: 'body', tone: e === '自动发送' ? 'warn' : e === '否' ? 'muted' : undefined }));
    if (i) s.push(`<line x1="40" y1="${y}" x2="920" y2="${y}" stroke="${k.t.faint}" stroke-width="1"/>`);
  });

  return k.figure({
    h: 580,
    title: '浏览器状态：按语义选位置，不只看容量和过期',
    subtitle: 'origin = scheme + host + port；Web Storage 是同步 API、只存字符串，容量没有跨浏览器固定的 5 MB 合同',
    body: s.join('') + k.note({ x: 40, y: 500, w: 880, h: 52, lead: '长期 bearer token 别放 Web Storage：', text: 'XSS 能直接读走；Cookie 也要配 SameSite 和 CSRF 防护。' }),
  });
};
