### 阿里淘天 AI 应用研发一面：RAG、限流 Top-K 与优惠策略

这轮淘天 AI 应用研发一面包括模型调优与 RAG 项目、限流和实时 Top10，以及 30 分钟商品计价 AI Coding。记录写明 8 月 26 日，未注明年份。优惠策略任务与 AI Coding 使用心得分别保留；计价专题尚未完成知识关联。

<details data-knowledge-key="rag-pipeline">
<summary>（1）模型调优和 RAG 项目应该怎样介绍？</summary>
</details>

先说明不用纯模型回答的原因，再按数据清洗、切分、索引、召回、重排、上下文组装和生成讲清链路。模型调优要明确改的是 Prompt、检索参数、重排、微调还是推理配置，并用固定评测集比较答案正确率、引用命中率、拒答、延迟和成本。项目贡献应落到具体模块与可复现的消融结果。

<details data-knowledge-key="rate-limit-circuit">
<summary>（2）某个 URL 一秒内涌入大量请求但只能处理 100 个，怎样选择数据结构与限流方式？</summary>
</details>

先确认100指每秒吞吐、窗口配额还是并发容量，以及超额请求能否等待。若是每秒配额，可比较时间戳队列、滑动窗口桶和令牌桶；若是并发上限，应限制运行槽位。令牌桶允许受控突发，不能直接宣称任意一秒严格不超过100。

<details data-knowledge-key="algorithm-heap">
<summary>（3）怎样维护实时商品销量 Top10？</summary>
</details>

若销量持续增量更新且商品很多，可维护商品到销量的映射，并用大小为 10 的最小堆保存当前候选，堆顶是 Top10 中最小值。不过已在堆内商品频繁更新时，需要索引堆、TreeMap 有序集合，或采用 Redis Sorted Set 才能高效调整。精确全局 Top10 在分布式环境还需合并分片候选，并定义同销量的稳定排序。

<details data-binding-status="pending_semantic_verification">
<summary>（4）30 分钟 AI Coding：怎样实现可更新会员价、满减等优惠策略的商品计价系统？</summary>
<p>关联知识点待核实。</p>
</details>

题意已知：把计价输入、规则接口与策略装配分开，并允许优惠策略更新；金额与结果要可验证。优惠顺序、互斥叠加、舍入和历史版本应先澄清或作为示例约定。关联知识点待核实：原题含义已知，现库缺完整匹配专题。

<details data-knowledge-key="agent-coding">
<summary>（5）平时使用 AI Coding 有哪些心得，遇到过什么问题？</summary>
</details>

结合自己的实际任务说明 AI 帮了哪一步、出现过哪些错误，以及如何发现和修正。先澄清接口与业务规则，让 AI 分步改动，再运行测试并检查关键代码；可举边界遗漏、依赖或 API 猜测、需求理解偏差等教学例子，但不能编造为本人经历。最终正确性和验收仍由开发者负责。

#### 延伸阅读

- [RAG 检索增强生成全流程](../../../knowledge/llm/rag/rag-pipeline.md)
- [RAG 评测体系](../../../knowledge/llm/rag/rag-evaluation.md)
- [AI 系统限流与并发控制](../../../knowledge/llm/production/ai-rate-limiting.md)
- [堆与优先队列](../../../knowledge/cs/algorithm/algorithm-heap.md)
- [Agent Coding](../../../knowledge/llm/agent/agent-coding.md)
