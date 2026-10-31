模型服务的并发配置要同时回答三个问题：请求由哪些进程和线程处理，模型权重实际驻留在哪里，以及瓶颈允许多少工作同时推进。学完本文，应能画出自己的进程与设备边界，再用内存、吞吐和尾延迟决定 worker 数，而不是套用一个核数公式。

本文讨论 Python Web 服务调用本地推理模型的通用机制，CUDA 部分以 PyTorch 文档为例。图和计算均为教学示意，不代表某个面试项目的真实部署或压测结果。

## 先区分 worker、线程和模型实例

`worker` 是服务框架的工作单元名称，要先看具体实现。以 Flask 官方部署说明中的 Gunicorn 为例，`-w` 指定进程数；其他框架里的同名参数未必表示相同的调度单位。[Flask：Gunicorn 部署](https://flask.palletsprojects.com/en/stable/deploying/gunicorn/)

进程通常有独立地址空间；同一进程内的线程共享地址空间。因此，“四个 worker”“四个线程”“四份模型权重”不是可以直接互换的说法：要继续查每个进程在哪里初始化模型、请求发给哪个推理实例，以及框架是否显式提供共享机制。进程与线程的基础见[进程、线程与协程](../../cs/os/os-process-thread.md)。

若每个新进程都独立执行加载权重和转移到 GPU，通常会产生各自的模型分配。线程引用同一模型对象，有可能共享该进程中的权重，但并发调用的线程安全、可变缓存、临时张量和底层执行限制仍需按框架验证；共享一个对象不等于可以无限并行推理。

## 为什么“预加载一次”还不能证明只占一份内存

要分开看磁盘文件、主机内存与设备显存。同一模型文件可能命中文件系统缓存，但这不证明各进程的模型对象、转换后的张量或 GPU 分配都只有一份。

进程启动方式也会改变资源继承。`spawn` 启动新的解释器；在支持 `fork` 的环境中，部分只读主机页可能通过操作系统的写时复制机制暂时共享，修改页面后会发生复制。这不能推出任意 Python 对象始终共享，更不能推出 CUDA 上下文与权重自动安全共享。应记录 Python 版本、平台和实际 start method，不把某一版本的默认值当永久规则。[Python 3.13：进程启动方式](https://docs.python.org/3.13/library/multiprocessing.html#contexts-and-start-methods)

PyTorch 对加速器多进程还有明确约束：CUDA 子进程不能按普通 CPU `fork` 经验初始化，文档要求使用 `spawn` 或 `forkserver`；通过队列传递 CPU 共享张量和共享 CUDA 张量又有不同的生命周期要求。某些 CUDA 共享方案要求发送进程在接收方持有张量期间保持存活。因此，只有经过明确实现和验证的共享协议才算共享，不能从“用了多进程”推断安全性。[PyTorch：多进程与 poison fork](https://docs.pytorch.org/docs/stable/notes/multiprocessing.html)

## 先选驻留结构，再调 Web 并发

一种简单结构是每个 Web worker 自带模型，优点是请求链路直接、故障边界容易理解；代价可能是重复加载、额外显存和启动时间。另一种候选是让 Web worker 只接收和校验请求，经有界队列交给独立模型服务，由它管理权重、设备并发和批处理。两种结构都需要实际测量，没有通用胜者。

下图只展示第二种教学方案。两个 API 进程没有各自加载 GPU 模型，模型服务持有一份示意权重；若再部署一个独立模型服务副本，通常还要另计其资源。队列把接入并发和设备执行并发分开，但会增加排队、序列化、取消传播及故障恢复的责任。

![两个 API worker 经有界队列调用一个模型服务，模型服务管理 GPU 权重与临时内存，Web 并发和设备并发分别受限](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/python-model-serving-workers-residency-v1.png)
*图：Excalidraw 架构示意。箭头表示请求关系，只有模型服务负责此图中的设备模型；队列并不保证显存共享或吞吐提升。*

有界队列需要约定容量、满载行为和请求期限。客户端断开后，排队任务是否撤销，已经开始的推理能否停止，都要单独设计。异步任务与持久化交付的区别见[异步任务队列](../../backend/api/async-job-queue.md)；这里的队列图不表示已经实现可靠消息投递。

## 如何估算和测量内存

权重元素数量乘以每元素字节数，只是权重存储的起点。模型执行还可能需要中间激活、算子工作区、输入输出缓冲、分配器保留空间和设备运行时资源；量化模型还可能有比例因子等附加数据。请求形状、批大小、精度和并发都会改变峰值，不能拿模型文件大小直接当显存预算。

以 PyTorch CUDA 为例，`memory_allocated()` 观察张量占用，`memory_reserved()` 观察缓存分配器管理的空间；驱动层看到的占用还可能包含其他资源。`empty_cache()` 释放未使用的缓存块，不会释放仍被活跃张量持有的权重。多个进程的统计口径也要分别核对，不能把单进程数字直接当整卡峰值。[PyTorch：CUDA 内存管理](https://docs.pytorch.org/docs/stable/notes/cuda.html#memory-management)

可比较单实例冷启动、预热后空闲、单请求峰值及目标并发峰值，并同时记录主机内存、每进程设备占用和整卡占用。测量时固定模型版本、输入分布、精度及批处理配置，避免把换了负载的结果解释成 worker 参数的收益。

## 容器“核数”为什么不足以决定 worker 数

宿主机逻辑 CPU 数、进程可运行的 CPU 集合、容器 CPU 带宽配额是不同限制。Linux cgroup v2 的 `cpu.max` 表示一个周期内可使用的 CPU 时间额度，不是给进程永久绑定若干物理核心；还要看 CPU affinity、配额节流和同机竞争。[Linux：cgroup v2 CPU 控制](https://docs.kernel.org/admin-guide/cgroup-v2.html#cpu)

增加 Python 进程可能让 CPU 工作并行，但每个进程里的原生计算库又可能创建自己的线程池。进程数与内部线程数叠加，会带来过度订阅和上下文切换；CPU 少、设备已饱和或内存不足时，加 worker 反而可能增加排队与尾延迟。传统启用 GIL 的 CPython、释放 GIL 的原生算子和其他运行时配置，也不能用同一条“线程无法并行”概括。[PyTorch：避免 CPU 过度订阅](https://docs.pytorch.org/docs/stable/notes/multiprocessing.html#cpu-in-multiprocessing)

## 怎样测 QPS，才知道改动有没有帮助

先定义成功请求的合同。指定测量窗口内完成且通过正确性检查的请求数除以窗口秒数，得到该口径的成功吞吐；还应分别报告提交、接纳、完成、失败和超时，避免通过丢弃慢请求制造好看的 QPS。流式输出要区分首个结果时间与完整响应时间。

压测至少要冻结模型、硬件、配额、输入大小分布、批处理、冷暖状态和到达方式。记录端到端延迟及其排队、预处理、推理、后处理分段，并观察 p95 等尾部指标、错误率、CPU 节流和内存峰值。GPU 测时还需遵守框架的异步执行与同步规则，不能只测 CPU 提交算子的耗时。[PyTorch：CUDA 异步执行](https://docs.pytorch.org/docs/stable/notes/cuda.html#asynchronous-execution)

调参时先改变一个因素：比较相同负载下的单 worker 与候选配置，再观察并发增加后吞吐是否趋平、队列是否增长以及质量是否改变。如果吞吐不再增加，继续堆接入 worker 可能只是把等待移到更长的队列；应根据目标延迟和资源预算选择并发上限，而不是只追求最高峰值吞吐。

## 回答与排查顺序

先说明框架里的 worker 单位和启动方式，再画进程、线程、模型及 GPU 的归属。随后给出内存测量口径与负载合同，最后用成功吞吐、尾延迟和错误率比较候选结构。缺少这些证据时，可以提出如何验证，但不能断言每个 worker 必占相同显存，也不能从容器核数推导一个必然最优值。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 AI 应用实习面试：模型服务、RAG 与分类评估](../../../interview/kuaishou/ai/kuaishou-ai-15.md)
<!-- interview-source-history:end -->

## 参考资料

- [Flask：Gunicorn 部署与进程参数](https://flask.palletsprojects.com/en/stable/deploying/gunicorn/)
- [Python 3.13：multiprocessing 的启动方式](https://docs.python.org/3.13/library/multiprocessing.html#contexts-and-start-methods)
- [PyTorch：Multiprocessing best practices](https://docs.pytorch.org/docs/stable/notes/multiprocessing.html)
- [PyTorch：CUDA semantics](https://docs.pytorch.org/docs/stable/notes/cuda.html)
- [Linux kernel：cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
