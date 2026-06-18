# 事务与锁机制

事务和锁是数据库保证数据一致性的两大基石。事务提供"要么全成功、要么全失败"的原子保障，锁则控制并发访问时的数据隔离。

## 事务的四个特性（ACID）

| 特性 | 含义 |
|------|------|
| Atomicity（原子性） | 事务内所有操作要么全部提交，要么全部回滚 |
| Consistency（一致性） | 事务执行前后，数据库从一个合法状态变为另一个合法状态 |
| Isolation（隔离性） | 并发事务互不干扰，由隔离级别控制 |
| Durability（持久性） | 事务一旦提交，结果永久保存（通过 redo log 保证） |

## 事务隔离级别

并发事务可能引发三类问题：

- **脏读**：读到其他事务未提交的数据。
- **不可重复读**：同一事务内两次读同一行，结果不同（其他事务已提交修改）。
- **幻读**：同一事务内两次查询，行数不同（其他事务已插入/删除行）。

SQL 标准定义了四个隔离级别：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|-----------|------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED | 否 | 可能 | 可能 |
| REPEATABLE READ | 否 | 否 | 可能（InnoDB 通过 MVCC+间隙锁基本解决） |
| SERIALIZABLE | 否 | 否 | 否 |

MySQL InnoDB 默认为 **REPEATABLE READ**，并通过 MVCC（多版本并发控制）和 Next-Key Lock 在此级别下基本消除幻读。

## SQL 事务操作

```sql
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 检查业务规则
SELECT balance FROM accounts WHERE id = 1;
-- 如果余额不足...

COMMIT;   -- 全部成功则提交
-- 或
ROLLBACK; -- 出错则回滚
```

### 保存点（Savepoint）

```sql
START TRANSACTION;
INSERT INTO orders ...;
SAVEPOINT before_payment;
INSERT INTO payments ...;
-- 支付失败，只回滚到保存点，订单数据保留
ROLLBACK TO SAVEPOINT before_payment;
COMMIT;
```

## TypeORM 中的事务

```typescript
// 方式一：QueryRunner（推荐，完全控制）
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(Order, order);
  await queryRunner.manager.decrement(Inventory, { id: itemId }, 'stock', 1);
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}

// 方式二：transaction 包装器（适合简单场景）
await dataSource.transaction(async (manager) => {
  await manager.save(Order, order);
  await manager.decrement(Inventory, { id: itemId }, 'stock', 1);
});
```

## 锁机制

### 乐观锁 vs 悲观锁

**悲观锁**：假设冲突一定发生，先锁定再操作。适合写多读少、竞争激烈的场景。

```sql
-- FOR UPDATE：加排他锁，其他事务无法读写
SELECT * FROM orders WHERE id = 1 FOR UPDATE;

-- LOCK IN SHARE MODE：加共享锁，允许其他事务读，但不能写
SELECT * FROM products WHERE id = 1 LOCK IN SHARE MODE;
```

**乐观锁**：假设冲突很少，提交时再检查是否被修改（通过版本号）。适合读多写少场景。

```sql
-- 更新时检查 version
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 5;
-- 影响行数为 0 说明已被并发修改，需重试
```

TypeORM 内置乐观锁支持：

```typescript
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stock: number;

  @VersionColumn()
  version: number;
}

// TypeORM 自动在 UPDATE 时校验 version
await productRepository.save(product); // version 不匹配时抛出 OptimisticLockVersionMismatchError
```

### InnoDB 锁类型

- **行锁（Record Lock）**：锁定具体一行。
- **间隙锁（Gap Lock）**：锁定索引记录之间的间隙，防止幻读。
- **Next-Key Lock**：行锁 + 间隙锁的组合，InnoDB 默认使用。
- **表锁**：锁整张表，并发性差，DDL 操作时触发。

### 死锁

两个事务互相等待对方持有的锁，形成循环依赖。

```
事务A: 锁定行1 → 等待行2
事务B: 锁定行2 → 等待行1  →  死锁！
```

InnoDB 会自动检测死锁并回滚代价较小的事务。预防死锁的方法：
1. 保持一致的加锁顺序。
2. 缩小事务范围，减少锁持有时间。
3. 尽量使用索引查询，避免表锁。

## 面试常问

- **MVCC 是什么？**
  多版本并发控制，InnoDB 通过 undo log 保存数据的多个版本，读操作访问快照，避免读写互相阻塞，实现非锁定读。
- **可重复读如何解决幻读？**
  普通 SELECT 使用快照读（MVCC），当前读（SELECT...FOR UPDATE）使用 Next-Key Lock 锁定范围，共同防止幻读。
- **乐观锁和悲观锁如何选择？**
  读多写少、冲突概率低用乐观锁（系统吞吐高）；写多冲突频繁用悲观锁（重试成本高时）。
- **事务过长有什么风险？**
  长事务持有锁时间长，阻塞其他事务；undo log 无法及时清理，占用大量存储。
