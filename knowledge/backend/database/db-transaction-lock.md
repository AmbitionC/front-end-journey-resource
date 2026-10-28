事务把多步数据库操作放进一个提交或回滚边界；隔离级别决定并发时允许看到哪些结果，锁则约束互相冲突的操作。解释“RR 能否防幻读”，应先区分普通一致性读、锁定读和写语句，再说明索引与查询条件。

本文以 **MySQL 8.4 / InnoDB** 为范围，ReadView 判断另外核对固定版本 **MySQL 8.4.6** 源码（核验日期 2026-10-16）。SQL 与 TypeORM 代码均为教学示意，未连接数据库执行；框架示例省略实体、连接配置等应用上下文，需要实际版本与业务约束下的集成验证。

## ACID：事务的四大保证

- **原子性（Atomicity）**：同一事务中的操作共同提交或撤销。转账的扣款与入账必须处于同一有效事务，undo 保存撤销修改所需的信息，并非每次都保存整行完整快照。
- **一致性（Consistency）**：执行前后满足约束与业务不变量。数据库约束与事务机制提供支撑，应用仍要表达余额非负、总额守恒等规则；仅开启事务不会自动生成这些规则。
- **隔离性（Isolation）**：约束并发事务的可见性与相互影响。较弱隔离允许更多并发现象；锁等待、版本维护与重试成本随负载变化，不能给所有业务排固定性能顺序。
- **持久性（Durability）**：在约定故障模型和持久化配置下，已确认提交可以恢复。InnoDB 用 redo 支撑崩溃恢复，提交时日志写入与刷盘受 `innodb_flush_log_at_trx_commit` 等配置影响。值为 1 时提交写入并刷日志；0、2 有崩溃丢失已提交事务的窗口。涉及 binlog 的一致持久化还需核对 `sync_binlog`，操作系统与存储也必须正确履行刷盘语义。[MySQL 8.4 持久化参数](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-parameters.html#sysvar_innodb_flush_log_at_trx_commit)

## 事务隔离级别与并发现象

**脏读**是读取其他事务尚未提交的数据；**不可重复读**是同一事务再次读取同一记录时，看到其他事务已提交的修改；**幻读**关注同一查询条件下符合条件的记录集合发生变化，不能只比较总行数。

下面按普通一致性读说明 MySQL 8.4 InnoDB 的主要差异；锁定读和 DML 要另行分析。

| 隔离级别 | 普通读取的主要行为 | 需要保留的边界 |
|---|---|---|
| READ UNCOMMITTED | 可读到其他事务未提交的版本 | 不适合依赖稳定已提交状态的判断 |
| READ COMMITTED（RC） | 每次一致性读建立新快照 | 两次查询之间提交的修改或新行可能变得可见 |
| REPEATABLE READ（RR，InnoDB 默认） | 同一事务通常复用首次一致性读建立的快照 | 可见自己的修改；锁定读、UPDATE/DELETE 不沿用这套快照语义 |
| SERIALIZABLE | 更强的串行化语义 | 禁用 autocommit 时普通 SELECT 被隐式转换为 FOR SHARE；启用 autocommit 的单条只读事务存在非锁定读取边界 |

RR 中不受本事务写入影响的普通重复一致性读使用同一视图，其他事务后来插入的行不会突然进入该视图。若业务要读取当前数据并阻止范围内并发插入，应分析 `FOR UPDATE / FOR SHARE` 的锁范围：唯一索引完整等值命中已有记录通常只需记录锁，范围扫描、未命中查找等情况不同。不能把“RR + 任意 SELECT”统一解释成“都加 Next-Key Lock”。[隔离级别](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-transaction-isolation-levels.html)、[一致性非锁定读](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-consistent-read.html)

## MVCC：旧版本怎样变成可读快照

MVCC（多版本并发控制）让普通一致性读按可见性规则读取记录版本，必要时利用 undo 构造旧版本，从而减少读写间的锁竞争。这不等于“所有读都不加锁”或“所有写都不阻塞读”：锁定读、DML、元数据操作与不同隔离语义各有约束。

### 版本信息与 undo

InnoDB 聚簇索引记录包含 `DB_TRX_ID`（最近修改事务）和 `DB_ROLL_PTR`（指向 undo 的回滚指针）；没有合适显式聚簇键时还涉及隐藏 `DB_ROW_ID`。二级索引记录没有同样的隐藏事务字段，不能把聚簇记录模型套到所有物理记录。undo 保存撤销与构造旧版本所需的信息，更新 undo 只有在不再被一致性读需要时才能清理。[多版本机制](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-multi-versioning.html)、[Undo Logs](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-undo-logs.html)

### ReadView 的判断顺序

<iframe src="https://www.agent-journey.cn/archify/readview-visibility.html" title="InnoDB ReadView 版本可见性判断" width="100%" height="760" loading="lazy"></iframe>

*图：先处理本事务写入，再比较视图边界与创建视图时的活跃事务集合；当前版本不可见时，沿 undo 取得更旧版本并重新判断。*

固定版本 `ReadView::changes_visible` 的逻辑可按下面顺序阅读，设待判断版本的事务号为 `id`：

1. `id < m_up_limit_id` 或 `id == m_creator_trx_id` 时可见，创建者的修改具有自身可见性。
2. `id >= m_low_limit_id` 时不可见。这里是“大于或等于”，不能用“比创建时最大活跃事务号更大”代替边界。
3. 中间区间内，`id` 若在创建视图时记录的活跃读写事务集合 `m_ids` 中，则不可见；不在集合中则可见。该集合排除视图创建者，创建者版本已由第一步处理。
4. 版本不可见时，读取其 undo 旧版本再判断；能否找到可见版本还决定该行在快照中是否存在。

`m_up_limit_id` 是“低于它的事务版本均可见”的边界，`m_low_limit_id` 是“达到它的事务版本均不可见”的边界。名称容易混淆，按比较条件记忆更可靠。[MySQL 8.4.6 ReadView 源码](https://raw.githubusercontent.com/mysql/mysql-server/mysql-8.4.6/storage/innobase/include/read0types.h)

例如，假设创建者为 100，创建视图时全局活跃读写事务为 {92, 100, 104}，而 ReadView 的 `m_ids={92,104}` 排除创建者；边界为 `m_up_limit_id=92`、`m_low_limit_id=110`。这是构造的教学输入：版本 100 先按自身写入可见，89 可见，110 不可见，92 不可见，95 在中间区间且不属于 `m_ids`，因此可见。不要根据当前时刻是否已经提交，倒改创建视图时冻结的集合。[MySQL 8.4.6 copy_trx_ids / prepare](https://raw.githubusercontent.com/mysql/mysql-server/mysql-8.4.6/storage/innobase/read/read0read.cc)

**RC** 每次普通一致性读创建新视图；**RR** 通常从首次一致性读起复用视图。RR 仍能看到自己的修改，因此“同一事务任何两次 SELECT 结果必定相同”不成立：本事务更新甚至可能让查询呈现“自己的新版本 + 其他行的旧版本”的组合。锁定读和 DML 处理当前数据，也不能套用普通一致性读的结论。

## 把 ACID、MVCC 与三类日志串成一条回答链

- **undo log** 保存撤销修改和重建旧版本所需的信息，支撑回滚与一致性读。
- **redo log** 记录 InnoDB 崩溃恢复需要的变更，恢复时重放尚未体现在持久数据页中的变化；是否已按提交要求持久化取决于配置及存储保证。
- **binlog** 属于 MySQL Server 层，记录用于复制和时间点恢复的变更事件，形式与日志格式有关。
- **ReadView + undo** 决定一致性读看到哪个版本；记录锁、间隙锁等约束冲突操作与插入范围。

三类日志职责不同。提交需要协调存储引擎与 binlog 的状态，但 MySQL 内部 redo/binlog 协调不等于应用自动获得任意外部系统的分布式事务。[Redo Log](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-redo-log.html)、[Binary Log](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/binary-log.html)

## 锁的类型体系

<iframe src="https://www.agent-journey.cn/archify/innodb-record-gap-deadlock.html" title="InnoDB 记录锁、间隙锁、插入等待与死锁" width="100%" height="760" loading="lazy"></iframe>

*图：分别观察同一记录上的 S/X 冲突、纯间隙锁共存、插入等待与等待环；各部分使用独立事务与资源前提。*

旧版[事务隔离与锁时间线图](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/database-isolation-lock-timeline-v1.webp)保留为勘误链接：它把 UPDATE 的记录锁冲突与 gap 插入等待混同。纯间隙锁可以共存，插入请求仍可能等待；请依据上图的独立前提与正文机制判断，不据旧图推导锁范围或兼容性。

### 记录锁的 S/X 兼容性

以下矩阵只讨论**不同事务对同一索引记录**申请的 S/X 记录锁，不能推广成“X 与数据库中任何锁都冲突”。

| 已持有 / 新请求 | S | X |
|---|---|---|
| S | 兼容 | 冲突 |
| X | 冲突 | 冲突 |

`SELECT ... FOR SHARE` 可申请共享记录锁；`FOR UPDATE` 及修改操作涉及排他记录锁。INSERT 还涉及插入意向、重复键检查等，不能用一个 X 概括全部锁行为。

### 表级意向锁

行级共享锁之前需要表级 IS，行级排他锁之前需要表级 IX，以便与表级锁协调。不同事务的 IS、IX 彼此兼容；表级 S 与 IX 冲突，表级 X 与 IS、IX 都冲突。意向锁不表示整表数据都被排他锁住。[InnoDB Locking](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-locking.html)

### 记录、间隙与 Next-Key

InnoDB 记录锁基于索引项实现；即使没有显式索引，也有内部聚簇索引。缺少合适访问路径可能扫描并锁住大量记录，不代表自动升级为表级锁。以下 SQL 为未执行的教学示意：

```sql
-- 假设 id 是唯一主键、记录 100 已存在，并采用唯一等值访问
SELECT * FROM orders WHERE id = 100 FOR UPDATE;
-- 在这些前提下，可只锁目标索引记录，不锁其前间隙
```

- **记录锁**保护索引记录本身。
- **纯间隙锁**保护相邻索引记录之间的开区间，例如 (10, 20)，抑制在其中插入新索引值。不同事务的纯间隙锁可以共存，带 S/X 名称的纯间隙锁也不适用上述记录锁冲突矩阵。
- **Next-Key Lock** 是某个索引记录锁与其前方间隙锁的组合，例如 (10, 20]。RR 搜索和扫描常用它，但完整唯一键等值命中等情况可退化为记录锁。
- **插入意向锁**用于插入前的间隙请求；同一间隙内不同位置的插入意向可兼容，但会受其他事务覆盖该位置的间隙锁阻塞。不能由“间隙锁能共存”推出“插入不会等待”。

```sql
-- 精确范围需要索引、已有数据、执行计划与隔离级别
SELECT * FROM orders WHERE id > 10 AND id <= 20 FOR UPDATE;
```

仅凭这条 SQL 不能断言精确锁住“(10,20] 及之后的间隙”：边界记录是否存在、扫描索引、停止位置与隔离级别都会影响范围。RC 通常关闭搜索与扫描的间隙锁，但外键与重复键检查仍有例外。[不同 SQL 语句设置的锁](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-locks-set.html)

## 死锁检测与处理

事务 A 持有记录 1 并等待记录 2，事务 B 持有记录 2 并等待记录 1，就形成等待环。普通等待可能在持锁事务释放后继续；死锁需要打破循环。

| 机制 | 行为与恢复边界 |
|---|---|
| InnoDB 死锁检测 | 启用检测时选择受害事务并回滚整个事务，应用确认业务可重试后重新开始 |
| 锁等待超时 | 默认回滚超时语句；`innodb_rollback_on_timeout` 可改变为整事务回滚，不能把所有超时视为同一状态 |
| 其他语句错误 | 如普通重复键错误通常只回滚该语句；语句回滚不保证释放事务此前保留的锁 |

恢复前核对错误类型与当前事务状态，必要时显式回滚，再以有限次数和退避重试整个业务操作。排查可从 `SHOW ENGINE INNODB STATUS` 的最近死锁记录和 `performance_schema.data_locks / data_lock_waits` 入手，结合 SQL、索引、事务边界定位等待链；诊断查询需要适当权限。[错误处理](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-error-handling.html)

预防侧让多个事务按相同顺序访问资源、缩短持锁时间、用合适索引减少扫描；这些措施降低概率，不能保证完全没有死锁。

## TypeORM 事务代码示例

以下为未执行的教学代码，说明事务生命周期，假设两账户均存在、金额合法且为正。实际业务必须校验两账户和金额、按一致顺序锁定相关记录，并检查每次写入的受影响行数；零行更新不能算作入账成功。账户余额约束、并发行为和异常路径还需在实际 ORM 与数据库版本中做集成验证。

```typescript
import { DataSource, QueryRunner } from 'typeorm';

// 方式一：QueryRunner —— 显式控制事务生命周期
async function transferBalance(
  dataSource: DataSource,
  fromId: number,
  toId: number,
  amount: number,
): Promise<void> {
  const qr: QueryRunner = dataSource.createQueryRunner();
  try {
    await qr.connect();
    await qr.startTransaction();
    // FOR UPDATE 加排他锁，防止并发超扣
    const from = await qr.manager
      .getRepository(Account)
      .createQueryBuilder('a')
      .setLock('pessimistic_write')       // SELECT ... FOR UPDATE
      .where('a.id = :id', { id: fromId })
      .getOneOrFail();

    if (from.balance < amount) throw new Error('余额不足');

    await qr.manager.decrement(Account, { id: fromId }, 'balance', amount);
    await qr.manager.increment(Account, { id: toId }, 'balance', amount);

    await qr.commitTransaction();
  } catch (err) {
    if (qr.isTransactionActive) await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
  }
}

// 方式二：dataSource.transaction 包装器 —— 适合简短事务
await dataSource.transaction(async (manager) => {
  await manager.save(Order, newOrder);
  await manager.decrement(Inventory, { sku: newOrder.sku }, 'stock', 1);
});
```

上面的包装器片段只展示事务边界，没有表达库存充足条件、写入行数检查和完整订单不变量，不能原样作为生产下单实现。QueryRunner 的初始化也放入 try/finally，并只在事务仍活跃时请求回滚；初始化、回滚或释放失败时的错误保留、连接处置仍需实际集成验证。[TypeORM 0.3.27 QueryRunner 接口](https://raw.githubusercontent.com/typeorm/typeorm/0.3.27/src/query-runner/QueryRunner.ts)、[事务包装实现](https://raw.githubusercontent.com/typeorm/typeorm/0.3.27/src/entity-manager/EntityManager.ts)

### TypeORM 乐观锁

```typescript
import { Entity, PrimaryGeneratedColumn, Column, VersionColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stock: number;

  @VersionColumn()          // ORM 维护版本计数；仍需显式旧版本条件
  version: number;
}

// 显式 compare-and-set：旧版本条件与数据修改在同一条 UPDATE 中
async function updateStock(productId: number, expectedVersion: number, nextStock: number) {
  const result = await productRepository.createQueryBuilder()
    .update(Product)
    .set({ stock: nextStock, version: expectedVersion + 1 })
    .where("id = :id", { id: productId })
    .andWhere("version = :version", { version: expectedVersion })
    .execute();
  if (result.affected !== 1) throw new Error("VERSION_CONFLICT_OR_MISSING");
}
```

[TypeORM VersionColumn 文档](https://typeorm.io/docs/help/decorator-reference/#versioncolumn)说明自动递增；核对[0.3.27 的 save 更新实现](https://raw.githubusercontent.com/typeorm/typeorm/0.3.27/src/persistence/SubjectExecutor.ts)，不能由此推断 save 会自动校验旧版本。上面的显式条件更新采用[官方 Update QueryBuilder](https://typeorm.io/docs/query-builder/update-query-builder/)形式；其保证来自同一条 UPDATE 中的旧版本条件与受影响行数检查，需在实际 ORM、驱动和数据库版本中做集成验证。

## 乐观与悲观并发控制如何选择

乐观并发控制先读取版本，写入时在同一条条件更新中核对旧版本，再检查受影响行数；悲观控制先取得适当锁，再读取、判断和修改。两者都必须表达业务不变量，数据库执行 UPDATE 时也会使用锁，因此“乐观锁没有任何锁等待”不成立。

| 维度 | 乐观并发控制 | 悲观并发控制 |
|---|---|---|
| 常见实现 | version 条件更新并检查 affected rows | FOR UPDATE / FOR SHARE 等锁定读 |
| 冲突时 | 更新条件不再满足，重新读取并重新计算或返回冲突 | 等待、超时或被选为死锁受害者 |
| 主要成本 | 重复计算与重试 | 持锁时间、排队与死锁处理 |
| 选择依据 | 临界区长度、冲突率、可重试性、业务约束 | 同样需要真实负载比较 |

低冲突编辑可考虑版本控制；竞争强且计算短的余额或库存操作可评估锁定读或带业务条件的原子 UPDATE。没有通用冲突率阈值，也不存在“库存只能悲观锁”的规则。重试必须重新读取状态并按原始业务意图计算，不能反复提交失效的旧结果。

## Agent 后端的意义：幂等性设计

在 AI Agent 场景下，应用或工具框架可能按策略重试工具调用；是否重试、重试哪些错误由实现明确。若工具函数内有数据库写操作，重试可能导致**重复写入**，引发双扣款、重复创建订单等严重问题。

**解决方案：幂等键（Idempotency Key）+ 唯一约束**

```typescript
// 应用为同一业务操作生成并持久保留幂等键，跨重试复用
async function createOrderIdempotent(
  dataSource: DataSource,
  payload: CreateOrderDto,
  idempotencyKey: string,   // 稳定业务操作标识；不能在每次重试时重建 UUID
): Promise<Order> {
  return dataSource.transaction(async (manager) => {
    // 1. 先查重：唯一键命中则直接返回，不重复写
    const existing = await manager.findOne(Order, {
      where: { idempotencyKey },
    });
    if (existing) return existing;

    // 2. 首次写入，数据库层对 idempotency_key 加唯一索引兜底
    const order = manager.create(Order, { ...payload, idempotencyKey });
    return manager.save(order);
  });
}
```

**数据库层兜底：** 幂等键必须经过应用校验，使用非空有效值，数据库列也必须声明 NOT NULL。MySQL UNIQUE 允许多个 NULL，不能只添加唯一索引就认为所有请求都有可去重的键。以下 DDL 只展示添加索引，假定既有列已满足 NOT NULL 与适当类型、长度等前提，未推断或改写未知表结构。[MySQL 8.4 CREATE INDEX](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/create-index.html)

```sql
ALTER TABLE orders ADD UNIQUE INDEX uk_idempotency_key (idempotency_key);
```

这段未执行的教学代码说明“先查只是优化，唯一约束才兜底”：并发请求可能都查不到，随后其中一个插入遇到重复键。InnoDB 普通重复键错误通常只回滚语句；框架是否回滚整事务取决于异常传播与事务包装器，不能归因于唯一索引自动回滚整个事务。

完整实现还要限定幂等键作用域、校验同键载荷一致性、定义处理中/成功/失败状态、保留原结果，并在明确结束或回滚当前事务后处理冲突、读取已存在结果。调用 ID 只有在同一业务操作的所有重试中保持稳定时才可作为键；模型重新生成调用时不能假定 ID 不变。唯一索引也不会让外部支付自动幂等。

**Agent 状态更新可考虑版本控制**：Agent 读取任务状态 → 决策 → 更新状态，整个流程可用版本号保护，避免两个 Agent 实例并发修改同一任务状态。

## 常见误区

**误区一：事务内调用外部 HTTP 接口**

```typescript
// ❌ 危险写法
await dataSource.transaction(async (manager) => {
  await manager.save(order);
  await httpClient.post('/payment-gateway', payload);  // 网络超时 → 事务回滚，但第三方可能已收款！
  await manager.save(paymentRecord);
});
```

外部 HTTP 调用不受数据库事务管辖，一旦超时或失败，数据库回滚而第三方操作无法撤销，形成数据不一致。即使改成“先提交数据库，再发 HTTP”，仍有数据库已提交但消息未发送、响应丢失后重试等失败窗口。需要可靠驱动外部操作时，可评估事务发件箱：同一数据库事务内写业务状态与待发送记录，由独立发送器重试；接收方仍需幂等或去重。它不会把 HTTP 变成数据库内原子操作，也不自动保证端到端只执行一次。

**误区二：长事务（Long-Running Transaction）**

长事务的危害：
1. 长时间持有行锁/间隙锁，阻塞其他事务，拖垮并发吞吐。
2. 长期一致性读可能让仍被旧快照需要的更新 undo 延迟清理，增加历史版本与存储压力；不是所有 undo 都不能清理。
3. 大事务可能延长复制应用与资源占用，是否形成明显延迟还取决于复制模式、并行度和负载。

**处理思路**：缩短事务并去掉无关耗时操作；只有业务允许部分提交时才拆成小批次，需要整体原子的操作不能为了性能直接分批。

**误区三：乐观锁重试不加退避**

```typescript
// ❌ 没有退避的暴力重试，高并发下加剧冲突
while (true) {
  try {
    await updateStock(product.id, product.version, desiredStock);
    break;
  } catch (e) { /* 立刻重试 */ }
}

// ✅ 指数退避 + 最大重试次数
for (let i = 0; i < 3; i++) {
  try {
    await updateStock(product.id, product.version, desiredStock);
    break;
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "VERSION_CONFLICT_OR_MISSING" || i === 2) throw e;
    await sleep(50 * 2 ** i);   // 前两次失败等待 50ms、100ms；第 3 次失败直接抛出
    product = await productRepository.findOneByOrFail({ id: product.id });
    desiredStock = recomputeStockFromBusinessIntent(product); // 重新检查业务约束
  }
}
```

## 面试中怎样组织回答

**Q：MVCC、锁和事务是什么关系？**

事务定义提交/回滚与隔离边界，MVCC 让普通一致性读按 ReadView 与 undo 读取可见版本，锁协调冲突写入和锁定读。先说引擎、隔离级别和语句类型，再判断快照还是当前数据，不用“读写永不阻塞”概括所有情况。

**Q：RR 能不能防幻读？**

InnoDB RR 的普通一致性读通常复用同一快照，其他事务后来提交的新行不会直接进入该快照；范围锁定读依靠索引记录与间隙上的锁阻止相关插入。两者机制与读取状态不同，唯一等值命中、RC 与本事务写入都是要补充的边界。先澄清 SELECT 与索引，再给结论。

**Q：三个条件变化后，答案怎样调整？**

1. **RR 改成 RC**：下一次普通一致性读建立新视图，可能看到新提交行；搜索/扫描通常不再使用间隙锁，但重复键与外键检查是例外。
2. **范围查找改成唯一主键完整等值命中已有记录**：可只锁该索引记录，不能照搬整个范围的 Next-Key 图；目标不存在时要重新分析。
3. **等待错误改为死锁、锁超时或重复键**：死锁通常整事务回滚；超时默认语句回滚、可配置改变；重复键通常语句回滚。按错误与状态决定回滚和重试范围，不能统一“重试这一句”。

**Q：为什么间隙锁共存，插入却会等待？**

纯间隙锁主要抑制插入，彼此可以共存；插入请求的插入意向可能被覆盖该位置的间隙锁阻塞。这与同一记录上 S/S 兼容、S/X 冲突是两套不同范围的判断。

**Q：如何证明锁范围判断？**

给出索引定义、已有记录、隔离级别、事务时间线与语句，检查执行计划和锁信息。本文范围 SQL 未实际运行，不能充当具体题目的锁范围实测；面经缺少原 SQL 时也不能补造返回结果。

## 两阶段提交：准备与最终决议

[MySQL 8.4 XA 文档](https://dev.mysql.com/doc/refman/8.4/en/xa.html)中的全局事务由事务管理器协调多个资源分支。第一阶段要求各分支 prepare，报告是否已达到能够提交的状态；第二阶段协调者根据全部结果作提交或回滚决议，再通知分支。prepare 不是业务已最终提交，事务仍要保存恢复所需信息。

已 prepared 的分支在不知道最终决议时不能仅因超时自行提交；协调者或网络故障可让资源等待，恢复须依持久记录取得一致决议。两阶段提交关注原子提交，不自动解决读隔离、所有服务可用性或跨系统幂等。实际系统要定义事务 ID、决议持久化、重试与人工恢复路径。

MySQL redo 与 binlog 的内部协调涉及特定引擎实现，不等于完整外部 XA 的所有角色；也不能把 prepare/commit 两词直接套在所有消息发送流程上。回答前先澄清讨论的是数据库内部提交，还是跨多个资源的全局事务，再展开该范围的故障过程。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯 AI 应用开发实习一面：事务快照与 B+树索引](../../../interview/tencent/ai/tencent-ai-18.md)
- [蚂蚁大模型应用秋招一面：记忆评测、事务日志与消息积压](../../../interview/antfin/ai/antfin-ai-11.md)
- [小红书产品工程师一面：一致性、知识来源与多模态评估](../../../interview/redbook/ai/redbook-ai-6.md)
- [字节后端与 Agent：运行链路、数据库与网络](../../../interview/bytedance/base/bytedance-base-55.md)
- [小红书与百度 Agent 面试合并记录：LangGraph 子图、Skill 与工程校验](../../../interview/redbook/ai/redbook-ai-2.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [字节 Agent Infra 校招：运行时、MySQL 与 LRU](../../../interview/bytedance/base/bytedance-base-25.md)
- [字节飞书 AI 应用一面：Runtime、评测与后端基础](../../../interview/bytedance/base/bytedance-base-24.md)
- [蚂蚁财富技术部一面：协作式 Agent、交付门禁与后端基础](../../../interview/antfin/ai/antfin-ai-4.md)
- [蚂蚁 Agent 实习一面：缓存、消息与 RAG](../../../interview/antfin/ai/antfin-ai-6.md)
<!-- interview-source-history:end -->

## 参考资料

- [MySQL 8.4 InnoDB transaction isolation levels](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-transaction-isolation-levels.html)
- [MySQL 8.4 InnoDB locking](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-locking.html)
- [MySQL 8.4 Reference — Redo Log](https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html)
- [MySQL 8.4 Reference — Undo Logs](https://dev.mysql.com/doc/refman/8.4/en/innodb-undo-logs.html)
- [MySQL 8.4 Reference — Binary Log](https://dev.mysql.com/doc/refman/8.4/en/binary-log.html)
- [MySQL 8.4：Locks Set by Different SQL Statements](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-locks-set.html)（本次核验于 2026-10-16）。
- [MySQL 8.4：InnoDB Error Handling](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-error-handling.html)（语句与事务回滚，本次核验于 2026-10-16）。
- [TypeORM：VersionColumn](https://typeorm.io/docs/help/decorator-reference/#versioncolumn)与[0.3.27 更新实现](https://raw.githubusercontent.com/typeorm/typeorm/0.3.27/src/persistence/SubjectExecutor.ts)（本次实际读取；不是跨版本保证）。
- [TypeORM：Update QueryBuilder](https://typeorm.io/docs/query-builder/update-query-builder/)（显式条件写入形式，本次核验于 2026-10-16）。

- [MySQL 8.4：Consistent Nonlocking Reads](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-consistent-read.html)
- [MySQL 8.4：InnoDB Multi-Versioning](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-multi-versioning.html)
- [MySQL 8.4.6：ReadView 固定版本源码](https://raw.githubusercontent.com/mysql/mysql-server/mysql-8.4.6/storage/innobase/include/read0types.h)
- [MySQL 8.4：提交日志持久化参数](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-parameters.html#sysvar_innodb_flush_log_at_trx_commit)
- [MySQL 8.4：XA Transactions](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/xa.html)

TypeORM 在线文档随项目版本更新；此处将其 API 示例与 0.3.27 固定源码核对分开记录，不将在线文档视为所有版本的行为保证。事务发件箱部分是故障窗口分析与教学设计建议，本文未实现或运行发送器。
