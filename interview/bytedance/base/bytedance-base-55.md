以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

仅覆盖已发布可见文字，不保证现场题目全部被回忆。

<details data-knowledge-key="agent-project-portfolio">
<summary>（1）挑一个有难点的项目详细介绍一下？</summary>
</details>

选择真实难点项目讲需求、职责、方案比较与验证结果，并展示可复现路径。不能把通用教程架构补写成作者项目事实。

<details data-knowledge-key="os-process-thread">
<summary>（2）为什么用多进程解决 OOM，而不是多线程？</summary>
</details>

多进程可隔离地址空间与单进程故障，并不自动减少总内存；复制数据反而可能增加占用。先定位泄漏、工作集和并发，再判断分批、共享或进程隔离是否适合。

<details data-knowledge-key="agent-architecture">
<summary>（3）介绍一下 AI Agent 项目的完整链路和解决的问题？</summary>
</details>

按输入鉴权、状态读取、规划、工具执行、结果校验和持久化说明完整链路，设置终止与预算。用真实需求决定模块，不把开放设计题当已实现系统。

<details data-knowledge-key="agent-multi-agent-messaging">
<summary>（4）Planner 和 Executor 之间是如何通信的？</summary>
</details>

规划器与执行器交换带任务 ID、步骤、参数与版本的结构化消息，执行结果回报状态与错误。明确队列或同步接口、所有权和幂等，不能让两个模块任意共享可变文本。

<details data-knowledge-key="db-transaction-lock">
<summary>（5）MySQL 有哪些常见的日志？分别有什么作用？</summary>
</details>

常见有 undo、redo、binlog，以及错误、慢查询等运行日志，分别服务回滚/MVCC、恢复、复制和排查。先说明数据库与引擎版本，不把所有日志当同一层的事务保障。

<details data-knowledge-key="mysql-index">
<summary>（6）MySQL 在哪些情况下会导致索引失效？为什么？</summary>
</details>

表达式、隐式类型转换、不匹配的联合索引顺序等可能影响访问路径，优化器也可能选择全表扫描。要结合数据分布和执行计划判断，不能把“索引没被选”一律叫索引失效。

<details data-knowledge-key="db-transaction-lock">
<summary>（7）MySQL 有哪些锁？分别起什么作用？</summary>
</details>

区分表锁、行级记录锁、间隙/临键锁和元数据锁等，作用与隔离级别、索引和语句有关。没有合适索引时锁范围可能更大，不能简单认为有事务就只锁一行。

<details data-knowledge-key="redis-data-structure">
<summary>（8）详细介绍一下 Redis 的 Rehash 过程？</summary>
</details>

Redis 字典扩缩容时可保留新旧哈希表并逐步迁移桶，操作期间按实现查询两边，避免一次搬完造成长停顿。具体调度随版本变化，不能把所有 Redis 类型都说成同一 rehash 流程。

<details data-knowledge-key="redis-cache">
<summary>（9）缓存三大问题（击穿、穿透、雪崩）及在项目中的解决方案？</summary>
</details>

穿透保护不存在数据，击穿合并热点加载，雪崩错开过期并限流降级，另要处理数据库失效通知。解释项目实际采用的方法与验证，不能仅列三个名词。

<details data-knowledge-key="redis-distributed-lock">
<summary>（10）Redisson 分布式锁是怎么实现的？</summary>
</details>

Redisson 锁通过 Redis 原子操作管理持有者与重入，并可在约定模式下用 watchdog 续期。具体 leaseTime 与续期行为须看版本和配置，故障下仍需说明过期持有者风险。

<details data-knowledge-key="redis-distributed-lock">
<summary>（11）追问：如果分布式锁的 Key 成为热点 Key（高并发抢同一把锁）怎么优化？</summary>
</details>

先减少锁内工作、按业务粒度分片或把竞争转为按 key 串行队列，必要时合并请求。不能为吞吐直接取消必须的互斥；续期与重试也要限流，避免热点重试风暴。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（12）一次完整的 HTTP 请求流程（以访问抖音主页为例）？</summary>
</details>

导航先解析 URL 和解析域名，建立或复用连接，发送请求并处理响应，随后解析资源、执行脚本和渲染。缓存、重定向和协议会改变路径，不能当作每次都有全套建连。

<details data-knowledge-key="dns-analysis">
<summary>（13）深挖 DNS 解析的具体步骤？</summary>
</details>

浏览器、系统与递归解析器先查缓存，未命中时沿 DNS 层级查询并跟随别名等记录，再缓存结果。具体缓存和加密 DNS 路径可变化，TTL 也不保证每个组件同步失效。

<details data-knowledge-key="os-process-thread">
<summary>（14）进程和线程的区别？</summary>
</details>

进程提供地址空间等资源边界，线程共享进程资源并独立执行。线程共享内存方便但需要同步，多进程通信和资源成本更高，按任务取舍。

<details data-knowledge-key="os-process-thread">
<summary>（15）协程比起线程有什么优势？</summary>
</details>

协程可在用户态协作切换并以较少线程承载等待型任务，但阻塞调用或 CPU 密集代码仍会影响调度。协程不自动带来多核并行，需看运行时与执行器。

<details data-knowledge-key="algorithm-linked-list">
<summary>（16）题目：LeetCode 143. 重排链表 (Reorder List)</summary>
</details>

先用快慢指针找中点，断开并反转后半链表，再交替合并两段。奇偶长度都要处理，避免形成环；时间 O(n)、额外空间 O(1)。
