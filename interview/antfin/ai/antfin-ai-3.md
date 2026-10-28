### 蚂蚁后端 AI 开发一面：Agent、Redis 与短链系统

这份后端 AI 开发一面记录把 Agent/RAG/MCP 与 Redis、缓存、短链设计和链表算法放在同一轮中。具体面试日期未披露；采集元数据中的 2026 年 4 月是发帖时间。本文选录下列 8 组题，未收录输入 URL 到页面展示、Linux 常用环境变量、Shell 判断上一条命令是否成功这三道独立问题，以及结果叙述。答案是教学整理，不代表候选人的实际作答；链表题保留“先判环，有环再找入口”的原始要求。

<details data-knowledge-key="mcp-protocol">
<summary>（1）怎样区分 Agent、RAG、Skill 和 MCP？</summary>
</details>

Agent 是带目标、状态、工具和运行循环的系统；RAG 是在生成前检索外部证据的模式；Skill 是按任务封装的操作说明与资源；MCP 是工具和资源的标准化连接协议。一个 Agent 可以同时使用 RAG、Skill 和 MCP，但它们不是同一个抽象层。

延伸阅读：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)、[Agent Skill 设计](../../../knowledge/llm/agent/agent-skill-design.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（2）如何用 Redis 实现分布式锁？</summary>
<p>关联知识点待核实。</p>
</details>

加锁使用带唯一 token 的原子命令 `SET key token NX PX ttl`；释放时用 Lua 原子比较 token 后删除，避免误删别人的锁。任务可能超过 TTL 时需要有上限的续期。重要写入仍需数据库唯一约束、幂等键或 fencing token，因为网络隔离和停顿可能让旧持有者在租约失效后继续执行。

<details data-binding-status="pending_semantic_verification">
<summary>（3）为什么用 Lua 释放锁？分开 GET/DEL 会有什么问题？</summary>
<p>关联知识点待核实。</p>
</details>

如果先 `GET` 判断 token，再单独 `DEL`，两条命令之间锁可能过期并被另一个客户端取得，此时旧客户端会删掉新锁。核心要求是原子比较并删除，Lua 是一种实现方式，它把这两步作为一个不可插入的操作执行。它解决单实例内原子性，不自动解决故障转移时的复制一致性。

<details data-knowledge-key="redis-distributed-lock">
<summary>（4）这是乐观锁还是悲观锁？CAS 有什么局限？</summary>
</details>

获得 Redis 互斥锁后其他参与者被排除，语义更接近悲观并发控制；CAS 基于版本/期望值冲突后重试，属于乐观方式。CAS 在高竞争下重试成本高，对复合不变量需要额外设计，并有 ABA 问题，可通过版本戳缓解。

延伸阅读：[Redis 分布式锁：租约、续期与故障边界](../../../knowledge/backend/database/redis-distributed-lock.md)。

<details data-knowledge-key="redis-cache">
<summary>（5）Redis 做 MySQL 缓存怎样更新？</summary>
</details>

常见 Cache Aside：读未命中查询数据库并回填；写先提交数据库，再删除缓存。删除失败进入重试/消息补偿，并设置合理 TTL。热点 key 可加互斥重建或逻辑过期；空值/布隆过滤器用于缓解穿透。先定义一致性容忍度，再选择方案，缓存不能成为不受控的第二真相源。

延伸阅读：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（6）设计短链系统从哪里开始？</summary>
<p>关联知识点待核实。</p>
</details>

先估算读写量、保留期、自定义码和跳转延迟。写入服务生成全局唯一短码，存储 `code -> long_url` 与状态/过期时间；跳转服务读缓存或数据库并返回 301/302。需要处理碰撞、恶意 URL、过期删除、域名与风控、访问统计和多地域容灾。

<details data-binding-status="pending_semantic_verification">
<summary>（7）短链瓶颈在读还是写，怎样优化？</summary>
<p>关联知识点待核实。</p>
</details>

通常跳转读多写少，但必须用业务估算确认。读侧可用 CDN/边缘、分层缓存、热点隔离和只读副本；写侧可批量发号、分库分表并异步统计。优化前监控缓存命中率、P99、热点分布和存储 QPS，避免只增加缓存掩盖根因。

<details data-binding-status="pending_semantic_verification">
<summary>（8）怎样判断链表有环，并找到环入口？</summary>
<p>关联知识点待核实。</p>
</details>

先让快指针每次走两步、慢指针每次走一步：若快指针或其后继为空则无环；若两者相遇则有环。首次相遇后，让一个指针回到头节点，两个指针都每次走一步，再次相遇处就是环入口。设头到入口为 $a$，入口到首次相遇为 $b$，环长为 $c$；相遇时快指针路程是慢指针两倍，可推出 $a$ 与若干圈后的 $c-b$ 等长。时间 $O(n)$，空间 $O(1)$。
