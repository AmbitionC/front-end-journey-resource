# 分库分表与读写分离

当单库数据量或并发量超过承载上限时，分库分表和读写分离是两种主要的水平扩展方案。两者解决的问题不同，通常配合使用。

## 读写分离

**核心思路**：主库（Master）处理写操作，一个或多个从库（Replica）处理读操作。利用 MySQL 主从复制，将读压力分散到多个节点。

```
应用层
  ├── 写请求 → 主库（Master）
  └── 读请求 → 从库1 / 从库2 / 从库3（负载均衡）

主库 → binlog → 从库（异步/半同步复制）
```

**注意事项**：

- 主从复制存在延迟（通常毫秒级，网络差时可达秒级），写后立即读可能读到旧数据。
- 对一致性要求高的读（如支付后查询余额）应强制走主库。

```typescript
// 使用 TypeORM 配置读写分离
const dataSource = new DataSource({
  type: 'mysql',
  replication: {
    master: { host: 'master.db', port: 3306, username: 'root', password: '', database: 'app' },
    slaves: [
      { host: 'replica1.db', port: 3306, username: 'root', password: '', database: 'app' },
      { host: 'replica2.db', port: 3306, username: 'root', password: '', database: 'app' },
    ],
  },
});

// 强制走主库：使用 QueryRunner
const qr = dataSource.createQueryRunner('master');
const user = await qr.manager.findOneBy(User, { id: userId });
await qr.release();
```

## 分库分表

### 垂直分库（按业务拆分）

将不同业务的表拆到独立的数据库，降低单库复杂度，实现业务解耦。

```
拆分前：monolith_db（用户表 + 订单表 + 商品表 + 日志表）

拆分后：
  user_db    → users, profiles
  order_db   → orders, order_items
  product_db → products, categories
  log_db     → access_logs, error_logs
```

**代价**：跨库 JOIN 消失，需在应用层聚合；分布式事务复杂度上升。

### 垂直分表（按列拆分）

将宽表中不常用、大字段（如 TEXT、BLOB）拆到单独的表，减少热表行宽，提升缓存命中率。

```sql
-- 拆分前：users（id, name, email, avatar, bio, settings_json, …）
-- 拆分后：
--   users_core（id, name, email）     ← 高频访问
--   users_detail（user_id, bio, settings_json）  ← 低频访问
```

### 水平分表（Sharding）

将同一张表的数据按某个维度（Shard Key）分散到多张表或多个库，每张表结构相同，解决单表数据量过大的问题。

**Shard Key 选择原则**：
- 数据均匀分布，避免热点。
- 查询尽量命中单个分片，避免跨分片查询。
- 常用 `user_id`、`order_id` 等业务主键。

**常见分片策略**：

```
1. 取模分片（Hash Mod）
   shard = userId % shardCount
   优点：分布均匀；缺点：扩容时需迁移大量数据

2. 范围分片（Range）
   id 0–999999 → shard0，1000000–1999999 → shard1
   优点：扩容简单；缺点：热点问题（最新数据集中在最后一片）

3. 一致性哈希
   优点：扩容时只迁移相邻节点数据
```

### 水平分片示例（伪代码）

```typescript
function getShardIndex(userId: number, totalShards: number): number {
  return userId % totalShards;
}

async function getOrdersByUser(userId: number) {
  const shard = getShardIndex(userId, 4);
  const tableName = `orders_${shard}`; // orders_0, orders_1, orders_2, orders_3
  return db.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, [userId]);
}
```

## 分布式主键

分表后各表独立自增，会产生重复 ID，需要全局唯一 ID 方案：

| 方案 | 原理 | 特点 |
|------|------|------|
| UUID | 随机字符串 | 无序，索引性能差 |
| 雪花算法（Snowflake） | 时间戳 + 机器ID + 序列号 | 趋势递增，高性能 |
| 数据库号段模式 | 批量预分配 ID 段 | 简单可靠，有轻微号段浪费 |
| Redis INCR | 原子自增 | 简单，依赖 Redis 可用性 |

雪花算法 64-bit 结构：

```
[1 bit 符号位][41 bit 时间戳（毫秒）][10 bit 机器ID][12 bit 序列号]
```

## 跨分片查询的挑战

```
需求：查询所有用户最近 10 条订单（按时间排序）

问题：数据分布在多个 shard，无法直接 ORDER BY + LIMIT
解法：
  1. 各 shard 分别查询 Top 10 → 应用层归并排序 → 取最终 Top 10
  2. 引入搜索引擎（Elasticsearch）冗余存储，专门处理复杂查询
  3. 设计时避免此类查询，按 shard key 查询
```

## 面试常问

- **什么时候需要分库分表？**
  单表超过数千万行且查询明显变慢，或单库 QPS 达到瓶颈，不能通过加索引、读写分离解决时才考虑分表，分表会大幅增加复杂度。
- **为什么不推荐跨库 JOIN？**
  跨库 JOIN 无法下推到数据库层执行，必须在应用层拉取两端数据再合并，数据量大时性能极差，且难以保证一致性。
- **分布式事务如何处理？**
  常用方案有 Saga 模式（补偿事务）、TCC（Try-Confirm-Cancel）、基于消息队列的最终一致性，选择取决于一致性要求和业务容忍度。
- **雪花算法的缺点？**
  依赖系统时钟，时钟回拨会导致 ID 重复；机器 ID 需要额外分配管理。
