公司：字节跳动；岗位：Agent 开发后端日常实习；轮次：一面。原文记录面试日为 09.23，未在日期文字中注明年份。

背景、经历和提问范围来自候选人自述，未独立证实。以下问题按原文归纳；答题思路为独立教学整理，不代表作者现场作答或企业标准答案。

## 教学演算：把重排效果与任务效果分开

下面是教学设定，不是候选人的项目或实测：问题为“企业年付用了两个月能退款吗”，固定候选池中A是个人月付、B是企业未启用、C是企业已使用政策。初始排序B、A、C，重排后假设为C、B、A，运行时在相同权限和上下文预算下选C，生成器才能按适用条件回答；若C没有被召回，重排无法救回。单题排名变化只说明机制，需用独立业务标签、留出查询和最终答案检验收益。

#### （1）为什么选 LangGraph，工作流如何组织？

把节点输入输出、分支、暂停、恢复和外部副作用讲清。若需要显式状态图、检查点和人工中断，LangGraph 可以减少自建编排工作；简单固定链路可能只需要普通代码。框架提供状态保存机制，不替业务处理支付幂等、授权或数据库事务。

知识导航：[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)、[确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)。

#### （2）评测集怎样构造；AI 生成的数据怎样保证质量和覆盖？

先定义目标流量和失败切片，再混合脱敏真实问题、专家题、历史事故与受控合成题。合成样本要核对证据、去除近重复、人工校准难度，并按文档或时间划分开发集与盲测集。生成模型给自己的答案打高分不能作为独立质量证明。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[RAG 测试集、Golden Set 与回归测试](../../../knowledge/llm/rag/rag-testing.md)、[数据质量评估与异常检测](../../../knowledge/data/processing/data-quality.md)。

#### （3）如何证明回答更好，哪个指标最能衡量目标？

主指标跟业务验收一致，例如带正确证据完成任务的比例；检索 Recall、排名 nDCG、忠实性、时延和成本用于诊断。冻结同一测试集，逐项做基线与消融。总体提高但关键切片退化时阻断发布，不用平均分掩盖损失。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)。

#### （4）口语、错别字或意图不明确的问题怎样处理？

改写时保留原问题、实体和约束，精确标识符不要擅自纠正。可分别检索原始与改写查询后合并；如果歧义会改变业务动作或授权范围，先澄清。记录改写前后召回与误改率，避免把所有输入都强制改成看似标准的问题。

知识导航：[查询改写、分解与扩展](../../../knowledge/llm/rag/rag-query-rewrite.md)、[意图识别、澄清反问与对话路由](../../../knowledge/llm/agent/agent-intent-clarification.md)。

#### （5）Markdown、TXT、PDF 知识库分别怎样切块？

先解析文档结构，再按标题、段落、表格或版面分块。Markdown 保留标题层级和代码块；TXT 结合段落与语义边界；PDF 先确认文字、阅读顺序与 OCR 质量。统一记录文档版本、页码、父块和权限，不让 token 长度成为唯一切分依据。

知识导航：[生产级文档解析、索引与增量更新](../../../knowledge/llm/rag/rag-production-ingestion.md)、[文档 Loader、Parser 与版面解析](../../../knowledge/llm/rag/rag-loader-parser.md)、[文本分块策略（Chunking）](../../../knowledge/llm/rag/rag-chunking.md)。

#### （6）为什么同时使用 BM25 与向量；多种检索方式各有何价值？

BM25 有利于型号、错误码和专有词匹配，向量检索补充语义改写。多检索器只有在漏召回切片上提供互补收益才值得增加。对同一权限过滤后的语料，比较单路、混合和路由基线，并保留候选来源以解释收益。

知识导航：[Hybrid Search 混合检索](../../../knowledge/llm/rag/rag-hybrid-search.md)。

#### （7）两路召回如何融合，RRF 为什么不用原始分数？

不同检索器的分数尺度和分布不一致，直接相加会被数值较大的链路主导。RRF 对候选在各路的排名求 1/(c+rank) 之和，没有出现的候选不贡献分数。教学小例c=60、排名从1起：词法A1/B2，向量C1/B2/A3；融合A=1/61+1/63≈0.032266、B=2/62≈0.032258、C=1/61≈0.016393，A略高。没进入一路窗口的文档该路记0；这不是原始分数相加，也不保证A符合业务条件。它避免分数校准，但也丢失原分数间距；窗口、去重和常数仍需要评测。

知识导航：[Hybrid Search 混合检索](../../../knowledge/llm/rag/rag-hybrid-search.md)。

#### （8）为何Cross-Encoder“比向量更准”；预训练目标不同怎样证明业务有效？

原问带有“更准”的预设；下面的教学整理要求先验证它，而不直接接受预设。

Cross-Encoder 联合读取查询和候选文本，可捕捉更细的交互，代价是每个候选都要推理。它并不保证比所有向量模型更准确。冻结候选池，在人工标注的业务查询上比较排序质量和时延，特别观察专有词、否定、版本冲突；必要时再微调或替换模型。

知识导航：[Rerank 重排序原理与实践](../../../knowledge/llm/rag/rag-reranking.md)、[RAG 测试集、Golden Set 与回归测试](../../../knowledge/llm/rag/rag-testing.md)。

#### （9）两个项目除了技术栈有什么区别，收获和困难怎样回答？

按任务目标、数据分布、约束、失败模式和验收结果比较，而不是罗列库名。只陈述自己完成的模块，展示一次可复现问题、定位证据、改动和验证结果。原帖没有提供这些项目的真实指标，整理答案不补造收益数字。

知识导航：[用业务指标证明 Agent 项目价值](../../../knowledge/career/agent-project-evaluation.md)、[AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)。

## 原帖记录边界

原帖只说手撕是一道较简单的贪心题，没有给题面；保留这一边界，不生成冒充原题的算法题。

口述要点：先明确任务终态和证据，合成题经过独立校准；固定候选池评排序，固定生成预算再评最终答案，不能用模型自评或局部指标代替任务正确。

教学模拟追问（非原题）：

- **排序提高但漏了政策适用日期怎么办？** 回查块版本、截断和证据选择；高分不能补齐被删掉的条件。
- **AI出题和AI裁判一致能直接通过吗？** 不能；先用独立规则和人工留出标签检查相关错误及不可判定样本。

## 整理依据

核验于2026-10-02；框架与模型文档为滚动资料，以下支持教学说明，不是企业标准答案。

- [LangGraph Persistence：检查点与线程状态](https://docs.langchain.com/oss/python/langgraph/persistence)
- [OpenAI Evaluation best practices：真实分布与人工校准](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [Sentence Transformers Cross-Encoders：联合编码](https://sbert.net/examples/cross_encoder/applications/README.html)
- [Elastic RRF：按排名融合](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)
