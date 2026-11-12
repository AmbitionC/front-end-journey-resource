分布式训练先问“把什么拆开”。数据并行拆样本，张量并行拆层内计算，流水线并行拆模型阶段。学习目标是沿参数归属、输入与通信解释三者，再依据显存和互联选择组合，而不把“用了多张卡”当作一种固定算法。

## 先分清训练需要保存什么

训练不仅保存参数，还需要梯度、优化器状态与激活；不同精度、优化器和实现的占用不同。模型参数放得下，不证明目标批次和序列长度的训练过程也放得下。先量各类状态与峰值，再决定扩吞吐还是降低单设备占用。[PyTorch 分布式概览](https://docs.pytorch.org/tutorials/beginner/dist_overview.html)分别介绍复制与分片训练原语。

![数据并行的设备各持完整模型处理不同样本，张量并行拆分同一层的矩阵，流水线并行按阶段传递微批次激活](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/distributed-training-parallelism-splits-v1.png)

## 数据并行：同一模型处理不同样本

经典复制式数据并行让每个工作进程保存模型副本，处理不同样本并计算局部梯度，在优化器更新前同步梯度。它主要扩大样本吞吐；单份模型及训练状态本来放不下时，单纯复制不能解决。梯度累积、有效批次与学习率要按训练合同一起检查，不能只把卡数乘上去。

FSDP/ZeRO 类分片还会改变参数、梯度或优化器状态的归属，不能把所有“数据并行”都说成每卡始终持有完整状态；比较时明确所指是复制式 DDP 还是分片方案。

## 张量并行：把同一层拆给多设备

矩阵乘法可以按行或列切分权重与中间值，多设备合作完成同一层，再按切分布局进行必要的通信。[PyTorch 张量并行教程](https://docs.pytorch.org/tutorials/intermediate/TP_tutorial.html)用线性层的行列分片展示布局如何决定通信；不是把任意矩阵切成几块就可省略结果合并。

张量并行能降低部分单设备参数与计算负担，但细粒度通信可能处在关键路径，互联带宽和延迟尤其重要。具体哪种 all-reduce/all-gather 取决于布局与算法，不能把一个集体通信名称当成所有张量并行层的必选步骤。

## 流水线并行：把模型分成阶段

不同设备拥有不同层或子模块，微批次依次跨阶段传递激活，反向传播传回相应梯度。[PyTorch 流水线教程](https://docs.pytorch.org/tutorials/intermediate/pipelining_tutorial.html)同时区分模型切分与微批次调度。

只运行一个微批次时，其他阶段可能等待；多个微批次交错推进能增加利用率，但启动、排空与阶段耗时不均仍会形成气泡。更多微批次不是免费收益，还涉及激活驻留、调度、通信和全局批次语义。

## 用同一张比较表做选型

| 方式 | 主要切分维度 | 主要通信/等待 | 优先核验 |
| --- | --- | --- | --- |
| 复制式数据并行 | 不同训练样本 | 梯度同步 | 模型状态是否单卡可容纳，有效批次是否合适 |
| 张量并行 | 层内张量与算子 | 层内或层间布局交换 | 互联和算子粒度是否支撑通信成本 |
| 流水线并行 | 层/阶段 | 激活、梯度与气泡 | 切分是否均衡，微批次调度是否正确 |

三者可以组合，组合后各并行组的含义与通信范围必须明确。测量相同模型、序列、批次、精度与硬件下的有效吞吐、峰值内存、通信时间和收敛，不给脱离任务的通用最优方案。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
<!-- interview-source-history:end -->

## 参考资料

- [PyTorch：Distributed Overview](https://docs.pytorch.org/tutorials/beginner/dist_overview.html)
- [PyTorch：Tensor Parallelism](https://docs.pytorch.org/tutorials/intermediate/TP_tutorial.html)
- [PyTorch：Pipeline Parallelism](https://docs.pytorch.org/tutorials/intermediate/pipelining_tutorial.html)
