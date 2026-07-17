模型 Fallback 不是主模型报错后随便换一个便宜模型。不同模型在上下文、工具调用、结构化输出、地区、数据处理和安全能力上并不等价；静默切换可能把“依赖不可用”变成更隐蔽的质量或合规事故。正确做法是预先定义有界降级阶梯，并在每一步检查能力、策略和质量底线。

![上方断路器在 Closed、Open、Half-Open 之间按失败阈值、冷却与探测结果转移；下方请求只有通过能力、策略和质量门禁才进入备用模型](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-model-fallback-circuit-state-v1.webp)
*图：熔断负责停止攻击故障依赖，Fallback 负责在约束内选择替代能力，两者不是同一件事。*

## 先区分 Retry、Fallback 与降级

Retry 是对同一逻辑依赖再次尝试，通常处理短暂网络、限流或可恢复服务错误；Fallback 是切换到另一个实现；降级则可能减少功能、使用缓存或转异步。三者都必须共享 deadline 和 attempt 预算。

[gRPC Retry Guide](https://grpc.io/docs/guides/retry/)强调重试受策略和调用提交状态约束。非幂等请求、已开始流式输出或副作用状态 unknown 时，不能因为“还有备用模型”就重新执行整个任务。先判断错误类别与提交边界，再决定是否重试或替换。

## 资格矩阵

为每个模型维护可机读能力卡：

~~~text
model_id / revision
regions and data residency
context and output limits
tool-calling and structured-output support
supported modalities
safety policy and evaluation version
latency and availability class
cost class
approved data classifications
known quality floors by task
~~~

一次请求也带任务需求：必须的工具、Schema、语言、最大上下文、地区、数据分类、延迟等级和最低质量。候选只有在所有硬约束通过后才能排序。若没有合格候选，显式失败或转人工，比用不兼容模型产出看似正常的错误答案更安全。

[NIST AI Risk Management Framework 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)提供了治理、测量和管理 AI 风险的通用框架。把备用模型纳入同一评测、审批、监控和变更治理，是从该框架得到的工程要求；Fallback 不应成为绕过上线评审的后门。

## Circuit Breaker 状态机

[Azure Architecture Center 的 Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)描述了 Closed、Open 和 Half-Open：Closed 正常调用并统计失败；达到阈值转 Open，快速失败；冷却后进入 Half-Open，只放少量探测；探测成功回 Closed，失败回 Open。

断路器按 provider × model × region × operation 维度，避免一个模型的流式接口失败拖垮全部模型。阈值同时考虑错误率、连续失败、延迟和最小样本，防止低流量下单次错误误开。探测流量不承载高风险真实副作用，或使用可安全重复的代表请求。

## Fallback 决策顺序

主模型失败后按以下顺序判断：

1. 错误是否短暂且调用尚未提交，deadline 是否允许有限 retry；
2. 主依赖断路器是否打开，是否应跳过重试；
3. 备用模型是否满足能力、地区、数据与安全策略；
4. 输入能否在不丢关键约束的情况下适配上下文和 Schema；
5. 离线与在线评测是否证明该任务达到质量 floor；
6. 切换是否会重复工具或外部副作用；
7. 若都通过，记录降级原因、bundle 版本和用户可见标识。

可用性优先级不应写死在代码散落处。版本化 policy 根据任务类别映射 primary、fallbacks、禁用条件和恢复策略，配置变更经过 Canary 与审计。

## 输入输出适配

不同模型的角色格式、工具 Schema 和结构化输出能力不同。适配器把内部规范请求转换为供应商格式，再把响应验证回统一 Schema。若备用模型不支持某工具，不要把工具描述删掉后继续；这会改变任务能力，应判定不合格或选择只读降级路径。

上下文超过备用模型限制时，不能机械截尾。保留系统规则、用户目标、审批、关键事实与未完成状态，摘要内容标记来源和版本。若压缩后无法证明关键约束保留，显式要求重试或人工介入。

## 质量底线与可见性

每个任务类型建立 golden set，比较主备模型的任务成功、安全拒绝、Schema 合法、工具参数、延迟和成本。Fallback 的质量门槛是绝对值，不只是“比正在故障的主模型好”。高风险法律、医疗或资金任务可能根本不允许自动备用。

在线记录 fallbackRate、reason、from/to model、quality proxy、用户纠正、工具错误和恢复后差异。响应可以说明当前处于降级模式、功能限制和数据新鲜度。透明不是泄漏内部拓扑，而是避免用户把受限结果误认为完整服务。

## 恢复与防抖

主模型恢复后不能瞬间把全部流量切回。Half-Open 探测通过后逐步提升流量，观察绝对错误率和延迟；设置最小稳定窗口与 hysteresis，防止在主备之间振荡。Fallback 本身也有容量和配额，切流前检查承载能力，避免救火时压垮备用。

同时限制降级链长度，例如 primary → approved secondary → async/manual，禁止循环路由。每次请求携带 routeHistory，若模型 A 与 B 的策略互相 fallback 可以立即终止。

## 验证场景

故障注入覆盖超时、429、部分流输出、主模型 5xx、地区不可用、备用不支持工具、Schema 差异、上下文过长、断路器抖动和备用容量不足。断言只有未提交请求被重试，硬策略不被降级绕过，用户与审计能识别切换，恢复探测不会造成流量尖峰。

## 小结

模型降级是一套受治理的路由协议：Retry 处理同一依赖的瞬态失败，Circuit Breaker 限制故障放大，Fallback 只在能力、政策、数据和质量门禁全部通过时发生。没有合格替代者时明确失败，往往比悄悄返回低可信答案更可靠。

## 参考资料

- [gRPC：Retry](https://grpc.io/docs/guides/retry/)
- [Azure Architecture Center：Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [NIST：Artificial Intelligence Risk Management Framework 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
