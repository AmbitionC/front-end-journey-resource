AQS（AbstractQueuedSynchronizer）把“获取失败后怎样排队、等待和再次竞争”做成可复用框架；具体同步器解释状态值，并决定何时允许获取或释放。ReentrantLock 是使用这个框架的可重入互斥锁，AQS 本身不是应用直接加锁的 Lock 实现。

本文先按 Java SE 21 公共 API 讲合同，再以 **OpenJDK 25 GA** 源码说明一条实际获取路径；方法布局属于该版本实现，不把旧版面试模板当成所有 JDK 都相同的调用链。互斥、CAS、可见性与条件重检的前置概念见[锁、信号量与并发同步](../../cs/os/os-thread-sync.md)。

## AQS 分别负责状态与等待的哪一部分

[AQS API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)围绕一个原子更新的 int 状态提供框架：子类通过 `getState()`、`setState()`、`compareAndSetState()` 访问它，定义状态代表什么，再覆盖适用的获取、释放钩子。读写状态有 volatile 语义，CAS 提供条件更新；读后自增再写回并不会因此成为一个通用的原子复合操作。

| 层次 | 主要职责 | 典型方法 |
|---|---|---|
| AQS 子类策略 | 判断资源是否可获得、解释状态变化 | tryAcquire、tryRelease；共享模式对应 tryAcquireShared、tryReleaseShared |
| AQS 获取与释放模板 | 调用策略；失败后管理同步等待队列、阻塞与再次尝试 | acquire、acquireInterruptibly、tryAcquireNanos、release |
| 状态与持有者记录 | 原子状态变化，以及独占同步器的持有者诊断/管理 | getState、setState、compareAndSetState；继承的 owner 访问方法 |

AQS 同时支持独占与共享模式。ReentrantLock 走独占模式；共享模式允许多个线程在同步器策略准许时获取资源，不等于任何线程都无条件成功。其内部 FIFO 等待队列也**不会自动强制公平获取**：新线程可能在入队前尝试成功，是否允许插队由获取策略决定。

## ReentrantLock 怎样表达重入

在 [OpenJDK 25 GA 的 ReentrantLock](https://github.com/openjdk/jdk/blob/jdk-25-ga/src/java.base/share/classes/java/util/concurrent/locks/ReentrantLock.java)中，内部 Sync 继承 AQS：state 表示持有次数，另记录独占持有线程。state 为 0 表示未持有；其他线程不能把某个正数状态简单增加一次就算成功获取。

当前持有者再次调用 lock 可以增加持有次数；新的持有者则需要按公平或非公平策略成功取得空闲状态，再登记 owner。每次成功获取都需要配对释放。下面是教学时序，假定没有其他操作插入：

| 操作 | state | owner 与结果 |
|---|---|---|
| T1 第一次获取成功 | 0 → 1 | owner 为 T1 |
| T1 再次获取成功 | 1 → 2 | 同一线程重入，不需要重新排队 |
| T2 尝试获取 | 仍为 2 | 不能进入临界区，按所调用 API 等待或失败 |
| T1 第一次 unlock | 2 → 1 | T1 仍持有锁，尚未完全释放 |
| T1 第二次 unlock | 1 → 0 | 清除 owner，允许后续竞争 |

非持有者调用 unlock 会抛 IllegalMonitorStateException。可重入不让子线程继承父线程持有权，也不消除多把锁之间的死锁；这些是 [ReentrantLock API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)中持有、计数和释放合同的边界。

## lock 从快路径到等待重试怎样走

下面画的是 OpenJDK 25 GA 的正常独占获取路径，省略内存分配失败等低层分支。**只有实际获取成功，lock 才返回到临界区；unpark 只是让等待线程有机会继续竞争。**

![lock 先调用 Sync 的 initialTryLock，失败后进入 AQS acquire 和 tryAcquire；仍失败时入队重试并可能 park；持有者释放至零后通知等待者继续竞争](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-aqs-reentrant-lock-acquire-archify-v1.png)
*图：等待队列保存竞争顺序，获取策略决定能否成功；唤醒箭头不表示转交所有权。*

1. `ReentrantLock.lock()` 委派给 Sync.lock。该版本先运行公平或非公平子类的 `initialTryLock()`，检查快速获取或同线程重入。
2. 初试失败后调用 AQS 的 `acquire(1)`。AQS 先调用子类 `tryAcquire(1)`；成功就返回，失败才继续等待管理，因此“CAS 失败一次便立即睡眠”并不准确。
3. 等待路径管理节点和队列，在适当位置再次尝试获取；必要时调用 LockSupport.park。醒来后仍要重新判断和获取，不能仅凭被通知就执行受保护代码。
4. `unlock()` 调用 AQS.release(1)，由 Sync.tryRelease 减少持有次数并验证 owner。完全释放时，AQS 通知后继等待者继续尝试；次数未归零则仍由原线程持有。

这条调用链直接来自 [ReentrantLock 源码](https://github.com/openjdk/jdk/blob/jdk-25-ga/src/java.base/share/classes/java/util/concurrent/locks/ReentrantLock.java)与 [AQS 的 acquire/release 源码](https://github.com/openjdk/jdk/blob/jdk-25-ga/src/java.base/share/classes/java/util/concurrent/locks/AbstractQueuedSynchronizer.java)。它说明策略与等待机制如何组合，不承诺线程切换次数、固定自旋次数或某个获取延迟。

## 公平与非公平究竟在哪里不同

`new ReentrantLock()` 等价于非公平配置；`new ReentrantLock(true)` 请求公平策略。公平锁在竞争时偏向等待时间更长的线程，非公平锁不保证特定获取次序；公平性可能影响吞吐和等待时间分布，应对真实负载测量，而不是断言总有一种更快。[Java 21 ReentrantLock 合同](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)还明确指出：锁的公平性不等于线程调度公平。

在上述 OpenJDK 25 GA 源码中，非公平 `initialTryLock` 首先直接尝试空闲状态的 CAS；公平初试先检查是否已有排队线程。后续 FairSync.tryAcquire 在 CAS 前检查 `hasQueuedPredecessors()`，避免越过已有前驱。两者都允许当前持有者重入，公平不意味着已持锁线程的嵌套调用也排到队尾。

例如 T1 持有锁，T2 已等待，T1 释放后 T3 恰好开始竞争。非公平策略允许 T3 在空闲窗口先成功；公平获取会考虑已有等待者。这个例子只是解释可能的交错，不是每次都会发生的执行记录，也不能据此预测操作系统先调度谁。

另一个常考边界是**不带超时的 tryLock() 不遵守公平配置**：即使创建的是公平锁，锁当前可用时它仍可抢先成功。需要按公平策略尝试并响应中断时，可按合同选择带时间参数的 tryLock；不要把两种重载只当作“多了一个等待时长”。

## 选择等待、超时与条件的合同

| 调用 | 调用方需要处理的结果 |
|---|---|
| lock() | 等到获取成功；等待时收到中断不会像 lockInterruptibly 那样中止并抛 InterruptedException |
| lockInterruptibly() | 可在等待时响应中断，获取成功后才承担释放责任 |
| tryLock() | 立即给出成功或失败；成功才进入 finally 解锁 |
| tryLock(timeout, unit) | 在期限内等待，可能成功、返回 false 或因中断抛异常 |

API 选择不能只看“能加锁”：取消需求、等待上限和失败后动作也是协议的一部分。成功获取后应用应立即进入 try，并在 finally 配对 unlock；业务代码抛异常也不能遗失释放。这里描述控制结构，没有声称已经编译或压力测试了某个锁实现。

Condition 是另一类等待：条件不满足时 await 释放该锁并等待，返回前必须重新获取锁，仍要用 while 重检业务谓词。AQS 的 ConditionObject 与同步等待队列职责不同，signal 不等于立刻取得锁，也不能替代完整的条件循环。[AQS API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)限定了可使用 ConditionObject 的独占同步器合同。

## 口述时如何连起来

可以按“状态含义 → 快路径 → 获取钩子 → 等待重试 → 释放唤醒 → 公平例外”说明：AQS 提供状态与排队框架，ReentrantLock 解释持有计数和 owner。默认非公平，公平策略检查前驱，但不带时间的 tryLock 有插队例外。最后补上重入要配对解锁、唤醒后仍须获取、实现路径须限定 JDK 版本。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [商盟支付 Java 开发实习一面：交易去重、并发与消息](../../../interview/shangmeng/ai/shangmeng-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [Java SE 21 AbstractQueuedSynchronizer：状态、独占/共享、获取模板与公平性](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)
- [Java SE 21 ReentrantLock：重入、默认策略、tryLock 与中断](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [OpenJDK 25 GA ReentrantLock：Sync、NonfairSync 与 FairSync](https://github.com/openjdk/jdk/blob/jdk-25-ga/src/java.base/share/classes/java/util/concurrent/locks/ReentrantLock.java)
- [OpenJDK 25 GA AQS：acquire、release、park 与后继通知](https://github.com/openjdk/jdk/blob/jdk-25-ga/src/java.base/share/classes/java/util/concurrent/locks/AbstractQueuedSynchronizer.java)

公共合同与所示源码均于 2026-11-06 核验；源码细节不替代其他 JDK 版本的实际实现。
