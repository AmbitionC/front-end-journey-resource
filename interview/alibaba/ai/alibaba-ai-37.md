阿里虎鲸文娱优酷 AI 应用开发工程师二面题单，原帖写明面试时间为9月12日，未注明年份。问题覆盖业务数据、Agent编排、上下文、评测和求职沟通。

> 以下短答是编辑整理的备考思路，不是当事人的现场回答。具体经历、项目实现、业务口径与测量结果均需按本人事实说明；原帖脱敏关键词保留待补。

## 面试官问题与回答思路

<details data-knowledge-key="agent-resume-interview"><summary>（1）请简单介绍一下你的个人经历和目前的情况。</summary></details>
<p>可以按当前方向、与岗位相关的真实经历、本人职责和当前阶段组织介绍。对尚在进行的项目或求职状态，区分已完成事实与后续计划，不能补写不存在的上线或收益。回答只保留与岗位有关的信息，并与投递材料一致。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（2）请介绍一下你在字节负责的 Agent 项目：它主要实现了哪些功能？面向怎样的用户场景？任务由用户主动发起，还是由系统自动发现风险后再推送给用户？</summary></details>
<p>先说明真实目标用户、原有流程和项目要改善的步骤，再沿输入、处理与交付物介绍已实现功能。把用户主动请求、后台规则发现后生成任务和向用户推送分开，说明谁授权启动与执行。这里是介绍框架，实际场景、功能和触发方式必须按本人项目事实填写。</p>

<details data-binding-status="pending_missing_keyword"><summary>（3）业务中常见的****（原文为xxxx，关键词待补）有哪些？请结合具体场景介绍。</summary></details>
<p>原文关键字被遮蔽为xxxx，目前不能确认具体业务对象，因此本题保留待补。需要先取得准确关键词及业务范围，再解释常见情形与具体案例。现阶段不猜测业务含义，也不据此增加知识热度。</p>

<details data-knowledge-key="data-contracts"><summary>（4）整条链路的原始输入数据有哪些？会产出哪些重要的中间数据？例如“快充快退”应如何从数据层面定义和识别？</summary></details>
<p>先列出链路实际使用的原始事件、字段、主体标识、事件时间和来源，再说明各中间结果的生成规则、版本与用途。对“快充快退”这类业务说法，先请业务明确对象、时间窗口、状态变化和例外，之后用可核对数据编写识别与反例测试。原文没有给出这些定义，不能自行补成某类交易规则或阈值。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（5）针对自动化、交互式等不同业务场景，你们设计了哪些 Agent 内核或架构形态？分别使用 ReAct、Workflow，还是其他结构？</summary></details>
<p>先比较流程是否稳定、下一步能否枚举、是否需要根据新观察改变行动，再选择固定工作流或受限的Agent循环。规则、授权、预算与提交边界由运行时控制，语义判断可交给模型，并以相同任务验证质量、延迟和成本。具体采用了哪些内核需按项目事实说明，自动化程度高不等于必须使用更多Agent。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（6）Workflow 是由程序直接触发，还是封装成工具交给 Agent 调用？</summary></details>
<p>可以由程序按确定事件直接启动Workflow，也可以把受限Workflow封装成工具，让Agent在授权范围内提出调用。两种方式的核心差别在谁决定启动及参数，实际执行仍要检查输入、权限、预算和业务前置条件。说明本人系统的调用链与失败恢复方式，不能把工具封装当作跳过编排或审批的理由。</p>

<details data-knowledge-key="agent-event-driven"><summary>（7）当前任务主要由数据或其他 Agent 自动驱动，还是由用户通过人机交互发起？</summary></details>
<p>先分别画出用户请求、数据事件和其他Agent结果怎样进入任务入口，再说明去重、授权和当前状态检查。外部事件到达不应直接等同于执行许可，应先形成受验证的任务或观察，再由调度器推进。实际属于哪条路径要按项目说明，也可以同时存在不同入口。</p>

<details data-knowledge-key="agent-human-in-loop"><summary>（8）为什么现阶段仍需要较多人工交互？如果流程已经稳定，是否应该进一步提高自动化程度？</summary></details>
<p>先区分人工是在补充缺失信息、判断高影响事项，还是仅处理流程尚不完善的环节。对输入稳定、结果可验证且风险可控的步骤，可以用评测与受控试运行逐步自动化；高风险动作仍按权限和责任保留必要审批。是否减少交互应同时看正确性、人工负担、恢复与成本，不能只因流程稳定就取消全部确认。</p>

<details data-knowledge-key="agent-timeout-budget"><summary>（9）Agent 处理一次任务通常需要多长时间，是分钟级还是小时级？</summary></details>
<p>先说明任务类型、输入规模和完成定义，再给真实测量的端到端耗时分布，不能只报最快一次。把排队、模型、工具、人工等待、重试和验收分别记录，并区分交互响应与后台最终交付。没有测量时应明确尚无可靠分钟级或小时级结论，预算按业务目标设定。</p>

<details data-knowledge-key="llm-model-selection"><summary>（10）当前使用的模型大致是什么能力级别？不同任务如何选择模型？</summary></details>
<p>先说明项目实际使用的具体版本与输入输出能力，再按任务要求筛选模型候选。用相同任务、工具与预算比较正确完成率、尾延迟和合格任务成本，高风险约束另设门槛。路由、降级和升级都需要独立验证；不能仅凭品牌、参数量或价格判断能力级别。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（11）长会话中的上下文压缩主要采用哪些策略？设计这些策略时重点考虑了哪些因素？</summary></details>
<p>先为指令、当前目标、工具定义、输出和安全余量预留预算，再按相关性清理重复内容、抽取证据或生成带来源摘要。保留关键决定、否定约束、数字单位、未完成动作和工具调用结果配对，原始记录应可授权回读。用压缩后继续任务的正确性、约束遵守和总成本验收，不能只追求固定压缩率。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（12）对 Codex、DeepSeek 等通用 Agent 的主流上下文管理或压缩策略有了解吗？对于可持续、近乎无限对话的通用 Agent，通常应如何管理上下文？</summary></details>
<p>具体产品采用什么策略，应以核验过的版本、文档与实际行为为准；不能从Codex或DeepSeek名称推断内部机制。通用设计可将有限活跃上下文与外部原始记录、任务状态和长期记忆分开，按需检索并做有来源的压缩与检查点。可持续会话不等于单次模型输入无限，摘要失真、记录不可读或预算不足时仍须回源、缩小任务或停止。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（13）持续优化 Agent 时，主要关注哪些指标？</summary></details>
<p>先用真实业务目标定义任务完成率、严重错误和结果质量，再同时观察延迟、合格任务成本与人工修改负担。权限与安全违规单独报告，不能被平均质量分抵消。保留基线、样本范围、版本和失败切片，让每次优化能在同口径条件下复测，并检查线上长期结果。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（14）如何自动化评估 Agent 是否完整、正确地完成任务？</summary></details>
<p>先为每个任务规定初始环境、目标、允许动作和成功条件，再在隔离环境运行并读取实际产物或业务终态。确定性条件用程序验收，开放质量使用明确量表及经人工校准的评分器，同时检查轨迹中的权限、错误恢复与副作用。被测Agent说已完成不等于验收通过，环境故障或证据缺失要单独记录，不能算成功或静默删样本。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（15）目前在字节的转正情况如何？</summary></details>
<p>按已经确认的事实说明当前流程处于沟通、意向还是正式结果，并区分口头信息与书面安排。未确定的时间、职责或条件就说明仍待核实，不把计划或预期说成结果。此处只提供表达框架，不能代填当事人的转正情况。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（16）如果已经拿到转正意向，为什么仍在看其他机会？</summary></details>
<p>先确认是否确有转正意向及其确定程度，再解释继续了解机会的真实考虑。可以围绕工作内容、工程职责、培养方式和长期方向说明尚需确认的条件，同时履行现有工作与交接责任。不能编造竞争机会、承诺或薪资，也不能把本题前提自动当作本人事实。</p>

## 候选人反问

<details data-knowledge-key="agent-resume-interview"><summary>（17）贵团队开展 Agent 相关业务多久了？</summary></details>
<p>这条反问可以了解团队是探索、试点还是长期运营阶段，再追问当前重点问题与岗位责任。年限由对方回答，不能在备考稿中补写团队成立时间或据此判断成熟度。后续可以结合已有项目、真实用户和维护方式核实工作预期。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（18）在什么情况下有必要自建垂类 Agent，而不是采用“通用 Agent + Skill/工具”或基于 Codex 二次封装的方案？</summary></details>
<p>先明确垂类业务必须满足的知识、数据权限、流程约束、验收和运营要求，再检查现有通用方案能否在相同任务上达到这些要求。只有可验证的缺口和收益足以承担长期维护、评测与安全成本时，才逐步自建必要部分；也可以复用运行时，只补领域工具与规则。具体产品可定制到什么程度须另查对应版本，不能凭名称决定整套重写。</p>

<details data-knowledge-key="agent-learning-roadmap"><summary>（19）如果后续继续从事 Agent 开发，我应该重点关注和提升哪些方面？</summary></details>
<p>先向对方确认目标岗位近期要交付什么，再对照自己实际项目找出薄弱环节。可以围绕工具与状态、上下文、评测、安全和后端基础各做一个可验证练习，用失败案例和复现记录检查提升。优先级应来自岗位任务与已有能力，不能把通用路线或固定学习周数当成个人已完成经历。</p>

## 关联知识

- [AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)
- [从真实需求定义 Agent 项目](../../../knowledge/career/agent-project-requirements.md)
- [Data Contract 与上下游协作](../../../knowledge/data/pipeline/data-contracts.md)
- [确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)
- [事件驱动 Agent 与异步编排](../../../knowledge/llm/agent/agent-event-driven.md)
- [Human-in-the-loop 审批与人工接管](../../../knowledge/llm/agent/agent-human-in-loop.md)
- [端到端超时预算与 Deadline 传播](../../../knowledge/llm/production/agent-timeout-budget.md)
- [模型能力评估与选型](../../../knowledge/llm/basics/llm-model-selection.md)
- [上下文压缩、摘要与裁剪](../../../knowledge/llm/prompt/prompt-context-compression.md)
- [用业务指标证明 Agent 项目价值](../../../knowledge/career/agent-project-evaluation.md)
- [Agent 评测原理：任务、轨迹与环境结果](../../../knowledge/llm/production/agent-eval-framework.md)
- [从零到 Agent 工程师的学习路线](../../../knowledge/career/agent-learning-roadmap.md)
