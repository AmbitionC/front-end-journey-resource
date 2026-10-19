问题选自作者自述的网易云全栈一面记录。以下短答用于备面讲解，不代表作者当场作答。原记录标注10/13，未确认面试年份；不据歌曲场景推断具体部门。

<details data-knowledge-key="agent-feedback-loop">
<summary>（1）怎样让用户反馈形成闭环，而非只是收集不满意？</summary>
</details>

将反馈关联到具体版本和脱敏trace，按理解、检索、工具、事实或体验问题分类，形成可复现案例，再验证候选改动并回归相邻场景。离线通过后观察线上影响和回滚指标；不能把单个差评直接写成全局prompt。

<details data-knowledge-key="agent-intent-clarification">
<summary>（2）意图识别是否一定准确，遇到多个意图怎么办？</summary>
</details>

识别是有误差的决策，需定义允许标签、拒判与澄清路径，并用多意图及边界样例评测。多意图先拆请求，判断依赖和权限，独立任务可并行，有依赖则排序；歧义会改变结果时先澄清，不强行归入单标签。

<details data-knowledge-key="llm-capability-boundaries">
<summary>（3）Agent 出现幻觉，应怎样定位与缓解？</summary>
</details>

先区分缺证据、召回失败、工具结果误读和生成推断错误，再补可信证据、限制回答范围并校验结果。没有支持时说明不确定或拒答；RAG与提示词都不能保证零幻觉，应评测事实与引用是否一致。

<details data-knowledge-key="agent-event-driven">
<summary>（4）跨系统的 N 个长子任务全结束后再执行下一步，如何设计？</summary>
</details>

使用持久化父子任务状态和唯一子任务ID，通过消息或回调推进；所有必需子任务成功后，以原子状态转换发布一次后续事件。重复、乱序、迟到回执、超时和失败终态都要有明确处理，不能用常驻线程等待或单纯计数每次回调。

<details data-knowledge-key="agent-event-driven">
<summary>（5）多个并行子任务的完成，怎样避免重复触发后续流程？</summary>
</details>

把每个子任务的完成作为幂等事实；各处理器以一致锁序先锁同一父运行行，再去重回执、更新子状态，并按能看到前一提交的隔离协议检查必需子任务；全部成功时以条件更新推进父状态，并在同一事务写后续outbox。至少一次投递时下游还须幂等；“回调只来一次”不是可以依赖的假设。

<details data-knowledge-key="redis-data-structure">
<summary>（6）百万歌曲 ID 的标签成员判断，怎样使用 Redis Set？</summary>
</details>

先确定标签与歌曲ID的权威映射及更新要求；可按标签维护Redis Set，用成员查询检查歌曲ID，并测量集合规模、内存和热点。集合回答的是所存版本里的成员关系，缓存必须与权威数据保持约定的新鲜度；要求严格当前存在时仍需查询权威记录。

<details data-knowledge-key="mysql-index">
<summary>（7）版权方和生效状态筛选歌曲，查询与索引如何配合？</summary>
</details>

在字段与参数合同确定后，用版权方与状态作等值条件，返回歌曲ID。候选联合索引可从(copyright_id,status,song_id)出发，用执行计划和真实数据分布验证扫描、回表与排序；列名和DDL只是教学假设，未在数据库执行。

<details data-knowledge-key="api-pagination-filtering">
<summary>（8）每批最多 1000 条，遍历数百万歌曲时怎样选游标？</summary>
</details>

选稳定且能形成全序的键，按大于上次键值继续查询并排序LIMIT 1000。若歌曲ID不唯一，用唯一行ID或(song_id,id)复合游标并建立匹配索引；明确并发插入删除下要快照还是实时遍历，必要时固定快照或边界。仅用大OFFSET会随页数增加扫描成本。

