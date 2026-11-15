美团后端 Agent 开发暑期一面，原记录包含项目追问及 AI 开发方式、代码审查和测试。未注明面试日期；发帖时间不能代替面试发生时间。

以下是根据已见文字整理的题目，短答为编辑补充的备考思路。原记录未披露公司的实际开发流程、项目约束或完整现场回答，不据此复原。

## Agent 能力与开发交付

<details data-knowledge-key="llm-capability-boundaries"><summary>（1）大模型幻觉怎样处理？</summary></details>
<p>先限定任务和可用证据，对变化快或私有的信息检索权威材料，对数字和代码使用工具核验，并允许证据不足时拒答或转人工。用真实失败样本评估事实性、引用和拒答质量；检索、低温度或更大的模型都不能保证消除幻觉。</p>

<details data-knowledge-key="agent-guardrails"><summary>（2）Agent 开发过程中怎样实施约束？</summary></details>
<p>原记录没有给出当事人已实现的约束。准备时可沿输入信任、工具白名单、参数与权限校验、执行预算和结果验收说明控制层；高影响动作的审批和幂等应放在受信执行层，不能只依赖提示词或模型自评。</p>

<details data-knowledge-key="agent-skill-design"><summary>（3）交互采用 Skill 还是 MCP，怎样理解两者的分工？</summary></details>
<p>Skill 可以组织一类任务的可复用做法、规范和资源，MCP 负责工具与数据的标准化接入，二者可以组合使用。应结合宿主的实际支持、版本与权限说明自己的实现，不能把它们当作必然互斥的技术路线。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（4）全流程由 Agent 主导，与基于结构化文档和工作流驱动的开发方式，各有什么优劣？</summary></details>
<p>先比较谁决定下一步、任务能否预先分解，以及规格、验证和恢复状态由谁持有。开放任务的自治执行更灵活，固定流程更易约束和复核；结构化文档可以作为两者的共同输入，不代表自动具备确定性或正确性，选择应由同一任务集的效果与成本验证。</p>

<details data-knowledge-key="agent-coding"><summary>（5）公司怎样把 AI 融入开发流程？</summary></details>
<p>原记录没有披露公司的实际流程。备考时可用需求与验收、仓库检查、计划与最小改动、类型及行为测试、独立 Diff 审查和发布门禁组织说明，并明确自己参与的环节与证据，不把通用建议写成原公司的实践。</p>

<details data-knowledge-key="agent-coding"><summary>（6）会使用 AI 做代码审查吗？</summary></details>
<p>可以让 AI 辅助查找接口误用、错误路径和遗漏测试，并要求意见指向具体 Diff、调用方与可复现证据。模型建议仍可能误报或漏报，需由独立检查、测试和负责的审查者核实，不能把自动生成评论或静态检查通过当成业务正确。</p>

<details data-knowledge-key="agent-test-pyramid"><summary>（7）怎样做单元测试，如何检查 AI 生成测试的覆盖缺口？</summary></details>
<p>先把需求和业务不变量转为独立预期，再覆盖正常、边界、失败和状态转换，而不是让测试照抄实现逻辑。行或分支覆盖率不能证明需求已覆盖，可结合参数组合、历史故障和变异测试检查断言强度；完整覆盖通常无法靠一次生成保证，仍需风险分析与更高层验证。</p>

## 延伸学习

- [大模型的能力边界、幻觉与不确定性](../../../knowledge/llm/basics/llm-capability-boundaries.md)
- [输入、输出与工具 Guardrails](../../../knowledge/llm/production/agent-guardrails.md)
- [Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)
- [确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)
- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)
- [Agent 单元、集成、场景与端到端测试](../../../knowledge/llm/production/agent-test-pyramid.md)
