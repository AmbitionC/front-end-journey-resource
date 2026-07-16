Agent 会因超时、重连、队列至少一次投递、重规划和人工恢复而重复执行同一动作。幂等性让这些重复请求产生一次业务效果，但它不是“请求只发送一次”，也不等于数据库没有任何额外日志。

## 先定义业务意图

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)将幂等方法定义为：多个相同请求在服务端的预期效果与一次相同。PUT、DELETE 和安全方法具有标准幂等语义，但实际 API 的业务动作仍需仔细设计；POST 也可通过应用契约变为可安全重试。

Agent 操作通常需要 caller 提供 idempotency key，并把它绑定到同一意图：

```ts
type IdempotentRequest = {
  principalId: string;
  operation: string;
  target: string;
  idempotencyKey: string;
  intentHash: string;
  payload: unknown;
};
```

`intentHash` 由规范化后的业务参数计算。相同 key + 相同 intent 是重放；相同 key + 不同 intent 必须拒绝，不能返回第一次结果掩盖调用方错误。

![客户端以 Caller ID、Idempotency Key 与 Intent Hash 请求服务，服务在原子边界内通过操作账本区分 New、Running、Succeeded、Failed；重复成功请求重放语义结果，不同意图拒绝](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-idempotency-operation-ledger-v1.webp)
*图：重复和迟到请求汇聚到同一 ledger entry，外部 Side Effect 只发生一次。*

## 操作账本

[AWS Builders' Library](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)详细讨论 caller-provided request identifier、语义等价响应、迟到请求和“同一 ID 不同意图”。典型账本以 principal + key 为唯一键，保存 intent hash、状态、结果引用、资源 ID、创建/完成时间和过期策略。

状态机：

- `NEW`：原子预留 key，记录意图；
- `RUNNING`：操作已接管，重复请求返回进行中或等待；
- `SUCCEEDED`：返回首次成功的语义结果；
- `FAILED_RETRYABLE`：允许同一执行者按策略恢复；
- `FAILED_TERMINAL`：重放同一终态错误，或要求新 key/新意图。

HTTP 状态码和响应时间可以不同，但业务含义保持等价。创建资源后重放可返回当前资源状态，不必逐字节复刻第一次响应。

## 原子边界

最危险的窗口是“副作用已发生，账本没记录成功”，或“账本记录成功，副作用没发生”。AWS 文章强调记录 idempotency token 与相关 mutation 需要满足原子/一致性边界。能在同一数据库事务内完成时，用唯一约束 + 事务；跨服务时使用 transactional outbox、状态机和对账。

不要先查再写：两个并发请求都查到不存在，然后各自执行。用原子 insert-if-absent 争夺 ownership；只有获胜者执行，其余读取账本。

## 外部副作用

调用支付、邮件、云资源等外部服务时，把自己的 operation ID 作为下游幂等键；保存下游资源 ID。若下游不支持幂等，用单线程队列、业务唯一约束或发送前/后对账降低风险，但不能宣称严格 exactly-once。

超时后状态为 unknown，先查询下游。重复执行前要证明原操作未生效。即使 GET/查询是幂等的，也要限制频率与权限。

## Intent 规范化

Hash 前固定字段顺序、数字/金额单位、时区、默认值、Unicode 和集合排序。附件用内容 hash，不只文件路径；收件人大小写/别名按业务规则规范化。不要包含 trace ID、时间戳等每次变化但不影响业务意图的字段。

有些参数确实改变意图：金额、收件人、正文、目标资源、审批版本。相同 key 出现这些变化时返回 parameter mismatch，提示调用方创建新 key 并重新审批。

## Key 生命周期

Key 唯一范围至少包含 principal/tenant 和 operation，防止不同用户碰撞。key 不可预测不是安全边界，授权仍独立执行。保留期覆盖最大重试、消息延迟、离线恢复和业务争议窗口；过早回收会让迟到请求变成新动作，永久保留又增加存储和隐私成本。

归档后可保留紧凑 tombstone 或业务资源唯一约束。服务应公开保留语义，调用方不能假设 key 永久有效。

## Agent 工作流中的应用

每个有副作用的 tool call 由 orchestrator 生成 operation ID，并跨模型重试、Subagent、队列和恢复保持不变。重规划如果参数改变，生成新 intent/key；只因网络重试则复用原 key。

幂等不替代审批：重放仍检查 token 是否允许读取结果，但不应要求用户为同一已批准且未改变的动作重复确认。审批 hash 与 intent hash 对齐最清晰。

## 测试与观测

并发发送相同 key，注入事务前后崩溃、网络响应丢失、重复消息、迟到请求、同 key 不同参数、账本过期和下游 unknown。断言只产生一个资源/发送/扣款，重复响应语义一致，mismatch 被拒绝，恢复能完成或对账。

记录 operation ID、principal、intent hash、账本状态、owner attempt、下游 ID 和重放次数；不要记录秘密 payload。指标包括 dedupe 命中、并发竞争、mismatch、unknown 时长、过期后迟到、账本存储和重复副作用事件。

## 小结

幂等性是一份服务端契约：调用方用稳定 key 表达同一意图，服务以原子账本接管一次执行，重复请求读取进行中或语义结果，相同 key 的不同意图明确拒绝。跨服务时把 operation ID 贯穿下游并对账，才能让 Agent 的重试和恢复不制造第二次副作用。

## 参考资料

- [RFC 9110 — Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [AWS Builders' Library — Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
