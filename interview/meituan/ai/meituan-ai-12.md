这份记录自述为美团 AI 全栈一面，时间是 9 月 18 日、约 50 分钟，面试年份和具体团队未披露。此前取消的一次约面只作为背景，不计作另一场已完成面试。

以下按已采集文字整理技术问题，短答为编辑教学思路，不代表作者现场回答、真实项目实现或实验结果。算法完整条件和项目细节不足的题目保留待补；原文中的自我评价、面试官评价和压测自述均不作为能力或结果的独立证明。

<details data-binding-status="pending_semantic_verification"><summary>（1）合并区间怎样做？（完整题干与约束待补）</summary><p>关联知识点待核实。</p></details>
<p>原文只有题名，没有区间开闭、相接是否合并、输入排序、规模和输出要求。先补齐这些条件，再解释算法与复杂度；不直接套用常见平台题面，也不把“秒掉了”的自述当作代码或测试通过证据。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）这段实习主要做了哪些工作？（个人职责待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有披露具体部门、职责、系统或交付物。复盘时应提供本人负责的任务、关键决策和可核验产物，并分清个人与团队工作；本页不从岗位名称推测实际经历。</p>

<details data-binding-status="pending_semantic_verification"><summary>（3）实习期间做过哪些性能优化？（瓶颈与结果待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有给出性能目标、原始瓶颈、改动或同条件前后测量。应先补充工作负载、定位证据、方案和回归结果，再说明收益；不能凭经验补写优化方法或提升数字。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）实习中的 AI 工作具体做了什么？（实现待补）</summary><p>关联知识点待核实。</p></details>
<p>先补齐真实任务、输入输出、本人职责、模型与工具边界，以及怎样验收。原文未披露系统实现，不能因为标题是 AI 全栈，就补造 Agent、微调或模型部署经历。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）大数据导出怎样优化？（原项目方案待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有说明数据形态、查询、导出格式、内存或网络瓶颈，也没有改前改后的记录。先提供实际链路与测量，再判断优化点；不替作者指定分页、流式、批处理或异步方案。</p>

<details data-knowledge-key="mysql-index"><summary>（6）MySQL 索引是什么结构？</summary></details>
<p>先限定引擎和索引类型：以 MySQL 8.4 InnoDB 的普通有序索引为教学例子，可用 B+ 树式页布局理解内部导航与叶页记录。页大小、键宽、缓存和扫描范围共同影响成本，空间索引等另有结构，不能把所有 MySQL 索引都说成同一种树或固定几次磁盘访问。</p>

<details data-knowledge-key="mysql-index"><summary>（7）聚簇索引与非聚簇索引有什么区别？</summary></details>
<p>以 InnoDB 为例，聚簇索引的叶页保存行数据，二级索引记录包含索引列及对应主键，取额外字段时可能再访问聚簇记录。覆盖索引能减少取列访问，但不能保证所有可见性检查都不访问聚簇记录；讨论其他引擎时要重新核对布局。</p>

<details data-knowledge-key="mysql-index"><summary>（8）发现索引没有按预期使用时怎么办？</summary></details>
<p>先区分没有选择索引、只利用部分索引和使用后仍然慢，再对照 SQL、参数、数据分布与执行计划定位。检查函数或隐式转换、联合键前缀、扫描与回表成本及统计信息，保持业务语义后比较候选；全表扫描有时是合理选择，不能直接强制索引。</p>

<details data-binding-status="pending_semantic_verification"><summary>（9）RAG 项目的完整流程是什么？（实际链路待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有披露项目的数据源、解析与索引、召回、生成或评测实现。复盘应沿真实输入、各阶段产物及验收证据说明链路；通用 RAG 流程可作学习材料，不能填成作者做过的系统。</p>

<details data-binding-status="pending_semantic_verification"><summary>（10）项目里的“树形意图识别”是什么？（结构与行为待补）</summary><p>关联知识点待核实。</p></details>
<p>先补充意图树的层级、节点含义、输入输出、如何选择分支，以及歧义和失败怎样处理。原文没有给出这些信息，不能把它自动等同于某种分类器、决策树或 Agent 路由架构。</p>

<details data-binding-status="pending_semantic_verification"><summary>（11）仿 12306 项目里的分库分表是什么？（具体方案待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有披露分片键、路由、数据规模、事务与迁移要求。可以先解释垂直和水平拆分等通用概念，再用真实表和查询说明项目设计；不能从项目名称还原某个教程的实现。</p>

<details data-knowledge-key="ai-rate-limiting"><summary>（12）令牌桶限流怎样实现？</summary></details>
<p>保存桶容量、补充速率、剩余额度和上次补充时间，按经过时间补充并封顶，再在同一原子边界内检查和扣减；不足时按合同拒绝或有界等待。单机可用单调时钟与锁，多实例共享额度需协调状态；桶容量允许受控突发，令牌桶不能替代并发上限或费用预算。</p>

<details data-knowledge-key="db-sharding"><summary>（13）达到什么数据量才需要分库分表？</summary></details>
<p>没有跨部署通用的行数门槛。先结合行宽、索引、增长、查询与写入负载、资源和服务目标确认单节点限制，再比较查询优化、归档、扩容、副本与分片的成本；分片还要承担路由、迁移及跨片查询和事务的复杂度。</p>

<details data-binding-status="pending_semantic_verification"><summary>（14）聚合查询是怎样解决的？（查询与数据分布待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有给出聚合 SQL、分组与去重口径、数据分布、更新一致性或结果时效要求。先补齐查询和约束，再比较可行的执行与归并方案；不能直接指定跨分片全量拉取、应用归并或额外索引服务。</p>

<details data-binding-status="pending_semantic_verification"><summary>（15）压测数据是否可信？（原测量记录待补）</summary><p>关联知识点待核实。</p></details>
<p>作者明确承认数据不准，本页不采信任何吞吐或容量结论。待补充硬件、数据与请求分布、并发、持续时间、指标分母及可复查记录，再判断是否存在压测端瓶颈；单次本机结果不能直接外推生产能力。</p>

## 相关资料

资料用于核对教学机制，不证明原项目使用了文档中的产品或版本。

- [MySQL 8.4：InnoDB 索引的页结构](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html)
- [MySQL 8.4：聚簇与二级索引](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)
- [MySQL 8.4：查询优化与执行计划排查](https://dev.mysql.com/doc/refman/8.4/en/optimizer-issues.html)
- [RFC 3290 附录 A：令牌桶与受控突发](https://www.rfc-editor.org/rfc/rfc3290.html#appendix-A)
- [Microsoft：分片模式的适用条件与代价](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)
