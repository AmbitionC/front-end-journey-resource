### 京东零售后端一面：RAG 分块、证据与工具调用

候选人自述为京东零售后端开发一面；正文写明 3 月 13 日，未给出面试年份。

面试经历、岗位与轮次来自候选人自述，未独立认证。以下短答与教学例子由编辑补充，不是候选人的现场答案或企业标准答案。

本页选录 Agent 项目的文本分块、RAG 幻觉与 Function Calling 三组。Skill 比较、电商项目、模型选型及开发习惯未展开；分块参数、所用模型和实际实现未披露。

<details data-knowledge-key="rag-chunking">
<summary>（1）RAG 中的文本分块怎样做？</summary>
</details>
<p>先按标题、段落、表格或代码等结构保留相对完整的语义单元，超长单元再按目标模型的 token 上限细分。块中保留来源、版本、位置和权限等元数据；大小与重叠量通过真实查询评测取舍。块太小会漏掉限定条件，太大则可能带入噪声；没有脱离语料与任务的通用最佳参数。</p>

<p>教学例子（非原项目实现）：操作步骤与“仅适用于管理员”的条件要保持可共同检索，不能切开后只把步骤送进上下文。</p>

技术核对：[Microsoft：分块方法与取舍](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents)。

知识导航：[文本分块策略（Chunking）](../../../knowledge/llm/rag/rag-chunking.md)。

<details data-knowledge-key="rag-citation-grounding">
<summary>（2）RAG 幻觉如何处理？</summary>
</details>
<p>先定位是证据缺失、召回错误，还是生成超出了证据。修复数据与检索后，让事实声明回到当前有效且有权访问的证据片段，并检查引用是否真正支持邻近结论；证据不足或冲突无法解决时缩小回答或拒答。RAG、提示词和自动检查都不能保证消除幻觉，仍需在真实任务上评测并复核关键事实。</p>

<p>教学例子（非原项目实现）：资料只支持“部分客户可开启”，回答就不能扩成“所有客户默认开启”；附上同主题链接也不能补足这条证据。</p>

技术核对：[Anthropic：以证据与不确定性降低幻觉](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)、[RAGAS 原论文：分开评估检索与生成](https://aclanthology.org/2024.eacl-demo.16/)。

知识导航：[引用溯源、Grounding 与事实一致性](../../../knowledge/llm/rag/rag-citation-grounding.md)。

<details data-knowledge-key="function-calling">
<summary>（3）Function Calling 做了什么？</summary>
</details>
<p>在应用定义函数型工具的场景中，应用把工具用途和参数结构提供给模型，模型提出结构化调用；运行时完成参数、业务与权限校验后执行，再把结果按调用标识交回模型。提出调用不等于执行成功或获得授权，还要定义超时、重复执行与循环终止边界。具体字段和消息协议随提供方而异。</p>

<p>教学例子（非原项目实现）：模型建议查询某个订单时，服务端先根据可信登录态核对订单归属，再执行查询；模型填入的用户身份不能替代鉴权。</p>

技术核对：[Anthropic：应用定义工具的调用闭环](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview#how-tool-use-works)。

知识导航：[Function Calling 与工具调用](../../../knowledge/llm/dev/function-calling.md)。
