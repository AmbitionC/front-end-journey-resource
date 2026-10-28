公司：百度；方向：Java 实习与智能客服；来源自述记录了一、二面，出现 7 月 17 日但未明确年份，也未说明该日期是否涵盖两轮。智能客服仅作为方向，部门未明示。本文选录三组问题，以下解答与例子均为编辑教学补充。

<details data-knowledge-key="function-calling">
<summary>（1）流式返回工具名称和 JSON 参数时，怎样判断完整调用再执行？</summary>
</details>

先按所用 API 的事件协议解析数据，为每个调用身份维护独立缓冲；参数分片只追加，不执行。收到该调用的完成信号并确认工具名、关联身份与完整参数后，再做 JSON 解析、Schema、业务与权限校验。截断、取消或异常结束时保留未完成状态，不能靠数花括号猜调用已结束。

以 Responses API 的教学流程为例，[官方流式调用文档](https://developers.openai.com/api/docs/guides/function-calling#streaming)用 output_item.added 登记函数调用，用 function_call_arguments.delta 累积参数，再以完成事件提供完整参数。应用在同一 response 内按 output_index/item_id 区分分片，保留 call_id 关联之后的工具结果；不能把并行两次调用的参数混成一段字符串，也不能把数组位置当作跨轮的业务身份。

例如一个字段可能先到 {"city":"，后到 北京，再到 "}。中间文本不是有效参数；字符串内部也可能合法包含大括号或转义符，因此“看到右大括号”不是协议完成判据。等待完整调用后仍要检查工具是否允许、字段是否合规、当前身份能否操作该对象；重放与网络重试还需独立的幂等合同。

模型的参数增量与 MCP 的消息分帧属于不同层次。[MCP 架构文档](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)区分 JSON-RPC 数据层和传输层；应由相应协议适配器得到完整请求，不能把模型输出的一段文字直接作为 MCP 命令执行。以上不绑定来源所用平台，也未运行 SDK 示例。

延伸阅读：[Function Calling 与工具调用](../../../knowledge/llm/dev/function-calling.md)。

<details data-knowledge-key="rag-citation-grounding">
<summary>（2）真实工具数据已经拿到，怎样降低最终回答与依据不一致的风险？</summary>
</details>

把已验证的工具结果保存为带调用身份和版本的证据，再让答案中的可核验声明逐条对应这些证据。数值、主体、时间、否定和适用范围要单独核对；不受支持的声明应删去、收窄或说明未知。工具调用成功和参数合法，都不能保证之后生成的自然语言忠实。

教学例子中，工具只返回“商品 A 可用库存 12 件”，答案可以报告这项库存，不能顺手补成“明天一定送到”。把库存数与送达承诺拆成两个声明，就能发现第二个没有依据。精确数值可由应用从结构化字段渲染或重新计算，随后检查措辞没有改变单位、主体与时间范围。

[Ragas 的 Faithfulness 定义](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness)按答案声明能否由给定上下文支持进行评估。这个思路同样可用于工具证据：检查每个声明与该调用的结果是否一致，保留可回溯位置；它衡量对所给证据的忠实，不等于证明证据在现实中必然正确。自动裁判仍需人工标注样本校准，不能用一个模型分数保证零幻觉。

工具返回后的结构、权限和新鲜度检查应先完成，但本题的问题发生在生成最终答案时，因此还要有声明支持检查与失败出口。只要求“严格使用工具结果”或加一次反思不够；应在回归集中包含数值改写、否定翻转、跨对象拼接和证据缺失的例子，分别统计不受支持声明与有用信息的保留情况。

延伸阅读：[引用溯源、Grounding 与事实一致性](../../../knowledge/llm/rag/rag-citation-grounding.md)。

<details data-knowledge-key="agent-memory-forgetting">
<summary>（3）用户先后表达冲突偏好时，长期记忆怎样召回与更新？</summary>
</details>

把偏好与当前限制分别存成带来源、时间、作用范围和状态的记录，先判断它们是否真的针对同一时段。当前推荐应尊重尚未解除的“不能吃辣”限制，不能只凭相似度召回旧偏好；确认是纠正时让新记录替代旧版本，无法判断有效期时澄清，不把最后写入自动当作永远正确。

“喜欢吃辣”描述偏好，“不能吃辣”可能描述当前约束，两者不必互相覆盖成一个永久布尔值。可以保留原始表述及其时间，形成当前可用视图；未明确解除限制时，不因旧偏好分数更高而推荐辣味。源没有给出原因或持续期限，不能推断其身体情况或何时恢复。

向量检索只找到候选记忆。召回后还要查主体、授权、有效期、active/superseded 状态与版本；需要纠正时，在权威记录中写新版本并让派生向量、缓存和摘要同步失效。检索层落后时，再回主记录核验，避免旧向量继续进入上下文。

[LangGraph Store 文档](https://docs.langchain.com/oss/python/langgraph/stores)提供命名空间、写入、覆盖、检索和删除等机制；何时替代、保留冲突或向用户确认仍是应用策略。测试应覆盖跨用户召回、旧向量迟到、并发纠错和限制已被明确解除等情形，不把一次写库成功当作所有后续回答都已更新。

延伸阅读：[遗忘策略、冲突处理与记忆更新](../../../knowledge/llm/agent/agent-memory-forgetting.md)。

## 参考资料

- [OpenAI：Streaming function calls](https://developers.openai.com/api/docs/guides/function-calling#streaming)。
- [MCP：数据层与传输层](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)。
- [Ragas：Faithfulness 与事实支持](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness)。
- [LangGraph：Store 命名空间与更新](https://docs.langchain.com/oss/python/langgraph/stores)。
