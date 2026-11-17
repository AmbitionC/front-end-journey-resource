原帖自述为淘天 AI 应用开发暑期实习二面，时长约一小时；具体面试日期未披露。问题集中在实习项目、RAG 评测、多 Agent、工具调用、代码审查与成本控制。

以下短答为编辑整理的复习思路，原帖没有提供现场答案。实习、项目和论文的具体材料仍需本人补充；文中的召回比例仅是原帖提问背景，不是经独立验证的效果。

## 问题与回答思路

<details data-binding-status="pending_semantic_verification"><summary>（1）请介绍实习经历。</summary><p>关联知识点待核实。</p></details>
<p>原帖只写了“实习拷打”，未提供实习任务、个人分工或具体追问，相关条件待补。只能依据真实经历准备任务、贡献与验证材料，不能补写当事人的实施方案或成果。</p>

<details data-knowledge-key="rag-evaluation"><summary>（2）有没有召回准确率等过程指标？</summary></details>
<p>先澄清“准确率”指候选精确率、召回率，还是最终答案正确率，再说明相关证据的标注、统计单位与 K。召回、排序、生成和端到端指标分开报告，避免用一个比例代替整条链路质量。</p>

<details data-knowledge-key="rag-testing"><summary>（3）评测机制和评测集是怎样构建的？</summary></details>
<p>从真实脱敏查询、专家边界题和历史失败中分层取样，为问题保存证据、必要事实、权限和评分规则。开发集与冻结回归集分开，自动规则、经校准的 Judge 和人工复核配合，并绑定数据与模型版本。</p>

<details data-knowledge-key="rag-evaluation"><summary>（4）如果采用人工标注，样本量大概需要多少条？</summary></details>
<p>没有通用条数，应先说明标注单位、任务与风险切片、标注复核和允许的不确定性。比例指标可报告样本量和合适的置信区间，长尾和高风险案例另行覆盖；原帖没有给出项目实际条数，不能代填。</p>

<details data-knowledge-key="rag-failure-debugging"><summary>（5）如果报告召回率为 75%，未召回的其余 25% 可能是什么原因？</summary></details>
<p>先固定 K、相关证据分母与语料版本，确认 75% 的统计口径；这个比例只是原帖中的提问背景。再逐例检查数据是否存在、解析与切块、索引更新、查询改写、过滤和候选深度，用单变量对照验证根因，不能把所有缺失都归为 Embedding 问题。</p>

<details data-knowledge-key="multi-agent"><summary>（6）第二段实习中涉及多 Agent 设计：单 Agent 和多 Agent 有什么差异？</summary></details>
<p>先区分一个 Agent 的并行工具调用与多个独立决策循环，再比较上下文隔离、任务依赖、权限和结果汇合成本。可独立探索且需要局部上下文的任务才有拆分理由，需与单 Agent 在同预算下比较；原帖未披露实习的具体设计。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（7）调研过哪些任务编排思路？</summary></details>
<p>先按任务依赖和可预定程度选择固定流程、路由、并行或动态委派。将状态、重试、审批、预算和终止条件交给运行时治理，模型只在明确节点作语义选择；是否用框架由恢复与可观测性需求决定。</p>

<details data-knowledge-key="rag-pipeline"><summary>（8）如何理解 RAG 的原理？</summary></details>
<p>把离线的解析、切块、表示与建索引，和在线的查询、权限过滤、召回、重排、证据装配与生成分开说明。检索提供外部事实，模型依据证据作答并保留引用；证据不足时需要澄清或拒答，效果由分层评测验证。</p>

<details data-knowledge-key="prompt-template-design"><summary>（9）Prompt 提示词模板怎样管理？</summary></details>
<p>将稳定规则、受类型约束的变量、不可信正文和供应商消息适配分开维护。校验输入后渲染，再检查最终消息、长度和输出契约，模板及依赖片段以不可变版本保存，便于回归与回滚。</p>

<details data-knowledge-key="prompt-versioning"><summary>（10）Prompt 每次更新是否需要版本概念？</summary></details>
<p>每次影响行为的修改都应能定位到不可变提示包，把模板、模型、工具 Schema、检索与输出解析版本一起记录。发布前用同一评测集比较，线上按稳定分流观察质量、延迟和成本，出现退化可切回旧版本。</p>

<details data-knowledge-key="llm-model-selection"><summary>（11）第一段实习中的自研模型，有没有与通用大模型比较？</summary></details>
<p>应以同一任务、数据、评分规则和资源约束比较具体模型版本，报告质量、延迟、成功任务成本与失败切片。原帖未给出对比对象或结果，只能说明比较方法，不能声称自研模型胜过某个通用模型。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（12）最终用什么指标衡量项目结果？</summary></details>
<p>从业务目标和基线出发，定义任务完成、关键错误、人工修改、延迟与总成本，并同时检查权限和安全约束。报告样本范围和不确定性，把离线质量、线上表现与业务收益分开；原项目的实际指标待补。</p>

<details data-knowledge-key="function-calling"><summary>（13）本地生活服务项目是你自己做的吗？请说明其中 Function Calling 的完整工作流。</summary></details>
<p>项目归属与个人贡献需依据真实经历说明，原帖未给出答案。技术链路可以按注册工具、模型提出结构化调用、执行端校验与授权、执行、按调用 ID 回传结果、继续或结束来讲，不能把一般流程写成原项目实现。</p>

<details data-knowledge-key="agent-parallel-tools"><summary>（14）用户一次询问涉及两个函数时，系统怎样安排调用？</summary></details>
<p>先确认两个调用是否互相依赖或修改同一资源。输入独立、只读且满足预算时可并行，否则按依赖排序；结果按调用 ID 汇合，明确必需结果、部分失败、取消和超时策略，两个候选工具也可能只是需要先消歧的不同方案。</p>

<details data-knowledge-key="agent-tool-design"><summary>（15）定义了多少个供模型调用的函数，应该怎样设计？</summary></details>
<p>原帖未披露工具数量，不能代填；数量应来自业务能力边界和真实意图评测。工具按窄意图设计，明确何时使用与不用、输入输出 Schema、权限、副作用和错误，避免一个万能函数或大量重叠能力。</p>

<details data-knowledge-key="agent-tool-design"><summary>（16）不同函数的描述出现歧义或冲突时怎么办？</summary></details>
<p>先比较业务意图、输入、权限和副作用，合并真正重复的能力，保留必要差异。描述应明确适用与排除场景，并用容易混淆的真实查询测误选率；参数不足时澄清，不能只给工具换名字就认为消歧完成。</p>

<details data-knowledge-key="agent-architecture"><summary>（17）Function Calling 与 Agent 有什么区别？</summary></details>
<p>Function Calling 是模型提出结构化工具调用的接口能力，实际函数由应用执行。Agent 则围绕目标维护状态，根据工具观察持续选择下一步，并具备校验和停止条件；一次函数调用可以是其组成部分，也可只处于固定流程中。</p>

<details data-knowledge-key="agent-architecture"><summary>（18）若将本地生活服务项目升级为 Agent 体系，还需要增加什么？</summary></details>
<p>先确认业务确实需要根据中间结果动态行动，再补目标与成功判据、状态、受控工具、观察反馈、失败恢复和终止预算。权限、幂等与验收由运行时落实；原帖没有项目现状，需先补现有链路，才能判断具体改造差距。</p>

<details data-knowledge-key="agent-coding"><summary>（19）请举一个用 AI 编程工具完成的较复杂开发任务。</summary></details>
<p>用自己真实完成的案例说明仓库背景、需求、跨模块依赖、给模型的上下文和人工负责的决策。展示最小补丁、实际测试与审查证据，再讲失败与修正；原帖没有该案例，不能补造开发成绩。</p>

<details data-knowledge-key="agent-coding"><summary>（20）审查 AI 生成代码时，用开源框架还是其他方式？</summary></details>
<p>先说明审查目标与实际采用的工具，再组合格式和类型检查、受影响行为测试、安全与依赖检查、人工 Diff 审查。开源框架只能承担其中一部分，模型自评或测试启动不等于通过；原帖没有披露具体审查工具。</p>

<details data-knowledge-key="chain-of-responsibility-validation"><summary>（21）AI 辅助模块设计时，用到了哪些设计模式？</summary></details>
<p>结合真实变化点说明模式的用途，例如用工厂分离对象创建、用策略替换同一职责的算法、用责任链组织有明确终止条件的校验，再说明接口合同与测试。不能为了报出模式名增加抽象，也不能把这些教学例子当成原项目事实；实际模块和采用的模式待补。</p>

<details data-knowledge-key="multi-agent"><summary>（22）单 Agent 与多 Agent 分别适合哪些使用场景？</summary></details>
<p>任务在一个上下文内可完成、依赖强或延迟要求紧时，优先单 Agent 加必要的确定性编排。可独立多轮探索、上下文或权限需要隔离时再评估多 Agent，并计入派发、汇总、通信与冲突处理的总成本。</p>

<details data-knowledge-key="llm-vision-app"><summary>（23）电商商品需要图文分类时，怎样设计自动分类系统？</summary></details>
<p>先固定类别体系、单标签或多标签规则与标注标准，再比较文本、图像及融合基线。输入经过质量检查，输出受类别 Schema 与业务规则约束，按类别评精确率、召回率和错误成本；图文冲突、未知类别和低质量输入送人工复核并进入回归集。</p>

<details data-knowledge-key="ai-rate-limiting"><summary>（24）借鉴秒杀场景，如何限制 Agent 的大量接口调用？为控制成本，如何对不同大模型差异化限流，并考虑轻量模型与重量模型的切换？</summary></details>
<p>入口按可信租户与工具控制请求速率，执行层分别约束并发、等待队列和调用预算，模型费用采用可幂等预留与结算。不同模型配置独立容量和成本策略，切换前验证任务能力与质量，替代调用仍受总期限、尝试次数和费用上限约束，不能无限降级重试。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（25）秒杀场景如何保证库存不超卖？</summary></details>
<p>把库存非负和一单只扣一次写成业务不变量，在数据库用带充足库存条件的原子更新并检查影响行数，或在正确事务中锁定后扣减。请求幂等、订单写入、超时对账和补偿共同设计；只做限流或先查库存再无条件扣减，都不能独立保证不超卖。</p>

<details data-knowledge-key="agent-memory"><summary>（26）如何理解 Agent 的长期记忆与短期记忆？</summary></details>
<p>短期状态服务当前任务或会话，包括消息、工具结果和未完成步骤；长期信息跨会话保存经授权的事实、偏好或经历。持久化介质与是否进入本轮上下文分开，长期内容按相关性、权限和有效期检索，并有更正、冲突与删除策略。</p>

## 复习导航

- [RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)

- [RAG 测试集、Golden Set 与回归测试](../../../knowledge/llm/rag/rag-testing.md)

- [RAG 失败诊断：数据、召回、排序与生成](../../../knowledge/llm/rag/rag-failure-debugging.md)

- [多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)

- [确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)

- [RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)

- [Prompt 模板、变量与复用设计](../../../knowledge/llm/prompt/prompt-template-design.md)

- [Prompt 版本管理与 A/B 测试](../../../knowledge/llm/prompt/prompt-versioning.md)

- [模型能力评估与选型](../../../knowledge/llm/basics/llm-model-selection.md)

- [用业务指标证明 Agent 项目价值](../../../knowledge/career/agent-project-evaluation.md)

- [Function Calling 与工具调用](../../../knowledge/llm/dev/function-calling.md)

- [并行工具调用与依赖调度](../../../knowledge/llm/agent/agent-parallel-tools.md)

- [Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)

- [智能体定义、类型、PEAS 与 Agent Loop](../../../knowledge/llm/agent/agent-architecture.md)

- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)

- [责任链与业务校验：顺序、短路和副作用](../../../knowledge/backend/framework/chain-of-responsibility-validation.md)

- [视觉理解与图像生成应用](../../../knowledge/llm/dev/llm-vision-app.md)

- [AI 应用限流、配额与背压](../../../knowledge/llm/production/ai-rate-limiting.md)

- [事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)

- [短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)
