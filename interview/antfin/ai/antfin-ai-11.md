公司：蚂蚁；方向：大模型应用；来源自述为秋招一面，未明确面试年份与部门。本文选录记忆设计、事务日志和消息消费三组问题。原记录未提供系统实现、数据库版本或实际指标，以下解答与例子均为编辑教学补充。

<details data-knowledge-key="agent-memory">
<summary>（1）Agent 记忆怎样存储、召回并进入当前上下文？</summary>
</details>

把当前任务状态与跨任务保留的信息分开：前者保存最近消息、计划和未完成动作，后者保存有来源、有效期与允许用途的事实。回答时按用户范围和任务检索少量有效记忆，再连同来源放入上下文；存进向量库并不代表模型每轮都会正确使用。

例如用户说“这次用英文回答”，可以作为当前线程约束；不能直接扩写成永久偏好。需要长期保留的事实应带主体、来源、时间、版本和状态，写入前检查是否允许保存，召回时再检查当前权限与有效期。向量相似度只产生候选，精确订单号、时间范围或已撤回的事实还要靠结构化字段判断。

[LangGraph 的持久化文档](https://docs.langchain.com/oss/python/langgraph/persistence)区分线程内状态的 checkpointer 与跨线程应用数据的 store，这是一种职责划分，不是所有 Agent 必须采用的存储组合，也不自动提供用户授权。

测试不能只看“有没有记住”：应安排不该跨用户召回、临时指令不该永久化、旧事实被替代和原始证据不可访问等用例，再检查后续回答是否遵守当前事实。原帖未给实现或成绩，不能代填数据库选型、召回率或 token 节省比例。

延伸阅读：[短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)。

<details data-knowledge-key="db-transaction-lock">
<summary>（2）MySQL 的三类日志怎样分工，事务可靠性依赖什么？</summary>
</details>

undo 保存撤销修改和构造旧版本所需的信息，redo 支撑 InnoDB 崩溃恢复，binlog 记录用于复制与时间点恢复的变更事件。它们分别解决不同问题；事务是否能回滚、读到什么版本以及提交后能否恢复，还要结合隔离、约束、持久化配置与存储保证判断。

这里按 MySQL 8.4 / InnoDB 教学，原记录没有给版本。官方的 [Undo Logs](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-undo-logs.html)说明 undo 可供回滚与一致性读使用；[Redo Log](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-redo-log.html)说明未完成写入数据文件的修改如何在恢复时重放；[Binary Log](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/binary-log.html)则解释复制及备份后的增量恢复。binlog 不是记录所有 SELECT 的查询日志。

教学例子：转账的扣款与入账放在同一个有效事务中，失败时撤销；并发可见性由隔离机制决定，应用仍须表达余额非负等不变量。提交成功后能否抵御掉电，还受日志写入与刷盘设置、操作系统和存储语义影响，不能只凭“有 redo”就承诺任何配置下零丢失。

同样，数据库提交协调不会把外部 HTTP 或消息发送自动纳入一个原子事务。回答三类日志时，应把回滚、快照可见性、崩溃恢复和复制恢复依次对应，避免用一个“保证 ACID”盖过它们的不同边界。

延伸阅读：[事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)。

<details data-knowledge-key="async-job-queue">
<summary>（3）消息队列怎样保证可靠消费，并治理持续积压？</summary>
</details>

分开确认生产者到 Broker 的投递与消费者的业务提交，持久处理完成后再确认消息，并让重复投递不重复改变业务。积压时同时看进入速率、有效完成速率和最老消息年龄，定位慢依赖、失败重试或消费容量；下游已饱和时，盲目加消费者会放大故障。

以 RabbitMQ 作为教学例子，[确认与可靠性文档](https://www.rabbitmq.com/docs/confirms)将 publisher confirm 和 consumer acknowledgement 分开。业务提交成功、ACK 送达前断线，消息仍可能重投；可以用稳定事件 ID，让同一数据库内的去重记录与业务修改共同提交。外部支付、邮件等副作用仍需各自的幂等、查询或补偿合同，不能用 Broker 的成功响应证明业务只发生一次。

教学算例：每秒进入 120 条、有效完成 100 条，忽略其他变化时每秒净增 20 条。先区分消息等在队列、消费者本地，还是依赖调用中；若是坏消息不断重试，应隔离并保存原因，不能无限倒回原队列。若是可并行计算不足，再在分区、顺序和下游容量允许的范围扩容。

[RabbitMQ 对预取的说明](https://www.rabbitmq.com/docs/queues)指出，过多未确认交付会增加消费者和 Broker 的资源压力。预取与并发应有界，配合准入、退避和告警；还要跟踪队列年龄与任务成功，不能只看队列条数下降就认定恢复。原帖未给 Broker、拓扑或实测，以上不是作者实际部署。

延伸阅读：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

## 参考资料

- [LangGraph：Checkpointer 与 Store](https://docs.langchain.com/oss/python/langgraph/persistence)。
- [MySQL 8.4：Redo Log](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-redo-log.html)。
- [MySQL 8.4：Undo Logs](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-undo-logs.html)。
- [MySQL 8.4：Binary Log](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/binary-log.html)。
- [RabbitMQ：确认、可靠性与预取](https://www.rabbitmq.com/docs/confirms)。
