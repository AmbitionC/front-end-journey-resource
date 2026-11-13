### 快手 Agent 开发实习一面：MySQL、Kafka 与 RAG

这份个人记录自述为快手 Agent 开发日常实习一面，只列出技术话题与一项职业开放问，未披露面试日期、部门、具体项目、现场回答或结果。以下按已见文字整理；秒杀与 RAG 场景缺少具体条件，保留待补。

以下问题是对原话题的规范化表述，短答为编辑整理的回答思路，不代表原面试的完整提问或当事人现场回答。

<details data-knowledge-key="mysql-index"><summary>（1）MySQL 的索引怎样工作？</summary></details>
<p>以 InnoDB 为例，从有序树结构、聚簇索引与二级索引说明数据定位和回表。结合查询条件、排序与覆盖列分析候选索引，再用执行计划验证；索引是否被采用及是否更快，还取决于实际数据与查询。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（2）事务有哪些特性？</summary></details>
<p>围绕原子性、一致性、隔离性与持久性解释事务边界：多步操作怎样共同提交或回滚，并发访问怎样受约束，已提交结果怎样恢复。数据库机制需要与应用的业务不变量配合，不能仅凭开启事务就保证所有业务规则成立。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（3）MySQL 有哪些事务隔离级别？</summary></details>
<p>先区分脏读、不可重复读和幻读，再说明读未提交、读已提交、可重复读与串行化的可见性差异。讨论具体行为时补充存储引擎、普通一致性读或锁定读等前提，不把某种读取方式推广到所有语句。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（4）MVCC 怎样实现？</summary></details>
<p>以 InnoDB 为例，用记录版本信息、undo 与 ReadView 串起一致性读：当前版本不可见时，尝试重建并判断旧版本。说明快照建立时机与隔离级别有关；MVCC 不等于所有读写都不需要锁。</p>

<details data-knowledge-key="kafka-core"><summary>（5）Kafka 的执行原理是什么？</summary></details>
<p>沿生产者将事件追加到分区日志、消费者按消费组分配拉取记录、处理后保存消费位置说明链路。区分日志中的记录与消费进度，消息被读取不会立即删除，能否重放仍受保留与清理策略约束。</p>

<details data-knowledge-key="kafka-core"><summary>（6）Kafka 分区有什么好处？</summary></details>
<p>分区让数据和读写负载能够分布，并为普通消费组提供并行处理单位。顺序保证限定在分区内，消费者数量、热点分布和后续并行处理都会影响效果；不能推导为全局有序或吞吐随分区数线性增长。</p>

<details data-knowledge-key="kafka-core"><summary>（7）Kafka 怎样保证可靠性？</summary></details>
<p>分别检查生产确认与重试、Broker 副本和选主、消费处理与 offset 提交。幂等生产减少协议重试的重复追加，消费端仍要协调业务效果与进度；Kafka 内部事务的保证不能直接等同于任意外部业务只执行一次。</p>

<details data-knowledge-key="redis-cache"><summary>（8）缓存穿透怎样解决？</summary></details>
<p>先识别请求的数据在缓存和权威存储中都不存在，再结合输入校验、负缓存与布隆过滤减少重复回源。负缓存要管理有效期与容量，布隆过滤的拒绝依据依赖集合装载和新增同步完整，不能把同步遗漏当成数据不存在。</p>

<details data-binding-status="pending_semantic_verification"><summary>（9）描述一下秒杀的场景（具体题意与条件待补）？</summary>关联知识点待核实。</details>
<p>原帖没有提供进一步的场景条件，无法确定所问是业务描述还是某个具体设计问题。需补齐原题后再分析，当前不补写系统约束或实现方案。</p>

<details data-knowledge-key="rag-chunking"><summary>（10）RAG 知识库递归切分的过程是什么，有什么好处？</summary></details>
<p>按从较大结构到较小边界逐层拆分超长内容，并检查最终块是否满足所用模型的长度限制。这样有助于保留相邻语义与可解释边界，但仍要评测证据完整性、重复召回和成本，不能把固定大小或重叠比例当作通用最优值。</p>

<details data-knowledge-key="agent-memory-architecture"><summary>（11）长期记忆怎样设计？</summary></details>
<p>先区分会话运行状态与跨会话长期事实，再定义写入筛选、来源、存储隔离、按需检索及更新删除流程。记忆内容应保留证据和版本，检索前校验权限；跨会话保存并不自动证明内容可靠。</p>

<details data-knowledge-key="embedding-basics"><summary>（12）向量嵌入模型怎样选型？</summary></details>
<p>按语料语言、检索任务与部署约束筛选候选，再用固定查询和相关片段比较召回、排序、延迟与成本。核对查询和文档编码器的兼容组合、预处理、维度及距离约定，并评估升级重建索引的代价。</p>

<details data-knowledge-key="rag-pipeline"><summary>（13）RAG 是什么，基本流程是什么？</summary></details>
<p>RAG 在生成前检索外部证据，以支撑回答。先说明离线解析、切块与索引，再说明在线召回、上下文组装、生成和引用校验；证据不足时应明确说明，不能认为接入知识库就自动消除幻觉。</p>

<details data-binding-status="pending_semantic_verification"><summary>（14）RAG 场景题（具体场景与要求待补）？</summary>关联知识点待核实。</details>
<p>原帖只列出“RAG 场景题”，未记录输入、约束和验收条件。需补齐原题后再推导方案，当前不替它选择技术路径。</p>

<details data-knowledge-key="agent-role-landscape"><summary>（15）AI 的发展对你有什么挑战和机会？</summary></details>
<p>结合自己的能力与目标，说明哪些工作环节可能受益，以及验证结果、系统设计和持续学习方面的挑战。用可核验的实践与学习计划支撑判断，区分个人选择与未经证实的行业预测，不虚构经历或就业结论。</p>
