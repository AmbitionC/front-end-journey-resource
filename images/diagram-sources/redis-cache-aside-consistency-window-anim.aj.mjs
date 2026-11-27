import still from './redis-cache-aside-consistency-window-v2.aj.mjs';

export const meta = {
  name: 'redis-cache-aside-consistency-window-anim',
  article: 'knowledge/backend/database/redis-cache.md',
  alt: 'Cache-aside 不一致窗口（可逐步播放）：请求 A 缓存未命中后从库里读到 v1 但还没回填；请求 B 把库改成 v2 并删除缓存；A 这时才把 v1 回填进缓存，之后的请求 C 读到旧值，直到 TTL 过期窗口才结束',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const actor = (key, y, title, sub, tone) => k.box({ x: 40, y, w: 300, h: 72, title, sub, tone, align: 'start' });
  const chip = (key, x, y, text, tone) => k.keyed(key, k.box({ x, y, w: 80, h: 40, title: text, titleSize: 'body', tone }));
  const redis = (v, tone) => v ? chip('held', 820, 138, v, tone) : k.text({ x: 860, y: 164, text: '空', size: 'label', tone: 'muted', anchor: 'middle' });
  const db = (v, tone) => chip('dbv', 820, 258, v, tone);
  const status = (ok, title, sub) => k.box({ x: 520, y: 360, w: 400, h: 80, title, sub, tone: ok ? 'ok' : 'bad' });
  const A = (sub, held) => actor('A', 120, '请求 A（读）', sub, 'accent') + (held ? chip('held', 252, 136, held, 'accent') : '');
  const B = (sub) => actor('B', 216, '请求 B（写）', sub, 'warn');
  const C = (sub) => actor('C', 312, '请求 C（读）', sub, 'info');
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 580,
    title: 'Cache-aside：删了缓存，为什么还会读到旧值',
    subtitle: '读：查缓存，未命中读库再回填；写：先改库，提交后删缓存',
    body: [
      k.panel({ x: 520, y: 110, w: 400, h: 96, label: 'Redis（副本）' }),
      k.panel({ x: 520, y: 230, w: 400, h: 96, label: '数据库（以它为准）' }),
      k.note({ x: 40, y: 500, w: 880, h: 52, lead: 'TTL 是兜底：', text: '删缓存挡不住旧值回填；必须读到新值的场景，要带版本号校验或直接读库。' }),
    ].join(''),
    frames: [
      f('起点：库里是 v1，缓存里的 o17 刚好过期，是空的', [A('准备读 o17'), B('准备改成 v2'), redis(), db('v1'), status(true, '缓存为空', '下一次读会回源')]),
      f('请求 A 先查缓存：未命中', [A('GET o17 → miss'), B('准备改成 v2'), redis(), db('v1'),
        k.arrow({ points: [[340, 150], [520, 150]], tone: 'accent', flow: true, label: 'GET', labelAt: [430, 142] }), status(true, '缓存为空', '下一次读会回源')]),
      f('A 去库里读到 v1，但还没来得及回填（比如 GC 停顿、网络慢）', [A('读到 v1，卡住了', 'v1'), B('准备改成 v2'), redis(), db('v1'),
        k.arrow({ points: [[520, 278], [440, 278], [440, 176], [340, 176]], tone: 'accent', flow: true, label: '读库', labelAt: [452, 236], labelAnchor: 'start' }), status(true, '缓存为空', 'A 手里拿着 v1')]),
      f('请求 B 把库改成 v2 并提交', [A('读到 v1，卡住了', 'v1'), B('UPDATE → v2'), redis(), db('v2', 'warn'),
        k.arrow({ points: [[340, 264], [520, 264]], tone: 'warn', flow: true, label: 'UPDATE', labelAt: [430, 256] }), status(true, '缓存为空', '库已经是 v2')]),
      f('B 按规矩删缓存：可缓存本来就是空的，这一步什么也没挡住', [A('读到 v1，卡住了', 'v1'), B('DEL o17'), redis(), db('v2', 'warn'),
        k.arrow({ points: [[340, 240], [480, 240], [480, 186], [520, 186]], tone: 'warn', flow: true, label: 'DEL', labelAt: [410, 232] }), status(true, '缓存为空', '库已经是 v2')]),
      f('A 这才把手里的 v1 回填进缓存：旧值盖在了新值前面', [A('SET v1，TTL 300s'), B('已完成'), redis('v1', 'bad'), db('v2', 'warn'),
        k.arrow({ points: [[340, 150], [520, 150]], tone: 'bad', flow: true, label: 'SET', labelAt: [430, 142] }), status(false, '缓存 v1 ≠ 库 v2', '不一致窗口开始')]),
      f('之后的请求 C 直接命中缓存，读到的是旧值 v1', [A('已完成'), B('已完成'), C('GET o17 → v1'), redis('v1', 'bad'), db('v2', 'warn'),
        k.arrow({ points: [[340, 348], [460, 348], [460, 168], [520, 168]], tone: 'info', flow: true, label: '命中旧值', labelAt: [450, 300], labelAnchor: 'end' }), status(false, '缓存 v1 ≠ 库 v2', '一直这样，直到 TTL 过期')]),
      f('TTL 到期，缓存被清掉；下一次读回源拿到 v2，窗口结束。窗口最长就是一个 TTL', [A('已完成'), B('已完成'), C('下次读：回源拿 v2'), redis(), db('v2', 'warn'), status(true, '窗口结束', '最长持续一个 TTL')]),
    ],
  });
};
