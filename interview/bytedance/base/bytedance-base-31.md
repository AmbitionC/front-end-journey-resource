字节跳动 · Agent 后端方向 · 一面。面试经历为候选人自述，未独立证实；这里只归纳明确记录的字节问题，未公开的项目细节和算法题面不补造。

<details data-knowledge-key="os-process-thread">
<summary>（1）进程与线程有什么区别？</summary>
</details>

进程提供资源与地址空间的隔离范围，线程是其中的执行单元；同一进程的线程共享多数资源，但各自有栈和执行状态。线程协作需要同步共享数据，进程通信通常经过 IPC。具体创建、切换与内存代价取决于操作系统和工作负载。

<details data-knowledge-key="transformer-arch">
<summary>（2）Transformer 的核心机制是什么？</summary>
</details>

输入先变成向量，注意力让每个位置结合相关上下文，前馈网络变换特征，再通过残差和归一化堆叠层。位置编码提供顺序信息，自回归解码器使用因果掩码限制可见范围；训练的并行计算与自回归生成的逐步依赖要分开解释。 [Attention Is All You Need：模型结构](https://arxiv.org/html/1706.03762v7)。

<details data-knowledge-key="llm-training-overview">
<summary>（3）怎样区分过拟合与欠拟合？</summary>
</details>

欠拟合常表现为训练与验证都未学好，过拟合常表现为训练表现好而未见数据变差。先排查数据切分、指标和泄漏，再选择容量、正则、数据或训练策略；保留未参与调优的数据，不能用反复看过的测试集证明泛化。 [Google Machine Learning：过拟合与欠拟合](https://developers.google.com/machine-learning/crash-course/overfitting/overfitting)。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [Attention Is All You Need：模型结构](https://arxiv.org/html/1706.03762v7)（论文 v7）
- [Google Machine Learning：过拟合与欠拟合](https://developers.google.com/machine-learning/crash-course/overfitting/overfitting)（滚动课程）
