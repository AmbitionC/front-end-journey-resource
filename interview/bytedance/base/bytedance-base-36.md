字节跳动 · AI 应用方向 · 一、二面。面试经历为候选人自述，未独立证实；合并同主题追问，短答为独立整理，不把记录中的个人项目收益当成已验证结论。

<details data-knowledge-key="agent-project-evaluation">
<summary>（1）怎样介绍实习业务、数据规模和数据库优化？</summary>
</details>

先讲业务访问模式、数据量和服务约束，再明确个人改动、选择依据及同条件验证结果。是否分库分表取决于容量、负载和事务边界，不因数据多就直接拆；未测量的量级、收益和个人贡献不补造。

<details data-knowledge-key="mysql-index">
<summary>（2）MySQL 索引为什么有效，什么时候失效或仍然很慢？</summary>
</details>

索引按有序键缩小访问范围，效果取决于选择性、联合索引顺序和回表数量。函数、类型转换或不符合索引前缀等情况可能影响使用，优化器也可能选择扫描；检查实际执行计划和耗时，不能用存在索引保证更快。 [MySQL：多列索引与最左前缀](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)。

<details data-knowledge-key="mysql-index">
<summary>（3）慢查询怎样排查和优化？</summary>
</details>

先定位具体 SQL、参数、负载和慢的阶段，再看扫描行数、索引、排序、锁等待与返回数据量。用代表性条件验证索引或查询改写，并观察写入和其他查询影响；只凭某次快了不能证明稳定收益。

<details data-knowledge-key="mysql-index">
<summary>（4）什么是回表，怎样理解顺序与随机 I/O？</summary>
</details>

以 InnoDB 为例，二级索引找到主键后再读聚簇记录，额外页访问可能增加代价；覆盖索引可减少这一步。访问模式、缓冲池命中和存储设备共同决定耗时，不能把每次回表都等同于一次磁盘随机读。

<details data-knowledge-key="redis-cache">
<summary>（5）Redis 的主从、哨兵和集群分别解决什么？</summary>
</details>

复制提供数据副本，Sentinel 监控并协调故障转移，Cluster 通过槽分片分布数据并结合复制。性能还与访问结构、命令成本、网络和持久化配置有关；复制通常是异步的，故障切换不能自动保证所有已确认写入都保留。 [Redis：Sentinel 与异步复制的故障边界](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)。

<details data-knowledge-key="redis-cache">
<summary>（6）Redis 和 MySQL 混用怎样考虑一致性？</summary>
</details>

常见做法是数据库承担权威写入，缓存服务读加速，并明确更新、失效和过期策略。并发写入与旧结果回填可能产生陈旧缓存，应按业务设计版本、事件或延迟双删等处理并验证故障窗口；不能宣称加缓存就强一致。

<details data-knowledge-key="agent-coding">
<summary>（7）怎样说明 Vibe Coding 和日常 AI 开发方式？</summary>
</details>

可以用自然语言推动实现，但需求、补丁和验收应落到可检查的仓库状态。先设边界，按小任务生成、运行相关检查并复核 diff；描述真实使用过程与失败处理，不把能生成演示当作工程完成。

<details data-knowledge-key="agent-skill-design">
<summary>（8）怎样理解 Skill？</summary>
</details>

Skill 是可复用的任务指导和材料，按需要加载，帮助模型执行特定流程。设计时说明适用条件、步骤、输入输出和验证方式，并做版本及失败治理；加载一份文档不会自动获得工具权限，也不能保证输出正确。

<details data-knowledge-key="algorithm-linked-list">
<summary>（9）怎样按约定重排链表，并达到 O(n) 时间、O(1) 额外空间？</summary>
</details>

记录中的文字描述与示例顺序不一致，应先确认目标顺序；若要求首节点、尾节点、次首节点、次尾节点交替，可用快慢指针分段、反转后半段、再交替合并。保存下一节点并正确断链，覆盖空链和奇偶长度，时间 O(n)、额外空间 O(1)；其他顺序需另行设计。

<details data-knowledge-key="agent-resume-interview">
<summary>（10）怎样说明实习动机、可投入时长和后续计划？</summary>
</details>

围绕岗位任务说明选择动机，如实交代可投入时长、课程与后续计划，并说明可能影响交付的约束。回答应与真实安排一致，不为迎合岗位承诺无法保证的时间，也不编造求职或升学结论。

<details data-knowledge-key="agent-project-evaluation">
<summary>（11）怎样讲清业务初始化、上下游、改造背景和技术难点？</summary>
</details>

沿真实数据流解释输入、依赖、负责模块和失败传播，再用约束、选项与验证结果说明改造。区分体验改善、风险降低和性能收益，说明测量条件与局限；不能只讲自己写了哪些页面，也不把自述提升比例当成已证实数据。

<details data-knowledge-key="os-thread-sync">
<summary>（12）带最大容量的阻塞队列怎样实现？</summary>
</details>

在互斥保护下维护队列和容量，满时生产者等待、空时消费者等待，改变状态后通知对应等待方。等待要在循环中重新检查条件以处理虚假唤醒，并设计关闭、超时和取消语义；线程安全容器本身不等于完整的阻塞协议。 [Java Condition：有界缓冲与循环检查等待条件](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/Condition.html)。

<details data-knowledge-key="agent-project-requirements">
<summary>（13）为什么开发 AI 助手，怎样说明沉淀？</summary>
</details>

从真实用户任务与现有成本说明动机，展示输入、允许动作、成功标准及失败处理。沉淀应是可复用的需求、工具契约、验证案例和维护经验；先说明系统实际做到了什么，再谈后续设想。

## 候选人反问（原帖记录）

<details data-knowledge-key="agent-role-landscape">
<summary>（14）反问：怎样了解团队业务与 AI 提效预期？</summary>
</details>

询问服务对象、交付责任、验证方式、协作边界和使用 AI 的约束，再判断岗位与经验是否匹配。记录未给出可验证的团队结论时，只保留提问与判断方法，不补造业务细节或预期收益。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [MySQL：多列索引与最左前缀](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)（MySQL 8.4）
- [Redis：Sentinel 与异步复制的故障边界](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)（滚动文档）
- [Java Condition：有界缓冲与循环检查等待条件](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/Condition.html)（Java SE 25 示例）
