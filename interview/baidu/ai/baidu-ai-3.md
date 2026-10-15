### 百度北京后端秋招一面：Agent 安全、检索与存储

以下内容依据候选人自述整理，未经独立证实。原帖记录百度北京后端开发秋招一面约 43 分钟，面试日期写作 8.10，未注明年份；内容从 Agent 项目和检索延伸到 Redis 与 MySQL 索引。

问题依原帖整理；下方短答为教学补充，不代表候选人的实际回答或项目成果。

开场提到了介绍实习与 Agent 项目，原帖未给出具体方案。

<details data-knowledge-key="agent-security-threat-model"><summary>（1）Agent 项目的安全怎样做？</summary></details>

先识别资产、外部内容和工具权限形成的信任边界；模型只提出调用，服务端在执行前校验身份、资源范围、参数与副作用。再结合隔离、审计与对抗测试控制注入、越权和泄露，不能承诺单靠 Prompt 消除攻击。

<details data-binding-status="pending_semantic_verification"><summary>（2）BM25 是怎样做关键词检索排序的？</summary><p>关联知识点待核实。</p></details>

BM25 结合词频、词项在语料中的稀有程度和文档长度计算相关性；词频收益会饱和，长度归一化用于减轻长文档的天然优势。具体分词、参数与统计口径取决于实现，分数不是事实正确概率；知识关联仍待语义核验。

<details data-knowledge-key="rag-hybrid-search"><summary>（3）为什么要做混合检索？</summary></details>

词法检索便于保留错误码、型号等精确词项，向量检索可补充同义改写和语义近似，两路错误有互补时能改善候选覆盖。是否有收益仍需在相同查询集上对比质量、延迟和成本；融合、重排和评测可以教学展开，但不是原帖记录的额外追问。

<details data-knowledge-key="redis-distributed-lock"><summary>（4）单机节点为什么还可能使用 Redis 锁？</summary></details>

单机不等于单进程：多个 Worker 仍可能竞争同一任务或外部资源。先比较进程内锁、本机进程间协调、数据库约束与 Redis 租约的部署和故障边界；需要共享协调才评估 Redis，不能把跨进程等同于必须用 Redis。

<details data-knowledge-key="redis-data-structure"><summary>（5）Redis ZSet 的结构是什么？</summary></details>

ZSet 的 member 唯一，按 score 排序；相同 score 再按 member 的字典序排列。以 Redis 8.4 为例，小集合可用 listpack，超过相应编码条件后以字典查 member 对应分数、以跳表维护顺序；具体编码受版本、数据和配置影响，不能笼统说始终只有跳表。

<details data-knowledge-key="redis-data-structure"><summary>（6）承接 ZSet：怎样解释 Redis 没有采用 B+ 树这一选择？</summary></details>

这里结合前题限定为 ZSet，比较的是相关有序编码：跳表与字典分别支持分数顺序和 member 查分，页式多路 B+ 树有另一组布局与维护取舍。可从内存访问、范围遍历和实现复杂度解释，不应宣称跳表在所有负载更快，也不能把工程推理当作已核实的官方历史决策。

<details data-knowledge-key="mysql-index"><summary>（7）在常见 InnoDB 普通索引范围内，为什么使用 B+ 树而不是跳表？</summary></details>

InnoDB 按页管理索引，高扇出的树降低层数，叶子有序便于范围扫描。比较跳表时应同时讨论页局部性、访问和维护成本；这是一组工程取舍，不能仅凭平均复杂度断言优劣，也不能把结论扩展到所有 MySQL 索引。

背景记录：反问涉及业务性质、增量业务与部门 AI 应用；原帖没有记录对方回答。

#### 延伸阅读

[Agent 安全威胁建模](../../../knowledge/llm/production/agent-security-threat-model.md)、[混合检索与 RRF 融合](../../../knowledge/llm/rag/rag-hybrid-search.md)、[分布式锁与租约](../../../knowledge/backend/database/redis-distributed-lock.md)、[Redis 数据结构](../../../knowledge/backend/database/redis-data-structure.md)、[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)。

[最小权限与工具确认](../../../knowledge/llm/production/agent-permission-model.md)。
