当请求无法在合理的 HTTP 时限内完成，API 应把它建模为异步 Job，而不是把超时调大到几分钟。客户端提交任务后收到 202 和 jobId，通过状态资源或事件流观察进度；Broker 负责可靠通知，任务数据库负责业务真相，Worker 负责有限租约下执行。

[AsyncAPI 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)提供了与具体 Broker 无关的异步接口描述：channels、operations、messages、correlation 和 bindings。即使底层使用 RabbitMQ、Kafka 或云队列，也应先定义产品级消息与生命周期契约。

## 贯穿案例：SLS 日志写 MySQL，崩溃后怎么继续

假设租户 A 的一条日志事件 `e17` 要写入订单分析表。先由接入系统建立稳定事件身份，例如保留的生产端 eventId，或在可复查源位置上构造身份；不能拿用户 ID 当事件 ID，因为同一用户有多条合法日志。输入同时携带 Schema 版本，表名和列名通过允许的映射决定，字段值使用参数化查询。

一次日志导入Job先从HTTP受理开始：POST校验并在同库事务中建立Job与outbox；发布器投递Broker，Worker从Job Store条件获取租约后执行下列SLS导入；完成后持久化Job终态再ACK，客户端GET查询终态。Job状态记录任务执行，SLS checkpoint记录源消费位置，二者不是同一事务或同一状态。任务若持续运行，进度和取消也按Job合同保存。

1. SLS 消费组分配 shard。Worker 读取批次与当前位置，校验数据，把脏记录隔离并保存可定位原因，不在无限重试中拖住整个 shard。
2. MySQL 一个事务同时插入 `(tenant_id,event_id)` 唯一的处理账本与业务数据。只有首次插入成功才执行该事件的业务变化；重复事件按已保存结果处理。这里只说同一数据库事务内的幂等，跨库与外部调用另有边界。
3. 事务提交后再推进 SLS 消费进度。SLS 的 checkpoint 是消费位置，不是与 MySQL 共同提交的事务。如果恰在两步之间崩溃，重启会再读 `e17`；账本的唯一键让重复输入不再次改变业务。
4. 如果先推进进度再写库，崩溃后就可能跳过未落库数据。若记录账本和业务写入分成两个事务，也会出现“账本已处理，业务没写入”的丢失窗口。

[SLS 消费组文档](https://help.aliyun.com/en/sls/developer-reference/use-consumer-groups-to-consume-data)说明消费组、shard 和 checkpoint；[更新消费进度](https://help.aliyun.com/en/sls/developer-reference/update-consumption-progress-sls)说明位置的持久记录。上面的跨系统提交顺序与事件账本是工程方案，官方 checkpoint 接口不承诺 MySQL 写入恰好一次。

动态 Schema 变更时，先验证新版本映射与目标表迁移，无法解释的字段进入隔离状态。只用 `INSERT ... ON DUPLICATE KEY UPDATE count=count+1` 并不能吸收重复，反而可能重复累加；根据业务选择“同一事件仅应用一次”或“可幂等覆盖同一事实”，不要把 upsert 命令名当作语义证明。

## HTTP 提交契约

提交接口验证输入、授权、幂等键和预算后创建任务：

~~~http
POST /jobs
Idempotency-Key: 8d6c...

HTTP/1.1 202 Accepted
Location: /jobs/job_01J...
Retry-After: 2
~~~

响应包含 jobId、statusUrl、eventsUrl、createdAt 和当前 state。[RFC9110§15.3.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3)规定202表示受理，不保证最终成功。若同一幂等键重试，返回同一 Job；同 key 不同请求指纹返回冲突。

大型输入写对象存储，Job 只保存引用、摘要、所有者和数据分类。提交数据库事务同时写 outbox，发布器把 outbox 送 Broker，避免任务落库后消息丢失。

## 状态机

稳定状态可以是 queued、running、retrying、succeeded、failed、cancelled 和 expired。状态转移通过版本或条件更新保证单调：

~~~text
queued -> running -> succeeded
                 -> retrying -> running
                 -> failed
queued/running/retrying -> cancelled
queued -> expired
~~~

进度是有证据的阶段或已完成单位，不是模型随意输出百分比。终态保存 resultRef、errorCode、finishedAt 和状态版本。客户端使用 ETag 或 sinceVersion 增量查询。

## 消息信封与关联

消息只携带 jobId、tenantId、attempt、deadline、priority、messageId、trace context 和 schemaVersion。消费者从数据库读取权威 payload。correlationId 把提交、状态事件和结果关联，messageId 用于交付去重。

AsyncAPI 文档描述 submit、started、progress、completed、failed 和 cancelled 消息及其 Schema；具体队列名、routing key、消费组等通过 binding 表达。领域契约不应暴露临时 Broker 拓扑给所有客户端。

## ACK 不是 exactly-once

### Redis 已预扣，发消息前崩溃怎么办

不能把“Redis Lua 扣减成功”直接写成“业务已可靠受理”。若随后应用崩溃、尚未发送 MQ，消费者看不到这次操作；事后在数据库写 outbox 也不能回头让 Redis 与数据库成为同一事务。先定义库存事实源、预占状态与唯一操作 ID，再选择恢复路径。

若数据库保存权威库存，可在同库事务中保存预占/订单状态和 outbox，由可靠发布器投递，Redis 只作可重建视图。若确实先在 Redis 预占，至少要让库存变化与可恢复的操作记录共享 Redis 内的原子边界；例如在受控脚本中校验后写预占记录及待转发 Stream，再由转发器恢复发布。这个方案仍须处理脚本错误、同槽约束、AOF/复制的丢失窗口，以及 Stream 正文和待确认记录的保留，不能承诺故障后永不丢失。

[Redis 脚本](https://redis.io/docs/latest/develop/programmability/)提供服务器内的原子执行边界，[Streams](https://redis.io/docs/latest/develop/data-types/streams/)提供追加日志和消费组能力；将它们组合为库存恢复协议是这里的教学设计。转发器投递成功后、保存进度前崩溃可能重发，所以消费者仍以稳定操作 ID 做同库去重与业务更新，提交后再确认。恢复器按操作记录和权威库存对账，不能仅从“当前 Redis 总库存减了多少”猜出丢失的是哪些订单。

[RabbitMQ Reliability Guide](https://www.rabbitmq.com/docs/reliability)解释了生产者确认与消费者确认各自转移责任。网络故障发生在 Worker 完成业务提交后、ACK 到达 Broker 前，消息会重投；这属于正常至少一次语义。

[RabbitMQ Confirms](https://www.rabbitmq.com/docs/confirms)进一步说明消费者确认和重投机制。Worker 按“读取任务 → 获取租约 → 执行 → 持久化终态 → ACK”顺序。重复消息看到任务已终态便 ACK。同一数据库内的业务变更与幂等账本要在同一事务提交；外部副作用还需要对方支持幂等键、查询或补偿，单独记录 operationId 不能保证它不会重复。

不要在收到消息后立即 ACK 再异步处理，那会在进程崩溃时丢任务；也不要依赖 Broker 的“恰好一次”宣传替代业务幂等。

## 保序先定义范围，再约束提交效果

“消息按序”要说明是一个生产通道的入队顺序、消费者收到的顺序，还是业务变更最终提交的顺序。[RabbitMQ 的消息排序说明](https://www.rabbitmq.com/docs/queues#message-ordering)指出，单通道发布的消息按发布顺序入队；多个通道会交错，优先级和重投会影响实际交付。即使按序收到，两条消息交给并行任务后，耗时不同也可能让后收到的任务先提交。

若要求同一订单的变更按序生效，可按订单 ID 分区，并让同一分区串行处理到持久提交；不同订单仍可并发。教学例子中，订单状态已应用到版本 7，事件 9 先到而 8 未到，不能只因 9 是新消息就直接应用：按业务合同等待或补查缺口，再用条件更新检查预期版本。重复的旧事件也应结合事件账本处理，而非再次改变状态。这里的版本约束是应用方案，不是 Broker 自动提供的保证。

重试队列、DLQ 重放与分区迁移也要遵守相同范围。前一事件失败时，是阻塞该实体、核对权威状态后跳过，还是补偿后继续，应有明确规则；把失败事件移走后立即执行后续事件，可能破坏依赖。保序、幂等与防丢失分别解决不同问题，只有在约定的范围内一起验证，才能说明业务效果符合要求。

## 租约、重试与 DLQ

Worker 用 leaseOwner、leaseUntil 和 fencingToken 表示执行权。心跳延长租约，旧 token 不能写新状态。进程崩溃后租约过期，消息被重投或扫描器重新调度。

重试只用于瞬态错误，使用指数退避、jitter、maxAttempts 和总 deadline。参数、权限、策略和永久业务错误直接失败。Retry-After 超过剩余 deadline 时不再重试。每次 attempt 记录错误类别与依赖。

DLQ 是隔离区，不是垃圾桶。消息进入原因、原队列、最后错误、attempt 和对应 Job 可查询；重放先修复根因、验证幂等，并通过受审计工具生成新调度事件。无限自动把 DLQ 倒回原队列会制造循环事故。

## 状态查询与事件流

GET /jobs/{id} 返回当前权威快照，对完成结果可使用长期缓存；运行中状态短缓存或条件查询。[WHATWG SSE§9.2.4](https://html.spec.whatwg.org/multipage/server-sent-events.html#the-last-event-id-header)定义事件id和重连Last-Event-ID；WebSocket 要自行约定重连游标，不能直接套用 SSE 的协议字段。服务端还需要保留可重放事件，游标超过保留范围时回退到状态查询。

事件流是便利接口，不是唯一事实。客户端错过 progress 仍能从 Job 状态得到终态。终态事件至少一次发送，消费者按 jobId + stateVersion 去重。

## 取消、过期与保留

DELETE 或 POST cancel 写 cancelRequested，不直接删除记录。Worker 在安全点协作停止；已经提交的不可撤销副作用需要补偿或返回 cancellation_pending。终态保留足够时间让客户端获取结果和幂等重试，随后按数据策略删除 payload、结果、事件和备份。

deadline 到达后任务转 expired，Worker 不再发起新副作用。保留期与执行 deadline 分开：任务可以已过执行时限但仍需保留审计记录。

## 测试和观测

测试覆盖数据库提交后发布前崩溃、重复消息、终态保存后 ACK 前断线、双 Worker 租约竞争、429 退避、永久错误、取消竞争、事件流断线、DLQ 重放和 Broker 故障。断言状态单调、满足已约定幂等合同的效果不重复、终态可查询。以下讨论为设计说明，没有声称这些故障试验已在本系统执行。

指标包括提交率、队列深度、最老年龄、排队与执行分位数、active lease、redelivery、retry、DLQ、取消延迟和每租户公平性。通过 jobId、messageId、traceId 和 operationId 可以从 HTTP 一直追到副作用。

## 面试口述与教学补充

可以这样说：“队列解决可靠通知、缓冲和解耦，不代替业务状态。业务提交后再 ACK 或推进 checkpoint，崩溃可能导致重投，所以同库变更和事件去重要在同一事务完成。租约与版本防止旧 Worker 覆盖新状态，外部效果仍取决于对方的幂等合同。202 只说明受理，客户端还需能查到持久终态。”

以下为教学模拟追问，不是来源面经原题：

- **MySQL 已提交但 SLS 进度未更新怎么办？** 再读同一事件，唯一事件账本阻止重复业务变更，再推进进度。
- **下游 HTTP 不支持幂等，而且请求超时了，能直接重试吗？** 超时不证明未执行；先查询或对账，无法判断时进入复核/补偿，不能承诺一次效果。
- **取消发生在写库之后，还能返回已取消吗？** 保留已提交事实，按合同区分停止后续工作与撤销已有结果；不能靠删除 Job 擦掉副作用。

## 小结

异步 Job 是一份跨 HTTP、数据库、Broker 和 Worker 的协议。202 + Location 建立可查询资源，outbox 保证提交与发布衔接，租约定义执行所有权，ACK 在持久完成后发生，幂等处理重复，DLQ 和取消拥有明确生命周期。这样长任务才不依赖一条脆弱连接。

## 延时消息、死信与周期任务分开设计

RocketMQ 5.0 的[延时消息文档](https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/)描述先存入定时存储、到指定时刻转为可投递消息的机制；该文档给出默认最大 24 小时的时间范围，其他部署参数需另核对。投递到期不保证消费者立即执行，也不表示自动周期重复。旧版本的延时级别接口不能与 5.x 的时间戳方式混写。

RabbitMQ 的 TTL 限制消息存活期，死信交换机路由过期、拒收等条件下的消息；配合可形成某些延迟模式。但[TTL 文档](https://www.rabbitmq.com/docs/ttl)说明了过期处理与队头等边界，不能把它当精确计时器，也不能把死信本身说成周期调度。

若需求是“每 30 天更新”，先确定固定时长还是按日历周期，再保存 scheduleId、nextRunAt 和已生成周期。持久调度器查到期任务，生成带 periodId 的幂等 Job；成功或按约定失败策略推进下一期。漏跑如何补、重复扫描如何去重、远端故障如何恢复，都属于周期合同。仅一条 30 天延时消息没有表达下一周期和恢复规则。

## 到期是业务事实，延迟消息只是触发器

优惠券等权益是否可用，应由权威状态和可信时间下的截止时间决定，而不是由“过期消息是否已被消费”决定。[RocketMQ 延迟消息文档](https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/)明确说明故障重启和同一时间大量消息等因素可能导致投递延迟；这不是业务可忽略到期校验的理由。

教学上可在使用权益时检查当前有效期与状态，并在真正核销的事务或条件更新中再次保护这些条件。到期消费者只对仍符合条件的状态执行幂等变更；旧版本消息不能无条件覆盖续期或已核销的新状态。时间单位、时钟来源、状态版本和并发写入边界要形成明确合同。

补偿扫描可以依据权威到期索引与水位查找漏处理项，并通过同一幂等路径收敛。它不替代实时使用时的判断。积压治理则另查生产速率、消费耗时、重试与下游容量，避免为了消化过期任务继续制造无意义重试；消息已到达或已 ACK 都不能单独证明业务终态正确。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [拼多多提前批一面：Agent 超时、消息可靠性与线上排障](../../../interview/pinduoduo/ai/pinduoduo-ai-2.md)
- [美团一面：消息保序与双跑边界](../../../interview/meituan/ai/meituan-ai-10.md)
- [蚂蚁大模型应用秋招一面：记忆评测、事务日志与消息积压](../../../interview/antfin/ai/antfin-ai-11.md)
- [美团本地核心一面：缓存一致性、库存故障与 Agent 记忆](../../../interview/meituan/ai/meituan-ai-4.md)
- [美团容器平台 JAVA 一二面：消息一致性、MCP 权限与代码审查](../../../interview/meituan/ai/meituan-ai-5.md)
- [阿里云 Agent Infra 一面：SGX、吞吐与日志写入](../../../interview/alibaba/ai/alibaba-ai-8.md)
- [字节 AI 全栈一面：Pipeline 质量、Doris 与消息轮播](../../../interview/bytedance/base/bytedance-base-23.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
- [快手效果营销实习一面：意图路由、模型容错与业务校验](../../../interview/kuaishou/ai/kuaishou-ai-18.md)
- [蚂蚁 Agent 实习一面：缓存、消息与 RAG](../../../interview/antfin/ai/antfin-ai-6.md)
- [字节 Agent 实习：缓存一致性、定时任务与后端基础](../../../interview/bytedance/base/bytedance-base-47.md)
<!-- interview-source-history:end -->

## 参考资料

本次核验于 2026-10-02：AsyncAPI 使用 3.0.0；RabbitMQ 与 SLS 为滚动文档。代码和 HTTP 信封是未在完整服务运行的示意。

- [AsyncAPI Specification 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
- [RabbitMQ：Reliability Guide](https://www.rabbitmq.com/docs/reliability)
- [RabbitMQ：Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)
- [SLS：消费组与 shard 消费](https://help.aliyun.com/en/sls/developer-reference/use-consumer-groups-to-consume-data)
- [SLS：更新消费进度](https://help.aliyun.com/en/sls/developer-reference/update-consumption-progress-sls)

- [RFC9110：202 Accepted](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3)（2022）
- [WHATWG HTML：Last-Event-ID](https://html.spec.whatwg.org/multipage/server-sent-events.html#the-last-event-id-header)（滚动文档，核验于2026-10-02）

- [Redis — Programmability](https://redis.io/docs/latest/develop/programmability/)
- [Redis — Streams](https://redis.io/docs/latest/develop/data-types/streams/)
