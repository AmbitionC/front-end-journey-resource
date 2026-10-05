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

## 面试口述与教学追问

可口述：ThreadPoolExecutor 先按核心数接任务，之后优先排队，队列满才尝试扩大到最大线程数；饱和或关闭进入拒绝策略。参数必须一起按工作负载和下游容量验证，CallerRuns 占用的是提交线程，不保证关闭时仍执行。

教学追问：max 很大但线程数不增长，先检查是否使用无界队列；若提交者是网络事件循环，解释 CallerRuns 为什么会放大尾延迟；若 D 被丢弃而调用方等待 Future，说明需要怎样的取消或失败通知。这些是教学条件变化，非新增面试官原题。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈一面：RAG、Java与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
- [字节全栈：预请求、列表复用与 ThreadLocal](../../../interview/bytedance/base/bytedance-base-44.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
<!-- interview-source-history:end -->

## 参考资料

- [JDK 21：ThreadPoolExecutor 参数、排队与拒绝](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)（2026-10-03核验，适用JDK 21）
