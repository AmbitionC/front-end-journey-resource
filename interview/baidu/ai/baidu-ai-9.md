公司：百度；方向：后端；来源自述为二面，标题给出 8 月 13 日但未明确年份，部门未明示。本文选录风险控制、缓存与索引三组问题。以下实现步骤、故障时序与数据库版本均为编辑教学补充。

<details data-knowledge-key="agent-guardrails">
<summary>（1）Agent 怎样把意图判断、执行控制和事后反馈连成风险闭环？</summary>
</details>

先把用户目标、对象、约束与授权范围变成可检查的任务信息；不确定时澄清，危险动作进入独立策略与必要的人工审批。输入检查、工具参数检查和最终输出检查分别放在对应边界，执行后记录结果与误拦、漏拦案例，再更新规则和评测。意图分类分数高不等于获得授权。

例如用户说“把这些订单处理掉”，不能直接推断为取消订单。先确认对象和所需操作，再由身份与资源策略判断是否可执行；若业务要求审批，审批应绑定具体订单和操作参数。来自检索或工具的数据也只是证据，不能当成新的控制指令。

[OpenAI 的 Guardrails 与人工审核文档](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)区分输入、输出、工具检查和敏感动作审批，并说明阻塞检查与并行检查的取舍：必须在动作前成立的条件，不能只靠动作已开始后的异步判断。输入护栏也不会自然覆盖所有后续工具边界。

风险闭环还包括真实结果：关联任务、工具调用、策略决定与失败原因，针对越权、提示注入、模糊意图和误拒绝建立回归用例。阈值应依据业务损失和标注样本校准，不能给所有意图套一个固定分数；原帖没有这些数据，以上不是其系统的已验证实现。

延伸阅读：[输入、输出与工具 Guardrails](../../../knowledge/llm/production/agent-guardrails.md)。

<details data-knowledge-key="redis-cache">
<summary>（2）大量缓存同时过期时怎样保护数据库，双写一致性有什么边界？</summary>
</details>

把过期时刻分散，并合并同一热点的并发回源，再给数据库回源设置并发、超时和降级边界。旁路缓存可先提交数据库再失效缓存，删除失败需要可恢复的重试；TTL、互斥重建或延迟双删都不能单独证明缓存与数据库强一致，关键业务动作仍在权威事务中校验。

大量 key 使用相同 TTL 会让回源在同一时间集中。受控的 TTL 抖动可分散计划过期；同 key 的请求可以合并重建，其他请求有界等待或按允许的旧值窗口返回。数据库已经饱和时，应限制回源而不是让所有缓存 miss 无条件直达数据库。抖动范围和允许旧值时间要由实际业务与负载决定，没有通用秒数。

[Redis 的 cache-aside 说明](https://redis.io/docs/latest/develop/use-cases/cache-aside/)介绍了主存储变更后失效缓存、下次读取再填充的模式。它仍有并发窗口：请求 A 先读到旧数据库值但迟迟未回填，请求 B 提交新值并删缓存，A 随后却把旧值写回。可结合数据版本、受控回填、可靠失效和 TTL 缩小窗口，不能只说“先写库再删缓存就完全一致”。

教学上还应区分两件事：缓存过期造成的压力问题，以及读到旧数据的一致性问题。前者看 miss、回源并发、等待和数据库饱和；后者看数据版本、失效失败与旧值寿命。付款、权限等强约束动作应回到权威存储确认，不依赖一份允许过期的缓存视图。

延伸阅读：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

<details data-knowledge-key="mysql-index">
<summary>（3）聚簇索引与非聚簇索引怎样组织数据，什么时候需要回表？</summary>
</details>

以 MySQL 8.4 InnoDB 为例，聚簇索引叶子保存行，二级索引保存索引列和主键。沿二级索引找到主键后，取缺失列通常要再访问聚簇记录，这就是回表；列被覆盖可减少这类访问，但 MVCC 可见性检查仍可能需要聚簇记录，不能承诺覆盖索引必然零回表。

教学表 users(id, email, bio) 以 id 为主键、email 建二级索引。按 email 查 bio 时，先在 email 索引找到 id，再到聚簇索引取 bio；若只需要已在索引中的 email 和 id，列覆盖可以减少为取额外字段进行的访问。这里的表与查询不是原题输入。

[MySQL 8.4 的聚簇与二级索引说明](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-index-types.html)还给出聚簇键的选择顺序：优先主键；没有主键则使用第一个全部列非空的唯一索引；再没有才生成隐藏行标识。二级记录携带主键，较宽的主键也会增加其空间。

不要把“按键组织”解释成所有磁盘块永远物理连续，也不要把其他数据库的非聚簇结构直接套进 InnoDB。实际查询成本还取决于扫描范围、行数、缓存和版本可见性，需要结合执行计划和真实负载判断；原帖未给这些条件。

延伸阅读：[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)。

## 参考资料

- [OpenAI：Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)。
- [Redis：Cache-aside invalidation](https://redis.io/docs/latest/develop/use-cases/cache-aside/)。
- [MySQL 8.4：Clustered and secondary indexes](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-index-types.html)。
