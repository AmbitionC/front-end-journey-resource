### 京东后端一面：会话存储与 RAG 评测

候选人自述为京东后端开发一面，部门未注明；标题仅给出 10 月 23 日，面试年份未明。

面试经历、岗位与轮次来自候选人自述，未独立认证。以下短答与教学例子由编辑补充，不是候选人的现场答案或企业标准答案。

本页选录会话消息与缓存边界、RAG 分层指标、已知题集评测三组。具体召回值被隐去，K 与评测样本未披露，本文不复原或评价该数值；AI 编程、中间件选型与求职交流未展开。

<details data-knowledge-key="agent-state-storage">
<summary>（1）活跃上下文与持久会话消息怎样区分，MySQL 和 Redis 各承担什么职责？</summary>
</details>
<p>先按用途、权威版本和故障恢复要求划界。若约定 MySQL 保存持久消息账本，Redis 可缓存热点视图，但要说明写入确认、失效、失败补偿和恢复方式。模型本轮使用的上下文是从可信状态中挑选的工作集；页面展示缓存与模型读取路径须分别说明。不能仅因用了 Redis 就认定它只负责展示，也不能默认等会话结束再回写就可靠。</p>

<p>教学例子（非原项目实现）：消息已在页面出现，不代表它已经完成持久提交；服务崩溃后能否恢复，要由写入协议证明。</p>

技术核对：[Microsoft：Cache-Aside 模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)、[Redis：持久化选项](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)。

知识导航：[Agent 会话、检查点与任务状态存储](../../../knowledge/backend/storage/agent-state-storage.md)。

<details data-knowledge-key="rag-evaluation">
<summary>（2）RAG 知识库整体质量该看什么指标，Recall 与整体回答质量是什么关系？</summary>
</details>
<p>先固定任务、相关证据标注和 K，再用 Recall@K 检查应有证据进入前 K 个候选的程度，并另外看排序质量。生成端检查事实正确性、对证据的忠实度、关键事实覆盖和引用支持；端到端还要看任务完成、安全、延迟与成本。召回好不代表模型正确使用了证据，一个总分也不能说明失败发生在哪一层。</p>

<p>教学例子（非原项目实测）：相关文档都被召回，但回答把“部分客户可用”改成“所有客户默认可用”，检索召回仍可能合格，生成正确性和证据忠实度却不合格。</p>

技术核对：[RAGAS 原论文：分开评估检索与生成](https://aclanthology.org/2024.eacl-demo.16/)。

知识导航：[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)。

<details data-knowledge-key="rag-testing">
<summary>（3）评测题已经知道、类似开卷考试时，怎样评估整体回答质量？</summary>
</details>
<p>把已见题用于开发与稳定回归，另保留未参与调优且代表目标任务的留出集；检查来源、时间与近重复，避免相近题跨集合泄漏。固定语料、索引、模型和提示词版本，按可核查事实、证据支持和任务要求评分，再人工抽样复核。已见题得分高只能说明该集合上的表现，不能单独证明对新问题的泛化质量。</p>

<p>教学例子（非原项目评测集）：同一段文档改写出的两道题分别进入调优集和测试集，仍可能泄漏；应先识别共同来源和近重复，再决定分组。</p>

技术核对：[Google：开发、验证与独立测试集](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets)。

知识导航：[RAG 测试集、Golden Set 与回归测试](../../../knowledge/llm/rag/rag-testing.md)。
