公司：小红书；来源将方向记为 PE、轮次记为一面，标题给出 3 月 25 日但未明确年份，部门未明示。本文选录订单号、摘要失真和执行范式三组问题。以下解答、故障例子与设计方案均为编辑教学补充。

<details data-knowledge-key="distributed-id">
<summary>（1）高并发订单号怎样兼顾全局唯一与递增要求？</summary>
</details>

唯一、时间趋势有序、单实例递增和跨实例严格递增是不同承诺。若只需近似时间顺序，可评估带时间前缀且治理好节点身份与时钟的方案；若要求先完成的一次发号之后，下一次调用一定取得更大号码，就要明确统一协调的发号顺序、持久化和故障恢复合同。号段减少中心往返，但只保证段内顺序。

教学反例：实例 A 领到 1—10，B 领到 11—20，B 发出 11 后 A 仍可发出 2。号码没有重复，却不满足跨实例按实际发号先后递增。[PostgreSQL 18 序列文档](https://www.postgresql.org/docs/18/sql-createsequence.html)也用多会话预缓存说明这种区别，且指出未使用缓存与回滚可能留下空洞。

[RFC 9562 的 UUIDv7](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7)使用毫秒时间前缀并允许额外的同毫秒单调机制；这并不自动产生跨机器的严格全序。类似地，[ShardingSphere 的 Snowflake 源码](https://shardingsphere.apache.org/statistics/staging/xref/org/apache/shardingsphere/infra/algorithm/keygen/snowflake/SnowflakeKeyGenerateAlgorithm.html)展示了 worker 身份、序列耗尽等待与时钟回拨处理；采用这类方案需要治理相应依赖，不能只背一个位数布局就宣称高可用且绝不重复。

若业务确需严格发号顺序，可以将分配放入受协调、持久化的顺序服务，并按故障模型验证非重叠调用的顺序；不能又用各实例任意预取号段削弱承诺。保留落库唯一约束，区分发号顺序与订单提交/支付顺序，JS/JSON 传输大整数还应避免 number 精度损失。原问未给吞吐、延迟、位宽和容错目标，不能替它指定唯一最佳方案。

延伸阅读：[分布式唯一 ID：生成、顺序性与时钟边界](../../../knowledge/backend/storage/distributed-id.md)。

<details data-knowledge-key="prompt-context-compression">
<summary>（2）上下文摘要怎样降低压缩造成的信息失真？</summary>
</details>

把原始记录作为可回查的事实源，摘要只保存当前任务需要的目标、约束、已确认事实、未解决问题和证据索引。数字、否定、权限、承诺和待完成动作要单独核对，关键字段可保留结构化形式；压缩后检查任务仍能继续，缺证据时回读，不能把更短直接等同质量更好。

教学例子是原文写“预算不超过 300，仍未确认下单”，摘要却变成“预算 300，已下单”。字数减少了，约束与状态却改变。可以把预算比较符、币种、订单状态和来源记录分成字段，在压缩前后做一致性检查，而不是只对两段自然语言再求相似度。

[Anthropic 的上下文工程文章](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)讨论 compaction、结构化笔记与按需回查。它说明的是工程策略，不给所有任务一个通用压缩率；当前任务的关键约束可能比旧闲聊更值得保留。

不要让摘要覆盖原始证据。为原记录保留可访问索引，摘要带版本和未解决项；当来源撤回、状态变化或摘要无法支持下一步动作时重新核对。验证应测关键事实保留、下一步任务成功与错误承诺，而不只测省下多少 token。原帖没有摘要算法、上下文规模或效果数据，以上是教学方案。

延伸阅读：[上下文压缩、摘要与裁剪](../../../knowledge/llm/prompt/prompt-context-compression.md)。

<details data-knowledge-key="agent-paradigms">
<summary>（3）复杂任务中怎样结合 Plan-and-Execute 与 ReAct 的执行反馈？</summary>
</details>

外层保留有依赖和验收条件的计划，内层根据当前观察选择工具并执行一个步骤；完成、失败或关键假设变化时，再把证据交给规划器修订剩余计划。计划提供全局结构，行动反馈提供动态调整，两者都受权限、总预算和停止条件约束；不能重规划时把已完成副作用全部重做。

教学任务是生成采购比较报告：外层规划资料范围、比较维度和报告产物，执行层检索、读取与核对证据。若某资料不可访问，就更新该子目标的状态与替代来源，而不是继续假定它已读；若需求改变，重排受影响步骤，保留仍有效的结果。

[LangChain 的 Plan-and-Execute 架构文章](https://www.langchain.com/blog/planning-agents)将 planner 与 executor 分开，并描述执行后选择结束或重规划的流程。它是一个具体工程例，不能把“不允许重规划”当作所有 Plan-and-Execute 的定义，也不能把某次架构实验的提速数字套到自己的系统。

执行状态应保存步骤身份、输入版本、依赖、证据和终态，修改计划时处理失效结果与正在运行的任务。每次重规划也消耗同一总预算，重复动作和无新证据要能触发停止或澄清。验收依赖实际产物和证据，模型说“计划完成”只是待核对的信号。

延伸阅读：[Reflection、Plan-and-Execute 与 Tool-Use](../../../knowledge/llm/agent/agent-paradigms.md)。

## 参考资料

- [PostgreSQL 18：序列缓存与发号顺序](https://www.postgresql.org/docs/18/sql-createsequence.html)。
- [RFC 9562：UUIDv7 时间前缀](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7)。
- [Apache ShardingSphere：Snowflake 源码](https://shardingsphere.apache.org/statistics/staging/xref/org/apache/shardingsphere/infra/algorithm/keygen/snowflake/SnowflakeKeyGenerateAlgorithm.html)。
- [Anthropic：上下文工程、按需取回与压缩](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。
- [LangChain：Plan-and-Execute 与重规划](https://www.langchain.com/blog/planning-agents)。
