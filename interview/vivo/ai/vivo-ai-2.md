公司：vivo；方向：大模型多模态算法。轮次、应聘类别、部门和面试日期未披露，不能仅凭“实习拷打”推定本次招聘是实习。本文选录召回重排与复杂查询评测两题；所有例子、计算和答案均为编辑教学补充。

<details data-knowledge-key="rag-reranking">
<summary>（1）多路召回之后，粗排与二阶段重排怎样实现？</summary>
</details>

先融合、去重并过滤多路召回候选，再把查询与每个候选一起送入重排器评分，按相关性和上下文预算选证据。双塔适合高效检索，Cross-Encoder可在查询与文本之间做联合交互；它只能重排已有候选，找不回完全漏召回的证据。

[Sentence Transformers维护者文档](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html)给出先检索再Cross-Encoder评分的两阶段结构。向量相似度和关键词检索分数不能随意当成同一量纲相加；融合策略与候选深度都要单独验证。重排分数也不天然等于事实正确概率。

教学例子：查询问“型号A的v2固件是否支持离线升级”，候选甲只说型号A在线升级，候选乙明确讨论v2离线条件。重排的作用是比较完整条件，把能回答问题的乙排到前面；若乙没有进入候选池，再大的重排器也无从选择它。

验证时固定同一查询、候选文本和版本，比较初始排序与重排后的顺序，再看最终答案和延迟。若同时增加候选数又换重排模型，就无法把收益归因于重排。重要证据被截断、ID与分数错位或重复块挤占窗口，仍会导致失败。

延伸阅读：[Rerank 重排序原理与实践](../../../knowledge/llm/rag/rag-reranking.md)。

<details data-knowledge-key="agent-eval-framework">
<summary>（2）系统怎样评估，复杂或多意图查询的准确率怎样计算？</summary>
</details>

把每条查询需要完成的子目标和硬约束写成可验证判据，同时报告子目标覆盖与整任务成功。复杂查询不能只因答对其中一部分就算整题正确；开放语义用校准后的人工或模型评分，确定状态和数值尽量由程序检查。

[Agent评测实践](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)区分任务、执行、轨迹、最终环境结果与评分器。模型最终说“已完成”是一条回复，不等于请求的产物或事实已经成立。

教学算例：10条查询各有3个必答子目标，系统答对29个子目标，覆盖率为29/30，约96.7%；其中一条漏了一个必答项，整题成功仍只有9/10，即90%。这是两种不同口径，不是本项目成绩。若还有权限或禁止动作，违反硬约束的运行即使内容齐全也不能算合格。

保留每个子目标的证据、失败类别和整题结果，分别查看单意图、多意图、歧义和长链任务。比较版本时固定用例和环境，说明有效运行、环境故障与任务失败的分母；必要时多次运行观察稳定性，不能只展示最好一次。

延伸阅读：[Agent 评测原理：任务、轨迹与环境结果](../../../knowledge/llm/production/agent-eval-framework.md)。

## 参考资料

- [rerank](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html)。
- [evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。
