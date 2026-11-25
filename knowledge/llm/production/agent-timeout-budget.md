Agent 链路的 timeout 不能由每个组件各写一个“30 秒”。如果 Gateway、Agent、模型和工具各自从收到请求起重新计时，最坏耗时会层层相加；上游已经放弃后，下游仍可能继续消耗 token、占用 Worker，甚至提交用户不再需要的副作用。

更可靠的模型是一个绝对 deadline：入口根据产品 SLO 计算最终时刻，每一跳用“deadline 减当前时间”得到剩余预算，再扣除返回、持久化和清理预留。所有重试、排队和降级共享同一笔预算。

![Agent 链路的超时是一笔沿路径递减的预算。上排从用户 SLO 反推：交互式回答 P95 为 8 秒，预留 0.5 秒网络与响应、0.5 秒状态提交，剩下 7 秒给模型与工具，排队、重试和并行都从这 7 秒里出，图中宽度是示意，不按比例。中排是每一跳都用同一个绝对 deadline 计算剩余预算：Gateway 算出绝对 deadline 并随请求往下传；Agent 用截止时间减去现在得到剩余预算，再扣掉响应和提交的预留；模型调用把首 token 超时、空闲超时和总 deadline 三种信号分开；工具在提交前再查一次 deadline，副作用带幂等键。deadline 向下传播，取消也沿链路向下传播。下排两条规则：重试共用同一个 deadline，例如还剩 3 秒、调用 P95 为 1.2 秒时可以试一次，失败后只剩 0.9 秒就不再启动同类重试；最低有效窗口，只剩 80 毫秒时不要启动通常要 2 秒的调用，直接返回超时或走更快的合格路径。deadline 和 lease 不要混用：deadline 是业务不再需要结果的时刻，lease 是当前 Worker 的所有权](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-timeout-budget-deadline-v2.dark.png)
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

## 练一练

### 高频考点题 1：每层各写 30 秒

Gateway、Agent、工具各自写了 30 秒超时。会有什么问题？

- A. 没有问题，每层都有保护是最安全的
- B. 下游还在跑时上游已放弃，总时长不可控
- C. 30 秒太短了，应该统一改成 60 秒
- D. 只会多占一点内存，对用户没有影响

**答案：B。** 更可靠的是入口算出一个绝对 deadline，沿链路传播，各层用剩余时间。

### 高频考点题 2：只剩 80ms

deadline 只剩 80ms，下一步是一个通常要 2 秒的模型调用。应该？

- A. 照常发起调用，万一这次比较快呢
- B. 不发起，直接走降级或返回
- C. 把 deadline 自动延长到 2 秒再调用
- D. 发起调用，同时在后台再重试一次

**答案：B。** 要设最低有效窗口，剩余时间不够就不启动注定超时的工作，避免浪费费用。

### 高频考点题 3：取消和回滚

用户断开后，Agent 取消了 Run。已经发出的邮件会怎样？

- A. 取消会自动把已发邮件撤回
- B. 会被标记为草稿，不会送达
- C. 会延迟发出，等用户重新连接
- D. 不会撤回，取消不等于回滚

**答案：D。** 已发生的副作用要靠补偿或人工处理。取消信号通过 cancellation token 传给模型流和工具调用。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent 一面：生成代码质量与限时 AI Coding](../../../interview/bytedance/base/bytedance-base-67.md)
- [百度 Agent 秋招二三面：记忆、工具可靠性与运行循环](../../../interview/baidu/ai/baidu-ai-6.md)
- [海康威视 AI Agent 开发一面：可靠工具与任务状态](../../../interview/hikvision/ai/hikvision-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [gRPC：Deadlines](https://grpc.io/docs/guides/deadlines/)
- [gRPC：Cancellation](https://grpc.io/docs/guides/cancellation/)
- [gRPC：Retry](https://grpc.io/docs/guides/retry/)
