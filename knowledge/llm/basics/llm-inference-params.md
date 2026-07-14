大语言模型先为词表中的候选 Token 计算 Logits，再把它们转换成概率并选出下一个 Token。Temperature 改变概率分布的形状，Top-K 与 Top-P 截断候选集合；它们调的是“怎样选”，不是给模型增加知识或推理能力。

## 从 Logits 到下一个 Token

模型对每个候选 Token 输出一个实数分数 $z_i$。Softmax 把这些分数变成总和为 1 的概率：

$$
p_i=\frac{e^{z_i}}{\sum_j e^{z_j}}
$$

随后，解码器可以取最大概率项（greedy），也可以从过滤和归一化后的分布中随机采样。这个过程会在每个生成位置重复。

![Logits 经 Temperature 缩放，再选择 Top-K 或 Top-P 过滤并采样下一个 Token](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-inference-params-sampling-v3.webp)
*图：Temperature 改变分布形状；Top-K 固定候选数量，Top-P 按累计概率动态确定候选集合。具体支持和执行顺序以模型 API 为准。*

## Temperature：改变分布的尖锐程度

常见定义是在 Softmax 前把 Logits 除以温度 $T$：

$$
p_i(T)=\frac{e^{z_i/T}}{\sum_j e^{z_j/T}},\quad T>0
$$

- $T<1$：放大 Logit 差异，分布更尖锐，高概率 Token 更占优势。
- $T=1$：保持原始 Softmax 分布。
- $T>1$：缩小差异，分布更平坦，低概率 Token 更容易被选中。

“温度更高等于更有创造力”只是粗略经验。过高温度也会放大不相关候选，导致事实错误、格式破坏或语义漂移。温度不会让模型获得原本没有的知识。

### Temperature = 0 的边界

数学公式要求 $T>0$。API 中的 `temperature: 0` 通常被实现为接近贪心解码或特殊确定性路径，但这是服务商约定，不是上述公式直接代入的结果。即使使用贪心，分布式计算、模型快照、服务端路由和工具执行仍可能导致输出不完全一致。

## Top-K：保留固定数量的最高概率候选

Top-K 将 Token 按概率排序，只保留前 $K$ 个，把其他概率设为 0，再重新归一化并采样。

- 优点：简单、可预测，能切掉长尾低概率候选。
- 局限：$K$ 是固定数量，不能适应每一步分布的集中程度。

当一个 Token 已占据绝大多数概率时，大 $K$ 会保留不必要候选；当很多候选都合理时，小 $K$ 又可能过早删除多样性。

## Top-P：保留动态的概率质量

Top-P，也称 Nucleus Sampling。它从最高概率 Token 开始累加，保留累计概率达到阈值 $p$ 的最小集合，再归一化采样：

$$
S_p=\min\left\{S:\sum_{i\in S}p_{(i)}\ge p\right\}
$$

当分布很集中时，候选集合可能很小；分布较平坦时，候选集合会自动扩大。原始论文提出这一方法是为了避开概率分布中不可靠的长尾，同时保留开放式生成的多样性。

## 三者怎样组合

概念上可以把解码过程理解为：温度缩放 → 概率计算 → 一个或多个过滤器 → 重新归一化 → 采样。但具体服务端可能调整顺序、固定某些参数，或完全不开放这些控制项。

若同时启用 Top-K 和 Top-P，最终候选通常不会比单独使用任一过滤器更大；但不要把某个框架的实现顺序当成跨厂商标准。

截至 2026-07-13，Anthropic 官方文档明确说明 Claude Opus 4.7 及之后的部分模型、Claude Sonnet 5 不接受非默认 `temperature`、`top_p`、`top_k`。新一代推理模型也常用 `effort`、thinking 模式或提示词来替代直接采样控制。因此，先查“具体模型 ID”的文档，再写请求参数。

## 其他常见控制项

### 最大输出

`max_output_tokens`、`max_tokens` 或 `max_new_tokens` 限制最多生成多少 Token。设置太小会截断答案；设置很大只是允许更多输出，不代表模型一定写满。还要处理长度上限对应的 stop reason。

### Stop sequences

命中指定字符串时停止生成。它适合文本协议边界，但不应替代原生结构化输出；若停止字符串可能出现在合法内容中，会造成意外截断。

### Presence / frequency / repetition penalty

这些参数降低已出现 Token 再次被选中的倾向。不同 API 的公式和范围不同，过强会伤害专有名词、代码标识符和必要重复。

### Seed

部分平台提供 seed 以提高复现性，通常也只是 best effort。要复现实验，还需固定模型快照、提示、工具、参数和输入顺序，并保存响应元数据。

### Reasoning effort

推理模型可能提供 `effort` 或 thinking 模式，控制测试时计算量。它影响的不是普通采样温度，而是模型在作答前后使用推理预算的方式，通常会改变延迟与成本。

## 不要背参数表：用评测选择

为一个任务确定参数时，可以这样做：

1. 固定模型快照、提示、工具和最大输出。
2. 选取覆盖正常、边界和失败场景的评测集。
3. 只改变一个受支持的参数，且每组运行多次。
4. 同时统计任务质量、格式成功率、方差、延迟和成本。
5. 选出满足约束的稳定区域，而不是追逐单次最好结果。

事实抽取通常更看重一致性和结构正确率；创意候选生成更看重多样性，但仍要设置质量底线。代码、数学和 Agent 任务往往还受 reasoning effort、工具结果和验证器影响，不能只调 Temperature。

## 常见误区

- **“Temperature = 0 保证完全复现”**：最多提高确定性，不是跨请求、跨版本的强保证。
- **“Top-P = 0 就是贪心”**：边界值的接受范围与行为由 API 定义，不应自行推断。
- **“Top-P 永远优于 Top-K”**：它们是不同过滤策略，效果取决于模型与任务。
- **“同时打开所有参数更精细”**：过滤器叠加会缩小候选集，也会增加调试难度。
- **“低温可以消除幻觉”**：低温只减少采样随机性，不能修复错误知识或缺失证据。
- **“SDK 类型里有字段就能用”**：同一 SDK 面向多个模型，服务端仍可能拒绝参数。

## 小结

Temperature 控制分布尖锐程度，Top-K 用固定数量裁剪候选，Top-P 用动态概率质量裁剪候选。生产环境应把它们视为模型特定的解码接口，通过评测选择，而不是套用永久有效的经验值。

## 参考资料

- [The Curious Case of Neural Text Degeneration（Nucleus Sampling）](https://arxiv.org/abs/1904.09751)
- [Anthropic：Migrating to Claude 4](https://docs.anthropic.com/en/docs/about-claude/models/migrating-to-claude-4)
- [Anthropic：Using the Messages API](https://docs.anthropic.com/en/api/prompt-validation)
- [OpenAI API：Model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [Alibaba Cloud Model Studio：DashScope API Reference](https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-dashscope)
- [DeepSeek API Docs](https://api-docs.deepseek.com/)
