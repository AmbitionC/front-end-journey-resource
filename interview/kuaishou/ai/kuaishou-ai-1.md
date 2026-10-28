### 快手大模型应用 Java 实习一面：Agent、SkillHub 与 Vibe Coding

这份记录围绕大模型应用 Java 实习一面的 Agent 项目、Tool、消息可靠性和 SkillHub 展开，后半程要求现场用 AI 完成浏览器插件。作者标注面试在 8 月 17 日，未明示年份；采集元数据中的 2026 年 8 月是发帖时间。本文选录工程问题和约 30 分钟的编程任务，不收录自我介绍和未展开的反问。下文是教学回答框架，不代表候选人的实际项目实现或作答。

<details data-binding-status="pending_semantic_verification">
<summary>（1）Agent 项目应该怎样介绍？</summary>
<p>关联知识点待核实。</p>
</details>

用“业务目标—输入输出—控制循环—工具与状态—失败路径—效果指标”讲清一条真实链路。先说明为什么固定流程不足，再解释模型在哪些节点做决策、哪些步骤仍由确定性代码控制。最后给出成功率、延迟、成本和人工接管率，而不是只列框架名。

<details data-knowledge-key="agent-paradigms">
<summary>（2）常见 Agent 开发范式有哪些？</summary>
</details>

ReAct 适合边观察边行动；Plan-and-Execute 适合先分解再执行的长任务；状态图适合分支、循环、检查点与人工审批；多 Agent 适合角色边界和上下文确实需要隔离的任务。范式选择应由失败代价、步骤依赖、可恢复性和观测需求决定。

延伸阅读：[Agent 范式](../../../knowledge/llm/agent/agent-paradigms.md)、[任务规划与动态重规划](../../../knowledge/llm/agent/agent-planning.md)。

<details data-knowledge-key="agent-tool-design">
<summary>（3）Tool 调用要注意什么？</summary>
</details>

工具应有窄而明确的输入 Schema、权限、超时、幂等和错误语义。模型给出的参数必须在服务端重新校验；读取和有副作用的动作分开授权；返回结果限制大小并保留结构。失败要区分可重试、参数错误、权限拒绝和业务冲突，避免模型盲目循环。

延伸阅读：[Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（4）怎样证明 Tool 集成优化有效？</summary>
<p>关联知识点待核实。</p>
</details>

先建立固定任务集和原始基线，再分别测工具选择准确率、参数一次通过率、平均调用数、任务成功率、P95 延迟和单成功任务成本。对候选方案做配对回放，按任务类型切片。只展示总体平均值或几个成功案例，无法证明优化来自工具层。

<details data-binding-status="pending_semantic_verification">
<summary>（5）Redis 分布式锁如何与 Kafka 配合？</summary>
<p>关联知识点待核实。</p>
</details>

Kafka 消息至少可能重复投递，Redis 锁只能降低同一时刻的并发执行，不能替代业务幂等。消费者应以业务事件 ID 建唯一约束或幂等记录，在业务成功后提交 offset；跨数据库与消息的写入可用 Outbox/Inbox。锁必须有过期、持有者标识和原子释放，并处理执行时间超过租期的问题。

<details data-binding-status="pending_semantic_verification">
<summary>（6）Kafka 如何减少丢失和重复？</summary>
<p>关联知识点待核实。</p>
</details>

生产者开启幂等并等待足够副本确认；Broker 配置副本与最小同步副本；消费者在处理成功后提交 offset。写外部系统时仍需唯一键、状态机或事务消息。回答应逐段说明“生产成功但响应丢失”“消费成功但提交失败”等窗口。

<details data-knowledge-key="agent-skill-design">
<summary>（7）SkillHub 的存储和合规怎样设计？</summary>
</details>

Skill 以不可变版本保存指令、输入输出契约、权限声明、依赖、作者和校验摘要；发布前做静态扫描、来源与许可证检查、危险能力审核和隔离运行。运行时按身份授予最小权限，记录实际工具调用。下架版本不能破坏正在运行的任务，历史执行必须能还原当时版本。

延伸阅读：[Agent Skill 的设计与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)、[供应链安全](../../../knowledge/llm/production/agent-supply-chain.md)。

<details data-knowledge-key="agent-benchmark">
<summary>（8）Agent 自动运营体系如何评估？</summary>
</details>

把选题、生成、审核、发布和复盘拆成可观察状态；事实核验、敏感内容和最终发布保留门禁。Benchmark 除内容质量外，还应衡量事实错误、重复率、人工修改量、发布成功率、时效、成本和真实业务转化。线上反馈进入新评测集，但不能让被测 Agent 修改自己的验收规则。

延伸阅读：[Agent Benchmark 的设计与解读](../../../knowledge/llm/production/agent-benchmark.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（9）现场用 AI 实现标签页管理、访问记录与动向推荐插件，怎样完成？</summary>
<p>关联知识点待核实。</p>
</details>

先实现最小闭环：读取标签页、记录访问事件、持久化有限历史、基于 mock 数据给出下一步建议。明确 Manifest 权限，监听创建/更新/关闭事件，写入 `storage.local` 时做容量和去重控制；推荐逻辑与采集分层，便于替换。最后用三条冒烟验证：重启后历史仍在、关闭标签页不泄漏监听器、无权限页面安全失败。
