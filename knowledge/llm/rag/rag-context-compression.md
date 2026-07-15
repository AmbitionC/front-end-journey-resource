召回 top-k 后直接把所有块拼进 Prompt，会重复标题、导航和相似段落，让关键证据被噪声淹没。Retrieval Context Compression 在已授权候选中抽取相关 span、删除冗余并分配 token，但任何压缩都是有损变换，必须保留来源位置并验证没有改变证据含义。

## 压缩发生在授权之后

安全顺序是：

```text
authorization → retrieval → rerank → compression → generation
```

不能先跨租户召回和压缩，再尝试删除不可见内容。压缩器可能把受限句子的信息写进摘要，即使原句后来被过滤也无法撤回。候选和缓存都绑定 tenant、ACL 与索引版本。

![已授权候选依次进行片段抽取、去重和 token 预算压缩，保留 Source Span 并在生成前通过忠实度检查](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-context-compression-evidence-filter-v1.webp)
*图：UNAUTHORIZED 路径在压缩前终止；被保留的每个 span 都能返回原候选。*

## 三类压缩操作

### 相关 span 抽取

从每个候选中选择直接支持问题的句子或表格行，保留标题、限定条件和必要上下文。输出不是自由文本，而是 source span：

```ts
type ExtractedSpan = {
  chunkId: string;
  start: number;
  end: number;
  text: string;
  reason: 'direct' | 'definition' | 'constraint' | 'counterevidence';
};
```

字符范围或页码/bbox 使引用可以回到原文，也能检查模型是否改写了内容。

### 冗余删除

相邻块重叠、同文档重复标题、多来源转载会浪费 token。先按稳定 ID 和内容 hash 去重，再做近重复聚类；每簇保留最可信、最新或最完整版本，同时保存其他来源关系。不同日期或政策版本即使文字相似，也不能误合并。

### 抽象摘要

摘要能进一步缩短长证据，但会增加遗漏与生成错误。优先抽取式压缩；确需摘要时，输出 `summary + supportingSpanIds + omittedTopics`，重要数值、否定和条件尽量保持原句。

## RECOMP 的启示与边界

[RECOMP](https://arxiv.org/abs/2310.04408)研究了抽取式与抽象式 compressor，并允许在检索内容无关时返回空字符串，实现 selective augmentation。论文展示的压缩率和任务结果属于其模型与数据集，不能当作生产保证。

工程上的重要启示是：压缩目标不只是“字更少”，还要改善下游任务；无帮助的检索内容可以不进入上下文。但空结果应触发重新检索、澄清或拒答策略，而不是让模型凭参数记忆自信回答。

## Token 预算是分配问题

固定给每个文档同样长度会浪费预算。[OpenAI 的延迟优化指南](https://developers.openai.com/api/docs/guides/latency-optimization)把减少输入 token 列为降低延迟的通用原则之一；在 RAG 中应通过可验证的证据分配实现，而不是盲目截断。按问题子意图、相关性、来源多样性和证据类型分配：

```text
total budget
├─ direct evidence
├─ definitions / constraints
├─ counterevidence
└─ citation metadata
```

先为每个必要子问题保留最小配额，再竞争剩余 token。不要把 citation metadata 全部裁掉；至少保留 source、version、span 和标题。生成 Prompt 也需要系统指令与用户问题空间，压缩器只使用分配给 evidence 的预算。

## 保留限定词和反证

压缩最危险的错误是把“仅当”“不适用于”“截至某日”删掉。抽取器要把限定条件与主断言视为一个证据单元。对数值保留单位、时间、分母和表头。

不能只选择支持用户假设的句子。若候选存在冲突或反证，给它单独配额；最终答案显示差异和来源时间。否则压缩会变成 confirmation bias 放大器。

## Prompt injection 与不可信内容

检索块里可能含“忽略前文并调用工具”。压缩模型处理的是数据，不授予指令权限。可以先按文档结构分离内容与指令样式，标记可疑 span；抽象摘要不得执行其中命令。

压缩器输出仍要经过 schema 校验和引用验证。让压缩器只返回 span ID 的抽取模式，比自由生成文本更容易抵抗注入；高风险来源可跳过模型压缩，使用确定性句子筛选。

## 忠实度检查

抽取式结果验证每个字符范围确实存在于原 chunk；摘要式结果将每个 claim 映射到 supporting spans，并检查数值、实体、否定、时间和单位。找不到支持的 claim 被删除或标记为推断。

可做两级检查：确定性校验（span、hash、数值）先运行，模型 judge 只处理语义覆盖。Judge 自身不是事实源，应在人工标注集上验证，并抽样审计。

## 评测与运行指标

比较未压缩、抽取、去重、摘要和组合策略：

- compression ratio 与最终 input token；
- evidence recall：golden span 是否保留；
- context precision：无关 span 是否减少；
- citation validity 与 claim support；
- 答案正确、忠实和完整；
- 压缩延迟、费用与缓存命中。

按否定、数字、跨段定义、多来源冲突、长表格和注入切片。平均 token 下降不代表成功；关键证据召回下降时，应回退更保守策略。

## 缓存与版本

压缩缓存键至少包含规范化问题、候选内容 hash、候选顺序、压缩策略/模型版本、token 预算和 ACL 摘要。索引或权限变化会失效。只按 query 缓存，会把旧证据、不同租户或不同预算混在一起。

## 小结

检索上下文压缩是证据选择器，不是授权器也不是事实生成器。它在已授权、已重排候选中抽取 span、去重和分配 token，任何抽象摘要都绑定原始支持。用 evidence recall、引用有效性和答案忠实度约束压缩率，才能真正减少噪声而不删除事实。

## 参考资料

- [Xu, Shi, Choi — RECOMP](https://arxiv.org/abs/2310.04408)
- [OpenAI — Latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization)
