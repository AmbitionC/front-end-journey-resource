### 拼多多提前批一面：Agent 超时、消息可靠性与线上排障

以下短答与教学示例由编辑补充，不代表原作者的现场回答、实际架构或实测结果。

公司为拼多多，场景为提前批秋招一面；具体岗位、部门及面试日期未注明。正文自述介绍了 CR Agent 项目，并在面后约到二面；本页只整理实际可见的一面问题。

选录 Agent/LLM 超时、消息可靠性、缓存一致性、线上接口变慢四组。自动售卖机建模、跨技术栈学习和最大子数组和均有已见题目库存，本页未展开。

<details data-knowledge-key="agent-tool-timeout">
<summary>（1）Agent 与 LLM 超时怎样处理？</summary>
</details>

先分清全任务 deadline、单次模型或工具调用的等待上限，以及超时是否已产生外部效果。仅对可恢复且重复安全的操作做有限退避重试，并共享剩余预算；有副作用的调用结果未知时，先查状态或对账，再决定恢复。

教学例子：模型生成超时可在总预算内重试；如果它此前已经请求创建工单，本地超时不能证明工单没创建。应复用操作标识查询原结果，避免重新创建第二张。

技术核对：[AWS：退避重试与幂等要求](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)。

知识导航：[工具超时、取消与重试](../../../knowledge/llm/agent/agent-tool-timeout.md)。

<details data-knowledge-key="async-job-queue">
<summary>（2）消息顺序、重复消费和丢失应怎样分别处理？</summary>
</details>

先定义顺序只需同一业务键还是全局，再按该边界串行处理或校验事件版本。生产确认和消费确认分别覆盖不同链路；业务提交后再确认，崩溃仍可能重投，因此稳定事件标识、唯一约束与同库事务要吸收重复。具体 Broker 的配置和故障保证另行核对。

教学例子：订单的创建、支付事件按同一订单键保持因果顺序；消费者提交状态后、ACK 前崩溃，重投时识别已处理事件并返回原结果。不能先确认消息再异步写业务，也不能把 Broker 确认当成业务完成。

技术核对：[RabbitMQ：确认与重投](https://www.rabbitmq.com/docs/confirms)、[RabbitMQ：消息顺序](https://www.rabbitmq.com/docs/queues#message-ordering)。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

<details data-knowledge-key="redis-cache">
<summary>（3）数据库与缓存的一致性怎样保证到约定范围？</summary>
</details>

先约定权威数据和允许的旧值窗口。常见旁路缓存在数据库提交后失效缓存，对失效失败保存可重试记录，并用版本或 TTL 帮助收敛；旧读请求晚回填仍可能带回旧值。强约束业务动作应在权威事务中核验，不能把延迟双删或 TTL 说成跨系统强一致证明。

教学例子：A 读到数据库旧版本后停顿，B 更新数据库并删缓存，A 随后回填旧值。这说明“先写库再删缓存”仍有竞态；关键校验读权威状态，展示缓存则按约定版本和过期策略处理。

技术核对：[Azure：Cache-Aside 不自动保证一致性](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

<details data-knowledge-key="logging-monitoring">
<summary>（4）接口平均耗时从 200ms 变成 5s 且 CPU 飙升，怎样排查？</summary>
</details>

先确认影响范围、时间线、流量和最近变更，必要时限流或回滚止损。把总耗时拆成排队、应用 CPU 与 DB、Redis、ES 等依赖耗时，结合 Trace、慢查询、连接池和 CPU 剖析验证瓶颈；CPU 高本身不能证明数据库就是根因。每个假设都应有前后对照。

教学例子：Trace 显示请求主要在应用内消耗 CPU，剖析又指向一次新增的重复序列化，才形成可验证的修复方向；若主要是下游等待，应转查该依赖。原题数字是给定场景，不是作者项目的实测事故记录。

技术核对：[OpenTelemetry：可观测性与请求路径](https://opentelemetry.io/docs/concepts/observability-primer/)。

知识导航：[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)。
