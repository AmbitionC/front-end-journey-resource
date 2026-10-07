作者自述为后端 Agent 实习岗位的一面，发帖日期为 2026 年 4 月 8 日；实际面试日期未明确。原文的实习、项目深挖只有主题概述，不能还原具体题目。

以下短答由编辑独立整理，供学习与准备使用，并非作者现场回答或企业标准答案。个人经历按本人事实作答；省略、推断、反问和反馈均明确标注，不冒充完整面试官原题。

## 一面

<details><summary>（1）实习拷打（具体原题缺失）</summary></details>

原帖仅写“实习拷打”，没有具体问题或回答，不补编原题。

<details><summary>（2）项目拷打（具体原题缺失）</summary></details>

原帖仅写“项目拷打”，没有具体问题或回答，不补编原题。

<details data-knowledge-key="agent-react"><summary>（3）介绍一下 ReAct 框架的具体实现流程，Agent 在什么情况下容易陷入思考死循环（Thought Loop）？</summary></details>

ReAct 交替规划/推理、选择动作和读取观察结果；工具重复失败、状态不更新或停止条件不清可能导致循环。代码应设步数/时间预算、无进展检测与人工退出。

<details data-knowledge-key="agent-failure-recovery"><summary>（4）如果 Agent 调用的底层运维 API 发生超时或 5xx 错误，你在工程上是如何实现容错机制的？</summary></details>

先区分可重试错误与未知副作用；设置 deadline、有上限的指数退避/jitter、熔断和预算。写动作使用幂等标识，超时后先查询/对账，不直接无限重试。

<details data-knowledge-key="redis-data-structure"><summary>（5）Redis 的数据结构有哪些？在 Agent 对话上下文缓存中，你会选择哪种结构？</summary></details>

常见类型有 String、Hash、List、Set、ZSet、Stream 等；按上下文读取模式选择，消息序列可用 List，元数据用 Hash。持久恢复需求不能仅靠 TTL 缓存满足。

<details><summary>（6）线程池的参数如何设置？</summary></details>

原文未注明语言或执行器。先按工作负载、等待比例、队列、拒绝策略和下游容量做有界设计；若讨论 JDK 21 ThreadPoolExecutor，可再联合设置核心/最大线程、存活时间和工厂等参数，不能把该例子当原题语言。

<details data-knowledge-key="db-transaction-lock"><summary>（7）解释一下分布式事务的 2PC 和 TCC，在 Agent 执行多步跨系统指令时如何保证一致性？</summary></details>

2PC 由协调者组织 prepare 后统一 commit/rollback；TCC 用业务 Try 预留资源、Confirm 提交、Cancel 释放。跨系统须实际支持这些协议，处理幂等/空回滚/悬挂；不可补偿动作不能假装原子回滚。

<details data-knowledge-key="agent-queue-worker"><summary>（8）类 Manus 的 Agent 需要频繁操作环境，如何实现一个高可用的任务调度器，要考虑哪些方面？</summary></details>

任务与检查点先持久化；Worker 用租约取得执行权，心跳/过期后可恢复，结果落盘后确认消息。加入幂等、有界并发、背压、取消、死信与观测，避免内存调度器丢任务。

<details data-knowledge-key="db-transaction-lock"><summary>（9）MySQL 的隔离级别有哪些？什么是幻读？</summary></details>

隔离级别有 RU、RC、RR、Serializable；幻读是同条件查询观察到行集合变化。InnoDB 快照读与锁定当前读机制不同，是否防住需结合隔离级别、索引和具体读写。

<details data-knowledge-key="tcp-handshake"><summary>（10）TCP 三次握手和四次挥手流程？为什么断开连接需要等待 2MSL？</summary></details>

握手通常 SYN→SYN/ACK→ACK；关闭两个方向分别 FIN/ACK，报文可能合并。主动关闭方通常进入 TIME-WAIT 等 2MSL，处理重传 FIN 并让旧连接报文失效。

<details data-knowledge-key="agent-sandbox"><summary>（11）如果要实现一个代码执行沙箱，你从后端角度如何限制 CPU、内存和网络访问？</summary></details>

Linux 可用 cgroup 限 CPU/内存/进程量、监督器设超时；namespace/seccomp/最小权限收口系统调用和文件，网络隔离加出口允许列表，避免宿主 socket 与凭证暴露。

<details data-knowledge-key="os-process-thread"><summary>（12）什么是协程？</summary></details>

协程是可挂起和恢复的执行单元，调度方式依运行时而定；单线程事件循环可在 I/O 等待时运行其他就绪任务，多核并行还取决于执行器。阻塞调用、长计算和跨等待点的共享状态需要单独处理。

<details data-knowledge-key="os-process-thread"><summary>（13）为什么 Agent 后端通常采用异步非阻塞模型？</summary></details>

模型、检索和工具多为等待 I/O，异步可在等待时运行其他就绪任务；配合超时、取消、并发上限与背压，阻塞 I/O/CPU 工作移到适合的执行器。

<details data-knowledge-key="async-job-queue"><summary>（14）Kafka 为什么高吞吐？在处理 Agent 异步回调信号时，如何保证消息不丢失？</summary></details>

Kafka 通过追加日志、批量请求/压缩与分区并行提高吞吐，实际效果受配置和负载约束。回调先用 outbox 可恢复生产，按副本/ISR 与 acks 确认；业务结果和事件去重落库后再提交连续已完成 offset，重投靠幂等吸收。

<details data-knowledge-key="agent-memory"><summary>（15）有了解过Agent 的记忆吗？mem0这个记忆框架知道不</summary></details>

Agent 记忆需区分当前状态与跨会话长期事实；mem0 提供从输入提取、写入和检索记忆的能力。工程上仍要做主体隔离、冲突更新、来源、过期与删除，不能保存一切对话即称可信记忆。

<details data-knowledge-key="vector-database-internals"><summary>（16）向量数据库的原理是什么？RAG中的rerank?</summary></details>

向量库按 embedding 距离检索，可用 HNSW/IVF 等近似索引，以召回率换延迟；rerank 对已召回候选做相关性排序，补救不了根本没召回的证据。要评测候选深度、授权过滤、截断和成本。

延伸学习：[RAG 重排序](../../../knowledge/llm/rag/rag-reranking.md)。这是一组原文中的两个主题，主展开关联保留向量数据库。

<details data-knowledge-key="grpc-basics"><summary>（17）HTTP 与 RPC（例如 gRPC、Thrift）有什么区别？内部服务为什么可能选择 RPC？</summary></details>

HTTP 是应用层协议，RPC 是远程调用抽象；gRPC 常以 IDL/生成 stub 和 Protobuf 经 HTTP/2 通信。它适合类型契约与多语言治理，但字节实际内部选型原因未在原帖给出，不能当公司政策断言。

<details data-knowledge-key="algorithm-linked-list"><summary>（18）LRU 缓存</summary></details>

用哈希表定位节点、双向链表维护访问顺序，访问移头、超容量删尾；平均 get/put O(1)，保证哈希表与链表同步。

<details data-knowledge-key="algorithm-linked-list"><summary>（19）K 个一组翻转链表</summary></details>

每轮先确认后方至少有 k 个节点，保存组后继，反转本组并连接前后；不足 k 的尾段按题意保留。迭代可 O(n) 时间/O(1) 额外空间，重点验证指针不丢链。
