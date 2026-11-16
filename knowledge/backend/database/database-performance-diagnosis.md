数据库 Owner 面对“整个库都慢”，需要把业务请求、数据库工作、资源和团队变更放到同一时间线上，找到最影响服务目标的约束，再用受控动作验证原因。只列索引、扩容、分库分表，无法说明为什么选它，也无法证明改善了谁。

本文以 **MySQL 8.4 / InnoDB** 为具体机制基准，官方资料核验于 2026-11-16。目标是建立整体诊断和共享实例治理的方法；SQL 是未执行的只读教学示例，不代表生产测量或故障处置指令。索引与锁的细节分别见[索引原理与查询优化](mysql-index.md)、[事务、MVCC 与锁](db-transaction-lock.md)。

## 先把“性能差”变成可比较的现象

先确认哪些接口、团队、租户和时间段受影响，问题表现为吞吐下降、尾延迟升高、错误增加，还是容量即将耗尽。业务请求率不等于数据库语句率：一个请求可能触发多次查询，重试与轮询也会放大数据库工作。接口耗时还包含连接池排队、网络、数据库执行及结果消费；数据库平均耗时正常，不能排除某组请求的长尾问题。

固定一份基线：业务请求率与成功率，延迟分位数，读写与事务比例，各团队的连接和语句量，实例 CPU、内存、I/O、网络，以及发布、回填、备份等事件。比较相同业务结果、数据规模、参数分布与时间窗口。累计计数器用窗口增量除以时间得到速率，重启或重置时重新建立基线；连接数这类瞬时值则不能作累计差分。具体变量含义以 [MySQL 8.4 状态变量](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/server-status-variables.html)为准。

例如，接口变慢同时连接数上升，可能是慢事务占住连接，也可能是应用连接泄漏，不能直接提高连接上限。先定位时间花在哪里，再决定改变哪一层。下图表达的是工作顺序；回退是否可行必须在实施前验证。

![从请求率、延迟与错误基线出发，分类定位并形成证据假设，通过责任、窗口和回退评审后灰度实施，同口径复测并继续定位的数据库性能诊断闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/database-performance-diagnosis-loop-archify-v1.png)
*图：先建立“证据—动作—预期”的因果假设，再改系统；达标后固化基线，未达标按已验证方案回退并继续排查。*

## 至少六个方向，怎样从证据走到动作

下面八类是排查视角，可能共同出现，并非互斥的故障标签。先选影响大且证据强的假设，再深入某个局部机制。

| 方向 | 要收集和比较什么 | 证据支持后可选的动作与边界 |
| --- | --- | --- |
| SQL 工作量与访问路径 | 按语句族统计调用次数、累计耗时、扫描与返回行；看参数偏斜、排序和临时结果 | 优化占用最大的查询族、消除重复查询或 N+1；索引和等价改写须比较写维护成本，不能只挑“单次最慢” |
| 锁、事务与排队 | 最老活跃事务、阻塞者与等待链、事务中应用空闲时间、MDL 等待 | 缩短持锁范围，移出无关网络调用；批处理只有允许部分提交才拆批；找根阻塞者而非批量杀等待者 |
| CPU、内存与存储 I/O | CPU 消耗与活跃并发，工作集和缓冲池读取，I/O 吞吐、延迟、队列及日志/刷页活动 | 先减少无效扫描和过度并发，再评估内存、CPU、存储及配置；缓存命中率高不等于总工作量小 |
| 连接与网络 | 应用连接池等待、连接创建速率、服务端连接/活跃线程、往返次数、返回字节和网络异常 | 复用连接、限制并发、减少串行往返、排查泄漏和跨地域调用；扩大连接池可能进一步压垮数据库 |
| 返回需求与访问方式 | 是否真的需要全部列、全部明细、实时精确总数；看发送与客户端消费时间 | 业务允许时采用列裁剪、聚合、缓存或异步导出；改变新鲜度、精度、完整性要明确合同，不能偷偷截断结果 |
| 数据生命周期与存储布局 | 热工作集、行/索引宽度、增长、历史访问、保留与恢复需求 | 评估归档、冷热分层、压缩、垂直拆表、受控冗余或分片；每项都有迁移、查询和一致性成本，没有通用行数阈值 |
| 读取路径与复制架构 | 主库读写占比、可分流的请求、缓存命中与回源、副本接收/应用进度和错误 | 比较缓存、读取副本或分析存储；先明确失效与新鲜度合同，不能把读副本当作写入扩容，也不能把一个延迟值当强一致证明 |
| 共享资源与变更竞争 | 按团队/账号/任务归因，比较在线流量与报表、回填、DDL、备份的时间重叠 | 错峰、限速、分配连接预算、隔离分析负载或独立实例；同实例分 schema 不等于 CPU、I/O 或锁资源隔离 |

MySQL 的 [InnoDB 优化目录](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/optimizing-innodb.html)将存储布局、事务、查询、日志、DDL、I/O 和配置分别讨论。这支持分层调查，不能据目录本身推出某项配置适用于所有负载。缓冲池如何承载页工作集见[官方缓冲池说明](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-buffer-pool.html)，I/O 参数需要结合实际设备与负载评估，见[InnoDB 磁盘 I/O 优化](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/optimizing-innodb-diskio.html)。

“至少六个方向”的价值是避免遗漏层次，不是凑出六种名词。例如索引、覆盖索引、联合索引仍属于访问路径；归档、分区也都可能是在处理历史数据规模。即使暂不讨论慢 SQL 和硬件，也能分别从锁与事务、连接网络、输出需求、生命周期、读取与复制、共享治理六个方向提出可检验的假设。检查副本时同时看接收/应用状态、错误与位点；[MySQL 8.4 SHOW REPLICA STATUS](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/show-replica-status.html)说明 `Seconds_Behind_Source` 有解读限制，不能只凭数值 0 证明满足本次写后的读取要求。

## 两个只读入口：先归因工作，再追踪事务

### 用语句摘要识别高频工作

[Performance Schema 语句汇总](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/performance-schema-statement-summary-tables.html)可按 schema 与 digest 汇总规范化语句。先确认 instrumentation/consumer、保留窗口及表容量；汇总不完整时，不能把“没有记录”理解成“没有负载”。以下仅展示累计快照的读取形式：

```sql
SELECT SCHEMA_NAME, DIGEST, DIGEST_TEXT,
       COUNT_STAR, SUM_TIMER_WAIT,
       SUM_ROWS_EXAMINED, SUM_ROWS_SENT, SUM_ERRORS
FROM performance_schema.events_statements_summary_by_digest
WHERE DIGEST IS NOT NULL
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
```

这不是窗口排行榜。采集两次快照后，按 schema/digest 比较有效增量，核对重置、条目新建及 `DIGEST IS NULL` 的兜底汇总行；后者过多提示归因覆盖有限。累计语句耗时也不是 CPU 时间，并发语句的时间会重叠。随后选代表参数读执行计划，复杂分析进入[SQL 与索引优化](../../data/sql/sql-index-optimize.md)；`EXPLAIN ANALYZE` 会实际执行，不能当作零影响的观察命令。

### 用事务与等待链识别谁占住谁

```sql
SELECT TRX_ID, TRX_STATE, TRX_STARTED,
       TRX_MYSQL_THREAD_ID, TRX_QUERY
FROM information_schema.INNODB_TRX
ORDER BY TRX_STARTED;
```

[INNODB_TRX](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/information-schema-innodb-trx-table.html)提供事务开始时间、状态及会话对应关系；配合 [data_lock_waits](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/performance-schema-data-lock-waits-table.html)和 `data_locks` 追踪数据锁阻塞，配合 `metadata_locks` 调查结构变更等待。这些是可能变化的实时视图，分次查询未必是同一快照；权限、采集设置和应用追踪也会限制可见范围。

事务存在很久不等于当前语句一直运行很久。应用可能开始事务后等待外部服务或忘记结束；只看慢 SQL 排行会漏掉这类占用。也不能把最老事务直接判成事故根因，应证明它持有哪些资源、阻塞了谁。

## 多团队共用数据库，怎样治理长事务

长事务有不同风险：修改事务可能长期持有冲突数据锁；长期一致性读可能阻止仍被旧快照需要的更新 undo 清理；访问过表但未结束的事务还可能持有阻塞 DDL 的元数据锁。它们不能都用“锁了整张表”解释。[InnoDB 多版本机制](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-multi-versioning.html)、[元数据锁释放规则](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/metadata-locking.html)

治理从责任和事务边界开始：业务团队负责明确原子性、幂等与失败恢复；数据库 Owner 负责共享容量、观察入口和变更准入；值班负责人按运行手册协调应急。账号、任务与连接应能归属到团队，告警带上事务年龄、阻塞影响和最近变更，避免只推一个没有接收人的“慢库”告警。

对在线事务，在评审中检查事务里是否夹带用户交互、远程调用、模型推理或无关计算，所有退出路径是否提交/回滚并归还连接。对回填与清理任务，若业务允许部分提交，则用可重入的小批次、游标、限速和暂停开关，并监控锁等待与副本进度；需要整体原子的操作不能任意拆开。事务粒度需权衡提交开销与锁、回滚成本，见[MySQL 事务管理优化](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/optimizing-innodb-transaction-management.html)。

事务时长、连接和任务预算由接口目标、业务原子性及容量测试确定，不设通用“超过几秒就杀”的阈值。先联系所属团队停止新增工作并正常结束事务；确需中断时，由有权限的人员确认业务后果、重试与回滚负载，再执行预案并观察清理完成。MySQL 的 [`KILL QUERY` 只中断当前语句，`KILL CONNECTION` 终止连接](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/kill.html)，不能把语句中断等同于整个业务事务已经回滚；命令返回也不证明清理已结束。

## 为什么在线 DDL 仍需要上线窗口

一个典型故障链是：团队 A 开启事务并访问表后未结束；团队 B 对同表发起需要排他 MDL 的 DDL；后续访问又排在等待中的 DDL 后面。即使 B 写了 `LOCK=NONE`，也不能绕过提交表定义所需的元数据锁。[MySQL 8.4 在线 DDL 并发文档](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-online-ddl-performance.html)明确展示了这类连锁等待。实际是否出现及影响范围仍需观察锁依赖，不能只凭上线时间相关就认定因果。

跨团队上线应有一份可执行的变更记录：

1. **责任与评审**：变更 Owner、数据库审批/执行人、受影响团队和观察人；列出精确 DDL、版本、表规模、依赖及读写兼容性。不同操作的 `INSTANT`、`INPLACE`、`COPY` 与锁能力不同，需核对支持矩阵并演练，不能统一指定一个算法。
2. **窗口与预算**：避开已知高峰和其他重任务，预估磁盘、日志、CPU/I/O 与复制影响；开跑前检查长事务和 MDL，定义锁等待及服务指标触发的停止条件，避免无期限排队。
3. **实施与观测**：回填和流量切换采用可暂停的分阶段方案；持续观察业务延迟、错误、MDL、空间与复制状态。原生在线 DDL 不保证具备同样的暂停和限速能力，不能把批处理控制方式套到所有 `ALTER TABLE`。
4. **回退与收尾**：先演练回退应用、切回读写路径、停止任务及数据修复的区别。删除列后回退程序不能找回数据；大 DDL 失败回滚可能昂贵，原生在线 DDL 也可能引起复制延迟。保留兼容窗口、数据校验与恢复方案后，再进入破坏性的收缩阶段。

这些 DDL 边界以 [MySQL 8.4 Online DDL Limitations](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-online-ddl-limitations.html)为准；协议兼容的完整流程见[数据库迁移与兼容发布](../storage/database-migration.md)，备份是否能恢复需另按[备份、恢复与演练](../ops/backup-restore.md)验证。一次成功备份不能证明 DDL 可以瞬间撤销。

## 表设计之外，怎样选择长期方案

表设计本身可从字段类型与宽度、主键和索引、低频大字段拆离、关联查询成本与受控冗余入手；冗余数据要有权威来源、更新传播和修复合同。若访问路径不是主要瓶颈，就不要持续围绕表结构打转。

例如一个共享库同时承载交易、分析导出和历史回填：先把三个负载归因并对齐时间。若导出要求全部历史明细，索引无法消除必要输出；可评估异步任务、独立分析存储或合适的读取副本，同时明确数据新鲜度和复制成本。若是回填放大写入与日志，就先限速和错峰；若是连接泄漏，则修复连接生命周期。只有证据支持单节点容量或写入约束时，再比较扩容、业务拆库或分片，相关机制见[分片、读写分离与冷热分层](db-sharding.md)。这些分支用于说明决策路径，实际效果需要同口径测量。

长期共享治理要把各团队的负载预算、任务窗口、容量预测、变更责任和复盘整改变成持续机制。分 schema 可以帮助组织对象与授权，但仍可能共享实例资源；确需更强隔离时，应衡量独立实例的成本、迁移和运维负担。

## 怎样证明改进有效

每项改动写清“观察证据、原因假设、具体动作、预期变化、影响范围、停止/回退条件和负责人”。先在受控环境验证功能与资源成本，再小范围实施，用可比较的请求与参数分布复测业务结果、延迟、错误、吞吐和资源；不要同时改许多不相关参数而失去归因能力。[Google SRE 金丝雀发布](https://sre.google/workbook/canarying-releases/)强调以分阶段流量和可比较指标判断是否继续。

平均延迟下降但错误率上升，或者某团队改善却挤压其他团队，都不能直接算整体成功。观察期还要覆盖相关批任务、数据增长和缓存冷热条件；保存变更前后证据及剩余风险，更新基线和运行手册。

面试口述可以沿同一条线：“我先澄清受影响业务与 SLO，建立请求率、延迟、错误和数据库资源基线；按工作量、事务锁、资源、连接网络、返回需求、数据生命周期及共享负载分类定位。每个方向给观察证据和候选动作。多个团队共用时，把长事务、DDL 窗口、责任、审核和回退纳入治理，最后灰度、同口径复测。” 这比背优化清单更能说明 Owner 如何作决定。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节后端与 Agent 开发一面：Java、数据库治理与系统设计](../../../interview/bytedance/base/bytedance-base-82.md)
<!-- interview-source-history:end -->

## 参考资料

- [MySQL 8.4：Server Status Variables](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/server-status-variables.html)
- [MySQL 8.4：Statement Summary Tables](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/performance-schema-statement-summary-tables.html)
- [MySQL 8.4：Optimizing for InnoDB Tables](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/optimizing-innodb.html)
- [MySQL 8.4：InnoDB Buffer Pool](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-buffer-pool.html)
- [MySQL 8.4：Optimizing InnoDB Disk I/O](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/optimizing-innodb-diskio.html)
- [MySQL 8.4：INNODB_TRX Table](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/information-schema-innodb-trx-table.html)
- [MySQL 8.4：data_lock_waits Table](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/performance-schema-data-lock-waits-table.html)
- [MySQL 8.4：InnoDB Multi-Versioning](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-multi-versioning.html)
- [MySQL 8.4：Optimizing InnoDB Transaction Management](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/optimizing-innodb-transaction-management.html)
- [MySQL 8.4：Metadata Locking](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/metadata-locking.html)
- [MySQL 8.4：KILL Statement](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/kill.html)
- [MySQL 8.4：Online DDL Performance and Concurrency](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-online-ddl-performance.html)
- [MySQL 8.4：Online DDL Limitations](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-online-ddl-limitations.html)
- [MySQL 8.4：SHOW REPLICA STATUS](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/show-replica-status.html)
- [Google SRE Workbook：Canarying Releases](https://sre.google/workbook/canarying-releases/)
