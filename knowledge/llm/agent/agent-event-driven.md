事件驱动 Agent 把长任务拆成可持久化、可重放、可由不同 worker 处理的状态变化。它适合审批等待、后台研究、外部回调、并行工具和跨服务编排；代价是必须明确消息意图、交付语义、去重、顺序与关联方式。

## 命令、事件与查询不要混用

命令表达“请某个能力做事”，可能被接受或拒绝；事件表达“某件事已经发生”，不应命名一个必须执行它的接收者；查询请求当前信息，不应偷偷产生副作用。三者可以使用同一 broker，却需要不同命名、权限和重试策略。

例如 `GenerateReport` 是命令，`ReportGenerated` 是事件，`GetReportStatus` 是查询。把命令伪装成事件会让多个消费者误执行；把事件当任务队列又会失去事实广播与独立投影能力。

## 事件信封先于业务数据

[CloudEvents 规范](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/spec.md)提供统一事件上下文，要求 `id`、`source`、`specversion` 和 `type` 等属性，并说明相同 `source + id` 可被视作重复。业务 payload 放在 `data`，schema 版本、时间和内容类型放在明确字段。

```json
{
  "specversion": "1.0",
  "id": "evt_01J...",
  "source": "/agents/research/run_42",
  "type": "com.example.agent.tool.completed.v1",
  "subject": "call_17",
  "time": "2026-07-16T03:00:00Z",
  "datacontenttype": "application/json",
  "data": { "resultRef": "obj_abc", "runVersion": 8 }
}
```

event ID 标识这一个事实；correlation ID 关联同一业务流程；causation ID 指向导致当前事件的上一个消息。三者不能合并：同一流程包含许多唯一事件，重放时又要保留因果链。

![事件驱动 Agent 用标准事件信封进入持久队列，经 source 与 id 去重后更新状态投影，并把重试失败转入死信队列](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-event-driven-async-correlation-v1.webp)
*图：交付按至少一次设计，消费者依靠幂等效果与去重表抵御重复，而不是假设 exactly once。*

## 至少一次与幂等消费者

生产者写入成功但没收到确认、broker 重新投递、消费者处理成功后确认丢失，都可能产生重复。系统应公开声明 delivery contract。常见的“至少一次”意味着消息不会轻易丢，但消费者可能多次看到同一事件。

消费者在同一事务中检查 `(source, id)` 去重记录、验证 state version、写业务变化和标记已处理。单纯先查再写存在竞态，需要唯一约束或条件更新。外部副作用还要使用稳定 operation/idempotency key；本地去重表无法阻止远端已执行却回执丢失。

[CloudEvents Primer](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/primer.md)解释了 source、id 与重复处理等设计背景。规范统一事件格式，但不承诺 broker 的 exactly-once 交付；传输和应用语义仍需系统自己定义。

## 顺序、版本与状态投影

全局顺序昂贵且通常没有必要。可按 run ID 或 aggregate ID 分区，保证同一实体内相对顺序；跨实体流程使用显式依赖和 join。每个状态事件携带 `expectedVersion`，投影仅在当前版本匹配时应用。较旧事件进入 stale/duplicate 路径，缺口则等待、补拉或触发修复。

事件存储是事实流，projection 是便于读取的派生状态。消费者升级后可从历史重建新投影，但必须固定 schema 与变换版本。事件一旦发布不原地修改；需要纠错就发布补偿/更正事件。

## 异步消息与 Agent 状态

审批、外部 webhook 和工具结果到达时间不可预测。[Temporal 的 Workflow message passing 文档](https://docs.temporal.io/encyclopedia/workflow-message-passing)讨论 Signal、Update 和 Query 等向长运行 workflow 传递消息的方式。无论使用 workflow 引擎还是 broker，处理器都应先验证 run/tenant/call ID、当前状态和消息版本，再迁移状态。

“工具完成”事件不应直接触发模型。它先进入持久收件箱，完成 schema、来源、重复、权限和状态检查，然后写入已验证 observation，再由调度器决定是否开启下一轮。这样突发回调不会造成并发模型调用互相覆盖。

## Retry、DLQ 与重放

错误分为暂时性、永久性和毒消息。暂时性错误按指数退避与 jitter 重试；schema 不兼容、权限拒绝或业务不变量失败通常直接进入隔离队列。达到最大尝试次数后进入 DLQ，保留原事件、错误分类、消费者版本和尝试历史。

DLQ 不是垃圾桶。运维者先修复根因，再以新 event ID 重放，并保留 original ID/correlation。若沿用原 ID，消费者去重会忽略；若直接修改原事件，则审计链断裂。重放前评估副作用幂等性和当前状态，避免旧命令在新现实中生效。

## 事件契约与演进

事件 type 包含稳定业务含义，schema 使用兼容演进：新增可选字段、保持旧字段语义、不改变单位和枚举含义。破坏性变化发布新 type/version，并在迁移期让消费者明确订阅版本。生产者契约测试与消费者契约测试都要进入 CI。

payload 只携带必要数据。大文档使用不可变对象引用、hash、权限范围和过期时间；消费者读取时重新授权。不要把密码、token、整段提示或用户隐私复制到每个事件和日志。

## 测试与观测

测试重复、乱序、延迟、丢确认、消费者崩溃、分区再平衡、schema 升级、DLQ 重放和跨租户伪造。断言最终投影一致、一个副作用最多生效一次或可对账，并且任何未知状态都不会被当成成功。

指标包括生产/消费 lag、重复率、stale 事件、重试放大、DLQ 深度、投影版本缺口和端到端 correlation 延迟。trace 通过 event/correlation/causation ID 连接生产者、broker、消费者、状态迁移和后续结果事件。

## 常见误区

- 用一个 `messageId` 同时承担事件身份与业务关联；
- 假设 broker 提供 exactly once，所以消费者不做幂等；
- 所有消息都命名为 `AgentTask`，无法判断事实还是命令；
- 出错无限立即重试，造成队列风暴；
- DLQ 修复后原样重放非幂等命令；
- 让迟到事件覆盖更高版本状态；
- 在事件里散播凭证和大段敏感正文。

## 小结

事件驱动编排把等待和跨服务协作变成持久事实流。标准信封提供身份与类型，correlation 建立业务链，至少一次交付要求去重和幂等，版本化投影抵御乱序，Retry/DLQ 支持可审计恢复。只有明确这些契约，异步 Agent 才不会把“最终到达”变成“重复执行”。

## 参考资料

- [CloudEvents — Specification](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/spec.md)
- [CloudEvents — Primer](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/primer.md)
- [Temporal — Workflow message passing](https://docs.temporal.io/encyclopedia/workflow-message-passing)
