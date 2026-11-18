排查 JVM 内存问题，先确定“哪类资源无法再分配”，再找增长来源。Java 堆只是进程内存的一部分；线程栈、类元数据、直接缓冲区和其他本地分配都可能形成压力。把所有 OOM 都当作堆泄漏，会选错证据和修复方法。

## 为什么先划分内存区域

面试里“JVM 内存模型有哪些区域”容易混用两个概念。**运行时数据区**回答线程执行、对象和类结构由哪些逻辑区域承载；**Java 内存模型（JMM）**约束执行中一次读取可以观察到哪次写入，以及同步与执行顺序等规则。前者不是堆栈名称版的 JMM；共享堆的两个线程怎样正确发布和读取对象，应另按 [JLS §17.4 的内存模型](https://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.4)讨论。

“主内存与工作内存”可作为解释线程共享变量与执行视图的教学抽象，但不能把工作内存直接等同于 JVM 栈或 CPU 的某级缓存。JMM 的核心问题是：哪些动作建立 happens-before，以及一次读允许观察哪次写。JLS 21 规定同一 volatile 字段的写与同步顺序中后续读建立 synchronizes-with，monitor 的解锁与后续加锁也有相应关系；这不是承诺“每个普通变量都立即刷新到所有线程”。[JLS 21 §17.4](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4)给出的是可观察行为约束。

因此，问“内存模型具体实现在哪里”时，先澄清是 JMM 还是运行时区域。JMM 由编译器与 JVM 在目标硬件上共同落实：优化、代码生成及必要的同步机制必须使执行符合规范允许的行为；不能把某条内存屏障指令、CPU 缓存一致性或某块物理内存单独称为整个 JMM 的实现。具体指令依 JVM、架构和版本核对，JLS 不规定唯一执行策略。volatile 也不会使 count++ 等复合操作原子；相关并发边界见[锁、信号量与并发同步](../../cs/os/os-thread-sync.md)。

对象生命周期、方法执行与类加载使用不同结构。JVMS 21 定义共享的堆、方法区，以及线程私有的 PC 和 JVM 栈等逻辑区域，具体布局由实现决定。[JVMS §2.5](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)没有规定所有实现必须采用同一种物理分区。

![对象分配由共享堆承载，类加载与执行需要类结构和线程栈；本地资源另有边界，异常应按区域定位](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-runtime-memory-archify-v1.png)

| 区域或资源 | 主要用途 | 定位起点 |
|---|---|---|
| 堆 | 实例、数组的逻辑分配空间 | GC 趋势、存活对象、堆快照引用链 |
| 方法区及运行时常量池 | 类结构、字段与方法信息等 | 类数量、类加载器生命周期、实现的元数据指标 |
| 程序计数器（PC） | 每线程当前执行的 JVM 指令位置；执行 native 方法时其值未定义 | 执行位置的规范概念，不当作对象分配区 |
| 线程栈 | 调用帧、局部变量与操作数等 | 线程栈、调用深度、线程数量 |
| 本地方法栈（实现可选） | 支持 native 方法或解释器内部的本地调用 | 按具体 JVM、线程与本地调用链取证 |
| 本地与直接内存 | VM 内部、直接缓冲区及其他本地分配 | 进程内存与对应分配器指标 |

[JVMS 8 §2.5.1](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-2.html#jvms-2.5.1)说明每个线程有自己的 PC；[§2.5.6](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-2.html#jvms-2.5.6)允许实现按需提供本地方法栈，提供时通常按线程分配，不能要求所有 JVM 都有独立的某种物理“本地栈”。运行时常量池属于方法区的逻辑组成；直接缓冲区等进程资源则应与规范列出的运行时数据区区分，不能因为也占内存就新增为统一的规范区域。

HotSpot 的元空间是实现类元数据的一种机制，不能把“方法区”这个规范概念与某一实现名称完全等同。堆使用量也不等于 RSS；映射、保留与实际提交内存须分别理解。

## JDK 8 到元空间：改的是实现，不是全部共享区

“共享区在 JDK 8 之后变成元空间”混合了规范区域和 HotSpot 实现。准确说法是：JDK 8 的 HotSpot 移除了永久代，把类元数据改在本地内存中分配；Java 堆仍然存在，方法区这个规范概念也没有消失。[JEP 122](https://openjdk.org/jeps/122)的目标是移除永久代及其容量调优需求，而非让所有共享数据搬进元空间；它明确把减少类元数据内存列为非目标。

这项变化减少了依赖 `MaxPermSize` 预估类元数据容量的负担，但没有让内存无限。类加载器持续存活、动态生成类不断增长，仍会占用本地资源并可能导致分配失败。定位时应分别观察类/类加载器数、元数据占用、堆和进程内存，不能仅靠“已经换成元空间”排除泄漏。

## 为什么规范区分 JVM 栈和本地方法栈

JVM 栈保存方法调用帧、局部变量与中间计算结果；本地方法栈支持非 Java 语言编写的 native 方法，也可支持用 C 等语言实现的解释器。[JVMS 17 §2.5.2 与 §2.5.6](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-2.html#jvms-2.5.6)描述的是不同执行需求，并不强制所有 JVM 都实现两个彼此独立的物理栈；不需要相关机制的实现可以不提供本地方法栈。

因此，回答“Java 中会用到 C/C++ 吗”时，可以说明 Java 方法能通过本地接口调用非 Java 实现，但不能推断每个 Java 方法都会转成 C/C++ 后再执行。线程私有的是它的执行状态；局部变量里保存一个共享对象的引用，也不会使该对象变成线程私有。

## 有 GC 为什么仍会泄漏

[JLS 17 的可达性规则](https://docs.oracle.com/javase/specs/jls/se17/html/jls-12.html#jls-12.6.1)从线程后续计算能否访问对象解释可达性；GC 不能替应用判断一个仍被持有的对象是否还有业务用途。例如静态 Map 持续加入请求记录且从不删除，旧记录即使已无用途，也仍被长期存活对象引用；线程池中的 ThreadLocal 值、未注销的监听器或缓存条目也应按实际引用链检查。这些是需要取证的候选模式，不是看见 Map 或 ThreadLocal 就能判定泄漏；ThreadLocal 的具体边界见[线程局部变量与清理](java-thread-local.md)。

同样要区分 Java 对象保留和未释放的文件句柄、连接、native 分配等资源。排查时先证明持续增长及持有者，再修生命周期、容量或释放协议；不能用一次 OOM 或一次堆快照直接断言泄漏。

## 先固定运行版本，再讨论为什么选 JDK 17

运行时问题应先记录 JDK 发行版、版本、VM 参数和依赖。解释“为什么使用 17”时，应说清项目所需能力、框架与工具兼容性、运行环境和升级验证；版本号本身不是性能结论，也不能代替项目选型证据。[Oracle 的 JDK 17 迁移指南](https://docs.oracle.com/en/java/javase/17/migrate/preparing-migration.html)要求检查第三方库、过时 VM 参数和程序行为，能启动并不意味着迁移验证已经完成。该指南中的“最新版本”指其 Java 17 文档语境，不能据此把 17 称为当前最新 JDK。

## StackOverflowError 与 OutOfMemoryError

递归超过允许栈深度可产生 StackOverflowError；创建线程或扩展栈时无法获得内存也可能产生 OutOfMemoryError。堆无法满足分配、类元数据增长、直接内存或本地线程资源耗尽都要按异常和实现诊断。[JVMS 栈与堆的异常条件](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.2)解释了为什么“OOM 一定来自堆”不成立。

实践中先记录异常完整信息、运行参数和负载，再比较 GC 后存活量、分配速度、线程数量与进程内存。持续增长的存活集合可能是无界缓存或引用未释放，也可能是业务工作集确实变大；需要从引用链验证原因。

## “栈占用 90%”先核对口径，再定位溢出

“生产环境栈占用 90% 以上”没有统一的健康含义。先问监控项名称、分子分母、采样窗口，以及它表示单线程栈、全部线程栈的预留或提交资源，还是被误称为栈的堆/进程内存。线程栈的保留容量、实际提交和当前调用深度是不同观察，不能从一个未定义的百分比直接判定泄漏、递归或参数过小；题目也没有足够证据证明“90% 是常态”。

若确实出现 `StackOverflowError`，从完整异常栈和可复现请求开始，检查重复调用帧、互相递归、递归终止条件与意外的深层调用。必要时在适当时间采集线程栈，比较正常与异常请求的调用路径。以 JDK 21 为例，`jcmd <pid> Thread.print` 可打印线程与栈，文档将其影响标为中等并提示取决于线程数量；先用目标 JVM 的 `jcmd <pid> help` 核对支持情况。它并不直接给出“每个线程已用栈字节的百分比”，异常已经退栈后也可能捕捉不到故障现场。[JDK 21 jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)

修复优先对应已证实的原因：错误递归修终止条件，合法但过深的递归可评估改迭代或限制输入深度；同时核对线程数、实际栈配置和进程资源预算。`-Xss` 设置线程栈容量，实际大小与平台及对齐要求有关；对已确认的合理深度不足，可以在压测和容量核算后调整，但增加容量不能终止无界递归。更多线程叠加更大的每线程容量，也须重新评估本地内存预算，不能把调大栈当成无成本修复。[JDK 21 java 的 `-Xss`](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html#extra-options-for-java)

若实际异常是 `OutOfMemoryError` 或堆持续增长，应回到对应资源区域取证，而非沿用“栈溢出”的诊断路径。GC 回收堆对象不能修复失控的调用深度；线程栈中保存堆对象引用，也不等于那些对象都分配在栈内。

## 类文件怎样进入运行时

加载创建类的运行时表示；链接包括验证、准备和解析，随后在规范规定的触发条件下初始化。解析可以采用允许的不同时间策略，初始化也不是每次创建对象都重新执行。[JVMS §5](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)是这些步骤的规范来源。

可沿“类加载器持有类 → 类关联元数据与静态状态 → 是否仍有可达引用”排查动态加载场景。不停生成或加载新类、保留旧加载器，都可能阻止对应资源释放；仅观察普通业务对象不足以定位。

## 从证据选择工具

堆快照适合检查对象数量和保留链；线程快照适合分析递归、阻塞与线程数量。HotSpot NMT 可以在启动时开启，结合 `jcmd` 查看 VM 内部本地内存类别与基线差异；它不能覆盖所有第三方或应用本地分配，不能把 NMT 总数直接等同进程全部内存。[Java 21 NMT 文档](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html)明确说明了覆盖范围。

下列命令为未在本环境运行的诊断示意；采集前须确认目标进程、影响与数据存储范围：

```text
启动参数：-XX:NativeMemoryTracking=summary
jcmd <pid> VM.native_memory baseline
jcmd <pid> VM.native_memory summary.diff
```

堆快照可能含用户数据，应控制采集与保存范围。先定位持续持有者或过高并发，再考虑调整容量；增大堆可能暂缓症状，也可能挤压其他本地资源。

## 查 GC：区分累计统计、事件和保留对象

“怎么查 GC”应先说清观察目标：回收频率和累计耗时、某次暂停的原因，还是 GC 后仍存活的对象。它们需要不同证据；一次堆占用高也可能只是正常的回收前峰值，不直接等于泄漏。先固定 JDK、收集器、VM 参数与业务时间线，再选择相应工具。

以下仅是 **JDK 21 文档对应的诊断示意**，未在本环境连接业务 JVM 执行：

```text
jcmd <pid> help
jcmd <pid> VM.version
jcmd <pid> GC.heap_info
jstat -gcutil -t <pid> 1000 10
```

`jcmd ... help` 用于核对目标 JVM 实际支持的命令；GC.heap_info 提供堆概况。`jstat -gcutil` 可周期查看容量利用率与回收计数、累计耗时，`-t` 增加采样时间。比较一段时间内计数和耗时的增量，而不是把进程启动后的累计 GCT 说成刚才一次暂停。列的含义和适用性需要结合收集器、JDK 版本核对；jstat 文档还明确提醒输出格式可能变化，不应把其文本列当稳定监控协议。[JDK 21 jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)与[jstat](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstat.html)分别说明这些边界。

若要回答“哪一次回收造成请求变慢”，需要与请求时间线对齐的 GC 事件证据，例如已配置的 GC 日志或相应 JFR 事件；累计统计本身给不出每次暂停的完整细节。若怀疑对象持续保留，再按影响评估选择直方图或堆快照，并分析引用链；不能从类的实例数排名直接推断根因。

诊断命令也会改变或干扰目标。jcmd 的 GC.class_histogram、GC.heap_dump 被文档标为高影响；默认堆转储还会请求 Full GC，除非使用其 -all 选项。GC.run 则调用 System.gc()，不是被动“查看 GC”的命令。先使用已有指标、日志和适当采样，再按需要采集高影响证据；不要为了观察一次回收就直接触发它。输出可能包含业务数据，沿前述堆快照的保存边界处理。

## 多进程与多线程的边界

多进程可以隔离单进程地址空间与故障，但复制模型、数据和运行时会增加总内存。多线程共享对象，减少复制的同时需要并发控制。对大批处理，限制并发、分批、流式处理或释放引用有时比拆进程更直接；采用哪种方案必须测量峰值与恢复效果。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯云智二面：Spring、Java 内存模型与 IO 多路复用](../../../interview/tencent/ai/tencent-ai-32.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [字节后端与 Agent 开发三面：领域建模、项目评测与基础](../../../interview/bytedance/base/bytedance-base-80.md)
- [字节后端实习一面：Agent 取舍、线程池与索引](../../../interview/bytedance/base/bytedance-base-78.md)
- [阿里国际 AI 应用研发一面：JDK 8、消息可靠性与 RAG](../../../interview/alibaba/ai/alibaba-ai-25.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
- [腾讯后台开发暑期一面：Java 内存、并发与检索](../../../interview/tencent/ai/tencent-ai-31.md)
- [58同城 Agent 开发一面：MCP、数据查询与后端基础](../../../interview/58tongcheng/ai/58tongcheng-ai-1.md)
- [快手商业化 Java 实习一二面：缓存、JVM 与 AI Coding](../../../interview/kuaishou/ai/kuaishou-ai-25.md)
<!-- interview-source-history:end -->

## 参考资料

原有区域与诊断说明采用 Java 21；程序计数器、本地方法栈、可达性及 JMM 的补充分别按下列 Java 8/17 规范核对。永久代迁移依据 JEP 122，运行版本检查依据 JDK 17 迁移指南；HotSpot 细节不代表所有 JVM。

- [JVMS 21：运行时数据区域](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)
- [JVMS 8：程序计数器与本地方法栈](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-2.html#jvms-2.5)
- [JLS 8：Java 内存模型](https://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.4)
- [JLS 21：共享内存、同步关系与允许行为](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4)（JMM 实现层次增补于2026-11-15核验）
- [JVMS 21：加载、链接与初始化](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)
- [JLS 17：对象可达性与类卸载条件](https://docs.oracle.com/javase/specs/jls/se17/html/jls-12.html#jls-12.6.1)
- [JEP 122：移除永久代的目标与实现范围](https://openjdk.org/jeps/122)
- [JVMS 17：JVM 栈与本地方法栈](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-2.html#jvms-2.5.6)
- [Oracle JDK 17：迁移前验证](https://docs.oracle.com/en/java/javase/17/migrate/preparing-migration.html)
- [Java 21：Native Memory Tracking](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html)
- [JDK 21：jcmd 命令、GC 概况和诊断影响](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)（GC 观测增补于2026-11-15核验）
- [JDK 21：jstat 采样、累计统计与格式边界](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstat.html)
- [JDK 21：java 命令的线程栈容量选项 `-Xss`](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html#extra-options-for-java)
