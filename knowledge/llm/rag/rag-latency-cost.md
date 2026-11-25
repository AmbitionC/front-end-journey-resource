RAG 的“响应慢、费用高”不是一个指标，而是离线摄取与在线查询多个阶段共同作用。先把 route、retrieve、rerank、generate 的等待与费用拆开，再决定并行、批处理、早停、背压和降级；否则优化最快的阶段也不会改变端到端 p95。

## 离线与在线分账

离线成本包括解析、OCR、分块、embedding、图抽取、索引写入和重建；在线成本包括路由、检索、重排、压缩、模型输入/输出与工具调用。两者用不同 SLO：离线关注 freshness lag 与吞吐，在线关注用户可见延迟。

```text
online latency = route
               + critical_path(retrieval branches)
               + rerank
               + context assembly
               + generation first-token / completion
```

并行分支取最大等待，不是简单相加；队列等待也要计入，而不只测服务执行时间。

![一次在线 RAG 查询按阶段记延迟：排队时间也要计入，路由示例预算 40 毫秒，关键词、向量和表格检索并行、共用 160 毫秒的 deadline，关键路径取最慢一路，重排 220 毫秒，再组装上下文，生成的首 token 900 毫秒，总预算 5000 毫秒，这些数只是示例；容量压力下按显式阶梯降级：Full 是多路召回加重排和完整模型，Degraded 减少变体和候选、走快路径或缓存，Abstain 在高风险或证据不足时拒答，响应要标明 degraded 和证据时间；离线摄取的解析、OCR、分块、embedding 和建索引另记一本账，看新鲜度延迟和吞吐，删除与 ACL 更新优先于批量回填](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-latency-budget-degrade-v2.dark.png)
*图：上半是一次在线查询的示例预算，并行检索共用 deadline、取最慢一路；下半左边是容量压力下的显式降级阶梯，右边是离线摄取的独立账本。*

## 为每阶段建立预算

从端到端 SLO 反推阶段预算与超时：

```ts
const budget = {
  routeMs: 40,
  retrieveMs: 160,
  rerankMs: 220,
  firstTokenMs: 900,
  totalMs: 5000,
  maxInputTokens: 12000,
  maxOutputTokens: 900,
};
```

这些数只是示例，不是通用最佳值。预算来自用户任务、基础设施和质量曲线。每个 trace 记录 queue、network、compute 和 serialization，区分“服务慢”与“排队久”。

## 先减少不必要工作

[OpenAI Latency Optimization](https://developers.openai.com/api/docs/guides/latency-optimization)将优化归纳为：更快处理 token、生成更少、输入更少、请求更少、并行、改善感知等待，以及不默认使用 LLM。

在 RAG 中可映射为：

- 精确 ID 查询用关键词/数据库，不调用大模型改写；
- 高置信单路召回后早停，不总是 multi-query；
- 相关候选已足够时跳过昂贵 rerank；
- 抽取必要证据，减少输入 token；
- 限制输出并用 streaming 改善 first-token；
- 无证据时 abstain，不让模型写长篇猜测。

优化前先用消融验证质量，不因“少一次调用”牺牲关键召回。

## 并行与批处理

独立的关键词、向量、表格检索可并行，再统一融合。查询改写与授权不能随意并行：授权必须先确定可见范围。并行需要共同 deadline，慢分支超时后用已完成结果或按风险拒答。

离线 embedding 适合批处理，提高吞吐、减少网络开销；批过大会增加等待、内存和失败重做范围。按 token 而非只按文档数组 batch，使用有界队列。

## Token 是延迟与费用共同变量

输入 token 影响上下文处理成本，输出 token 常直接拉长完成时间。分开记录系统指令、用户历史、检索证据、工具 schema、输出。稳定前缀放前可提高当前 [Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)命中，但具体门槛和计费截至 2026-07-15 仍是供应商行为。

不要只截断最后证据。按子问题、来源与证据类型分配 token，保留限定条件和引用。输出设置任务所需上限；结构化 JSON 也应简化字段，不返回冗余解释。

## Queue、背压与吞吐

吞吐不足时，延迟主要来自 queue。每阶段设置并发、令牌桶和队列上限；下游饱和向上游背压。按租户公平调度，避免大批量任务饿死交互请求。

容量指标包括 utilization、queue depth、oldest age、drop/reject、retry amplification。限流错误用退避和 jitter，不能所有请求立即重试形成雪崩。

离线 backfill 使用较低优先级；删除与 ACL 更新拥有高优先级，确保合规变化不因大批重建而延迟。

## 缓存与早退出

Embedding、retrieval、rerank 和 answer cache 分层设计，键包含版本与 ACL。缓存命中减少工作，但检查 stale；stampede 通过 single-flight 和 jitter TTL 控制。

早退策略示例：精确匹配且证据完整 → 不 multi-query；候选间隔明显且覆盖全部子意图 → 不 rerank；无授权候选 → 立即 abstain。每个早退记录原因，并在采样流量上跑完整路径，验证是否隐藏质量退化。

## Degradation 必须显式

容量压力下定义阶梯：

1. Full：多路召回、rerank、完整模型；
2. Degraded：减少变体/候选，使用较快路径或缓存；
3. Abstain：高风险或证据不足时拒绝。

低风险搜索可在 rerank 超时后用融合排名；财务、权限和合规问答可能必须 abstain。不要静默换成旧索引或越权数据。响应标明 degraded 与证据时间。

## 质量—延迟—成本曲线

对 candidate depth、rerank top-n、context token、模型与变体数做实验，绘制质量、p50/p95/p99 和单位请求成本。按精确查询、多跳、长文、表格和多语言切片；平均值会掩盖昂贵长尾。

发布门禁同时约束：质量不低于阈值、p95 不超预算、错误率和费用可接受。优化是寻找 Pareto 前沿，不是单独最小化某一个轴。

## 小结

RAG 性能工程先分阶段计量：离线看 freshness/吞吐，在线看 route、retrieve、rerank、generate 与排队。用少工作、并行、批处理、token 预算、缓存和早停优化；在容量压力下按 Full/Degraded/Abstain 明确降级，并始终用质量曲线约束速度和费用。

## 练一练

### 高频考点题 1：并行分支的延迟

关键词检索 80ms、向量检索 120ms 并行执行，这一步的耗时大约是？

- A. 大约 200ms，两路检索的耗时要相加
- B. 120ms 左右，并行取最长的那条，再加上排队等待
- C. 大约 80ms，并行时以先返回的那一路为准
- D. 40ms，两者相减

**答案：B。** 并行分支取最大等待而不是相加。排队时间也要计入，不能只测服务执行时间。

### 高频考点题 2：先减少不必要的工作

下面哪项不是合理的 RAG 提速手段？

- A. 精确 ID 查询直接走关键词或数据库，不调用大模型改写
- B. 高置信的单路召回命中后提前结束，不再跑 multi-query
- C. 为了省时间，把授权检查和检索并行，结果出来再过滤
- D. 只抽取必要证据放进上下文，减少输入 token

**答案：C。** 授权必须先确定可见范围，不能为了并行而后置，否则可能把无权内容带进候选和缓存。其他几项都是在不伤关键召回的前提下减少工作。

### 高频考点题 3：降级策略

容量紧张、重排超时，下面哪种处理最合适？

- A. 静默切换到旧版索引继续服务，避免用户感知到故障
- B. 所有问题都直接返回空结果
- C. 无限重试重排服务直到成功，保证每个回答都经过重排
- D. 低风险问题降级兜底，高风险问题证据不足就拒答

**答案：D。** 降级要显式分级：完整、降级、拒答。静默换旧索引会让用户拿到过期答案，无限重试会放大拥堵。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 AI 应用实习面试：模型服务、RAG 与分类评估](../../../interview/kuaishou/ai/kuaishou-ai-15.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
- [字节 Agent 二面：RAG 分块、查询改写与随机采样](../../../interview/bytedance/base/bytedance-base-28.md)
- [快手效果营销实习一面：意图路由、模型容错与业务校验](../../../interview/kuaishou/ai/kuaishou-ai-18.md)
- [阿里国际 Java 二面：RAG 数据评测、微调与代码生成](../../../interview/alibaba/ai/alibaba-ai-26.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
<!-- interview-source-history:end -->

## 参考资料

- [OpenAI — Latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization)
- [OpenAI — Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)
