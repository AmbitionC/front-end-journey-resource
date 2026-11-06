公司为商盟支付，岗位为 Java 开发实习，轮次为一面；原文标题给出 10 月 19 日，未单独注明面试年份。问题中的阿里云只是上下文透传方案的供应商线索，不代表招聘公司。以下短答与例子是编辑教学整理，不代表作者的现场回答、具体框架或企业内部事实；自我介绍、项目总述与仅有转述的反问背景不展开。

<details data-knowledge-key="api-idempotency"><summary>（1）重复交易拦截怎样设计？</summary>
</details>
<p>先按业务定义同一交易的稳定标识、租户作用域与参数指纹，再以唯一约束或原子账本协调并发，将业务变更和可重放结果放进可证明的一致性边界。教学例子是支付请求因回执丢失重试时查询原交易并返回原结果；Redis 解锁只结束执行互斥，不能删除唯一的重复交易依据。外部效果未知时先查状态或对账，结果保留期与执行租约分别设计。 <a href="../../../knowledge/backend/api/api-idempotency.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（2）上下文传递及超时控制采用阿里云 TraceId 透传，还是框架自带功能？</summary>
<span>关联知识点待核实。</span>
</details>
<p>框架来源待补：原文未给代码、组件或配置，不能从 TraceId 一词认定用了某家产品；TraceId 用于关联请求，不自动实施权限传播或总超时。一般需说明上下文如何跨线程与网络边界携带、deadline 如何继承，以及异常后怎样清理；这些是核对方向，不是作者实现。</p>

<details data-knowledge-key="java-thread-local"><summary>（3）ThreadLocal 为什么可能造成内存泄漏？</summary>
</details>
<p>以 OpenJDK 21 为例，活线程持有 ThreadLocalMap，Entry 的 key 是弱引用而 value 仍为强引用；key 被回收不意味着 value 立即释放。比如线程池 worker 长期复用时，大对象或旧请求身份可能被保留，因此请求边界应在 finally 中 remove，异步传播也要显式限定作用域。 <a href="../../../knowledge/backend/java/java-thread-local.md">知识详解</a></p>

<details data-knowledge-key="java-collections"><summary>（4）Java 集合的“三个类型”怎样区分？</summary>
</details>
<p>先确认“三个类型”的分类口径，再说明 List、Set、Map 的常用角色；Map 不继承 Collection，Collection 体系还包括 Queue/Deque。继续按位置、唯一性和处理次序选接口，不把有序误当成自动排序。 <a href="../../../knowledge/backend/java/java-collections.md">知识详解</a></p>

<details data-knowledge-key="algorithm-hash"><summary>（5）HashMap 的数据结构与一次查找过程是什么？</summary>
</details>
<p>限定 JDK 8 实现时，它以桶数组定位，碰撞桶通常为链表，满足条件可树化；先算扰动后的 hash 和桶位置，再检查 key 相等性。比如不同 key 哈希碰撞仍需 equals 比较，不能把 hash 相同当 key 相同；平均常数查找还依赖分布、负载与扩容成本。 <a href="../../../knowledge/data-structure/algorithm/algorithm-hash.md">知识详解</a> · <a href="https://openjdk.org/jeps/180">规范核对</a></p>

<details data-knowledge-key="algorithm-hash"><summary>（6）HashMap 从 JDK 7 到 JDK 8 的重要变化解决了什么问题？</summary>
</details>
<p>核心改进是高冲突桶可由链表转为平衡树，以缓解长碰撞链的查找代价；树化同时受链长与表容量条件约束，不能背成“第八个节点必树化”。教学例子是 JDK 8 扩容时依据旧容量对应的哈希位拆成两组；结构优化没有把 HashMap 变成线程安全容器。 <a href="../../../knowledge/data-structure/algorithm/algorithm-hash.md">知识详解</a> · <a href="https://openjdk.org/jeps/180">规范核对</a></p>

<details data-knowledge-key="chain-of-responsibility-validation"><summary>（7）除了简历中的模式，还可以怎样介绍设计模式？</summary>
</details>
<p>先按变化职责比较：工厂负责创建哪一种对象，策略负责替换同一任务的算法，责任链负责请求经过哪些处理器以及何时继续或短路。教学例子是解析器工厂创建实现、Comparator 替换排序规则、FilterChain 选择是否调用下一环。原文未给简历已有模式清单或实际用法，不能把这些例子冒称作者使用过或必然属于“额外”模式。 <a href="../../../knowledge/backend/framework/chain-of-responsibility-validation.md">知识详解</a></p>

<details data-knowledge-key="java-thread-pool"><summary>（8）线程池有哪些核心参数，怎样一起配置？</summary>
</details>
<p>JDK 21 ThreadPoolExecutor 的核心数、最大数、空闲保留时长及单位、队列、线程工厂和拒绝处理器要一起分析。比如有界队列会在核心线程忙且排队满后才尝试扩到最大数，无界队列通常不会因积压就继续增线程；容量应结合等待、内存和下游并发验证。 <a href="../../../knowledge/backend/java/java-thread-pool.md">知识详解</a></p>

<details data-knowledge-key="java-thread-pool"><summary>（9）ThreadPoolExecutor 提交任务后的执行流程是什么？</summary>
</details>
<p>在正常运行的简化路径中，线程数未到核心数先尝试建线程，之后优先入队，队列不能接纳才在最大数内扩容，否则拒绝；实现还会复核关闭等竞争状态。教学例子 core=1、max=2、容量=1 且任务持续阻塞时，前三项分别运行、排队、再扩容，第四项才拒绝。 <a href="../../../knowledge/backend/java/java-thread-pool.md">知识详解</a></p>

<details data-knowledge-key="java-aqs-reentrant-lock"><summary>（10）AQS 做什么，内部机制怎样分工？</summary>
</details>
<p>先区分同步策略和等待框架：子类解释 state 并实现获取、释放钩子，AQS 管理队列、阻塞和重试。再说明独占/共享、CAS 与 Condition 的职责，不能把 FIFO 等待队列直接当作公平获取承诺。 <a href="../../../knowledge/backend/java/java-aqs-reentrant-lock.md">知识详解</a></p>

<details data-knowledge-key="java-aqs-reentrant-lock"><summary>（11）ReentrantLock 的 lock 怎样工作，默认是公平锁还是非公平锁？</summary>
</details>
<p>先交代实例配置：无参 ReentrantLock 默认非公平，也可以显式创建公平锁。lock 获取失败会进入 AQS 的获取与等待路径，公平策略还需检查排队者；不带超时的 tryLock 是公平配置下的插队例外。 <a href="../../../knowledge/backend/java/java-aqs-reentrant-lock.md">知识详解</a></p>

<details data-knowledge-key="java-aqs-reentrant-lock"><summary>（12）ReentrantLock 加锁过程中用到哪些 AQS 机制？</summary>
</details>
<p>先限定 JDK 版本，再沿快路径、acquire、tryAcquire、入队与 park 后重试解释获取；释放则沿 release 与 tryRelease 说明持有次数归零后的通知。以 OpenJDK25 为例的内部方法安排不能冒充所有版本，唤醒也不等于获得锁。 <a href="../../../knowledge/backend/java/java-aqs-reentrant-lock.md">知识详解</a></p>

<details data-knowledge-key="spring-container"><summary>（13）Spring 初始化时把数据库数据加载进缓存，可以使用哪些扩展点？</summary>
</details>
<p>按依赖与就绪要求选择扩展点：单 Bean 校验可用初始化回调，依赖常规单例的准备可放在 SmartInitializingSingleton 或刷新事件，Boot 启动任务还可使用 Runner。再明确数据库准备、超时失败、缓存发布和 readiness 的边界，不能把任务已提交当成预热已完成。 <a href="../../../knowledge/backend/java/spring-container.md">知识详解</a></p>

<details data-knowledge-key="mysql-index"><summary>（14）哪些写法可能使查询无法有效利用原有索引？</summary>
</details>
<p>对普通索引列施加函数或运算、类型转换、前置通配符，以及不利的联合索引前缀条件，都可能限制定位范围，但实际选择仍受版本、统计与成本影响。比如把 YEAR(created_at)=某年改为同列的起止范围，再对照计划和扫描行数；不能把“不走某索引”一概解释成索引已失效。 <a href="../../../knowledge/backend/database/mysql-index.md">知识详解</a></p>

<details data-knowledge-key="mysql-index"><summary>（15）收到慢 SQL 告警后，怎样思考、排查和解决？</summary>
</details>
<p>先收集 SQL、参数分布、时间范围、扫描与返回量，再结合执行计划、锁等待和服务资源定位耗时，最后在可控条件下验证改写或索引收益。比如有索引却仍很慢可能因为命中范围过大、回表或等待，不能见到告警就堆索引；采样和详细执行分析本身也要计入开销。 <a href="../../../knowledge/backend/database/mysql-index.md">知识详解</a></p>

<details data-knowledge-key="db-transaction-lock"><summary>（16）怎样判断实习中的问题是否涉及分布式事务？</summary>
</details>
<p>先画清业务不变量与参与资源：同一数据库的本地事务、跨资源原子提交，以及外部调用的幂等对账是不同问题。教学例子中，XA 的 prepare 还不是最终提交，协调者故障可使已准备分支持续等待；原文未给实际架构，不能替作者声称用了 XA、Saga 或某个事务框架。 <a href="../../../knowledge/backend/database/db-transaction-lock.md">知识详解</a></p>

<details data-knowledge-key="async-job-queue"><summary>（17）RocketMQ 有哪些消息类型，应怎样结合版本说明？</summary>
</details>
<p>先核对实际版本；以下按 RocketMQ5.x 的 Topic 合同说明普通、FIFO 顺序、定时/延时和事务四类消息，不把异步发送或广播消费混成消息类型。教学例子是订单通知、同订单保序、到期后可见与生产端本地事务协调分别选择不同合同；事务消息不等于下游数据库的全局原子提交。原文未给版本和实际类型，部署时还应核对 SDK 与 Broker 的类型校验配置。 <a href="../../../knowledge/backend/api/async-job-queue.md">知识详解</a></p>

<details data-knowledge-key="async-job-queue"><summary>（18）RocketMQ 顺序消息怎样实现，会降低性能吗？</summary>
</details>
<p>RocketMQ5.x 以 MessageGroup 确定保序范围，并需要确定的生产顺序与正确的有序消费；同组名不能替多个生产者推断业务先后。教学例子是同一订单的创建、支付、发货串行完成，不同订单可按容量并行；收到后立即确认再丢给无序线程池会破坏效果顺序。慢消息、热点组和重试会增加等待，具体吞吐需按分组、队列、消费者与下游负载测量，不能承诺固定下降比例。 <a href="../../../knowledge/backend/api/async-job-queue.md">知识详解</a></p>

<details data-knowledge-key="async-job-queue"><summary>（19）RocketMQ 延迟消息怎样工作？</summary>
</details>
<p>以 5.0 文档为例，消息先进入定时存储，到设定时间再变成对消费者可见的消息；旧版固定延时级别与 5.x 时间戳接口应分别核对。比如订单到期检查由延迟消息触发，消费者仍按权威状态和截止时间判断，投递到期不保证立即执行业务，也不是自动周期重复。 <a href="../../../knowledge/backend/api/async-job-queue.md">知识详解</a> · <a href="https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/">规范核对</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（20）公司通常使用哪些模型和 Agent？</summary>
<span>关联知识点待核实。</span>
</details>
<p>实际产品清单待补：原文没有给出型号、版本、部署模式或工具名称，不能把编辑熟悉的产品补成公司实际使用。应在允许披露的范围内说明具体任务、模型和工具版本，并区分个人体验与团队正式采用；本项不据通用选型文章增加热度。</p>

<details data-knowledge-key="agent-architecture"><summary>（21）怎样理解 Agent？</summary>
</details>
<p>Agent 围绕目标观察环境、更新状态、选择行动、执行受控工具并核对结果，直到达到完成或停止条件；LLM 只是可能的决策组件。比如知识助手在证据不足时补查获准文档，写入前仍经过程序授权与验证，不把一次模型回复或固定流水线换个名字就视为自主智能体。 <a href="../../../knowledge/llm/agent/agent-architecture.md">知识详解</a></p>

<details data-knowledge-key="agent-coding"><summary>（22）怎样用 AI 分析需求、写代码和做测试？</summary>
</details>
<p>先给出可验收需求、真实仓库上下文和允许修改范围，让模型提出小补丁，再由类型检查、针对性测试与 diff 审查验证。教学例子是先固定分页失败场景，再检查修复是否保留原有行为与用户修改；AI 自评、代码能运行或生成很多测试都不能独立证明业务正确。 <a href="../../../knowledge/llm/agent/agent-coding.md">知识详解</a></p>

## 技术核对资料

- [JEP 180](https://openjdk.org/jeps/180)
- [Java Collections](https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html)
- [Java 21 AQS](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)
- [Java 21 ReentrantLock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [Spring bean lifecycle](https://github.com/spring-projects/spring-framework/blob/main/framework-docs/modules/ROOT/pages/core/beans/factory-nature.adoc)
- [RocketMQ FIFO](https://rocketmq.apache.org/docs/featureBehavior/03fifomessage/)
- [RocketMQ delay](https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/)
