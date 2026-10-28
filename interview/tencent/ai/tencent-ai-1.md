### 腾讯一面：RAG、安全与后端工程

原帖只明确腾讯一面，未披露正式岗位名和具体面试日期；原帖发布于 2026 年 5 月。本文按主题选录技术问题，省略个人项目背景、客户反馈、专业和转语言的个人选择、是否有高并发经历，以及岗位介绍。以下答案为教学整理，不代表候选人现场回答或客户项目的真实规模、配置和交付记录。

原帖自述由多位面试官连续追问，覆盖 RAG、Redis/Kafka、Agent 安全、大表变更和 Coding Agent 工作流。本文选录下列技术问题。

#### （1）RAG 的原理和建库难点是什么？

<details data-binding-status="pending_semantic_verification">
<summary>（1）RAG 的原理和建库难点是什么？</summary>
<p>关联知识点待核实。</p>
</details>

RAG 先把文档解析、分块并建立向量/关键词索引；查询时改写或路由请求，召回、过滤和重排证据，再把有限且可追溯的上下文交给模型。难点通常不是调用向量库，而是文档解析质量、chunk 边界、权限过滤、版本更新、重复内容和无答案问题。

#### （2）除了“准确率”，RAG 应看哪些指标？

<details data-binding-status="pending_semantic_verification">
<summary>（2）除了“准确率”，RAG 应看哪些指标？</summary>
<p>关联知识点待核实。</p>
</details>

检索侧看 Recall@K、MRR/nDCG、上下文精确率；生成侧看答案正确性、忠实度、引用覆盖；系统侧看 P95/P99 延迟、吞吐、错误率和单次成本。并发量必须说明测试模型、索引规模、硬件和缓存条件，否则一个 QPS 数字没有可比性。

延伸阅读：[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)。

#### （3）Redis 高可用和持久化怎样回答？

<details data-binding-status="pending_semantic_verification">
<summary>（3）Redis 高可用和持久化怎样回答？</summary>
<p>关联知识点待核实。</p>
</details>

主从复制提供副本，Sentinel 负责故障发现与切换，Cluster 同时提供分片能力。RDB 是周期快照，恢复通常较快但可能丢失最近窗口；AOF 记录写命令，数据窗口可更小但文件和重放成本更高。生产环境常结合使用，并实际演练故障恢复，而不是把持久化等同于备份。

#### （4）Kafka 怎样降低重复和丢失？

<details data-binding-status="pending_semantic_verification">
<summary>（4）Kafka 怎样降低重复和丢失？</summary>
<p>关联知识点待核实。</p>
</details>

生产者开启幂等并正确配置确认；Broker 保证足够副本；消费者只在业务处理成功后提交 offset。Kafka 的 exactly-once 能覆盖特定 Kafka 读写事务，写外部数据库仍需要幂等键、唯一约束、Outbox/Inbox 等方案。面试时要逐段说明失败窗口。

#### （5）Agent 有哪些安全风险？

<details data-binding-status="pending_semantic_verification">
<summary>（5）Agent 有哪些安全风险？</summary>
<p>关联知识点待核实。</p>
</details>

主要包括直接/间接 Prompt Injection、越权工具调用、敏感数据泄漏、恶意工具或依赖、记忆污染和不受控代码执行。防护应从“模型能否识别坏指令”升级为系统边界：不可信内容与系统指令分离，工具最小权限，参数服务端校验，高风险动作人工确认，网络/文件沙箱，以及全链路审计。

延伸阅读：[Prompt Injection 与间接注入防御](../../../knowledge/llm/production/prompt-injection-defense.md)。

#### （6）一亿行表添加字段要注意什么？

<details data-binding-status="pending_semantic_verification">
<summary>（6）一亿行表添加字段要注意什么？</summary>
<p>关联知识点待核实。</p>
</details>

先确认数据库版本是否支持 instant/in-place DDL、字段默认值与锁行为；在影子环境验证时长、redo/binlog、复制延迟和磁盘空间。不能原地安全完成时，可使用在线 schema 变更工具或新表双写/回填，分批校验后切换。必须准备回滚和限流，不在业务高峰直接试。

#### （7）Coding Agent 工作流怎样描述？

<details data-binding-status="pending_semantic_verification">
<summary>（7）Coding Agent 工作流怎样描述？</summary>
<p>关联知识点待核实。</p>
</details>

从明确验收标准开始，让 Agent 先检索仓库规则和相关代码，再做小步修改，运行格式化、静态检查、单元/集成测试并审阅 diff。涉及凭据、部署或大范围删除时设置人工门禁。最终提交应附变更说明与验证证据，不能把“模型说完成了”当通过。

#### （8）怎样说明 RAG 知识库规模、Redis/Kafka 作用以及组件维护与交付？

<details data-binding-status="pending_semantic_verification">
<summary>（8）怎样说明 RAG 知识库规模、Redis/Kafka 作用以及组件维护与交付？</summary>
<p>关联知识点待核实。</p>
</details>

把文档量、切块数、索引体积、更新频率和并发测试条件分开说明；逐个解释 Redis 与 Kafka 在真实链路中的职责、为何需要及失效后的处理方式。再交代由谁搭建维护、实际版本、配置管理、客户环境与升级回滚方式。原帖没有给出这些项目答案，本文不编造规模、版本号、本人职责或交付结果。

#### （9）MySQL 使用技巧怎样结合实际场景说明？

<details data-binding-status="pending_semantic_verification">
<summary>（9）MySQL 使用技巧怎样结合实际场景说明？</summary>
<p>关联知识点待核实。</p>
</details>

选择本人真实处理过的查询或写入场景，说明问题、数据与查询规模、执行计划、索引或事务方案，以及改动前后的验证。可讨论批量写入、分页和慢查询排查，但需要具体条件，不能把通用技巧当成候选人的实际经验；原帖未记录这道开放问题的现场答案。
