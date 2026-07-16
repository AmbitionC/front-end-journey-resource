Agent Benchmark 不是一列排行榜分数，而是一份完整实验合同：测什么任务、使用什么数据、由哪个执行器运行、如何评分、重复多少次、如何聚合、版本是什么。离开这些条件，“82 分”既不能说明产品质量，也不能可靠比较两个 Agent。

[NIST AI TEVV](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)把 AI 评估描述为任务、挑战问题、测试床、软件工具、数据集和测量方法的系统工作，并强调不同可信特征与使用情境。Benchmark 正是这些元素的可重复组合，而不是把现成题库扔给模型。

![Agent Benchmark 的任务数据执行评分矩阵与结果解读卡](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-benchmark-evaluation-matrix-v1.webp)

左侧矩阵定义“怎么测”，右侧报告定义“怎么看”。污染和聚合是两类常见陷阱：测试样本被开发或训练过程看过，会高估泛化；把不同难度和风险的任务压成平均数，会隐藏严重失败。

## 从评估问题开始

先写决策问题，例如：

- 新版本在客服退货任务上是否保持质量并降低 p95 延迟？
- 浏览器 Agent 在登录、表单和下载场景中能否完成目标且不越权？
- 工具 Schema 升级后，参数错误率是否回到发布阈值内？
- 哪些任务应由轻量模型处理，哪些需要更强模型或人工接管？

不同问题需要不同 Benchmark。通用能力题不能替代包含真实工具、权限和数据状态的产品评估；产品集也不能证明模型在所有领域领先。

## 任务集：明确输入与成功条件

每个任务记录目标、初始状态、可用工具、权限、预算、停止规则和可观察成功条件。任务不应通过隐藏答案泄漏给 Agent，评分器却必须能够访问真值或后置状态。

```yaml
task_id: invoice-check-042
goal: verify whether invoice can be reimbursed
initial_state_ref: fixture://invoice/042
capabilities: [invoice.read, policy.search]
limits: {turns: 8, tool_calls: 5, cost_usd: 0.08}
success:
  - final_decision == expected_decision
  - citations_support_decision
  - no_write_tool_called
```

任务按类型、难度、语言、风险、工具和数据分类切片。高风险任务不应因为数量少而在总体平均中失声，可以单独设零容忍门禁。

## 数据集：来源、划分与污染

数据记录来源、许可、创建时间、去重方式、脱敏、版本和生命周期。开发集用于调试，验证集用于选择方案，保留测试集用于最终比较；团队不应持续查看保留集失败再改 Prompt，否则它已经变成开发集。

污染包括直接看过样本、近重复内容进入训练或检索、评分规则泄漏，以及根据测试结果反复挑选模型。使用内容哈希、语义去重、访问控制和变更记录降低风险；报告中披露已知污染，而不是假装完全可证明“从未见过”。

[NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)强调生成式 AI 风险随生命周期和使用情境变化。测试集也会老化：法规、网页、工具和用户分布变化后，旧题仍能回归历史能力，却不一定代表当前生产。

## Harness：把运行条件固定下来

执行器负责准备夹具、注入工具、设置模型参数、限制预算、收集 Trace、重试失败和保存产物。它本身要版本化并测试。比较两个候选时必须使用同一 Harness；如果一个版本获得更多工具、不同超时或更暖的缓存，结果不可直接归因于 Agent。

Harness 区分基础设施失败与任务失败。评估服务宕机、夹具损坏、供应商 5xx 不应静默算成模型错误，也不能简单删除；报告两者数量，并定义重试规则。模型随机性通过多次运行、固定种子（若支持）和分布报告处理。

## Scorer：组合确定性与语义判断

评分优先使用可验证后置条件：数据库状态、Schema、工具轨迹、引用匹配、权限决策和成本预算。语义质量可使用模型评分器和人工评审，但要给出 rubric、校准集与一致性。

例如把结果拆成：

```text
task_success      boolean
state_correct     boolean
tool_policy       pass/fail
citation_support  0..2
helpfulness       1..5 (human/model calibrated)
latency_ms        distribution
cost              currency + price_version
```

不要让高 helpfulness 抵消越权工具调用。安全和关键后置条件是独立门禁，质量分数只在门禁通过后解释。

## 重复、随机性与不确定性

[NIST 对实验设计的说明](https://itl.nist.gov/div898/handbook/pri/section1/pri11.htm)强调在实验前明确目标、因素与响应，以得到有效客观的结论。Agent Benchmark 应预先确定重复次数、主要指标、停止规则和比较方法，避免看到中间结果后不断追加样本直到“显著”。

概率性任务报告均值、分位数、置信区间和失败频率。任务数很少时，0 次失败不代表真实失败率为 0。可用 bootstrap 或适当统计模型估计不确定性，但方法与假设要随报告公开。

## 聚合如何误导

总体平均会受到任务数量和权重支配。假设 95 个简单问答全过、5 个高风险写任务全失败，总成功率仍是 95%，但系统不能上线。至少同时报告宏平均、按任务类型的切片、最差组、关键门禁和失败样本。

权重来自产品流量时要标注时间和来源；来自风险时要解释理由。不要为了让总分好看而在结果出来后调整权重。跨 Benchmark 比较也不能简单相加，因为评分尺度和任务构成不同。

## 版本与可复现报告

报告固定以下摘要：Agent 代码/Prompt/模型/工具/策略版本，Benchmark 任务/数据/Harness/Scorer 版本，运行时间与环境，样本与重试数，污染说明，成本价格版本，以及原始结果引用。

一个分数若不能回到逐任务 Run、Trace 和评分理由，就无法审计。保存的原始输出按数据分类控制访问和保留；公开报告使用脱敏样本与聚合，不泄露测试答案或用户数据。

## Benchmark 与生产指标的边界

离线 Benchmark 提供可控可比性，生产评估提供真实分布和外部效应。离线提升可能因任务不代表流量而无法转化；线上改善也可能来自用户构成变化。把两者通过任务标签、失败分类和反馈集连接，但不要混成同一条无上下文曲线。

Benchmark 适合发布前门禁、候选筛选和回归；线上 A/B 测试适合估计产品因果效果；在线评估适合监控漂移和长尾。三者回答不同问题。

## 常见误区

- 只报告总体分数，不公开任务、版本、重复和置信范围。
- 反复查看测试集并修 Prompt，仍把它称为保留集。
- 用模型评分器评自己偏好的模型，却不做人类校准。
- 删除基础设施失败样本，让候选看起来更稳定。
- 用高质量平均分抵消一次严重安全越权。
- 用通用排行榜替代产品场景、工具和权限验证。

## 小结

可解释的 Agent Benchmark 由任务集、数据集、Harness、Scorer 和版本合同组成。它报告分布、置信范围、失败切片与污染，而不是孤立总分；安全门禁不能被平均值抵消。只有能从报告回到逐任务证据，Benchmark 才能支持发布和选型，而不是制造排行榜幻觉。

## 参考资料

- [NIST：AI Test, Evaluation, Validation and Verification](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)
- [NIST：AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [NIST：What is experimental design?](https://itl.nist.gov/div898/handbook/pri/section1/pri11.htm)
