确定性 Workflow 与 Agent 不是二选一。前者擅长固定顺序、等待、重试、审批、补偿和恢复；后者擅长在信息不完整时做语义判断。稳健的组合方式是让工作流拥有控制流，让 Agent 只在明确边界内返回结构化选择与证据。

## 为什么工作流需要确定性

长运行流程可能因部署、故障或扩缩容被多次恢复。工作流引擎通常通过历史事件重放决策代码，重建“接下来该发什么命令”。如果相同历史在重放时生成不同命令，状态就无法可靠恢复。

[Temporal Workflow Definition](https://docs.temporal.io/workflow-definition)说明 Workflow Definition 需要满足确定性约束，并解释历史重放与代码变更相关的要求。墙钟时间、随机数、直接网络 I/O、迭代顺序变化或未经版本控制的分支，都可能让旧历史与新代码产生不同决定。

确定性不表示业务结果永远相同，而是给定同一工作流历史，编排决策保持一致。真实世界 I/O 作为 activity/task 产生记录在历史中的结果，重放时读取旧结果，而不是再次访问世界。

## 固定骨架，有限决策

先用确定步骤表达业务不变量：

```text
validate input
-> fetch evidence activity
-> bounded agent decision
-> validate structured choice
-> approval if required
-> commit activity
-> verify outcome
```

Agent 节点只接收候选、限制、可用证据和输出 schema，返回 `choiceId`、参数、证据引用、理由摘要与置信度。它不能改变审批规则、跳过验证、增加未注册工具或直接提交副作用。

[LangGraph 的 workflows and agents 文档](https://docs.langchain.com/oss/python/langgraph/workflows-agents)区分预先确定路径的 workflow 与动态决定过程的 agent，并展示 routing、parallelization、orchestrator-worker 等模式。具体库接口会演进，但“确定控制边界、在边界内使用模型判断”是可移植设计。

![Workflow、Supervisor 与 Agent Teams 的选择边界：三种编排拓扑最终都进入统一质量与副作用门禁](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-orchestration-choice-boundary-v1.svg)
*图：实线是代码固定路径，虚线是模型动态选择；自治程度提高时，通信、状态一致性、评测和成本也同步增加。*

## Workflow、Supervisor/Subagents 与 Agent Teams 怎样选

[Anthropic 的 Agent 架构实践](https://www.anthropic.com/engineering/building-effective-agents)区分预定义代码路径的 Workflow 与由模型动态控制过程的 Agent，并建议只在结果可测地改善时增加复杂度。工程选型可以继续细分为三种拓扑：

| 方案 | 控制权 | 适合任务 | 主要代价 |
|---|---|---|---|
| 确定性 Workflow | 代码固定步骤与分支 | 规则稳定、依赖明确、高风险流程 | 长尾语义分支需要持续补规则 |
| Supervisor + Subagents | 中心 Agent 分解、委派和汇总 | 子任务可独立、需要上下文隔离与单一责任人 | Supervisor 成为瓶颈，汇总可能丢证据 |
| Agent Teams | 多个角色共享目标并动态交接 | 信息分散、需要对等协商或互相质疑 | 通信放大、重复劳动、状态冲突、难以归因 |

“Agent Teams 比 Workflow 强”不是成立的结论。先画任务依赖：固定、可验证的主链路留在 Workflow；专业子任务由 Supervisor 按合同委派；只有当角色需要根据新证据相互协商、计划难以预先枚举时，才考虑 Teams。三者都必须把权限、预算、幂等、质量门禁和终止条件放在模型之外。

主 Agent + Subagent 强调树状责任和结果回收，Agent Teams 强调成员之间能直接协作；如果实际通信仍全部经过一个主节点，它在拓扑上仍更接近 Supervisor。面试回答应结合共享状态、失败归属、并发资源和评测方式，而不是只比较框架名称。

## Side Effect 放到 Activity

数据库写入、HTTP 请求、发送邮件、模型调用和读取当前时间都属于非确定性或外部副作用，应放在 activity/task 中。工作流代码调度 activity，并把结果记录在历史；activity 自身可能因 worker 崩溃或确认丢失而重试，所以仍要幂等。

[Temporal Python workflow basics 源文档](https://github.com/temporalio/documentation/blob/main/docs/develop/python/workflows/basics.mdx)给出了 workflow 代码约束与安全 API 的当前说明。不要把普通网络 SDK 偷偷放进 workflow helper；代码看起来只是函数调用，重放时却可能重复访问外部系统。

写 activity 使用 operation ID：同一工作流步骤的重复 attempt 复用 key，服务端返回已有结果或进行状态查询。若第一次状态未知，工作流进入 reconcile 分支，而不是无条件再写一次。

## Agent 输出是候选，不是命令

一个实用响应结构：

```json
{
  "choiceId": "route_manual_review",
  "arguments": { "queue": "risk_ops" },
  "evidenceRefs": ["doc:policy:12", "case:784"],
  "confidence": 0.74,
  "limitations": ["customer identity not independently verified"]
}
```

确定性节点验证 choice 是否在 allowlist、参数是否符合 schema、证据是否来自当前 run、策略是否允许、置信阈值是否满足。不通过时返回结构化 diagnostics，可在预算内再次调用 Agent，或转人工；绝不能把无法解析的文本当默认批准。

Agent prompt/version、模型配置、输入证据摘要和响应 hash 都要记录。恢复时已完成 Agent activity 读取历史结果，不重新询问模型；主动重新决策则创建新的 decision ID，并说明触发原因。

## Retry 与版本升级

Workflow retry 针对 activity 的暂时失败，Agent repair 针对结构或决策问题，两者不要混为一个无限循环。每类错误有独立最大次数、退避和终止路径，所有子预算受全局 deadline 约束。

部署新代码时，不能让新逻辑改变正在运行实例的已记录命令顺序。通过 workflow version marker、兼容分支或 worker versioning，让旧历史继续走旧路径，新实例使用新路径。Prompt 变化也要版本化；虽然模型调用在 activity 中不影响 replay，但会影响重新决策与审计可比性。

## 等待、审批和补偿

等待外部事件时，workflow 持久化挂起，不占用常驻线程。收到审批或 webhook 后先校验关联 ID、状态版本和权限，再推进。批准绑定具体 choice 和参数 hash，过期或状态变化则回到验证。

补偿不是数据库回滚。对已经发生的外部副作用，定义业务补偿 activity，例如退款、撤销预留或发送更正通知；它同样可能失败和重试。工作流明确记录 forward step 与 compensation step 的结果，必要时进入人工修复终态。

## 什么时候不该加入 Agent

若规则可以完整枚举、错误成本高且输入结构稳定，普通条件分支更便宜、可测、可解释。Agent 适合语义分类、开放文本归纳、候选方案比较和缺失信息识别，而不适合计算税率、验证权限、执行资金变更或决定是否跳过法规步骤。

先问“模型的不确定性为流程增加了什么价值”。若回答只是“代码更少”，通常还不足以承担新的非确定性、成本和测试面。

## 测试与可观测性

Workflow replay test 用历史 fixture 跑新代码，确认命令序列兼容。Activity 测试覆盖幂等、超时、重复回执与状态未知。Agent contract test 固定输入，验证只返回允许 choice、证据引用存在、低置信度进入 abstain，而不是要求措辞完全相同。

trace 将 workflow/run、decision、activity、approval 和 operation ID 关联。指标区分 workflow task replay 失败、activity retry、Agent repair、人工审批等待和补偿失败。这样才能判断问题来自编排、外部依赖还是模型选择。

## 常见误区

- 在 workflow 代码里直接调用模型或网络；
- 让 Agent 动态改写整个流程并跳过固定门禁；
- 把 Agent 文本解析失败当成默认选项；
- 认为 activity 重试不会重复副作用；
- 修改运行中分支但不做版本兼容；
- 把补偿称为原子回滚；
- 重新播放历史时再次执行已经完成的模型决策。

## 小结

确定性 Workflow 提供可重放的骨架，activity 隔离真实世界副作用，Agent 在受限节点内提供语义选择。结构化响应必须重新验证，审批和提交由工作流掌控，重试、版本与补偿各有清晰语义。这种分工让模型能力进入生产流程，却不接管流程的不变量。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 全栈开发一面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-13.md)（cluster-0cfd17469543）
- [蚂蚁 AI 开发一面：协作式 Agent、交付门禁与后端基础（2026 年 8 月）](../../../interview/antfin/ai/antfin-ai-4.md)（cluster-910d0b20a897）
<!-- interview-source-history:end -->

## 参考资料

- [Temporal — Workflow Definition](https://docs.temporal.io/workflow-definition)
- [Temporal Documentation — Python workflow basics](https://github.com/temporalio/documentation/blob/main/docs/develop/python/workflows/basics.mdx)
- [LangGraph — Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
