Agent 链路的 timeout 不能由每个组件各写一个“30 秒”。如果 Gateway、Agent、模型和工具各自从收到请求起重新计时，最坏耗时会层层相加；上游已经放弃后，下游仍可能继续消耗 token、占用 Worker，甚至提交用户不再需要的副作用。

更可靠的模型是一个绝对 deadline：入口根据产品 SLO 计算最终时刻，每一跳用“deadline 减当前时间”得到剩余预算，再扣除返回、持久化和清理预留。所有重试、排队和降级共享同一笔预算。

![客户端总预算沿 Gateway、Agent 和工具逐跳减少，每个节点检查绝对截止时间并传播取消，末尾保留清理与提交时间](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-timeout-budget-deadline-chain-v1.webp)
*图：剩余预算是每一跳的快照，不是给每个组件重新发一份完整超时。*

## Timeout、deadline 与预算

timeout 通常是持续时间，例如“最多等待 2 秒”；deadline 是绝对时间点，例如“在 03:10:05.420Z 前结束”。跨服务传递绝对 deadline 可以避免每跳重新起表，但必须使用可靠时钟并为时钟偏差留余量。进程内部计算耗时优先使用单调时钟，协议层再编码绝对值或剩余值。

[gRPC Deadlines Guide](https://grpc.io/docs/guides/deadlines/)指出，gRPC 默认不设置 deadline，客户端应该根据现实需求显式配置。服务端可以观察调用是否已经取消或 deadline 是否超过；某些实现会把 deadline 转成剩余 timeout 传播，以降低时钟偏差影响。

预算拆分可以写成：

~~~text
remaining = absolute_deadline - now
call_budget = remaining - response_reserve - durable_commit_reserve
if call_budget <= minimum_useful_window:
    stop before starting new work
~~~

最低有效窗口很重要：只剩 80ms 时启动一个通常需要 2 秒的模型调用没有意义。系统应快速返回超时或选择满足质量约束的更快路径。

## 从用户 SLO 反推

端到端预算来自产品承诺，不来自某个 SDK 默认值。假设交互式回答 P95 为 8 秒，可以先预留 500ms 网络与响应、500ms 状态提交，再给模型与工具分配 7 秒。若 Agent 最多有三个阶段，不能简单每阶段分 7 秒；应按关键路径、历史分位数和是否并行动态分配。

排队时间也消耗预算。任务在队列等待 6 秒后才被 Worker 获取，就只剩 2 秒；Worker 必须在获取租约时检查 deadline，而不是从执行开始重新计时。后台 Job 可以用更长 deadline，但仍要设置，因为无限任务会阻塞队列和资源回收。

## 传播与取消

[gRPC Cancellation Guide](https://grpc.io/docs/guides/cancellation/)说明取消会通知调用链，但应用处理函数仍要协作停止工作，并取消自己启动的子调用。具体语言的自动传播能力不同，不能只设置客户端定时器就假设数据库、浏览器和子进程都停了。

Agent runtime 为每个 Run 建立 cancellation token，并派生给模型流、工具调用、子 Agent 和沙箱进程。取消原因区分 client_cancelled、deadline_exceeded、policy_revoked、lease_lost 和 shutdown，便于决定是否保存检查点、补偿或报警。

取消不是回滚。已经发送的邮件、支付或发布动作不能因为上游断开就消失。对外部副作用使用 operationId 与幂等键，提交前再次检查 deadline，提交后把结果持久化。若响应超时但提交状态 unknown，进入对账而不是盲目重试。

## 重试共用一个 deadline

[gRPC Retry Guide](https://grpc.io/docs/guides/retry/)把重试定义为受策略约束的多个 attempt。Agent 平台还应显式限制：哪些状态可重试、最大次数、指数退避、jitter、单次 attempt 上限和总 deadline。重试一次不是额外获得一份预算。

例如还剩 3 秒，一个调用历史 P95 为 1.2 秒，可以尝试一次并保留提交时间；若失败后只剩 900ms，就不应再启动同类重试。Retry-After 超过 deadline 时直接结束。多层 SDK、网关和 Agent 不能分别重试，否则 attempt 会乘法放大。

## 分阶段与并行调用

阶段预算可以有软、硬两个边界。超过软边界时停止扩展检索或减少非关键工具，超过硬 deadline 时取消所有未完成工作。并行工具共享父 deadline，但每个子调用仍有更短局部上限，避免一个慢调用拖住整个 join。

并行结束策略需明确：等待全部、达到最小法定结果、取首个有效结果，还是在质量阈值满足后取消剩余。取消的子任务要真正释放连接和进程。聚合器预留结果验证与序列化时间，不能在 deadline 最后一毫秒才收到大响应。

## 流式与长任务

首 token timeout、token 间空闲 timeout 和整体 deadline 是三种不同信号。模型很快开始流式但持续十分钟，不代表满足整体 SLO；首 token 慢也不等同于总生成失败。流式响应记录 firstByte、lastChunk、idleGap 和客户端断开，并在断开时取消下游。

长任务采用 Job deadline、阶段 lease 和心跳。deadline 表示用户或业务不再需要结果，lease 表示当前 Worker 的所有权，它们不能混用。租约丢失时旧 Worker停止，任务若仍在 deadline 内可以由新 Worker从检查点恢复。

## 可观测性与验证

每个 Span 记录 absoluteDeadline、remainingAtStart、queueDelay、attempt、localTimeout、cancelReason 和 remainingAtEnd。指标关注超时发生层级、过期后继续运行时间、取消传播延迟、重试消耗比例和 deadline 前完成率。只记录“timeout error”无法定位预算是被排队、模型还是工具吃掉。

测试用虚拟时钟或可控慢依赖覆盖：队列耗尽预算、父取消传播、多层重试、服务端已提交后客户端超时、流式空闲、时钟偏差、租约丢失和清理预留不足。验收时断言过期工作不会继续新副作用，资源会在限定时间内释放。

## 小结

端到端超时是一笔沿关键路径递减的预算。入口计算绝对 deadline，每跳扣除已用与必要预留，所有排队、并行、重试和降级共用它；取消要传播到真实工作，而外部副作用仍需幂等与对账。这样系统才能做到“用户放弃后，成本和风险也及时停止”。

## 参考资料

- [gRPC：Deadlines](https://grpc.io/docs/guides/deadlines/)
- [gRPC：Cancellation](https://grpc.io/docs/guides/cancellation/)
- [gRPC：Retry](https://grpc.io/docs/guides/retry/)
