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

![Agent 幂等性靠服务端的操作账本。首次请求、网络重试、迟到或重复投递的请求，以及同一个 key 但意图已变的请求，都汇到同一处原子抢占：用 insert-if-absent 预留 key，key 的唯一范围包含租户、operation 和 key 本身，并比对 intentHash。抢到的请求在账本里从 NEW 进入 RUNNING，之后结束于 SUCCEEDED、FAILED_RETRYABLE 或 FAILED_TERMINAL。重复请求读账本：状态是 RUNNING 时返回进行中或等待；SUCCEEDED 时重放首次的语义结果；同一 key 而意图不同时拒绝，返回 parameter mismatch。调用外部服务时把自己的 operation ID 当作下游幂等键，并保存下游资源 ID；超时后状态是 unknown，要先查下游，证明原操作没生效才能重做；下游不支持幂等时，用单线程队列、业务唯一约束或发送前后对账降低风险。不要先查再写，两个并发请求都查到不存在就会各执行一次，要用原子插入争夺 ownership](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-idempotency-ledger-v2.dark.png)
*图：重复和迟到请求汇聚到同一账本，在同库原子事务内一起提交业务效果与账本记录。跨外部系统仍需下游幂等与结果对账，不能仅凭占位或唯一 owner 保证一次效果。*

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

## 练一练

### 高频考点题 1：同 key 不同意图

同一个 idempotency key 第二次请求时，金额从 100 变成了 200。服务端应该？

- A. 当作重放，直接返回第一次执行时的结果
- B. 当作新请求，再执行一次 200 元的操作
- C. 拒绝，同一个 key 不能绑定不同的意图
- D. 用新金额覆盖原记录，并重新执行一遍

**答案：C。** key 要绑定规范化业务参数算出的 intentHash。相同 key 加相同意图才是重放。

### 高频考点题 2：先查再写

幂等检查写成「先查 key 是否存在，不存在就执行」。问题在哪？

- A. 查询太慢，会增加接口延迟
- B. 没有问题，这是标准做法
- C. 数据库会被大量的查询请求压垮，进而造成雪崩
- D. 并发请求都查到不存在，各执行一次

**答案：D。** 要用原子的 insert-if-absent 或唯一约束预留 key，再进入执行。

### 高频考点题 3：调用下游支付

Agent 调用外部支付服务时，幂等应该怎么传递？

- A. 每次重试都生成一个新的随机 ID
- B. 只在第一次调用时传，重试时就不传了
- C. 不需要传，下游服务自己会判断请求是否重复
- D. 用自己的 operation ID 作下游幂等键

**答案：D。** 超时后状态为 unknown，先查询下游，证明原操作未生效才能再执行。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯 AI 后端实习面经：编排、重试与知识库更新](../../../interview/tencent/ai/tencent-ai-19.md)
- [阿里 Token Foundry AI 应用研发一面：Critic、上下文与幂等](../../../interview/alibaba/ai/alibaba-ai-17.md)
- [海康威视 AI Agent 开发一面：可靠工具与任务状态](../../../interview/hikvision/ai/hikvision-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [RFC 9110 — Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [AWS Builders' Library — Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
