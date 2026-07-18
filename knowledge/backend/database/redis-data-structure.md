![中心为 use case，分支到 String 计数、Hash 对象、List 队列、Set 去重、Sorted Set 排名、Stream 消息日志；每类显示核心操作与顺序/唯一性属性](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/redis-data-types-access-patterns-v1.webp)
*图：沿图中的节点与箭头阅读，重点是命令语义和访问模式比较 string、hash、list、set、sorted set、stream，而不是仅列名称。*

---

Redis 提供多种具有不同顺序性、唯一性和访问操作的数据类型。选型匹配访问模式时可以减少额外转换并简化逻辑，但延迟和内存仍取决于数据规模、编码、命令复杂度和部署方式。本文按命令语义比较这些类型。

## String（字符串）——最通用的瑞士军刀

[Redis data types](https://redis.io/docs/latest/develop/data-types/) 按 string、hash、list、set、sorted set、stream 等类型定义顺序性、唯一性和访问模式；选型应从操作语义出发。


### 底层实现：SDS（Simple Dynamic String）

Redis 的 String 并不直接使用 C 原生字符串，而是封装了一种称为 **SDS（简单动态字符串）** 的结构：

```c
struct sdshdr {
    int len;    // 已使用长度
    int free;   // 剩余可用空间
    char buf[]; // 实际字节数组
};
```

SDS 相比 C 字符串的优势：
- `O(1)` 获取字符串长度（存了 `len`，不需遍历）
- 预分配空间，追加操作不频繁 `malloc`
- 二进制安全（可存任意字节，包括 `\0`）

单个 String 最大支持 **512 MB**，但工程上建议单值不超过 **1 MB**，超出则考虑压缩或拆分。

### 使用场景

**1. 缓存简单 KV / JSON 对象**

```bash
SET user:1:profile '{"name":"Alice","age":25}' EX 3600
GET user:1:profile
```

**2. 计数器（原子自增）**

```bash
INCR page:home:pv          # 访问量 +1，原子操作，天然防并发
INCRBY order:2024:count 1  # 订单计数
DECR stock:item:42         # 库存扣减
```

**3. 分布式锁**

```bash
# NX：不存在才设置；EX：过期时间；防止死锁
SET lock:payment:order_123 "worker_id_abc" NX EX 30
```

对于 AI Agent 后端，计数器常用于限流（Rate Limiting）：单位时间内对某个 API Key 的调用次数，用 `INCR` + `EXPIRE` 可以极低成本实现滑动窗口计数。

---

## List（列表）——有序序列与流式缓冲

### 底层实现

| Redis 版本 | 小对象（元素少/值小） | 大对象（元素多/值大） |
|---|---|---|
| < 3.2 | ziplist（紧凑连续内存） | linkedlist（双向链表） |
| 3.2 – 7.0 | quicklist（ziplist 节点组成的双向链表） | quicklist |
| >= 7.0 | quicklist（内部节点改用 **listpack**） | quicklist |

**ziplist / listpack** 将所有元素紧凑地存放在连续内存中，省去了指针开销，对小列表极度节省内存；但随着元素增多，插入/删除的内存拷贝代价上升，Redis 会自动升级为 quicklist（双向链表，每个节点是一个 listpack）。

### 核心命令

```bash
LPUSH queue "taskA"          # 左端插入（生产者）
RPOP  queue                  # 右端弹出（消费者，实现 FIFO）
BRPOP queue 30               # 阻塞弹出，等待最多 30 秒（无任务时挂起，节省 CPU）
LRANGE history:user:1 0 49   # 获取最近 50 条记录
LTRIM history:user:1 0 99    # 只保留最近 100 条，超出自动丢弃
LLEN  queue                  # 队列长度
```

### Agent 后端实战：缓冲 LLM 流式输出 Token

LLM（Large Language Model）通常以 SSE（Server-Sent Events）流式输出 token。若有多个消费端（如 WebSocket 推送、日志记录、审计），可以用 List 作为流式 token 的中间缓冲层：

```typescript
// ioredis 示例：生产者将 token 写入 List
import Redis from 'ioredis';
const redis = new Redis();

async function bufferLLMToken(sessionId: string, token: string): Promise<void> {
  const key = `llm:stream:${sessionId}`;
  await redis.rpush(key, token);          // 每个 token 追加到右端
  await redis.expire(key, 300);           // 5 分钟自动过期，防止内存泄漏
}

// 消费者：批量读取并清空
async function flushTokenBuffer(sessionId: string): Promise<string[]> {
  const key = `llm:stream:${sessionId}`;
  const tokens = await redis.lrange(key, 0, -1);
  await redis.del(key);
  return tokens;
}
```

**注意**：List 用作消息队列时缺少 **ACK 机制**——消费者 `RPOP` 后如果崩溃，消息永久丢失。如需可靠消息传递，应使用 Redis Streams（`XADD/XREADGROUP`）或专业 MQ（Kafka/RabbitMQ）。

---

## Hash（哈希）——对象存储的最佳实践

### 底层实现

- **元素 ≤ 128 个且每个值 ≤ 64 字节**：使用 **listpack**（紧凑连续内存，Redis 7.0 前为 ziplist）
- 超出阈值：升级为 **hashtable**（拉链法哈希表，`O(1)` 查找）

阈值可通过配置调整：

```bash
hash-max-listpack-entries 128   # listpack 最大条目数
hash-max-listpack-value   64    # 单个字段的最大字节数
```

### Hash vs. JSON String 对比

| 维度 | Hash | JSON String |
|---|---|---|
| 读取单个字段 | `HGET key field`，`O(1)` | `GET` 后客户端解析，传输整个对象 |
| 更新单个字段 | `HSET key field value`，`O(1)` | 读-改-写全量覆盖，存在并发风险 |
| 内存占用（小对象） | listpack 紧凑存储，更省内存 | 额外 JSON 语法开销（`{}`、`""`） |
| 数值原子操作 | `HINCRBY` 直接原子递增 | 需要 Lua 脚本或事务 |
| 适合场景 | 字段频繁独立读写的结构化对象 | 对象整体读写，结构复杂或嵌套深 |

### 实战：AI 会话（Session）管理

```typescript
import Redis from 'ioredis';
const redis = new Redis();

interface AgentSession {
  userId: string;
  model: string;
  tokenUsed: number;
  createdAt: string;
}

// 写入会话：各字段独立存储
async function createSession(sessionId: string, data: AgentSession): Promise<void> {
  await redis.hset(`session:${sessionId}`, {
    userId:    data.userId,
    model:     data.model,
    tokenUsed: data.tokenUsed,
    createdAt: data.createdAt,
  });
  await redis.expire(`session:${sessionId}`, 7200); // 2 小时过期
}

// 仅更新 token 消耗，不触碰其他字段
async function incrementTokenUsage(sessionId: string, delta: number): Promise<number> {
  return redis.hincrby(`session:${sessionId}`, 'tokenUsed', delta);
}

// 读取部分字段
async function getSessionModel(sessionId: string): Promise<string | null> {
  return redis.hget(`session:${sessionId}`, 'model');
}
```

---

## Set（集合）——去重与关系运算

### 底层实现

- **元素 ≤ 128 个且均为整数**：使用 **intset**（有序整数数组，极省内存）
- **元素为小字符串（≤ 128 个，单值 ≤ 64 字节）**：使用 **listpack**（Redis 7.2+）
- 超出阈值：升级为 **hashtable**

### 核心命令与场景

```bash
# 用户标签去重
SADD user:1:tags "AI" "backend" "redis"
SISMEMBER user:1:tags "AI"       # 1（存在）
SCARD user:1:tags                # 3（标签数量）

# 社交关系：共同关注
SADD follow:alice "bob" "carol" "dave"
SADD follow:bob   "carol" "dave" "eve"
SINTER follow:alice follow:bob   # ["carol", "dave"]——共同关注

# 并集：推荐系统扩散
SUNIONSTORE recommend:alice follow:alice follow:bob

# 随机抽奖（不删除）
SRANDMEMBER lucky:pool 3   # 随机取 3 人
# 随机抽奖（删除）
SPOP lucky:pool 1          # 抽走 1 人，不可重复中奖
```

对于 AI Agent 平台，Set 可用于**工具集合（Tool Registry）去重**：同一个 Tool 被多个 Agent 引用时，用 Set 存储各 Agent 的可用工具列表，`SINTER` 快速计算两个 Agent 共有的工具。

---

## Sorted Set / ZSet（有序集合）——排行榜与优先级队列

### 底层实现：跳表（Skip List）+ 哈希表

ZSet 是 Redis 中实现最精妙的数据结构：

- **元素较少（≤ 128 个，单值 ≤ 64 字节）**：listpack
- **元素较多**：**skiplist（跳表）+ hashtable 双索引**

```
跳表（按 score 排序，支持范围查询）
hashtable（按 member 查询 score，O(1)）
```

跳表是一种多层有序链表，通过概率分层（每层节点数约为下层的 1/4）实现 `O(log N)` 的查找、插入、删除，同时保持有序性——这是平衡树所能提供的性能，但实现更简单。

### 核心命令

```bash
ZADD leaderboard 2300 "Bob" 1500 "Alice" 800 "Charlie"

ZREVRANGE  leaderboard 0 2 WITHSCORES     # 降序前3名
ZRANK      leaderboard "Alice"            # 正序排名（0-based）
ZREVRANK   leaderboard "Alice"            # 倒序排名
ZINCRBY    leaderboard 100 "Alice"        # 原子加分
ZRANGEBYSCORE leaderboard 1000 2000       # 按分数范围查询
ZCOUNT     leaderboard 1000 2000          # 分数范围内的成员数
ZREM       leaderboard "Charlie"          # 删除成员
```

### Agent 后端实战：任务优先级队列

ZSet 的 score 充当优先级，实现 Agent 任务调度：

```typescript
import Redis from 'ioredis';
const redis = new Redis();

type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

const PRIORITY_SCORE: Record<TaskPriority, number> = {
  critical: 100,
  high:     70,
  normal:   40,
  low:      10,
};

// 提交 Agent 任务
async function submitAgentTask(
  taskId: string,
  priority: TaskPriority,
  payload: object
): Promise<void> {
  const score = PRIORITY_SCORE[priority];
  // 同优先级内按提交时间排序：score * 1e13 + timestamp
  const finalScore = score * 1e13 + Date.now();
  await redis.zadd('agent:task:queue', finalScore, taskId);
  await redis.set(`agent:task:data:${taskId}`, JSON.stringify(payload), 'EX', 3600);
}

// Worker 弹出最高优先级任务
async function popHighestPriorityTask(): Promise<string | null> {
  // ZPOPMAX 弹出 score 最大（优先级最高）的任务
  const result = await redis.zpopmax('agent:task:queue', 1);
  if (!result || result.length === 0) return null;
  const taskId = result[0] as string;
  const data = await redis.get(`agent:task:data:${taskId}`);
  return data;
}
```

ZSet 还常用于**延迟队列**：将任务的执行时间戳作为 score，定期用 `ZRANGEBYSCORE queue 0 <now>` 扫描到期任务。

---

## 时间复杂度对比速查

[Redis commands 参考](https://redis.io/docs/latest/commands/) 为命令记录参数、返回值和复杂度；同一种数据类型里的不同命令也可能有完全不同的成本。


| 操作 | String | List | Hash | Set | ZSet |
|---|---|---|---|---|---|
| 增/删单元素 | `O(1)` | `O(1)`（头尾） | `O(1)` | `O(1)` | `O(log N)` |
| 查单元素 | `O(1)` | `O(N)`（按索引） | `O(1)` | `O(1)` | `O(log N)` |
| 范围查询 | - | `O(S+N)` | - | - | `O(log N + M)` |
| 集合运算 | - | - | - | `O(N*M)` | `O(N*log N + M)` |
| 获取大小 | `O(1)` | `O(1)` | `O(1)` | `O(1)` | `O(1)` |

---

## 内存优化：小对象的 listpack 优化

所有数据结构在元素数量少、单值较小时，Redis 都会使用紧凑编码（listpack/ziplist/intset）存储。以 Hash 为例：

```
listpack 存储（元素少）：
[总字节数][尾部偏移量][field1][val1][field2][val2]...
连续内存，无指针，CPU Cache 友好

hashtable 存储（元素多）：
桶数组 → 链表节点（含指针），随机内存，Cache Miss 增加
```

调整阈值参数可以在内存与性能之间权衡：

```bash
# redis.conf
hash-max-listpack-entries 128   # 超过此值升级为 hashtable
hash-max-listpack-value   64    # 单字段超过此字节数升级
list-max-listpack-size   128
zset-max-listpack-entries 128
set-max-intset-entries   512
```

对于存储大量小 Hash 对象的场景（如用户画像），可以**故意将多个对象合并到一个 Hash** 中（以 UID 后两位为 field 名），利用 listpack 紧凑编码，内存节省可达数倍。

---

## 常见误区

### 1. 大 Key 问题（Big Key）

大 Key 是 Redis 最常见的性能陷阱。当 String 的值超过 10 KB，或 Hash/List/Set/ZSet 的元素超过数千个时，单次操作耗时飙升，并且在**删除（`DEL`）时会阻塞主线程**。

推荐做法：
- 拆分大 Key：将 Hash 按范围拆成多个子 Key
- 异步删除：`UNLINK` 代替 `DEL`，后台线程异步回收内存
- 定期用 `redis-cli --bigkeys` 或 `SCAN` + `OBJECT ENCODING/IDLETIME` 巡检

### 2. List 当消息队列的 ACK 缺失

`LPUSH/BRPOP` 模式消费者 `RPOP` 后消息即刻消失，若消费者崩溃则消息永久丢失，没有 ACK/重试机制。

```
生产者               Redis List              消费者
  LPUSH ──────────> [task3][task2][task1]
                                    RPOP ──> 处理中...崩溃！
                                             消息丢失！
```

**解决方案**：用 `LMOVE source dest LEFT RIGHT` 将任务原子移到"处理中"列表，消费完成后 `LREM` 删除；或直接使用 Redis Streams（`XREADGROUP` + `XACK`）。

### 3. ZSet score 精度问题

Redis 的 score 是 IEEE 754 双精度浮点数（64 bit），可以精确表示 2^53 以内的整数（约 9 千万亿）。将毫秒时间戳（约 1.7×10^13）作为 score 时仍在精确范围内，但超出则会有精度损失。

---

## 面试常问要点

**Q：Redis String 底层为什么不直接用 C 字符串？**
SDS 提供 `O(1)` 长度获取、二进制安全、预分配减少重分配次数，C 字符串均不具备这些特性。

**Q：Sorted Set 为什么选跳表而非平衡树（红黑树）？**
跳表实现简单、范围查询（`ZRANGEBYSCORE`）天然支持顺序遍历、并发修改时锁粒度更小；Redis 作者 Antirez 明确表示跳表在实践中性能不逊于平衡树。

**Q：List 的 quicklist 结构是什么？**
quicklist 是一个双向链表，每个节点是一个 listpack（Redis 7.0+）或 ziplist（旧版）。结合了链表（O(1) 头尾操作）和 listpack（内存紧凑）的优点，通过 `list-max-listpack-size` 控制每个节点的最大大小。

**Q：Hash 与 JSON String 如何选型？**
- 需要**局部更新**或**原子递增**字段 → Hash
- 对象**整体读写**且结构深度嵌套 → JSON String
- 字段数量较少（≤ 128）且值较小（≤ 64 字节）→ Hash 更省内存（listpack 编码）

**Q：如何用 Redis 实现 Agent 任务优先级调度？**
ZSet score 编码优先级 + 时间戳（`priority * 1e13 + timestamp`），`ZPOPMAX` 弹出最高优先级任务；延迟任务则以执行时间戳为 score，定时轮询 `ZRANGEBYSCORE queue 0 now`。

**Q：什么是 Big Key？如何处理？**
单个 String 超过 10 KB，或集合类型元素超过数千个，即视为 Big Key。会阻塞主线程（尤其是删除时）。处理方式：拆分 Key、用 `UNLINK` 异步删除、定期巡检。

## 参考资料

- [Redis data types](https://redis.io/docs/latest/develop/data-types/)
- [Redis commands](https://redis.io/docs/latest/commands/)
