以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

现场 SQL 未写在原帖，无法确定具体索引或回表次数。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）实习拷打</summary>
</details>

用实际任务说明实习职责、技术选择与验证结果，没记录的追问不扩写。项目细节不能仅靠模板或框架名称支撑。

<details data-knowledge-key="redis-cache">
<summary>（2）延迟双删在高并发下的问题，有没有更好的办法</summary>
</details>

延迟双删只能减小部分竞态窗口，固定等待不能覆盖任意慢读与故障。可采用提交后失效、可靠变更通知、版本比较和 TTL，先明确可接受的一致性水平。

<details data-knowledge-key="redis-cache">
<summary>（3）布隆过滤器原理</summary>
</details>

布隆过滤器用多个哈希定位位数组：有任一位为零可判不在集合，全部为一只能说可能存在。常规实现会误判且不直接支持删除，误判率取决于位数、元素数和哈希数。

<details data-knowledge-key="async-job-queue">
<summary>（4）消息队列在项目中的作用</summary>
</details>

说明队列承载的任务、峰值缓冲、重试与状态关联，并定义消费者幂等。Broker 可靠投递不能代替业务提交或外部副作用的防重。

<details data-knowledge-key="async-job-queue">
<summary>（5）30天定期更新怎么实现的（延迟队列还是死信队列，具体细节）</summary>
</details>

30 天周期更新应保存周期和 nextRunAt，以周期 ID 去重。死信交换机路由过期、拒收等消息，可配 TTL 实现延迟，但本身不是周期调度且有队头与精度限制；还须明确日历月或固定 30 天。

<details data-knowledge-key="agent-project-requirements">
<summary>（6）智能体项目的背景，整体框架，应用</summary>
</details>

先讲用户需求与输入输出，再给最小 Agent 或工作流链路。没有公开实现细节时不能补造业务、模型版本或效果。

<details data-knowledge-key="agent-project-portfolio">
<summary>（7）在项目过程中遇到的问题以及一些细节设计的考虑</summary>
</details>

选择一个真实失败案例，说明复现、根因、修复和回归结果，交代尚未解决的限制。不能把教程中的常见问题写成候选人已经遇到过的事。

<details data-knowledge-key="os-process-thread">
<summary>（8）进程和线程的区别</summary>
</details>

进程是资源与地址空间等隔离单位，线程在同一进程中共享部分资源并各自有执行状态。线程切换可能较轻，但共享内存带来同步与故障传播问题。

<details data-knowledge-key="tcp-handshake">
<summary>（9）http和https的区别，四次握手过程</summary>
</details>

HTTPS 是在 TLS 保护下使用 HTTP；TCP 建连通常三次握手、关闭常见四步，TLS 握手取决于版本和恢复方式。原帖“四次握手”含糊，需先澄清所指，不能把三种过程混写。

<details data-knowledge-key="http-message">
<summary>（10）http常见的状态码</summary>
</details>

2xx 表示成功，3xx 重定向，4xx 请求侧问题，5xx 服务侧问题；常见有 200、201、204、301/302、304、400、401、403、404、429、500、503。需结合响应体和可重试性处理，而非见错误就重试。

<details data-binding-status="pending_semantic_verification">
<summary>（11）了解微服务吗，两个服务通信存在网络波动，怎么解决</summary>
<p>关联知识点待核实。</p>
</details>

设置端到端超时、有限重试与退避，并对有副作用的请求使用幂等键。结合熔断、降级和监控，网络超时不代表对方没有完成操作。

<details data-binding-status="pending_semantic_verification">
<summary>（12）如果让你设计微信朋友圈，用什么数据结构</summary>
<p>关联知识点待核实。</p>
</details>

把用户、关系、帖子与互动建模为实体，时间线按查询需求选择拉取、推送或混合索引。数据库表、缓存有序集合和对象存储可分工，不能只用一种容器解释完整朋友圈。

<details data-knowledge-key="mysql-index">
<summary>（13）发来一个sql语句，说一下索引有哪些，查询过程，用到哪些索引，经过几次查询，需不需要回表</summary>
</details>

原帖未保存现场 SQL，不能断言使用哪个索引或回表次数。取得语句、表定义和索引后看执行计划，再解释范围、覆盖索引、过滤和聚簇索引访问路径。

<details data-knowledge-key="redis-data-structure">
<summary>（14）redis除了可以用来做缓存，还可以干啥</summary>
</details>

Redis 可用于计数、限流、排行榜、短期状态和 Streams 等，但要按持久化与一致性需求选择。不能因数据在内存中就把它当所有业务的唯一持久账本。

<details data-knowledge-key="algorithm-linked-list">
<summary>（15）k个一组翻转链表</summary>
</details>

每次先确认剩余至少 k 个节点，再反转这一段并接回前后部分；不足 k 的尾段保持原顺序。指针修改前保存下一节点，时间 O(n)、额外空间 O(1)。
