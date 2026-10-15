![中心为 use case，分支到 String 计数、Hash 对象、List 队列、Set 去重、Sorted Set 排名、Stream 消息日志；每类显示核心操作与顺序/唯一性属性](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/redis-data-types-access-patterns-v1.webp)
*图：沿图中的节点与箭头阅读，重点是命令语义和访问模式比较 string、hash、list、set、sorted set、stream，而不是仅列名称。*

---

Redis 提供多种具有不同顺序性、唯一性和访问操作的数据类型。选型匹配访问模式时可以减少额外转换并简化逻辑，但延迟和内存仍取决于数据规模、编码、命令复杂度和部署方式。本文按命令语义比较这些类型。

内部编码与配置示例以 Redis 8.4 分支为核验范围（2026-10-15）；默认值不等于部署配置，先用实际版本与 `OBJECT ENCODING` 核对。下列 TypeScript 片段为伪代码，未连接 Redis，也未在固定客户端版本下运行；不提供吞吐或可靠投递保证。

## String（字符串）——最通用的瑞士军刀

[Redis data types](https://redis.io/docs/latest/develop/data-types/) 按 string、hash、list、set、sorted set、stream 等类型定义顺序性、唯一性和访问模式；选型应从操作语义出发。


### 底层实现：SDS（Simple Dynamic String）

Redis String 是对外的数据类型，不等于一种固定内部编码。可表示为整数的值可能采用整数编码；需要保存字节串时使用 SDS 等表示。SDS（简单动态字符串）保留长度与容量信息，下面仅示意其目的：

```c
// 概念示意，不是 Redis 8.4 的真实内存布局。
// 当前实现按长度范围选择 sdshdr5/8/16/32/64 等头部。
struct ConceptualString {
    size_t used;      // 已用字节
    size_t capacity;  // 可分配容量
    char bytes[];
};
```

SDS 相比 C 字符串的优势：
- `O(1)` 获取字符串长度（存了 `len`，不需遍历）
- 预分配空间，追加操作不频繁 `malloc`
- 二进制安全（可存任意字节，包括 `\0`）

Redis 8.4 示例配置中的 `proto-max-bulk-len` 默认限制协议中的单个 bulk string 为 512 MB，并可配置；这不是推荐业务值大小。业务上限应按操作成本、网络、内存和延迟预算确定，不存在通用的 1 MB 最佳界线。

### 使用场景

**1. 缓存简单 KV / JSON 对象**

```bash
SET user:1:profile '{"name":"Alice","age":25}' EX 3600
GET user:1:profile
```

**2. 计数器（原子自增）**

```bash
INCR page:home:pv          # 本次自增是原子的；读取、判断再扣减仍不是同一个原子操作
INCRBY order:2024:count 1  # 订单计数
DECR stock:item:42         # 库存扣减
```

**3. 分布式锁**

```bash
# NX：不存在才设置；EX：租约时长，不能阻止过期持有者继续写
SET lock:payment:order_123 "unique_token_per_acquisition" NX EX 30
```

计数器可用于固定时间桶或从首次事件开始计时的限流，但 `INCR` 加 `EXPIRE` 本身不构成滑动窗口；分别发送还可能在计数后、设置过期前失败。按固定窗口合同用事务或脚本原子设置计数与首次过期；若需滑动窗口，另用时间戳集合或明确的滑窗算法，并评估内存与边界突发。

---

## List（列表）——有序序列与流式缓冲

### 底层实现

早期 Redis 使用过 ziplist 与 linkedlist；3.2 引入 quicklist，7.0 的 quicklist 节点改用 listpack。核验的 Redis 8.4 `t_list.c` 同时支持直接 listpack 与 quicklist：小列表可先使用 listpack，增长后按配置与转换条件转为 quicklist，不能把“所有 7.0 以后 List 都只有 quicklist”当成规则。

listpack 用连续内存节省指针开销，内部插删可能移动字节；quicklist 将多个紧凑节点连接起来。实际成本还受节点容量、压缩和元素大小影响。

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

模型接口可通过 SSE 推送增量内容，但网络 chunk、SSE 事件与模型 token 不一一对应。List 可作为允许丢失的单消费缓冲；多个消费者会竞争移除元素，不能直接把同一 List 当作每端均能读取全量内容的广播日志。需要独立消费进度和确认时，应另设消息日志或消费组。

```typescript
// ioredis 示例：生产者将 token 写入 List
import Redis from 'ioredis';
const redis = new Redis();

async function bufferLLMToken(sessionId: string, token: string): Promise<void> {
  const key = `llm:stream:${sessionId}`;
  // 同一事务提交追加与过期，避免两条独立命令之间中断。
  const result = await redis.multi().rpush(key, token).expire(key, 300).exec();
  if (!result || result.some(([error]) => error)) throw new Error("buffer write failed");
}

// Redis 6.2+ 的 LPOP count 在一条命令中移除并返回有界前缀。
async function flushTokenBuffer(sessionId: string): Promise<string[]> {
  const key = `llm:stream:${sessionId}`;
  return (await redis.lpop(key, 256)) ?? [];
}
```

**注意**：256 只是示例批大小，生产按 payload 与延迟预算配置；`MULTI/EXEC` 不会回滚运行期命令错误，须检查结果。弹出后、业务处理前崩溃仍可能丢失；需可靠处理时可设计 processing list 或使用 Redis Streams（`XADD/XREADGROUP`）及确认、接管与业务幂等，专业 MQ 也须核对自身投递合同。

---

## Hash（哈希）——对象存储的最佳实践

### 底层实现

- Redis 8.4 默认 `hash-max-listpack-entries 512`、`hash-max-listpack-value 64`，满足条目数与 field/value 大小等条件的小 Hash 可用 **listpack**；Redis 7.0 前的对应紧凑编码是 ziplist。
- 超出配置条件时转为 **hashtable**；字典查找为平均常数成本，紧凑编码则受条目数影响。字段过期等实现条件也应按实际版本核对，不能只看两个数字。

阈值可通过配置调整：

```bash
hash-max-listpack-entries 512   # Redis 8.4 示例默认值，可配置
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

- 全部成员可表示为有符号 64 位整数，且未超 `set-max-intset-entries` 时可用 **intset**；Redis 8.4 默认该阈值为 512。
- Redis 7.2+ 还支持小字符串集合的 **listpack**；8.4 示例默认 `set-max-listpack-entries 128`、`set-max-listpack-value 64`。
- 超出相应条件时转为 **hashtable**；配置与内容决定实际编码。

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

- Redis 8.4 示例默认 `zset-max-listpack-entries 128`、`zset-max-listpack-value 64`，满足对应条件的小集合用 listpack。
- 超出条件时，核验实现用 **skiplist（跳表）+ hashtable 双索引**；阈值可配置。

```
跳表（按 score 排序，支持范围查询）
hashtable（按 member 查询 score，O(1)）
```

跳表通过随机层高建立稀疏索引；Redis 8.4 的提升概率为 1/4，因此节点层数比例是统计期望。查找、插入和删除的期望复杂度为 `O(log N)`，不是平衡搜索树那样的确定性最坏情况保证；范围输出另加返回数量。

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
  // ZPOPMAX 使更大的时间戳先出；本例不声称同优先级 FIFO。
  const finalScore = score * 1e13 + Date.now();
  if (!Number.isSafeInteger(finalScore)) throw new Error("score exceeds integer precision");
  const result = await redis.multi()
    .set(`agent:task:data:${taskId}`, JSON.stringify(payload), 'EX', 3600)
    .zadd('agent:task:queue', finalScore, taskId)
    .exec();
  if (!result || result.some(([error]) => error)) throw new Error("task enqueue failed");
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

上例仅说明优先级排序；payload 可能过期，Worker 弹出后也可能崩溃，所以它没有 ACK、重投或可靠任务恢复保证。生产设计须选择原子认领、处理状态、确认与幂等合同；若要求同优先级 FIFO，另定义稳定序号与排序规则。

ZSet 也可用执行时间戳筛选到期任务，但 `ZRANGEBYSCORE` 只是读取；多个 Worker 还需原子认领，不能读到即视为独占执行。

---

## 时间复杂度对比速查

[Redis commands 参考](https://redis.io/docs/latest/commands/) 为命令记录参数、返回值和复杂度；同一种数据类型里的不同命令也可能有完全不同的成本。


| 命令与操作 | 官方复杂度模型 |
|---|---|
| `GET` / `INCR` | `O(1)`；GET 的网络传输仍与值长度有关 |
| `SET` | 官方标注 `O(1)`；载荷传输和内存处理仍受字节数影响 |
| 单元素 `LPUSH` / `RPOP` | `O(1)`；批量数量另计 |
| `LRANGE` | `O(S + M)`，S 为定位起点的距离，M 为返回数 |
| `HGET` / 单字段 `HSET` | `O(1)`；批量字段数另计 |
| `SISMEMBER` / 单元素 `SADD` | `O(1)`；集合运算按具体命令计算 |
| `SINTER` | 最坏 `O(N × K)`，N 为最小集合大小，K 为集合数 |
| `ZSCORE` | `O(1)`，按 member 查分数 |
| 单元素 `ZADD` / `ZRANK` | `O(log N)`，N 为集合大小 |
| `ZRANGE` | `O(log N + M)`，M 为返回数 |

复杂度描述绑定命令与参数，不能按“增删/集合运算”给整类命令同一个公式；紧凑编码、值大小与返回字节数仍会影响实际延迟。

---

## 内存优化：小对象的 listpack 优化

部分聚合类型在满足配置条件时使用 listpack、intset 等紧凑编码，不能推广到所有 Redis 类型。以 Redis 8.4 中普通小 Hash 的 listpack 为概念示例：

```
listpack 存储（元素少）：
[总字节数:4B][元素数量:2B][field1条目][value1条目]...[结束标记]
每个条目包含编码后的值与用于反向定位的 backlen；没有 ziplist 式尾部偏移字段。
连续内存，无指针，CPU Cache 友好

hashtable 存储（元素多）：
桶数组 → 链表节点（含指针），随机内存，Cache Miss 增加
```

调整阈值参数可以在内存与性能之间权衡：

```bash
# redis.conf
hash-max-listpack-entries 512   # Redis 8.4 示例默认，可配置
hash-max-listpack-value   64
list-max-listpack-size   -2    # 默认按每节点约8KiB控制；正数表示元素数
zset-max-listpack-entries 128
set-max-intset-entries   512
```

多个小对象可按明确分桶键聚合到 Hash，但 field 必须在桶内唯一，不能只截取 UID 后两位而忽略桶键。收益需实测；聚合同时影响过期、热点、权限与迁移，不能承诺通用的数倍节省。

---

## 常见误区

### 1. 大 Key 问题（Big Key）

Big Key 没有跨业务通用的 10 KB 或数千元素界线。先按字节、成员数、命令访问范围与延迟预算判断风险：全量读取/扫描或释放大型聚合对象可能占用较长主线程时间，单元素查询不因跨过某个固定阈值就必然变慢。同步 `DEL` 与按值分配数量和类型相关的释放成本也需区分。

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

**认领与确认的教学方案**：延续上面的 `LPUSH` 入队、右端取最旧任务，可用 `LMOVE source processing RIGHT LEFT` 原子地从源列表右端认领任务并放入处理中列表左端，完成后按唯一任务标识确认并用 `LREM` 移除。还需自行设计超时扫描、失败任务重新入队、重试上限与业务幂等；一条 `LMOVE` 不自动提供可靠投递。若改用其他入出队方向，也要重新核对 FIFO 次序。Redis Streams 的 `XREADGROUP`、`XACK` 和待确认条目接管是另一种方案，同样需要消费者恢复与幂等处理。

### 3. ZSet score 精度问题

Redis score 使用 IEEE 754 双精度，可精确表示区间 `[-2^53, 2^53]` 内的整数；JavaScript 的安全整数边界还须按 `Number.isSafeInteger` 检查。2026 年 Unix 毫秒时间戳数量级约 `1.8×10^12`。若再拼接优先级、序号或缩放，必须检查组合值与相邻值是否仍可精确区分。

---

## 面试常问要点

**Q：Redis String 底层为什么不直接用 C 字符串？**
SDS 显式保存长度，能处理包含零字节的数据，并管理追加所需容量；C 的零结尾约定本身不提供这些信息。不要把对外 String 类型等同于所有值都采用同一 SDS 头部。

**Q：Sorted Set 为什么选跳表而非平衡树（红黑树）？**
跳表提供有序遍历与期望对数定位，配合字典满足按 member 查分数。它不是因为“并发修改时锁粒度更小”而在 Redis 中自动获胜；Redis 的命令执行模型也不能等同于一般并发跳表。选择还受内存介质、更新方式与实现复杂度影响，不据此宣称对所有平衡树都有性能优势。

**Q：List 的 quicklist 结构是什么？**
quicklist 用双向链接组织紧凑节点；Redis 8.4 的普通 packed 节点采用 listpack，大元素还可能使用 plain 节点，具体表示受配置与转换规则影响。`list-max-listpack-size` 可按字节档位或元素数控制节点容量。List 还可直接采用 listpack，不能把 quicklist 的节点形态当作所有 List 的唯一表示。

**Q：Hash 与 JSON String 如何选型？**
- 需要**局部更新**或**原子递增**字段 → Hash
- 对象**整体读写**且结构深度嵌套 → JSON String
- 满足实际版本与配置的小 Hash → 可用紧凑编码；Redis 8.4 示例默认普通 Hash 的条目阈值为 512，收益仍须按数据实测

**Q：如何用 Redis 实现 Agent 任务优先级调度？**
ZSet 可用 score 表达优先级，`ZPOPMAX` 原子移除最高分成员；同优先级 FIFO 另需明确规则。延迟任务以时间戳筛选候选后仍要原子认领；载荷、确认、重试与幂等由队列协议补齐，不能只看容器排序。

**Q：什么是 Big Key？如何处理？**
按内存、成员数、访问命令与延迟预算识别 Big Key；不存在通用字节界线。避免无界全量访问，必要时分片或分页，区分同步释放与 `UNLINK` 的后台回收，并按业务负载验证。

## Streams 消费恢复与字典渐进迁移

[Redis XREADGROUP](https://redis.io/docs/latest/commands/xreadgroup/)在消费组中分派消息；通常用 `>` 读取未分派的新消息，已分派未确认的消息保存在 PEL。处理成功后 `XACK` 移除 pending 记录，不等于删除 stream 正文。消费者崩溃时消息仍可能 pending；读自身历史或由其他消费者按策略接管，而不是一律重新读新消息。

[XAUTOCLAIM](https://redis.io/docs/latest/commands/xautoclaim/)从 Redis 6.2 起可按空闲时间和游标转移 pending 所有权，适合恢复失联消费者。接管不能证明旧处理没有完成，业务写入仍需幂等，重试次数超限另设隔离与人工处理。PEL、正文裁剪及持久化策略一起影响恢复能力，Streams 不是自动实现端到端恰好一次处理的系统。

字典 rehash 是不同层次的问题。[Redis 7.2 dict.c 源码](https://github.com/redis/redis/blob/7.2/src/dict.c)中的实现保留旧、新哈希表与迁移进度，按步迁移桶；普通访问可推进迁移，查找在需要时考虑两表，完成后释放旧表。迁移一个桶仍可能遇到较长链，渐进不表示每次操作绝对常数或无停顿。具体行为随版本与暂停条件变化，也不能把 List、Stream 等所有类型都当成这个字典实现。

## ZSet 的双索引与 B+ 树怎样比较

先在图中分别追踪 member 查分与 score 顺序路径，再看页内多键、三路导航和叶页范围扫描；两侧成本模型不同，不能只用同为对数复杂度决定替换。

<iframe
  src="https://www.agent-journey.cn/archify/zset-vs-innodb-page-index.html"
  title="Redis ZSet 双索引与 InnoDB 页式索引的结构比较"
></iframe>

*图：Redis 8.4 非紧凑 ZSet 的局部层视图，省略 header、span 等字段；小 ZSet 可整体采用 listpack，这是字典加跳表之外的另一种编码，不能理解成只有 C 成员单独使用 listpack。A、B 为同分 10 的不同教学成员，按 member 字节序排列，C 的分数为 30；字典与各层视图指向同一成员。右侧是 InnoDB 8.4 普通有序索引的独立教学页例：根分隔键 30、50 对应三个子页，范围查询先定位再沿叶页链扫描。图中数字不是原题输入、生产实测或固定性能结论。*

先限定对象：这里比较 Redis 8.4 ZSet 的非紧凑编码，不是说 Redis 的所有类型都用跳表。字典按 member 找 score；跳表按 `(score, member)` 排序，同分值按成员字节序区分。插入时两套视图同步维护；改分后，成员在有序视图中的位置也可能改变。[官方 `t_zset.c` 的 Sorted set API](https://github.com/redis/redis/blob/8.4/src/t_zset.c)直接说明了这两个视图及共享成员字符串的关系。

例如先写入 Alice=10、Bob=20，查 Alice 的分数走 member 视图；查分数 10 到 20 的成员，先在有序视图定位起点，再顺序输出。把 Alice 改成 30 后，按分数的顺序变为 Bob、Alice。仅有字典不能直接提供这条有序路径；仅有跳表又不承担字典的平均常数 member 定位。

B+ 树同样能实现范围查询。“不用 B+ 树”的回答不能是“它不支持范围”或“跳表一定更快”。InnoDB 的索引围绕持久页组织，页内容纳多个索引项，默认页大小为 16 KiB；Redis 这份 ZSet 实现在内存中用节点、层级 forward/span 和反向指针完成定位、排名及顺序遍历。**这是两种已有实现与工作负载的比较**：分页与扇出、内存分配、更新方式和维护复杂度改变了成本模型，不能仅由 `O(log N)` 推出谁在所有场景更优，更不能冒称测过两者的吞吐。[InnoDB 官方物理结构说明](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-physical-structure.html)提供页组织的事实；这里的选型取舍是基于结构的工程分析。

可以口述为：“小 ZSet 先看紧凑编码条件；非紧凑编码用字典回答 member 到 score，用跳表回答有序、范围与排名。跳表的复杂度是期望值。B+ 树也能查范围，比较时应说清内存节点与持久页的不同约束，不能给出脱离版本与负载的绝对性能结论。”

以下是教学追问，不是原帖新增题目：

- **只有几十个短成员，为什么未必能看到 skiplist 编码？** 先检查本实例的 listpack 阈值与 `OBJECT ENCODING`，对外有序集合语义与内部编码是两层。
- **两个成员分数相同，是否会覆盖？** 成员身份决定唯一性；同分成员可共存，并按 member 字节序继续排序。更新同一 member 的分数才是改值。
- **把全部数据放进内存后，B+ 树就一定更慢吗？** 不能推出；缓存局部性、扇出、键大小、更新分布及实现都会改变结果，需同合同测量。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 全栈一面：Pipeline 质量、Doris 与消息轮播](../../../interview/bytedance/base/bytedance-base-23.md)
- [小红书 Agent 开发一面：多智能体、Memory 与广告投放优化（2026 年 8 月）](../../../interview/redbook/ai/redbook-ai-1.md)
- [字节全栈二、三面：幂等、索引与字符串匹配](../../../interview/bytedance/base/bytedance-base-32.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
- [字节 Agent 实习：缓存一致性、定时任务与后端基础](../../../interview/bytedance/base/bytedance-base-47.md)
- [字节 Agent 实习：生成质量、多智能体与缓存](../../../interview/bytedance/base/bytedance-base-52.md)
- [字节后端与 Agent：运行链路、数据库与网络](../../../interview/bytedance/base/bytedance-base-55.md)
- [百度北京后端秋招一面：Agent 安全、检索与存储](../../../interview/baidu/ai/baidu-ai-3.md)
<!-- interview-source-history:end -->

## 参考资料

实现范围：Redis 8.4 分支，核验于 2026-10-15。以下来源用于本次精确修正；代码未连接实际 Redis 执行。

- [Redis 8.4 示例配置](https://github.com/redis/redis/blob/8.4/redis.conf)
- [Redis 8.4 SDS 头部](https://github.com/redis/redis/blob/8.4/src/sds.h)
- [Redis 8.4 List 编码](https://github.com/redis/redis/blob/8.4/src/t_list.c)
- [Redis 8.4 Listpack 实现](https://github.com/redis/redis/blob/8.4/src/listpack.c)
- [Redis 8.4 Sorted Set 实现](https://github.com/redis/redis/blob/8.4/src/t_zset.c)
- [INCR：计数与限流模式](https://redis.io/docs/latest/commands/incr/)
- [LPOP：count 与批量弹出](https://redis.io/docs/latest/commands/lpop/)
- [事务：EXEC 不回滚运行期命令错误](https://redis.io/docs/latest/develop/using-commands/transactions/)
- [Redis data types](https://redis.io/docs/latest/develop/data-types/)
- [Redis commands](https://redis.io/docs/latest/commands/)
