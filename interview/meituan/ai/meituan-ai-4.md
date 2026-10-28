美团本地核心一面，原文只给4.24，年份和正式岗位未披露。以下按缓存、库存、记忆与能力边界归纳。

经历和岗位来自候选人自述，未独立认证；以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案。未披露条件先澄清，教学假设会单独说明。

<details data-knowledge-key="redis-cache">
<summary>（1）两级缓存遇到主动更新时怎样维持一致性，并提高最终一致性的实时性？</summary>
</details>

短答：先区分静态券信息与库存等动态事实，声明允许陈旧时间。写库后失效Redis与各L1，结合可重试通知、版本与回源，但仍要处理迟到旧值回填。

详解：缩短TTL不自动给出端到端陈旧上界：旧L2可能再次填进L1，慢读也可能晚回填。Redis tracking感知Redis键变化，不直接订阅数据库；通知连接断开应清理相关本地缓存。库存、付款等关键动作回到权威状态校验，不能用一句MQ或最终一致代替故障推演。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

<details data-knowledge-key="async-job-queue">
<summary>（2）Redis Lua 扣库存后发送 MQ 前崩溃，怎样发现并修复与数据库的不一致？</summary>
</details>

短答：先定库存事实源并保存稳定操作ID。Redis扣完后才发MQ存在丢事件窗口；事后写数据库outbox不能让此前Redis动作变成同库事务。

详解：若DB权威，可在同库保存预占和outbox；若先Redis预占，库存变化与可恢复操作记录应共享Redis原子边界，再由恢复器转发。转发可能重复，消费端仍需同库去重与业务提交后确认。脚本错误、持久化/复制丢失、同槽、日志保留与跨系统对账都要另验，不能按库存差额猜失去的订单。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

<details data-knowledge-key="agent-memory">
<summary>（3）Agent 怎样管理工具结果与分层记忆，并核验 token 节省？</summary>
</details>

短答：短期状态服务当前任务，长期记忆保留经授权、可复用且带来源的信息。工具大结果可外存，工作上下文保留关键字段、摘要与可回读引用，不能截断掉未知操作状态。

详解：摘要是有损视图，工具请求和结果要可配对，授权、幂等键和未决事项单独保存。验证token节省时固定任务、模型、工具与知识版本，计入输入、输出、摘要生成和重试，再比较质量、成本与延迟。原文的50%没有基线和样本，本文不把它当实测成绩。

知识导航：[短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)。

<details data-knowledge-key="mcp-protocol">
<summary>（4）Skill、MCP 与 Function Calling 各自解决什么问题，是否处于同一抽象层？</summary>
</details>

短答：Skill组织任务说明和资源，Function Calling让模型提出结构化调用，MCP约定应用与外部能力的发现和交互。它们可组合，不能按名字当作互相替代的同一层。

详解：一个Skill可以指导使用多个MCP工具，应用也可由确定性代码直接调用MCP能力。加载Skill或发现工具都不授予权限，执行层仍校验输入、身份和结果。Skill的具体结构与MCP协议版本需明确，不能把某一产品的用法当成所有系统的统一实现。

知识导航：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)。

## 参考资料

- [Redis：客户端缓存竞态与断线](https://redis.io/docs/latest/develop/reference/client-side-caching/)
- [Redis：脚本原子执行](https://redis.io/docs/latest/develop/programmability/)
- [Redis：Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Redis：事务错误边界](https://redis.io/docs/latest/develop/using-commands/transactions/)
- [RabbitMQ：发布与消费确认](https://www.rabbitmq.com/docs/confirms)
- [LangGraph：短期checkpointer与长期store](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph：恢复与幂等](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Agent Skills：渐进加载](https://agentskills.io/specification)
- [MCP：工具校验与访问控制](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP 2026-07-28：无状态发现](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
