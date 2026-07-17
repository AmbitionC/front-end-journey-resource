事务的价值不是把几条 SQL 包在 `BEGIN` 和 `COMMIT` 之间，而是让并发执行仍然维护业务不变量。设计 PostgreSQL 事务时，先写清“任何时刻都不能被破坏的条件”，再决定隔离级别、锁、约束与重试策略；从语法出发往往会得到能运行、却经不起并发的代码。

![PostgreSQL 事务从 MVCC 快照、行版本到锁等待、提交和重试的生命周期](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/postgresql-transaction-mvcc-lock-lifecycle-v1.webp)
*图：普通读取主要依赖快照和行版本，冲突写入通过行锁串行化；死锁或串行化失败应由事务边界统一重试。*

## 从不变量定义事务

以转账为例，核心不变量不是“先扣款再入账”，而是总额守恒、余额不越过允许下限、同一业务单只生效一次。数据库约束可以守住局部条件：`CHECK` 约束余额，`UNIQUE` 约束业务单号，外键维护引用；跨多行规则则由事务内读取、写入和锁共同保证。

事务应尽量短：在进入事务前完成参数校验和可缓存计算，在事务中只做需要原子性的数据库操作，提交后再发送通知。把 HTTP 调用放在持锁事务里，会把外部延迟变成锁等待，还无法与数据库提交真正原子化；更合适的做法是同事务写 outbox，再异步投递。

## MVCC、快照与行版本

PostgreSQL 使用多版本并发控制。更新一行不会就地擦除旧值，而会产生新版本；读取者按自己的快照判断哪个版本可见。因此普通 `SELECT` 通常不会被行级写锁阻塞，写者也不会因为普通读取停下。

[PostgreSQL 事务隔离文档](https://www.postgresql.org/docs/18/transaction-iso.html)说明，在默认的 Read Committed 下，每条语句开始时获取快照。同一事务的两次查询可能看到两批已提交数据，所以“先查再根据结果写”不是天然安全的。Repeatable Read 为事务保持一致视图，但仍可能因为并发更新而失败；Serializable 进一步检测无法等价为某种串行顺序的执行，并以 serialization failure 终止其中一个事务。

隔离级别不是越高越好。只读取报表快照可以使用 Repeatable Read；抢占一条待处理任务可以使用 `FOR UPDATE SKIP LOCKED`；跨行约束复杂且冲突不高时，Serializable 配合重试更容易证明正确。选择依据是异常是否会破坏不变量，以及冲突、延迟和重试成本。

## 行锁、表锁与死锁

`SELECT ... FOR UPDATE` 会锁住选中的行，阻止其他事务更新或锁定同一行；`FOR NO KEY UPDATE`、`FOR SHARE` 等模式有更细的冲突关系。[显式锁文档](https://www.postgresql.org/docs/18/explicit-locking.html)列出了表级与行级锁模式。需要注意，行锁不阻止普通快照读取，却可能让其他写者排队。

锁应当精确且顺序稳定。例如一次转账总是按账户 ID 从小到大锁两行，可以显著减少 A→B 与 B→A 互相等待的死锁。死锁无法完全靠超时解决：PostgreSQL 会检测等待环并中止一个事务，应用仍必须回滚并按完整事务重试。

```sql
BEGIN;

SELECT id, balance
FROM account
WHERE id IN ($1, $2)
ORDER BY id
FOR UPDATE;

UPDATE account SET balance = balance - $3 WHERE id = $1;
UPDATE account SET balance = balance + $3 WHERE id = $2;
INSERT INTO transfer(id, from_id, to_id, amount)
VALUES ($4, $1, $2, $3);

COMMIT;
```

这里的 `ORDER BY` 是锁顺序，不是展示需要；`transfer.id` 的唯一约束提供幂等入口。生产代码还要在锁住后重新验证余额，因为事务开始前的判断可能已经过期。

## 重试必须包住完整事务

可重试错误至少包括序列化失败和死锁。重试时必须重新开始事务、重新读取快照并重新计算，不能只重放最后一条 `UPDATE`。采用带随机抖动的指数退避，并设置最大次数和总 deadline；持续冲突应进入指标与告警，而不是无限重试。

事务闭包还需满足两个条件：输入可重复，外部副作用幂等。随机 ID 在事务外生成；邮件、消息和扣款等外部动作通过幂等键或 outbox 与提交关联。如果客户端在 `COMMIT` 后断线，结果可能是“已提交但客户端未知”，此时应按业务 ID 查询结果，而非盲目再执行。

## 排查与验证

观察锁等待时，关联 `pg_stat_activity`、`pg_locks`、事务年龄和 SQL 指纹，区分正在执行、等待锁和 idle in transaction。长事务会保留旧快照，拖累 vacuum 并放大表膨胀，因此连接池超时不能替代事务超时和取消处理。

测试不要只跑串行 happy path。应让多个连接同时争抢同一资源，验证余额不变量、唯一键幂等、死锁重试、提交结果未知、连接中断和超时回滚。最终标准不是“没有报错”，而是所有允许的交错执行都不会产生非法状态。

## 参考资料

- [PostgreSQL：Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html)
- [PostgreSQL：Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html)
