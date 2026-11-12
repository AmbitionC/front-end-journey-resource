线程池管理的是有限执行资源和待执行任务。线程数、队列容量与拒绝行为必须一起理解：接收任务不意味着立即运行，线程池创建成功也不证明系统能承受持续过载。本文讨论 JDK 21 的 ThreadPoolExecutor 平台线程池，不把这些策略直接当成虚拟线程执行器的模型。

## 七个参数怎样配合

corePoolSize 是核心线程数，maximumPoolSize 是最大线程数；keepAliveTime 与 unit 决定超出核心数的空闲线程保留多久。workQueue 保存等待任务，threadFactory 创建线程，handler 定义任务无法接纳时的拒绝行为。默认并不是构造时立即启动所有核心线程，核心线程空闲超时也需要另外配置。

这些参数不是独立旋钮。队列越长，突发流量越能暂时排队，但等待、内存和过期任务也越多；最大线程数再高，使用无界队列时也通常不会因为队列积压就扩大超过核心数。[JDK 21 的排队规则](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)明确说明了这个优先顺序。

## 提交任务的三个接纳阶段

在未关闭且正常运行的简化路径中，当前线程数少于核心数时先尝试创建线程；核心数已满足时先尝试入队；队列放不下才尝试在最大数内增加线程。都不能接纳，或者线程池已经关闭，则进入拒绝处理器。实现还会复核并发关闭等状态，所以不能把流程图当成没有竞争的原子步骤。

下图把提交、工作线程、等待队列和拒绝分开。注意 CallerRuns 最后的执行位置仍是提交线程，并没有凭空多出一个工作线程。

![任务提交到线程池后按核心线程、队列与最大线程数接纳；无法接纳时进入拒绝处理器，CallerRuns在未关闭时占用提交线程](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-thread-pool-archify-v1.png)
*图：达到核心数后优先排队；队列饱和才尝试扩容。拒绝策略是失败协议的一部分。*

教学推演：设 core=1、max=2、队列容量=1，并假设此前接纳的任务一直阻塞、没有线程退出。依次提交 A、B、C、D，A 启动核心线程，B 排队，C 因队列满而由第二个线程执行，D 才触发拒绝。这个条件化例子说明为什么 max=2 不代表前两项必然同时执行；真实完成顺序仍由任务与调度决定。

## 拒绝策略究竟承诺了什么

| 策略 | JDK 21 行为 | 需要明确的业务边界 |
|---|---|---|
| AbortPolicy | 抛 RejectedExecutionException | 调用方必须识别未接纳，决定失败、延后或降级 |
| CallerRunsPolicy | 未关闭时由调用 execute 的线程执行；关闭后丢弃 | 允许提交者同步变慢；不能误放到不应阻塞的事件线程 |
| DiscardPolicy | 静默丢弃 | 仅适用于明确可损失的任务，不能假装成功 |
| DiscardOldestPolicy | 未关闭时丢队首任务，再尝试 execute | 队首不一定是业务最可丢的；需处理被丢任务的等待者 |

CallerRuns 中的 caller 不是固定的 main 线程。如果请求处理线程提交耗时任务，它就同步承担这个耗时；如果事件循环线程提交，可能阻塞整个循环。它能降低生产者提交速度，却不能增加系统的处理能力，也不能保证关闭之后每项任务都完成。

静默丢弃尤其要小心 Future 等待：未运行的任务若也没有取消或失败通知，等待者可能一直等下去。“低优先级”也不等于可以不记失败，应先定义可损失契约。

## 为什么核数加一不是答案

CPU 密集任务通常接近实际可用 CPU 并行度开始测量；“核数+1”最多是试图覆盖偶发等待的经验值，没有 JDK 保证。容器限额、其他线程负载、锁竞争、内存带宽与任务粒度都会改变最优点。I/O 阻塞较多时可以需要更多并发，但仍受连接池与下游容量限制。

固定任务和输入，观察排队、执行、尾延迟、CPU、拒绝与下游错误，再调一个参数。若输入长期快于处理，增加无界队列只把过载推迟；入口限流、有界等待、显式拒绝或容量规划更能说明完成语义。

## 拆分业务池：隔离什么，仍然共享什么

线程池拆分要先回答“哪类任务会互相拖慢”。例如，一类任务执行很短，另一类任务需要等待慢下游；若共用一个等待队列，后者积压可能延长前者的等待。按可解释的业务边界分配执行资源，是一种隔离候选方案。这个例子是教学假设，不表示某个来源项目采用了这些任务类型。

每个池都要定义线程上限、等待队列和拒绝协议，同时核对所有池的总资源预算。多个池仍共享进程 CPU、内存和部分下游连接，拆池不会凭空增加下游容量。应比较相同输入下的排队时间、执行时间、尾延迟、拒绝及下游错误；不能只凭池数量增加判断优化成功。[ThreadPoolExecutor 的容量与排队规则](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)是参数分析的起点，业务隔离效果还需实际测量。

## RPC 有回调执行器，为什么仍需判断业务隔离

先分清网络传输线程、框架服务回调和业务任务在哪执行。“用了 RPC”不自动确定线程模型；是否另设业务池，要读具体框架、配置和实际等待关系。以当前 grpc-java `ServerBuilder` 文档为例，`executor(Executor)` 设置默认服务回调执行器，而 `directExecutor()` 直接在传输线程执行应用代码，并明确要求应用不得阻塞。这个例子说明配置会改变执行位置，不表示所有 RPC 都这样，也不表示来源项目使用 grpc-java。[grpc-java ServerBuilder 执行器契约](https://grpc.github.io/grpc-java/javadoc/io/grpc/ServerBuilder.html#executor(java.util.concurrent.Executor))

如果框架回调再提交到业务池，就多了一次调度与可能的排队。工程上需要把排队纳入同一请求的剩余时间预算，定义拒绝、取消和结果回传；不能让入口已经超时，后台任务仍无限积压。若回调同步等待另一个池的结果，还要检查池间依赖，尤其是有限线程都在等待只能由同一资源执行的后续工作。这些是由执行链推导出的设计检查，不是 JDK 或 RPC 自动提供的保证。

## “动态”有两种含义：改参数，或替换池

JDK 21 的 `ThreadPoolExecutor` 可以运行时修改核心数、最大数和空闲保留时间。减少核心数或最大数时，多余线程在随后空闲时退出，不会因设置调用返回就立刻杀掉正在执行的任务。参数仍须满足 `0 <= corePoolSize <= maximumPoolSize` 且最大数为正等约束；例如要把核心数提高到旧最大数以上，必须先扩大最大数。这是参数约束推导出的调整顺序，不是原子的批量配置事务。[JDK 21：setCorePoolSize 与 setMaximumPoolSize](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#setCorePoolSize(int))

| 动态修改的对象 | 必须单独确认的边界 |
|---|---|
| 核心数、最大数、空闲时间 | 参数相互约束，已有任务继续执行，观察实际线程数 |
| 工作队列 | 标准线程池没有通用的队列容量在线调整接口；能力取决于实际队列实现 |
| 按业务创建或替换池 | 谁拥有池、最多多少个池、新旧路由如何交接、旧任务由谁收尾 |

按业务动态建池时，建议先为路由与提交设计明确的交接协议：准备新池及其预算，再切换新任务的去向，随后阻止继续向旧池提交，最后处理旧池已有任务。并发提交可能已经取得旧引用，单纯替换一个映射不构成完整交接；拒绝后是否重试、在哪个池重试，都要结合接纳结果与业务幂等性定义，不能盲目把同一任务复制到两个池。

## 释放旧池：发起关闭，等待结束，处理剩余任务

`shutdown()` 发起有序关闭：不再接纳新提交，已提交任务继续处理；它本身不等待结束。`awaitTermination` 在关闭请求之后有界等待，返回 `true` 才说明已终止；超时返回 `false`，等待线程也可能被中断。`isShutdown()` 为真不能替代 `isTerminated()`。[JDK 21：关闭与终止等待](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#shutdown())

![旧池有序关闭后继续处理已接纳任务；shutdownNow 只尝试中断，必须确认任务实际结束才能认为池已终止](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-thread-pool-retirement-v2.png)
*图：JDK 21 API 可观察行为的教学简图，省略内部实现状态。等待超时是一次观察结果，不会把强制停止请求改回有序排空。*

业务若决定调用 `shutdownNow()`，它会尝试中断正在执行的任务，并返回从队列移出的、尚未开始执行的任务；它仍不等待正在运行的任务结束。任务不响应中断时可能始终无法终止，因此不能写成“强制杀掉所有线程”。返回的任务、已经开始但结果未知的任务，以及仍在等待的调用方，需要按失败、取消或对账协议分别处理；把任务拿出来重新提交，也不能绕过副作用核验。[JDK 21：shutdownNow 的尽力而为边界](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#shutdownNow())

最后确认所有权：grpc-java 文档明确，server 不接管调用方传入执行器的所有权，关闭仍由调用方负责；不能因服务停止就推断自建池自动回收。其他框架须查各自契约。线程池终止也只证明这一执行器中的任务已经结束，不证明所有外部副作用已回滚、连接已关闭或业务交接已验收。


## 面试口述与教学追问

可口述：ThreadPoolExecutor 先按核心数接任务，之后优先排队，队列满才尝试扩大到最大线程数；饱和或关闭进入拒绝策略。参数必须一起按工作负载和下游容量验证，CallerRuns 占用的是提交线程，不保证关闭时仍执行。

教学追问：max 很大但线程数不增长，先检查是否使用无界队列；若提交者是网络事件循环，解释 CallerRuns 为什么会放大尾延迟；若 D 被丢弃而调用方等待 Future，说明需要怎样的取消或失败通知。这些是教学条件变化，非新增面试官原题。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [小红书产品工程师 Agent 一面：线程池与幻觉控制](../../../interview/redbook/ai/redbook-ai-9.md)
- [快手 AI 全栈一面：分布式锁、线程池与 AI 编码](../../../interview/kuaishou/ai/kuaishou-ai-20.md)
- [字节全栈一面：RAG、Java 与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
- [字节一面：线程池、分布式锁与数字构造](../../../interview/bytedance/base/bytedance-base-58.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [字节后端实习一面：Agent 取舍、线程池与索引](../../../interview/bytedance/base/bytedance-base-78.md)
- [商盟支付 Java 开发实习一面：交易去重、并发与消息](../../../interview/shangmeng/ai/shangmeng-ai-1.md)
- [蚂蚁暑期面经：线程池、数据来源与多 Agent 评测](../../../interview/antfin/ai/antfin-ai-14.md)
- [字节全栈：预请求、列表复用与 ThreadLocal](../../../interview/bytedance/base/bytedance-base-44.md)
<!-- interview-source-history:end -->

## 参考资料

- [JDK 21：ThreadPoolExecutor 参数、排队与拒绝](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)（2026-10-03核验，适用JDK 21）
- [grpc-java：服务回调执行器与关闭责任](https://grpc.github.io/grpc-java/javadoc/io/grpc/ServerBuilder.html#executor(java.util.concurrent.Executor))（本节按 2026-11-08 可见文档核验，不假定来源项目采用该框架）
