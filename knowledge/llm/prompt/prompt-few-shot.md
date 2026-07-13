Zero-Shot 只给任务说明和当前输入；Few-Shot 额外提供若干示例，让模型在上下文中推断标签、格式、风格或解题模式。它不会更新模型权重，而是一次请求内的 In-Context Learning（ICL）。

## 三种提示方式

![Zero-Shot、固定 Few-Shot 与动态 Few-Shot 的输入和示例选择流程](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/prompt-few-shot-strategies-v2.png)
*图：动态 Few-Shot 不只追求相似度，还要考虑类别覆盖、多样性和测试泄漏。*

### Zero-Shot

```text
任务：把工单分类为 billing、delivery、product、other。
输入：{{TICKET}}
输出：只返回一个类别。
```

优点是 Prompt 短、维护简单，适合模型已熟悉且边界清晰的任务。它也应该成为 Few-Shot 的基线：没有基线，就无法知道示例是否真的带来收益。

### One-Shot / Few-Shot

一个示例是 One-Shot，多个示例通常称 Few-Shot：

```text
示例 1
输入：扣款成功但订单没有生成。
输出：billing

示例 2
输入：物流三天没有更新。
输出：delivery

当前输入：{{TICKET}}
输出：
```

示例同时传递任务边界、标签拼写、输出格式和语气。它适合规则难以完全写清、边界依赖业务约定或需要稳定风格的任务。

## 示例质量为什么比固定数量重要

不存在跨模型、跨任务都最优的“3–5 个示例”。示例数受任务难度、上下文预算、模型能力和输入长度影响。每增加一个示例都可能带来信息，也会增加成本、冲突和位置偏差。

高质量示例应满足：

- **答案正确**：错误标签会直接教错行为；
- **格式一致**：字段、分隔符和详细程度一致；
- **覆盖边界**：包含容易混淆和缺失信息的情况；
- **代表分布**：不要只放最容易或最常见类别；
- **最小充分**：每个示例都解决明确问题；
- **来源安全**：不包含秘密、个人数据或盲测答案。

早期研究发现 ICL 也会受输入分布、标签空间和示例格式影响，但这不意味着标签正确性不重要。生产任务尤其不能依赖错误示例。

## 示例顺序与位置

模型可能对顺序敏感，靠近当前输入的示例也可能影响更大。稳妥做法不是背一个排序规则，而是：

1. 固定一套候选示例；
2. 测试多种顺序；
3. 按任务切片观察退化；
4. 将顺序作为 Prompt 版本的一部分锁定。

分类任务还要防止示例标签分布造成先验偏差。

## Dynamic Few-Shot：按当前输入选择示例

固定示例易维护，却不能覆盖所有输入。动态 Few-Shot 从示例库中为每次请求挑选更相关的演示。

典型流程：

1. 为当前输入计算检索表示；
2. 从同任务、同版本的示例库召回候选；
3. 按相似度、类别覆盖、多样性和质量重排；
4. 去重并执行 Token 预算；
5. 以固定模板拼接 Prompt；
6. 记录选中了哪些示例，便于调试。

只取向量 Top-K 可能返回多个几乎相同的示例，导致覆盖不足。可使用 MMR、按类别配额或规则过滤增加多样性。

## 示例库怎样治理

示例库不是普通知识库，它定义模型行为：

- 每条记录包含稳定 ID、输入、期望输出、标签、来源和审核状态；
- 错误修复不能静默覆盖，要保留版本；
- 用户反馈只有经过审核才能进入示例库；
- 检索索引与 Prompt 模板要绑定版本；
- 高风险和个人数据需要脱敏与访问控制；
- 定期删除重复、过时或与当前 schema 不兼容的示例。

## 防止评测泄漏

若盲测样本或近似答案进入示例库，评测分数会虚高。应按时间、用户或来源隔离训练/示例数据与评测数据，并检查近重复。

动态检索还可能意外召回当前评测题的答案。每次评测都要保存示例 ID，才能审计。

## Few-Shot、RAG 与 Fine-Tuning 的区别

| 方法 | 注入什么 | 主要用途 |
|---|---|---|
| Few-Shot | 输入—输出行为示例 | 教格式、标签边界和风格 |
| RAG | 与问题相关的事实资料 | 提供可更新知识和来源 |
| Fine-Tuning | 通过训练更新权重 | 固化高频稳定行为或风格 |

三者可以组合。示例回答“怎样做”，检索资料回答“依据什么事实做”。不要用 Few-Shot 塞大量易变知识，也不要把 RAG 文档误当成正确行为示例。

## 评测方法

比较至少四组：Zero-Shot、固定 Few-Shot、动态 Few-Shot、必要时 Fine-Tuned。除质量外，还记录 Prompt Token、TTFT、总成本和不同切片的稳定性。

对动态 Few-Shot 做消融：仅相似度、相似度 + 多样性、不同示例数、不同顺序。只有稳定提升才值得增加检索系统复杂度。

## 常见误区

- **Few-Shot 一定优于 Zero-Shot**：无关或错误示例可能降低表现。
- **示例越多越好**：上下文与干扰成本会增加。
- **相似度最高就是最佳示例**：还要考虑覆盖、多样性和标签平衡。
- **示例格式能替代原生 Structured Outputs**：示例只能提高概率，不能提供机制保证。
- **示例可以直接收集用户答案**：必须审核、脱敏并防止投毒。
- **固定数量经验适用于所有模型**：应通过评测决定。

## 小结

先建立 Zero-Shot 基线，再用少量正确、统一、覆盖边界的示例验证增益。输入分布复杂时再引入动态检索，并对示例库、版本和评测泄漏做完整治理。

## 参考资料

- [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
- [Rethinking the Role of Demonstrations: What Makes In-Context Learning Work?](https://arxiv.org/abs/2202.12837)
- [Fantastically Ordered Prompts and Where to Find Them](https://arxiv.org/abs/2104.08786)
- [OpenAI API：Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Anthropic：Prompting best practices](https://docs.anthropic.com/claude/prompt-library)
