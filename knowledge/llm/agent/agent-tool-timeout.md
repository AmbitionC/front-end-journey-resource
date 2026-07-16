工具超时只说明调用方在某个期限内没有得到可用结果，不说明远端操作失败，更不说明副作用已回滚。安全的超时设计要同时管理全局 deadline、单次 attempt、取消请求、执行状态查询、幂等重试和迟到结果对账。

## Deadline 与 Timeout 的层次

全局 deadline 是整个用户任务最晚结束时间；attempt timeout 是单次工具等待上限；连接、首字节和读取还可有更细 timeout。所有子预算必须落在全局剩余时间内：

```text
remaining = globalDeadline - now
attemptTimeout <= remaining - validationReserve - responseReserve
```

只给每次请求固定 30 秒，却允许无限重试，会超过用户真正 deadline。每轮开始重新计算 remaining，时间不足以完成退避、调用、验证和回复时直接停止或升级。

## Abort 是请求，不是事实

[WHATWG DOM 关于 abort ongoing activities 的规范](https://dom.spec.whatwg.org/#aborting-ongoing-activities)定义了 `AbortSignal`、abort reason 和 API 对 abort 的响应机制。它传递的是取消意图；具体 API 可能在不同阶段观察到信号，远端服务也可能已经提交或根本不支持取消。

因此状态至少区分 `timeout_observed`、`cancel_requested`、`cancelled_confirmed`、`committed` 与 `unknown`。本地 Promise 抛出 `AbortError` 只能证明本地等待结束，不能把订单标为“未创建”。

![工具调用在全局期限和尝试预算内执行，超时后请求取消并查询已取消、已提交或未知状态，只有幂等且时间充足才退避重试](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-timeout-deadline-retry-v1.webp)
*图：取消不是回滚；已提交和迟到结果进入获取/对账，未知状态进入隔离或人工处理。*

## 为副作用建立 Operation ID

调用写工具时先生成稳定 `operationId/idempotencyKey`，相同业务意图的重试复用 key。服务端在原子边界内记录 key、参数 hash、状态与结果：同 key 同参数返回原状态；同 key 不同参数拒绝冲突。

提供 `GET operation/{id}` 或等价查询，返回 `not_started`、`running`、`committed`、`cancelled`、`failed`、`unknown`。客户端超时后优先查询，而不是创建新 ID 再发一次。若服务不支持幂等和状态查询，高风险非幂等写应在超时后进入人工对账。

## 什么时候可以自动重试

[RFC 9110 的 Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)解释了幂等语义，并限制客户端在不知道重复是否安全时自动重试非幂等请求。HTTP method 是提示，不是完整业务证明：服务端错误实现的 PUT 仍可能非幂等，带幂等键的 POST 反而可以安全重复。

重试前同时满足：错误被分类为暂时性；操作幂等或有可靠 dedupe；未确认已提交；attempt 未超限；全局时间足够；策略允许。授权拒绝、schema 错误和业务冲突通常不因等待而恢复，应修参、重新授权或停止。

## Backoff、Jitter 与 Retry-After

立即同步重试会放大故障。[AWS Retry with backoff 指南](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)描述了指数退避、幂等考虑和 jitter。常见 full jitter：

```ts
const cap = Math.min(maxDelayMs, baseMs * 2 ** attempt);
const delay = Math.random() * cap;
```

若服务返回可信 `Retry-After`，将其与全局 deadline、最大 delay 一起约束。Jitter 分散客户端重试波峰，但不能修复永久错误。每次等待也消耗任务预算，排队时间应计入 deadline。

## Cancel 后的三路状态

取消请求后查询状态：

- **cancelled**：确认远端没有/不再产生效果，可在幂等与时间 guard 通过后重试；
- **committed**：获取原结果并验证，不重复执行；
- **unknown**：隔离任务，持续对账或转人工，不宣称成功/失败。

有些系统只能做到 best-effort cancel。API 应返回 cancellation receipt 或最终 operation state，而不是布尔 `cancelled=true` 掩盖竞态。工具执行到不可取消的提交点后，应明确返回 too-late/committed。

## 迟到结果如何处理

本地停止等待后，旧 attempt 仍可能回调。结果带 operation/call ID、attempt 和 state version，进入 reconcile inbox。若它证明同 operation 已提交，就更新操作账本并阻止重试；若当前 run 已终止，保存审计并按业务决定通知或补偿，不能直接写入旧 Agent 上下文。

迟到结果不是天然无效，也不是天然可信。它仍需完整 schema、来源、策略和新鲜度验证。相同 operation 多个冲突结果触发异常，不能按“最后到达覆盖”。

## 与 Agent 工具层结合

[OpenAI Agents SDK tools 文档](https://openai.github.io/openai-agents-python/tools/)展示了当前工具调用与超时相关配置的实现入口。SDK timeout 主要约束本地调用生命周期；应用仍需为远端副作用定义 operation ID、状态查询和对账协议，不能把框架异常直接翻译成“工具没有执行”。

工具契约返回稳定错误字段：`code`、`retryable`、`operationStatus`、`retryAfterMs`、`operationId`。`SIDE_EFFECT_STATUS_UNKNOWN` 必须覆盖普通网络 timeout，防止模型看到“超时”后自行再次调用。

## 批量与并行调用

并行工具共享全局 deadline，但每个有独立 attempt budget。取消父任务时向所有 children 发 cancel，随后逐一收集 confirmed/committed/unknown；不能因为主 Promise 结束就认为资源已释放。

批量操作最好为每项分配 child operation ID，并返回 per-item 状态。部分成功时只对明确未开始且可幂等的 item 重试，已提交项进入结果聚合，未知项进入查询。

## 测试与可观测性

故障注入覆盖连接前超时、请求到达后断线、提交后回执丢失、取消与提交竞态、状态查询超时、重复 key、相同 key 不同参数、迟到成功和 retry storm。断言不会因本地 timeout 重复产生副作用。

记录 global deadline、attempt、timeout 阶段、cancel request/receipt、operation state、idempotency key hash、backoff、late result 和 reconcile outcome。指标包含 timeout 率、确认取消、已提交、unknown、重试成功、重试放大、迟到结果、重复副作用和 deadline 违约。

## 常见误区

- 捕获 AbortError 后标记远端失败；
- 每次重试生成新 idempotency key；
- 非幂等写 timeout 后自动换工具重做；
- attempt timeout 独立于全局 deadline；
- 所有错误都指数退避，包括权限和参数错误；
- 忽略迟到结果或直接覆盖当前状态；
- cancel API 返回已接收，就宣称已回滚；
- 并行父任务结束后不清理和对账子任务。

## 小结

超时是观察边界，不是远端事实。全局 deadline 约束所有尝试，Abort 只发送取消意图，operation ID 与状态查询确定副作用真实状态。只有幂等、错误可恢复且时间充足才退避重试；已提交和迟到结果要获取验证，未知状态要隔离对账。这样系统才能停止等待，而不制造重复行动。

## 参考资料

- [WHATWG DOM — Aborting ongoing activities](https://dom.spec.whatwg.org/#aborting-ongoing-activities)
- [RFC 9110 — Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)
- [AWS Prescriptive Guidance — Retry with backoff](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)
- [OpenAI Agents SDK — Tools](https://openai.github.io/openai-agents-python/tools/)
