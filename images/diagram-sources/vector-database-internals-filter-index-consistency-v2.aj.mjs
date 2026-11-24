export const meta = {
  name: 'vector-database-internals-filter-index-consistency-v2',
  article: 'knowledge/data/storage/vector-database-internals.md',
  alt: '向量数据库内部的三个取舍。第一是搜索方式：精确 kNN 遍历过滤后的全部候选，是近似搜索的标准答案；HNSW 用多层邻接图，查询快但占内存，持续增删会膨胀；IVFFlat 先聚类分桶，查询只扫 probes 个桶，需要有代表性的数据训练，分布漂移后要重建。近似搜索用可测量的 recall 换速度和成本。第二是过滤在哪执行：后过滤先由 ANN 取 top-k 再丢掉元数据不匹配的，租户或类别稀疏时可能凑不够 k 条；前过滤先圈出合法集合，但通用 ANN 图未必能在任意子集上高效导航，可对高选择性稳定字段建分区或局部索引。租户授权必须是查询里不可绕过的条件，不能把其他租户的向量拉回应用层再过滤。第三是写入一致性：向量和元数据用同一事务存储，或由 outbox 驱动带版本的异步索引，查询结果带 sourceVersion，应用只接受与权威对象匹配的版本；删除要传到索引、缓存和副本，软删除字段默认进过滤。评估时先跑精确 top-k 当答案，再比较 recall@k、无结果率、尾延迟和每查询成本',
};

export default (k) => {
  const s = [];
  [
    ['精确 kNN', '遍历过滤后全部候选\n是 ANN 的标准答案', 'ok'],
    ['HNSW', '多层邻接图，查询快\n占内存，增删会膨胀', 'info'],
    ['IVFFlat', '先聚类分桶，只扫 probes\n要代表性数据训练', 'info'],
  ].forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 300, y: 112, w: 280, h: 84, title: t, sub, titleSize: 'body', tone, strong: i === 0 })));
  s.push(k.text({ x: 630, y: 222, text: '近似搜索：用可测量的 recall 换速度和成本', size: 'note', anchor: 'middle', tone: 'muted' }));

  s.push(k.panel({ x: 40, y: 244, w: 880, h: 168, label: '过滤在哪执行，决定能不能凑够 k 条', tone: 'accent' }));
  const lanes = [
    ['后过滤', 292, [['ANN 先取 top-k', 'info'], ['丢掉元数据不匹配的', 'info'], ['稀疏租户可能不够 k 条', 'bad']]],
    ['前过滤', 352, [['先圈出合法集合', 'info'], ['子集上 ANN 未必好走', 'warn'], ['分区或局部索引', 'ok']]],
  ];
  lanes.forEach(([name, y, boxes]) => {
    s.push(k.text({ x: 60, y: y + 28, text: name, size: 'label', weight: 600 }));
    boxes.forEach(([t, tone], i) => {
      const x = 150 + i * 260;
      s.push(k.box({ x, y, w: 230, h: 44, title: t, titleSize: 'label', tone }));
      if (i < 2) s.push(k.arrow({ points: [[x + 230, y + 22], [x + 260, y + 22]] }));
    });
  });

  s.push(k.box({ x: 40, y: 432, w: 430, h: 84, title: '写入一致性', sub: '同一事务存储，或 outbox 驱动带版本的索引\n结果带 sourceVersion，只认权威版本', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 490, y: 432, w: 430, h: 84, title: '删除与授权', sub: '删除传到索引、缓存、副本，软删除默认过滤\n租户条件不可绕过，不拉回应用层再滤', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 620,
    title: '向量数据库：近似换速度，过滤和一致性另算',
    subtitle: '索引、查询和离线评估要用同一种距离；模型升级要并行建新版本索引再切换',
    body: s.join('') + k.note({ x: 40, y: 540, w: 880, h: 52, lead: '评估：', text: '先跑精确 top-k 当答案，再比 recall@k、无结果率、尾延迟和每查询成本。' }),
  });
};
