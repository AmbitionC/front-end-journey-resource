原帖自述为淘天 AI Agent / 大模型应用研发二面，具体面试日期未给出。流程包含自我介绍，技术追问集中在幻觉治理、评测闭环、Ontology / Action、航旅排障 Agent 和轨迹后训练。

仅整理已见文字：另有四个未读取的图片占位，图片内容待确认；原文未提供具体现场回答。以下短答为编辑整理的复习思路，文中比例是未经核实的提问情境，十万条轨迹及三次、十二次调用均为题设，不表示已验证的项目规模或成果。

## 项目链路与幻觉治理

<details data-knowledge-key="agent-project-portfolio"><summary>（1）结合一个真实请求，介绍智能面试间的完整业务链路；其中哪些部分由你本人设计和编码？</summary></details>
<p>按请求输入、关键处理、工具与数据、校验和结果交付讲清链路，再明确个人负责的决策、代码和验证证据。把团队已有能力与本人改动分开，用实际材料说明贡献，不替原项目补充未知实现。</p>

<details data-knowledge-key="llm-capability-boundaries"><summary>（2）为什么模型会漏掉一部分内容？</summary></details>
<p>先对照输入、检索结果、上下文裁剪与最终输出，定位遗漏发生在哪一层，再检查任务要求是否可验证。原文没有给出具体漏项样例，不能断言根因；可用完整性检查和失败切片验证候选解释。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（3）第一版方案是什么、为什么失败？你如何从纯 LLM 方案演进到 Code + LLM？</summary></details>
<p>先用真实失败用例说明第一版的能力与约束，再把可确定的规则、计算和验收交给代码，将语义判断留在受限模型节点中。比较前后要固定任务和判据，解释失败是否被解决及新增代价，不能把一般设计思路当成原项目实测。</p>

<details data-knowledge-key="llm-capability-boundaries"><summary>（4）更换更强模型后，问题是否彻底解决？</summary></details>
<p>更强模型可能改善某些任务，但不会自动补齐证据、权限和验收机制。应在同一失败集与保留任务上比较模型升级和工程治理，并继续保留工具验证、拒答与人工处理边界。</p>

<details data-knowledge-key="agent-feedback-loop"><summary>（5）高频幻觉和误判问题是怎么发现的？如何发现线上其他问题，并判断原有治理框架能否复用？</summary></details>
<p>结合随机抽样、定向风险信号、用户反馈和 Trace 分诊，先区分发生频率与被报告频率。把新问题变成可复现案例和独立判据，复用采集、归因、回归与发布闭环；领域规则和评分器则要按新问题重新验证。</p>

## 评测体系与线上闭环

<details data-knowledge-key="agent-metrics"><summary>（6）端到端错误率从 14.2% 降到 1.5% 是怎么统计的？</summary></details>
<p>先核对错误定义、分子分母、样本范围、时间窗口和判定来源，并确认前后任务分布与版本可比。这里的两个比例只是原帖中的未核实提问情境；还需原始统计和复核记录，才能判断差异及是否可归因于某项改动。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（7）评测集如何构建，Ground Truth 从哪里获得，评测集规模大约有多少？</summary></details>
<p>先按真实任务、风险和已知失败切片定义覆盖，再为每个用例保存输入、初始环境与成功判据。优先用权威业务状态、可执行断言或经复核的领域标注作为依据，开放任务采用校准量表；规模应由覆盖和统计不确定性说明，原文没有给出实际题数。</p>

<details data-knowledge-key="agent-feedback-loop"><summary>（8）上线以后，是否有线上问题自动回流和自迭代机制？</summary></details>
<p>自动化可以采集获准保留的信号、关联版本并提出候选案例，随后仍须做脱敏、去重、归因和人工或程序复核。候选修复经过离线回归与受控发布后才进入生产，线上反馈不能未经核验直接改写模型或全局策略。</p>

## Ontology 与 Action

<details data-knowledge-key="agent-ontology-modeling"><summary>（9）Ontology / Action 建模与幻觉治理项目是什么关系？Ontology 对项目或 Agent 能力有什么帮助？</summary></details>
<p>把语义层、操作合同与结果验证分开：本体描述对象及关系，Action 明确前置条件、授权和可验收结果，治理链路检查生成与执行是否符合它们。是否降低歧义或错误要由同一任务上的证据验证；原文没有提供足以还原两个项目具体架构的答案。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（10）不同领域中哪些语义应该统一，哪些差异不能强行统一？新增本体或 Action 时，如何判断与已有能力是否重叠？</summary></details>
<p>比较对象身份、业务含义、状态与生命周期、权限和操作结果，再决定共同模型与领域适配。查重按业务意图和完整合同进行，名称相同不证明语义相同；确有共同语义才复用，保留来源、映射版本与反例来验证边界。</p>

<details data-knowledge-key="agent-tool-design"><summary>（11）新建 Action 的完整流程是什么？如何完成需求梳理、接口复用、评审、测试和发布？</summary></details>
<p>先以用例与成功判据查重已有能力，再审查底层接口能否兑现语义、权限、幂等和错误合同。完成业务与接口评审、契约测试及 Agent 场景回归后，按版本限定开放并监测结果，准备停用与回退；回退注册版本不会自动撤销既有副作用。</p>

## 失败恢复与并行调度

<details data-knowledge-key="agent-failure-recovery"><summary>（12）Planner 规划了五步，第三步失败时怎么办？</summary></details>
<p>保留前两步的可信状态，先区分第三步是瞬态错误、参数或语义失败、权限拒绝，还是副作用结果未知。按类别决定有限重试、对账、修订或终止，只有验收仍成立的已完成结果才能复用，依赖失败步骤的下游暂不启动。</p>

<details data-knowledge-key="agent-tool-result-validation"><summary>（13）如何判断工具返回结果是否满足当前步骤的预期？</summary></details>
<p>把步骤预期写成输入关联、输出 Schema、业务语义与后置条件，再检查权限范围、来源、新鲜度及是否完整。HTTP 成功或工具自报成功只是一层信号，缺关键结果或只返回部分数据时不能把该步骤标为完成。</p>

<details data-knowledge-key="agent-planning"><summary>（14）应该整条任务重跑，还是只对失败步骤重新规划？</summary></details>
<p>从最近仍可信的检查点与当前外部状态判断恢复范围，保留有效完成步骤，对失败节点及受影响下游形成计划差异。只有前置假设或已有结果失效时才扩大重跑范围；已发生副作用要先对账，并让新计划继续遵守原约束与剩余预算。</p>

<details data-knowledge-key="agent-parallel-tools"><summary>（15）日志查询、告警查询和历史故障检索能否并行？Planner 如何表达依赖，并用 DAG、调度器或状态机完成并发执行？</summary></details>
<p>先证明三类查询的输入已确定、彼此无数据或状态依赖且满足权限，再用 DAG 记录前置边，让调度器仅启动就绪节点。状态机记录节点生命周期，汇合节点验证必需结果、版本与证据后才推进；存在依赖或共享可变资源时需排序或协调。</p>

<details data-knowledge-key="agent-parallel-tools"><summary>（16）并行执行中如何处理超时、失败传播和局部重试？</summary></details>
<p>为父任务和分支分配 Deadline、取消与重试预算，预先声明必需分支失败时取消、等待还是允许部分结果。仅对可安全重试的失败分支重新尝试，结果未知的副作用先对账，汇合时拒绝过期或错误版本结果，避免父任务结束后仍有失控后台工作。</p>

## 轨迹清洗与后训练

<details data-knowledge-key="llm-alignment"><summary>（17）如果积累了十万条成功、失败和人工修正的 Agent 轨迹，应该如何处理和清洗？</summary></details>
<p>先校验任务与环境版本、调用返回对应关系、终止原因和外部结果，完成隐私许可检查、去重与同源分组切分。按成功、失败和人工修正分流，保留错误上下文与修正证据，不能将失败动作直接作为正确示范；十万条只是题设，清洗后可用数量需实际统计。</p>

<details data-knowledge-key="llm-alignment"><summary>（18）哪些问题应该通过 Prompt、流程和工具优化，哪些适合进入模型后训练或微调？</summary></details>
<p>先归因到证据不足、工具或流程故障，还是在充分上下文下稳定出现的行为和能力问题，能在确定性边界修复的先验证工程方案。重复可泛化的行为问题再构造经审核的示范或偏好数据，并在隔离保留任务上比较；训练损失下降不能替代任务、安全和效率验收。</p>

<details data-knowledge-key="llm-rlhf-dpo"><summary>（19）两条轨迹都成功，一条调用三次工具，一条调用十二次工具，如何构造 DPO 偏好对？</summary></details>
<p>先固定同一任务、可比较的环境与工具条件，独立核验结果完整性和安全约束，再按事先约定的指南比较实际资源与必要步骤。只有额外调用确为无效冗余时才有依据偏好更高效的一条；条件不同或差异不足时留作待审，不以调用次数直接产生标签。</p>

<details data-knowledge-key="llm-rlhf-dpo"><summary>（20）构造偏好时如何权衡正确性、效率与安全性？短轨迹一定比长轨迹好吗？</summary></details>
<p>先把目标、完整性和安全红线作为合格条件，再在合格候选中比较成本、延迟与冗余，避免让省调用抵消越权或漏验。短轨迹不一定完成了必要验证，长轨迹也可能包含有价值的取证与恢复，应依据可观察证据记录偏好理由。</p>

<details data-knowledge-key="llm-rlhf-dpo"><summary>（21）长轨迹中的失败恢复过程是否还有训练价值？</summary></details>
<p>有价值的可能是失败观察后的正确诊断、修正和恢复决策，但要保留当时可见上下文，并核验修正与终态。可构造恢复示范或在同一失败前缀下比较后续策略，不能把整条成功恢复轨迹的每个动作都当成正标签，也不能仅按长度删除困难样本。</p>

## 复习导航

- [Agent 项目与作品集设计](../../../knowledge/career/agent-project-portfolio.md)
- [大模型的能力边界、幻觉与不确定性](../../../knowledge/llm/basics/llm-capability-boundaries.md)
- [确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)
- [线上反馈、评估集与持续改进闭环](../../../knowledge/llm/production/agent-feedback-loop.md)
- [成功率、质量、延迟、成本与业务指标](../../../knowledge/llm/production/agent-metrics.md)
- [Agent 评测原理：任务、轨迹与环境结果](../../../knowledge/llm/production/agent-eval-framework.md)
- [本体、Action 与 MCP：语义和执行合同](../../../knowledge/llm/agent/agent-ontology-modeling.md)
- [Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)
- [失败分类、重试、补偿与恢复](../../../knowledge/llm/production/agent-failure-recovery.md)
- [工具结果校验、解析与反馈](../../../knowledge/llm/agent/agent-tool-result-validation.md)
- [任务规划、分解与动态重规划](../../../knowledge/llm/agent/agent-planning.md)
- [并行工具调用与依赖调度](../../../knowledge/llm/agent/agent-parallel-tools.md)
- [模型对齐：SFT、偏好数据与安全](../../../knowledge/llm/basics/llm-alignment.md)
- [RLHF、RLAIF 与 DPO 的差异](../../../knowledge/llm/basics/llm-rlhf-dpo.md)
