用户的一句话可能同时包含缩写、口语、多个子意图和隐含约束。单次检索容易被某一种表达绑住。Multi-Query 让模型生成少量受约束的查询变体，分别召回，再按排名融合。它扩展的是“表达面”，不是权限、时间或实体范围。

## 与 Query Rewrite 的边界

Query Rewrite 通常把原问题改成一个更适合检索的版本，例如补全对话指代或规范术语。Multi-Query 则保留多个互补视角：

```text
原问题：为什么企业版续费后成员仍显示只读？

变体 A：enterprise renewal member remains read only
变体 B：subscription renewed permission not refreshed
变体 C：seat entitlement sync delay after renewal
变体 D：只读权限 缓存 续费 企业版
```

变体应覆盖同一意图，而不是发散成“企业版有哪些功能”。生成前把不可变约束单独结构化：tenant、时间、实体 ID、产品版本、语言和授权过滤器。

![原问题保留租户、日期和实体约束后生成有限查询变体，各自检索，再经 RRF 或加权融合和去重得到候选](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-multi-query-fusion-v1.webp)
*图：DRIFT 变体在 Constraint Check 被拒绝；查询不会直接产生答案。*

## 受约束生成

让模型输出结构化数组，并限制数量、长度和目的：

```json
{
  "intent": "diagnose_permission_state",
  "constraints": {
    "tenantId": "t-17",
    "product": "enterprise",
    "timeRange": "current"
  },
  "queries": [
    { "text": "renewal permission refresh failure", "facet": "state" },
    { "text": "entitlement sync delay after renewal", "facet": "sync" },
    { "text": "read only role cache invalidation", "facet": "cache" }
  ]
}
```

服务器重新附加 ACL 和 metadata filter，模型输出不能修改它们。执行前检查变体是否仍包含关键实体/否定词/时间，过滤重复与漂移查询；全部被拒绝时回退原查询。

## 并行召回，统一融合

每个有效变体独立走关键词、向量或混合检索，并发执行且受总超时控制。保存 `variantId → ranked list`，便于解释某文档为何入选。

不同检索器的原始分数不可直接比较。Reciprocal Rank Fusion 使用排名位置：

```text
RRF(d) = Σ 1 / (k + rank_i(d))
```

[RRF 原始论文](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)提出用倒数排名组合多个信息检索系统，并用常数减弱异常高排名的影响。`k` 是待验证参数，不应照抄为永久值。

[RAG-Fusion](https://arxiv.org/abs/2402.03367)把多查询生成与 RRF 结合。论文报告的准确性和全面性结果只适用于其评测；它也指出生成查询偏离原问题时，答案可能跑题。

若变体有明确优先级，可做 weighted RRF：原查询权重更高，探索性变体更低。权重来自离线评测，而不是模型自评置信度。

## 去重与证据多样性

同一 chunk 可能在四个列表中出现，融合先按稳定 chunk ID 去重；不同 chunk 内容近重复时，再按 source/version 和内容指纹合并。保留“被几个变体命中”作为稳定性信号，但不能把流行来源误当正确来源。

融合后通常还需 rerank：把原始用户问题与候选一起比较，防止变体语义主导最终排名。随后按子意图和来源分配上下文，避免前几名全是同一段的改写。

## 预算与降级

Multi-Query 会放大生成调用、检索 QPS、候选数和 rerank 成本。建立查询预算：最大变体数、单路 top-k、总候选、总字符、超时和费用。简单精确 ID 问题直接单路检索；只有低召回风险或多意图问题才 fan-out。

执行策略可以是：先跑原查询，若高置信命中且通过阈值则早停；否则并行补充变体。超时时使用已完成列表融合，记录 `partial: true`，不无限等待最慢一路。

## 漂移、注入与失败模式

检索语料中的文字不能影响查询生成指令；变体生成只读取用户问题和受信任的约束摘要。用户输入本身若包含“忽略过滤器”，服务器仍不允许改 ACL。

常见失败：

- 变体都是同义复述，没有增加召回；
- 变体删除否定词，将“不能退款”改成“退款”；
- 把一个多意图问题扩成大量无关问题；
- 多路候选带来更多噪声，rerank 后收益消失；
- 跨语言变体命中错误版本或地区政策；
- 缓存键只用原问题，忽略变体策略与索引版本。

## 评测

比较单原查询、单 rewrite、Multi-Query、Multi-Query + fusion、再加 rerank。分别测：

- Recall@K 是否真正增加；
- 融合后的 nDCG/MRR；
- drift rate 与约束保留率；
- 最终答案忠实度、引用与任务成功；
- 查询数、候选数、p95 延迟和费用。

按缩写、口语、多语言、多意图、否定、精确实体和长对话切片。若 rerank/truncation 抵消了召回收益，就减少变体或改变上下文配额，而不是只庆祝 raw recall。

## 小结

Multi-Query 是受预算约束的多表达召回：先锁定权限与实体等不可变条件，生成少量互补变体，各自检索，再用 RRF/加权融合、去重和原问题 rerank 汇合。它的收益必须同时覆盖质量、漂移、延迟与成本。

## 参考资料

- [Cormack, Clarke, Büttcher — Reciprocal Rank Fusion](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)
- [Rackauckas — RAG-Fusion](https://arxiv.org/abs/2402.03367)
