混合专家模型（Mixture of Experts，MoE）把 Transformer 中部分稠密前馈网络替换为多个“专家”，再由路由器为每个 token 选择少数专家。它的目标是扩大总参数容量，同时避免每个 token 都计算全部参数。

## 从稠密 FFN 到稀疏专家

在稠密 Transformer 中，每层的每个 token 都经过同一套 FFN。MoE 层包含 $E$ 个专家 $f_1,\ldots,f_E$，路由器输出分数并选择 top-$k$ 专家：

$$
y=\sum_{i\in\operatorname{TopK}(g(x))}p_i(x)f_i(x)
$$

如果共有 64 个专家而每个 token 只激活 2 个，模型可以拥有很大的总参数量，但单 token 只使用其中一部分。这里要区分：

- **总参数（total parameters）**：保存所有专家所需的容量；
- **激活参数（active parameters）**：一次 token 前向实际参与计算的参数；
- **计算量**：还包含注意力、路由、通信和其他稠密层，不能只用 active/total 比例推导。

## token 如何被路由

![MoE 路由器把不同 token 分配到少数专家并合并输出](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-moe-routing-experts-v1.webp)
*图：路由器按 token 计算门控分数，选择少数专家并加权合并；负载均衡与跨设备通信决定实际效率。*

路由器通常是一个小型线性层。对每个 token 计算专家 logits，softmax 后选 top-1 或 top-2。专家并非由人手工规定“数学专家”“代码专家”；即使分析中能观察到某些分工，它们也可能按语法、位置、语言或更抽象模式专业化。

[Switch Transformer](https://jmlr.org/papers/v23/21-0998.html) 使用简化的 top-1 路由来降低通信与实现复杂度，并通过辅助损失鼓励 token 更均匀地分配给专家。top-1 计算少，top-2 通常有更多冗余和表达能力，选择取决于质量与系统预算。

## 负载均衡为何关键

如果大多数 token 都涌向少数专家，会出现三个问题：热门专家超出容量、其他专家学不到数据、设备等待最慢分片。

训练系统通常设置每个专家的 capacity，并加入 load-balancing loss。容量不足时可以丢弃、重路由或填充 token；每种策略都会影响质量和吞吐。辅助损失过强又可能迫使路由平均化，牺牲有价值的专业分工。

路由还可能在训练早期不稳定。噪声、路由器精度、初始化和 batch 构成都可能造成 expert collapse，因此需要同时观察每个专家的 token 数、丢弃率、路由熵和分域质量。

## MoE 的系统成本

专家通常分布在不同 GPU 上，token 先按路由结果做 all-to-all 通信，再把专家输出传回原设备。于是 MoE 的瓶颈可能从矩阵乘法转为网络带宽、负载不均和小批量 kernel 效率。

此外，总权重仍需存储或分片。即使每个 token 只激活少数专家，单机部署也未必能放下全部模型；低 batch 推理还可能无法充分摊薄路由与通信开销。因此“同 active 参数的 MoE 与稠密模型成本一样”通常不成立。

## 常见架构变化

[DeepSeekMoE](https://arxiv.org/abs/2401.06066) 将专家切分得更细，并引入始终激活的 shared experts，让通用知识与路由专家承担不同角色。[Mixtral 8x7B](https://arxiv.org/abs/2401.04088) 在每个 token 上选择 8 个 FFN 专家中的 2 个，展示了开放权重稀疏模型在多任务和长上下文上的实践。

这些数字不能直接横向比较：专家大小、共享参数、注意力层、激活数、训练 token 和推理实现都不同。选型时应比较目标任务质量、首 token 延迟、每 token 延迟、吞吐、显存和集群拓扑，而不是只比总参数。

## 怎样评估一个 MoE 系统

- **能力**：与相同推理预算的稠密基线比较，而非只与相同总参数比较；
- **路由健康**：专家负载、capacity overflow、token drop、路由稳定性；
- **性能**：不同 batch/序列长度下的计算、all-to-all 时间和设备利用率；
- **稳健性**：多语言、领域迁移和极端输入是否挤占同一专家；
- **部署**：权重分片、故障恢复、量化和专家并行是否受运行时支持。

## 常见误区

- **每个专家都有可读职业标签**：专家分工由优化产生，往往是分布式和难解释的。
- **总参数越大，每次推理越贵**：MoE 的优势正是稀疏激活，但存储和通信仍受总规模影响。
- **active 参数相同就性能相同**：注意力、路由、内核和网络拓扑都会改变成本。
- **负载越平均越好**：均衡是系统约束，不应压过任务所需的专业化。
- **MoE 自动优于稠密模型**：训练数据、基础架构和部署规模不足时，复杂度可能不划算。

## 小结

MoE 用路由器为每个 token 激活少数专家，把“模型容量”与“单 token 计算”部分解耦。真正的工程难点在负载均衡、容量管理、跨设备通信和评估口径。理解 total 与 active 参数的区别，是正确解读 MoE 能力和成本的第一步。

## 参考资料

- [Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://jmlr.org/papers/v23/21-0998.html)
- [DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066)
- [Mixtral of Experts](https://arxiv.org/abs/2401.04088)
