事件存储、事务 outbox 和消息队列经常被混成一个概念。事件存储保存领域事实并可重建状态；outbox 解决“业务状态和待发布消息如何原子记录”；消息系统负责把记录交付给消费者；投影则把事件转换为适合查询的读模型。边界分清，重放和故障恢复才不会重复执行真实副作用。

![事件存储、事务 Outbox、消息投递和幂等投影的写入与重建流程](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/event-store-outbox-rebuild-flow-v1.webp)
*图：领域事件按聚合追加，outbox 与业务写同事务提交；投影按事件 ID 去重，重建使用隔离的回放通道。*

## 事件是事实，不是调试日志

事件应使用完成时命名，如 `OrderPlaced`，表达已经发生且不可撤回的领域事实。它至少包含 eventId、aggregateId、aggregateVersion、eventType、schemaVersion、occurredAt、actor 和 payload。命令 `PlaceOrder` 可以失败，事件只在命令通过规则后追加。

[Azure Event Sourcing 模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)描述了以追加事件作为权威状态、通过重放得到当前状态的做法。事件一旦发布就不原地修改；业务纠错用补偿事件，隐私删除则需要从设计上采用 tokenization、加密擦除或可治理的载荷引用。

## 聚合流与乐观并发

每个聚合是一条有序事件流。处理命令时读取当前版本，计算新事件，并以 `expectedVersion` 追加：若另一请求已先提交，条件写入失败，调用方重新读取和判断。这比“最后写入覆盖”更能保护领域规则。

```text
load(order-42) -> version 7
decide(command, state) -> [ItemAdded]
append(order-42, expected=7) -> version 8
```

全局顺序通常没有必要且昂贵；聚合内顺序、唯一 eventId 和可追踪的全局位置足以驱动多数投影。跨聚合不变量需要重新划定事务边界，或采用预留、Saga 和补偿，而不是假设多个事件流天然原子。

## 快照只是性能优化

重建聚合时按版本重放所有事件。流很长时可保存 snapshot：包含聚合状态、最后事件版本和生成代码版本，之后只重放增量。快照损坏或过期时必须能回到完整事件流，因此它不是权威记录。

事件 schema 会长期存在。读者按 schemaVersion 使用 upcaster 把旧载荷转换为当前内部形状，或同时支持多版本。不要在重放时查询今天的外部价格、权限或配置，否则历史结果不再确定；事件应携带当时决策所需的事实或其不可变引用。

## Outbox 解决双写

传统流程“先提交订单，再发送消息”在中间崩溃会丢消息；“先发消息，再提交订单”又可能让消费者看到不存在的订单。事务 outbox 把业务数据与一条待发布记录写进同一数据库事务，提交后由 relay 或 CDC 发布。

[Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)展示了 CDC 捕获 outbox 行并按字段路由消息的实现。outbox 表通常保存 id、aggregateType、aggregateId、type、payload 和 createdAt。它保证记录与业务状态共同提交，但不保证下游只收到一次；发布器重试可能重复，因此消费者仍需幂等。

事件溯源系统有时直接从 event store 订阅，不一定再建 outbox；普通 CRUD 系统则常用 outbox 生成集成事件。领域事件和对外集成事件也不必一一相同：后者应隐藏内部细节、稳定版本并符合消费者契约。

## 幂等投影与重放

投影消费事件后更新搜索索引、统计表或查询模型。每个投影保存 checkpoint，并在同一事务内写目标状态和已处理 eventId，保证崩溃恢复不会重复累计。可交换的“设置当前值”通常比“在旧值上 +1”更容易幂等，但仍需处理事件顺序。

重建时创建新版本投影，例如 `orders_v2`，从起点回放、追平实时增量、校验行数与业务摘要，再原子切换读别名。不要清空线上表后原地慢慢重放。邮件、支付、Webhook 等副作用消费者默认不参与重放；若确实需要，必须通过 operationId 查询幂等账本。

## 可观测与治理

至少监控追加冲突率、outbox backlog、发布延迟、消费者 lag、死信、投影 checkpoint 和事件反序列化失败。追踪从 commandId 关联 causationId 与 correlationId，但不能用链路追踪替代持久事件身份。

测试覆盖同一命令并发、append 后崩溃、消息重复和乱序、旧 schema 重放、snapshot 丢失、投影重建切换以及副作用隔离。能够从空库确定性重建读模型，并证明不会再次发邮件或扣款，才算真正具备事件存储的恢复能力。

## 参考资料

- [Microsoft Azure Architecture Center：Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- [Debezium：Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
