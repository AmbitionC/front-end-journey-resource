长时间运行的 Agent 任务不能依赖一次 HTTP 连接或某个进程的内存。可靠设计把它拆成持久任务记录、消息通知、执行所有权、检查点和可查询结果：客户端提交后拿到 jobId，Worker 通过租约获得有限时间的执行权，只有在结果与状态持久化完成后才确认消息。

[RabbitMQ Reliability Guide](https://www.rabbitmq.com/docs/reliability)区分发布确认与消费者确认：前者确认生产者到 Broker 的责任转移，后者确认 Broker 到消费者的处理结果。两段确认都成功，也不等于业务副作用天然 exactly-once；网络在提交后断开时，重复投递仍然可能发生。

![任务从提交、持久队列、租约、Worker、检查点、幂等副作用到确认，失败按瞬态与永久分类进入退避重投或死信](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-queue-worker-job-lifecycle-v1.webp)
*图：ACK 是“持久完成后的责任转移”，不是 Worker 一收到消息就发送的收件回执。*

## 任务记录先于消息

把数据库任务表作为业务事实，消息作为唤醒 Worker 的通知。提交接口在一个本地事务内创建 job 和 outbox 事件，再由发布器把事件送进 Broker；这样不会出现数据库已创建但消息丢失，或者消息已发出但任务记录不存在。

~~~json
{
  "jobId": "job_01J...",
  "tenantId": "t_9",
  "state": "queued",
  "priority": "normal",
  "payloadRef": "obj://jobs/sha256/...",
  "attempt": 0,
  "maxAttempts": 5,
  "deadlineAt": "2026-07-17T03:10:00Z",
  "leaseOwner": null,
  "leaseExpiresAt": null,
  "checkpointVersion": 0,
  "idempotencyKey": "create-report:order-8"
}
~~~

大 Prompt、文件和工具结果放对象存储，消息只带 jobId、tenant、优先级、deadline 和 trace context。消息越小，重投、审计和 Broker 运维越稳定。

## 租约与执行所有权

Worker 取到消息后用条件更新获取租约：只有 queued、retrying 或过期 running 状态可以转成 running，并写入 owner、leaseUntil 和递增 fencing token。心跳只延长自己持有的同一 token；旧 Worker 即使在网络分区后恢复，也不能覆盖新所有者的状态。

租约时间大于正常心跳间隔，但不能长到崩溃后任务迟迟无法接管。模型调用或工具调用可能很长，执行器在外部调用前后检查取消与 deadline，并在安全点写检查点。无法续租时停止发起新副作用，而不是继续“赌自己仍是 owner”。

## 确认、重投与幂等

[RabbitMQ Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)说明，消费者确认与重投是可靠交付的核心机制。Worker 应按如下顺序完成：

1. 获取或验证租约；
2. 执行可重放的计算；
3. 对外部副作用使用 operationId 或幂等键；
4. 原子保存结果、检查点和终态；
5. 最后确认消息。

若第 4 步完成、第 5 步前连接断开，消息会重投。新 Worker 读取 job 已 completed 后直接确认，不能再次发送邮件或扣款。若副作用状态 unknown，先用 operationId 对账；无法判断时进入人工处理，不把未知当失败重做。

## 重试策略

错误至少分为瞬态、限流、参数、权限、策略拒绝、永久业务错误和未知副作用。只有瞬态与部分限流进入退避重试，并受 maxAttempts、deadline 和总成本约束。重试消息带 nextAttemptAt 或进入延迟队列，避免 Worker 立即忙循环。

指数退避加 jitter 可以避免依赖恢复时惊群。Retry-After 优先于本地估算。参数或权限错误通常需要修正输入或授权，不应消耗重试次数；永久失败记录稳定错误码并进入终态。超过次数的消息进入 DLQ 只是隔离，仍需要告警、查看、修复和安全重放流程。

## 预取、并发与背压

[RabbitMQ Consumers Guide](https://www.rabbitmq.com/docs/consumers)中 prefetch 控制未确认消息窗口。对于耗时 Agent 任务，预取通常接近 Worker 可实际并行的任务数；预取过大时，一个实例囤积消息，其他实例空闲，而且崩溃会造成大批重投。

并发还要受 CPU、内存、模型配额、工具连接池和租户公平性限制。队列深度增长不等于应该无限扩 Worker；若下游已经饱和，扩容只会放大超时和重试。准入层限制新任务，Worker 层保持有界 in-flight，调度层按租户和优先级公平取任务。

## 取消与进度

取消是持久状态请求，不是仅向某个进程发信号。客户端把 cancelRequestedAt 写入任务；Worker 在检查点、模型流和工具边界检查，能取消则停止并标记 cancelled。已提交且不可撤销的副作用需要补偿或返回 cancellation_pending，不能伪装成从未执行。

进度必须来自可验证阶段，例如 3/8 个数据分片完成、等待审批或正在生成报告。不要让模型随意估百分比。状态查询返回版本号与 ETag，事件流以递增序号发送；断线客户端可以从最后事件接续。

## 恢复与运维

定时扫描器寻找租约过期、queued 长时间无消费、running 无心跳、retrying 超时和 DLQ 积压。恢复动作本身带审计和幂等键。部署时 Worker 停止获取新任务，等待安全点并释放或让租约自然过期，避免粗暴终止造成大量 unknown。

测试要注入发布前后崩溃、保存终态后 ACK 前断线、租约过期双 Worker、重复消息、Broker 重启、依赖 429、取消竞争和 DLQ 重放。验收标准不是“最后成功”，而是没有重复副作用、状态单调、过期 owner 无法写入、超时工作会停止。

## 小结

队列只提供可靠传递的一部分。完整的 Agent 长任务协议需要业务任务记录、outbox、租约与 fencing、检查点、幂等副作用、完成后 ACK、有界重试、DLQ 和持久取消。把每次交付都当作可能重复，系统才能在进程崩溃和网络不确定性下维持正确状态。

## 参考资料

- [RabbitMQ：Reliability Guide](https://www.rabbitmq.com/docs/reliability)
- [RabbitMQ：Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)
- [RabbitMQ：Consumers](https://www.rabbitmq.com/docs/consumers)
