索引是数据库提升查询性能的核心机制。理解索引的底层原理，才能在设计表结构和编写 SQL 时做出正确决策。

## 索引的底层结构：B+ 树

MySQL InnoDB 引擎默认使用 **B+ 树**索引。B+ 树是一种多路平衡搜索树，特点如下：

- 所有数据记录都存储在叶子节点，非叶节点只存键值（用于导航）。
- 叶子节点通过双向链表连接，支持高效的范围查询。
- 树高通常只有 3–4 层，单次查询磁盘 I/O 极少。

```
         [30 | 60]
        /    |     \
   [10|20] [40|50] [70|80]
    ↕         ↕        ↕
   叶子链表（含实际行数据或主键）
```

**聚簇索引 vs 二级索引**

- **聚簇索引（主键索引）**：叶子节点直接存储完整行数据，一张表只能有一个。
- **二级索引（非主键）**：叶子节点存储的是 **主键值**，查询时需要"回表"再通过主键索引找到完整行。

## 索引类型

| 类型 | 说明 |
|------|------|
| 主键索引 | 唯一且非空，聚簇存储 |
| 唯一索引 | 值唯一，允许 NULL |
| 普通索引 | 无唯一性约束 |
| 复合索引 | 多列组合，遵循最左前缀 |
| 全文索引 | 用于文本搜索（FULLTEXT） |

## 最左前缀原则

复合索引 `(a, b, c)` 可以命中以下查询：

```sql
-- 命中索引
SELECT * FROM t WHERE a = 1;
SELECT * FROM t WHERE a = 1 AND b = 2;
SELECT * FROM t WHERE a = 1 AND b = 2 AND c = 3;
SELECT * FROM t WHERE a = 1 AND b > 2;   -- a 命中，b 范围查询后 c 不再用

-- 不命中索引
SELECT * FROM t WHERE b = 2;             -- 跳过了 a
SELECT * FROM t WHERE b = 2 AND c = 3;  -- 跳过了 a
```

规则：从索引最左列开始连续使用，遇到范围查询（`>`、`<`、`BETWEEN`、`LIKE 'x%'`）之后的列无法继续走索引。

## 覆盖索引

如果查询只需要索引中已有的列，不需要回表，称为**覆盖索引**（Using index）。性能显著优于普通二级索引查询。

```sql
-- 假设索引为 (name, age)
-- 以下查询全部数据在索引中，无需回表
SELECT name, age FROM users WHERE name = 'Alice';
```

EXPLAIN 中 `Extra: Using index` 表明触发了覆盖索引。

## 索引失效场景

```sql
-- 1. 对索引列使用函数
SELECT * FROM t WHERE YEAR(create_time) = 2024;   -- 失效
SELECT * FROM t WHERE create_time >= '2024-01-01'; -- 有效

-- 2. 隐式类型转换（列为 varchar，传入数字）
SELECT * FROM t WHERE phone = 13800138000;         -- 失效（phone 是 varchar）
SELECT * FROM t WHERE phone = '13800138000';        -- 有效

-- 3. LIKE 以通配符开头
SELECT * FROM t WHERE name LIKE '%Alice';           -- 失效
SELECT * FROM t WHERE name LIKE 'Alice%';           -- 有效

-- 4. OR 条件中有未索引列（OR 两侧均有索引才能走 index merge）
SELECT * FROM t WHERE a = 1 OR b = 2;              -- b 无索引时整体失效
```

## 执行计划分析

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 100 AND status = 1;
```

关注字段：

- `type`：`const` > `eq_ref` > `ref` > `range` > `index` > `ALL`（ALL 表示全表扫描）
- `key`：实际使用的索引名
- `rows`：估算扫描行数
- `Extra`：`Using index`（覆盖）、`Using filesort`（需优化排序）、`Using temporary`（需优化）

## 索引设计最佳实践

1. **高选择性列优先**：区分度高（如 user_id、email）的列放在复合索引前面。
2. **控制索引数量**：过多索引会拖慢写操作（INSERT/UPDATE/DELETE 需维护所有索引）。
3. **区分大表与小表**：小表（万行以下）全表扫描往往比走索引更快。
4. **优先考虑覆盖索引**：对高频查询，将 SELECT 列纳入索引以消除回表。
5. **避免冗余索引**：`(a)` 和 `(a, b)` 同时存在时，`(a)` 是冗余的。

## 面试常问

- **为什么用 B+ 树而不是 B 树或哈希索引？**
  B+ 树叶子链表天然支持范围查询；哈希索引只支持等值，不支持范围和排序。
- **回表是什么，如何避免？**
  二级索引查询主键后再查聚簇索引叫回表，通过覆盖索引可避免。
- **联合索引字段顺序如何确定？**
  优先将等值查询列、高选择性列放在左边；排序/范围列放后面。
- **EXPLAIN 中 type = ALL 意味着什么？**
  全表扫描，通常需要加索引或优化 SQL。
