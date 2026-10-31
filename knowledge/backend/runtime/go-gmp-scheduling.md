Go 用 goroutine 表达并发任务，运行时再把就绪任务分配给操作系统线程。GMP 模型解释的是这层调度：谁保存执行状态、谁真正运行代码，以及执行 Go 代码需要哪些运行时资源。它能帮助区分“很多任务在等待”和“很多线程被阻塞”，但不能替代对实际负载的测量。

本文以 Go 官方运行时说明和当前公开源码解释稳定概念，不承诺所有版本都有相同队列容量、轮询频率、抢占时长或默认参数。基础术语可先读[进程、线程与协程](../../cs/os/os-process-thread.md)。

## G、M、P 各自保存什么

G 代表 goroutine，保存运行时管理它所需的执行状态，例如栈和调度状态。一个 G 可能就绪、正在运行或等待；创建一个 G 不等于立即得到一个操作系统线程。

M 是操作系统线程。操作系统调度 M，M 可以执行用户 Go 代码、运行时代码、系统调用，或处于空闲。P 是执行用户 Go 代码所需的一组运行时资源，包括调度和内存分配相关状态；它不是一个物理 CPU 核心，也不是为某个 goroutine 永久预留的线程。

M 执行用户 Go 代码时需要持有 P。某一时刻 P 的数量对应 `GOMAXPROCS`，但 M 可以多于 P，例如部分线程正在系统调用中阻塞。G、M、P 的匹配会变化，不是固定的一对一身份绑定。[Go runtime：G、M 与 P](https://go.dev/src/runtime/HACKING#gs-ms-ps)

## 用一个调度快照建立空间概念

下图是假设 `GOMAXPROCS=2` 的教学快照。M1、M2 各持一个 P 执行 G；另一 M3 处在阻塞系统调用中，图示状态下它已经不持有 P。就绪 G 可能在本地或全局运行队列中，等待的 G 则尚不能直接作为就绪任务执行。

![两个 P 分别配合两个操作系统线程执行 goroutine，本地与全局队列保存就绪任务，另一个阻塞系统调用中的线程不持有 P](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/go-gmp-scheduling-resources-v1.png)
*图：Excalidraw 架构快照。两个 P 是教学设定，虚线表示可能的工作获取与唤醒关系；唤醒入队位置仅作示意，实际可涉及本地或全局队列。P 不是固定 CPU 核，也没有永久绑定的 M。*

P 让本地调度状态分散管理，减少所有任务都争用一个中心队列的需要。负载不均时，空闲执行资源可以尝试获取其他队列中的工作；这不意味着每一次任务创建或调度都必经同一条固定顺序。[Go 调度器源码说明](https://go.dev/src/runtime/proc.go)

## 就绪、运行与等待怎样衔接

就绪表示 G 已具备继续执行的条件，但仍需等到调度。运行中的 G 完成、挂起或被调度出去后，相同 M/P 可以执行另一个就绪 G。网络事件、定时器或同步条件满足时，等待中的 G 可以被重新置为就绪，随后再竞争执行机会。

Go 当前调度实现结合每 P 的本地队列、全局队列、工作窃取、网络轮询和定时器等来源寻找工作。源码还包含公平性和运行时工作的安排，因此“只检查本地队列，空了才按一个永久顺序查完所有队列”的背诵会漏掉条件与版本变化。理解各来源解决什么问题，比记住某个实现常量更有用。[proc.go：调度循环](https://go.dev/src/runtime/proc.go)

这里的“工作窃取”只是调度器在其他执行资源上寻找可运行任务，不表示越权访问业务数据，也不保证所有 G 都得到严格相等的运行时间。长时间计算、锁竞争、GC 和容器 CPU 限制都会影响实际等待。

## Sleep、网络等待与阻塞系统调用为什么不同

`time.Sleep` 通常把当前 goroutine 挂起，定时器到期后使它重新就绪；它不要求每个睡眠 G 在整个期间独占一个 OS 线程。官方 `time.go` 的实现通过调度器停放 G；到期只说明可以继续参与调度，不保证立即运行，也不保证精确在指定纳秒恢复。[Go：time.Sleep 的运行时实现](https://go.dev/src/runtime/time.go)

类似地，运行时能配合处理的网络等待或 channel 等待可以停放 G，让原来的执行资源推进其他任务。但不是所有“等待函数”都具有同一种行为：长计算、某些外部阻塞调用、cgo 或锁定 OS 线程的使用方式，需要结合实际调用路径判断。

如果 M 进入阻塞系统调用，运行时可以把执行 Go 代码所需的 P 交给其他 M，使其他就绪 G 继续推进。具体保留、交接和重新获取取决于路径与实现，不能概括成“每个系统调用都立刻创建一个线程”。阻塞 M 恢复执行用户 Go 代码前，还要获得 P。[Go runtime：调度资源与系统调用](https://go.dev/src/runtime/HACKING#gs-ms-ps)

因此，大量 G `Sleep` 与大量 M 阻塞不是同一件事。前者仍可能消耗 goroutine 栈、定时器、关联对象和取消管理资源；后者还可能增加线程资源压力。无限创建等待任务都不是合理的容量管理方式，但问题不能简单归因为“一协程一线程”。

## GOMAXPROCS 限制什么，不限制什么

`GOMAXPROCS` 限制同时执行用户级 Go 代码的 OS 线程数量，不是全部线程数、goroutine 数或机器物理核心数。把它设大也不能凭空增加 CPU 配额，更不能保证吞吐线性增长。[Go：runtime 包说明](https://pkg.go.dev/runtime#hdr-Environment_Variables)

默认值与容器适配是版本敏感行为。当前官方文档说明默认选择会考虑逻辑 CPU、CPU affinity 及 Linux cgroup CPU 吞吐限制，并说明语言版本、环境变量、手动设置与自动更新的差异。排查时应记录部署 Go 版本、实际 `GOMAXPROCS` 和容器限制，而不是把旧版本的“默认等于核数”当所有部署的事实。[runtime.GOMAXPROCS](https://pkg.go.dev/runtime#GOMAXPROCS)

例如两个 P 可以推进大量主要在等待 I/O 的 G，却只能让有限数量的用户 Go 代码同时占用执行资源。若任务主要是 CPU 计算，加 goroutine 可能增加排队；若瓶颈在数据库连接池或外部服务，修改 P 数也未必改善端到端延迟。

## 怎样用这个模型排查实际问题

先区分任务处于 runnable、running 还是 waiting，再看对应证据。CPU 已饱和而 runnable G 持续积压时，检查计算热点和任务并发；大量 waiting 时，查看等待原因、外部依赖、锁与连接池；线程数异常增长时，检查阻塞系统调用、cgo 和线程绑定等路径。不要仅凭 goroutine 总数判定 CPU 调度能力不足。

结合可比较负载下的端到端延迟、CPU profile、goroutine profile 和 execution trace，才能把现象连到代码。调度细节不是业务正确性协议：共享数据仍要同步，任务仍需取消、超时与容量边界，也不能因为 goroutine 轻量就省略这些责任。

## 面试时怎样连贯解释

可以从资源关系开始：“G 是 goroutine，M 是 OS 线程，P 是运行用户 Go 代码需要的运行时资源。调度器把就绪 G 分配给持有 P 的 M，并结合本地/全局队列和工作窃取平衡工作。G 进入可协作等待时可以停放，让 M/P 执行其他 G；阻塞系统调用则可能阻塞 M，并涉及 P 的交接。`GOMAXPROCS` 控制的是 Go 代码并行执行上限，不能当作全部线程数。”随后再按具体版本和负载解释行为。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [MiniMax 平台研发一面：数据可靠性、反馈闭环与 GMP](../../../interview/minimax/ai/minimax-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [Go runtime：HACKING — Scheduler structures 与 Blocking](https://go.dev/src/runtime/HACKING)
- [Go runtime：proc.go 调度器实现及说明](https://go.dev/src/runtime/proc.go)
- [Go runtime：time.go 中的 goroutine 休眠](https://go.dev/src/runtime/time.go)
- [Go：runtime 包与 GOMAXPROCS](https://pkg.go.dev/runtime)
