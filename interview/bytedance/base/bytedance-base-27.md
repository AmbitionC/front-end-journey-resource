公司：字节跳动；岗位：Agent 开发；招聘场景：暑期实习；轮次：一面，作者记录约一小时。原文面试日为 7 月 15 日，未注明年份；帖子发表于 2026 年 7 月。

背景、经历和提问范围来自候选人自述，未独立证实。以下问题按原文归纳；答题思路为独立教学整理，不代表作者现场作答或企业标准答案。

## 教学演算：迟到摘要不能撤销用户的新限制

教学设定摘要S7覆盖消息1–20，后台A基于S7处理21–40；消息41改变日期，42要求“只整理，不发布”。后台B先提交覆盖至42的S8，随后A才返回。A必须在同一原子提交中比较基准版本7，发现当前为8时丢弃或重算，不能无条件覆盖。即使没有B、A成功覆盖至40，41–42仍保留为原文尾部，最新动作限制还要由运行时直接检查。这是设计推演，未在完整并发存储环境运行；原始事件不由摘要覆盖。

#### （1）Agent 项目中的短期记忆怎样实现，何时触发总结？

按目标模型 tokenizer 和调用预算计算当前输入，预留输出与工具结果空间，在调用前超过预算阈值时压缩。不能等接口已经超限才开始。保留目标、不可变约束、近期消息和工具证据引用；“最近两三轮”只是作者项目做法，不是通用配置。

知识导航：[Token、Context Window 与 KV Cache](../../../knowledge/llm/basics/llm-token-context.md)、[会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)。

#### （2）前十轮已总结，第十一轮怎么处理，原文还需要吗？

摘要保存覆盖消息范围与版本，新轮次追加增量；原始事件仍持久化以便核验和重建。异步摘要针对冻结范围生成，提交时检查基线版本，避免旧摘要覆盖新对话。重要订单号、权限等来自权威状态，摘要遗漏时回源，不能让模型猜。

知识导航：[会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)、[Agent 会话、检查点与任务状态存储](../../../knowledge/backend/storage/agent-state-storage.md)。

#### （3）长期记忆什么时候检索，是否每轮同时注入长短期？

当前工作状态与跨会话记忆分开。只有与任务相关且权限、时效有效的长期内容才检索并注入，保留来源和撤销规则。每轮全量加入长期记忆会消耗预算并引入无关或旧事实。

知识导航：[短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)、[Agent 记忆系统架构设计](../../../knowledge/llm/agent/agent-memory-architecture.md)。

#### （4）工具太多怎样降低 token 消耗？

先按任务与权限选候选工具，只加载必要的 Schema 与说明，调用时由执行器重验参数和授权。渐进加载减少初始描述量，但误选、遗漏工具和额外检索也有成本，需用同一任务集比较任务成功与总成本。

知识导航：[工具发现、选择与路由](../../../knowledge/llm/agent/agent-tool-selection.md)、[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。

#### （5）RAG 如何实现，如何观察召回块？

把解析、切块、索引、召回、重排和生成分别观测，保留 query、文档版本、块 ID、权限与排名。检索准确率不等于答案忠实性，生成还要引用证据、核对事实和无证据时拒答。原帖没有模型或具体检索配置，本文不填型号。

知识导航：[RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)、[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)、[RAG 测试集、Golden Set 与回归测试](../../../knowledge/llm/rag/rag-testing.md)。

#### （6）余弦与欧氏距离在工程上有什么区别？

余弦比较方向，欧氏距离比较直线距离。对单位归一化向量，平方欧氏距离等于 2-2*cos，因此排序关系一致；未归一化时向量长度会影响欧氏距离。按 embedding 模型训练合同和索引支持的度量选择，不能说 RAG 必须用余弦。

知识导航：[Embedding 原理与向量相似度](../../../knowledge/llm/rag/embedding-basics.md)、[Embedding 模型评估与选型](../../../knowledge/data/vector/embedding-models.md)。

#### （7）怎样控制幻觉，多个模型的职责如何解释？

先分清资料缺失、检索未命中、上下文错误和生成无依据，再按失败原因修正。模型职责如 embedding、路由、重排、生成需对应实际链路与验收，不能只报使用数量。冻结业务查询，检查引用、正确性、拒答和关键切片。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)。

#### （8）现场重排链表如何处理？

题意是 L0→Ln→L1→Ln-1…，按约定的原地约束可快慢指针找中点、断开并反转后半段、再交替合并。断链与空节点边界尤其重要；时间 O(n)，辅助空间 O(1)。原帖记录了实现失败，不把整理思路冒充作者现场完成的代码。

知识导航：[链表、指针与 LRU](../../../knowledge/cs/algorithm/algorithm-linked-list.md)。

#### （9）平时怎么调试代码，近期产品架构和 Harness 怎样理解？

先复现输入与版本，检查最小失败路径，用日志、断点、测试与 profile 分别定位状态、控制流和性能问题；打印并不是所有故障的充分证据。产品架构按官方可见资料和实际版本讲，不推断未公开源码。原帖是调试与产品架构问答；Harness 是面试官的补学建议，未改写为一道已提问技术题。

知识导航：[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)、[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)。

## 原帖记录边界

作者对面试反馈、算法要求和业务的看法只视为自述；删去个人投递感想，不公开身份。

口述要点：摘要是有版本的工作视图，预算在调用前检查；后台压缩冻结范围并原子提交，关键字段和权限有权威来源，工具渐进加载不授予执行权限。

教学模拟追问（非原题）：

- **摘要中有日期字段但值来自旧消息怎么办？** Schema只能查结构；核对来源和替代关系，回读最新决定或阻断，不能让模型猜。
- **把全部长期记忆加入每轮是否更安全？** 可能扩大预算、引入旧事实或越权数据；先按当前任务、权限与时效检索，再验证继续任务结果。

## 整理依据

核验于2026-10-02；版本比较交换是应用层设计，以下框架文档不提供业务正确性自动保证。

- [LangGraph Memory：消息摘要及删除](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [LangGraph Persistence：checkpoint与store](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Anthropic Agent evals：轨迹与终态分开](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
