公司：字节跳动；方向：交易与广告业务 AI 全栈开发；轮次：校招一面。原文记录日期为 9.16、时长约 65 分钟，日期文字未注明年份。业务方向与面试过程均为作者自述。

背景、经历和提问范围来自候选人自述，未独立证实。以下问题按原文归纳；答题思路为独立教学整理，不代表作者现场作答或企业标准答案。

## 教学演算：重复通知不会变成两条业务记录

这是未在完整系统运行的设计演算。租户A、用户U的事件e7已提交数据库，消费者在确认MQ前断开；重投时同一事务内检查唯一业务键(A,U,e7)，发现已存在，返回已保存结果后确认。同事件e7也要通知用户U2时，键(A,U2,e7)不同，应生成U2的独立通知；e8属于U但不同事件，也正常写入。Redis的最近20条只是可重建投影，断线客户端按持久日志游标补取；事件时间与接收时间的排序合同须先约定。若还要发短信，数据库事务不能自动保证外部短信只发一次，需对接同一幂等键或查询外部结果。

#### （1）AI pipeline 的目的、方案来源和最大困难是什么？

从人工流程的具体瓶颈出发，说明自动化负责哪些步骤、人的决策保留在哪里。给出输入、节点、产物和验收规则，再说明参考方案与自己做的改动。困难回答应包含真实失败、定位与验证，不凭空补项目指标或作者经历。

知识导航：[确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)、[用业务指标证明 Agent 项目价值](../../../knowledge/career/agent-project-evaluation.md)。

#### （2）每个节点怎样保证准确，如何控制幻觉与偏移？

定义每个节点的输入输出合同，代码检查 Schema、实体、权限和引用；模型质量用带证据的 rubric 评估。错误输出停在节点边界，返回明确失败或人工复核，不把“能解析 JSON”当成事实正确。业务知识应来自版本化资料与经授权的数据，缺证据时表达不确定性。

知识导航：[发布质量门禁与回归阻断](../../../knowledge/llm/production/agent-quality-gates.md)、[工具结果校验、解析与反馈](../../../knowledge/llm/agent/agent-tool-result-validation.md)、[引用溯源、Grounding 与事实一致性](../../../knowledge/llm/rag/rag-citation-grounding.md)。

#### （3）最终效果与代码生成质量怎样评估？

节点指标用于定位，端到端任务验收用于判定价值。代码必须经过编译、类型检查、测试、业务边界用例与 diff 审查，必要时隔离执行；生成和评分不能共用同一个未经校准的判断。比较同一任务快照下的成功率、人工修订、时延和成本。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)、[发布质量门禁与回归阻断](../../../knowledge/llm/production/agent-quality-gates.md)。

#### （4）数据漏斗的存储、过滤和自动化出数怎样设计？

把每一阶段输入数量、过滤原因、输出数量和时间范围记录为可复核口径。明确原始数据、明细、聚合与结果表各自用途；自动化的价值通过结果新鲜度、失败恢复和人工工作量衡量，不仅看 SQL 执行时间。

知识导航：[ETL / ELT 流程设计](../../../knowledge/data/pipeline/etl-design.md)、[数据任务编排、依赖与重试](../../../knowledge/data/pipeline/data-orchestration.md)、[数据新鲜度、完整性与管道可观测](../../../knowledge/data/pipeline/data-observability.md)。

#### （5）大规模 SQL 怎么优化，为什么选 Doris 而不是 Hive 或 ES？

先说明交互式分析、批处理、全文检索哪类负载占主导，再比较查询延迟、数据新鲜度、更新方式、成本与运维。用执行计划和 profile 找扫描、Join、聚合、网络交换瓶颈。不能只用数据量或产品标签作选型结论，也不能把某次实习选择推广成通用最佳方案。

知识导航：[索引、执行计划与查询优化](../../../knowledge/data/sql/sql-index-optimize.md)、[批处理、流处理与 Lambda/Kappa 架构](../../../knowledge/data/pipeline/batch-stream-processing.md)。

#### （6）倒排索引的选择依据是什么；加索引仍返回海量数据怎么办？

倒排索引通过值或词到行 ID 的映射缩小候选，但低选择性的条件仍会留下大量结果。先核对实际过滤率、扫描字节和各算子耗时，再考虑分区裁剪、谓词前置、只读必要列、预聚合、物化结果或异步任务。业务确需输出亿级明细时，索引不能消除输出体积。

知识导航：[索引、执行计划与查询优化](../../../knowledge/data/sql/sql-index-optimize.md)、[数据任务编排、依赖与重试](../../../knowledge/data/pipeline/data-orchestration.md)。

#### （7）MQ 到用户轮播的最近 20 条通知怎样实现？

入口验证 tenant、用户、事件 ID 和时间，按用户持久化通知后再投递。读取使用明确排序，例如事件时间加事件 ID，并定义迟到事件如何处理。Redis 可维护有界列表或有序集合，但展示“最近 20 条”与全量消息保留是两种需求；不能先截断唯一真相源再期望恢复。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)、[Redis 数据结构与使用场景](../../../knowledge/backend/database/redis-data-structure.md)、[Agent 会话、检查点与任务状态存储](../../../knowledge/backend/storage/agent-state-storage.md)。

#### （8）逐条消息如何截断，另外 19 条存在哪里，复杂成本在哪里？

单条消息到达后必须与该用户已存集合结合，再原子插入、排序和截断。需要明确并发、顺序与去重，在需要持久恢复或多副本共享时，单进程数组不足；单实例临时展示且明确可丢失时可采用简化数组方案。复杂成本常在可靠交付、用户连接映射、重连补偿和隔离；具体瓶颈仍需负载测试证明。

知识导航：[Redis 数据结构与使用场景](../../../knowledge/backend/database/redis-data-structure.md)、[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)、[WebSocket 实时通信](../../../knowledge/backend/api/websocket.md)。

#### （9）为何持久化，直接用 Redis 或 MySQL 是否可行？

先定义可容忍丢失与重建来源。只有短期展示且能从持久日志重建时，可以把 Redis 视为投影；需要历史审计和恢复时通常保存权威记录。读负载小且索引合理时，直接 MySQL 查询可能更简单；引入 Redis 应有热读收益证据。Redis 是否足够取决于持久化、复制和恢复合同。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)、[数据库备份、恢复与演练](../../../knowledge/backend/ops/backup-restore.md)。

#### （10）MySQL 与 Redis 不一致怎么处理？

推荐先提交数据库，再失效或异步刷新缓存，并把失败刷新写入可重试事件。读旧值回填仍可能造成陈旧窗口；TTL、版本检查和补偿用于收敛。延迟双删不是强一致证明，若业务要求读己之写，应读取权威状态或携带版本。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)、[事件存储、Outbox 与状态重建](../../../knowledge/backend/storage/event-store.md)。

#### （11）重复 MQ 消息如何做到业务幂等？

使用稳定业务事件 ID；同一用户合法的多条通知不能只按 uid 去重。数据库以 tenant+user_id+event_id 等唯一约束判重，并让判重与业务写入在同一事务提交，提交成功才确认消息。数据库之外的副作用还需要同一幂等键或结果查询。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)、[API 幂等键与重复请求处理](../../../knowledge/backend/api/api-idempotency.md)。

#### （12）为什么选 WebSocket，轮询替代与长连接问题如何处理？

双向实时交互可选择 WebSocket；纯服务端通知也可评估 SSE；更新频率较低时轮询容易运维。设计心跳、鉴权续期、连接背压和重连游标，断线后从持久事件补发并客户端去重，不能把连接存活等同于消息已展示。

知识导航：[WebSocket 实时通信](../../../knowledge/backend/api/websocket.md)、[SSE 服务端推送与连接管理](../../../knowledge/backend/api/sse-server.md)。

#### （13）两表 SQL 手撕的思路和索引怎样解释？

原帖没有表结构、条件和目标结果，无法还原可验证的 SQL。准备时应说明 Join 基数、过滤位置、聚合与空值语义，再用实际执行计划验证联合索引。这里保留原题缺项，不编造两张表或“标准 SQL”。

知识导航：[SQL 核心语法与进阶查询](../../../knowledge/data/sql/sql-core.md)、[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)。

## 原帖记录边界

反问中的团队业务、培养方向和作者对面试官表现的感受属于作者自述，不视为企业官方承诺；公开整理不保留可定位个人的经历。

口述要点：先保权威记录和事件身份，事务内判重与写入，提交后确认；缓存与推流是可重建视图，索引优化不能消除业务必须输出的数据量。

教学模拟追问（非原题）：

- **同一用户先后收到e7、e8，只按uid去重会怎样？** 会误删合法通知；身份应来自业务事件，用户仅限定数据范围。
- **索引过滤后仍剩两亿行能立即返回吗？** 不能忽略序列化、网络及消费成本；先核对是否确需明细，选择聚合或异步导出并测量。

## 整理依据

核验于2026-10-02；以下是整理答案的机制依据，演算不等于线上实验。

- [RabbitMQ Reliability：重投与幂等消费](https://www.rabbitmq.com/docs/reliability)
- [Redis Persistence：RDB与AOF的恢复边界](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- [Doris3.x Inverted Index：过滤与查询应用](https://doris.apache.org/docs/3.x/table-design/index/inverted-index/)
- [MySQL8.4 CREATE INDEX：唯一键和NULL](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/create-index.html)
