# Redis 数据结构与使用场景

Redis 是一个内存型键值数据库，其核心价值在于丰富的数据结构——不同结构对应不同场景，选对数据结构才能发挥 Redis 的最大优势。

## String（字符串）

最基础的类型，值可以是字符串、整数或浮点数（最大 512 MB）。

```bash
SET user:1:name "Alice"
GET user:1:name          # "Alice"

SET counter 0
INCR counter             # 1（原子自增）
INCRBY counter 5         # 6

SETEX session:abc123 3600 "{\"userId\":1}"  # 设置并指定过期时间（秒）
```

**典型场景**：缓存 JSON 对象、计数器（点赞数、访问量）、分布式锁（`SET key value NX EX seconds`）、Session 存储。

## Hash（哈希）

类似 Map，一个 key 下存储多个 field-value 对，适合存储对象。

```bash
HSET user:1 name "Alice" age 25 email "alice@example.com"
HGET user:1 name          # "Alice"
HMGET user:1 name email   # ["Alice", "alice@example.com"]
HGETALL user:1            # 返回所有 field-value
HINCRBY user:1 age 1      # age 变为 26
HDEL user:1 email
```

**典型场景**：存储用户信息、商品属性等结构化对象，相比将整个对象序列化为 String，Hash 支持局部更新，减少网络传输。

## List（列表）

双端链表，支持从两端 push/pop，保持插入顺序。

```bash
LPUSH messages "msg1" "msg2"   # 从左插入
RPUSH messages "msg3"          # 从右插入
LRANGE messages 0 -1           # 获取全部元素 ["msg2","msg1","msg3"]
LPOP messages                  # 弹出左端
BRPOP queue 30                 # 阻塞式右端弹出，等待最多 30 秒（消息队列用）
LLEN messages                  # 列表长度
```

**典型场景**：消息队列（生产者 LPUSH，消费者 BRPOP）、最新动态列表（LPUSH + LTRIM 保留最近 N 条）、操作历史。

## Set（集合）

无序、不重复的字符串集合，支持集合运算。

```bash
SADD tags "redis" "database" "cache"
SMEMBERS tags               # 返回所有成员
SISMEMBER tags "redis"      # 1（存在）
SCARD tags                  # 3（集合大小）

SADD tags2 "redis" "nosql"
SINTER tags tags2           # 交集：["redis"]
SUNION tags tags2           # 并集
SDIFF tags tags2            # 差集
```

**典型场景**：用户标签、去重统计（签到用户）、共同关注（SINTER）、抽奖（SRANDMEMBER / SPOP）。

## Sorted Set（有序集合）

每个成员关联一个 `score`（浮点数），成员按 score 升序排列，成员唯一但 score 可重复。

```bash
ZADD leaderboard 1500 "Alice" 2300 "Bob" 800 "Charlie"
ZRANGE leaderboard 0 -1 WITHSCORES  # 按分数升序
ZREVRANGE leaderboard 0 2           # 按分数降序，取前3
ZSCORE leaderboard "Bob"            # 2300
ZRANK leaderboard "Alice"           # 排名（从0）
ZINCRBY leaderboard 100 "Alice"     # 分数 +100
ZRANGEBYSCORE leaderboard 1000 2000 # 按分数范围查询
```

**典型场景**：实时排行榜、带权重的任务队列、时间线（用时间戳作 score）、范围查询（如距离排序）。

## 其他常用类型

### Bitmap

基于 String 的位操作，极省内存，适合布尔类型的大规模统计。

```bash
SETBIT sign:2024-01 1 1    # 用户 ID=1，1月签到
GETBIT sign:2024-01 1      # 查询签到状态
BITCOUNT sign:2024-01      # 统计1月签到总人数
```

**场景**：用户签到、功能开关、布隆过滤器的底层实现。

### HyperLogLog

用极小内存（约 12 KB）估算集合基数，误差率约 0.81%。

```bash
PFADD visitors "user:1" "user:2" "user:3"
PFCOUNT visitors    # 估算独立访客数
```

**场景**：UV 统计（独立访客数），不需要精确值时非常适用。

## 数据结构选型速查

| 需求 | 推荐结构 |
|------|----------|
| 缓存单个对象 | String（JSON）或 Hash |
| 存储对象并频繁部分更新 | Hash |
| 消息队列 / 任务列表 | List |
| 去重、标签、共同关注 | Set |
| 排行榜、按分值范围查询 | Sorted Set |
| 签到、布尔状态大规模存储 | Bitmap |
| 海量数据估算基数 | HyperLogLog |

## 面试常问

- **Sorted Set 底层用什么实现？**
  元素较少时用 ziplist（紧凑列表），元素多时用 skiplist（跳表）+ hashtable 双索引结构，跳表查找时间复杂度 O(log N)。
- **List 底层实现？**
  旧版用 ziplist + linkedlist，Redis 3.2+ 统一为 quicklist（ziplist 节点组成的双向链表）。
- **为什么 Redis 的 String 最大 512 MB？**
  SDS（简单动态字符串）的长度字段为 32 位，理论最大值即 512 MB；实际建议单个值不超过 1 MB。
