字节跳动 · 全栈方向 · 二、三面。面试经历为候选人自述，未独立证实；这些是同一流程的后续轮次，回答为独立整理，不代表作者项目实现或企业标准答案。

<details data-knowledge-key="agent-project-evaluation">
<summary>（1）怎样讲清两个项目的背景、难点和解决办法？</summary>
</details>

先说明用户问题与原有方案，再讲自己负责的边界、约束、选择和验证结果。把个人贡献与团队成果区分，用可复现证据说明改动为何有效；没有测量的数据不补造百分比，复杂技术数量也不等于项目价值。

<details data-knowledge-key="mysql-index">
<summary>（2）数据库表设计与索引怎样说明？</summary>
</details>

先按业务实体、关系和一致性要求设计键及约束，再根据实际查询、排序和过滤设计索引。索引加速读取也增加写入与存储成本，要用执行计划和代表性负载验证，不能只回答给每列加索引。

<details data-knowledge-key="api-idempotency">
<summary>（3）幂等键应该怎样设置？</summary>
</details>

标识同一个业务意图，而非每次重试生成新键；服务端校验同键请求内容并保存处理结果，通过唯一约束和事务协调去重与实际写入。键本身不保证幂等，超时后仍要根据服务契约查状态或安全重试。 [AWS Builders Library：幂等请求与安全重试](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)。

<details data-knowledge-key="rag-pipeline">
<summary>（4）RAG 存什么，怎样召回？</summary>
</details>

保存正文及其文档、块位置、版本和权限信息，向量或关键词索引用于定位候选。查询先限制可访问范围，再召回、融合和重排，取可引用的上下文供生成；索引命中不等于事实可靠，也不能省略更新和删除传播。

<details data-binding-status="pending_semantic_verification">
<summary>（5）栈与堆怎样区分？</summary>
<p>关联知识点待核实。</p>
</details>

常见运行时用栈组织函数调用和局部执行状态，用堆承载动态分配对象；线程有独立执行栈，同进程可以共享堆数据。实际对象布局与生命周期取决于语言和优化，不能仅凭变量写在哪就断言物理存储位置。

<details data-knowledge-key="redis-data-structure">
<summary>（6）Redis 常用数据结构怎样用于项目？</summary>
</details>

按操作需求选择字符串、哈希、列表、集合或有序集合，例如缓存值、对象字段、序列、去重和按分数排名。说明键、过期、容量及原子操作边界；Redis 不会因放在内存就自动与数据库一致，也不适合无限堆积数据。

<details data-knowledge-key="garbage-collection">
<summary>（7）垃圾回收的基本机制是什么？</summary>
</details>

以追踪式 GC 为例，运行时从根集合追踪可达对象，再回收不可达内存，具体策略可能结合分代、增量或并发处理。对象仍被引用时，GC 不会按业务意图主动释放；语言不同，资源释放模型也不同，不能把 GC 等同于文件和连接都已关闭。 [V8：从可达对象理解垃圾回收](https://v8.dev/blog/trash-talk)。

<details data-knowledge-key="mysql-index">
<summary>（8）查询 a&gt;10 且 b=1 时，联合索引如何考虑？</summary>
</details>

可先考察 (b,a)，利用 b 等值限定后在 a 上做范围扫描，再用数据分布、其他查询和执行计划比较备选。原题只给条件，没有表规模和现有索引，不能保证这一顺序始终最优；覆盖索引与回表成本也会影响选择。 [MySQL：多列索引与最左前缀](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)。

<details data-knowledge-key="algorithm-array">
<summary>（9）回文串匹配题应该怎样开始？</summary>
</details>

先确认要求是判断整串、找子串还是其他匹配，并确定字符及大小写规则。若是判断整串，可用首尾双指针逐步向中间比较，时间 O(n)、额外空间 O(1)，但这个方案不能直接回答最长回文子串；题面未披露的细节不补造。

<details data-knowledge-key="agent-resume-interview">
<summary>（10）怎样说明实习安排并展示项目与参与范围？</summary>
</details>

如实说明可投入时间与约束，展示一条可验证的用户任务、交付物和失败处理，再区分本人和团队负责的部分。用实际代码、演示及验证说明能力，不编造项目人数、业务规模或招录结果。

<details data-knowledge-key="agent-architecture">
<summary>（11）怎样解释 ReAct 的行动反馈循环？</summary>
</details>

模型结合目标与观察提出行动，应用执行受控工具并返回结果，再据此继续决策。关键是决策、执行和观察的闭环；权限、预算和验收由程序落实，不需要把隐藏推理全文公开，也不能把有工具调用都视为某一种固定提示模板。

<details data-knowledge-key="algorithm-loop">
<summary>（12）含 ? 和 * 的字符串匹配怎样实现？</summary>
</details>

先确认 ? 是否匹配一个字符、* 是否匹配任意长度字符串。按这个约定，动态规划记录前 i 个输入与前 j 个模式能否匹配；普通字符和 ? 从对角转移，* 取空串或继续消耗输入。要处理空串与连续星号，基本表法为 O(nm) 时间。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [AWS Builders Library：幂等请求与安全重试](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)（设计原理）
- [V8：从可达对象理解垃圾回收](https://v8.dev/blog/trash-talk)（2019 年机制说明）
- [MySQL：多列索引与最左前缀](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)（MySQL 8.4）
