### 飞书后端一面：锁粒度与混合检索

候选人自述为字节跳动飞书一面。原问说明工作以后端工程为主，团队主栈为Go，并涉及AI知识库和内部工具；面试日期未披露。

面试经历、岗位方向与轮次来自候选人自述，未独立认证。下列短答与教学例子由编辑补充，不是候选人现场答案或企业标准答案。

<details data-knowledge-key="redis-distributed-lock">
<summary>（1）全局锁改成分片锁时，怎样选择粒度并保住正确性？</summary>
</details>
<p>先明确哪些并发操作必须共同互斥，再让同一业务资源的修改稳定映射到同一锁；没有共同约束的资源才拆开并行。粒度过粗增加无关等待，过细可能漏掉跨资源约束，多资源操作还需一致的锁序、事务或其他协调。分片后仍要原子获取租约、校验所有权再释放，并处理过期持有者与下游陈旧写入。用竞争率、等待时间和一致性场景验证，不能仅凭锁数增多断言优化成功。</p>

<p>教学例子（非原项目锁设计）：同一会话的两次写入应命中同一资源锁，不同独立会话可并行；若两次操作还更新共同计数，仅按会话拆锁便不足以保护该共享约束。</p>

技术核对：[Redis：分布式锁协议](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)。

知识导航：[Redis 分布式锁：租约、续期与故障边界](../../../knowledge/backend/database/redis-distributed-lock.md)。

<details data-knowledge-key="rag-hybrid-search">
<summary>（2）混合检索中，向量库、HNSW、BM25 与 Rerank 各负责什么？</summary>
</details>
<p>向量库承载向量及相关元信息的存储和查询，HNSW是常见的近似近邻图索引，用来在召回与延迟间取舍；它本身不是完整数据库。BM25提供词法相关性候选，向量路线补充语义表达差异。各路结果先按约定融合去重，再由Rerank对已有候选精排，不能靠重排补回漏召回证据。权限、版本和来源约束贯穿检索与上下文组装，最终用同一评测集检查质量和成本。</p>

<p>教学例子（非原项目配置）：错误码查询可由词法路保住精确标识，现象描述可由向量路补充同义表达；融合后的候选再精排。若正确文档根本没进入候选池，换重排器无法凭空找回它。</p>

技术核对：[pgvector：HNSW索引](https://github.com/pgvector/pgvector)、[Sentence Transformers：Cross-Encoder](https://sbert.net/examples/cross_encoder/applications/README.html)。

知识导航：[Hybrid Search 混合检索](../../../knowledge/llm/rag/rag-hybrid-search.md)。
