普通向量 RAG 擅长“哪段文字像这个问题”，却不天然回答“这些人物如何关联”或“整个语料的主题是什么”。GraphRAG 把文本中的实体、关系、声明和社区组织成图，再为局部实体问题与全局主题问题提供不同检索路径。图是派生索引，不是事实源；最终引用仍必须回到原文。

## 从 TextUnit 到可追溯的图

索引过程可以抽象为：

```text
document → TextUnit → entity / relation / claim
         → entity resolution → graph
         → community detection → community report
```

每个抽取对象都保存 provenance：sourceId、TextUnit ID、字符/页码范围、抽取模型与 Prompt 版本。一个关系可以有多条支持证据，也可以有互相冲突的证据：

```ts
type Relation = {
  subjectId: string;
  predicate: string;
  objectId: string;
  evidence: Array<{ textUnitId: string; span: [number, number] }>;
  extractionVersion: string;
  confidence?: number;
};
```

不要把 `confidence` 当成真实性概率。它只是一条抽取信号；重要关系应通过多证据、一致性规则或人工标注校验。

![文本单元生成实体图与社区摘要，局部查询和全局查询走不同路径，但答案引用始终回到原始文本](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-graph-rag-local-global-v1.webp)
*图：Community Summary 标为 DERIVED；底部 CITE 轨道返回 SOURCE TEXT，而不是只引用生成摘要。*

## 实体消歧决定图的质量

“苹果”“Apple Inc.”和“苹果公司”可能是同一实体，也可能指水果。实体解析通常结合规范名、别名、类型、邻居和来源上下文。过度合并会制造不存在的关系，过度拆分又无法连接证据。

采用可回滚的 canonical mapping：原始 mention 不删除，映射到 entity ID，并记录规则/模型版本。高风险或歧义实体进入人工复核；阈值升级时可重新聚类，而不丢失原始 mention。

关系同样需要类型约束。例如 `PERSON —WORKS_FOR→ ORGANIZATION`，不允许任意节点类型组合。schema 可以开放演进，但每次变更都进入 graph build manifest。

## 社区与摘要解决全局问题

[GraphRAG 原始论文](https://arxiv.org/abs/2404.16130)提出先从语料构建实体知识图谱，再对关系紧密的实体社区预生成摘要，用于面向整个语料的 query-focused summarization。论文结果针对其数据集和任务，不能外推为所有语料都优于向量 RAG。

社区检测把图分成不同粒度的簇，社区报告概括主要实体、关系和声明。报告要保存：community ID、层级、成员、生成版本、支持 TextUnit 列表。摘要本身可能遗漏或错误，所以它适合选择全局证据，不是最终事实引用。

## Local 与 Global 是两种不同查询

当前 [GraphRAG Query Engine](https://microsoft.github.io/graphrag/query/overview/)区分多种模式：Local Search 将知识图与原始文本块结合，适合具体实体；Global Search 对社区报告做 map-reduce，适合全局主题；DRIFT 在局部起点中加入社区信息；Basic Search 则是基线向量检索。

例如：

- “Alice 与供应商 X 有哪些合同关系？”走 local：定位实体，扩展邻居与关系，再取支持 TextUnit；
- “这一年事故报告的主要系统性原因是什么？”走 global：筛选社区报告，生成局部回答，再汇总并回查原文；
- “错误码 E42 的配置在哪里？”通常无需图，走关键词/代码索引。

路由器应允许基线检索和混合路径，GraphRAG 不是所有问题的默认入口。

## 局部查询的上下文预算

从一个实体无限扩展邻居会迅速爆炸。局部检索需要限制 hop、关系类型、时间窗、节点数和 token；按问题相关性、关系支持数与来源质量重排。优先返回关系的原始文本证据，再用实体描述补充。

多跳问题可能需要组合两条低分边。可以做有界路径搜索：

```text
path_score = relevance × provenance_quality × recency
             ÷ path_length_penalty
```

公式只作为可评测起点，不是通用最优。路径结果显示中间节点和每条边的证据，不能只给一个图推断结论。

## 全局查询的 map-reduce

Global Search 先让相关社区报告各自产生 partial response（map），再按重要性和预算汇总（reduce）。风险包括：社区摘要层已经压缩一次，partial response 又压缩一次，最终答案可能远离原文。

因此每层都携带 evidence IDs，reduce 后执行 citation resolution：把结论映射回支持 TextUnit，找不到原文支持就删去或标为推断。对主题覆盖度、社区多样性与证据一致性分别评分。

## 增量更新与冲突

来源变化会影响 TextUnit、mention、entity、relation、社区和摘要。小改动可增量更新局部图，但社区边界可能全局变化；生产系统通常按成本选择：实时更新原始证据和局部图，定期重算社区与报告。

删除要移除对应 evidence；关系仍有其他支持时保留，否则降级或删除。两个来源互相冲突时，不要让摘要选择“看起来更合理”的一方，图中保留带时间和来源的多个 claim，查询层明确冲突。

当前 [GraphRAG 索引文档](https://microsoft.github.io/graphrag/index/overview/)说明标准管线会抽取实体、关系和 claims，做社区检测、生成多层社区报告并写入向量存储。具体输出表和迁移规则属于当前实现，应在 2026-07-15 之后接入时重新核对。

## 成本、评测与可观测性

图抽取和摘要的离线成本可能显著高于普通分块 embedding。先用代表性子集测量每 TextUnit 调用、社区数、报告 token 和增量重算比例；不要在没有全局问题需求时全量上图。

评测至少包含：

- 抽取与实体消歧 Precision/Recall；
- 关系证据可追溯率和冲突保留率；
- local 的实体/路径 Recall@K；
- global 的主题覆盖、多样性、忠实度；
- 引用是否回到原文；
- 与 baseline RAG 的质量、延迟、成本对比。

按局部、全局、多跳、无图价值和冲突问题分组。线上 trace 保存路由、起点实体、访问社区、图版本、TextUnit IDs 和 token 使用，避免只看到最终答案。

## 小结

GraphRAG 的价值在于把跨段关系与全局结构变成可检索索引：Local 以实体邻域和原文回答具体问题，Global 以社区报告做全局汇总。实体、关系和摘要都是版本化派生物；只有证据链返回原始 TextUnit，图增强才不会变成另一层不可审计的生成。

## 练一练

### 高频考点题 1：Local 和 Global 查询

「这一年事故报告的主要系统性原因是什么？」这类问题适合哪种 GraphRAG 查询？

- A. Local：定位一个关键实体，沿关系扩展它的邻居
- B. Global：筛选相关社区报告，各自生成局部回答，再汇总
- C. 不需要图，用关键词检索「系统性原因」就能找到
- D. 随机选一个社区

**答案：B。** 全局主题问题需要覆盖整个语料，适合社区报告的 map-reduce。「Alice 和供应商 X 有哪些合同关系」这种围绕具体实体的问题才走 Local。

### 高频考点题 2：实体消歧

「苹果」「Apple Inc.」「苹果公司」在图里该怎么处理？

- A. 一律合并成一个节点，减少图里的重复实体
- B. 一律当成三个节点
- C. 删掉原始 mention，只保留标准名称，节省存储
- D. 结合上下文做实体解析，保留原始 mention 的映射记录

**答案：D。** 「苹果」也可能指水果，一律合并会污染图。保留原始 mention 和映射记录，消歧出错时可以回滚。

### 高频考点题 3：GraphRAG 是默认入口吗

「错误码 E42 的配置在哪里？」应该走 GraphRAG 吗？

- A. 通常不用，精确查找走关键词或代码索引更合适
- B. 应该，所有问题都先走图，图里的信息最完整
- C. 应该走 Global 查询
- D. 应该从「E42」节点出发，扩展三跳邻居找配置

**答案：A。** GraphRAG 的价值在跨段关系和全局结构，离线抽取和摘要成本也明显更高。路由器应保留基线检索，按问题类型选路径。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 AI 应用实习面试：模型服务、RAG 与分类评估](../../../interview/kuaishou/ai/kuaishou-ai-15.md)
- [阿里 Agent 实习一面：图文检索、评估与微调实践](../../../interview/alibaba/ai/alibaba-ai-10.md)
<!-- interview-source-history:end -->

## 参考资料

- [Edge et al. — From Local to Global: A Graph RAG Approach](https://arxiv.org/abs/2404.16130)
- [Microsoft GraphRAG — Query Engine](https://microsoft.github.io/graphrag/query/overview/)
- [Microsoft GraphRAG — Indexing](https://microsoft.github.io/graphrag/index/overview/)
