岗位：Java 研发工程师；轮次：一面；面试时间：9月10日，约50分钟。记录中没有手写代码题。

以下保留已见文字中的技术问题，短答是编辑整理的答题思路，不代表候选人的现场回答。原文中的 react 与 plan 未给出明确含义，相关题目保留待补；自我介绍及个人实习追问不展开。

## 面试问题与答题思路

<details data-binding-status="pending_semantic_verification"><summary>（1）原文中的“react 和 plan 模式”有什么区别？</summary><p>关联知识点待核实。</p></details>
<p>原文没有说明 react 和 plan 对应的产品、框架或模式定义，关键词仍待补充。这里保留原题，暂不推定为某种 Agent 推理模式，也不关联知识点。</p>

<details data-knowledge-key="mcp-protocol"><summary>（2）MCP 工具是什么，怎样实现和接入？</summary></details>
<p>先区分 Host、Client 与 Server：服务端声明工具名称、用途和参数合同，实现受控操作，客户端按选定协议版本发现并调用。宿主再把允许的工具交给模型选择，执行前仍校验参数与权限，返回后核对实际业务结果；初始化与传输方式须按版本说明。</p>

<details data-knowledge-key="agent-memory"><summary>（3）Agent 的短期记忆和长期记忆怎样实现？</summary></details>
<p>短期记忆保存当前会话的消息、工具结果与任务进度，按上下文预算裁剪或摘要，并按恢复要求保存检查点。长期记忆保存经校验、授权且仍有效的事实与偏好，按当前任务检索后放回上下文；数据库、文件或向量索引只是实现选择，不能把存下来的全部历史都当成模型当前已知。</p>

<details data-knowledge-key="agent-coding"><summary>（4）多 Agent 协作时，怎样处理 worktree 冲突？</summary></details>
<p>先让不同 Agent 在明确基线上的独立分支与 worktree 工作，按文件或模块确定写入责任，减少同时改同一位置。隔离目录不会消除合并冲突；整合者核对公共祖先与双方补丁，逐处按需求解决文本及语义冲突，再运行相关测试并审查最终 diff，不能直接用一方覆盖另一方。</p>

<details data-knowledge-key="kafka-core"><summary>（5）Kafka 怎样保证消息投递成功？</summary></details>
<p>沿生产、Broker 保存与消费三段解释成功：生产端检查发送结果并配置确认与重试，Broker 核对副本、同步副本下限和选主，消费端在业务持久提交后再提交进度。确认丢失或处理后崩溃可能导致重试与重复，仍需业务幂等；应说明允许的故障范围，不能承诺任意故障下绝不丢失。</p>

<details data-knowledge-key="kafka-core"><summary>（6）Kafka 怎样保证消息幂等性和顺序性？</summary></details>
<p>生产者幂等用于抑制协议重试的重复追加，业务重复发送与消费副作用仍需稳定事件标识、去重及事务边界。顺序先限定同一实体，让相关事件进入同一分区，并约束消费与业务提交次序；跨分区没有统一总序，分区数变化、重试及消费者内部并发也要纳入验证。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（7）Java 的类加载机制是什么？</summary></details>
<p>先分加载、链接与初始化：链接包含验证、准备和解析，静态初始化与普通对象初始化不能混为一谈。再以 ClassLoader 默认委派说明先查已加载、再找父级、最后自身查找，并说明这不是所有加载器的强制唯一算法；运行时类身份还取决于定义加载器，不能只比较类名。</p>

<details data-knowledge-key="java-thread-pool"><summary>（8）Java 线程池有哪些核心参数，分别是什么含义？</summary></details>
<p>以 ThreadPoolExecutor 为例，说明 corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory 与 handler 的职责。把参数连到接纳顺序：不足核心数先建线程，之后优先排队，队满才尝试扩到最大数，仍无法接纳或已关闭则拒绝；无界队列与下游容量会改变扩容效果。</p>

<details data-knowledge-key="algorithm-hash"><summary>（9）Java HashMap 的底层结构是什么？</summary></details>
<p>先说明所用 JDK 版本，再沿哈希扰动、桶定位、同桶 key 相等判断、冲突处理与扩容展开。以现有正文核对的 OpenJDK 实现为例，桶数组配合链表及满足条件的红黑树，树化同时受链长和表容量影响；结构优化不赋予 HashMap 并发安全。</p>

<details data-knowledge-key="redis-cache"><summary>（10）Redis 的过期删除策略和持久化策略分别是什么？</summary></details>
<p>过期删除分访问时识别的被动清理与服务端周期抽样的主动清理，不是为每个 key 设置准时释放内存的独立定时器，也应与容量压力下的淘汰区分。持久化再比较 RDB 快照与 AOF 记录、同步及恢复窗口，按可容忍丢失量和恢复要求选择；开启持久化不会自动消除主从切换或跨系统一致性风险。</p>

<details data-knowledge-key="lua-host-runtime"><summary>（11）为什么要使用 Lua 脚本？</summary></details>
<p>先明确脚本运行在哪个宿主，再说明把一小段可控逻辑移到数据或能力所在处有什么收益。若讨论 Redis，Lua 可以将有界的条件检查与更新放进服务端原子执行，减少往返和客户端竞争窗口；长脚本会阻塞其他命令，运行出错也不表示已完成的写入会自动回滚，不能把这些特性归为所有 Lua 宿主的共同保证。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（12）怎样用分布式锁实现一人一单？</summary></details>
<p>先定义“一人一单”的作用域，例如某个活动与用户的组合，在该作用域上串行处理资格检查与下单，获取和释放租约都要校验所有权。锁只是减少并发竞争，订单库仍以对应非空业务键的唯一约束和事务维护最终不变量，重复请求返回既有结果；释放后再次请求或租约失效，都不能仅靠曾经拿到锁来防重。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（13）Redis 主从切换导致分布式锁丢失，怎么办？</summary></details>
<p>先解释窗口：主节点确认锁后、尚未复制就故障，从节点提升后可能再次授予同一把锁。应按业务风险把最终约束放在权威存储，例如唯一键、条件更新或资源端版本检查，并评估适合的协调方案；续期和增加重试不会自动修复异步复制的排他缺口，已发出的外部动作还需查证和对账。</p>

<details data-knowledge-key="async-job-queue"><summary>（14）怎样设计一个秒杀系统？</summary></details>
<p>先明确库存不能超卖、购买资格和一人一单等业务规则，再把入口校验与限流、热点读视图、受控预占、异步排队和订单状态查询串起来。以权威事务维护库存条件与订单唯一性，消息以稳定操作标识幂等处理；Redis 预扣与 MQ 投递之间的崩溃窗口、支付超时释放和恢复对账必须有记录与补偿协议，队列受理不能直接当作下单成功。</p>

<details data-knowledge-key="tcp-handshake"><summary>（15）TCP 三次握手怎样完成，为什么需要第三次？</summary></details>
<p>按客户端 SYN、服务端 SYN+ACK、客户端 ACK 说明双向初始序列号与连接状态同步，SYN 本身占一个序列号。第三次让服务端得到对自身 SYN 的确认，不能只用“双方都能收发”代替状态机解释；握手成功也不代表 TLS、鉴权或业务已经成功。</p>

<details data-knowledge-key="tcp-udp"><summary>（16）TCP 怎样保证消息传输的可靠性？</summary></details>
<p>TCP 提供可靠有序的字节流，通过字节序号、确认、重传与校验处理丢失、重复和差错，并用接收窗口与拥塞控制限制发送。它不保留应用消息边界，应用还要自己定界；连接失败仍可能使交付结果不确定，TCP 的可靠性也不能证明对方业务只执行一次。</p>

<details data-knowledge-key="http-message"><summary>（17）HTTP/1.0 和 HTTP/2 有什么区别？</summary></details>
<p>先从 HTTP/1.0 的文本报文与常见短连接方式说起，再说明 HTTP/2 保留 HTTP 语义、采用二进制分帧、同连接多路复用和 HPACK 字段压缩。不要把 HTTP/1.1 的默认持久连接倒算给 1.0，也不能说所有 1.0 实现都绝无复用扩展；HTTP/2 仍承载于 TCP，丢包造成的传输等待没有凭多路复用完全消失。</p>

## 延伸阅读

- [异步受理、消息与库存恢复](../../../knowledge/backend/api/async-job-queue.md)、[入口限流与降级](../../../knowledge/backend/auth/rate-limit-circuit.md)、[跨服务补偿边界](../../../knowledge/backend/storage/distributed-saga-consistency.md)。
