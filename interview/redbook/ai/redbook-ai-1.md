### 小红书 Agent 开发一面：多智能体、Memory 与广告投放优化

这轮小红书 Agent 开发一面的日期在可见记录中写作 8 月 9 日，未注明年份。内容从实习项目延伸到 OpenManus、Harness、多 Agent 并发、Memory、ReAct、Planner–Executor–Critic、上下文管理和广告投放自优化。

本页仅依据当前可见文字选录以下九组主题，展开是否完整及图片内容未经确认。未展开项目实际所用框架、具体代码架构和 OpenManus 具体实现框架的追问；第（8）题只整理 Redis 常见类型与 Java 类加载，没有展开各 Redis 类型的底层实现。未收录个人经历介绍与反问。短答和架构示例为教学补充，不代表作者当时的回答、实际项目或效果。

<details data-binding-status="pending_semantic_verification">
<summary>（1）怎样介绍 Agent 项目的业务价值？</summary>
<p>关联知识点待核实。</p>
</details>

先交代用户、原流程痛点和业务目标，再说明 Agent 接收什么输入、能执行哪些动作、最终改变哪个指标。指标应同时覆盖业务效果与系统质量，例如转化率、处理时长、任务成功率、人工接管率、P95 延迟和单任务成本。最后明确个人负责的模块、关键取舍和一次失败复盘，避免只罗列框架名称。

<details data-binding-status="pending_semantic_verification">
<summary>（2）什么场景值得用 Agent，而不是固定工作流？</summary>
<p>关联知识点待核实。</p>
</details>

当任务目标明确，但中间步骤依赖动态观察、工具结果和异常分支时，Agent 的规划与反馈循环才有价值。若步骤稳定、规则充分、错误代价高，显式工作流更可控。生产系统通常把两者结合：工作流约束主路径和权限，Agent 只在需要语义判断或动态决策的节点工作。

<details data-binding-status="pending_semantic_verification">
<summary>（3）怎样理解 OpenManus 的整体设计与 Harness？</summary>
<p>关联知识点待核实。</p>
</details>

分析框架时应看状态模型、规划循环、工具协议、记忆、沙箱、错误恢复和可观测接口，而不只看支持多少 Tool。Harness 是围绕模型构建的执行环境与约束集合，包括任务说明、上下文组织、工具、验证器、反馈和预算。它提升复杂任务成功率的原因，是让模型每一步都能获得可验证反馈，并把不稳定生成限制在确定性的工程边界内。

<details data-knowledge-key="multi-agent">
<summary>（4）多 Agent 协同的性能瓶颈在哪里？</summary>
</details>

并发并不等于吞吐线性增长。常见瓶颈包括模型配额、工具连接池、共享状态锁、重复上下文、串行汇总和失败重试风暴。可以按任务依赖构建 DAG，只并行无依赖分支；通过租约或信号量限制全局与租户并发；对只读上下文做引用传递；设置超时、退避、熔断和预算。共享写操作还要有幂等键与冲突策略。

延伸阅读：[多智能体系统](../../../knowledge/llm/agent/multi-agent.md)、[Agent 并发控制](../../../knowledge/llm/production/agent-concurrency.md)。

<details data-knowledge-key="agent-memory">
<summary>（5）短期记忆与长期记忆怎样实现？</summary>
</details>

短期记忆服务当前任务，可由消息窗口、结构化任务状态和阶段摘要组成；长期记忆跨任务保存稳定事实、偏好、经验或技能。长期写入不能把所有对话直接向量化，而应先抽取事实，附上主体、时间、来源、置信度和权限，再做去重与版本化。读取时综合语义相关性、时效、重要性和访问控制，冲突内容按来源可信度处理。

延伸阅读：[Agent Memory](../../../knowledge/llm/agent/agent-memory.md)。

<details data-knowledge-key="agent-react">
<summary>（6）ReAct 与 Planner、Executor、Critic 是什么关系？</summary>
</details>

ReAct 在一次循环中交替推理、行动和观察，适合中短任务；Planner 负责分解目标与依赖，Executor 执行受控动作，Critic 根据证据和验收标准发现缺口并决定修订。Critic 不是再问模型一句“对不对”，而应使用测试、规则、引用校验或业务指标。复杂任务可以外层 Plan–Execute，节点内部使用 ReAct，并用最大轮次和预算终止。

延伸阅读：[ReAct 推理行动循环](../../../knowledge/llm/agent/agent-react.md)、[Agent 规划](../../../knowledge/llm/agent/agent-planning.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（7）Agent 上下文怎样管理，过长时如何拆分或压缩？</summary>
<p>关联知识点待核实。</p>
</details>

先把上下文分为不可丢的任务约束、当前状态、证据、历史过程和可重取数据。对过程历史做分层摘要，对工具大结果保存引用，对证据按查询动态检索；约束、未完成事项、错误和关键决策使用结构化字段保留。压缩后要检查约束覆盖率和事实一致性，并允许从原始存储回溯，而不是只保留一段不可验证的摘要。

<details data-binding-status="pending_semantic_verification">
<summary>（8）Redis 与 Java 类加载应掌握哪些核心点？</summary>
<p>关联知识点待核实。</p>
</details>

Redis 常用 String、Hash、List、Set、Sorted Set、Bitmap、HyperLogLog 和 Stream，选型依据访问模式、基数、顺序和一致性要求。Java 类从加载、验证、准备、解析到初始化；类加载器采用双亲委派以避免核心类被替换，插件化或隔离场景才会有意打破。回答底层原理时应结合一个实际故障或选型，而不是背诵定义。

<details data-binding-status="pending_semantic_verification">
<summary>（9）怎样设计 Agent 驱动的广告投放自优化？</summary>
<p>关联知识点待核实。</p>
</details>

先限定 Agent 只能在白名单策略空间内生成候选方案；数据层汇总曝光、点击、转化、成本和延迟归因；决策层依据目标函数与约束提出实验；执行层通过审批、灰度和预算闸门发布；评估层用 A/B 测试或因果方法比较增量收益。系统必须设置单日预算、出价上下限、异常熔断、审计日志和一键回滚。让 Agent 自动生成假设和分析结果可以，但资金动作不能缺少确定性校验。

