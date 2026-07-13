Token、上下文窗口和 KV Cache 分别回答三个问题：模型怎样切分输入、一次请求最多容纳什么、生成时怎样避免反复计算历史。把三者连起来，才能正确判断长对话为什么更贵、首字为什么变慢，以及缓存究竟缓存了什么。

## 先建立完整心智模型

一次请求并不是“把字符串交给模型”这么简单。服务端先用与模型匹配的 tokenizer 把文本、工具定义和多模态占位等内容编码成 Token ID；模型在有限的上下文窗口内处理这些 Token；自回归生成时，KV Cache 保存各层已经算出的 Key 和 Value，后续每一步只追加新位置对应的数据。

![文本被编码为 Token，并在 Prefill 与 Decode 阶段读写 KV Cache](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-token-context-kv-cache-v2.png)
*图：Prefill 并行处理输入并写入缓存；Decode 每次生成一个 Token，读取历史 K/V 后追加新 K/V。*

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

在因果自注意力中，第 $t$ 个位置只关注自己和之前的位置。若每生成一个 Token 都重算完整前缀，会重复计算历史位置的 Key、Value 投影。KV Cache 把这些历史结果保留下来：

- **Prefill**：并行处理输入序列，生成每层的 K/V，并得到第一个待生成 Token 的分布。
- **Decode**：输入最新 Token，计算它在每层的新 Q/K/V；Q 与历史 K 做匹配，用注意力权重汇总历史 V；随后把新 K/V 追加到缓存。

KV Cache 消除了历史 K/V 投影的重复计算，但没有让长序列“免费”。每个新 Token 仍需读取越来越长的缓存并与历史位置做注意力计算。

### 缓存大小怎么估算

以常见实现为例，单请求的缓存字节数可近似写成：

$$
2\times L\times S\times H_{kv}\times D_h\times B
$$

其中 $2$ 代表 K 和 V，$L$ 是层数，$S$ 是已缓存序列长度，$H_{kv}$ 是 KV 头数，$D_h$ 是每头维度，$B$ 是每个元素的字节数。它说明缓存随序列长度线性增长，也解释了量化 KV、分页注意力和减少 KV 头数为什么有效。

### MHA、GQA 与 MQA

- MHA 通常让每个 Query 头拥有对应的 K/V 头，容量高但缓存较大。
- MQA 让多个 Query 头共享一组 K/V 头，缓存最省，但可能影响质量。
- GQA 把 Query 头分组，每组共享 K/V，折中质量与推理效率。原始 GQA 论文报告其质量接近 MHA，同时速度接近 MQA。

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

## 小结

Token 决定序列如何表示和计量；Context Window 规定一次请求的总预算；KV Cache 用显存换取自回归生成速度。优化 LLM 应用时，应把它们作为一条链路共同测量，而不是分别背三个定义。

## 参考资料

- [OpenAI tiktoken](https://github.com/openai/tiktoken)
- [Hugging Face Transformers：KV cache strategies](https://huggingface.co/docs/transformers/kv_cache)
- [GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [OpenAI API：Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
