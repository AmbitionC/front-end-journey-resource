# Redis 有哪些数据结构?各自适合什么场景?

设想一个最常见的场景:你要给文章做"阅读量统计"。如果用关系型数据库,每次有人打开文章就 `UPDATE article SET views = views + 1 WHERE id = ?`,几百上千的并发写很快会把数据库压垮——行锁、磁盘 IO、事务日志,每一笔都不便宜。换成 Redis,一条 `INCR article:1001:views` 就解决了:操作在内存里完成、天然原子、单条命令耗时通常在微秒级。

但 Redis 远不止"一个更快的计数器"。很多人把它当成"内存里的 key-value 字典"用,key 是字符串,value 也是字符串,这只用到了它能力的零头。Redis 真正的价值在于:**value 本身可以是结构化的**——它内置了一整套数据结构,每种结构都为某一类访问模式做了专门优化。选对结构,一个原本要在应用层用几十行代码维护的逻辑(去重、排行、最近列表)往往一两条命令就能完成,而且性能和原子性都由 Redis 保证。

这篇文章把 Redis 的数据结构讲清楚:五种基础类型分别长什么样、适合什么场景、底层是怎么编码的,再延伸到 Bitmap、HyperLogLog、Geo、Stream 几种进阶结构,最后给出一张选型对照表,以及它们在 Agent 工程里具体怎么用。

## 先建立一个心智模型

Redis 的所有数据都是"key 指向一个 value 对象",这里的 value 对象有一个**逻辑类型**(String/Hash/List/Set/ZSet…)和一个**底层编码**(encoding)。逻辑类型决定你能用哪些命令,底层编码决定它在内存里怎么存、性能怎样。Redis 会根据数据规模在编码之间自动切换——这点是后面理解性能的关键,先记住"类型"和"编码"是两层概念。

可以用 `OBJECT ENCODING <key>` 查看任意 key 当前的底层编码:

```bash
SET n 100
OBJECT ENCODING n      # int
SET s "hello world"
OBJECT ENCODING s      # embstr
```

## 五种基础类型

### String:计数器与对象缓存

String 是最基础的类型,value 可以是文本、序列化后的 JSON、甚至二进制(图片缩略图、protobuf)。但它最被低估的能力是**整数计数**。

```bash
INCR article:1001:views          # 阅读量 +1
INCRBY user:42:credit 50         # 余额加 50
DECR stock:sku888                # 库存 -1
SET session:token "..." EX 3600  # 设置会话,1 小时过期
```

典型场景:

- **计数器**:阅读量、点赞数、库存、限流计数。`INCR`/`DECR` 是原子的,不会出现上面 `UPDATE` 那样的并发丢更新。
- **对象缓存**:把整个对象序列化成 JSON 存进一个 String,读的时候反序列化。简单,但更新单个字段要读出整个对象改完再写回,字段多时不划算——这种场景更适合 Hash。
- **分布式锁的载体**:`SET lock:order "uuid" NX EX 10`,`NX` 保证只有不存在时才设置成功。

**底层编码**有三种:

| 编码 | 适用 | 说明 |
| --- | --- | --- |
| `int` | value 是整数且能用 long 表示 | 直接存 long,`INCR` 等就是对它做运算 |
| `embstr` | 短字符串(默认 ≤ 44 字节) | 对象头和字符串内容连续分配在一块内存,一次分配、缓存友好 |
| `raw` | 长字符串(> 44 字节) | 对象头和 SDS 分开两次分配 |

这里有个细节:Redis 的字符串底层是 **SDS(Simple Dynamic String)**,不是 C 的裸字符串。SDS 记录了长度(`O(1)` 取长度)、能存二进制(不以 `\0` 截断)、并有预分配机制减少频繁追加时的内存重分配。

### Hash:存储对象的字段

Hash 是 field-value 的映射,等价于"value 是一个小字典"。它天生适合存对象:

```bash
HSET user:42 name "Tom" age 18 city "Shanghai"
HGET user:42 age          # 只取一个字段,不用读整个对象
HINCRBY user:42 age 1     # 单字段原子自增
HGETALL user:42
```

相比"把 JSON 整个塞进一个 String",Hash 的优势是**可以独立读写单个字段**,改 `age` 不必把整个对象搬来搬去。购物车也是经典用法:key 是 `cart:userId`,field 是商品 id,value 是数量,`HINCRBY` 加购、`HDEL` 删除。

**底层编码**:

- 字段少且短时用 **listpack**(7.0 前是 ziplist),一块连续内存里紧凑排列,省内存;
- 超过阈值(`hash-max-listpack-entries`、`hash-max-listpack-value`)后转为 **hashtable**,即标准哈希表,查找 `O(1)` 但每个节点都有指针开销。

所以 Hash 在字段不多时其实非常省内存,这也是大量小对象推荐用 Hash 而非 String 的原因。

### List:消息队列与最近列表

List 是有序的字符串序列,本质是双端队列,两端插入删除都是 `O(1)`。

```bash
LPUSH feed:42 "msg1"          # 左侧入队
RPUSH feed:42 "msg2"          # 右侧入队
LRANGE feed:42 0 9            # 取最新 10 条
LPOP feed:42                  # 出队
BRPOP queue:job 5             # 阻塞出队,最多等 5 秒
```

典型场景:

- **简单消息队列**:一端 `LPUSH` 生产、另一端 `BRPOP` 阻塞消费,`B` 前缀让消费者在队列为空时挂起等待而非空轮询。注意这是"轻量级队列",没有消费确认、消费者组、消息回溯——要这些得用后面的 Stream。
- **最近 N 条列表**:时间线、最近浏览、操作日志。配合 `LPUSH` + `LTRIM key 0 99` 永远只保留最新 100 条。

**底层编码**:现在统一是 **quicklist**——它是一个由多个 listpack 节点串成的双向链表。每个节点内部用 listpack 紧凑存一批元素,节点之间用链表连接。这样既避免了纯链表"每个元素一个节点、指针开销大、内存碎片"的问题,又避免了单个 listpack 太大导致插入要整体搬移的问题,是在内存和性能之间的折中。

### Set:去重与集合运算

Set 是无序、不重复的字符串集合。它的杀手锏是**去重**和**集合间运算**。

```bash
SADD article:1001:likes 42 88 13   # 用户点赞,自动去重
SISMEMBER article:1001:likes 42    # 判断 42 是否点过赞
SCARD article:1001:likes           # 点赞人数

SINTER tag:redis tag:database      # 同时打了两个标签的文章(交集)
SUNION ...                         # 并集:共同关注、可能认识的人
SDIFF ...                          # 差集
```

典型场景:**点赞/收藏去重**、**抽奖**(`SRANDMEMBER` 随机取、`SPOP` 取出即删除)、**标签与共同好友**(交并差)、**唯一访客 UV 统计**(精确去重,量大时考虑 HyperLogLog)。

**底层编码**:

- 元素全是整数且数量少时用 **intset**,一个有序的整数数组,二分查找,极省内存;
- 否则用 **listpack**(元素少且短,7.2 引入)或 **hashtable**(标准哈希表,只用 key 不用 value)。

### ZSet:排行榜与范围查询

ZSet(有序集合)给每个成员附加一个 `score`(浮点分值),成员唯一,并**按 score 排序**。这让它成为排行榜的不二之选。

```bash
ZADD rank:game 1500 "Tom" 1800 "Jerry"   # member + score
ZINCRBY rank:game 100 "Tom"               # Tom 加 100 分
ZREVRANGE rank:game 0 9 WITHSCORES        # Top 10(分数从高到低)
ZREVRANK rank:game "Tom"                  # Tom 的排名
ZRANGEBYSCORE rank:game 1000 2000         # 分数在区间内的成员
```

典型场景:**排行榜**(游戏积分、热搜、销量榜)、**带权重的范围查询**、**延时队列**(score 存执行时间戳,定时 `ZRANGEBYSCORE` 取到期任务)、**滑动窗口限流**(score 存请求时间戳,`ZREMRANGEBYSCORE` 清理窗口外的)。

**底层编码**:

- 成员少且短时用 **listpack**;
- 规模变大后用 **skiplist + hashtable** 双结构:跳表(skiplist)维护按 score 排序、支持 `O(log N)` 的范围查询和排名;哈希表则维护 member → score 的映射,让"查某个成员的分数"是 `O(1)`。两者指向同一批数据,空间换时间,这样无论按排名查还是按成员查都很快。

> 对 Agent 工程的意义:ZSet 的"score 排序 + 范围查询"非常契合检索召回。你可以把候选文档的相关性打分、时间衰减权重、热度都映射成 score,用一条 `ZREVRANGE` 取出 Top-K 候选元数据交给重排序模型,而不必把全部候选拉回应用层排序。

## 进阶类型

下面四种严格说是"在基础类型之上的特殊用法或独立结构",但日常被当作独立类型使用。

- **Bitmap(位图)**:本质是 String,把每一位当一个布尔标志。用 `SETBIT/GETBIT` 操作单个 bit,`BITCOUNT` 统计置 1 的个数。极省空间——1 亿用户的"今日是否签到"只需约 12 MB。适合**签到、用户在线状态、特征标记**。多个 Bitmap 还能 `BITOP AND/OR` 做"连续 N 天签到"这类运算。
- **HyperLogLog**:用于**基数统计(去重计数)**,比如海量 UV。它不存储元素本身,用固定约 12 KB 的空间估算"有多少个不同元素",有约 0.81% 的标准误差。`PFADD` 添加、`PFCOUNT` 估算、`PFMERGE` 合并多天数据。当你只关心"有多少独立访客"而不关心"是谁"、且能接受微小误差、数据量又巨大时,它的内存优势是碾压性的(Set 精确去重要存下所有元素)。
- **Geo(地理位置)**:底层是 ZSet,把经纬度用 GeoHash 编码成一个整数当作 score。`GEOADD` 存坐标、`GEOSEARCH` 查"附近的人/店铺"、`GEODIST` 算两点距离。适合 **LBS 场景**。
- **Stream**:5.0 引入的**专业消息队列/日志结构**,弥补了 List 做队列的不足。它支持**消费者组(Consumer Group)**、**消息确认(ACK)**、**消息持久化与回溯**(每条消息有唯一递增 ID,可从任意位置重读)。`XADD` 追加、`XREADGROUP` 按组消费、`XACK` 确认。需要"至少一次投递、多消费者负载均衡、可重放"的可靠队列时用它,而不是 List。

## 选型对照表

| 类型 | 数据形态 | 典型场景 | 关键命令 | 主要底层编码 |
| --- | --- | --- | --- | --- |
| String | 字符串/整数 | 计数器、对象缓存、分布式锁 | `INCR` `SET` `GET` | int / embstr / raw |
| Hash | field-value 字典 | 对象存储、购物车 | `HSET` `HGET` `HINCRBY` | listpack / hashtable |
| List | 有序队列 | 消息队列、最近列表 | `LPUSH` `BRPOP` `LRANGE` | quicklist |
| Set | 无序去重集合 | 去重、抽奖、标签交并差 | `SADD` `SISMEMBER` `SINTER` | intset / listpack / hashtable |
| ZSet | 带分值有序集合 | 排行榜、延时队列、范围查询 | `ZADD` `ZREVRANGE` `ZRANGEBYSCORE` | listpack / skiplist+ht |
| Bitmap | 位数组 | 签到、布尔标记 | `SETBIT` `BITCOUNT` `BITOP` | String |
| HyperLogLog | 基数估算 | 海量 UV 去重计数 | `PFADD` `PFCOUNT` | String |
| Geo | 经纬度 | 附近的人/店铺 | `GEOADD` `GEOSEARCH` | ZSet |
| Stream | 消息日志 | 可靠消息队列 | `XADD` `XREADGROUP` `XACK` | Stream(radix tree) |

选型的基本判断:**只存值还是要计数**(String)、**对象要不要按字段读写**(Hash)、**要不要有序/双端进出**(List)、**要不要去重或集合运算**(Set)、**要不要按分值排序或范围查**(ZSet)。先想清楚访问模式,再选结构。

## Agent 场景下的用法

把上面的结构落到 Agent / LLM 工程,会发现它们几乎覆盖了一个 Agent 系统的所有有状态需求:

- **会话缓存(对话上下文)**:用 Hash 存一次会话的元数据(模型、系统提示、token 累计),用 List 存按顺序追加的消息记录,配合 `EXPIRE` 让闲置会话自动过期回收内存。读历史只取最近 N 条用 `LRANGE` + `LTRIM`。
- **限流计数**:每个用户/每个 API key 的调用频率控制。简单的固定窗口用 `INCR` + `EXPIRE`;要平滑的滑动窗口用 ZSet,score 存请求时间戳,每次请求先 `ZREMRANGEBYSCORE` 清掉窗口外的,再 `ZCARD` 看当前窗口内请求数是否超限。token 预算同理可用 `INCRBY` 累计、`DECRBY` 扣减。
- **请求/工具调用去重(幂等)**:用 Set 存已处理过的 request id 或工具调用指纹,处理前 `SADD` 返回是否新增,避免同一指令重复执行;海量去重(如"这条网页是否抓过")可换 HyperLogLog 或 Bitmap 控成本。
- **召回与排行元数据**:RAG 检索的候选文档,用 ZSet 按相关性/时效 score 维护 Top-K;热门工具、热门问题排行也用 ZSet,`ZINCRBY` 累加热度即可。

这些都是"内存里的共享可变状态",而 Redis 单线程执行命令的模型恰好让 `INCR`、`SADD`、`ZADD` 这类操作天然原子,省去了应用层加锁——在多个并发请求或多个子 Agent 同时读写同一份状态时,这一点尤其重要。

## 小结

Redis 的强大不在于"快",而在于它把"该用什么数据结构"这个决策前置到了存储层:String 管计数与缓存,Hash 管对象,List 管队列与最近列表,Set 管去重与集合运算,ZSet 管排序与范围查询;Bitmap/HyperLogLog/Geo/Stream 各自补上位标记、基数估算、地理、可靠队列的空缺。理解每种类型的访问特性和底层编码(以及编码会随规模自动切换这件事),你才能在"存什么、怎么取、占多少内存"之间做出对的取舍——这正是用好 Redis 的分水岭。
