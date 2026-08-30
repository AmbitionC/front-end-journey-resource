上下文压缩不是简单“把文字变短”，而是在 token 预算内保留完成任务所需的指令、事实、关系和出处。压缩失败最危险的情况不是语句不流畅，而是悄悄删除否定词、时间顺序、数字单位或冲突证据，让模型在更短的上下文上自信答错。

## 先定义不可损失的信息

压缩前把内容分成两类：

- **保护区**：高层指令、用户当前目标、关键事实、原始引文、来源 ID、权限状态、数字单位和时间顺序；
- **候选区**：重复历史、寒暄、低相关片段、已被可靠结构化的冗长描述、可重新获取的中间结果。

保护不是“永不缩短”，而是任何变换都必须保留语义和可追溯性。合同、代码、财务数字和医疗信息通常应保留原文片段；摘要只能做导航。

## 四类压缩手段

**删除**：去掉无关、重复或过期内容。最便宜、最可解释，但错误删除无法恢复。

**抽取**：从原文保留关键句、表格行、实体和字段。证据可追溯，适合事实问答；上下文可能不够连贯。

**摘要**：用更短文字重述多段内容。压缩率高，适合对话历史与背景；容易产生遗漏、合并冲突或事实漂移。

**学习式压缩**：使用专门模型或 token 级方法选择/重写上下文。[LLMLingua](https://arxiv.org/abs/2310.05736) 探索了预算控制的 Prompt 压缩；[LongLLMLingua](https://arxiv.org/abs/2310.06839) 进一步针对长上下文中的关键信息分布与位置问题设计压缩方法。它们是可评估的技术路线，不意味着任意任务都能无损压缩。

## 预算流水线

![原始上下文分离保护信息与可压缩候选，经多种策略组成预算内上下文并做任务评估](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/prompt-context-compression-budget-pipeline-v1.webp)
*图：压缩后必须检查证据、顺序与引用；缺失时回到选择阶段，而不是继续回答。*

先为固定指令、用户问题、期望输出和安全余量预留 token，再给证据与历史分配预算。一个可执行顺序是：

1. 用目标模型 tokenizer 计算各区块成本；
2. 标记保护事实、引用、顺序和权限状态；
3. 按任务相关性、来源质量、新鲜度和冗余度排序候选；
4. 先删除，再抽取，必要时才摘要或学习式压缩；
5. 组合成预算内上下文，保留来源映射；
6. 运行任务评估与信息保真检查；
7. 失败则降低压缩率、重新检索或请求缩小任务范围。

不要把“压缩到固定比例”设为唯一目标。不同请求的最小充分上下文不同，应以任务正确率和证据保真度为约束。

## 对话历史怎样压缩

将长对话维护为结构化状态通常比反复全文摘要稳定：当前目标、已确认事实、未决问题、用户偏好、已执行工具与结果、禁止重复的动作。每个状态字段附上来源轮次。

保留最近若干原始轮次用于局部语境，更早内容进入结构化状态或分段摘要。用户纠正旧信息时，不只在摘要后追加一句，还要更新对应状态并记录旧值已失效，避免模型同时看到两个“当前值”。

## 文档与检索结果怎样压缩

先检索再压缩，通常比先对整个语料做一个总摘要更可控。对每个候选片段保留文档 ID、段落位置、时间与权限标签；相似片段可以去重，但相互冲突的来源必须并列。

[Lost in the Middle](https://arxiv.org/abs/2307.03172) 显示相关信息位置会影响长上下文表现。压缩不仅减少 token，也会重新排列位置；因此评估时要区分“内容被删掉”和“内容还在但位置改变”两种影响。

## Agent 训练中把压缩记成显式状态或观测转移

在长时序 Agent 训练里，摘要会把多个不同历史映射成相似状态。若训练器只保存压缩后的文本，早期工具动作、否定条件和旧策略概率会消失，最终奖励无法可靠归因，甚至把摘要器的错误当成策略错误。

推理上下文可以压缩，训练证据不能随之丢失。外部轨迹仓应保留原始消息、动作、工具返回、环境版本和旧策略 Log Probability，同时记录压缩器版本、输入区间、摘要与删除片段引用。把压缩记录成轨迹中的显式状态或观测转移，在压缩边界建立检查点，并分别评估状态恢复率、关键信息保真度和最终任务成功率；只有当 Agent 主动选择“现在压缩”时，它才属于策略动作并需要对应的旧策略概率。

如果压缩策略发生变化，应视为环境或观测函数版本变化，不能把新旧轨迹直接当作同分布样本。相关的信用分配问题见[Agentic RL：长时序信用分配与策略优化](../agent/agentic-rl.md)。

## 怎样验证保真度

建立与任务相关的检查，而不是只比较摘要相似度：

- **事实覆盖**：保护事实、数字、否定词和单位是否保留；
- **关系覆盖**：因果、先后、主体与例外条件是否正确；
- **证据追溯**：每条摘要声明能否定位到原文；
- **冲突保留**：不同来源的分歧是否被错误合并；
- **任务效果**：压缩前后答案、引用和拒答行为是否一致；
- **成本效果**：token、延迟、检索与压缩本身的成本是否下降。

[LongBench](https://arxiv.org/abs/2308.14508)覆盖多种长上下文任务，提醒我们不能只用单一“针检索”验证压缩。摘要、代码、多文档问答和 Few-Shot 上的可损失信息并不相同。

## 一个保护事实清单示例

```json
{
  "must_keep": [
    {"id": "order.total", "value": 129900, "unit": "CNY-cent"},
    {"id": "order.status", "value": "shipped", "at": "2026-07-14T09:20:00Z"},
    {"id": "policy.refund", "source": "policy-v7#section-4"}
  ],
  "chronology": ["paid", "packed", "shipped"],
  "open_questions": ["carrier_delay_reason"]
}
```

压缩器可以改写背景，但验证器应逐项检查这些字段仍存在且没有被改义。

## 何时不该自动摘要

- 需要逐字引用或法律审查；
- 代码 diff、配置和精确错误日志；
- 信息来源互相矛盾且尚未裁决；
- 高风险数字、剂量、金额和截止日期；
- 用户正在追问某个历史表述的原话；
- 缺少独立保真验证器。

这些场景优先使用抽取、分块检索或让用户缩小范围。

## 常见误区

- 以压缩率代替任务质量；
- 对摘要继续摘要，累积不可见漂移；
- 删除来源和时间，只保留流畅结论；
- 把相似但冲突的证据去重成一个；
- 压缩后不重新测试引用、拒答和位置敏感性；
- 压缩成本比节省的模型成本还高，却从不计量。

## 小结

上下文压缩是受约束的信息选择：先保护任务不可损失的事实与来源，再按删除、抽取、摘要、学习式压缩逐步增加风险，并用任务结果和证据保真度验收。能恢复来源、保留冲突和安全停止，比得到一段更短、更顺的文字重要。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Coding Agent 日常实习一面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-10.md)（cluster-1b2940d40f2e）
- [大疆创新 AI Agent 开发面经：容错、Token 与后端基础（2026 年 8 月）](../../../interview/dji/ai/dji-ai-1.md)（cluster-4596af05b314）
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)（cluster-650f7c304b11）
- [小红书 Agent 开发一面：多智能体、Memory 与广告投放优化（2026 年 8 月）](../../../interview/redbook/ai/redbook-ai-1.md)（cluster-7372c3e7fb1e）
- [腾讯 AI 开发一面：Coding Agent 记忆、评测与可靠运行（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-8.md)（cluster-7ef1a4a8ef82）
- [百度大模型研发一面：Context、Harness 与 RAG（2026 年 8 月）](../../../interview/baidu/ai/baidu-ai-1.md)（cluster-824645713b59）
- [腾讯微信支付 AI 软件工程一面（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-5.md)（cluster-ab43c892c4ed）
- [深信服 Agent 开发一面：MCP、多 Agent、安全与网络（2026 年 8 月）](../../../interview/sangfor/ai/sangfor-ai-1.md)（cluster-bb3431ce1c81）
- [腾讯大模型算法岗一二面：Agentic RL、PPO/GRPO 与 DeepSeek V4（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-7.md)（cluster-daad361f34b4）
<!-- interview-source-history:end -->

## 参考资料

- [LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models](https://arxiv.org/abs/2310.05736)
- [LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression](https://arxiv.org/abs/2310.06839)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [LongBench: A Bilingual, Multitask Benchmark for Long Context Understanding](https://arxiv.org/abs/2308.14508)
