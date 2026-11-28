Token、上下文窗口和 KV Cache 是大模型面试的「基础三件套」，站内不少面经直接问到，问 Agent 上下文管理、推理成本时也绕不开它们。三者分别回答：模型怎样切分输入、一次请求最多装多少、生成时怎样避免重复计算历史。连起来理解，才答得出「长对话为什么又贵又慢」「缓存到底缓存了什么」。

> **30 秒答法**：Token 是分词器按模型词表切出来的单位，计费、窗口和延迟都按它算，不等于字数。上下文窗口是一次请求的总预算，系统提示、历史、工具定义、检索结果和输出都要占。KV Cache 把每一层已经算过的 Key 和 Value 存下来，生成新 Token 时只算新位置，代价是显存随序列长度线性增长，所以才有 GQA、KV 量化和分页注意力这些优化。

## 先建立完整心智模型

一次请求并不是“把字符串交给模型”这么简单。服务端先用与模型匹配的 tokenizer 把文本、工具定义和多模态占位等内容编码成 Token ID；模型在有限的上下文窗口内处理这些 Token；自回归生成时，KV Cache 保存各层已经算出的 Key 和 Value，后续每一步只追加新位置对应的数据。

![文本经分词器变成 Token，输入与输出共用上下文窗口；Prefill 并行处理输入并写入各层 KV Cache，Decode 每步只计算新位置并追加 K、V](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-token-context-kv-cache-anim.dark.png)
*图：Prefill 并行处理整段输入并写入 KV Cache；Decode 每次只生成一个 Token，读取历史 K/V 后追加新的 K/V。输入和输出共用同一个上下文窗口。*

## Token：模型处理的离散符号

Token 不是字符，也不必等于单词。现代 tokenizer 通常从字节、字符或子词出发，用 BPE、Unigram 等方法构造词表，再把文本映射为整数序列。同一段文字在不同模型上可能得到不同 Token 数；空格、大小写、标点、代码缩进和中文词表覆盖都会影响结果。

因此，不能用“一个英文单词固定等于多少 Token”或“一个汉字固定等于一个 Token”做精确预算。可靠做法是使用目标模型对应的 tokenizer 或厂商提供的计数接口。

Token 数会影响：

- 输入、输出和缓存命中的计费量；
- Prefill 需要处理的序列长度；
- 可留给模型输出的空间；
- 文本截断、分块与 RAG 的边界。

> Token ID 只是词表索引。模型真正处理的是由 Token ID 查表得到的向量表示。

## Context Window：一次推理的总预算

上下文窗口是模型一次推理可接收的总序列预算。通常可抽象为：

$$
N_{system}+N_{history}+N_{tools}+N_{retrieval}+N_{user}+N_{output}\leq N_{context}
$$

不同 API 对工具调用、多模态输入、推理 Token 和最大输出的计数规则并不完全相同，所以应以具体模型文档与响应中的 usage 为准。

### 窗口更大不等于效果线性变好

长上下文仍有三类现实约束：

1. **质量约束**：模型“能接收”不代表能同等利用每个位置。Lost in the Middle 研究显示，相关信息的位置会影响检索和问答表现。
2. **延迟约束**：输入越长，Prefill 通常越慢，TTFT（首 Token 延迟）会上升。
3. **资源约束**：注意力计算、KV Cache、并发批次会共同消耗算力与显存。

工程上应先删除无关上下文，再考虑摘要、分层记忆或 RAG；不要因为窗口足够大就把整个知识库塞进请求。

## KV Cache：缓存的是每层历史 Token 的 K 和 V

以标准全量因果自注意力为例，第 $t$ 个位置可关注自己和此前未被掩码屏蔽的位置，不能读取未来。若每生成一个 Token 都重算完整前缀，会重复计算历史位置的 Key、Value 投影。KV Cache 把这些历史结果保留下来：

- **Prefill**：并行处理输入序列，生成每层的 K/V，并得到第一个待生成 Token 的分布。
- **Decode**：输入最新 Token，计算它在每层的新 Q/K/V；Q 与历史 K 做匹配，用注意力权重汇总历史 V；随后把新 K/V 追加到缓存。

KV Cache 消除了历史 K/V 投影的重复计算，但没有让长序列“免费”。在这种全量注意力设置下，每个新位置仍需读取随有效前缀增长的 K/V 并做注意力计算。

### 为什么不能只看上一个 Token

自回归指的是下一步以已有前缀为条件，不是“只依赖紧邻的一个 Token”。例如“会议从周二改到周四，请提醒我新的日期”，决定后续输出的信息可能位于更早的位置。Decode 即使只输入最新 Token，模型仍能通过历史 KV 读取前缀信息；只传最新 Token 又不提供相应缓存，会改变模型实际可用的上下文。因果掩码使历史位置不受后来 Token 影响，因此固定前缀的 K/V 可以复用，而新位置的 Q 要重新计算。[Hugging Face 的缓存原理](https://huggingface.co/docs/transformers/main/en/cache_explanation)按层解释了这个过程。

“看前面所有 Token”描述的是标准全量因果注意力的可见范围，不表示每个位置都同等重要，也不是所有模型的共同要求。滑动窗口、分块或稀疏注意力会改变各层直接可见的位置；滑动窗口层的缓存达到窗口大小后可以淘汰旧位置，不再无限增长。应按具体模型和层的注意力配置判断范围，不能从“自回归”直接推出“每层必须保留全部历史 KV”。[Transformers 缓存策略](https://huggingface.co/docs/transformers/kv_cache)明确区分了全量增长与滑动窗口、分块层的缓存限制。

### 缓存大小怎么估算

以常见实现为例，单请求的缓存字节数可近似写成：

$$
2\times L\times S\times H_{kv}\times D_h\times B
$$

其中 $2$ 代表 K 和 V，$L$ 是层数，$S$ 是已缓存序列长度，$H_{kv}$ 是 KV 头数，$D_h$ 是每头维度，$B$ 是每个元素的字节数。该式假设各层保存相同长度的 KV，且不计分配器等额外开销；滑动窗口或混合注意力模型应按各层实际缓存长度分别求和。它说明全量缓存随序列长度线性增长，也解释了量化 KV 和减少 KV 头数（GQA、MQA）为什么能省显存。分页注意力（PagedAttention）不减少每个 Token 的缓存量，它解决的是按最大长度预留造成的显存碎片和浪费。

**算一个真实的数**：以 Llama 3 8B 为例，32 层、8 个 KV 头、每头 128 维，用 FP16 存储（每个元素 2 字节）：

$$
2\times 32\times 8\times 128\times 2 = 131072\ \text{字节} = 128\ \text{KiB/Token}
$$

一个 8K Token 的请求，KV Cache 就要 1 GiB 显存；同时服务 20 个这样的请求，光缓存就是 20 GiB。如果它用的是 32 个 KV 头的 MHA，这个数还要再乘 4。这就是为什么推理服务的并发上限常常卡在显存，而不是算力。

### MHA、GQA 与 MQA

- MHA 通常让每个 Query 头拥有对应的 K/V 头，容量高但缓存较大。
- MQA 让多个 Query 头共享一组 K/V 头，缓存最省，但可能影响质量。
- GQA 把 Query 头分组，每组共享 K/V，折中质量与推理效率。原始 GQA 论文报告其质量接近 MHA，同时速度接近 MQA。

## PagedAttention：逻辑连续，物理按块分配

一个请求的 Token 在逻辑上按位置排列，K/V 不必在显存中为整个最大长度预留一段连续大空间。分页缓存把位置划为固定大小的逻辑块，再由块表找到物理块；新增 Token 用尽当前块后才需要更多块。注意力计算按映射读取 K/V，仍须尊重原有序列位置与掩码。

自选教学例子：每块容纳 4 个 Token，一个已有 7 个 Token 的请求需要 2 块。逻辑块 0、1 可映射到物理块 5、2；逻辑位置 6 对应 `floor(6/4)=1`、块内偏移 2，于是读取物理块 2 的偏移 2。物理编号不表示时间顺序，也不能直接把两个物理块的编号排序后读取。最后一块在此例空余 1 个槽位；分页并没有让碎片完全消失。

![七个Token以四个一块划成逻辑块0和1，经块表映射到物理块5和2；位置6读取物理块2偏移2，尾块仍有一个空槽](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-token-context-paged-block-map-v1.dark.png)
*图：按逻辑位置查块表，再取块内偏移；物理编号不代表时间顺序。*

收益来自减少最大长度预留与连续分配带来的浪费，从而可能提高同等显存下的并发容量；它不改变每个 Token 的 K/V 元素数量，也不把全量注意力变成线性时间。还要付出块表、分配管理和相关内核的成本，最终收益由负载与实现决定。它也不等于操作系统把推理缓存自动换到 CPU。

[vLLM 的 Paged Attention 设计文档](https://docs.vllm.ai/en/latest/design/paged_attention/)解释了分页 K/V 布局，同时明确提醒：其中逐步讲解的旧独立内核已不是当前实现，现有实现通过注意力后端和缓存管理器生成的块表协作。理解布局时可以参考历史示意，不能照抄旧文件名当作当前代码路径。

## Prefix Caching 与 KV Cache 的区别

KV Cache 通常指**一次请求内部**为自回归解码保存的状态；Prefix Caching 则尝试在**多个请求之间**复用相同前缀对应的已计算结果。要提高命中率，应把稳定内容放前面、动态内容放后面，并避免对前缀做无意义改写。

命中规则、最短可缓存长度、缓存寿命和折扣价格都是服务商实现细节。不要把“内容语义相同”误认为“一定命中”；许多实现要求前缀 Token 序列精确一致。

## 一次请求该怎样做预算

1. 用目标模型的 tokenizer 或计数接口统计真实输入。
2. 显式为输出和工具返回预留空间。
3. 监控 TTFT、输出速度、缓存命中率和截断原因。
4. 对长会话做摘要或分层记忆，不无限回传历史。
5. 用业务评测验证长上下文中的关键信息是否仍被正确利用。

## 常见误区

- **“Token 就是字数”**：不同 tokenizer 的边界不同，只能近似估算。
- **“上下文窗口只算用户输入”**：系统指令、历史、工具和输出预算都可能占用窗口。
- **“有 KV Cache 后每步成本不随长度变化”**：缓存避免重算，但 Decode 仍需读取和关注历史位置。
- **“更长窗口一定替代 RAG”**：RAG 还承担筛选、更新、权限和来源追踪等职责。
- **“Temperature 为 0 就能逐字复现”**：分布式推理、模型版本和服务端实现仍可能引入差异。

## 面试中怎样回答“什么是 Token”

先用一句话定义：Token 是 tokenizer 按目标模型词表把输入编码得到的离散单元，模型处理 Token ID 对应的向量，而不是直接处理字符串。随后用一个工程影响收口：它占用上下文窗口，并影响计费、Prefill 延迟、输出预算与 KV Cache；因此不能把 Token 固定等同于字或单词，精确数量必须用目标模型的 tokenizer 或 API usage 计算。

如果面试官继续追问，再展开子词切分、特殊 Token、不同模型词表差异，以及为什么长输入会增加首 Token 延迟。这样比只回答“Token 是最小文本单位”准确，也更能体现工程理解。

## 进阶：Prefill 与 Decode 为什么要分开部署

Prefill 一次性处理整段输入，计算量大、可以充分并行；Decode 每步只生成一个 Token，却要反复读取整份 KV Cache，更受显存带宽和缓存容量限制。两种负载放在同一批 GPU 上会互相拖累：长输入的 Prefill 会卡住正在逐字输出的请求。

所以一些大规模推理系统把两个阶段拆到不同的机器上，Prefill 算完后把 KV Cache 传给 Decode 集群。Kimi 背后的 [Mooncake](https://arxiv.org/abs/2407.00079) 是代表，它以 KV Cache 为中心设计整个服务，还把缓存放到 CPU 内存和 SSD 上扩大容量、提高复用。代价是多了一段 KV 传输，值不值得要在实际负载下比较首 Token 延迟、逐 Token 延迟和吞吐。

![PD 分离与 KV 交接](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/prefill-decode-split-archify-v1.png)

## 小结

Token 决定序列如何表示和计量；Context Window 规定一次请求的总预算；KV Cache 用显存换取自回归生成速度。优化 LLM 应用时，应把它们作为一条链路共同测量，而不是分别背三个定义。

## 练一练

### 高频考点题 1：KV Cache 缓存的是什么

KV Cache 缓存的是什么？

- A. 模型最终输出的文本
- B. 每层历史 token 的 Key 和 Value
- C. 用户的历史对话原文
- D. 每个历史 token 的 Query 向量，供新 token 复用

**答案：B。** Prefill 一次算出输入序列每层的 K/V，Decode 每步只算新 token 的 Q/K/V，再把新 K/V 追加进缓存。它省掉了重复计算，但每步仍要读取随前缀增长的整份缓存。

### 高频考点题 2：算 KV Cache 显存

Llama 3 8B 有 32 层、8 个 KV 头、每头 128 维，用 FP16 存储。每个 token 的 KV Cache 大约多大？

- A. 128 KiB
- B. 16 KiB
- C. 512 KiB
- D. 1 MiB

**答案：A。** $2\times32\times8\times128\times2=131072$ 字节，即 128 KiB/token（2 代表 K 和 V，最后的 2 是 FP16 字节数）。一个 8K token 的请求就要 1 GiB，20 个并发就是 20 GiB。

### 高频考点题 3：GQA 的取舍

关于 MHA、MQA、GQA，下面哪种说法正确？

- A. MQA 的 KV Cache 最大
- B. GQA 让每个 Query 头都有独立的 K/V 头，质量最好
- C. GQA 让多个 Query 头分组共享 K/V
- D. 三者的 KV Cache 大小完全一样

**答案：C。** MHA 每个 Query 头配一组 K/V，缓存最大；MQA 所有 Query 头共享一组 K/V，缓存最省但可能影响质量；GQA 分组共享，原论文报告质量接近 MHA、速度接近 MQA。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯云智二面：Spring、Java 内存模型与 IO 多路复用](../../../interview/tencent/ai/tencent-ai-32.md)
- [字节 Agent 开发日常实习一面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-5.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../../interview/bytedance/base/bytedance-base-48.md)
- [美团大模型应用实习一面：归一化、QLoRA 与推理](../../../interview/meituan/ai/meituan-ai-17.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [字节 Agent 暑期实习一面：摘要、工具预算与链表](../../../interview/bytedance/base/bytedance-base-27.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [腾讯游戏安全后台一面：进程、Agent 与请求路由](../../../interview/tencent/ai/tencent-ai-34.md)
<!-- interview-source-history:end -->

## 参考资料

- [OpenAI tiktoken](https://github.com/openai/tiktoken)
- [Hugging Face Transformers：KV cache strategies](https://huggingface.co/docs/transformers/kv_cache)
- [Hugging Face Transformers：How caching works](https://huggingface.co/docs/transformers/main/en/cache_explanation)
- [GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [OpenAI API：Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)
- [Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving](https://arxiv.org/abs/2407.00079)

- [vLLM：Paged Attention 布局与历史内核说明](https://docs.vllm.ai/en/latest/design/paged_attention/)
