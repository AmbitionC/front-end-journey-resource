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

## 怎样用 usage 证明压缩有收益

先固定同一任务、输入记录、检索与工具返回、模型版本及生成参数，再比较“未压缩”和“压缩后”继续任务的表现。保存每次真实模型调用的原始 usage，并区分生成摘要、后续问答、失败重试与其他调用；不能只挑后续问答中最省的一次响应，忽略摘要器自身和重试消耗。报告时把原始 token 数、缓存命中、延迟、估算费用和任务质量分开，明确统计范围；供应商账单用于实际费用对账。

usage 是提供商对这次调用的计量结果，tokenizer 的事前估算用于预算，两者用途不同。以 [Google Gen AI Python SDK 的 GenerateContentResponseUsageMetadata](https://googleapis.github.io/python-genai/genai.html) 为例，它区分 prompt、candidates、cached content、thoughts 和工具返回等字段，prompt 计数已包含缓存内容。因此不要把 input 与 cached 无条件相加，也不要把可见回复长度当全部模型用量。跨供应商、流式或累计事件先核对对应版本的包含关系与累计语义，再聚合一次；缓存折扣、token 变少与业务费用下降不是同一指标。

在相同题集上同时比较关键事实、否定与单位、引用支持、约束遵守和最终任务成功；再保留未参与调优的样本检查泛化。只有把压缩和重试开销计入后仍有收益、关键质量未越过业务容忍边界，才能说压缩值得采用。

## 换模型时怎样处理摘要

切到模型 B 不意味着所有用户事实失效。原始消息与已确认事实应继续可追溯；模型 A 的推断、已撤回决定、过期工具结果和与目标模型不兼容的工作视图，则不能自动成为 B 的当前事实。为摘要记录覆盖消息范围、来源指纹、摘要版本、生成模型与模板版本、目标模型兼容版本，并在切换时重新检查目标模型的输入合同和 token 预算；不兼容时从原始证据与最新事实重建视图，而非继续摘要旧摘要。

异步任务携带生成时的基准摘要版本；提交时用原子条件写拒绝过期版本，只移除已覆盖前缀，保留后续消息及最新权限约束。详细的事实层、覆盖游标和迟到提交协议见[会话摘要、压缩与记忆提炼](../agent/agent-memory-summarization.md)。[LangGraph 的记忆文档](https://docs.langchain.com/oss/python/langgraph/add-memory)演示保存 summary 与移除消息，但这里的来源核验、跨模型兼容与并发提交门禁是应用设计，不是框架自动保证。

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
- [小红书一面：检索评测、上下文压缩与任务幂等](../../../interview/redbook/ai/redbook-ai-4.md)
- [百度 AI 应用社招一面：工作区权限、工具发现与上下文](../../../interview/baidu/ai/baidu-ai-7.md)
- [快手 AI 应用服务端日常实习一面：协作、上下文与评测](../../../interview/kuaishou/ai/kuaishou-ai-7.md)
- [快手 AI 应用一面：沙箱中的 Skill、工具调用与记忆压缩](../../../interview/kuaishou/ai/kuaishou-ai-12.md)
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [阿里淘天 Agent 一面：Skill、路由与灰度发布](../../../interview/alibaba/ai/alibaba-ai-13.md)
- [字节 Agent 日常实习一面：Coding项目与记忆（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-10.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../../interview/bytedance/base/bytedance-base-48.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../../interview/bytedance/base/bytedance-base-43.md)
- [大疆创新 AI Agent 开发面经：容错、Token 与后端基础](../../../interview/dji/ai/dji-ai-1.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [百度大模型研发一面：Context、Harness 与 RAG](../../../interview/baidu/ai/baidu-ai-1.md)
- [字节 Agent 开发一面：评分、Harness 与任务可靠性](../../../interview/bytedance/base/bytedance-base-57.md)
- [腾讯微信支付后台开发日常实习一面](../../../interview/tencent/ai/tencent-ai-5.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [腾讯 AI Agent 应用开发一面：上下文、强化学习与系统基础](../../../interview/tencent/ai/tencent-ai-11.md)
- [海康威视 AI Agent 开发一面：可靠工具与任务状态](../../../interview/hikvision/ai/hikvision-ai-1.md)
- [字节 Agent 全栈一面：工具、评测与编码](../../../interview/bytedance/base/bytedance-base-40.md)
<!-- interview-source-history:end -->

## 参考资料

- [LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models](https://arxiv.org/abs/2310.05736)
- [LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression](https://arxiv.org/abs/2310.06839)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [LongBench: A Bilingual, Multitask Benchmark for Long Context Understanding](https://arxiv.org/abs/2308.14508)
- [Google Gen AI Python SDK：GenerateContentResponseUsageMetadata](https://googleapis.github.io/python-genai/genai.html)
- [LangGraph：Memory，Summarize messages](https://docs.langchain.com/oss/python/langgraph/add-memory)
