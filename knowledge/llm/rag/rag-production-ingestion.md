把“上传文件后跑一次 embedding”称为摄取流程，会掩盖生产系统真正困难的部分：来源会修改、删除、回滚，解析器和分块策略会升级，任务会超时重试，索引还必须在不停服的情况下切换。生产级 ingestion 的目标不是把数据塞进向量库，而是让任意一条证据都能回答：它来自哪里、经哪个版本处理、当前是否仍有效，以及失败后能否安全重放。

## 先定义可重放的数据契约

每个来源先进入 source registry，而不是直接进入解析器。最小记录通常包括：

```ts
type SourceRecord = {
  tenantId: string;
  sourceId: string;       // 业务稳定 ID，不使用临时下载 URL
  sourceVersion: string;  // ETag、对象版本、提交 SHA 或单调序号
  contentHash: string;
  uri: string;
  aclVersion: string;
  deletedAt?: string;
};
```

`sourceId + sourceVersion` 描述“哪一版来源”，`contentHash` 用来跳过内容未变的重复事件。二者不能混为一个字段：同一内容可能出现在不同权限域；同一 sourceId 也会经历不同内容。

事件同样要有确定身份：

```text
event_id = hash(tenant_id, source_id, source_version, operation)
operation ∈ {UPSERT, DELETE}
```

消费者按 event_id 建立待处理状态，再执行可重试的幂等阶段；只有阶段产物与完成标记满足约定的持久化边界后，才记为完成并确认消息。不能先写“已处理”就跳过尚未落地的副作用。消息“至少投递一次”时，重复执行不应产生重复 chunk；任务在中途崩溃时，从已验证完成的阶段继续，而不是重建整个语料。

## 版本属于产物，而不只属于代码

一个索引条目至少受四类版本影响：来源版本、解析器版本、分块策略版本、embedding 模型版本。建议把它们写进不可变 build manifest：

```json
{
  "buildId": "kb-2026-07-15-03",
  "parserVersion": "parser-7",
  "chunkPolicy": "heading-window-4",
  "embeddingModel": "embed-v3",
  "aclSnapshot": "acl-184",
  "sourceWatermark": "events:928174"
}
```

只记录“索引更新时间”无法解释为什么一次升级改变了召回。manifest 使线上答案、离线评测和事故回放指向同一套构建输入。

![版本化摄取流程：UPSERT 经校验、解析与分块生成索引；DELETE 写持久删除标记并清理派生产物。候选构建经门禁后切换并核实路由，回滚、删除标记与权限撤回均受当前查询过滤约束](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-production-ingestion-versioned-pipeline-v2.png)
*图：DELETE 分支不经过解析、分块或 embedding。删除标记与现行权限独立约束查询，不能等待重建或通过回滚恢复已撤销访问；路由切换还需核实实际指向。*

## 增量更新不是只做 upsert

常见增量流程如下：

1. 发现来源变化，读取稳定版本和 ACL；
2. 下载并校验内容，生成 contentHash；
3. 解析为带页码、坐标和结构的中间表示；
4. 规范化并按策略生成 chunk；
5. 计算 embedding，写入目标构建版本；
6. 对同一 sourceId 做集合差分，删除旧版多出的 chunk；
7. 写入成功水位和 lineage。

chunk ID 必须确定性生成，例如：

```text
chunk_id = hash(tenant_id, source_id, source_version,
                parser_version, chunk_policy, logical_path)
```

不要用数组下标作为长期 ID。文档开头多一段话会让后续下标全部漂移，缓存、引用和增量删除都会失效。`logical_path` 可以由章节路径、页码和区域标识组合，再用内容哈希消解冲突。

删除事件必须贯穿解析后的所有派生存储：原始对象引用、chunk、向量、关键词索引、图节点、缓存和引用映射。只在向量库删一份，会留下“幽灵证据”；只做 TTL，又可能在合规删除窗口内继续返回内容。

## 用影子构建替代原地升级

### 同一文档有多个版本，查询该选哪一版

先区分业务版本与索引构建版本：合同条款的 v2/v3 是内容生效范围，换解析器后重建同一份 v3 则是处理产物变化。不能简单按上传时间取最新，也不能把新旧块混在一次回答里。先明确查询是“按当前规则回答”，还是“回看某个时间点的规则”；未说明时应澄清，或使用产品事先约定并向用户展示的口径。

一个教学数据模型可以让每个块携带 `documentId`、`sourceVersion`、`validFrom/validTo`、发布状态、权限与 `buildId`。当前规则查询限定已发布且在有效期内的业务版本；历史查询按指定时间筛选，明确保留已被替代的版本。区间可约定为左闭右开，但这是应用合同，不能从时间戳自然推出。时间边界、时区、缺失有效期和多个有效版本冲突都需要校验；草稿刚上传不代表已生效。

词法与向量两路必须采用相同的版本与授权条件，缓存键也要包含相关版本口径。引用保留来源版本和块位置，才能区分“引用了旧规则”与“索引没更新”。[Qdrant 的过滤条件](https://qdrant.tech/documentation/search/filtering/)支持组合结构化条件；这里的数据模型与生效规则是教学设计，不是该数据库自动提供的业务版本语义。

例如 v3 在 7 月 1 日生效，6 月 30 日的历史查询仍可能需要 v2；当前查询不能因为 v2 的向量更相似就选它。若 v3 校验失败，应保持已知可用的服务版本并返回构建失败，不能让“部分新块加部分旧块”冒充一个完整发布。业务版本撤销、权限撤回与回滚也要分别定义，回滚索引不应恢复已撤销的访问权。

解析器或 embedding 模型升级时，不要边读边改当前索引。创建不可变的 shadow index，完成后运行四类门禁：

- 完整性：期望来源数、chunk 数、删除数和失败数；
- 安全性：租户与 ACL 过滤、敏感字段清理；
- 质量：固定 Golden Set 的 Recall@K、引用覆盖与答案回归；
- 运行性：索引大小、查询延迟、错误率和预估成本。

门禁通过后，应用只切换一个逻辑别名或路由指针。Elasticsearch 的 [Reindex API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-reindex) 明确要求源与目标不同，并提醒目标 mapping、分片等配置不会自动复制；[Aliases 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)则说明别名可以实时改变应用使用的索引。这正是蓝绿索引的基础：构建与服务解耦，切换可以原子化，旧版仍可回滚。

以 Elasticsearch 的一个别名变更请求为例，应把移除旧指向与添加新指向放在同一请求，并处理逐动作失败；需要任一动作失败就停止整组变更时，按所用版本核对 `must_exist` 等条件。官方[别名多动作结果](https://www.elastic.co/docs/manage-data/data-store/aliases#multiple-action-results)说明动作可能部分成功，因此不能只看到 HTTP 成功或 `acknowledged` 就记作切换完成。检查 `errors`、每项结果，再读取最终别名指向；失败时保持结果未知或执行已定义的恢复流程，不无条件重复切换。

## 失败、回放与背压

阶段任务要区分三类失败：

- 瞬时失败：网络抖动、限流，可指数退避并抖动重试；
- 数据失败：加密文件、损坏对象、不支持格式，进入隔离队列并记录原因；
- 代码或契约失败：解析器异常、schema 不兼容，停止发布而不是吞掉错误。

每阶段输出先写临时位置，验证后再提交完成标记。外部副作用带幂等键；重试次数耗尽后进入 dead-letter 队列。回放接受明确的时间窗、来源集合和处理版本，不能默认用“现在最新的配置”，否则无法复现旧事故。

突发全量更新会同时压垮下载、解析、embedding 和索引写入。为每阶段建立有界队列与并发配额，按租户公平调度；下游拥塞时向上游施加背压，而不是无限堆积内存。离线 backfill 与实时变更使用不同优先级，保证新删除事件不会排在数百万旧文档之后。

## 可观测性要能追到一条证据

面板平均数之外，还要支持按 `buildId / sourceId / eventId / chunkId` 钻取。关键指标包括：

- 发现到可查询的 freshness lag；
- 每阶段吞吐、p95 时长、重试和隔离比例；
- source → parsed element → chunk → index record 的数量差分；
- 删除传播延迟与残留抽检；
- 各版本的解析成功率、空文本率和 chunk 分布；
- 影子评测与当前生产版的质量差异。

[Apache Tika](https://tika.apache.org/2.6.0/parser.html) 的 Parser 接口能以流式方式输出结构化内容与元数据，这说明“解析结果”本身就应是一等产物，而不是只保留一串纯文本。生产系统还应保存原始来源指针和解析版本，使未来可以重新解析而不丢失血缘。

## 发布前检查清单

- 来源、事件、chunk 和构建是否都有稳定 ID；
- UPSERT、重复投递、乱序事件和 DELETE 是否幂等；
- parser、chunk、embedding、ACL 是否进入 manifest；
- 是否在独立影子索引完成完整性、安全、质量和性能门禁；
- 别名切换失败能否回滚，旧版多久回收；
- 隔离数据是否可解释、可修复、可选择性重放；
- 能否从线上引用追到来源版本和处理链路。

## 小结

生产级 ingestion 是一个版本化状态机：稳定事件驱动幂等阶段，派生产物携带血缘，删除与更新同等重要，升级先进入影子索引，再经门禁原子发布。真正可靠的标准不是“任务跑完”，而是同一输入可重放、同一证据可追溯、同一发布可回滚。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [美团容器平台 JAVA 一二面：消息一致性、MCP 权限与代码审查](../../../interview/meituan/ai/meituan-ai-5.md)
- [字节 Agent 后端实习一面：LangGraph、评测集与混合检索](../../../interview/bytedance/base/bytedance-base-22.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
<!-- interview-source-history:end -->

## 相关机制阅读（不计专题频次）

- [蚂蚁 Agent 实习一面：缓存、消息与 RAG](../../../interview/antfin/ai/antfin-ai-6.md)（cluster-de2ee20bc890）（有限原文交集：知识库数据导入及入口；生产版本、删除、幂等重放和影子发布仅扩展学习。不是完整专题被考察的证据，不计专题频次。）

## 参考资料

- [Apache Tika — The Parser interface](https://tika.apache.org/2.6.0/parser.html)
- [Elastic — Reindex documents](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-reindex)
- [Elastic — Aliases](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)
- [Elastic — Multiple alias action results](https://www.elastic.co/docs/manage-data/data-store/aliases#multiple-action-results)
- [Qdrant — Filtering clauses](https://qdrant.tech/documentation/search/filtering/)
