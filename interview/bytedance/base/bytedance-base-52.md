以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

原帖“暑数据结构”含义不明，不擅改为其他术语。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）拷打实习</summary>
</details>

用真实职责和一项可验证改进说明实习能力，分清团队协作与个人产出。问题只记了类别，不补造具体业务追问。

<details data-binding-status="pending_semantic_verification">
<summary>（2）如何提升AI生成质量？</summary>
<p>关联知识点待核实。</p>
</details>

先定义质量标准和测试样例，再分类修复证据、提示、工具与输出问题。用同一基线比较正确率和任务成功率，不能只靠更换模型或主观体感。

<details data-knowledge-key="llm-capability-boundaries">
<summary>（3）什么是幻觉？解决方案？</summary>
</details>

幻觉是输出与事实或给定证据不符的现象；应补证据、明确拒答、校验关键字段并回归测试。RAG、提示与微调各解决不同原因，都不能保证完全消除。

<details data-knowledge-key="rag-reranking">
<summary>（4）Rerank详细讲一下？</summary>
</details>

先用便宜召回取候选，再由重排模型联合评估查询与片段相关性，选少量进入上下文。候选缺失时重排无法补回，效果与额外时延、成本需要一起测。

<details data-knowledge-key="multi-agent">
<summary>（5）多智能体系统设计架构？</summary>
</details>

先定义每个智能体的任务、私有上下文、共享事实与协调者，再明确通信、归并和终止。能由单流程完成的任务先用简单方案，多角色会增加错误和成本。

<details data-knowledge-key="agent-concurrency">
<summary>（6）上下文管理？怎么确保多智能体系统并行而不是读同一个上下文？</summary>
</details>

给每个 run 或子代理独立上下文快照与写入空间，共享事实由明确所有者按版本更新。并行不代表完全不共享，但不能让多个任务直接修改同一可变对话对象。

<details data-knowledge-key="database-models">
<summary>（7）mysql/pgsql区别？暑数据结构？</summary>
</details>

MySQL 与 PostgreSQL 都是关系数据库，需按查询、扩展、事务与运维要求比较具体版本。原帖“暑数据结构”含义不明，先澄清，不能擅自改成树结构并编答案。

<details data-knowledge-key="redis-distributed-lock">
<summary>（8）Redis内存竞争？分布式锁？</summary>
</details>

先明确“内存竞争”指资源容量还是并发数据更新；分布式锁解决跨实例互斥的一部分。使用带 token 和租约的原子加锁、比较释放，并说明续期失效和故障切换边界。

<details data-knowledge-key="redis-cache">
<summary>（9）Redis缓存策略？更新策略？</summary>
</details>

按缓存旁路、写穿等策略确定读写顺序、失效和 TTL，选择取决于一致性要求。写数据库成功后可靠失效常见，但仍需处理通知失败、并发旧值回填和版本冲突。

<details data-knowledge-key="redis-data-structure">
<summary>（10）为什么用Stream？</summary>
</details>

若指 Redis Streams，它提供日志式条目、消费组与待确认记录，适合某些异步消费场景。ACK 不保证业务恰好一次，仍需幂等、故障恢复与保留策略。

<details data-knowledge-key="redis-cache">
<summary>（11）更新策略？Redis旧数据库新咋办？</summary>
</details>

数据库更新后应可靠删除或更新缓存，并用 TTL、版本或变更订阅兜底。先定义可接受的陈旧时间；固定延时双删不能覆盖所有竞态与失效失败。

<details data-knowledge-key="redis-cache">
<summary>（12）缓存击穿/穿透/雪崩？</summary>
</details>

穿透是查不存在数据，可用校验、短期空值或过滤器；击穿是热点失效，可用合并加载；雪崩是大量同时失效，可错开 TTL、限流降级。方案须同时保护数据库和恢复路径。

<details data-knowledge-key="algorithm-sorting">
<summary>（13）手撕：LeetCode 768</summary>
</details>

LC768 允许重复值，可用单调栈记录每块最大值，遇到更小值时合并违反跨块顺序的块并保留合并最大值。不能套只适用于 0 到 n−1 排列的前缀最大值判定。
