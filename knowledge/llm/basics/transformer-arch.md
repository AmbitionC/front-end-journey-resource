Transformer 可以先理解为一种“让序列中的每个位置按需读取其他位置，再逐层改写自身表示”的神经网络架构。它没有依赖 RNN 那样逐步传递隐藏状态，而是把位置间的信息交换交给 Attention，把每个位置内部的非线性变换交给 FFN，并用残差连接把许多层稳定地堆叠起来。

本文的目标不是记住一张结构图，而是建立一条可以用于理解 GPT、Llama 等语言模型的主线：

> Token 如何进入模型 → Self-Attention 如何混合上下文 → FFN 如何变换每个位置 → 多层如何稳定堆叠 → 为什么训练可以并行、生成却仍要逐 Token 进行。

## 为什么需要 Transformer

Transformer 出现前，RNN/LSTM 是处理文本等序列的主流方案。它们按时间步递归更新隐藏状态：第 \(t\) 步依赖第 \(t-1\) 步，因此难以在序列维度充分并行；较远位置的信息还需要经过多次状态传递，优化长距离依赖更困难。

2017 年的论文 [Attention Is All You Need](https://arxiv.org/abs/1706.03762) 提出了完全基于 Attention 的 Encoder-Decoder 架构。Self-Attention 让任意两个位置可以在一层内直接建立联系，训练时也能同时处理整段序列中的多个位置。需要注意：Transformer 缓解了递归结构的顺序瓶颈，但没有“彻底解决”所有长距离依赖问题；标准 Attention 的计算与显存成本会随序列长度快速增长。

## Transformer 不是只有 Decoder-only

“Transformer”描述的是一族架构，而不是某一种固定模型。

| 架构 | Attention 可见范围 | 典型用途 | 代表 |
|---|---|---|---|
| Encoder-only | 通常可读取左右两侧上下文 | 表示学习、分类、检索 | BERT |
| Decoder-only | 只能读取当前位置及之前的位置 | 自回归生成、对话、代码生成 | GPT、Llama |
| Encoder-Decoder | Encoder 编码输入，Decoder 通过 Cross-Attention 读取编码结果 | 翻译、摘要、条件生成 | 原始 Transformer、T5 |

今天许多通用生成式大语言模型采用 Decoder-only，但 Encoder-only 和 Encoder-Decoder 并没有消失。选择哪一种，取决于训练目标和任务需要，而不是某种结构在所有场景下都绝对更好。

## 现代 Decoder-only 模型的整体数据流

下面这张图给出一类常见的现代 Decoder-only 结构。它不是所有模型的唯一实现，但能覆盖理解主流自回归语言模型所需的核心部件。

![现代 Decoder-only Transformer 从 Token Embedding 经过重复的 Pre-Norm Attention 与 SwiGLU FFN，最终输出下一个 Token 概率的结构图](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/transformer-arch-modern-decoder-block.png)

*图：残差旁路绕过 Attention 和 FFN；RoPE 在 Attention 内作用于 Q、K，而不是直接加到 Token Embedding 上。*

完整流程可以压缩成六步：

1. 文本被分词器转换为 Token ID。
2. Embedding 表把每个 ID 映射为 \(d_{\text{model}}\) 维向量。
3. 向量依次通过 \(N\) 个 Decoder Block。
4. 每个 Block 先做 Causal Self-Attention，再做 FFN；两个子层都有归一化与残差连接。
5. 最后一层表示经过 Final Norm 和 LM Head，投影到词表维度。
6. Softmax 将 logits 转为下一个 Token 的概率分布，采样或取最大概率后继续生成。

下面逐层拆开。

## Token Embedding：把离散符号变成连续向量

分词器输出的是整数 ID，神经网络不能从整数编号本身理解语义。Embedding 矩阵 \(E \in \mathbb{R}^{|V| \times d_{\text{model}}}\) 为词表中的每个 Token 保存一个可训练向量：

$$
x_i = E[\text{token}_i]
$$

这里的 \(x_i\) 只是第 \(i\) 个 Token 的初始表示，还没有融合上下文。同一个 Token 在不同句子中取到的初始向量相同；经过多层 Self-Attention 后，它才会变成与当前上下文相关的表示。

## Self-Attention：让每个位置读取上下文

### Q、K、V 到底是什么

对输入矩阵 \(X\)，模型通过三组可训练投影得到：

$$
Q=XW^Q,\qquad K=XW^K,\qquad V=XW^V
$$

可以把它们理解为：

| 向量 | 作用 | 直觉 |
|---|---|---|
| Q（Query） | 表示当前位置正在寻找什么 | 查询条件 |
| K（Key） | 表示每个位置可以如何被匹配 | 索引 |
| V（Value） | 匹配后真正被聚合的信息 | 内容 |

Q 和 K 的点积衡量位置间的匹配程度；Softmax 把得分变成权重；再用权重对 V 求加权和。加入掩码后的缩放点积 Attention 为：

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}\left(
\frac{QK^\top + M}{\sqrt{d_k}}
\right)V
$$

除以 \(\sqrt{d_k}\) 是为了控制点积数值的尺度，避免维度增大后 Softmax 过早进入极端饱和区域。

### Causal Mask：为什么模型不能偷看答案

Decoder-only 模型训练的是“根据前缀预测下一个 Token”。第 \(i\) 个位置只能读取 \(j\le i\) 的位置，因此掩码 \(M\) 通常定义为：

$$
M_{ij}=
\begin{cases}
0,&j\le i\\
-\infty,&j>i
\end{cases}
$$

Softmax 后，上三角被屏蔽位置的权重变为 0。这样，即使训练时整段文本一次送入模型，每个位置也无法看到未来 Token。

![Token 向量投影为 Q、K、V，QK 点积经过因果掩码和 Softmax 后形成下三角注意力权重，再对 V 加权求和](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/transformer-arch-causal-attention.png)

*图：V 不参与 QK 相似度计算，而是在注意力权重确定后被加权聚合。*

### 一个最小的 PyTorch 对照

PyTorch 提供了官方的 scaled dot-product attention 实现。下面的形状约定为 \((B,H,L,D)\)：批次、头数、序列长度、每头维度。

~~~python
import torch
import torch.nn.functional as F

B, H, L, D = 2, 8, 128, 64
q = torch.randn(B, H, L, D)
k = torch.randn(B, H, L, D)
v = torch.randn(B, H, L, D)

output = F.scaled_dot_product_attention(
    q,
    k,
    v,
    is_causal=True,
    dropout_p=0.0,
)

assert output.shape == (B, H, L, D)
~~~

在实际训练中，框架可能根据硬件和输入条件选择普通实现、内存高效实现或 FlashAttention 类内核；数学结果仍然对应同一个 Attention 定义。可参考 [PyTorch scaled_dot_product_attention 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)。

## Multi-Head、MQA 与 GQA

单个 Attention 头只在一个投影子空间中计算关系。Multi-Head Attention（MHA）把模型维度拆成多个头，各头独立计算 Attention，再拼接并投影：

$$
\operatorname{MultiHead}(Q,K,V)
=
\operatorname{Concat}(\text{head}_1,\ldots,\text{head}_h)W^O
$$

“不同头一定分别学习语法、指代、实体”只能作为直觉，不能当成固定分工。头的行为是训练中涌现的，而且可能存在冗余。

自回归推理需要缓存历史 Token 的 K、V。为了减小 KV Cache 和内存带宽压力，工程上还常见：

- **MHA**：每个 Query 头都有独立的 K/V 头，表达能力强，但缓存最大。
- **MQA**：所有 Query 头共享一组 K/V，缓存更小，但可能影响质量。
- **GQA**：若干 Query 头共享一组 K/V，在质量和推理效率之间折中。

[GQA 论文](https://arxiv.org/abs/2305.13245) 报告了 GQA 在接近 MHA 质量的同时获得接近 MQA 的推理速度；具体收益仍取决于模型、硬件、批大小和实现。

## 位置信息：RoPE 为什么放在 Q、K 上

如果没有位置机制，Self-Attention 本身无法仅凭输入顺序区分“猫追狗”和“狗追猫”。原始 Transformer 将正弦位置编码加到输入表示上。许多现代 Decoder-only 模型则使用 RoPE（Rotary Position Embedding）。

RoPE 不是简单地给 Token Embedding 再加一个位置向量。它根据位置对 Attention 中的 Q、K 做旋转，使点积能够表达相对位置信息。[RoFormer 论文](https://arxiv.org/abs/2104.09864) 给出了其形式与性质。

需要避免两个误解：

- **RoPE 不等于无限上下文。** 模型能否可靠处理更长序列，还受训练长度、缩放策略、数据分布和推理实现影响。
- **使用 RoPE 不保证任意长度外推。** YaRN、NTK-aware scaling 等方法是在既有位置机制上继续处理长上下文退化问题。

## FFN：每个位置独立进行非线性变换

Attention 负责位置之间的信息交换；FFN（Feed-Forward Network）则对每个位置使用同一组参数独立变换。原始 Transformer 使用两层线性层和 ReLU：

$$
\operatorname{FFN}(x)=W_2\,\sigma(W_1x+b_1)+b_2
$$

FFN 常先把维度扩张，再压回 \(d_{\text{model}}\)，因此通常占有大量参数。现代模型常使用门控 FFN，例如 SwiGLU：

$$
\operatorname{SwiGLU}(x)
=
W_2\bigl(\operatorname{SiLU}(W_gx)\odot(W_ux)\bigr)
$$

[GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) 展示了多种门控变体在 Transformer FFN 中的效果。把 FFN 简化成“专门存知识”、把 Attention 简化成“只负责路由”都过于绝对；两者共同参与表示计算，参数中信息的分布也比这类口号复杂。

## 残差连接、Pre-Norm 与 RMSNorm

深层网络如果每层都完全改写输入，梯度和信息很难稳定穿过几十甚至上百层。残差连接保留了一条恒等路径：

$$
x' = x + \operatorname{Sublayer}(\operatorname{Norm}(x))
$$

上式是现代模型中常见的 **Pre-Norm**：先归一化，再进入子层，最后与原输入相加。原始 Transformer 论文使用的是 **Post-Norm**：

$$
x' = \operatorname{LayerNorm}(x+\operatorname{Sublayer}(x))
$$

Pre-Norm 往往更容易稳定训练很深的网络，但不能简单理解为在所有设置下都一定优于 Post-Norm。

很多现代语言模型还用 RMSNorm 替代 LayerNorm。RMSNorm 只依据均方根做缩放，不执行减均值操作，计算更简单；其原始研究见 [Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467)。

## 训练为什么能并行，生成为什么仍然串行

这两个阶段经常被混为一谈。

### 训练：序列内多个位置可同时计算

训练时，完整 Token 序列已经存在。Causal Mask 保证每个位置只读取合法前缀，因此模型可以在一次前向计算中同时得到所有位置的预测，再与各自的下一个 Token 标签计算损失。相比 RNN 的逐时间步递归，这提供了更强的序列维度并行能力。

### 推理：Token 之间存在真实的数据依赖

生成第 \(t+1\) 个 Token 前，必须先知道第 \(t\) 个 Token 是什么，所以 Token 与 Token 之间仍然串行。KV Cache 会保存各层历史 Token 的 K、V，避免每一步重新计算整段前缀的 K、V，但它：

- 不能提前知道下一个 Token；
- 仍要让新 Query 读取历史 K/V；
- 会随层数、上下文长度、KV 头数和每头维度占用更多显存。

因此，“Transformer 可以并行”主要描述训练时对已知序列的处理，不代表自回归生成能一次并行产出所有未知 Token。

## 现代 Transformer 相比原始论文变了什么

| 组件 | 2017 原始 Transformer | 现代 Decoder-only 常见选择 |
|---|---|---|
| 主体 | Encoder-Decoder | Decoder-only |
| 归一化位置 | Post-Norm | Pre-Norm |
| 归一化类型 | LayerNorm | RMSNorm 或 LayerNorm |
| 位置机制 | 正弦位置编码 | RoPE 等 |
| Attention 头 | MHA | MHA、GQA 或 MQA |
| FFN 激活 | ReLU | SwiGLU 等门控 FFN |
| Attention 内核 | 直接物化注意力矩阵 | FlashAttention 类 IO-aware 内核 |

例如 [Llama 3 技术报告](https://arxiv.org/abs/2407.21783) 描述了一个现代稠密 Transformer 模型族；它保留了 Attention、FFN、残差堆叠这条主干，同时采用了面向训练与推理效率的现代组件。不同模型会在细节上继续变化，所以理解“数据流和约束”比背某个模型的配置表更重要。

## 复杂度：平方项到底从哪里来

设序列长度为 \(n\)，模型维度为 \(d\)。

- Q/K/V 等线性投影大致包含 \(O(nd^2)\) 计算。
- \(QK^\top\) 和注意力权重乘 V 包含 \(O(n^2d)\) 计算。
- 直接保存 \(n\times n\) 的注意力矩阵会带来 \(O(n^2)\) 中间显存。

所以只说“Transformer 复杂度是 \(O(n^2)\)”并不完整：平方项来自位置两两交互，但在具体模型和长度下，线性投影、FFN、内存带宽等也可能占据大量时间。

[FlashAttention](https://arxiv.org/abs/2205.14135) 通过分块计算和减少 HBM 与片上 SRAM 之间的数据搬运，让**精确 Attention** 更快且更节省中间显存。它没有把标准全量 Attention 的两两交互在数学上变成线性复杂度；它优化的是计算方式和 IO。

## 常见误区

### “Transformer 完全解决了长距离依赖”

它缩短了位置之间的信息路径，也改善了并行性，但长上下文仍受平方成本、位置外推、有效检索能力和训练分布影响。

### “Attention 权重就是模型的完整解释”

Attention 权重能显示某层某头如何加权 V，但最终输出还经过多个头、输出投影、残差、FFN 和后续层。它只是中间信号，不等于完整因果解释。

### “头越多越好”

头数会改变每头维度、KV Cache、并行效率和模型容量。MHA、GQA、MQA 本身就是不同质量—效率权衡，不存在脱离模型规模和硬件的单调结论。

### “RoPE 直接加在 Embedding 上”

原始正弦位置编码通常加到输入表示；RoPE 的关键操作则发生在 Attention 内部，对 Q、K 按位置旋转。

### “FlashAttention 是一种近似 Attention”

标准 FlashAttention 是 IO-aware 的**精确** Attention 算法；它与稀疏或线性近似 Attention 不是一回事。

## 面试自测

1. \(QK^\top\) 为什么产生序列长度的平方项？
2. 为什么 Causal Mask 能让训练同时处理所有位置，却不能让推理一次生成所有 Token？
3. RoPE 为什么作用于 Q、K，而不是 V？
4. MHA、MQA、GQA 对 KV Cache 分别有什么影响？
5. Pre-Norm 与 Post-Norm 的数据流有什么区别？
6. FlashAttention 优化了什么，又没有改变什么？

如果这些问题都能从数据流出发回答，而不是只背一句定义，就已经真正建立了 Transformer 的核心心智模型。

## 小结

一个现代 Decoder-only Transformer Block 可以概括为：

1. 对输入做归一化；
2. 用带 RoPE 和 Causal Mask 的 Self-Attention 聚合历史上下文；
3. 通过残差连接保留原信息；
4. 再归一化并经过 SwiGLU 等 FFN；
5. 再做一次残差相加；
6. 重复多层后，经 LM Head 预测下一个 Token。

Attention 负责“从哪里读取信息”，FFN 负责“如何变换当前位置的表示”，位置机制告诉模型“信息出现在哪里”，残差与归一化则让这套结构可以稳定堆深。训练时已知整段序列，因此多个位置可并行；推理时下一个 Token 尚未知，因此生成仍然逐步进行。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
- [GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245)
- [GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202)
- [Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467)
- [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)
- [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
- [PyTorch scaled_dot_product_attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)
