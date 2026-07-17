数据库迁移是一次跨版本协议升级：旧应用、新应用和迁移任务会在一段时间内同时访问同一份数据。安全目标不是“脚本能执行”，而是整个发布窗口都保持读写兼容、锁时间可控、数据可验证，并且在任一关卡失败时有明确恢复路径。

![数据库迁移按 Expand、Migrate、Contract 展开并通过兼容与观测门禁发布](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/database-migration-expand-contract-release-v1.webp)
*图：先增加兼容结构，再迁移流量和历史数据，最后在旧版本完全退出后删除旧结构。*

## 先识别风险，不先写 DDL

迁移评审至少回答：目标表多大、写入速率多高、语句会拿什么锁、是否重写整表、旧版本如何读写、回填怎样限速、失败如何观测。`ALTER TABLE` 的不同形式成本差异很大。[PostgreSQL ALTER TABLE 文档](https://www.postgresql.org/docs/18/sql-altertable.html)指出，许多子命令默认需要较强的 `ACCESS EXCLUSIVE` 锁；即使实际修改很快，也可能先在繁忙表后排队，排队期间又阻塞后续访问。

因此先在与生产规模接近的副本测量锁获取、执行时间、WAL、复制延迟和磁盘增长，并给迁移会话设置短 `lock_timeout`。拿不到锁时主动退出重试，比在队列里造成事故更安全。

## Expand：只做向后兼容的增加

[Expand and Contract 模式](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)把变更拆为三段。Expand 阶段只增加新版本需要、旧版本可以忽略的结构，例如可空列、新表、新索引或新 API 字段。不要立即把新列设为 `NOT NULL`，也不要重命名或删除旧列。

若字段从 `full_name` 拆成 `first_name` 和 `last_name`，第一版应用仍以旧字段为权威，同时能双写新字段。双写不是简单写两次：必须在一个数据库事务内完成，并记录冲突指标。另一种做法是先由数据库触发器维持兼容，但触发器也要版本化、监控并最终删除。

创建大表索引应考虑数据库提供的在线能力，例如 PostgreSQL 的 `CREATE INDEX CONCURRENTLY`，并处理失败后留下的无效索引。新增约束可先 `NOT VALID`，再独立 `VALIDATE CONSTRAINT`，把定义和历史数据扫描分开；具体语义必须按当前数据库版本验证。

## Migrate：迁移读写和历史数据

应用先部署兼容版本，再进行历史回填。回填使用稳定主键分页，而不是不断加深的 `OFFSET`；小批量提交、限制速率、可暂停，并为每批保存游标与统计。任务必须幂等：重复处理同一行得到相同结果，且不会覆盖用户刚写入的新值。

```sql
UPDATE profile
SET first_name = split_part(full_name, ' ', 1),
    last_name  = substring(full_name from position(' ' in full_name) + 1)
WHERE id > $cursor
  AND id <= $upper_bound
  AND first_name IS NULL;
```

条件 `first_name IS NULL` 体现“只补未迁移值”，但真实姓名拆分需要领域规则，不能照搬字符串示例。每批检查扫描量、更新量、错误量、锁等待、WAL 和副本延迟。完成后做行数、空值、摘要或业务聚合对账，不能只相信任务退出码。

读路径通过特性开关逐步切到新字段：先 shadow read 比较新旧结果，再小流量读新值，最后全量切换。若双写发生差异，定义哪个字段为权威以及如何修复，避免双向同步造成循环覆盖。

## Contract：删除是最后一步

只有当所有旧应用实例、异步消费者、报表、脚本和回滚版本都不再依赖旧结构，才能进入 Contract。先停止旧字段写入并观察，再移除兼容代码，最后删除列、索引或触发器。销毁性 DDL 应作为独立发布，不能与新功能同一按钮执行。

数据库回滚经常不是把 DDL 反向执行。列一旦删除，回滚应用也找不回数据；大规模回填反转可能再次产生高负载。因此更可靠的是“向前修复”：保留旧结构和双写窗口，用开关把读取切回旧路径，修复后再继续。[Google SRE 的金丝雀发布实践](https://sre.google/workbook/canarying-releases/)强调用分阶段流量和指标判断发布是否继续，这一思想同样适用于 schema 协议升级。

## 发布门禁与演练

每个阶段都设可验证门禁：Expand 后旧版本集成测试通过；Migrate 期间延迟、错误率、复制延迟不越线；读切换前新旧结果一致；Contract 前依赖扫描为零。迁移清单还要记录 owner、计划窗口、估算时长、暂停方法、恢复命令和沟通渠道。

在预发布环境演练“迁移任务中断后继续”“旧新应用同时写”“副本落后”“锁超时”“回滚应用版本”等场景。真正的完成标志不是新列出现，而是兼容代码和旧结构被有证据地收尾，数据契约回到单一、可维护状态。

## 参考资料

- [PostgreSQL：ALTER TABLE](https://www.postgresql.org/docs/18/sql-altertable.html)
- [Prisma Data Guide：Expand and Contract Pattern](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)
- [Google SRE Workbook：Canarying Releases](https://sre.google/workbook/canarying-releases/)
