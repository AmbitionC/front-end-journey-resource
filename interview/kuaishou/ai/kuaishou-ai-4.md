### 快手商业化效果营销一面：多 Agent 协作、Netty 与限流

作者记述这轮一面约 40 分钟，围绕弹幕系统和第二个 Agent 项目追问，最后考察最长公共子序列。面试日期和具体岗位未披露；采集元数据中的 2026 年 8 月是发帖时间，不能当作面试年月。本文合并项目背景、弹幕流程和 Agent 技术栈等相邻追问，选录技术问题；不收录自我介绍和结果叙述。以下回答是教学整理，原文没有披露候选人的实际答案、具体技术栈或项目指标。

<details data-binding-status="pending_semantic_verification">
<summary>（1）怎样介绍项目背景和技术亮点？</summary>
<p>关联知识点待核实。</p>
</details>

用“业务目标—规模约束—核心链路—本人职责—关键取舍—量化结果”组织。以弹幕系统为例，应说明消息从客户端进入、鉴权、路由、广播到持久化的完整路径，以及峰值连接数、消息速率、可接受延迟和失败处理。技术亮点不能只报组件名，要解释原方案的瓶颈、候选方案的比较和上线后指标变化。

<details data-binding-status="pending_semantic_verification">
<summary>（2）弹幕功能的流程是什么？Netty 的底层工作模型与广播怎样实现？</summary>
<p>关联知识点待核实。</p>
</details>

Netty 用 Channel 抽象连接，以 EventLoop 让少量线程处理大量非阻塞 I/O 事件；Pipeline 中的 Handler 负责解码、鉴权、业务处理和编码。弹幕广播通常按房间维护连接集合：消息先完成校验和路由，再异步写入该房间的 Channel，并在合适时机统一 flush。

广播链路必须处理慢客户端和背压。生产系统会设置写缓冲水位、发送队列上限与超时，对低优先级消息做合并或丢弃；房间过热时可按房间或用户分片，避免一次广播阻塞其他连接。跨节点广播还需要消息总线或房间路由表，不能把单机 Channel 集合当成全局状态。

<details data-binding-status="pending_semantic_verification">
<summary>（3）弹幕数据结构怎样设计？弹幕量过大怎么办？</summary>
<p>关联知识点待核实。</p>
</details>

传输对象至少包含消息 ID、房间 ID、发送者标识、时间、消息类型、内容与版本；展示顺序通常依赖服务端序号或逻辑时间，而不是客户端时间。实时广播载荷、可靠投递状态和长期查询模型应分开设计，避免每条弹幕都携带不必要的大字段。

高流量下先按房间分区，再使用批量编码、批量发送、热点房间隔离和有界队列。持久化侧采用异步批写和分区存储；过载时按业务优先级降级，例如合并重复事件、采样非关键弹幕或暂缓历史落库，但需要保留核心消息的可追踪状态。

<details data-knowledge-key="redis-cache">
<summary>（4）布隆过滤器的原理和关键参数是什么？</summary>
</details>

布隆过滤器用 `k` 个哈希函数把元素映射到 `m` 位的位数组。查询时只要有一位为 0，就能确定元素不存在；所有位都为 1 只能说明“可能存在”，因此会有假阳性。标准布隆过滤器不能安全删除，删除场景应考虑计数布隆过滤器或重建。

给定预估元素数 `n` 和目标误判率 `p`，可用 `m = -n ln(p) / (ln 2)^2` 估算位数，用 `k = (m/n) ln 2` 估算哈希函数数量。容量不能凭经验固定：元素远超设计容量后，误判率会快速升高，还要监控填充率并规划扩容或分代重建。

延伸阅读：[Redis 缓存策略与布隆过滤器](../../../knowledge/backend/database/redis-cache.md)。

<details data-knowledge-key="rate-limit-circuit">
<summary>（5）为什么使用 Lua 脚本做 Redis 限流？不用 Lua 可以吗？</summary>
</details>

限流通常需要“读取当前状态—判断是否放行—更新计数或令牌—设置过期”作为一个原子操作。把这些步骤拆成多条命令，会在并发下产生竞态；Lua 脚本由 Redis 原子执行，适合封装滑动窗口、令牌桶等短小逻辑。

Lua 不是唯一选择。简单固定窗口可用单条 `INCR` 配合可靠的过期策略，也可使用事务、Redis Functions、网关内置限流器或带原子语义的专用组件。选型要同时考虑 Redis Cluster 的 key 归槽、脚本执行时间、热 key、故障降级和服务端本地兜底，不能让限流器本身成为单点瓶颈。

延伸阅读：[接口限流、熔断与降级](../../../knowledge/backend/auth/rate-limit-circuit.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（6）Canal 用来做什么？</summary>
<p>关联知识点待核实。</p>
</details>

Canal 模拟 MySQL 从库读取 binlog，把行级变更转换为事件，常用于缓存失效、搜索索引更新和数据仓库同步。它解决的是变更捕获，不自动保证下游“恰好一次”。消费者仍需用业务主键、binlog 位点或事件 ID 做幂等，并处理重复、乱序、断点恢复和表结构变更。

回答时还应划清边界：核心交易不能只依赖异步 CDC 才获得正确性；缓存或索引更新允许短暂延迟时，可以通过监控同步延迟、死信和对账任务实现最终一致。

<details data-knowledge-key="agent-run-loop">
<summary>（7）第二个项目用了哪些技术栈，Agent 整个流程应该怎样讲？</summary>
</details>

先按真实实现说明项目目标、技术栈、各组件职责及输入输出；原文没有公开具体组件，不补成候选人的实际方案。可用通用运行循环解释：读取用户目标与任务状态，组装上下文，调用模型产生回答或工具请求；运行时校验工具参数、权限和预算，执行后将观测写回状态，再依据业务验收、失败或无进展条件停止或进入下一轮。最大轮次、超时、重试、取消、人工接管和成本预算应有明确边界，不能只凭模型说“完成”判断任务成功。

知识导航：[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)。

作为延伸方案，只有任务可独立分解、角色需要隔离上下文或并行执行有明显收益时，多 Agent 才值得引入；强依赖的短链路通常用状态图或普通工作流更简单。

延伸阅读：[多智能体系统](../../../knowledge/llm/agent/multi-agent.md)。

<details data-knowledge-key="agent-multi-agent-messaging">
<summary>（8）子 Agent 之间如何通信？依赖另一个 Agent 输出时怎么办？</summary>
</details>

通信消息应有类型化载荷，并携带任务 ID、消息 ID、关联 ID、Schema 版本、计划版本和状态。接收确认只表示消息到达，不等于任务完成；重复消息通过幂等键去重，迟到结果不能覆盖新计划。

对于“B 依赖 A 输出”的情况，应把依赖声明成任务 DAG：A 完成并通过校验后，将带版本的结果写入权威状态存储，调度器再解锁 B。共享状态使用单写者、乐观版本或 compare-and-set 控制并发，Agent 之间只传变化与引用，避免各自复制并覆盖整份全局状态。

延伸阅读：[多 Agent 消息协议与状态同步](../../../knowledge/llm/agent/agent-multi-agent-messaging.md)。

<details data-knowledge-key="algorithm-loop">
<summary>（9）如何求两个字符串的最长公共子序列？</summary>
</details>

设 `dp[i][j]` 表示前 `i` 个字符与前 `j` 个字符的最长公共子序列长度。若当前字符相同，则 `dp[i][j] = dp[i-1][j-1] + 1`；否则取 `max(dp[i-1][j], dp[i][j-1])`。时间复杂度为 `O(mn)`、空间复杂度为 `O(mn)`，只求长度时可压缩为一维数组；若要恢复具体序列，则需保留完整表或前驱信息。

延伸阅读：[递归、动态规划与 Memoization](../../../knowledge/data-structure/algorithm/algorithm-loop.md)。
