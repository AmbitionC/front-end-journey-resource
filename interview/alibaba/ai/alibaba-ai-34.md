岗位：Agent 开发；轮次：一面；具体部门未说明。

以下保留已见文字中的问题与追问。短答是编辑整理的回答思路，不代表候选人的现场回答；原文没有提供项目代码、具体实现或效果数据。

## 面试问题与答题思路

<details data-knowledge-key="agent-project-portfolio"><summary>（1）先从技术架构开始介绍项目，并重点说明自己负责的部分。</summary></details>
<p>先说明项目要解决的问题、主要组件及一次请求的流向，再界定自己负责的模块、接口和决策。用实际代码、设计文档或验证记录说明个人贡献，并区分团队已有能力与本人完成的工作。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）项目怎么做到让“这块”具有通用性，并更好地复用？</summary><p>关联知识点待核实。</p></details>
<p>原文没有交代“这块”具体指哪个模块、能力或接口，相关指代待补充。保留通用性与复用这组追问，待确认职责和调用场景后再讨论抽象边界，暂不关联具体知识点。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（3）整体项目从评估到实施的过程怎样，过程中遇到了什么问题？</summary></details>
<p>按需求与现状、方案比较、验证、分阶段实施和结果复盘串起真实过程。评估时说清依据与基线，实施时说明自己的责任、暴露的问题及实际处理证据；没有测过的指标和没有发生的步骤应明确说明。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（4）这次重构的最大技术难题是什么？</summary></details>
<p>从真实重构中选出最影响目标的一项困难，说明原有约束、为什么难、比较过哪些方案及自己作出的取舍。再用实际回归、迁移或运行记录解释结果与遗留风险，不把一种常见难题直接套成自己的经历。</p>

<details data-knowledge-key="ddd-domain-modeling"><summary>（5）业务有哪些核心实体，这些实体之间的关系怎样？</summary></details>
<p>先限定业务场景和术语边界，按持续身份识别核心实体，再说明关联方向、数量关系和生命周期。结合一个真实业务用例解释哪些规则必须一起成立、由谁维护，避免把表与外键直接当成完整领域模型。</p>

<details data-knowledge-key="agent-coding"><summary>（6）怎么看现在的 AI Coding，怎样更高效地完成复杂的 Coding 任务？</summary></details>
<p>把 AI Coding 放进可验证的交付流程：先提供目标、代码基线、改动范围和验收条件，再拆成能独立检查的小步。让 Agent 读取相关上下文、生成最小补丁，随后运行相关测试并审查 diff；是否提效应结合实际返工、质量和成本记录判断。</p>

<details data-knowledge-key="agent-coding"><summary>（7）日常怎样维护工程的 Harness？</summary></details>
<p>先说明这里的 Harness 包含哪些项目说明、工具、环境、权限、状态和验证入口，再把实际失败归因到对应环节。随接口和工程变化更新说明与可执行检查，用固定任务回归验证调整后的行为，并保留可交接的进度和结果证据。</p>

<details data-knowledge-key="agent-test-pyramid"><summary>（8）TDD 怎样实现？</summary></details>
<p>先依据需求与接口合同列出场景，每次选一个写成可运行测试，确认它因目标行为缺失而失败。补足让新旧测试通过的最小实现，必要时重构并持续保持通过，再进入下一个场景；不要把环境报错当成需求失败，也不要让测试照抄实现的错误。原文没有提供具体业务场景或测试框架。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（9）从整体设计和目标介绍一下 Agent 项目。</summary></details>
<p>先交代目标用户、要完成的任务、权限边界和成功判据，再沿一次真实执行说明模型、工具、状态和验证怎样协作。解释为何需要 Agent、哪些步骤保持确定性，并用本人实际完成的产物与失败案例支撑设计。</p>

<details data-knowledge-key="agent-architecture"><summary>（10）这里的 Agent 是怎样开发的？</summary></details>
<p>围绕真实任务说明观察、状态更新、模型决策、工具执行、结果校验与停止这条闭环，再说明自己实现或复用了哪些部分。工具调用前由运行时校验参数与权限，失败、预算用尽和需要补充信息时有明确出口；原文没有给出框架和代码，不能补写成某种既定实现。</p>

原文另记“会话状态上传到云端实现”，未说明这是已有实现还是待设计要求；此处只保留为相邻语境。

<details data-knowledge-key="agent-state-storage"><summary>（11）不管用扣子还是自研框架，怎样设计解决慢和状态丢失这两个问题？</summary></details>
<p>先用实际链路区分排队、模型、工具与状态写入的耗时，再明确哪些会话数据必须持久保存、何时算保存成功。用稳定会话与运行标识、版本化检查点和追加事件支持恢复，缓存只承担加速；优化写入或并行后仍要验证故障恢复、并发覆盖与外部副作用，不能用换框架直接承诺解决。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（12）上下文压缩怎样做？</summary></details>
<p>先按目标模型预算保护当前目标、有效约束、关键事实、未完成任务与出处，再对冗余历史和大工具结果做裁剪、抽取或摘要。保留原始记录及回读引用，压缩后对照事实、否定条件和继续任务结果验收；文字更短不等于任务信息无损。</p>

<details data-binding-status="pending_semantic_verification"><summary>（13）Java 相关的理论对吧？相比于 Go 和 Java 来说有啥区别？</summary><p>关联知识点待核实。</p></details>
<p>原文只保留了这句笼统比较，没有说明比较的是语言、并发、内存还是其他机制，比较对象和范围仍待确认。这里保留问题，暂不把它扩写成某个运行时或调度模型的考点，也不增加知识热度。</p>

