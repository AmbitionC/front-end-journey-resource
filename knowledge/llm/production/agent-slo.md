Agent 平台只看 5xx 和延迟，会把很多真实失败算作成功：HTTP 200 但答案没有完成任务、工具调用越权、结构化输出无法消费、成本失控，或者用户等到结果时已经没有价值。SLO 设计必须从用户可见结果开始，再拆成技术、质量、安全、时效和成本信号。

[Google SRE Workbook 的 Implementing SLOs](https://sre.google/workbook/implementing-slos/)区分 SLI、SLO 和错误预算：SLI 是对服务行为的测量，SLO 是在一个窗口内的目标，允许的不可靠部分构成错误预算。目标不是追求抽象的 100%，而是在可靠性与变更速度之间建立可执行契约。

![任务成功、安全结果、延迟和成本等 SLI 汇入 SLO，再形成错误预算；预算消耗速度驱动发布、告警、缓解和可靠性投入](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-slo-error-budget-loop-v1.webp)
*图：错误预算是决策输入，不是给团队排名或追责的分数。*

## 从用户旅程定义“好事件”

先选择关键旅程，例如“用户提交文档后在 30 秒内得到通过 Schema 校验且引用可追溯的摘要”。一次 good event 可能要求：

- 请求被接受并在 deadline 内终止；
- 任务达到明确业务终态，而非仅模型调用成功；
- 输出通过结构、证据和安全检查；
- 必需工具完成且没有未知副作用；
- 总成本未超过产品预算。

不要把所有条件塞进一个难以解释的布尔值。为同一旅程并行维护完成 SLI、质量 SLI、安全 SLI、延迟 SLI 和成本 SLI，再定义哪些是发布硬门禁、哪些用于长期优化。

## 分母和事件边界

SLI 最容易在分母上出错。用户主动取消是否计失败？策略正确拒绝是否算可用？测试流量、内部探针、重复重试和异步状态查询是否进入同一个分母？这些规则必须在指标定义中写明并版本化。

对于同步请求，事件边界可以是一次外部请求；对于长任务，边界是一个 job 从 accepted 到终态，重试 attempt 不单独增加业务分母。相同幂等键的重复提交归为一个逻辑事件。正确的安全拒绝可以是“系统可用但任务未执行”，应与故障拒绝分开。

## 典型 SLI

可用性不只是进程在线：

~~~text
technical_completion = terminal_without_platform_error / eligible_jobs
task_success = verified_outcome / evaluated_jobs
safe_outcome = no_severe_policy_violation / eligible_outputs
latency_good = completed_within_journey_deadline / eligible_jobs
cost_good = successful_within_budget / successful_jobs
unknown_effect_rate = jobs_with_unknown_side_effect / write_jobs
~~~

质量评估存在延迟和采样，不能假装与实时 5xx 一样完整。指标记录 coverage、judgeVersion 和样本分层；大盘同时显示“质量 92%”与“仅覆盖 18%”，避免低覆盖制造虚假确定性。

## 设置目标和窗口

目标由用户期望、替代方案、当前基线和业务成本共同决定。先收集数周真实分布，再提出有余量但可实现的目标。过紧目标让团队长期冻结，过松目标无法保护用户。高风险安全指标可以采用零容忍事件触发，而一般质量使用统计目标。

窗口可以是滚动 28 天，也可以配合季度承诺。滚动窗口对近期变化更敏感；固定日历窗口便于报告，但月初会重置上下文。短窗口用于快速检测，长窗口用于预算政策，两者不要混成一条线。

例如 99% 的任务成功 SLO 允许 1% bad events。如果 28 天预计有 100 万任务，预算为 1 万个失败；预算不是鼓励用完，而是允许在成本合理的范围内持续变更。

## 多窗口 Burn Rate

Burn rate 表示错误预算被消耗的速度：1 倍意味着按窗口结束时刚好用完，14 倍意味着很快耗尽。使用短窗口捕捉突发、长窗口确认持续性，只有两者同时越线才分页，减少单个噪声峰值。

[Google SRE 关于 Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)提出围绕延迟、流量、错误和饱和度观察服务。Agent 平台在此基础上加入质量、安全、成本和未知副作用；基础资源信号帮助诊断，但用户 SLI 才决定是否消耗错误预算。

告警必须可行动：包含受影响旅程、burn rate、releaseId、租户/任务切片和 Run 示例。对每次模型拒绝报警只会造成噪声；对安全严重事件则即使样本很小也要直接升级。

## 错误预算政策

[Google SRE Workbook 的 Error Budget Policy](https://sre.google/workbook/error-budget-policy/)给出一种组织协议示例：预算耗尽时暂停非必要变更，把力量投入可靠性。它不是惩罚开发，也不是放弃产品，而是事前约定当可靠性与发布冲突时如何决策。

Agent 团队可以定义：

- 预算健康：按常规节奏发布；
- 快速消耗：暂停扩流、加强审核和调查；
- 接近耗尽：只允许风险降低或紧急修复；
- 已耗尽：冻结非必要行为变更，执行纠正计划；
- 严重安全事件：无论预算多少立即停线与响应。

政策明确例外批准者、证据、持续时间和恢复门槛。不能通过改 SLI 分母、降低评测覆盖或把失败重分类来“恢复预算”。

## 切片与防平均

全局 99% 可能掩盖某个语言、地区、模型或小租户只有 80%。按 taskType、riskTier、region、model、release、tenantTier 和工具切片，但避免为每个用户建立独立高基数指标。使用日志或分析仓库深入调查。

同时检查成功任务的长尾成本和延迟。平均成本下降可能来自系统拒绝了困难任务；技术成功上升可能伴随质量下降。把各 SLI 并排展示，避免单目标优化。

## 数据质量与治理

SLI 定义像 API 一样版本化。事件生产者通过契约测试保证 eventId、eligible、outcome、deadline 和 evaluation 字段。重复投递按逻辑 job 去重；迟到质量标签回填正确窗口。指标管道故障与“没有坏事件”必须可区分。

每个季度审查 SLO 是否仍代表产品价值，但变更不能追溯性重写历史。保留旧定义与转换说明，发布和事故时间线引用当时版本。

## 小结

Agent SLO 从用户旅程出发，把技术完成、任务质量、安全、时效和成本分别测量，再用明确分母、窗口和错误预算连接发布政策。可靠性不是一个模糊成功率；当团队能解释每个 bad event 为什么进入预算，并能根据 burn rate 做出行动时，SLO 才真正生效。

## 参考资料

- [Google SRE Workbook：Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Workbook：Example Error Budget Policy](https://sre.google/workbook/error-budget-policy/)
- [Google SRE：Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
