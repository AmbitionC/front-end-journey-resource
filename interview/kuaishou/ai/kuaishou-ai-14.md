### 快手 AI 应用开发实习二面：循环、记忆与重排

快手AI应用开发实习二面记录，自述时长约1小时，部门和面试年月未注明。以下选录状态循环、记忆时效和RAG重排三组。

以下短答、详解和示例均为编辑教学补充，不代表候选人现场回答、实际项目实现或企业标准答案。

<details data-knowledge-key="agent-run-loop">
<summary>（1）LangGraph 状态图怎样设置终止条件，避免 Agent 一直循环？</summary>
</details>

把状态图的正常完成、等待、失败和预算耗尽定义为可检查状态，再用条件边路由到结束或受控恢复节点。除图执行步数上限外，还应限制总时长、模型/工具次数及连续无进展；LangGraph 的 recursion_limit 统计图的super-step，并不等于模型推理token或工具调用次数。

**详解**

以下以当前LangGraph Python Graph API为教学范围，原文没有给框架版本。状态可保存未完成目标、已取得的证据、最近动作及参数摘要、错误次数和剩余预算。节点执行后更新这些字段，路由函数依据可验证结果决定继续、请求澄清、进入失败处理或到END；模型说“完成”只是待验证信号。

例如检索工具连续返回相同候选且未解决问题，进展指纹持续不变，此时应换检索策略、请求缺失条件或返回证据不足。指纹需要包括分页游标和任务状态，避免把正常翻页误判为循环；同样，换一句提示却没有新增结果也不能算有效进展。这是应用侧策略，不是框架替业务自动判断成功。

LangGraph还提供`recursion_limit`限制一次图运行的super-step数，超限会出现`GraphRecursionError`；并行节点的调度步与模型调用数不是一一对应。可在接近上限时走明确收尾路径，外层也处理超限异常，但“结束”不自动等于“成功”。[Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)及[官方示例](https://docs.langchain.com/oss/python/langgraph/use-graph-api)说明了这些机制。

墙钟超时还须传入实际网络/工具调用；仅在两轮之间检查时间，不能打断一个永远不返回的调用。保存最后确认的状态和未完成项，让恢复复用已完成的结果，而不是重启一个没有上限的新循环。本题没有提供步数或超时参数，不给万能阈值。

知识导航：[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)。

<details data-knowledge-key="agent-memory-forgetting">
<summary>（2）短期和长期记忆怎样存，语义相关但年代久远的信息能直接使用吗？</summary>
</details>

短期记忆保存当前会话或任务的状态，长期记忆保存跨会话可复用的信息；二者都可以持久化，区别不在是否放内存。历史内容进入当前上下文前要检查主体、用途、版本与有效期；语义相似只提供候选，旧事实可能已被替代、过期或与当前条件不符。

**详解**

以LangGraph当前机制说明存储层次：checkpointer保存同一thread的图状态快照，帮助跨轮续接；store保存跨thread的应用数据。生产恢复需要合适的持久后端，进程内保存器只是选择之一。持久化状态也不意味着每次把所有历史全部发送给模型。[LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)及[Memory说明](https://docs.langchain.com/oss/python/langgraph/add-memory)区分了这些作用域。

教学例子：用户上次说“本周出差到A市”，三个月后问附近餐馆，检索到旧句的相似度可能很高，却不证明现在仍在A市。可记录来源时间、有效期、实体和字段；到期内容退出当前视图，用户新的地点明确替代旧地点，无法确定时询问而不自动沿用。相反，一个仍有效的出生日期不会只因较旧就失效，所以也不能“一律只用最新”。

工程上区分四个动作：衰减降低排序权重；过期不再进入当前有效集合；替代保留新旧版本关系；删除还需传播到派生索引和缓存。检索返回ID和版本后，可向主记录确认active状态与权限，再组装上下文。用户纠正或索引更新期间要防止迟到的旧写入覆盖新事实。

评测应包含“相关且仍有效”“相关但已过期”“新旧事实冲突”三类查询，检查错误沿用率和纠正后的传播时延。是否加入时间衰减、衰减多快由这些用例决定，不给整个记忆库统一的保鲜时长。

知识导航：[遗忘策略、冲突处理与记忆更新](../../../knowledge/llm/agent/agent-memory-forgetting.md)。

<details data-knowledge-key="rag-reranking">
<summary>（3）向量检索后为什么还要 Cross-Encoder，重排候选数与效果怎样评估？</summary>
</details>

双塔分别编码查询和文档，便于大规模召回；Cross-Encoder把查询与单个候选联合输入，能比较更细的词语与条件关系，但计算更贵。先保证正确证据进入候选池，再在固定池上比较重排指标；输入候选数与最终送入上下文的数量应分别按质量、尾延迟和预算选择。

**详解**

设用户问“已使用的年度套餐能否取消”，候选A只讨论未启用套餐，候选B讨论已使用套餐。两者主题都相似，联合编码有机会识别“已使用/未启用”的条件差异；是否真的排对，仍需业务标签验证，不能从模型结构直接推出更准。[Sentence Transformers两阶段管线](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html)解释了先召回再逐对评分。

把召回深度记为K，最终上下文块数记为N，可以避免“Rerank的Top-k”含混不清。K太小会漏证据，K增大增加逐对计算、长输入截断和排队成本；N又受生成上下文预算及证据重复程度限制。分块应保留标题、适用条件与版本，不能只留下一个失去对象的结论句。原文没有参数，不给固定K/N或片长。

用相同查询、候选ID和文本冻结候选池，比较初排与重排的MRR、nDCG@N或Precision@N，并单独看Recall@K。正确文档没入池时，重排无法补回。再固定生成模型和上下文预算，评答案、引用、尾延迟及费用，避免排序变好却挤走另一条必要证据。

分数也不是事实正确率。具体模型可能输出logits或有界值；即使做sigmoid得到0到1，也不自动校准成业务正确概率。[CrossEncoder用法](https://www.sbert.net/docs/cross_encoder/usage/usage.html)明确保留了模型分数差异。选择阈值和模型前要查模型卡并在独立业务样本上校准，不能长期套用“高于0.8就可信”。

知识导航：[Rerank 重排序原理与实践](../../../knowledge/llm/rag/rag-reranking.md)。
