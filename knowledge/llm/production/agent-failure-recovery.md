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

![错误先分类为瞬态、限流、校验、部分副作用或策略拒绝，再分别进入退避重试、等待、修正输入、对账补偿或升级终止；重复依赖失败触发断路器，持久状态从检查点恢复](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-failure-recovery-error-taxonomy-v1.webp)
*图：所有路径最终到 Verified State 或 Terminal Failure，而不是无限重试。*

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

## 降级、升级和终止

备用数据源、缓存结果、只读模式或减少功能可作为显式降级。输出标注新鲜度和缺失，不把降级冒充完整成功。策略拒绝不重试；参数错误修正后作为新 attempt；权限缺失请求用户/管理员；永久业务错误进入 terminal。

无进展 loop guard 检测同一调用/错误重复、证据不增长和计划来回切换。停止时返回已完成、未知状态、补偿情况、阻塞和建议，不只说“失败”。

## 测试与观测

故障注入覆盖 timeout 前/后提交、429、间歇 5xx、慢依赖、进程崩溃、checkpoint 损坏、重复消息、补偿失败和权限撤销。断言重试次数/间隔、断路器状态、没有重复副作用、恢复后继续正确步骤、terminal 错误不重试。

Trace 记录 operation ID、attempt、错误类别、sideEffectState、backoff、circuit state、checkpoint、对账与补偿。指标包括恢复成功率、重试放大系数、unknown 时长、断路器打开、补偿成功、人工介入和用户可见失败。报警基于症状和预算，不为每次预期重试制造噪声。

## 小结

失败恢复是一棵语义决策树：先分类，再决定 retry、wait、fix、reconcile、compensate、escalate 或 stop。重试受 deadline、预算、幂等和断路器限制；持久执行保存控制流，外部副作用仍需对账与补偿。最终以可验证状态结束，而不是以“异常被捕获”结束。

## 参考资料

- [AWS — Control and limit retry calls](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_limit_retries.html)
- [RFC 9110 — Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [AWS — Circuit breaker pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html)
- [Temporal — Documentation](https://docs.temporal.io/)
