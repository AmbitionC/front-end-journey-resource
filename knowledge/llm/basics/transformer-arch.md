「讲一下 Transformer 的结构」几乎是大模型岗的开场题，站内 11 场面经问到过，追问常落在：为什么除以 \(\sqrt{d_k}\)、为什么训练能并行而生成不能、GQA 省的是什么。

> **30 秒答法**：Transformer 是一摞结构相同的层，每层两步：Self-Attention 让每个位置按相关度去读其他位置的信息，FFN 再对每个位置单独做非线性变换；两步外面都套残差和归一化，这样才能稳定堆几十层。GPT、Llama 这类生成模型只用 Decoder，靠因果掩码只看左边；Llama 等现代开源模型多用 RoPE 给 Q、K 加位置信息，用 GQA 让多个头共享 K、V 来省显存。训练时整段序列已知，多个位置可以并行算；生成时下一个 Token 还不知道，只能逐个生成，所以推理要靠 KV Cache 省掉重复计算。

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

![现代 Decoder-only 模型：Token ID 经 Embedding、N 个 Decoder Block、Final RMSNorm 和 LM Head 输出下一个 token 的概率；每个 Block 先 RMSNorm 后做因果自注意力和 SwiGLU FFN，两处都有残差旁路](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/transformer-arch-decoder-block-v1.dark.png)

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

![Token 向量投影为 Q、K、V；Q 与 K 打分后经过因果掩码和 Softmax 得到下三角注意力权重，再对 V 加权求和得到每个位置的新表示](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/transformer-arch-causal-attention-anim.dark.png)

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

### 从下一个 Token 到结束：EOS 也是预测目标

对常见自回归文本生成，模型根据当前前缀计算词表上的 logits；解码器按配置取最大概率项，或从调整后的分布采样。选出的 Token 追加到前缀，再预测下一步。Temperature、Top-P 等控制的是选择过程，详见[推理参数](./llm-inference-params.md)，并不是模型一次先写好整段答案再逐字显示。

EOS（End of Sequence）是约定的特殊 Token ID。在以 EOS 标记结束边界、并把该位置纳入训练目标的数据中，模型也学习在适当的前缀后预测这个 ID；推理时它和普通 Token 一样得到分数，经解码选出后，由生成循环识别并停止。对话模型的结束标记还须与聊天模板、生成配置一致，不能把所有模型的序列结束、消息结束和轮次结束当作同一种标记。[TRL 的指令微调说明](https://huggingface.co/docs/trl/sft_trainer#instruction-tuning-example)强调了 EOS 与聊天模板对齐的必要性。

**停止输出不一定意味着生成了 EOS。** 达到最大生成长度、命中停止字符串或触发其他停止条件，也可能结束生成；例如 [Transformers GenerationConfig](https://huggingface.co/docs/transformers/main/en/main_classes/text_generation)分别提供 `eos_token_id`、`max_new_tokens` 和 `stop_strings`。判断答案是否自然完成，要结合具体配置和服务返回的结束原因，不能只凭文本最后有句号。

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

## 练一练

### 高频考点题 1：注意力为什么要缩放

缩放点积注意力里，$QK^\top$ 要除以 $\sqrt{d_k}$。主要原因是？

- A. 减少参数量
- B. 让注意力只看前面的 token，实现因果约束
- C. 控制点积尺度，避免 Softmax 过早饱和
- D. 把注意力变成线性复杂度

**答案：C。** 维度越大，点积的方差越大，Softmax 会趋向 one-hot，梯度很小。只看前文靠的是 Causal Mask（B），缩放不改变复杂度（D）。

### 高频考点题 2：训练并行、生成串行

Transformer 训练时能并行处理整段序列，但生成时还是一个 token 一个 token 出。原因是？

- A. 生成时没有 Causal Mask，所以必须逐个生成
- B. 训练时序列已知，生成时下一个 token 依赖上一个
- C. 生成时模型参数会变化
- D. 训练时不用 Attention

**答案：B。** 训练时所有位置的输入都已知，可以一次前向算完；推理时第 $t+1$ 个 token 必须等第 $t$ 个确定后才能算。KV Cache 省掉重复计算，但改变不了这种数据依赖。

### 高频考点题 3：FlashAttention 改变了什么

关于 FlashAttention，下面哪种说法正确？

- A. 一种稀疏近似 Attention，用少量精度换取速度
- B. 它把复杂度从 $O(n^2)$ 降到 $O(n)$
- C. 它去掉了 Softmax
- D. 精确 Attention，靠分块减少显存数据搬运来提速

**答案：D。** FlashAttention 是 IO-aware 的精确算法，数学结果和标准 Attention 一致，省的是 HBM 与 SRAM 之间的读写和 $n\times n$ 中间矩阵的显存。它和稀疏、线性近似 Attention 不是一回事。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯云智二面：Spring、Java 内存模型与 IO 多路复用](../../../interview/tencent/ai/tencent-ai-32.md)
- [字节 Agent 实习：模型选择与可信通信](../../../interview/bytedance/base/bytedance-base-54.md)
- [阿里云 AI Infra 一面：FlashAttention 与 AI Coding](../../../interview/alibaba/ai/alibaba-ai-22.md)
- [阿里云 AI 产品一面：模型基础、需求优先级与产品定位](../../../interview/alibaba/ai/alibaba-ai-27.md)
- [字节后端与 Agent 开发二面：本体平台、延迟任务与注意力](../../../interview/bytedance/base/bytedance-base-81.md)
- [阿里大模型算法校招：Attention、后训练与 Agent 评测](../../../interview/alibaba/ai/alibaba-ai-24.md)
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [饿了么 AIGC 实习一面：Attention、训练与扩散模型](../../../interview/alibaba/ai/alibaba-ai-23.md)
- [字节 Agent 后端一面：进程线程、Transformer 与训练](../../../interview/bytedance/base/bytedance-base-31.md)
- [腾讯游戏安全后台一面：进程、Agent 与请求路由](../../../interview/tencent/ai/tencent-ai-34.md)
- [淘天 AI 应用研发实习：后端基础、Transformer 与训练](../../../interview/alibaba/ai/alibaba-ai-32.md)
<!-- interview-source-history:end -->

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
- [GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245)
- [GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202)
- [Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467)
- [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)
- [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
- [PyTorch scaled_dot_product_attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)
- [Hugging Face Transformers：GenerationConfig 与停止条件](https://huggingface.co/docs/transformers/main/en/main_classes/text_generation)
- [Hugging Face TRL：指令微调与 EOS / 聊天模板对齐](https://huggingface.co/docs/trl/sft_trainer#instruction-tuning-example)

<!-- content-sync: 2026-07-13-verified -->
