索引不是一个可以随时“改到最新”的黑盒。解析、分块、embedding、ACL 或 mapping 任一变化，都会改变可检索语料。可靠发布要把索引视为不可变构建产物：新版本独立完成，影子评测通过后原子切换，旧版在回滚窗口后才回收。

## Build Manifest 定义索引身份

一个版本名 `v2` 信息不足。manifest 至少包含：

```json
{
  "indexVersion": "kb-20260715-03",
  "sourceWatermark": "events-928174",
  "parserVersion": "p7",
  "chunkPolicy": "heading-window-4",
  "embeddingModel": "embed-v3",
  "schemaVersion": "mapping-6",
  "aclSnapshot": "acl-184",
  "createdAt": "2026-07-15T02:10:00Z"
}
```

manifest 内容可生成不可变 build ID。查询 trace、缓存键、评测报告和引用都记录该 ID，避免“同名索引内容已变”。

![V1 持续通过 Alias 服务流量，V2 从同一构建清单独立生成，经影子查询和质量门禁后原子切换，并可回滚](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-index-versioning-blue-green-v1.webp)
*图：V1、V2 是并行不可变索引；GC 只发生在回滚宽限期之后。*

## 先构建目标，再复制数据

[Elasticsearch Reindex 文档](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-reindex)指出目标必须与来源不同，而且 mapping、分片、replica 等设置不会自动复制。正确顺序是先按新 manifest 创建目标，再执行全量或选择性 reindex，并核对版本冲突与失败。

新 embedding 或分块策略通常不能只复制旧记录，要从原始解析产物重新派生。重建期间记录源事件 watermark；全量完成后消费 watermark 之后的增量事件，直到 lag 收敛。

## Dual Write 只适合短窗口

构建期可将新变更写入 V1 和 V2，但 dual write 会引入部分成功：V1 成功、V2 失败或顺序不同。每次写入带 event ID，两个版本独立幂等，并有 reconciliation job 比对。

不要长期双写来代替版本切换。它扩大运维状态并让“谁是事实源”模糊。构建完成后固定 source watermark，短暂追平，再进入发布门禁。

## Shadow Query 验证新版本

影子查询复制一小部分匿名化生产请求到 V2，但结果不返回用户。对比：候选重叠、golden evidence 排名、零结果率、权限过滤、p95 延迟和错误。影子流量不能替代 Golden Set，因为线上没有完整真值且存在流量偏差。

质量门禁包括：

- 结构：文档/chunk 数、孤儿、删除残留；
- 检索：Recall@K、nDCG、精确实体命中；
- 答案：忠实、引用、无答案处理；
- 安全：跨租户与 ACL 回归为零；
- 运行：容量、延迟、成本和错误预算。

任何门禁未通过，V2 保持不可见，不在生产索引上现场修补。

## Alias 原子切换

[Elasticsearch Aliases](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)说明多数 API 可用 alias 代替索引，alias 能实时改变应用使用的索引，并支持无停机 reindex。查询客户端只引用逻辑 alias，例如 `knowledge-current`。

切换事务同时把读 alias 从 V1 移到 V2；若有写 alias，也要明确 `is_write_index`。发布记录包含切换前后 target、操作者、门禁报告和时间。

原子切换只保证路由指针一致，不保证所有应用缓存立即刷新。缓存键包含 indexVersion，V2 首次查询不会复用 V1 结果；旧请求仍可在短时间内完成，但 trace 显示其版本。

## 回滚不是反向重建

回滚应只是把 alias 指回仍完整的 V1，而不是试图把 V2 数据“改回去”。因此旧索引在 grace period 内保持只读，相关模型、Prompt 和解析产物也保留。

若切换后发生写入，需要决定：写入事件进入独立 source log，可在回滚后重放到 V1；不要依赖从 V2 反向复制，因为 schema 可能不兼容。

回滚触发条件事先定义：越权、质量关键切片退化、错误率、延迟或引用异常。回滚后标记 V2 为 quarantined，保留现场用于诊断。

## Schema 与版本迁移

索引 mapping、向量维度、metadata 类型或 chunk ID 规则变化都需要新版本。读取层在迁移窗口可以理解 V1/V2 两种响应 envelope，但生成层尽量依赖稳定的 logical evidence contract。

历史引用若需要复现，按记录的 indexVersion 查询归档索引或 lineage store；不能用当前索引假装当时证据。保留周期根据审计和成本制定。

## Garbage Collection

GC 前确认：回滚窗口结束、无 alias、无活跃查询/任务、构建日志与 manifest 已归档、引用复现策略可用。先标记待删，再延迟执行；删除操作同样进入审计日志。

版本数不能无限增长。完整索引保留最近 N 个，较老版本保留 manifest、评测、来源水位和必要快照。规则按业务合规制定，而不是只看磁盘压力。

## 小结

索引版本治理把不确定升级变成可审计发布：manifest 固定全部输入，新索引独立构建并追平事件，Golden Set 与 shadow query 共同门禁，alias 原子切换，旧版提供快速回滚，最后按条件 GC。生产稳定性来自“不原地修改”。

## 参考资料

- [Elastic — Reindex documents](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-reindex)
- [Elastic — Aliases](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)
