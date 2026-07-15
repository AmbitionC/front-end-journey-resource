RAG 会把原始文档切块、嵌入、索引、缓存并重新组合，权限边界也必须沿着这条链复制。只在最终答案前要求模型“不要泄漏机密”没有意义：无权片段一旦被召回，就可能进入提示、日志、缓存或后续工具。正确做法是服务端在检索前决定权限，并让每个派生物都可追溯到租户与策略。

## 用主体—资源—动作—环境表达策略

一次检索授权至少包含：

- **主体**：用户、服务身份、角色、组、租户；
- **资源**：文档、数据集、项目、块及其分类；
- **动作**：读取、检索、引用、导出、管理；
- **环境**：时间、设备、地区、会话风险和用途。

```ts
type PolicyInput = {
  subject: { userId: string; tenantId: string; groups: string[] };
  action: "document.retrieve";
  resource: { datasetId: string; classification?: string };
  context: { now: string; region: string; purpose: string };
};

const decision = await policyEngine.evaluate(input);
if (!decision.allow) throw new ForbiddenError();
const results = await vectorStore.search(queryVector, decision.compiledFilter);
```

策略引擎返回允许/拒绝、可用 namespace、过滤条件、策略版本和审计原因。检索层只接受签名或内部构造的决策结果，不接受客户端提交的 tenant 过滤器。

![用户身份经策略引擎生成授权过滤，并贯穿摄取、命名空间、索引、缓存、上下文、删除与审计](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-access-control-tenant-boundary-v1.webp)
*图：三个租户的派生数据始终隔离；任何跨租户候选在进入上下文前被阻断。*

## 零信任原则怎样落到 RAG

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) 强调不因网络位置或资产归属自动给予信任，并在访问资源前分别进行认证与授权。对 RAG 来说，“请求来自内网”“用户已登录”或“模型是公司部署的”都不能代替文档级授权。

每次查询都基于当前主体和策略生成过滤；长会话也不沿用永久授权快照。用户退出组、文档改密级或租户停用后，新请求立即使用新决策，已有缓存和会话上下文按撤权策略失效。

## 摄取阶段就要带上权限

文档进入系统时验证来源、租户和 ACL，把权限标签复制到每个 chunk、关键词记录和向量。向量写入与 ACL 写入必须原子化或具备补偿：不能出现有 embedding 但无 tenant 标签的记录。缺少关键权限字段时拒绝索引，而不是默认公开。

保存 `sourceAclVersion`、`policySchemaVersion` 和内容哈希。文档移动、共享或撤权时，后台任务能找到所有派生块并更新或重建。摄取服务本身也使用最小权限身份，只能写目标租户分区。

## Namespace 与 metadata 的组合

严格多租户常以 namespace、独立集合或独立索引作为第一道隔离，再在租户内用 metadata 表达项目、组和文档 ACL。[Pinecone 当前多租户指南](https://docs.pinecone.io/guides/index-data/implement-multitenancy)推荐用 namespace 隔离租户，指出单 namespace 加 tenant metadata 对严格隔离和高基数租户可能带来成本与延迟问题。

[Qdrant 多租户指南](https://qdrant.tech/documentation/guides/multiple-partitions/)提供面向多租户 payload 的分区/索引能力。无论数据库怎样实现，都要验证三件事：租户路由由服务端决定、过滤字段有合适索引、删除/备份/恢复不会跨租户混合。

物理隔离更强、运维成本更高；共享索引加过滤更灵活，但对过滤正确性和数据库实现要求更高。按法规、客户规模、噪声邻居风险和恢复目标选择，不要只看开发方便。

## 缓存是最容易漏掉的旁路

查询 embedding、检索结果、重排结果和最终答案缓存都可能泄漏。缓存键至少包含租户、主体/权限集合摘要、策略版本、数据集版本、查询和模型/检索版本：

```text
tenant:{tenantId}:authz:{policyHash}:dataset:{version}:query:{queryHash}
```

若资源是用户私有，不能仅用 group 摘要。缓存值也保存来源 ID，撤权或删除时按反向索引失效。不要在共享 CDN 缓存带私有上下文的回答；HTTP `Vary` 也无法替代业务级授权隔离。

## 上下文、工具与日志继续执行同一策略

检索返回后，在组装上下文前核对结果携带的 tenant/ACL 与当前决策，作为纵深防御。重排器只看到已授权候选。模型提出“读取完整文档”工具调用时，再次对目标资源授权，不能因为片段已出现就推导出全文权限。

日志记录主体、租户、策略版本、资源 ID、允许/拒绝和 trace ID，默认不写完整片段、embedding 或提示。离线评测、标注和故障采样使用同样租户隔离与审批，不能把生产数据复制到一个公共分析桶。

## 撤权与删除要贯穿派生链

删除文档不是只删业务数据库行。清单应覆盖：原文件、解析文本、chunks、embedding、关键词索引、检索/答案缓存、快照、评测副本和授权允许的日志。先用 tombstone 阻止查询，再异步物理清理，并通过 source ID 验证所有派生物消失。

备份有独立保留期和恢复授权。恢复演练必须确认旧 ACL 不会覆盖新策略，已删除数据不会无意重新上线。

## 对抗性测试

至少自动验证：

- 用户 A 查询用户 B 的唯一标识符返回零候选；
- 伪造 tenant、namespace、group 和文档 ID 被拒绝；
- 空 ACL、脏元数据和索引写入半失败默认不可见；
- 重排、缓存、引用与工具不会重新引入无权内容；
- 撤权后新查询、旧会话和缓存都失效；
- 管理员跨租户操作有独立高权限路径和审计；
- 备份恢复后隔离性质仍成立。

安全测试不仅检查最终答案，还检查候选 ID、trace、日志和缓存，防止“模型没说出来”掩盖越权召回。

## 常见误区

- 依赖模型提示或拒答保护机密；
- 先全库召回，再在应用层后过滤；
- tenant ID 直接来自客户端参数；
- 文档有 ACL，chunk 和 embedding 却没有；
- 检索隔离了，重排/答案缓存未隔离；
- 撤权只影响新摄取，不清旧索引与会话；
- 只测答案文本，不看候选和日志是否越权。

## 小结

RAG 权限是一项端到端不变量：可信身份产生服务端策略，策略在摄取与检索中执行，namespace/metadata、缓存、上下文、工具、日志和删除都继承同一租户边界。模型拒答可以改善表达，却永远不能修复已经越权进入系统的证据。

## 参考资料

- [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [Pinecone — Implement multitenancy](https://docs.pinecone.io/guides/index-data/implement-multitenancy)
- [Qdrant — Multitenancy](https://qdrant.tech/documentation/guides/multiple-partitions/)
