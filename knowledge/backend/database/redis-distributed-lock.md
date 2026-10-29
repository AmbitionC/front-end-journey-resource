Redis 分布式锁不是“跨进程版 mutex”，而是一份有期限的独占租约：客户端在租约有效期内拥有进入临界区的资格。可靠实现必须同时回答如何原子获取、如何证明所有权、租约到期怎么办，以及旧持有者恢复后还能不能写入。

## 先明确它解决什么

当多个进程可能同时处理同一订单、任务或资源，且业务无法通过单写者队列、数据库事务或唯一约束直接收敛并发时，分布式锁可缩小临界区。但它不保证业务操作自动幂等，也不能把 Redis 与数据库变成一个事务。

使用前先问：

1. 能否用数据库唯一约束或条件更新解决？
2. 能否按资源 key 分区到单消费者串行处理？
3. 冲突时重试是否安全？
4. 锁失效后，资源侧如何拒绝旧持有者？

## 互斥租约与乐观 CAS 怎样区分

先取得互斥资格、再进入临界区的租约方案，通常按悲观协调理解，但排他仍受租约有效期与故障假设限制。CAS 则把“当前值或版本等于期望值时才更新”作为原子条件；失败后重新读取并核对，不能无界忙重试。高竞争会增加重试，单位置的 CAS 也不自动维护多个资源之间的不变量。

只比较值时，状态从 A 变 B 又回 A，CAS 可能看不出期间发生过变化，这就是 ABA 风险。把值与每次更新都推进的版本一起原子比较可帮助识别这种变化；[Java 的 AtomicStampedReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html)提供引用与 stamp 的联合比较更新，应用仍须管理版本推进与复用边界。资源端版本、锁租约与业务幂等解决不同问题，不能仅凭一次 CAS 成功推断整项业务恰好执行一次。

## 单机为什么仍可能需要 Redis 锁

“单机”说的是机器数量，不一定是互斥域。一个主机上可以运行多个 Worker 进程、容器或独立服务；滚动更新时新旧实例也可能短时并存。进程内 mutex 只约束共享那把锁的参与者，不能自动挡住另一进程。若这些参与者都要修改同一资源，可能仍需跨进程协调。

例如两个本机 Worker 同时收到同一任务，各自的内存锁都显示空闲，却会同时进入数据库写入。若唯一约束或条件更新已能完整表达正确性，就优先用它；只有需要在统一共享键上协调临界区，且所有参与者遵守协议时，才考虑 Redis 租约。只有一个执行进程、没有外部竞争者时，Redis 的网络与故障依赖可能没有必要。“部署在一台机器”既不是必须加 Redis 锁，也不是可以省略并发控制的证明。这是对下述客户端与共享锁模型的工程应用，不是作者项目的真实部署事实。

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

更强的做法是每次获取锁同时取得单调递增的 fencing token。下游资源记住已见的最大 token，拒绝更旧的序号；同一 token 下的多次操作，还需按业务操作序号或幂等键决定是否接受，不能把 fencing 等同一次且仅一次：

```text
A: token=41（暂停）
B: token=42 → 下游接受并记录 42
A: 恢复后携带 41 → 下游拒绝
```

如果下游无法校验 token，资源端仍需用版本号或条件更新（CAS）拒绝陈旧写入。唯一约束和业务幂等键只能消除它们所定义的同一业务操作重复；旧持有者携带不同 operationId 的晚写不会因此自动被拒绝，不能把幂等当成 fencing 的替代品。

## 故障切换与一致性边界

Redis 主从复制通常是异步的。主节点写入锁后、复制到从节点前宕机，从节点提升为主节点时，另一个客户端可能再次获得同一锁，互斥性被破坏。能否接受这个窗口取决于业务风险。

对“偶发双执行可由幂等消解”的任务，Redis 锁可能足够；对资金、库存真相或不可逆外部动作，应把最终约束放在权威存储，并评估专用一致性协调系统或数据库锁。不要把某个客户端库的 API 当成端到端 exactly-once 保证。

## Redlock改变了什么假设

[Redis的Redlock说明](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)使用多个相互独立的Redis主实例，客户端用同一随机所有权值在多数实例获取租约，并扣除获取耗时与时钟漂移余量计算剩余有效期；失败时释放可能取得的租约。它不是把一个主从组里的多数副本当作独立主实例，也不等同共识日志复制。

多数获取依然有时间与故障假设：本地时钟推进、长暂停、消息延迟、重启丢锁与网络分区都会影响能否在有效期内完成工作。没有有效租期时应停止新操作；已发出的旧写仍须由资源端版本或fencing检查防护。拿到多数租约不能自动给任意下游生成一个可验证的单调fencing序号，更不能取消业务事务与幂等边界。选型需说明业务容许的故障窗口，而不是回答“用了Redlock就没有问题”。

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

## 改变条件再检查

下面是教学追问：**单机服务从一个进程改为两个 Worker，原内存锁还有用吗？** 每个进程有自己的内存状态；先确认锁对象是否真正共享，再决定数据库约束、单消费者或共享租约。**A 的租约到期后才完成外部写入，安全释放脚本能阻止这次写入吗？** 不能；脚本只避免误删 B 的锁。资源端版本/CAS 或真正的 fencing 才能拒绝陈旧写入；业务幂等键只处理同一业务操作的重复，不能独自阻止旧持有者以另一个操作 ID 写入。

本文命令与 Lua 为协议教学示意，本次未连接 Redis 或外部资源执行；不提供故障切换、客户端续期或业务幂等的实测结论。Redis 与 Redisson 官方滚动文档核验于 2026-10-15，部署时仍须固定服务器与客户端版本。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [飞书后端一面：锁粒度与混合检索](../../../interview/bytedance/base/bytedance-base-72.md)
- [百度北京后端秋招一面：Agent 安全、检索与存储](../../../interview/baidu/ai/baidu-ai-3.md)
- [字节一面：线程池、分布式锁与数字构造](../../../interview/bytedance/base/bytedance-base-58.md)
- [字节后端与 Agent：运行链路、数据库与网络](../../../interview/bytedance/base/bytedance-base-55.md)
- [字节后端开发秋招二面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-6.md)
- [字节 Agent 实习：生成质量、多智能体与缓存](../../../interview/bytedance/base/bytedance-base-52.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
- [蚂蚁后端 AI 开发一面：Agent、Redis 与短链系统](../../../interview/antfin/ai/antfin-ai-3.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
<!-- interview-source-history:end -->

## 参考资料

- [Redis 官方文档：Distributed Locks with Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)
- [Redis 官方文档：SET](https://redis.io/docs/latest/commands/set/)
- [Redisson Reference Guide：Locks and synchronizers](https://redisson.pro/docs/data-and-services/locks-and-synchronizers/)
- [Java SE 25：AtomicStampedReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html)
