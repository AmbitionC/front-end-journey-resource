Agent 系统的失败恢复从分类开始：瞬态网络错误、限流、无效参数、策略拒绝、部分副作用和未知状态不能使用同一种“再试一次”。错误分类决定 retry、等待、修正、补偿、升级或终止。

## 失败信封

```ts
type AgentFailure = {
  category: 'transient' | 'rate_limit' | 'validation' | 'permission' |
    'partial_effect' | 'unknown' | 'permanent';
  retryable: boolean;
  operationId: string;
  attempt: number;
  stateVersion: number;
  sideEffectState: 'none' | 'not_started' | 'committed' | 'unknown';
  retryAfterMs?: number;
  evidence: string[];
};
```

工具适配器把供应商错误映射到稳定类别，保留原始 code 作为证据。不要让模型从错误文案猜 retryable；策略由操作语义和服务契约决定。

![错误分类后分别重试等待、修订、对账或停止；恢复候选与检查点进入继续处理，再由独立结果验收区分已验证结果和未解决终态](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-failure-recovery-verify-outcome-v2.png)
*图：修参、补偿与检查点恢复都不直接代表成功，只有结果验收通过才进入 Verified Result；重试仍受次数与期限限制。*

图中的“继续处理”要以对账和可信状态为依据：已提交的动作读取既有结果，不再重发；只对仍有必要、获准且可安全执行的步骤继续操作。修参后重新执行、补偿失败或恢复后缺证据，都可能无法通过验收；保留未解决状态，再按策略终止或升级，不能把异常被捕获、输入被修正或补偿已发起当成任务完成。

## Retry 只处理瞬态失败

AWS 的[限控重试建议](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_limit_retries.html)强调指数退避、jitter、幂等性和重试限制。瞬态超时、连接重置、429/部分 5xx 可在总 deadline 内重试；遵守 `Retry-After`，并随机抖动避免大量 Agent 同时冲击恢复中的依赖。

每层只负责一层重试预算。SDK、工具适配器、Agent 和工作流若各重试三次，调用会指数放大。把总 attempt、deadline 和历史传下去；到达预算就终止或降级。

## 非幂等操作与未知状态

[RFC 9110 的幂等方法章节](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)规定，多次相同请求的预期服务端效果与一次相同的方法才是幂等；客户端不应自动重试非幂等请求，除非知道其语义幂等或能确认原请求未应用。

支付、发送、创建和发布超时后可能处于 unknown。先用 operation ID、幂等键或业务查询对账：已提交则读取结果；未开始才重试；无法判定则升级人工。把 unknown 标为 failed 并重发是重复副作用的根源。

## Circuit Breaker 与背压

依赖连续失败或高延迟时，[AWS Circuit Breaker pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html)建议打开断路器，快速失败，等待冷却后少量探测。断路器按依赖/操作维度，不要一次 API 故障让整个 Agent 服务停摆。

同时限制队列、并发和重试优先级。原始用户请求通常比后台重试优先；系统过载时 load shedding 或降级，不能把所有失败转成更多工作。

## Compensation 不是 rollback

分布式副作用通常不能原子回滚。若工作流已创建资源 A，步骤 B 失败，compensation 是新的业务动作，例如取消预订、撤销草稿或标记人工处理。它可能失败，也需要幂等与审计。

执行前记录补偿所需信息；按已完成步骤逆序调用，但不要假设能恢复完全相同状态。退款不等于原支付从未发生，通知也无法从收件人记忆中撤回。最终状态标记 `compensated`、`partially_compensated` 或 `manual_intervention`。

## Durable Execution 与检查点

[Temporal 文档](https://docs.temporal.io/)描述持久执行在进程、网络或基础设施故障后从记录状态继续。持久化解决“控制流不丢”，不自动使外部活动幂等。Workflow 逻辑保持确定，Activity 封装副作用并配置重试/超时；恢复时基于事件历史重放决策。

不使用专用引擎也应 checkpoint：计划版本、任务状态、工具 operation ID、结果 hash、审批和预算。写 checkpoint 与状态转移保持一致，避免记录 done 但副作用尚未确认。

## 子图“跑偏”时先修订语义，再决定重跑

工具超时是执行失败，子图依据错误目标得出结论则是语义失败，不能都用退避重试处理。先保存失败输入、输出、证据和检查点，确认是缺少上下文、工具结果错误、路由错误还是验收不满足；修订任务契约、补证据或重新规划后，从最近仍可信的边界创建新 attempt，旧结果和依赖它的下游产物标记失效。重复执行同一错误计划不算恢复。

以本次核验的 [LangGraph Time Travel 文档](https://docs.langchain.com/oss/python/langgraph/use-time-travel)为例，从旧检查点回放会重新执行其后的节点，包括模型和 API 调用；默认子图由父图作为一个整体检查点边界处理，若要在子图内部恢复，需要相应的独立检查点历史。不能从“有 checkpoint”推断任意节点内语句都能继续，也不能推断外部副作用只执行一次。恢复前仍要对账、检查幂等和剩余预算；这是框架机制示例，其他引擎按自身恢复合同实现。

## 降级、升级和终止

备用数据源、缓存结果、只读模式或减少功能可作为显式降级。输出标注新鲜度和缺失，不把降级冒充完整成功。策略拒绝不重试；参数错误修正后作为新 attempt；权限缺失请求用户/管理员；永久业务错误进入 terminal。

无进展 loop guard 检测同一调用/错误重复、证据不增长和计划来回切换。停止时返回已完成、未知状态、补偿情况、阻塞和建议，不只说“失败”。

## 测试与观测

故障注入覆盖 timeout 前/后提交、429、间歇 5xx、慢依赖、进程崩溃、checkpoint 损坏、重复消息、补偿失败和权限撤销。断言重试次数/间隔、断路器状态、没有重复副作用、恢复后继续正确步骤、terminal 错误不重试。

Trace 记录 operation ID、attempt、错误类别、sideEffectState、backoff、circuit state、checkpoint、对账与补偿。指标包括恢复成功率、重试放大系数、unknown 时长、断路器打开、补偿成功、人工介入和用户可见失败。报警基于症状和预算，不为每次预期重试制造噪声。

## 小结

失败恢复是一棵语义决策树：先分类，再决定 retry、wait、fix、reconcile、compensate、escalate 或 stop。重试受 deadline、预算、幂等和断路器限制；持久执行保存控制流，外部副作用仍需对账与补偿。最终以可验证状态结束，而不是以“异常被捕获”结束。

## 出现于（热度来源）

来源归属说明（同一面经页，不另计次）：

- [百度部分（小红书与百度合并记录）：LangGraph、Skill 与工程校验](../../../interview/redbook/ai/redbook-ai-2.md)；对应合并页中已明确标出的百度部分。

<!-- interview-source-history:start -->
- [快手 AI 应用服务端秋招三面：分布式 Agent、通信与 Lua](../../../interview/kuaishou/ai/kuaishou-ai-6.md)
- [小红书与百度 Agent 面试合并记录：LangGraph 子图、Skill 与工程校验](../../../interview/redbook/ai/redbook-ai-2.md)
- [字节豆包 Seed Agent 开发一面：状态、容错与效果评测（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-20.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [腾讯微信支付后台开发日常实习一面](../../../interview/tencent/ai/tencent-ai-5.md)
- [字节 AML / 火山方舟 AI Infra 一面：Agent Runtime、OS 与网络（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-17.md)
- [阿里淘宝闪购 Agent 算法实习一面：框架、记忆与线上排障](../../../interview/alibaba/ai/alibaba-ai-6.md)
<!-- interview-source-history:end -->

## 补充学习阅读（不重复计次）

- [阿里淘宝闪购 Agent 算法实习一面：框架、记忆与线上排障](../../../interview/alibaba/ai/alibaba-ai-6.md)（补充阅读入口；同一来源在上方已有记录，本节重复列出不再增加频次。）

## 参考资料

- [AWS — Control and limit retry calls](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_limit_retries.html)
- [RFC 9110 — Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [AWS — Circuit breaker pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html)
- [LangGraph — Time travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)
- [Temporal — Documentation](https://docs.temporal.io/)
