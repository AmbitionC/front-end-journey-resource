多智能体系统中的消息既要承载业务内容，也要表达身份、因果、版本与交付状态。最危险的误解是把“消息已收到”当成“任务已完成”，或把重复消息当成新的指令再次执行副作用。

## 事件、命令与结果

先区分三类语义：命令请求某个 Agent 做事；事件陈述已经发生的事实；结果回应某次任务。它们可以经过同一队列，但重试、权限和完成语义不同。`SendEmail` 命令的重复可能有副作用，`EmailSent` 事件应是不可变事实，结果则要关联原命令。

[CloudEvents 规范](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/spec.md)把 event 与承载它的 message 分开，并定义 `id`、`source`、`specversion`、`type` 等上下文属性；`source + id` 可用于识别重复事件。Agent 协议可借用这种 envelope，而不是把路由信息混入自然语言正文。

![Agent A 通过带消息 ID、关联 ID、因果 ID、类型和版本的信封向 Agent B 发送消息，接收确认、任务状态和结果分属不同通道，重复与迟到结果单独处理](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-multi-agent-messaging-protocol-state-v1.webp)
*图：Received 只确认接收；Pending/Running/Done 与 Result 需要独立状态。*

## 一个可审计的消息信封

```json
{
  "messageId": "msg-01",
  "conversationId": "conv-7",
  "correlationId": "task-42",
  "causationId": "msg-00",
  "source": "agent://planner",
  "target": "agent://researcher",
  "type": "task.requested",
  "schemaVersion": "1.2",
  "planVersion": 5,
  "sentAt": "2026-07-16T10:00:00Z",
  "expiresAt": "2026-07-16T10:05:00Z",
  "contentType": "application/json",
  "data": {}
}
```

`messageId` 标识这一次消息；`correlationId` 把请求、进度和结果归为同一任务；`causationId` 形成因果链；`schemaVersion` 支持演进；`planVersion` 防止迟到结果污染新计划。正文 `data` 仍要按 schema 校验并视为不可信输入。

[CloudEvents Primer](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/primer.md)解释了 context attributes、事件唯一性与传输绑定。敏感数据不应为了路由方便出现在可广泛索引的 context 字段中；只放最小标识，详细内容使用受控引用。

## 请求/响应与通知

[JSON-RPC 2.0](https://www.jsonrpc.org/specification)用请求 `id` 关联响应；notification 没有 `id`，接收方不返回响应。这个规则揭示了一个通用选择：如果发送方需要知道任务结果，就必须保留可关联标识；fire-and-forget 不能事后假装拥有完成保证。

对长任务，推荐分离：

1. `task.requested`：命令被接受或拒绝；
2. `task.status.changed`：pending/running/blocked/done；
3. `task.result.published`：结构化结果与证据；
4. `task.cancel.requested` / `task.cancelled`：请求取消与确认取消。

ACK 只说明 broker 或 Agent 接收了消息。AWS 的[异步通信指导](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/asynchronous.html)也强调 callback、claim check、重试、死信和幂等处理等独立问题；消息系统不能替业务状态机决定成功。

## 交付语义与去重

实际系统多为 at-least-once：消息可能重复，但不轻易丢。消费者用 `source + messageId` 去重，并为有副作用命令使用业务幂等键。去重表要有保留周期；超过窗口的迟到重复仍可能重新出现，因此业务对象还需要唯一约束或操作账本。

“exactly once”通常只是某一边界内的效果承诺，不代表网络只传一次。Agent 应把传输 ACK、消费提交和业务副作用三件事分别记录。

## 顺序、并发与状态同步

全局顺序昂贵且通常不必要。按 `conversationId` 或资源 ID 分区，只保证相关消息的局部顺序；不同任务可并行。每次状态更新带 `expectedVersion`，接收方使用 compare-and-set：版本不匹配时拒绝覆盖并进入 reconcile。

多 Agent 不应通过互相转发完整聊天历史同步状态。共享权威账本保存任务状态，消息只携带变化和引用。若采用事件溯源，current view 是事件折叠结果；修正通过新事件而不是改写旧事件。

## 兼容性与安全

schema 演进遵循向后兼容：新增可选字段，旧消费者忽略未知字段；破坏性变更使用新 type 或 major version。消费者根据 schemaVersion 解析，不能让模型猜字段含义。

消息必须认证来源并授权目标；数字签名能证明完整性，却不能证明内容安全。来自外部 Agent 的文本、URL、工具结果仍可能提示注入。执行前重新做权限、参数和策略校验。消息日志按数据分类脱敏，避免把令牌和用户内容复制到每个队列与 trace。

## 故障与测试

测试重复、乱序、迟到、丢 ACK、消费者崩溃、同 key 不同参数、旧 schema、取消与结果交叉、死信重放。关键断言：ACK 不推进 done；重复命令只有一个业务效果；旧 planVersion 不覆盖新状态；无法解析的版本进入隔离队列；重放不绕过当前权限。

监控队列深度、消息年龄、重复率、死信率、状态停留时间、迟到结果、版本冲突和 correlation 缺失。分布式 trace 使用 messageId/correlationId 关联，但避免把完整正文放进 span 属性。

## 小结

多智能体通信是一套协议与状态机：类型化信封表达身份、因果和版本；ACK、任务状态与结果相互分离；at-least-once 通过去重和幂等吸收；局部顺序和版本检查保护共享状态；安全校验在消费边界重新执行。这样消息才是可追踪协作，而不是互相发送自然语言的黑箱。

## 参考资料

- [CloudEvents — Specification](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/spec.md)
- [CloudEvents — Primer](https://github.com/cloudevents/spec/blob/ce@stable/cloudevents/primer.md)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [AWS — Asynchronous communication](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/asynchronous.html)
