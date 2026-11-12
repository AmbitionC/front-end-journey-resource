流式读取意味着逐步消费输入，分块意味着把一次处理的工作集限制在可管理范围。学习目标是沿输入、转换、在途任务与输出解释内存上界，避免只替换读取接口，却把全部结果、任务或缓存继续保存在内存中。

## 内存峰值来自整条链路

一个批处理的峰值可以从读取缓冲、当前块、转换临时对象、在途任务和待写结果逐项估算。按条数限块不一定足够：单条记录也可能很大，因此还应有字节与记录大小边界。格式解析器可能需要缓冲完整对象，压缩文件与跨块聚合也会改变工作集，必须核对实际格式与实现。

![读取一个有界块后进行受限并发转换，结果进入有界写出队列；下游变慢时背压上游，落盘成功才推进检查点](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/bounded-data-processing-backpressure-v1.png)

## 先限制在途，再讨论并发

以生成器逐块读取后，如果立即把所有块提交给执行器，并保存全部 Future，仍可能累积整批输入与输出。应该限制提交窗口与结果缓冲，让下游消费速度约束上游。Python 3.14 的 [Executor.map](https://docs.python.org/3.14/library/concurrent.futures.html#concurrent.futures.Executor.map)增加 `buffersize` 控制尚未产出的提交量；旧版本需用显式有界队列或任务窗口，不能直接复制新参数。

先解决内存峰值再增加并发，通常是为了避免每个工作单元的工作集相乘；但这只是设计理由，是否符合某个项目必须由内存曲线和负载证明。对于启用 GIL 的常规 CPython，CPU 密集的 Python 代码可考虑多进程；I/O 等待或释放 GIL 的原生计算另论，多进程还增加序列化和复制成本。[Python threading 文档](https://docs.python.org/3/library/threading.html#gil-and-performance-considerations)明确说明 GIL 与可选 free-threaded 构建的边界。

## 切块后怎样保证正确

块边界不应改变业务结果。需要全局排序、去重或跨块聚合时，必须保存足够状态、使用外部存储或采用能够合并的局部结果；不能把“每块分别正确”推成全局正确。写出采用稳定批次/操作 ID，并在输出被确认后推进检查点；重启时重放范围与幂等合同一致。

## 怎样证明优化有效

在相同输入、格式、机器、并发与结果校验下，测峰值 RSS、阶段耗时、吞吐、队列深度和失败率。再逐个改变块大小、并发度与写出批次，检查 CPU、磁盘、网络或目标存储哪个先饱和。耗时下降可能来自缓存、跳过数据或降低质量，需同时比对完整输出；不能从一个“12 小时到 2 小时”的叙述反推实际算法与因果。

## 检查理解

如果逐行读取，却把每行结果追加进一个列表，内存是否仍有界？不会随处理结束自动有界，结果列表仍随输入增长。如果结果队列无界，读取快于写出时又会怎样？积压把工作集重新推高。只有整条链路的读取、计算、队列与写出都受约束，才形成可解释的容量上界。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
<!-- interview-source-history:end -->

## 参考资料

- [Python 3.14：concurrent.futures Executor.map](https://docs.python.org/3.14/library/concurrent.futures.html#concurrent.futures.Executor.map)
- [Python：GIL and performance considerations](https://docs.python.org/3/library/threading.html#gil-and-performance-considerations)
