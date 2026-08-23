Redis 分布式锁不是“跨进程版 mutex”，而是一份有期限的独占租约：客户端在租约有效期内拥有进入临界区的资格。可靠实现必须同时回答如何原子获取、如何证明所有权、租约到期怎么办，以及旧持有者恢复后还能不能写入。

## 先明确它解决什么

当多个进程可能同时处理同一订单、任务或资源，且业务无法通过单写者队列、数据库事务或唯一约束直接收敛并发时，分布式锁可缩小临界区。但它不保证业务操作自动幂等，也不能把 Redis 与数据库变成一个事务。

使用前先问：

1. 能否用数据库唯一约束或条件更新解决？
2. 能否按资源 key 分区到单消费者串行处理？
3. 冲突时重试是否安全？
4. 锁失效后，资源侧如何拒绝旧持有者？

## 单 Redis 实例的基本正确做法

获取锁时使用一次原子 `SET`：

```text
SET lock:resource:<id> <random-token> NX PX 30000
```

- `NX`：只有 key 不存在时才写入；
- `PX`：同时设置毫秒级租约，避免持有者崩溃后永久占锁；
- `random-token`：每次获取生成唯一所有权标识。

释放锁不能直接 `DEL`，否则客户端 A 的租约过期、客户端 B 已获得新锁后，A 可能误删 B 的锁。应在 Redis 内原子比较 token 再删除：

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
```

这保证“只能释放自己的租约”，但不保证业务操作只发生一次。

## TTL 与续期怎样选

固定 TTL 必须覆盖正常执行时间和合理抖动。TTL 太短，任务未完成锁就失效；太长，持有者崩溃后的恢复窗口过大。

Redisson 的锁 Watchdog 会在客户端仍存活时延长锁过期时间；如果显式传入 `leaseTime`，锁会在指定时间自动释放。续期适合执行时间波动的任务，但必须有总时长上限、续期失败监控和取消路径，避免一个卡死任务无限占用资源。

Watchdog 不是安全证明。长时间 Stop-the-World、进程暂停、网络隔离或 Redis 故障都可能让租约在业务仍运行时过期。

## 过期持有者与 Fencing Token

假设 A 获得锁后暂停，租约过期；B 获得新锁并写入；随后 A 恢复。如果下游只相信“我曾经拿到过锁”，A 仍可能覆盖 B 的新结果。

更强的做法是每次获取锁同时取得单调递增的 fencing token。下游资源记住最后接受的 token，只接受更大的序号：

```text
A: token=41（暂停）
B: token=42 → 下游接受并记录 42
A: 恢复后携带 41 → 下游拒绝
```

如果下游无法校验 token，至少用数据库版本号、条件更新、唯一约束和业务幂等键兜底。

## 故障切换与一致性边界

Redis 主从复制通常是异步的。主节点写入锁后、复制到从节点前宕机，从节点提升为主节点时，另一个客户端可能再次获得同一锁，互斥性被破坏。能否接受这个窗口取决于业务风险。

对“偶发双执行可由幂等消解”的任务，Redis 锁可能足够；对资金、库存真相或不可逆外部动作，应把最终约束放在权威存储，并评估专用一致性协调系统或数据库锁。不要把某个客户端库的 API 当成端到端 exactly-once 保证。

## 生产检查清单

- 锁 key 包含稳定资源 ID，临界区尽量短；
- 获取带唯一 token 和 TTL，释放原子校验所有权；
- 明确等待超时、获取失败、业务超时和取消语义；
- 监控持锁时长、续期失败、竞争率和过期后继续执行；
- 业务写入仍有幂等键、唯一约束或版本检查；
- 压测进程崩溃、长暂停、网络隔离、主从切换和重复消息；
- 不能说明故障边界时，不把锁用于高风险不可逆动作。

## 面试回答模板

先给结论：“我把 Redis 锁当有期限的租约，不当 exactly-once。”然后依次讲 `SET NX PX`、唯一 token、Lua 安全释放、TTL/Watchdog、过期持有者与 fencing token，最后落到项目的数据库约束和故障演练。这个顺序能同时回答实现、选型和生产风险。

## 出现于（热度来源）

- [字节后端开发秋招二面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-6.md)（A 级第一手面经，cluster-5ab99b43f10b）
- [字节后端与 Code Review Agent 秋招一面](../../../interview/bytedance/base/bytedance-base-9.md)（A 级第一手面经，cluster-5b6e09ee89e6）
- [蚂蚁后端 AI 开发一面](../../../interview/antfin/ai/antfin-ai-3.md)（B 级第一手面经，cluster-e11f3de537e5）

## 参考资料

- [Redis 官方文档：Distributed Locks with Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)
- [Redis 官方文档：SET](https://redis.io/docs/latest/commands/set/)
- [Redisson Reference Guide：Locks and synchronizers](https://redisson.pro/docs/data-and-services/locks-and-synchronizers/)
