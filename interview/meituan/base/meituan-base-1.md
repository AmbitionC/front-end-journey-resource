候选人自述为美团小象超市后端一面，结果未通过。作者称这是暑期的旧面经，未说明面试年份；发文日期不作为面试日期。

面试经历、部门、岗位与轮次来自作者自述，未独立认证。以下短答为编辑整理的学习思路，不代表作者现场回答或企业标准答案；以具体产品为例时，也不表示原项目采用了它。

## 背景交流

原文还记录了自我介绍、实习现状与 offer 选择、专业与求职方向、工作城市、是否愿意写 Java，以及对 AI 焦虑的交流。作者未给出这些个人问题的具体回答，本页不补写经历或择业结论。

## 项目与后端基础

<details data-binding-status="pending_semantic_verification"><summary>（1）CSS 匹配缓存怎么设计？</summary><p>关联知识点待核实。</p></details>
<p>先确认这里的匹配对象、输入与输出，以及哪些变化会使结果失效，再讨论缓存键、容量和并发更新。原文没有项目上下文，无法确定它指浏览器样式匹配还是应用内匹配逻辑，具体设计与知识关联待补。</p>

<details data-knowledge-key="os-virtual-memory"><summary>（2）什么是 Copy-On-Write 操作？</summary></details>
<p>Copy-On-Write 先共享可读数据，在需要修改时再获得独立副本，以推迟复制成本。以 Linux 私有映射为例，写访问可触发写时复制；这只是通用机制示例，原文没有说明项目采用哪种实现，也不能据此推断并发修改自动安全。</p>

<details data-knowledge-key="agent-concurrency"><summary>（3）AI 项目高并发怎么做？</summary></details>
<p>先测清模型调用、CPU、内存和下游连接等瓶颈，再分别设置准入、在途任务与有界队列。用超时、取消、背压和有限重试约束过载，按实际负载检查吞吐与尾延迟；扩 Worker 不能越过模型配额或下游容量。</p>

<details data-knowledge-key="java-thread-pool"><summary>（4）线程池设计需要注意什么？</summary></details>
<p>把核心数、最大线程数、队列容量与拒绝策略作为整体，结合 CPU 或阻塞任务和下游容量验证。以 ThreadPoolExecutor 为例，达到核心数后通常先入队，队列满才尝试扩到最大数；还要定义超时、异常、取消和关闭时已接纳任务的处理。</p>

<details data-knowledge-key="os-thread-sync"><summary>（5）什么时候用锁？什么时候不用？</summary></details>
<p>先找共享可变状态和必须共同成立的业务不变量，再决定是否需要互斥。独占所有权、不可变数据或串行合并能减少共享；单变量更新可选合适原子操作，多字段一致性则须统一同步协议，并考虑锁粒度、顺序和异常释放。</p>

<details data-knowledge-key="os-thread-sync"><summary>（6）原子变量是什么？</summary></details>
<p>原子变量通过正式原子 API 对指定值执行不可分割的读改写，例如计数自增或条件更新。单次原子操作不能自动保护多个变量之间的不变量，volatile 可见性也不等于复合自增原子性；仍要核对所用 API 的内存语义与重试边界。</p>

<details data-knowledge-key="database-models"><summary>（7）数据库表结构怎么设计？</summary></details>
<p>先列业务事实、对象身份、关系与主要查询，再确定主键、唯一性、非空和其他完整性约束。字段类型与精度由数据范围决定，索引围绕真实过滤和排序设计；规范化与必要冗余还要比较更新一致性和读取成本，原文未给出可直接复原的表结构。</p>

<details data-knowledge-key="async-job-queue"><summary>（8）如何保证消息顺序？</summary></details>
<p>先定义需要保序的实体和顺序来源，再把同一实体事件送到同一保序范围，并串行处理到持久提交。按序接收不等于并行任务按序完成，重试、重投和迁移还须处理版本缺口与重复；跨分区没有天然全局顺序。</p>

<details data-knowledge-key="db-sharding"><summary>（9）数据量大怎么办？</summary></details>
<p>先澄清数据规模、增长、保留期、访问模式和一致性目标，用容量与查询证据定位瓶颈。再比较索引与查询优化、冷热归档、副本读取或跨节点分片；分片增加路由、迁移和跨片事务成本，没有适用于所有表的固定行数门槛。</p>

<details data-knowledge-key="mysql-index"><summary>（10）索引什么时候会失效？</summary></details>
<p>先区分无法形成有效定位区间与优化器按成本选择其他路径，结合实际 SQL、类型、统计和执行计划判断。对普通索引列做函数运算、隐式类型转换或前导通配符等可能限制定位，联合键还需看前导列与范围；不能把缺某列或使用某个运算符一概判成完全不走索引。</p>

<details data-knowledge-key="async-job-queue"><summary>（11）为什么用 MQ？</summary></details>
<p>MQ 可把生产与消费解耦，用队列缓冲突发工作，并让合适任务异步执行。代价是结果延迟和更多失败窗口，因此要设计可查询业务状态、队列容量、确认、重试与幂等；队列削峰不能替代长期处理能力。</p>

<details data-knowledge-key="async-job-queue"><summary>（12）如何保证消息不丢？</summary></details>
<p>按生产、路由、Broker 保存与复制、消费提交逐段确认责任，并限定可承受的故障范围。发布确认不等于已消费，消费端应在业务与去重记录持久提交后 ACK；确认丢失可能触发重投，仍须幂等、有限重试和对账恢复。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（13）MVCC 原理？</summary></details>
<p>以 InnoDB 为例，普通一致性读用 ReadView 判断记录版本可见性，必要时沿 undo 重建旧版本。READ COMMITTED 每次一致性读建立新视图，REPEATABLE READ 通常复用首次一致性读的视图，并可见自己的修改；锁定读与写操作另按当前数据和锁规则处理，不能概括为所有读写互不阻塞。</p>

## 算法

<details data-binding-status="pending_semantic_verification"><summary>（14）手写 LeetCode「K 个一组翻转链表」？</summary><p>关联知识点待核实。</p></details>
<p>原文只提供题名，未给输入输出、约束、不足 K 个节点时的规则或现场代码。应先补齐这些条件，再讨论分组边界、保存后继与重连的不变量；这里不填入具体 K 值、测试结果或默认尾段规则，知识关联待核实。</p>

## 反问记录

作者反问部门的业务技术挑战，记录的答复是高并发与资金安全；问到是否开展 AI 应用时，记录了发票识别与小助手；关于 AI 时代的学习路径，记录的建议是不必焦虑、跟进趋势。原文没有提供系统架构、量化指标或进一步追问，以上只保留交流范围。

## 知识导航

- [内存、虚拟内存与分页](../../../knowledge/cs/os/os-virtual-memory.md)
- [并发控制、资源隔离与公平调度](../../../knowledge/llm/production/agent-concurrency.md)
- [Java线程池：容量、排队与拒绝](../../../knowledge/backend/java/java-thread-pool.md)
- [锁、信号量与并发同步](../../../knowledge/cs/os/os-thread-sync.md)
- [数据库数据模型：查询、约束与选择](../../../knowledge/backend/db/database-models.md)
- [消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)
- [分库分表、读写分离与扩展](../../../knowledge/backend/database/db-sharding.md)
- [数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)
- [事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)
