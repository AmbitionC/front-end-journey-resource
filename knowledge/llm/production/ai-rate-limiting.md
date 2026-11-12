AI 应用的限流要分别回答四个问题：**现在能接多快、能同时跑多少、还能消耗多少预算、请求最多能等多久**。令牌桶控制速率与突发，信号量控制在途任务，预算账本约束用量或费用，有界队列把允许等待的工作留到稍后执行。它们可以协作，但不能用一个计数器替代彼此。

![AI 请求依次经过客户端、令牌桶、有界队列、并发 worker 和模型供应商；下方标明 429、队列满拒绝、超时取消及可选并发反馈](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/ai-rate-limit-backpressure-queue-v1.webp)
*图：沿主路径区分速率准入、等待和执行。自适应并发是可选反馈回路；图中的超时/取消信号不证明底层任务已经停止。*

## AI 限流与传统 API 限流的差异

传统 API 也可能有昂贵操作；AI 服务更容易暴露出“请求次数不等于资源成本”的问题。相同的一次调用，输入长度、输出上限、缓存计费和工具调用轮次都可能不同。因此，应先确定计量单位，再选择算法。

| 控制对象 | 计量单位 | 回答的问题 |
|----------|----------|------------|
| 请求速率 | 请求/秒、请求/分钟 | 短时间内允许进入多少次 |
| Token 速率 | Token/分钟等 | 是否满足模型供应商的吞吐合同 |
| 并发上限 | 尚未结束的任务/尝试数 | 有多少工作同时占用连接、内存或模型资源 |
| 用量或费用预算 | 周期内 Token、整数费用单位 | 已用量加预留量是否超过预算 |
| 等待队列 | 任务数、字节数、等待时长 | 暂时不能执行的工作还能积压多少 |

注意区分限流算法里的**令牌**与模型的 **Token**：令牌是抽象额度，可以规定“一次请求扣 1 个”，也可以按估算 Token 加权。输入和输出价格不同时，Token 总数也不能直接代表费用，费用账本还需绑定模型、计价版本和计费类别。

流式响应完成前往往拿不到完整可信用量，因此预算通常采用**先预留、后结算**。预留应包括可信输入估算、服务端约束的输出上限以及允许的工具/重试预算；供应商如何计量上下文、缓存和输出，仍需按具体接口核对。

## 令牌桶算法（Token Bucket Algorithm）

桶有固定容量 `C`，以速率 `r` 持续补充令牌；本次请求的权重是 `w`。在时刻 `t` 先计算：

```text
available = min(C, previous + (t - last_refill) × r)
允许条件：available >= w
允许后：remaining = available - w
拒绝后：remaining = available
```

**核心特性是受控突发**：空闲时令牌最多积累到 `C`，因此满桶可立即消费 `C` 个单位，长期补充速率则由 `r` 控制。令牌桶并不承诺任意一个长度为 `W` 的窗口都只允许 `r × W`；满桶开始时还可以消耗积累的额度。[RFC 3290 附录 A](https://www.rfc-editor.org/rfc/rfc3290.html#appendix-A)讨论了令牌桶与漏桶的计量、整形语义。

### 手写单机版：先保护状态不变量

需要保证 `0 <= tokens <= capacity`，检查与扣减在同一把锁内完成。`rate`、`capacity` 和单次 `cost` 必须是有限正数：负数扣减会反向增发额度，NaN 会破坏比较，零速率会让等待时间计算失效；`cost > capacity` 永远不能入桶，应作为配置或请求错误拒绝，不能提示“稍后就能成功”。

```python
import math
import threading
import time


def positive_finite(value: float, name: str) -> float:
    if isinstance(value, bool):
        raise ValueError(f"{name} must be a finite positive number")
    value = float(value)
    if not math.isfinite(value) or value <= 0:
        raise ValueError(f"{name} must be a finite positive number")
    return value


class TokenBucket:
    """单进程、线程安全的加权令牌桶；拒绝时不扣额度。"""
    def __init__(self, rate: float, capacity: float):
        self._rate = positive_finite(rate, "rate")  # 单位/秒
        self._capacity = positive_finite(capacity, "capacity")
        self._tokens = self._capacity  # 本示例定义为初始满桶
        self._last_refill_ns = time.monotonic_ns()
        self._lock = threading.Lock()

    def consume(self, cost: float = 1.0) -> bool:
        cost = positive_finite(cost, "cost")
        if cost > self._capacity:
            raise ValueError("cost exceeds bucket capacity")
        with self._lock:
            now_ns = time.monotonic_ns()
            elapsed = (now_ns - self._last_refill_ns) / 1_000_000_000
            self._tokens = min(
                self._capacity, self._tokens + elapsed * self._rate
            )
            self._last_refill_ns = now_ns
            if self._tokens < cost:
                return False
            self._tokens -= cost
            return True


# 教学参数：每分钟补充 10,000 个额度单位，突发容量 20,000。
bucket = TokenBucket(rate=10_000 / 60, capacity=20_000)
if bucket.consume(1500):
    print("请求放行")
else:
    print("额度不足")
```

这里用单调时钟计算时间差，避免系统校时造成负时间差；[Python time 文档](https://docs.python.org/3/library/time.html#time.monotonic_ns)说明了它的语义。补充采用惰性计算，无需后台线程每毫秒加令牌。一次调用做常数量运算，但锁竞争和线程调度仍会影响实际延迟；它也只约束当前进程，不会自动变成多实例共享额度。浮点额度适合解释速率模型，精确费用账本应使用约定的整数最小单位。

## 滑动窗口算法（Sliding Window）对比

滑动窗口统计过去 `W` 秒内**已接受请求的权重之和**。它限制的是窗口总量；窗口内仍可集中接受一批请求，因此“滑动窗口完全不允许突发”并不准确。

```python
from collections import deque


class SlidingWindowCounter:
    """统计窗口 (now - window_seconds, now]，保留已接受记录。"""
    def __init__(self, window_seconds: float, max_units: int):
        self.window = positive_finite(window_seconds, "window_seconds")
        if type(max_units) is not int or max_units <= 0:
            raise ValueError("max_units must be a positive integer")
        self.limit = max_units
        self._log: deque[tuple[float, int]] = deque()
        self._total = 0
        self._lock = threading.Lock()

    def allow(self, units: int) -> bool:
        if type(units) is not int or not 0 < units <= self.limit:
            raise ValueError("units must be a positive integer <= limit")
        with self._lock:
            # 在锁内取时间，避免并发线程按较早时间乱序入队。
            now = time.monotonic()
            cutoff = now - self.window
            while self._log and self._log[0][0] <= cutoff:
                _, old_units = self._log.popleft()
                self._total -= old_units
            if self._total + units > self.limit:
                return False
            self._log.append((now, units))
            self._total += units
            return True
```

本例需与前一段的 `time`、`threading`、`positive_finite` 一起使用。一次清理可能删除多条过期记录，空间占用随窗口内已接受记录数增加。Redis ZSET 可以保存时间戳与请求 ID，但 `ZCARD` 只数请求，不能直接求加权 Token 总和；清理、求和、判断、写入仍需作为正确的复合操作设计。

### 算法对比总表

| 算法 | 主要约束 | 突发与边界 | 状态代价 |
|------|----------|------------|----------|
| 令牌桶 | 补充速率与桶容量 | 允许积累后的受控突发 | 每个主体可只存少量状态 |
| 精确滑动日志窗口 | 最近 `W` 秒的接受总量 | 窗口内可集中消耗额度 | 保留窗口内记录，清理成本随记录数变化 |
| 漏桶排队整形 | 输出节奏 | 输入突发先排队；满队列拒绝 | 必须限制队列容量与最长等待 |
| 固定窗口 | 指定周期内的总量 | 周期切换附近可连续用掉两期额度 | 计数少，但检查、增加、过期也要协调 |

日/月预算可以使用固定账期账本，无需为了“精确成本”保存整个月的滑动日志。算法按合同选取：允许什么突发、约束哪个周期、能接受多少状态和等待成本，而不是给所有 AI 服务固定叠加两种算法。

## 按用户配额（Per-User Quota）设计

### 配额维度与重置策略

请求数配额防高频调用，Token 或费用配额约束消耗，并发配额防止长任务占满资源。套餐表中的“不限额”宜用显式枚举，例如 `{ kind: "unlimited" }`，而不是把 `Infinity` 写入 JSON 或参与预算加减。服务端应校验有限额度、权重和费用单位，不能信任客户端上报的用量。

| 策略 | 周期定义 | 需要明确的边界 |
|------|----------|----------------|
| 每日重置 | 约定时区的自然日，如 UTC 日 | 请求跨日时归属哪一期，不能用并发“清零”覆盖旧请求结算 |
| 每月重置 | 自然月或账单周期 | 账期 ID 与结算记录绑定，旧期预留保留到完成对账 |
| 滚动窗口 | 最近一段时间 | 记录、过期与剩余额度解释更复杂 |

### 预留与结算：检查本身不会占住预算

先读取剩余额度再调用模型存在竞争：多个请求可能同时读到同一份余额。单独 `INCRBY` 虽能原子递增，也没有表达“超限不增加、重试不重复扣、按原账期结算”的完整规则。

预算与预留使用约定的整数最小单位；拒绝负值、NaN、Infinity 和超出存储整数范围的输入，加法也要检查溢出。零费用若被业务允许，应明确表示，不能混用为“不限额”。正确的预算操作可按下面的合同实现。这里是状态机伪代码，并非可直接复制的 Redis 命令序列：

```text
reserve(tenant, requestId, attemptId, periodId, estimate, payloadFingerprint):
  校验 estimate 为非负整数，periodId 来自服务端账期
  在同一原子边界内：
    如果该预留 ID 已存在：校验主体和指纹，返回已有状态
    如果 used + reserved + estimate > limit：拒绝，不增加额度
    否则 reserved += estimate，创建 RESERVED 记录

settle(reservationId, trustedUsage):
  在同一原子边界内：
    只允许 RESERVED / PENDING_USAGE 转入已结算状态一次
    reserved -= 本记录预留量；used += 本记录实际用量
    重复回调返回已有结果，不重复退款或扣费
```

预留量应覆盖该次尝试可发生的最大消耗，输出上限由服务端限制；若实际费用可能超过预留，必须提前定义超额审批、追加预留或停止规则。各次模型调用和工具调用有各自的 `attemptId`，共同受业务请求的总预算与总 deadline 约束。幂等键还要绑定租户、请求指纹和账期，防止同一个 ID 被换成另一份请求。

取消或超时后，如果能证明未发出调用，可以撤销预留；如果请求可能已被供应商接受或最终 usage 缺失，应进入 `PENDING_USAGE` 对账，不能直接全额退款。幂等记录的保留期须覆盖重试和对账窗口，过早过期会使迟到回调再次生效。

上述原子边界可以是数据库事务，也可以是同一 Redis hash slot 内的短脚本。用户、租户、模型供应商的全局预算若分布在不同 slot，就不能声称一段 Lua 已把它们原子组合；应选集中准入、分配有界子额度，或定义部分预留失败后的幂等补偿和保守耗额规则。

## 并发控制（Concurrency Control）

速率低不代表并发低：如果请求持续较久，仍可能积累很多在途任务。信号量限制运行中的任务数；令牌桶的令牌会随时间补充，不能替代“直到任务结束才释放”的槽位。

单进程可用信号量，但等待者也必须有上限。多实例若需要全局并发上限，应使用共享调度器或可验证的租约，而不是给每个实例各设一个“全局 3 个”的本地计数器。

一个可用的槽位合同至少包含：

1. 获取时生成唯一 `leaseId`，原子检查容量并登记该租约。
2. 等待有容量和时长上限，携带总 deadline 与取消信号；出队时重新检查是否还能开始。
3. 释放只删除本次 `leaseId`，重复释放无效；不能用不带身份的 `DECR` 误减其他任务。
4. 续期必须核对租约身份。租约过期只表示凭证失效，不能证明旧任务停止；严格并发边界还需运行器停止旧任务、验证准入凭证或采取隔离措施。

槽位应尽量在即将执行时获取，避免等待队列占满运行名额。先拿预算还是先拿槽位没有通用顺序：无法共同原子获取时，要明确暂时持有多久、失败如何释放，以及如何避免饥饿。Redis 租约的时钟、网络和故障切换限制可参考[官方分布式锁文档](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)；租约本身不是底层任务取消机制。

### 有界队列与公平调度

队列要同时限制**任务数、负载字节数、最大等待时长和单租户份额**。只写 `MAX_WAIT_MS` 常量并没有实现超时：调度器必须实际清除过期/取消任务，拒绝对应等待者，并在派发前再次校验 deadline。活动用户的调度状态也要回收，避免用户 ID 到信号量的 Map 无限制增长。

同一租户内可采用 FIFO；跨租户可采用轮询或加权公平调度，并设置老化、最低服务份额或隔离队列。严格按套餐优先级排序可能让低优先级任务永远等不到执行，付费优先也不能取消总容量限制。公平策略是业务合同，应能通过最大等待和各租户实际服务份额观察验证。[AWS 关于队列积压的工程说明](https://builder.aws.com/content/3EuRcgkTP1MI0c7zM8W6HL3WIqA/avoiding-insurmountable-queue-backlogs)讨论了积压、过期任务和多租户公平性的关系。

## 降级策略（Degradation Strategy）

限流触发后，可以快速失败、有限等待、使用已验证的替代能力或返回缓存结果。选择取决于任务的时效性、权限、质量要求和预算，而不是固定要求所有用户都排队。

### 快速失败（Fast Fail）

[429 Too Many Requests 的语义来自 RFC 6585 §4](https://www.rfc-editor.org/rfc/rfc6585.html#section-4)，服务端可携带 `Retry-After`。[RFC 9110 §10.2.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3)定义该字段的 HTTP 日期或非负整数秒格式。建议等待时间不是已经预留的执行名额；客户端还要限制尝试次数、加入退避与抖动，并遵守总 deadline。

如果是服务自身过载，可按接口合同使用 503；如果是业务预算耗尽，应返回明确的原因与恢复条件。队列等待超时不应机械套用 408：RFC 9110 中的 408 指服务器未及时收到完整请求消息，不能直接替代业务任务过期语义。

### 排队等待（Queue）

适合允许延迟的后台任务。入队成功只表示工作被接纳等待，不保证在 deadline 前执行；必须有可查询的状态和取消途径。流式输出也要尊重下游消费速度，避免慢客户端把输出缓冲变成无界队列。[Reactive Streams](https://www.reactive-streams.org/)以有界需求信号说明了背压的基本含义。

### 模型或能力降级（Fallback）

从服务端配置读取主模型与候选模型，例如 `PRIMARY_MODEL`、`FALLBACK_MODEL`，并分别验证质量、能力、数据处理范围、价格与可用配额。模型名和相对价格会变化；小模型不必然更快或更稳定，同一供应商的故障也可能同时影响候选模型。

每次 fallback 都是额外尝试，必须重新通过预算与并发准入，且共享总 deadline、最大尝试次数和总费用上限。网络超时不能证明前一次调用未执行；只有接口合同允许安全重试时才重试。缓存返回还须重新校验租户与资源权限，不能只凭 prompt hash 命中。

## 完整请求链路

请求先完成可信身份解析与入口速率检查，再按任务合同选择直接准入、有限排队或拒绝。下面放大“排队之后”的生命周期：出队时条件可能已经改变，必须重新检查；结算和释放都需要身份与幂等状态。

| 阶段 | 必须保持的边界 | 不能省略的失败处理 |
|------|----------------|--------------------|
| 入口 | 可信身份、请求指纹和速率准入 | 超限拒绝；不把拒绝请求当成已执行任务 |
| 等待 | 容量、负载字节数、最长等待与租户份额 | 满员、取消或过期即移除并通知等待者 |
| 出队准入 | 重查 deadline，取得预算预留和本次并发租约 | 只取得部分资源时按身份幂等补偿，不继续调用 |
| 执行 | 每次尝试有唯一 ID，共享总 deadline 和费用上限 | 向底层传播取消；本地超时后仍追踪执行状态 |
| 结算 | 可信 usage 与预留记录绑定，只结算一次 | 用量不明进入待对账，不能自动全额退款 |
| 回收 | 确认运行终止后仅释放对应 leaseId | 重复释放无效，不能误减新任务的槽位 |

这张表描述行为合同，不假定所有资源都位于同一个事务。跨槽预算、外部模型调用和任务运行状态不能仅凭一段 Redis 脚本变成整体原子操作；各步骤需要稳定 ID、可恢复状态与明确补偿。

## Redis 分布式令牌桶实现

多实例共享桶时，要把“读取、补充、比较、扣减、写回”放在同一次原子执行内。以下是面向 Redis 7+ 的**单 Key 核心教学脚本**，只做速率准入，不实现任务队列、费用预留或请求幂等。返回值固定为 `{allowed, remainingFloor, retryAfterMs}`。

```lua
-- KEYS[1]: 按可信主体与策略版本构造的桶 Key
-- ARGV[1..3]: capacity, rate（单位/秒）, cost
if #KEYS ~= 1 or #ARGV ~= 3 then
    return redis.error_reply('INVALID_ARGUMENT_COUNT')
end
local function finite(v)
    return v ~= nil and v == v and v ~= math.huge and v ~= -math.huge
end

local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local MAX_UNITS = 1000000000       -- 教学配置的数值范围，不是 Redis 上限
local MAX_REFILL_MS = 604800000   -- 本策略最多允许 7 天补满

if not finite(capacity) or not finite(rate) or not finite(cost)
   or capacity <= 0 or rate <= 0 or cost <= 0
   or capacity > MAX_UNITS or rate > MAX_UNITS or cost > capacity then
    return redis.error_reply('INVALID_BUCKET_ARGUMENTS')
end
local refill_ms = capacity / rate * 1000
if not finite(refill_ms) or refill_ms > MAX_REFILL_MS then
    return redis.error_reply('INVALID_REFILL_HORIZON')
end

local tm = redis.call('TIME')
local raw_now = tonumber(tm[1]) * 1000 + math.floor(tonumber(tm[2]) / 1000)
local state = redis.call('HMGET', KEYS[1], 'tokens', 'last_ms', 'cap', 'rate')
local tokens = capacity
local last = raw_now

if state[1] or state[2] or state[3] or state[4] then
    tokens = tonumber(state[1])
    last = tonumber(state[2])
    if not finite(tokens) or not finite(last)
       or tokens < 0 or tokens > capacity
       or last < 0 or last > 9007199254740991 or last ~= math.floor(last)
       or tonumber(state[3]) ~= capacity or tonumber(state[4]) ~= rate then
        return redis.error_reply('INVALID_STATE_OR_POLICY_CHANGED')
    end
end

-- TIME 是墙上时钟。回拨时冻结补充，且绝不把已存时间戳写回过去。
local now = math.max(raw_now, last)
local available = math.min(capacity, tokens + (now - last) / 1000 * rate)
local allowed = 0
local retry_ms = 0
if available >= cost then
    available = available - cost
    allowed = 1
else
    -- 先等墙上时钟追上 last，再等待缺少的额度补齐。
    retry_ms = math.ceil((now - raw_now) + (cost - available) / rate * 1000)
end

redis.call('HSET', KEYS[1],
    'tokens', string.format('%.17g', available),
    'last_ms', string.format('%.0f', now),
    'cap', string.format('%.17g', capacity),
    'rate', string.format('%.17g', rate))
return {allowed, math.floor(available), retry_ms}
```

脚本先校验参数和已有状态，之后才写回；策略变化使用新版本 Key，或明确迁移余额。`TIME` 统一使用 Redis 节点时间，减少客户端时间偏差，但它返回的是服务器 Unix 时间，并不是单调时钟，见 [TIME 文档](https://redis.io/docs/latest/commands/time/)。

**回拨为什么不能只写 `elapsed = max(0, now - last)`？** 假设存储的 `last=100`，时钟回拨到 `90`。如果本次仍把 `last` 写成 `90`，下一次到 `91` 就会再次补充已经计算过的时间段。本例持久化 `max(raw_now, last)`，回拨期间不补充，等服务器时间追上之后才继续；这是保守处理，不是强分布式时钟保证。

为了突出时钟不变量，核心脚本未设置 TTL。生产中必须限制主体 Key 基数，并制定可验证的闲置回收策略，例如在原子检查确认桶已补满时删除状态。若采用 TTL，至少覆盖完整补满时间及允许的回拨裕量；[Redis EXPIRE 文档](https://redis.io/docs/latest/commands/expire/)说明过期依赖绝对时间，任意校时跳变仍可能使状态提前过期或延长保留。状态被淘汰、重启丢失或故障切换丢写后，“缺 Key 即满桶”也会额外放量；严格额度系统需根据容错合同选择持久化、保守拒绝或其他协调机制。

### 原子执行不等于恒定延迟或无需重试

[Redis Lua 文档](https://redis.io/docs/latest/develop/programmability/eval-intro/)保证脚本执行期间其他客户端不能插入命令，同时指出脚本会阻塞该节点的其他操作。与 `WATCH/MULTI/EXEC` 相比，短脚本可避免因被监视状态冲突而重新执行整个客户端判断，但不消除网络超时、故障切换、脚本缓存丢失等错误。

本脚本只访问少量 Hash 字段，计算量固定；端到端延迟还受网络往返、节点排队、其他命令和持久化等因素影响，不能承诺“延迟恒定”或“百万 QPS”。不要在脚本里等待令牌、循环派发工作或一次清理百万条积压；窗口日志、ZSET 清理等操作要另算其数据量成本。[Redis 延迟排查文档](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)说明了多种实际延迟来源。

原子性表示不被其他请求穿插；仍应在写入前完成参数、类型和策略校验，并让写入阶段足够短小。如果客户端超时，脚本可能已扣减成功：重新消费会再扣一次。入口速率限制可以按“每次尝试计量”保守计数；费用预留、任务创建等需要业务幂等记录，不能直接用这个桶替代。

### “Redis + Lua 应对百万级队列限流”先问清规模

| “百万级”指什么 | 需要验证什么 |
|---------------|--------------|
| 累计处理一百万次请求 | 统计周期、成功/拒绝/重复的口径 |
| 每秒一百万次准入判断 | 峰值持续时间、主体分布、脚本与连接开销、p95/p99 延迟、故障表现 |
| 等待队列积压一百万项 | 内存与负载大小、最老任务年龄、有效期、排空速度和公平性 |

这三者不能互相证明。**示意算术而非性能基准**：下游每秒能完成 2,000 项，积压 1,000,000 项，即使停止接收新任务也至少需要约 500 秒排空；继续超速入队只会让工作过期。限流器应在系统无法按时兑现时拒绝或施加背压，而不是把所有流量搬到队列里。

Redis Cluster 按 Key 的 hash slot 分片；一个热点桶 Key 仍由一个 slot 的主节点处理，增加分片不会自动拆散该 Key 的请求。Lua 访问的所有 Key 必须显式通过 `KEYS` 传入，多 Key 原子脚本在 Cluster 中必须位于同一 slot；如 `budget:{tenantA}:daily` 与 `reservation:{tenantA}:req123` 可通过 hash tag 同槽，但把所有租户都塞进同一 tag 又会制造热点。见 [Redis Cluster 文档](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/)。

可以按租户或资源拆分桶，也可以由协调器向分片分配子额度；分片限额总和、发放与回收规则必须守住全局上限，不能简单给每个分片一份完整额度。Lua 只负责有界的准入状态变更，实际排队、取消、租约续期与任务执行交给调度器。压测应使用真实热点分布和脚本，分别观察准入吞吐、拒绝率、队列深度、最老等待、运行并发、预算预留与结算差额；本文不提供通用吞吐承诺。

## 常见误区与最佳实践

- **只按请求数计量**：小请求和长任务成本不同，按业务合同补充 Token、费用与并发维度。
- **把固定窗口边界突发都当成错误**：自然日预算可以允许日切；需要约束任意短窗口时，再选择令牌桶或滑动窗口。
- **把队列当作无限缓冲**：容量、字节数、等待时长、租户份额与取消处理必须真正生效。
- **用“超时了”作为退款或释放依据**：先区分本地等待结束、下游停止和实际用量已知，未知状态进入对账。
- **把 Lua 原子性当成扩容方案**：保持脚本短小，监控热点 Key；按明确额度合同分片，而非凭集群节点数推断吞吐。

网关可做粗粒度防护，应用层解析可信主体、预算和任务状态。向客户端公开的剩余额度、重置时间与重试提示应说明单位和范围；上游返回 429 后，要按其合同执行有界退避和准入调整，避免所有实例同步重试。实时交互与批处理可使用隔离的资源池，但总资源上限仍须守住。[Google SRE 过载处理章节](https://sre.google/sre-book/handling-overload/)讨论了限制重试和在容量耗尽时拒绝工作的必要性。

## 面试常问要点

**Q：手写令牌桶时最容易漏掉什么？**

先说明 `capacity` 控制突发，`rate` 控制长期补充，`cost` 表示本次权重。使用单调时间差，把补充、比较和扣减放在同一临界区，拒绝不扣额度；校验有限正数，`cost > capacity` 是永远装不下的错误。单机锁只保证当前进程，多实例共享状态还需原子准入。

**Q：令牌桶、滑动窗口和日/月预算如何选择？**

令牌桶允许积累后的突发；滑动窗口约束最近 `W` 秒的总量，但窗口内仍可集中消费。自然日/月预算是账期问题，可用固定周期账本；Token 速率、运行并发和费用预算应按不同计量口径分别约束。

**Q：Redis + Lua 如何支持“百万级队列式并发限流”？**

先澄清是累计量、QPS 还是积压量，再描述短脚本如何原子完成检查与扣减。队列由有界调度器管理，明确 deadline、取消、租户公平与并发租约；压测热点 Key，核对 Cluster 同槽限制及分片额度总和。在算法、状态与故障假设正确时，原子执行可以避免交错检查造成的超卖；它本身不能证明吞吐或固定延迟。

**Q：output Token 未知，如何控制预算？**

请求前以可信输入估算、服务端输出上限及本次尝试预算做原子、幂等预留；结束后按可信 usage 结算一次。取消或超时而用量不明时保留待对账，不能直接退款。单独 `INCRBY` 没有完成“检查并预留”合同。

**Q：Lua 相比 WATCH/MULTI/EXEC 有什么边界？**

它把复合判断移到节点内，避免乐观锁冲突循环，但执行时会阻塞该节点。网络超时可能产生结果未知，仍要区分幂等重试与重复扣减；慢脚本、热点 Key、故障切换和跨 slot 额度都需要单独设计。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里淘天 AI 应用研发一面：RAG、限流 Top-K 与优惠策略](../../../interview/alibaba/ai/alibaba-ai-5.md)
- [腾讯混元后台一面：Java 并发、限流与 Agent 工程](../../../interview/tencent/ai/tencent-ai-28.md)
- [阿里国际 AI 应用研发一面：JDK 8、消息可靠性与 RAG](../../../interview/alibaba/ai/alibaba-ai-25.md)
- [美团 AI 全栈一面：索引、限流与分片边界](../../../interview/meituan/ai/meituan-ai-12.md)
<!-- interview-source-history:end -->

## 参考资料

- [RFC 3290 附录 A：Token Buckets and Leaky Buckets](https://www.rfc-editor.org/rfc/rfc3290.html#appendix-A)
- [Python time：monotonic_ns](https://docs.python.org/3/library/time.html#time.monotonic_ns)
- [Redis：Lua scripting introduction](https://redis.io/docs/latest/develop/programmability/eval-intro/)
- [Redis TIME](https://redis.io/docs/latest/commands/time/)
- [Redis EXPIRE：过期与时间语义](https://redis.io/docs/latest/commands/expire/)
- [Redis Cluster：hash slots 与 multi-key operations](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/)
- [Redis：Diagnosing latency issues](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)
- [Redis：Distributed locks](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)
- [RFC 6585 §4：429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585.html#section-4)
- [RFC 9110 §10.2.3：Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3)
- [Reactive Streams specification](https://www.reactive-streams.org/)
- [AWS：Avoiding insurmountable queue backlogs](https://builder.aws.com/content/3EuRcgkTP1MI0c7zM8W6HL3WIqA/avoiding-insurmountable-queue-backlogs)
- [Google SRE：Handling Overload](https://sre.google/sre-book/handling-overload/)
