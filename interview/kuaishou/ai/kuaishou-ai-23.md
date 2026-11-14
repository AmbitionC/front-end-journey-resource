这份记录自述为快手二面，原标题标注“9.14”，未披露面试年份与具体岗位。原文中的结果判断主要是个人感受，本页不据此确认企业面试结果。

以下仅按已采集文字整理，短答是编辑补充的备考思路，不能当作当事人的现场回答或项目实现。表结构、库存规则、“三种引擎”和日志工具的完整条件均未披露，已保留待补。数据库短答以 MySQL 8.4 InnoDB 作教学范围，不推断原项目引擎或版本；原配图经核对为装饰表情，不含补充题目。

## 问题与简答

<details data-binding-status="pending_semantic_verification"><summary>（1）项目中的数据表怎样设计？（业务需求与表结构待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有披露业务实体、字段、约束和访问方式。需要先取得真实需求与模型，再解释表的职责、主键和约束设计；不能从项目面试题名补造具体表结构。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）几个表之间怎样关联？（实际关系待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有给出表名、关联键、基数或生命周期约束。先补充真实实体关系和查询需求，再说明关联方向、完整性与查询方式；本页不代填一对多、多对多或外键方案。</p>

<details data-knowledge-key="db-sharding"><summary>（3）什么是分库分表，什么场景需要引入？</summary></details>
<p>先区分按业务或列拆分与按行分片，再根据真实容量、增长、写入压力和延迟目标判断单节点是否受限。先比较索引优化、归档、扩容或副本等方案，并考虑分片带来的路由、迁移、跨片查询和事务成本；没有通用行数门槛。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（4）事务有哪些隔离级别，主要差别是什么？</summary></details>
<p>按读未提交、读已提交、可重复读和可串行化比较可见性及并发现象。以 MySQL 8.4 InnoDB 为教学例，RC 的一致性读通常每次建立快照，RR 通常复用首次一致性读的快照；锁定读和写语句要另行分析，不能只背一张现象表。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（5）快照读和当前读有什么区别？</summary></details>
<p>以 InnoDB 为例，普通一致性读依据 ReadView 与旧版本返回可见数据；锁定读和写语句处理当前数据，并按语句、索引和隔离级别取得相应锁。讨论时先明确事务边界和读取类型，不能认为所有 SELECT 都读同一快照，或所有读都互不阻塞。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（6）MVCC 怎样处理幻读问题，有什么边界？</summary></details>
<p>InnoDB RR 的普通重复一致性读通常沿用同一快照，其他事务后插入的行不会直接进入该视图；RC 每次换视图，结论不同。范围锁定读还要分析记录与间隙上的锁及索引条件，因此不能把所有防幻读行为都归给 MVCC，或断言任意读取都不会发生集合变化。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（7）FOR UPDATE 时还允许读吗，它是快照读还是当前读？</summary></details>
<p>在 InnoDB 教学范围内，FOR UPDATE 本身是锁定当前读，取得相应的排他记录锁等；其他事务的普通一致性读通常仍能读取可见旧版本，冲突的锁定读或写则可能等待。必须区分“哪种读”、事务与隔离级别，并结合索引和条件判断锁范围，不能把排他锁解释成禁止一切读取。</p>

<details data-binding-status="pending_semantic_verification"><summary>（8）项目中的库存扣减逻辑是什么？（业务与一致性合同待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录未说明库存含义、扣减和释放时机、并发来源、重试或业务约束。需补齐这些条件后再讨论原子更新、锁、事务和失败恢复；不能直接指定一种实现或宣称已防止超卖。</p>

<details data-knowledge-key="redis-cache"><summary>（9）为什么使用 Redis 后仍需要 MySQL？</summary></details>
<p>先说明两者在实际系统中的职责，不能把使用 Redis 当成已经替代所有数据存储。常见旁路缓存设计用数据库保存权威业务事实和事务状态，Redis 提供可重建的读视图；还要处理缓存失效、故障与旧值窗口，Redis 持久化本身也不证明跨系统强一致。</p>

<details data-binding-status="pending_semantic_verification"><summary>（10）项目有什么亮点？（实际贡献与证据待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录只留下作者称没有明显亮点，没有公开可核验的改动或结果。复盘应以真实问题、个人贡献、关键取舍和验证证据说明价值；本页不替作者包装创新点或提升数字。</p>

<details data-binding-status="pending_semantic_verification"><summary>（11）Agent 的“三种引擎”为什么这样设计，怎样工作？（引擎定义待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有给出三种引擎的名称、职责、输入输出和协作关系。需先补原项目定义与调用链，再讨论拆分理由、状态和失败边界；不能按数字猜成规划、执行或记忆等常见模块。</p>

<details data-binding-status="pending_semantic_verification"><summary>（12）项目做了知识库吗，怎样实现？（实际方案待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有提供是否完成、数据来源、解析索引、权限或查询链路。先补真实实现与验证结果，再解释各阶段职责；不能从后续提到 RAG 就反推项目已经采用某种切块、向量库或检索方案。</p>

<details data-knowledge-key="rag-evaluation"><summary>（13）RAG 召回指标有没有评估，应该怎样说明？</summary></details>
<p>先固定查询集、相关证据标注和文档或分块口径，再报告 Recall@K 等检索指标及失败切片，并与排序、生成质量分开。原记录没有给出真实评测过程或数值，因此只能说明方法，不能声称作者已评估或取得某个召回率。</p>

<details data-knowledge-key="agent-memory"><summary>（14）记忆系统应该怎样设计与说明？（原实现未披露）</summary></details>
<p>先区分当前工作上下文与跨任务长期信息，再说明哪些内容允许写入、怎样保留来源、按任务与权限召回，以及何时更新、压缩和删除。索引和存储按查询与恢复需求选择，不必把所有历史送入模型或一律放进向量库；这些是通用设计思路，不代表原项目实现。</p>

<details data-binding-status="pending_semantic_verification"><summary>（15）项目遇到过什么难点？（真实案例待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有披露难点、定位过程、尝试或最终结果。应补一个真实案例，说明约束、证据、取舍和验证；不能代写高并发、性能瓶颈或复杂 Agent 协作经历。</p>

<details data-binding-status="pending_semantic_verification"><summary>（16）AI Coding：编写一个日志排查工具。（完整题面与验收条件待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录只有任务名称，没有日志格式、输入输出、排查目标、运行环境和验收标准。需先补齐题面，再确定解析、查询、展示或分析等范围并设计验证；不能凭题名编造要检测的故障、日志协议或实现结果。</p>

## 延伸学习

- [数据库分库分表与分片设计](../../../knowledge/backend/database/db-sharding.md)
- [事务隔离、MVCC 与锁](../../../knowledge/backend/database/db-transaction-lock.md)
- [Redis 缓存与一致性](../../../knowledge/backend/database/redis-cache.md)
- [RAG 评估：召回、生成与端到端](../../../knowledge/llm/rag/rag-evaluation.md)
- [Agent 记忆系统](../../../knowledge/llm/agent/agent-memory.md)
