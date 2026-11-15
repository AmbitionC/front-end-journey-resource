快手测开二面，已见文字涉及实习项目中的多 Agent 接力、检查点、评测与业务测试。岗位依据原记录的测试岗位描述及测开标签；面试发生日期未注明，不以发帖时间推定。

以下短答是编辑补充的备考思路，原记录没有完整现场回答。部分图片未捕获，不能复原；Scaffold 名称与个人适配细节、三阶段 Handoff 协议及算法题干均未披露。原记录对算法与现场编码的表述不一致，相关范围保留待补。

## 项目交接、评测与测试

<details data-knowledge-key="multi-agent"><summary>（1）实习项目中的 Multi-Model Relay 解决什么问题，为什么需要多个 Agent 接力？</summary></details>
<p>原记录没有给出该项目的目标和模型接力实现。准备时应先说明单 Agent 或确定性流程基线，再解释哪些子任务需要独立上下文、如何传递证据与状态，以及交接成本；多模型和多 Agent 是不同维度，是否采用接力要用任务结果验证。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）原问称适配了十余种 Scaffold：它们有何差异，个人负责哪些适配？</summary><span>关联知识点待核实。</span></details>
<p>原记录没有列出 Scaffold 名称、版本、差异或本人适配内容，无法复原。应根据真实项目补充这些信息，并用模型接口、工具协议、状态管理、终止条件和验证环境说明边界；这里不替当事人填写适配成果。</p>

<details data-knowledge-key="agent-workflow-state"><summary>（3）Checkpoint 需要保存什么状态，才能让下一个 Agent 继续工作？</summary></details>
<p>保存驱动后续步骤的可序列化业务状态、下一节点、已完成任务、等待条件、版本与证据引用，并区分运行元数据和长期记忆。对可能已产生副作用的操作，还需意图、幂等键和权威结果；不能仅靠一段摘要或临时连接恢复。</p>

<details data-knowledge-key="agent-coding"><summary>（4）三阶段 Handoff 各做什么？交接摘要与实际代码状态冲突时怎样处理？</summary></details>
<p>原记录没有说明三阶段的名称和协议，不能按常见流程补造。遇到冲突应保留原交接与工作区，核对 base、HEAD、实际 Diff、产物和验证所绑定的版本，先解释不一致及失效前提，再决定恢复或重验；摘要不能覆盖仓库事实。</p>

<details data-knowledge-key="agent-debugging"><summary>（5）怎样判断一次失败来自模型、工具、运行环境还是评测标准？</summary></details>
<p>先把失败转成可观察断言，冻结输入、模型与工具版本、状态和评分规则，再沿轨迹寻找最早差异。通过隔离重放、替换单一组件和人工核对量表验证候选原因，证据不足时保留未知或多因；错误标签和模型给出的解释不等于因果结论。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（6）两条轨迹的最终测试都通过时怎样比较质量，Rubric 怎样减少主观评分？</summary></details>
<p>先保留任务完成和硬约束门槛，再用有证据锚点与正反例的量表比较必要步骤、恢复能力和资源消耗。对开放维度用人工标注校准评分器、检查评分顺序等偏差并允许无法判断；通过同一组测试不意味着两条轨迹在所有质量维度等价。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（7）简历中通过率提升和成本降低的统计口径是什么，怎样证明来自自己的方案？</summary></details>
<p>原记录没有给出样本、分母或实验设计，不能据数字确认真实收益。应固定任务集、基线、版本和预算，说明提升是相对比例还是百分点，按成功任务计入重试与审核成本，并用切片、重复运行或合适的对照实验区分方案作用与流量变化。</p>

<details data-knowledge-key="llm-capability-boundaries"><summary>（8）业务报告 Agent 怎样避免取数口径错误、计算错误和无证据的业务结论？</summary></details>
<p>先固定指标、时间窗和数据版本，让查询与确定性计算生成可回读结果，再把结论逐条对应到证据。对缺失、冲突或不支持的解释明确保留不确定性，并用有审核依据的任务评测；语言流畅、格式正确或模型自报置信不能替代数值与事实校验。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（9）为 Agent 功能设计上线前评测，怎样构建任务集、指标和回归流程？</summary></details>
<p>先规定输入、初始环境、允许动作、成功终态和硬约束，再从真实任务、边界与历史失败构建有版本的用例。分开开发、回归和独立保留集，用程序检查确定条件、经校准的量表评价开放质量，在可比较版本与预算下按切片和重复执行报告结果。</p>

<details data-knowledge-key="ai-observability"><summary>（10）线上 Agent 成功率下降而离线评测未变时，按什么顺序排查？</summary></details>
<p>先核对成功定义、统计窗口、分母和采样，再检查线上任务分布、模型与提示词、工具和数据版本是否与离线一致。关联失败轨迹、环境结果、延迟与错误切片，找出最早异常并在受控环境复现；将经审核的新增错例纳入适当回归集，而非只追平均分。</p>

<details data-knowledge-key="agent-test-pyramid"><summary>（11）场景题：购物下单、添加到购物车，应测试哪些方面？</summary></details>
<p>先明确购物车数量、价格、优惠和库存时点等业务合同，再测正常流程、边界值、失效商品、身份隔离、并发变化、请求重试与失败恢复。底层断言金额与状态，集成检查持久结果和副作用次数，关键旅程做端到端验证；不把成功提示或代码覆盖率当成业务完成。</p>

<details data-binding-status="pending_semantic_verification"><summary>（12）原记录中的“三树之和”具体题意与约束是什么？</summary><span>关联知识点待核实。</span></details>
<p>原记录只留下“三树之和”字样，没有题干、输入输出、约束或测试要求，无法确定是哪道算法题。先补充原题后再选择算法与知识关联，不把这个名称自动改写成“三数之和”，也不补造代码或通过结果。</p>

## 延伸学习

- [多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)
- [工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)
- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)
- [Agent 调试方法与失败复现](../../../knowledge/llm/production/agent-debugging.md)
- [Agent 评测原理：任务、轨迹与环境结果](../../../knowledge/llm/production/agent-eval-framework.md)
- [用业务指标证明 Agent 项目价值](../../../knowledge/career/agent-project-evaluation.md)
- [大模型的能力边界、幻觉与不确定性](../../../knowledge/llm/basics/llm-capability-boundaries.md)
- [Agent 可观测性与全链路 Tracing](../../../knowledge/llm/production/ai-observability.md)
- [Agent 单元、集成、场景与端到端测试](../../../knowledge/llm/production/agent-test-pyramid.md)
