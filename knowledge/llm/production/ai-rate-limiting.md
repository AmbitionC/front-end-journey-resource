# AI 应用限流与配额控制

LLM API 调用成本高昂，提供商本身也有速率限制（Rate Limit）。不做限流的 AI 应用，面临三重风险：成本失控、被提供商封禁、遭恶意用户滥用。

## 为什么 AI 应用的限流比普通 API 更复杂

传统 API 限流按请求数（RPS）计算，而 LLM API 按 token 计费：一个简单问题消耗 100 token，一个复杂分析可能消耗 10,000 token，按请求数限流无法准确控制成本。此外，LLM 响应延迟高（往往 2-30 秒），传统的"N 请求/秒"限流维度对用户体验影响更大。

## 限流维度

| 维度 | 说明 | 适用场景 |
|------|------|---------|
| 用户级 | 每个账户的 token/请求限额 | SaaS 产品套餐控制 |
| IP 级 | 同一 IP 的请求频率 | 防爬虫、匿名用户防护 |
| API Key 级 | 每个 API Key 的配额 | B2B 场景，客户隔离 |
| 全局级 | 整个系统的吞吐上限 | 保护上游 LLM 提供商配额 |

## 限流算法

### 令牌桶（Token Bucket）

桶有容量上限，以固定速率补充令牌，请求消耗令牌。允许突发流量（桶满时可以瞬间消耗）：

```
容量：100 token/桶
补充速率：10 token/秒
用户请求：消耗 1 个令牌
桶空时：请求被拒绝或等待
```

**优点**：允许合理突发，用户体验好  
**缺点**：实现相对复杂，分布式场景需原子操作

### 滑动窗口（Sliding Window）

统计过去 N 秒内的请求/token 总量，超过阈值则拒绝：

```
窗口：过去 60 秒
限制：100 次请求
当前时刻：统计 [now-60s, now] 内的请求数
```

**优点**：准确平滑，无突发问题  
**缺点**：存储开销略高（需记录每次请求时间戳）

### 漏桶（Leaky Bucket）

请求进入队列，以固定速率流出处理。超出队列容量时丢弃请求：

```
队列容量：50 个请求
处理速率：5 个/秒（固定）
超出队列：直接拒绝
```

**优点**：输出速率绝对稳定，保护下游  
**缺点**：增加延迟，不适合实时交互场景

### 三者对比

| 算法 | 突发支持 | 实现复杂度 | 适用场景 |
|------|---------|-----------|---------|
| 令牌桶 | 是 | 中 | 用户级限流，允许偶发高峰 |
| 滑动窗口 | 否 | 低 | 精准控制时间窗口内的总量 |
| 漏桶 | 否 | 低 | 保护下游服务，平滑流量 |

## Token-based 限流

AI 应用应优先按 token 数而非请求数限流：

```ts
interface TokenBudget {
  userId: string;
  windowMs: number;       // 时间窗口（毫秒）
  maxTokens: number;      // 窗口内最大 token 数
}

// 执行 LLM 调用后，记录实际消耗
async function trackTokenUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const totalTokens = inputTokens + outputTokens;
  // 写入 Redis，用于后续限流检查
  await redis.incrBy(`tokens:${userId}:${getCurrentWindowKey()}`, totalTokens);
}
```

## 基于 Redis 的滑动窗口限流（TypeScript 骨架）

```ts
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });

/**
 * 滑动窗口限流
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
async function slidingWindowRateLimit(params: {
  key: string;           // 限流 key，如 `ratelimit:user:${userId}`
  windowMs: number;      // 时间窗口，如 60_000（1 分钟）
  maxRequests: number;   // 窗口内最大请求数
}): Promise<{ allowed: boolean; remaining: number }> {
  const { key, windowMs, maxRequests } = params;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Lua 脚本保证原子性（以官方 Redis 文档为准）
  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local window_start = tonumber(ARGV[2])
    local max_requests = tonumber(ARGV[3])
    local window_ms = tonumber(ARGV[4])

    -- 移除窗口外的记录
    redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
    
    -- 统计当前窗口内的请求数
    local count = redis.call('ZCARD', key)
    
    if count < max_requests then
      -- 添加当前请求记录（score=时间戳，member=时间戳+随机数防重复）
      redis.call('ZADD', key, now, now .. math.random())
      redis.call('PEXPIRE', key, window_ms)
      return {1, max_requests - count - 1}
    else
      return {0, 0}
    end
  `;

  const result = await redis.eval(luaScript, {
    keys: [key],
    arguments: [
      now.toString(),
      windowStart.toString(),
      maxRequests.toString(),
      windowMs.toString(),
    ],
  }) as [number, number];

  return {
    allowed: result[0] === 1,
    remaining: result[1],
  };
}

// 在 API 中间件使用
async function rateLimitMiddleware(userId: string) {
  const result = await slidingWindowRateLimit({
    key: `ratelimit:user:${userId}`,
    windowMs: 60_000,     // 1 分钟
    maxRequests: 20,      // 每分钟 20 次
  });

  if (!result.allowed) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  return result;
}
```

## 配额控制：用户套餐管理

```ts
interface UserQuota {
  userId: string;
  plan: "free" | "pro" | "enterprise";
  monthlyTokenLimit: number;
  usedTokens: number;
  resetDate: Date;       // 每月重置时间
}

const PLAN_LIMITS: Record<UserQuota["plan"], number> = {
  free: 50_000,          // 5 万 token/月
  pro: 2_000_000,        // 200 万 token/月
  enterprise: Infinity,  // 自定义
};

async function checkAndConsumeQuota(
  userId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; reason?: string }> {
  const quota = await getUserQuota(userId);

  // 检查是否需要重置（新的计费周期）
  if (new Date() > quota.resetDate) {
    await resetMonthlyQuota(userId);
    quota.usedTokens = 0;
  }

  const remaining = quota.monthlyTokenLimit - quota.usedTokens;

  if (remaining <= 0) {
    return { allowed: false, reason: "Monthly quota exceeded. Please upgrade your plan." };
  }

  if (estimatedTokens > remaining) {
    return { allowed: false, reason: `This request requires ~${estimatedTokens} tokens but only ${remaining} remaining.` };
  }

  return { allowed: true };
}
```

**超额处理策略：**
- **降级**：切换到更便宜的小模型继续服务
- **拒绝**：返回 429 或提示升级套餐
- **排队**：将请求放入低优先级队列，等待配额重置

## 面试常问

**Q：令牌桶 vs 滑动窗口的区别？**
令牌桶允许突发：用户可以在短时间内用完积累的令牌，适合偶发高峰场景。滑动窗口严格限制时间窗口内的总量，无突发空间，但计量更精确。两者都需要在分布式环境下用 Redis + 原子操作（Lua 脚本）实现，防止并发竞争条件。

**Q：如何按 token 数计费限流，而不只是按请求数？**
LLM 调用完成后，从响应中提取实际消耗的 token 数（`usage.input_tokens` + `usage.output_tokens`），写入 Redis 计数器（带 TTL）。下次请求前检查当前窗口的累计 token 数，超过阈值则拒绝。挑战在于请求前无法精确知道 output token 数，可以用估算值做预检查，实际消耗后再精确扣减。

**Q：限流如何与 LLM 提供商的 Rate Limit 协同？**
在客户端维护一个令牌桶，反映提供商的 TPM（Tokens Per Minute）限制。当提供商返回 429 时，触发指数退避重试，同时降低本地令牌桶的补充速率。可通过提供商返回的 `x-ratelimit-*` 响应头动态感知剩余配额。
