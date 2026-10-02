公司：阿里云；方向：Agent Infra 的 Data Infra；轮次：一面。原文日期为 8.31，未在日期文字中注明年份；项目介绍、业务题、字符串手撕及 AI coding 的时长来自作者记录。

以下问题按作者可见记录归纳；答题思路为独立整理，不代表作者实际作答或企业标准答案。

## 先演算一次提交成功、进度未保存的故障

原帖的 AI coding 要求是从 SLS 向 MySQL 动态写入并处理异常，没有公布字段、代码或验收结果。以下是教学设定，不是作者完成的方案，也没有在真实 SLS/MySQL 环境运行。

假设日志生产端为租户 A 的事件分配稳定 ID `e7`，字段是 `amount=100`，受信映射版本 `v3` 指向已批准的订单表。消费者读取 shard 的一批日志后，先校验租户、字段类型和映射版本，字段值通过参数绑定写入；目标表名不能直接采用日志里的字符串。去重记录表与业务表都使用 InnoDB，在同一数据库连接的同一个事务内，以非空字段的唯一键约束登记 `(A,e7)` 并完成目标写入；两者一起提交成功后，才推进该 shard 已连续完成范围的 checkpoint。这个原子性前提不适用于混入非事务表的写入。

现在进程恰好在数据库提交后、checkpoint 更新前崩溃。重启从旧进度再次读到 `e7`，唯一身份已经存在；消费者确认已提交的处理记录与本次事件一致，保留原结果，不再重复产生业务副作用，再保存消费进度。相反，先保存进度再写数据库，一旦中途失败，重启就可能跳过未落库的日志。SLS 的消费进度和 MySQL 事务没有因为这段调用顺序自动成为一个分布式原子事务，重复读取窗口仍需目标端吸收。

这个方案依赖真正稳定的事件身份与唯一约束；只拿时间戳作 ID 不能证明唯一。字段不符合 `v3` 时，先进入可恢复的隔离状态，不能默默丢弃后宣称全部入库。并发批次乱序完成时，也不能越过未完成的前一批推进进度。用停机位置、重复事件和坏字段回放验证这些边界，才比“加重试”更接近原题要求。

## 原面试问题与答题思路

#### （1）单台 Intel SGX 机器怎样提供多租户计算，数据约 1GB 时如何设计？

先核对机器 SGX 能力与可用 EPC，区分总数据量和活跃工作集。租户认证、证明和密钥发放分开设计；敏感处理在 enclave 内，对大数据采用有界分块和认证加密存储。租户独立密钥、配额、对象命名空间与结果授权；一台机器也不能靠 enclave 名称代替权限验证。

知识导航：[SGX 多租户计算：EPC、分页保护与吞吐边界](../../../knowledge/backend/auth/sgx-multitenant-compute.md)、[内存、虚拟内存与分页](../../../knowledge/cs/os/os-virtual-memory.md)。

#### （2）EPC 只有约 512MB，反复换页时如何保证安全？

区分 CPU 管理的 EPC 换页与应用把数据写到磁盘两条路径。SGX 指令保护被逐出的 EPC 页，应用外置数据仍须自己进行认证加密、版本绑定和租户隔离。加密不等于新鲜度，业务文件重放、侧信道和拒绝服务都要单独考虑。

知识导航：[SGX 多租户计算：EPC、分页保护与吞吐边界](../../../knowledge/backend/auth/sgx-multitenant-compute.md)。

#### （3）PV 增长四倍但吞吐没有上升，可能有哪些瓶颈？

先确认 PV 是需求量还是成功处理量，吞吐按单位时间完成任务数定义。固定资源达到饱和后，需求增加只会拉长队列。拆解 CPU、EPC 换页、存储和网络 I/O、锁、连接池与租户调度，比较并发和工作集曲线；不能凭现象断言一定是 EPC。

知识导航：[SGX 多租户计算：EPC、分页保护与吞吐边界](../../../knowledge/backend/auth/sgx-multitenant-compute.md)、[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)。

#### （4）嵌套重复字符串如何解析？

原帖示例是 3[ab2[c]]。用递归下降或两个栈分别保存重复次数和局部字符串，先完成内层再拼接外层，得到 abccabccabcc。除了语法校验还限制嵌套深度、展开长度与整数范围；复杂度按输入长度与实际输出长度计算，不能忽略指数膨胀的输出。

知识导航：[递归、分治与搜索](../../../knowledge/data-structure/algorithm/algorithm-loop.md)、[栈、队列与任务调度](../../../knowledge/cs/algorithm/algorithm-stack-queue.md)。

#### （5）AI coding：SLS 到 MySQL 的动态写入系统怎样处理异常？

先定义日志身份、字段映射版本和目标表允许范围。按 shard 消费，让 InnoDB 去重表与业务表在同连接、同事务内写入，提交成功后才推进消费进度；重启后的重复读取用稳定事件 ID、非空唯一键及内容一致性检查吸收。脏数据隔离、有限重试、死信、Schema 变更与背压都应有可观察状态。动态字段值使用参数化查询，动态表名与列名经白名单映射。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)、[ETL / ELT 流程设计](../../../knowledge/data/pipeline/etl-design.md)、[数据 Schema 演进与兼容性](../../../knowledge/data/processing/data-schema-evolution.md)、[SQL 注入与参数化查询](../../../knowledge/backend/auth/sql-injection.md)。

## 原帖记录边界

反问提到的数据处理、状态持久化及 post-train 方向仅为作者转述；原帖没有给出完整系统需求、负载指标或已通过的实现，答案为设计方法。

## 面试口述迁移

可以这样概括设计依据：“我先区分 SGX 总输入量和 enclave 活跃工作集，再划分 CPU 管理的 EPC 分页与应用外置数据保护；多租户还要验证身份、密钥和任务完整输入。对日志入库，我先确认目标事务已提交，再推进消费进度；提交与 checkpoint 之间可能重读，因此用稳定事件身份和唯一约束吸收重复。两条链路都需要故障验证，不能仅凭加密或开启 checkpoint 宣称安全和恰好一次。”

## 教学补充：改变条件再判断

以下是模拟追问，不是原帖记录的题目：

- **同一 `(A,e7)` 重读时金额从 100 变成 200，直接忽略重复还正确吗？** 不正确。事件身份绑定的内容必须一致，可保存并核对受信规范化事件摘要；冲突进入隔离状态。如果源允许事件更新，就要另外设计事件版本与更新合同。
- **数据库失败，但处理框架要求保存消费进度，怎么选？** 不能把尚未提交或尚未可靠隔离的数据当完成。先明确错误重试、隔离持久化和恢复策略，并让 checkpoint 只跨过已经完成的连续范围，不能照抄只打印日志的 SDK 示例当业务提交方案。
- **EPC 页的保护没有失败，主机却提前结束应用数据流，能否输出结果？** 不能据此证明输入完整。应用任务仍需绑定可信 manifest，校验全部预期块与总长度；CPU 页保护不替代业务输入的完整覆盖与新鲜度校验。

## 参考资料与适用环境

- [SLS 消费组官方指南](https://www.alibabacloud.com/help/en/sls/developer-reference/consumer-group-consumption)：Overview、Step 2 的 checkpoint 保存与重读示例。滚动文档，核验于 2026-10-02；其 SDK 示例不提供跨 MySQL 的业务事务保证。
- [ConsumerGroupUpdateCheckPoint](https://www.alibabacloud.com/help/en/sls/developer-reference/api-sls-2020-12-30-consumergroupupdatecheckpoint)：API 2020-12-30 的 shard、consumer 与强制更新参数；本文不实际调用服务，也不引入凭据。
- [MySQL 8.4 PREPARE](https://dev.mysql.com/doc/refman/8.4/en/prepare.html)：§15.5.1，参数标记可绑定值，不能绑定 SQL 标识符。版本文档核验于 2026-10-02。
- [MySQL 8.4 事务提交与回滚](https://dev.mysql.com/doc/refman/8.4/en/commit.html)及[唯一约束](https://dev.mysql.com/doc/refman/8.4/en/constraint-primary-key.html)：§15.3.1、§1.7.3.1。事务边界依赖会话和事务表；非事务表不能完整回滚，重复唯一键报错不能直接当业务已经正确完成。核验于 2026-10-02。
- SGX 的 EWB/ELDU、远程证明和应用认证加密边界，见上面的 SGX 知识文章及其 Intel/原始论文参考；1GB、512MB 仅是原面试题设，不是通用平台容量或性能结论。
