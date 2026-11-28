SFT 与 LoRA 回答的是不同问题：SFT 决定“拿什么示范、优化什么行为”，LoRA 决定“用哪些可训练参数完成适配”。可以用 LoRA 做 SFT，也可以在其他训练目标中使用低秩适配；它不是 SFT 的替代名称。

## 为什么需要参数高效微调

全量微调会更新大量模型参数，还要为可训练权重维护梯度和优化器状态。若同一个基座服务多个任务，为每个任务保存完整副本也会增加存储与管理成本。参数高效微调（PEFT）尝试只调整一小部分参数，保留可共享的基座。

[Hugging Face 的 LoRA 概念说明](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora)介绍了冻结原权重、训练低秩增量的办法。收益应在目标模型和任务上测量，不能把某次实验的节省比例当作所有模型的保证。

## 一个线性层中发生了什么

设输入为 $x\in\mathbb{R}^{d_{in}}$，原权重为 $W_0\in\mathbb{R}^{d_{out}\times d_{in}}$。LoRA 用两个较小矩阵表达增量：

$$
A\in\mathbb{R}^{r\times d_{in}},\qquad
B\in\mathbb{R}^{d_{out}\times r}
$$

$$
\Delta W=\frac{\alpha}{r}BA,\qquad
y=W_0x+\frac{\alpha}{r}BAx
$$

这里 $r$ 是所选秩，$\alpha/r$ 是经典 LoRA 的缩放形式；具体变体和实现可能采用不同约定。训练时固定 $W_0$，更新 $A$、$B$。低秩限制作用于**权重增量**，不是把基座整个矩阵替换为低秩矩阵。

![输入分别经过冻结的原权重与可训练的A、B低秩分支，再将缩放后的增量与原输出相加](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-lora-peft-low-rank-branch-excalidraw-v1.png)
*图：这是单个线性层的参数结构，不表示完整 Transformer、梯度传播或优化器。*

一个教学计算：若输入与输出维数均为 4096，完整权重有 $4096^2=16,777,216$ 个参数；取 $r=8$，两个增量矩阵共有 $8(4096+4096)=65,536$ 个参数，约为前者的 0.39%。这个比例只比较该层的参数数量，不能推出整机训练显存也缩小相同比例。

## SFT、LoRA、量化与 RAG 怎样区分

| 维度 | 要决定的事情 |
| --- | --- |
| SFT | 示范数据、任务目标、哪些输出参与损失 |
| LoRA | 适配哪些层、训练哪些低秩增量 |
| 量化 | 用什么数值表示与计算方式保存或运行权重等数据 |
| RAG | 运行时怎样取回外部证据并装入上下文 |

例如“用 LoRA 做客服任务的 SFT，同时在运行时检索最新政策”是一组可以组合的选择。它们分别解决不同问题。仅做检索不会更新模型参数，量化也不等同于学会一项新任务。前置概念可参照[训练全流程](./llm-training-overview.md)、[模型量化](./llm-quantization.md)和[RAG 流程](../rag/rag-pipeline.md)。

## QLoRA：量化基座与可训练增量各省什么

普通 LoRA 已减少可训练参数，但仍要保存基座。QLoRA 进一步将冻结基座以 4-bit 表示保存，再训练 LoRA 增量；计算精度与存储精度分开选择。它不是直接把所有参数、激活和梯度都改成 4-bit。[PEFT 量化训练文档](https://huggingface.co/docs/peft/main/en/developer_guides/quantization)说明了这条组合路径。

| 机制 | 主要针对的开销 | 不能据此推出的结论 |
| --- | --- | --- |
| NF4 保存量化基座 | 基座权重；表示设计针对近似正态分布的权重 | 所有中间计算都只用 4-bit |
| 嵌套量化 | 再压缩第一层量化所需的元数据 | 模型又被无条件缩小四倍 |
| LoRA 增量 | 只训练较小的增量参数及其训练状态 | 激活和临时缓冲区不再占显存 |
| Paged optimizer | 用统一内存分页缓解优化器状态的显存压力 | CPU/GPU 换页没有传输代价 |

[Transformers 的 NF4 与嵌套量化说明](https://huggingface.co/docs/transformers/main/quantization/bitsandbytes#qlora)区分了存储格式、计算 dtype 和嵌套量化配置。[bitsandbytes 的分页优化器说明](https://huggingface.co/docs/bitsandbytes/main/en/explanations/optimizers#paged-optimizers)则强调统一内存与换页开销。分页优化器与推理 KV Cache 的 PagedAttention 是两件事。

回答“消费级显卡能省多少”时，先明确比较口径。若只算 8B 个基座参数的理想载荷，16-bit 是 16 GB，4-bit 是 4 GB，减少 75%；这是十进制字节估算，没有包含量化元数据、非量化模块、适配器、激活和临时空间。实际峰值还取决于序列长度、批大小、梯度检查点、目标模块与优化器，不能承诺整次训练固定节省 75%，也不能仅凭显卡容量保证能运行。应在同一任务和质量门槛下比较实测峰值与吞吐。

## 怎样设计一个可比较的适配实验

先固定基座版本、任务与验收集，再比较全量或其他适配基线。LoRA 需要明确目标模块、秩、缩放、训练精度、学习率和数据覆盖；这些是实验变量，不存在对所有任务都合适的一组常数。

从有代表性的高质量数据起步，逐步增加有效样本或 Token，记录目标任务、困难切片和基础能力回归。区分训练、调参验证和最终验收，避免同源变体泄漏。数据更多而标签更差、任务更窄或重复更多，可能导致效果退化。

参数少不意味着无需计算：仍要保存和运行基座，激活、序列长度、批大小、实现方式与优化器也影响训练资源。秩变大提高了增量表达空间，也会增加成本；是否改善泛化要由同条件实验回答。

## 推理时能否合并

对支持合并的线性权重，可以形成 $W'=W_0+\Delta W$，再使用相应权重推理。[PEFT 的 LoRA 指南](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora)说明了合并与适配器管理路径。是否可合并、合并后的数值误差和不同精度的兼容性，仍应核对实际实现并回归验证。

保留独立适配器便于在共享基座上切换任务，但路由、版本、并发和隔离也会增加服务复杂度。不能同时默认“所有适配器都已合并”和“可以无成本任意切换”。

## 常见混淆

- LoRA 的低秩是增量参数化，不是证明目标任务只需要低秩知识。
- 冻结基座并不意味着训练没有激活开销，或反向计算可以全部省略。
- SFT 与 LoRA 可以组合，不能把它们列成二选一的同类方法。
- 学到一个任务不证明事实永久正确，仍需数据治理、保留集和运行时权限约束。

## 练一练

### 高频考点题 1：LoRA 和 SFT 的关系

关于 SFT 和 LoRA，下面哪种说法正确？

- A. 两者可以组合：SFT 定目标，LoRA 定训练哪些参数
- B. LoRA 是 SFT 的另一种叫法
- C. 两者只能二选一，用了 LoRA 就不再算 SFT
- D. LoRA 只能用于推理阶段

**答案：A。** SFT 回答「拿什么数据、优化什么行为」，LoRA 回答「用哪些可训练参数完成适配」。可以用 LoRA 做 SFT，也可以在其他训练目标中用 LoRA。

### 高频考点题 2：算一层的参数量

一个线性层输入、输出维度都是 4096，用秩 $r=8$ 的 LoRA。新增可训练参数大约是多少？

- A. 16,777,216
- B. 32,768
- C. 65,536
- D. 8,192

**答案：C。** 增量由 $A\in\mathbb{R}^{8\times4096}$ 和 $B\in\mathbb{R}^{4096\times8}$ 组成，共 $8\times(4096+4096)=65,536$ 个参数，约为完整权重 16,777,216（A）的 0.39%。这个比例只比参数量，不能推出整机训练显存也同比例下降。

### 高频考点题 3：低秩约束作用在哪里

LoRA 里的「低秩」指的是？

- A. 把基座模型的整个权重矩阵替换成低秩矩阵
- B. 增量 $\Delta W=\frac{\alpha}{r}BA$ 低秩，原权重冻结
- C. 训练数据必须是低维的
- D. 推理时只能使用低精度

**答案：B。** LoRA 冻结 $W_0$，只训练两个小矩阵表达的增量 $\Delta W=\frac{\alpha}{r}BA$，输出是 $W_0x$ 加上增量分支。低秩约束的是增量，不是把基座替换掉，也和数据维度、推理精度无关。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [百度搜索框架 Agent 日常实习一二面：上下文、工程选型与评测](../../../interview/baidu/ai/baidu-ai-14.md)
- [美团大模型应用实习一面：归一化、QLoRA 与推理](../../../interview/meituan/ai/meituan-ai-17.md)
- [蚂蚁数字支付 AI 应用研发二面：数据分层、迁移与微调](../../../interview/antfin/ai/antfin-ai-13.md)
- [淘天 AI 应用研发实习：后端基础、Transformer 与训练](../../../interview/alibaba/ai/alibaba-ai-32.md)
<!-- interview-source-history:end -->

## 参考资料

- [Hugging Face PEFT：LoRA 概念与适配器管理](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora)（滚动文档，核验于 2026-10-31）。


- [Hugging Face PEFT：量化训练](https://huggingface.co/docs/peft/main/en/developer_guides/quantization)
- [Transformers：NF4、计算精度与嵌套量化](https://huggingface.co/docs/transformers/main/quantization/bitsandbytes#qlora)
- [bitsandbytes：Paged optimizers](https://huggingface.co/docs/bitsandbytes/main/en/explanations/optimizers#paged-optimizers)
