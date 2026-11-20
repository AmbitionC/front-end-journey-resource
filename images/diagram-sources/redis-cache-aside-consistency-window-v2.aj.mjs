export const meta = {
  name: 'redis-cache-aside-consistency-window-v2',
  article: 'knowledge/backend/database/redis-cache.md',
  alt: 'Cache-aside 时序：读路径先查 Redis，未命中再读数据库并带 TTL 回填；写路径先更新数据库，提交后删除缓存。右侧说明慢读请求在删除之后回填旧值造成的不一致窗口，以及并发 miss 用 single-flight 合并成一次查库',
};

const L = { app: 120, redis: 300, db: 480 };
const msg = (k, y, from, to, label, tone, dashed = false) =>
  k.arrow({ points: [[L[from] + (L[to] > L[from] ? 4 : -4), y], [L[to] + (L[to] > L[from] ? -4 : 4), y]], tone, dashed, label, labelAt: [(from === 'redis' || to === 'redis') ? (L[from] + L[to]) / 2 : (L.redis + L.db) / 2, y - 8] });

export default (k) => k.figure({
  h: 600,
  title: 'Cache-aside：数据库为准，缓存只是副本',
  subtitle: '读：查缓存 → 未命中读库 → 带 TTL 回填；写：先改库，提交后删缓存',
  body: [
    ...Object.entries({ app: '应用', redis: 'Redis', db: '数据库' }).map(([key, t]) => k.box({ x: L[key] - 60, y: 110, w: 120, h: 40, title: t, titleSize: 'body', strong: true })),
    ...Object.values(L).map((x) => `<line x1="${x}" y1="150" x2="${x}" y2="490" stroke="${k.t.faint}" stroke-width="1.4" stroke-dasharray="4 5"/>`),
    k.text({ x: 40, y: 186, text: '读', size: 'label', tone: 'accent', weight: 600 }),
    msg(k, 186, 'app', 'redis', 'GET o17', 'accent'),
    msg(k, 222, 'redis', 'app', 'miss', 'accent', true),
    msg(k, 258, 'app', 'db', '读到 v1', 'accent'),
    msg(k, 294, 'db', 'app', 'v1', 'accent', true),
    msg(k, 330, 'app', 'redis', 'SET v1，TTL 300s', 'accent'),
    `<line x1="40" y1="356" x2="560" y2="356" stroke="${k.t.faint}"/>`,
    k.text({ x: 40, y: 392, text: '写', size: 'label', tone: 'warn', weight: 600 }),
    msg(k, 392, 'app', 'db', 'UPDATE → v2', 'warn'),
    msg(k, 428, 'db', 'app', '提交成功', 'warn', true),
    msg(k, 464, 'app', 'redis', 'DEL o17', 'warn'),

    k.panel({ x: 600, y: 110, w: 320, h: 230, label: '为什么删了缓存还会读到旧值' }),
    k.text({ x: 620, y: 168, text: '1  请求 A 未命中，从库里读到 v1', size: 'label', tone: 'sec' }),
    k.text({ x: 620, y: 200, text: '2  请求 B 把库改成 v2，删掉缓存', size: 'label', tone: 'sec' }),
    k.text({ x: 620, y: 232, text: '3  A 这才把 v1 回填进缓存', size: 'label', tone: 'bad', weight: 600 }),
    `<rect x="620" y="254" width="280" height="10" rx="5" fill="${k.t.bad}" opacity="0.35"/>`,
    k.text({ x: 620, y: 290, text: '之后都读到旧值，直到 TTL 过期', size: 'label', tone: 'bad' }),
    k.text({ x: 620, y: 318, text: '这段就是一致性窗口', size: 'note', tone: 'muted' }),

    k.panel({ x: 600, y: 360, w: 320, h: 130, label: '热点 key 同时 miss' }),
    k.text({ x: 620, y: 418, text: '100 个请求同时未命中', size: 'label', tone: 'sec' }),
    k.text({ x: 620, y: 446, text: 'single-flight：只放 1 个去查库，', size: 'label', tone: 'ok' }),
    k.text({ x: 620, y: 470, text: '其余等它的结果', size: 'label', tone: 'ok' }),

    k.note({ x: 40, y: 520, w: 880, h: 54, lead: 'TTL 是兜底：', text: '删缓存挡不住旧值回填；必须读到新值的场景，要带版本号校验或直接读库。' }),
  ].join(''),
});
