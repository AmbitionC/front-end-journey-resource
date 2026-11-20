export const meta = {
  name: 'redis-data-types-order-uniqueness-v2',
  article: 'knowledge/backend/database/redis-data-structure.md',
  alt: '按顺序性、唯一性、典型命令和适合场景比较 Redis 六种类型：String 存单个值，INCR 和 GET 为 O(1)，适合计数和缓存值；Hash 字段唯一，HSET 和 HGET 为 O(1)，适合对象的多个字段；List 保持插入顺序且可重复，单元素 LPUSH 和 RPOP 为 O(1)，适合队列和最近 N 条；Set 无序且成员唯一，SADD 和 SISMEMBER 为 O(1)，适合去重和标签；Sorted Set 按 score 排序且成员唯一，单元素 ZADD 和 ZRANK 为 O(log N)，适合排行榜和优先级队列；Stream 按 ID 追加，用 XADD 和 XREADGROUP，适合消息日志和消费组',
};

export default (k) => {
  const s = [], Y0 = 150, RH = 58, C = [40, 210, 340, 470, 720];
  ['类型', '顺序', '唯一性', '典型命令 · 复杂度', '适合'].forEach((h, i) => s.push(k.text({ x: C[i] + (i ? 0 : 0), y: 132, text: h, size: 'label', tone: 'muted' })));
  const rows = [
    ['String', '单个值', '—', 'INCR / GET · O(1)', '计数器、缓存值'],
    ['Hash', '不保证', '字段唯一', 'HSET / HGET · O(1)', '对象的多个字段'],
    ['List', '插入顺序', '可重复', 'LPUSH / RPOP · O(1)', '队列、最近 N 条'],
    ['Set', '无序', '成员唯一', 'SADD / SISMEMBER · O(1)', '去重、标签'],
    ['Sorted Set', '按 score', '成员唯一', 'ZADD / ZRANK · O(log N)', '排行榜、优先级队列'],
    ['Stream', '按 ID 追加', 'ID 唯一', 'XADD / XREADGROUP', '消息日志、消费组'],
  ];
  rows.forEach((r, i) => {
    const y = Y0 + i * RH;
    s.push(k.box({ x: C[0], y: y + 6, w: 150, h: RH - 12, title: r[0], titleSize: 'body', tone: 'accent', strong: i === 4 }));
    const tone = r[1] === '无序' || r[1] === '不保证' ? 'muted' : undefined;
    s.push(k.text({ x: C[1], y: y + 35, text: r[1], size: 'body', tone }));
    s.push(k.text({ x: C[2], y: y + 35, text: r[2], size: 'body', tone: r[2] === '可重复' || r[2] === '—' ? 'muted' : undefined }));
    s.push(k.text({ x: C[3], y: y + 35, text: r[3], size: 'label', mono: true }));
    s.push(k.text({ x: C[4], y: y + 35, text: r[4], size: 'body' }));
    if (i) s.push(`<line x1="40" y1="${y}" x2="920" y2="${y}" stroke="${k.t.faint}" stroke-width="1"/>`);
  });

  return k.figure({
    h: 600,
    title: 'Redis 数据类型：按顺序、唯一性和访问方式选',
    subtitle: '复杂度绑定具体命令与参数：批量命令、范围查询和集合运算要另算，实际延迟还受编码和值大小影响',
    body: s.join('') + k.note({ x: 40, y: 520, w: 880, h: 52, lead: '先问访问模式：', text: '要计数、按字段读、排队、去重、排名，还是可恢复的消费？' }),
  });
};
