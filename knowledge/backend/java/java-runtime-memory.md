排查 JVM 内存问题，先确定“哪类资源无法再分配”，再找增长来源。Java 堆只是进程内存的一部分；线程栈、类元数据、直接缓冲区和其他本地分配都可能形成压力。把所有 OOM 都当作堆泄漏，会选错证据和修复方法。

## 为什么先划分内存区域

对象生命周期、方法执行与类加载使用不同结构。JVMS 21 定义共享的堆、方法区，以及线程私有的 PC 和 JVM 栈等逻辑区域，具体布局由实现决定。[JVMS §2.5](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)没有规定所有实现必须采用同一种物理分区。

![对象分配由共享堆承载，类加载与执行需要类结构和线程栈；本地资源另有边界，异常应按区域定位](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-runtime-memory-archify-v1.png)

| 区域或资源 | 主要用途 | 定位起点 |
|---|---|---|
| 堆 | 实例、数组的逻辑分配空间 | GC 趋势、存活对象、堆快照引用链 |
| 方法区及运行时常量池 | 类结构、字段与方法信息等 | 类数量、类加载器生命周期、实现的元数据指标 |
| 线程栈 | 调用帧、局部变量与操作数等 | 线程栈、调用深度、线程数量 |
| 本地与直接内存 | VM 内部、直接缓冲区及其他本地分配 | 进程内存与对应分配器指标 |

HotSpot 的元空间是实现类元数据的一种机制，不能把“方法区”这个规范概念与某一实现名称完全等同。堆使用量也不等于 RSS；映射、保留与实际提交内存须分别理解。

## StackOverflowError 与 OutOfMemoryError

递归超过允许栈深度可产生 StackOverflowError；创建线程或扩展栈时无法获得内存也可能产生 OutOfMemoryError。堆无法满足分配、类元数据增长、直接内存或本地线程资源耗尽都要按异常和实现诊断。[JVMS 栈与堆的异常条件](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.2)解释了为什么“OOM 一定来自堆”不成立。

实践中先记录异常完整信息、运行参数和负载，再比较 GC 后存活量、分配速度、线程数量与进程内存。持续增长的存活集合可能是无界缓存或引用未释放，也可能是业务工作集确实变大；需要从引用链验证原因。

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

## 多进程与多线程的边界

多进程可以隔离单进程地址空间与故障，但复制模型、数据和运行时会增加总内存。多线程共享对象，减少复制的同时需要并发控制。对大批处理，限制并发、分批、流式处理或释放引用有时比拆进程更直接；采用哪种方案必须测量峰值与恢复效果。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
<!-- interview-source-history:end -->

## 参考资料

核验于 2026-10-04；规范与工具说明采用 Java 21，HotSpot 细节不代表所有 JVM。

- [JVMS 21：运行时数据区域](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)
- [JVMS 21：加载、链接与初始化](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)
- [Java 21：Native Memory Tracking](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html)
