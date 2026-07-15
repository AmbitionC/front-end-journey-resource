向量相似度只能回答“语义上像不像”，不能回答“用户是否有权看、版本是否有效、文档是否已发布”。元数据过滤把租户、权限、语言、产品、时间和文档类型等结构化条件带入检索。但过滤放在什么位置，会同时影响安全、召回和性能。

## 先设计可治理的元数据 Schema

每个块继承文档级元数据，并拥有稳定定位：

```ts
type ChunkMetadata = {
  tenantId: string;
  documentId: string;
  chunkId: string;
  aclVersion: number;
  visibility: "private" | "team" | "public";
  groups: string[];
  product: string;
  version: string;
  language: string;
  validFrom: string;
  validTo?: string;
  contentHash: string;
  deletedAt?: string;
};
```

字段需要明确类型、是否必填、谁产生、如何更新和缺失时怎样处理。权限字段采用拒绝默认：缺少 `tenantId` 或 ACL 的记录不进入可服务索引。日期使用统一时区和可比较格式；枚举值做规范化，避免 `zh-CN`、`zh_cn`、`中文` 被当成不同策略。

![预过滤先缩小集合，检索内过滤由元数据索引与向量搜索协同，后过滤则可能得到过少结果](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-metadata-filtering-pre-post-filter-v1.webp)
*图：严格授权需要在候选生成前或过程中执行；检索完成后的筛除只能作为结果整理。*

## 三种过滤位置

### 预过滤

先根据结构化条件得到允许集合，再在其中做向量搜索。语义清晰，适合租户、版本等强约束；但若实现是先取巨大 ID 列表再传给向量引擎，集合构建可能昂贵。过滤后集合很小时，ANN 索引策略也可能需要调整。

### 检索内过滤

向量引擎在 ANN 遍历过程中结合元数据索引判断候选。[Qdrant 过滤文档](https://qdrant.tech/documentation/search/filtering/)将条件应用于 payload，并建议为经常过滤的字段建立 payload index；[Pinecone](https://docs.pinecone.io/guides/search/filter-by-metadata)也提供 metadata filter 运算。具体执行算法由数据库决定，应通过查询计划、延迟和召回测试验证，而不是仅凭 API 语法判断性能。

### 后过滤

先从全库取 top-k，再在应用层删除不匹配项。它会产生两个问题：无权或过期文档已经进入候选处理链；过滤后可能只剩很少结果，而真正合格文档因没进 top-k 无法补回。因此后过滤不应承担严格授权，只适合非敏感的展示整理，或在已安全过滤的结果上做附加规则。

## 过滤器由服务端构造

客户端可以表达用户选择的语言和产品，但权限条件来自认证会话和策略引擎：

```ts
const authz = await policyEngine.resolve(subject, "document.read");

const filter = {
  must: [
    { key: "tenantId", match: authz.tenantId },
    { key: "groups", any: authz.groupIds },
    { key: "deletedAt", isNull: true },
    { key: "validFrom", lte: now },
  ],
  should: userSelectedLanguage ? [
    { key: "language", match: userSelectedLanguage }
  ] : [],
};
```

示例是领域结构，不对应某个数据库的原样语法。适配器把它编译为目标引擎条件，并进行类型检查和允许字段检查。不能接收客户端传来的任意过滤 DSL，否则可能绕过固定租户条件或制造高成本查询。

## 选择性与 ANN 召回

选择性表示过滤后保留多少数据。极高选择性（只留极少数据）可能让全局 ANN 图中的近邻大多不合格，数据库需要扩大搜索或切换策略；低选择性则可能难以显著节省工作。为常用、高区分度字段建立索引，同时监控索引大小和写入成本。

按过滤组合切片测 Recall@K 和 P95 延迟：单租户、小租户、大租户、多个 group、窄时间窗、旧版本和缺失字段。只用无过滤基准不能代表真实 RAG 查询。

## Namespace 还是 metadata

物理/逻辑 namespace 适合强租户隔离、独立删除和可预测查询；metadata 适合产品、语言、时间等租户内部条件，或确实需要跨集合查询的场景。[Pinecone 多租户指南](https://docs.pinecone.io/guides/index-data/implement-multitenancy)当前推荐 namespace 隔离租户，并指出在单 namespace 中只靠 tenant metadata 对严格隔离和高基数租户不是理想方案。

两者可以组合：namespace 确定租户边界，metadata 在租户内筛选 ACL、版本和语言。不要让用户提供 namespace 字符串后直接查询，仍需从服务端身份映射。

## 写入、更新与删除

过滤可靠性始于摄取。文档和每个块在同一写入事务或可恢复工作流中获得一致元数据；失败时不能留下“向量已写入、ACL 未写入”的半成品。Schema 与 ACL 变更使用版本号，后台重建期间明确双读/双写和切换规则。

撤权与删除需要传播到向量索引、关键词索引、缓存和预生成答案。软删除字段可以快速阻断查询，但最终仍需物理清理与验证。审计记录策略版本和实际编译过滤器的哈希，不记录敏感内容。

## 测试与观测

单元测试覆盖运算符、类型、缺失值、数组、日期边界和逻辑组合；集成测试对比安全参考实现与数据库返回；对抗测试尝试空 tenant、伪造 group、大小写变体和复杂 DSL。

线上记录过滤模板 ID、字段、选择性桶、候选数、过滤后数量、零结果率、延迟和索引版本。若只记录最终 top-k，就无法发现是语义检索失败还是过滤条件过严。

## 常见误区

- 元数据自由文本化，没有类型与枚举治理；
- 先全库召回再过滤权限；
- 直接接受客户端过滤 DSL；
- 建了字段却没建对应元数据索引；
- 只测无过滤 ANN 指标；
- 把 namespace 当成无需鉴权的公开参数；
- 撤权只改业务数据库，不清向量索引和缓存。

## 小结

元数据过滤是一条从摄取 Schema 到检索执行的结构化控制链。严格条件应在候选生成前或过程中执行，常用字段建立适当索引，并按真实选择性评估 ANN 召回与延迟。后过滤可以整理结果，却不能补回漏掉的合格文档，更不能修复已经发生的越权召回。

## 参考资料

- [Qdrant — Filtering](https://qdrant.tech/documentation/search/filtering/)
- [Pinecone — Filter by metadata](https://docs.pinecone.io/guides/search/filter-by-metadata)
- [Pinecone — Implement multitenancy](https://docs.pinecone.io/guides/index-data/implement-multitenancy)
