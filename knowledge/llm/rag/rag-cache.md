RAG 缓存不是一个 `query → answer` 字典。Embedding、召回、重排、压缩上下文和最终答案具有不同输入、权限边界与失效条件。把它们混在一起，最危险的不是 miss，而是把旧索引或另一个权限域的结果当作新鲜命中。

## 五层缓存，五种键

### Embedding Cache

```text
key = hash(normalized_text, embedding_model, preprocessing_version)
```

若文本不含租户敏感信息且服务做加密隔离，可在受控范围复用；否则仍按 tenant 分区。维度、模型或预处理改变即失效。

### Retrieval Cache

```text
key = hash(tenant, acl_digest, index_version,
           normalized_query, filters, top_k, retrieval_policy)
```

缺少 `acl_digest` 或 `index_version` 会导致越权或返回旧证据。顺序和分数也属于结果，不能只缓存 ID 集合后假设新策略仍相同。

### Rerank Cache

```text
key = hash(query, ordered_candidate_hashes,
           reranker_version, truncation_policy, top_n)
```

候选顺序、文本内容或 reranker 改变都需要新键。

### Context Cache

压缩/装配键包含候选、token 预算、压缩器、引用策略和 ACL。它不能跨权限域复用生成摘要，因为摘要可能已经吸收受限信息。

### Answer Cache

```text
key = hash(prompt_version, model_version, user_intent,
           evidence_hashes, index_version, tenant, acl_digest)
```

个性化、会话状态、时间敏感或高风险问题通常不适合长时间答案缓存。

![RAG 五层缓存各有自己的键：Embedding 键含文本、模型和预处理版本；召回键含 tenant、ACL 摘要、索引版本、query、filter 和 top_k；重排键含 query、候选顺序、reranker 版本和截断策略；上下文键含候选、token 预算、压缩器、引用策略和 ACL；答案键含 Prompt、模型版本、证据 hash、索引版本、tenant 和 ACL。下方矩阵列出事件让哪些层失效：来源变更或删除、ACL 变化走高优先级通道立即失效召回、上下文和答案；索引切换让召回之后全部换键；reranker 升级影响重排；生成模型升级影响答案；Prompt 变化影响上下文和答案；Embedding 模型变化影响 Embedding 并重建索引。TTL 只做兜底上限](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-cache-layer-keys-invalidation-v2.dark.png)
*图：上排是五层缓存各自的键，下方矩阵是哪些事件让哪些层失效：删除和 ACL 变化立即删，版本类变化靠键里的版本自然 miss，TTL 只兜底。*

## TTL 只是最后一道上限

TTL 可以限制最坏陈旧时间，却不知道来源刚刚删除或权限刚收回。更可靠的是事件失效：

- source change/delete → retrieval、context、answer；
- ACL change → 所有带权限结果；
- index switch → retrieval 之后全部自然换键；
- reranker/model change → 对应层；
- Prompt change → context/answer；
- embedding model change → embedding 与新索引构建。

[RFC 9111](https://datatracker.ietf.org/doc/html/rfc9111)定义 HTTP 缓存键、验证和 unsafe method 后的失效，体现了同一原则：缓存必须知道变体与状态改变；“invalidate”意味着删除或标成必须重新验证。

事件可能丢失，所以键中仍包含版本，TTL 负责兜底。删除与 ACL 收紧使用高优先级失效通道，不等待普通 TTL。

## Cache-Aside 与一致性

典型流程：读缓存，miss 后读事实源，再写缓存；更新先写事实源，再删除缓存。Context7 核对的 [Redis Cache-Aside 文档](https://redis.io/docs/latest/develop/use-cases/cache-aside/)也使用 TTL 限制陈旧，并在更新后删除相应 key。

写后删仍有竞争：旧读在更新前读取，更新删除后又把旧值写回。可以使用版本化 key、比较 source/index version 后再写，或短租约。不要用分布式缓存锁替代事实源事务。

## 负缓存与无答案

“无结果”缓存能保护下游免受重复无效查询，但 TTL 要短，键同样包含 indexVersion 和 filter。权限拒绝不是可共享的无结果；按主体/策略决策处理。

不要缓存模型的“我不知道”作为长期答案。更安全的是缓存检索为空的结构化状态与时间水位，新数据到达后通过 indexVersion 自然失效。

## 防止 Stampede

热门 key 同时过期会触发大量重算。常用策略：

- single-flight：同 key 只有一个重算，其余等待；
- jittered TTL：避免整批同时过期；
- stale-while-revalidate：低风险场景短暂返回旧值并异步刷新；
- request coalescing：批量 embedding 或 retrieval。

Stale serving 必须显示证据时间，并受风险策略约束。合规删除、权限变化和实时数据不能返回 stale。

## 语义答案缓存更危险

语义缓存把相似 query 映射到旧答案。两个句子 embedding 接近，不代表过滤器、日期、主体或否定一致。必须先比较结构化约束，再做语义匹配；候选答案仍验证 evidence/version/ACL。

缓存项可包含：规范化意图、约束、答案、证据 hash、生成模型、创建时间和安全标签。相似度阈值在反例集上校准；医疗、财务、权限和实时问题默认禁用或严格复核。

## Prompt Cache 与业务缓存不同

当前 [OpenAI Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)依赖精确前缀匹配，并建议把稳定指令放前、变量内容放后；截至 2026-07-15，长 Prompt 达到当前门槛后自动参与缓存，具体阈值、模型和计费会变化。

Prompt cache 减少模型重复处理前缀，不代表答案缓存，也不负责 RAG 证据新鲜度。业务层仍要做 index/ACL 版本键与失效。

## 隐私与隔离

缓存值加密、访问审计、按 tenant namespace 和容量配额隔离。Key 不直接包含敏感原文，用 HMAC 或稳定摘要；但 hash 也可能被字典攻击，不能当脱敏。

多租户共享 embedding 前要证明同一文本不泄漏存在性；日志不打印完整 Prompt、证据或答案。删除请求需要遍历可定位的 key/索引关系，不能依赖不可枚举的随机键。

## 指标

每层分别监控 hit/miss、fresh hit、stale serve、计算节省、p95、错误、驱逐、失效延迟、single-flight 等待和按租户容量。总体命中率高却答案陈旧不是成功。

做 correctness probe：定期绕过缓存重算，与命中值比较；按 source delete、ACL change、index switch、model/Prompt upgrade 演练失效。观察缓存开启前后的质量，而不只看延迟。

## 小结

RAG 缓存的核心是“键即契约”：每层键完整描述输入、权限、索引和模型版本，事件失效处理状态变化，TTL 只做上限。命中还要检查新鲜度；语义缓存、stale serving 和跨租户复用需要更严格的风险证明。

## 练一练

### 高频考点题 1：检索缓存的 key

多租户知识库给检索结果加缓存，key 只用了「规范化后的 query」。最可能出现什么问题？

- A. 缓存命中率太低，因为同一问题的不同表述无法共享缓存
- B. 不同权限的用户共用结果导致越权，索引更新后还会返回旧结果
- C. 向量维度不一致
- D. 只会多占一点内存，缓存内容本身没有正确性问题

**答案：B。** 检索缓存的 key 要带上会影响结果的东西，至少包括权限摘要（acl_digest）和索引版本（index_version）。缺了前者是越权，缺了后者是读到旧数据；命中率和内存只是次要问题。

### 高频考点题 2：失效策略

关于 RAG 缓存失效，哪种做法更稳妥？

- A. 只靠 TTL，过期后自然会读到新数据，实现最简单
- B. 永不过期，命中率最高，数据变化时手动清空即可
- C. 以事件驱动失效为主，TTL 只做兜底上限
- D. 每次请求都清空缓存

**答案：C。** 只靠 TTL 意味着在过期前一直可能返回旧内容或越权内容；事件驱动失效能在源数据变化时及时清理，TTL 用来兜住漏掉的情况。D 等于没有缓存。

### 高频考点题 3：哪种缓存风险最高

下面哪类缓存最需要谨慎，一般要严格的相似度阈值、范围限制并可随时关闭？

- A. 语义答案缓存：相似问题直接复用上一次生成的答案
- B. Embedding 缓存：同一段文本复用之前算好的向量
- C. Prompt cache：复用模型侧相同前缀的计算结果
- D. 对热门 query 做 single-flight 合并请求

**答案：A。** 语义相近不等于答案相同，「怎么开通」和「怎么关闭」向量可能很近，复用答案会直接答错。Embedding 缓存对同一文本是确定的；prompt cache 只省前缀计算，不是答案缓存；single-flight 是防击穿手段。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手效果营销实习一面：意图路由、模型容错与业务校验](../../../interview/kuaishou/ai/kuaishou-ai-18.md)
- [字节 Agent 与全栈：视频工作流、工具权限与 RAG](../../../interview/bytedance/base/bytedance-base-42.md)
<!-- interview-source-history:end -->

## 参考资料

- [RFC 9111 — HTTP Caching](https://datatracker.ietf.org/doc/html/rfc9111)
- [Redis — Cache-Aside](https://redis.io/docs/latest/develop/use-cases/cache-aside/)
- [OpenAI — Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)
