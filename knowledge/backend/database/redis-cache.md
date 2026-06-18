# Redis 缓存策略与穿透击穿雪崩

Redis 缓存能大幅降低数据库压力，但使用不当会引发三类经典故障：缓存穿透、缓存击穿、缓存雪崩。理解它们的成因与解决方案是后端开发的必备知识。

## 常见缓存读写策略

### Cache-Aside（旁路缓存）—— 最常用

应用层自己管理缓存的读写，数据库是权威数据源。

```
读：先查 Redis → 命中则返回；未命中则查 DB → 写入 Redis → 返回
写：先更新 DB → 再删除 Redis 中对应缓存（而非更新）
```

**为什么写时删缓存而非更新缓存？**  
更新缓存存在并发竞争（两个写请求先后更新 DB，但更新缓存的顺序可能相反），删除是更安全的"懒惰失效"方式。

```typescript
async function getUser(id: number): Promise<User> {
  const cacheKey = `user:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await userRepository.findOneBy({ id });
  if (user) {
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }
  return user;
}

async function updateUser(id: number, data: Partial<User>): Promise<void> {
  await userRepository.update(id, data);
  await redis.del(`user:${id}`);  // 删缓存而非更新
}
```

### Read-Through / Write-Through

缓存层自动处理与 DB 的同步，应用只与缓存交互。适合有专门缓存中间件（如 AWS ElastiCache with DAX）的场景，Node.js 自研项目通常用 Cache-Aside。

## 缓存穿透

**定义**：请求的 key 在缓存和数据库中都不存在，每次都穿透缓存直接打到数据库。  
**场景**：恶意攻击（不断查询不存在的 ID）、业务逻辑 bug。

### 解决方案一：缓存空值

```typescript
const user = await userRepository.findOneBy({ id });
if (!user) {
  // 缓存空值，TTL 设短（如 60 秒），避免长期占用内存
  await redis.setex(cacheKey, 60, 'NULL');
  return null;
}
```

### 解决方案二：布隆过滤器

在缓存前置一层布隆过滤器，存储所有合法 key 的指纹。不在过滤器中的请求直接拒绝，不访问数据库。

```
请求 → 布隆过滤器判断 → 不存在则直接返回 → 存在则走正常缓存流程
```

布隆过滤器有一定误判率（将不存在的 key 判断为存在），但不会误判存在的 key，可接受少量漏放。

## 缓存击穿

**定义**：某个**热点 key**（高频访问）在缓存过期的瞬间，大量并发请求同时打到数据库。  
**场景**：热门商品详情页、热榜数据。

### 解决方案一：互斥锁（Mutex）

缓存失效时只允许一个请求去查数据库，其他请求等待或返回旧值。

```typescript
async function getHotData(key: string): Promise<Data> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey = `lock:${key}`;
  const locked = await redis.set(lockKey, '1', 'NX', 'EX', 5); // NX = 不存在才设置

  if (locked) {
    try {
      const data = await db.query(key);
      await redis.setex(key, 3600, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // 未获得锁，短暂等待后重试或返回降级数据
    await sleep(50);
    return getHotData(key);
  }
}
```

### 解决方案二：逻辑过期（不设 TTL）

缓存永不过期，在 value 中存储逻辑过期时间。到期时异步更新，读请求直接返回旧值，保证高可用。

## 缓存雪崩

**定义**：大量 key **同时过期**，或 Redis 宕机，导致所有请求涌入数据库，引发数据库崩溃的连锁反应。

### 解决方案

**1. TTL 添加随机抖动**

```typescript
const baseTTL = 3600;
const jitter = Math.floor(Math.random() * 300); // 0~300 秒随机值
await redis.setex(key, baseTTL + jitter, value);
```

**2. 多级缓存**

```
请求 → 本地缓存（如 node-lru-cache）→ Redis → 数据库
```

本地缓存命中率高，Redis 宕机时本地缓存仍可短时间兜底。

**3. 熔断与降级**

Redis 不可用时，熔断直接降级（返回默认数据或提示稍后重试），不把压力传导到数据库。

**4. Redis 高可用部署**

使用 Redis Sentinel（哨兵）或 Redis Cluster 保证 Redis 本身的高可用，避免单点故障触发雪崩。

## 三种故障对比

| 故障 | 触发条件 | 主要解法 |
|------|----------|----------|
| 穿透 | key 根本不存在 | 缓存空值、布隆过滤器 |
| 击穿 | 热点 key 过期瞬间并发 | 互斥锁、逻辑过期 |
| 雪崩 | 大量 key 同时过期或 Redis 故障 | TTL 加抖动、多级缓存、熔断降级 |

## 面试常问

- **Cache-Aside 写时为何删缓存不更新？**
  更新缓存在并发场景下可能导致数据不一致（旧值覆盖新值），删除更安全，下次读时自然重建。
- **先删缓存还是先更新 DB？**
  推荐先更新 DB 再删缓存（"延迟双删"可进一步保证一致性）。先删缓存再更新 DB 期间如有读请求，会将旧 DB 数据写入缓存，产生脏数据。
- **布隆过滤器可以删除元素吗？**
  标准布隆过滤器不支持删除，Counting Bloom Filter 支持。
- **逻辑过期和 TTL 过期的核心区别？**
  TTL 过期会缺失缓存（Cache Miss），逻辑过期始终有缓存（返回旧值），可用性更高，但数据有短暂延迟。
