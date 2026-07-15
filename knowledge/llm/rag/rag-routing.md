当知识系统同时包含文档、数据库、代码和知识图谱时，“把问题发给所有索引”会浪费延迟与 token，也可能扩大数据暴露面。Routing 的任务是在硬授权边界内，按意图、数据类型、时效和置信度选择检索路径，并明确处理 fan-out、fallback 与 abstain。

## 先做硬门禁，再判断语义

路由器不能决定用户有没有权限。请求先绑定 tenant、主体、数据域、地域和时间策略，得到允许访问的索引集合：

```ts
type RouteContext = {
  tenantId: string;
  principalId: string;
  allowedIndexes: string[];
  dataTypes: Array<'doc' | 'table' | 'code' | 'graph'>;
  freshnessRequired?: string;
  policyDecisionId: string;
};
```

路由只在 `allowedIndexes` 内选择。即使分类器认为“工资数据库”最相关，授权集合不含它时也不可发起查询。Fallback 也不得绕过这一步。

![用户查询先经过授权与数据类型门禁，路由器再选择文档、表格、代码或图索引，并提供 Fan Out、Fallback 与 Abstain](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-routing-multi-index-v1.webp)
*图：DENY 在路由前终止；所有候选最终在 Merge + Rerank 中统一比较。*

## 路由信号

常见信号包括：

- 意图：查定义、算指标、找代码、探索关系；
- 实体：订单号、函数名、人物、指标；
- 数据形态：自然语言、SQL 可计算、源代码、图关系；
- 时效：实时库存与历史文档使用不同路径；
- 复杂度：单跳、聚合、多跳或全局主题；
- 置信度：是否足以单路执行。

精确规则优先处理高可解释场景：SQL 指标 ID、仓库路径、错误码、明确文件类型。其余可用轻量分类器、embedding 路由或 LLM 输出结构化标签。不要让一个大模型同时做授权、路由、检索和回答，失败难以定位。

## 单路、Fan-out 与组合计划

单路适合目标明确的问题；低置信或跨域问题可以 fan-out。组合计划不是盲目广播，而是有依赖的子查询：

```json
{
  "routes": [
    { "index": "table", "purpose": "calculate incident count" },
    { "index": "doc", "purpose": "retrieve incident policy" }
  ],
  "merge": "evidence_by_subquestion"
}
```

GraphRAG 当前 [Query Engine](https://microsoft.github.io/graphrag/query/overview/)就区分 Local、Global、DRIFT 与 Basic Search：具体实体、全局主题和基线向量检索需要不同路径。路由应保留 Basic Search，不必把每个问题都升级到昂贵图查询。

多路结果用 RRF 或经过标注的权重融合，再用原始问题 rerank。每路保留 route ID 和候选来源，使最终答案能解释由哪条路径支持。

## Fallback 不是静默换数据

索引不可用、超时或新鲜度不达标时，按风险定义 fallback：

- 文档向量索引故障，可退回关键词检索；
- rerank 超时，可在低风险搜索中使用融合排名；
- 实时库存不可用，不能用昨日文档假装实时结果；
- 授权拒绝、数据域不允许，不存在 fallback。

返回中标记 `degraded: true`、原因与证据时间。Fallback 后仍沿用原 policyDecisionId，不能重新扩大 allowedIndexes。

## Abstain 是正确输出

没有安全路径、问题信息不足、所有候选低于阈值或证据互相冲突时，路由器应 abstain，并提出最小澄清问题。例如“哪个服务的 deploy？”比随机选择一个代码仓库更好。

Abstain 与系统错误分开：前者是策略结果，后者是执行失败。监控其比例和后续用户修正，判断分类边界是否合理。

## 置信度需要校准

分类器输出 0.9 不天然表示 90% 正确。用标注集做可靠性曲线与阈值选择；在高风险路由中要求更高置信或双路验证。检测分布漂移，例如新数据域、新术语或多语言比例变化。

可定义三段策略：

```text
high confidence  → single route
medium confidence → bounded fan-out
low confidence   → abstain or clarify
```

具体阈值按错误成本和切片验证，不能复制别的项目。

## 延迟与成本预算

Routing 自身不能成为最慢阶段。规则和轻量分类器并行或级联，昂贵判断只处理剩余模糊请求。对每路设置超时、候选和 token 配额；组合查询可并行无依赖分支。

[OpenAI 延迟优化指南](https://developers.openai.com/api/docs/guides/latency-optimization)将减少请求、并行、减少输入/输出 token，以及在不需要时不用 LLM 列为核心原则。这些原则适用于路由层：确定性规则能解决的问题，不必先调用大模型。

## 可观测性与评测

每次 trace 保存：授权集合、路由特征摘要、候选 route、最终选择、置信度、fan-out、fallback、abstain、各路时长和最终结果。敏感实体只存脱敏值或哈希。

离线测试按 doc/table/code/graph、跨域、实时性、歧义、拒绝和无答案切片，指标包括：route accuracy、top-2 coverage、越权路由为零、fallback 正确、abstain precision/recall、端到端质量、延迟与成本。

做路由消融：全广播、规则、分类器、混合路由。路由准确率高但答案质量不升，可能是下游检索弱；答案质量升但 p95 翻倍，则需早停和预算。

## 小结

多索引路由是一个受治理的策略层：硬授权与数据类型门禁先确定可见世界，路由器再按意图、时效与置信度选择单路、组合或 fan-out。Fallback 保持原权限，Abstain 明确无安全路径；完整 trace 让错误可校准、可定位。

## 参考资料

- [Microsoft GraphRAG — Query Engine](https://microsoft.github.io/graphrag/query/overview/)
- [OpenAI — Latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization)
