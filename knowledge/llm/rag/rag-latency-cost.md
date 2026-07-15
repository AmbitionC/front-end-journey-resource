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

![离线摄取与在线查询分别计量，在线链路按路由、召回、重排和生成划分延迟成本，并在队列压力下按策略降级](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-latency-cost-budget-v1.webp)
*图：Latency、Cost、Quality 是三个独立轴；Full、Degraded、Abstain 构成显式策略。*

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

## 参考资料

- [OpenAI — Latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization)
- [OpenAI — Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)
