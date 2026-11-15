记录自述为字节后端 / Agent 开发秋招三面，主要围绕智能总结、本体与能力开放、个人项目及计算机基础展开。面试日期未公开；与其他轮次记录的招聘流程关系未确认。

本页仅依据已见文字整理，原帖图片内容未核验，不据图片补充问题或条件。以下短答是编辑整理的复习思路，不代表当事人的现场回答、实际实现或已取得的效果。

<details data-knowledge-key="agent-project-requirements"><summary>（1）第一个项目解决了什么问题？</summary></details>
<p>原文没有记录项目的完整目标和现场回答。准备时先说明谁在什么流程遇到问题、输入与输出分别是什么，再用真实验收材料说明改进；不要把教程中的业务场景代填成作者实现。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（2）做的是项目前的信息总结，还是项目之后的处理？</summary></details>
<p>先确认总结的触发时点、可用输入和使用者在该时点能做什么，再区分事前辅助与事后归纳的目标。原文只给出这项追问，没有确认项目实际属于哪一种，也不能把采集时间当作业务处理时间。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（3）总结来自哪里？</summary></details>
<p>应核对总结使用的授权数据来源、生成或更新时点，以及输出能否回到具体证据。原文没有披露来源系统和材料，不能直接断言来自面试录音、简历或某个数据库。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（4）怎样衡量项目效果，具体的数据是什么口径？</summary></details>
<p>先给出指标定义、分子分母、样本范围、标注标准和比较窗口，再区分字段正确率、人工修改量与业务结果。基线和新方案应在可比较任务及判据下验证；原文没有实际数字，不能补造提升幅度。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（5）纠正前的数据是旧方案表现，还是自己初版测试的结果？</summary></details>
<p>明确“纠正前”对应旧系统还是自己的初版，保存版本、测试集和评分口径，再用同一条件复核变化。两种基线回答的问题不同，若样本或标准同时变化就不能直接归因；原文未确认当时使用哪一种。</p>

<details data-knowledge-key="prompt-structured-output"><summary>（6）关键字段有哪些，哪些字段容易出错？</summary></details>
<p>按实际任务列字段含义、类型、枚举、缺失语义与证据，再从错例判断哪些字段容易混淆。Schema 合法只保证结构约束，事实和跨字段规则仍要验证；原文未列出关键字段，不能替作者编造招聘字段清单。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（7）模型提取能力已较成熟，项目真正的复杂性在哪里？</summary></details>
<p>把模型抽取与跨系统标识、术语、状态及取值对齐分开说明，再用实际错例解释主要工程困难。原文提到字段名和取值不统一，但未提供完整实现或量化结果；模型抽取较强也不能自动解决业务语义冲突。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（8）多系统字段名、取值口径不一致时怎么处理？</summary></details>
<p>先定义领域概念及适用上下文，为各系统字段、枚举、标识和时间口径建立可追溯映射，再验证同名异义与未知值。不要只统一字段名称，或让模型猜测冲突值；具体映射和纠正规则在原文中未披露。</p>

<details data-knowledge-key="prompt-template-design"><summary>（9）所有业务都用统一总结模板吗？</summary></details>
<p>可将稳定任务规则与带类型的业务变量分开，按职责复用模板，并为差异明显的任务保留独立输出合同与版本。是否共用模板应由实际输入、用户需求和评测决定；原文没有说明项目实际使用的模板数量或配置。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（10）工作流基于什么平台，入口已经拆分还是先识别意图再路由？</summary></details>
<p>若入口已提供明确任务类型，可用确定分支选择流程；若需要从自然语言判断，则让受限分类返回允许的选项，并处理歧义和失败。路由与工作流执行是不同责任，原文未披露平台或实现，不能代填框架名称。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（11）本体化和柔性引擎项目与智能总结有什么区别，主要困难是什么？</summary></details>
<p>比较两个项目的目标、输入输出与责任边界：单项总结任务与跨系统概念和能力治理要解决的问题不同。主要困难应回到真实的语义冲突、映射和执行约束举例；原文没有足够细节证明作者实际采用了哪套建模方法。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（12）本体、Action 怎样定义，如何关联到底层能力？</summary></details>
<p>先用领域对象、关系和术语说明业务含义，再把 Action 定义为带输入、前置条件、权限、副作用与结果的操作合同，通过适配器调用底层能力。这里的 Action 是工程设计概念，不等于 OWL 自带执行原语，也不代表作者使用了某个产品的固定分类。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（13）业务概念怎样统一，为什么不能直接映射数据库表？</summary></details>
<p>数据库表是存储组织，业务概念还涉及上下文、身份和生命周期，同名字段未必同义。能否直接复用映射要用业务含义与约束验证；不要机械地一表建一个对象，也不必为了领域模型先改写全部表。</p>

<details data-knowledge-key="agent-tool-design"><summary>（14）Action 粒度怎样确定？</summary></details>
<p>围绕一项可验收的业务意图确定输入、权限、成功结果与失败语义，并检查读写和高风险副作用的边界。太粗的万能动作难以授权，过细的字段操作可能泄露本应由后端维护的不变量；连续工具调用本身不保证事务原子性。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（15）先做领域建模再开放能力，与 CLI 加 Skill 的路线有什么优缺点？</summary></details>
<p>领域建模处理对象含义和动作合同，CLI 提供调用入口，Skill 组织任务做法，三者可以组合。先建模有利于反复治理跨系统语义，但增加前期协作和维护；复用稳定 CLI 可较快验证任务，也仍需补齐权限、错误与语义边界，效果要用真实任务验证。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（16）存量系统重构成本高时，你的方案还适合吗？</summary></details>
<p>可以先在受限范围用适配或防腐层翻译新旧语义，复用既有接口或 CLI，再根据验证决定是否扩展。额外层也增加时延、运维和一致性负担；若语义差异很小或接口能力不足，应重新权衡，原文没有证明该项目已完成渐进改造。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（17）本体化项目是否已有实际效果和量化指标？</summary></details>
<p>区分概念设计、能力包装、内部试用和真实上线，并给每一阶段匹配可复核证据。离线成功率不能直接证明业务净收益；原文没有提供实际效果或量化指标，不能把未来目标写成已实现成果。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（18）你在项目中是什么角色，导师、带教和你如何分工？</summary></details>
<p>分别说明接手前的平台能力、导师或带教提供的方向，以及自己亲自完成的设计、实现和验证。可用脱敏提交、用例与交付范围核对个人贡献；原文未披露具体分工，不能把团队成果全归给作者。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（19）提炼你的关键职责与关键工作。</summary></details>
<p>围绕目标、责任边界、关键决策、实际交付和验证结果提炼职责，说明哪些工作由自己完成、哪些仍依赖他人。没有结果数字时可交代可复核的交付状态，不能为了表达完整补造主导经历或收益。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（20）介绍个人项目目标和架构。</summary></details>
<p>先讲个人项目要解决的真实问题，再沿输入、关键模块、输出、失败处理与验收说明架构和取舍。原文没有给出实际架构，通用 Agent 或 RAG 教学链路只能作为准备方法，不能当作作者项目实现。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（21）这是练手项目，还是已经有业务效果？</summary></details>
<p>练手、原型、试用和业务落地代表不同证据范围，应准确说明当前阶段。可以用可复现用例证明能力，但业务效果还需真实流程、基线、用户结果与成本；原文没有给出这些结果。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（22）公开数据评测怎样做，使用了什么工具或平台？</summary></details>
<p>先说明公开数据与目标业务的匹配范围，固定用例、版本、初始环境和成功判据，再选择能保留运行记录与评分依据的工具。分开调优与测试，报告有效执行数、失败和切片；原文未披露具体数据集、平台或执行结果。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（23）项目的指标比较是怎么来的？</summary></details>
<p>明确比较对象的模型、提示词、数据与工具版本，以及相同任务、预算和评分规则下的结果。报告样本量、分母、失败切片与不确定性，避免把不同数据分布的均值当成改进证据；原文没有给出实际比较数据。</p>

<details data-knowledge-key="os-process-thread"><summary>（24）进程、线程的定义和区别是什么？</summary></details>
<p>进程通常提供地址空间与资源边界，线程是其中的执行流，共享进程资源并保留各自栈和寄存器等执行状态。共享使通信方便，也带来同步与竞态问题；进程仍可能共享外部资源，不能据此承诺完全故障隔离或固定性能倍数。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（25）Java 运行时数据区有哪些？</summary></details>
<p>按规范说明共享的堆、方法区及运行时常量池，以及线程私有的 PC、JVM 栈和实现需要的本地方法栈。区分这些逻辑区域、HotSpot 元空间等实现机制与约束可见性的 JMM；进程内存也不只有 Java 堆。</p>

<details data-knowledge-key="tcp-udp"><summary>（26）TCP 和 UDP 有什么区别？</summary></details>
<p>TCP 提供面向连接的可靠有序字节流，应用仍要定义消息边界；UDP 提供独立数据报，但不保证交付、顺序与去重。是否适合取决于过期数据价值、重传和拥塞等整体约束，不能概括成 TCP 一定慢、UDP 一定快。</p>
