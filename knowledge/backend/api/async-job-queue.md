当请求无法在合理的 HTTP 时限内完成，API 应把它建模为异步 Job，而不是把超时调大到几分钟。客户端提交任务后收到 202 和 jobId，通过状态资源或事件流观察进度；Broker 负责可靠通知，任务数据库负责业务真相，Worker 负责有限租约下执行。

[AsyncAPI 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)提供了与具体 Broker 无关的异步接口描述：channels、operations、messages、correlation 和 bindings。即使底层使用 RabbitMQ、Kafka 或云队列，也应先定义产品级消息与生命周期契约。

![客户端提交后获得 Job ID，任务进入持久 Job Store 和 Broker，幂等 Worker 更新终态；瞬态失败退避重试，耗尽后进入 DLQ，客户端通过查询或事件流观察](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/async-job-queue-delivery-lifecycle-v1.webp)
*图：Job Store 是可查询状态，Broker 是交付通道，两者不能混为同一个事实源。*

## HTTP 提交契约

提交接口验证输入、授权、幂等键和预算后创建任务：

~~~http
POST /jobs
Idempotency-Key: 8d6c...

HTTP/1.1 202 Accepted
Location: /jobs/job_01J...
Retry-After: 2
~~~

响应包含 jobId、statusUrl、eventsUrl、createdAt 和当前 state。202 表示已接受处理，不表示最终成功。若同一幂等键重试，返回同一 Job；同 key 不同请求指纹返回冲突。

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

[RabbitMQ Reliability Guide](https://www.rabbitmq.com/docs/reliability)解释了生产者确认与消费者确认各自转移责任。网络故障发生在 Worker 完成业务提交后、ACK 到达 Broker 前，消息会重投；这属于正常至少一次语义。

[RabbitMQ Confirms](https://www.rabbitmq.com/docs/confirms)进一步说明消费者确认和重投机制。Worker 按“读取任务 → 获取租约 → 执行 → 持久化终态 → ACK”顺序。重复消息看到任务已终态便 ACK；外部副作用通过 operationId 和幂等账本保证不会重复。

不要在收到消息后立即 ACK 再异步处理，那会在进程崩溃时丢任务；也不要依赖 Broker 的“恰好一次”宣传替代业务幂等。

## 租约、重试与 DLQ

Worker 用 leaseOwner、leaseUntil 和 fencingToken 表示执行权。心跳延长租约，旧 token 不能写新状态。进程崩溃后租约过期，消息被重投或扫描器重新调度。

重试只用于瞬态错误，使用指数退避、jitter、maxAttempts 和总 deadline。参数、权限、策略和永久业务错误直接失败。Retry-After 超过剩余 deadline 时不再重试。每次 attempt 记录错误类别与依赖。

DLQ 是隔离区，不是垃圾桶。消息进入原因、原队列、最后错误、attempt 和对应 Job 可查询；重放先修复根因、验证幂等，并通过受审计工具生成新调度事件。无限自动把 DLQ 倒回原队列会制造循环事故。

## 状态查询与事件流

GET /jobs/{id} 返回当前权威快照，对完成结果可使用长期缓存；运行中状态短缓存或条件查询。SSE/WebSocket 事件带递增 eventId，客户端断线以 Last-Event-ID 接续。事件丢失时回退到状态查询。

事件流是便利接口，不是唯一事实。客户端错过 progress 仍能从 Job 状态得到终态。终态事件至少一次发送，消费者按 jobId + stateVersion 去重。

## 取消、过期与保留

DELETE 或 POST cancel 写 cancelRequested，不直接删除记录。Worker 在安全点协作停止；已经提交的不可撤销副作用需要补偿或返回 cancellation_pending。终态保留足够时间让客户端获取结果和幂等重试，随后按数据策略删除 payload、结果、事件和备份。

deadline 到达后任务转 expired，Worker 不再发起新副作用。保留期与执行 deadline 分开：任务可以已过执行时限但仍需保留审计记录。

## 测试和观测

测试覆盖数据库提交后发布前崩溃、重复消息、终态保存后 ACK 前断线、双 Worker 租约竞争、429 退避、永久错误、取消竞争、事件流断线、DLQ 重放和 Broker 故障。断言状态单调、外部效果一次、终态可查询。

指标包括提交率、队列深度、最老年龄、排队与执行分位数、active lease、redelivery、retry、DLQ、取消延迟和每租户公平性。通过 jobId、messageId、traceId 和 operationId 可以从 HTTP 一直追到副作用。

## 小结

异步 Job 是一份跨 HTTP、数据库、Broker 和 Worker 的协议。202 + Location 建立可查询资源，outbox 保证提交与发布衔接，租约定义执行所有权，ACK 在持久完成后发生，幂等处理重复，DLQ 和取消拥有明确生命周期。这样长任务才不依赖一条脆弱连接。

## 参考资料

- [AsyncAPI Specification 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
- [RabbitMQ：Reliability Guide](https://www.rabbitmq.com/docs/reliability)
- [RabbitMQ：Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)
