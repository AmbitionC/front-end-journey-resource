公司：腾讯；来源标明 PCG、暑期一面，正式岗位和面试日期未披露。本文选录双写一致性、多 Agent 调度与无响应恢复三题。原记录未给实现代码或实际指标，下文的状态设计、例子和答案均为编辑教学补充，不代表原项目已经采用。

<details data-knowledge-key="vector-database-internals">
<summary>（1）向量写入成功、文档写入失败时，怎样维护检索系统的一致性？</summary>
</details>

把文档事实与派生向量索引的版本和就绪状态显式关联，只有权威文档存在、版本有效且当前用户可访问的结果才进入回答。部分写成功先保留可恢复状态，幂等补写缺失阶段或清理孤立产物；不能把两个独立写调用的成功拼成跨系统原子事务。

一种教学方案是把文档库定义为权威源：在同一文档事务中保存来源版本和待索引事件，由后台按稳定来源 ID、版本和操作写向量，再核对产物与就绪标记。若向量先可搜而文档写入失败，查询层仍拒绝使用未就绪结果，并记录缺失阶段以补写或清理；不能把缺文档当空内容交给模型补全。

[MongoDB 的事务说明](https://github.com/mongodb/docs/blob/main/content/manual/manual/source/core/transactions.txt)讨论其事务内变更的原子性；[Milvus 的一致性说明](https://github.com/milvus-io/milvus-docs/blob/v3.0.x/site/en/reference/tune_consistency.md)讨论查询可见时间点。由这些各自的边界不能推出两套系统的写入自动共同提交，单独调高搜索一致性级别也不会补上缺失文档。原帖没给两者版本或事务配置。

读路径应核对 sourceVersion、删除状态与权限；异步补写要能处理重复、乱序和旧任务迟到。可以演练向量成功后文档失败、确认丢失、重复事件和删除传播，检查不返回幽灵证据、重试不制造重复块。具体写入顺序与恢复策略取决于事实源和允许的陈旧窗口，以上是方案示例。

延伸阅读：[向量数据库索引、过滤与一致性](../../../knowledge/data/storage/vector-database-internals.md)。

<details data-knowledge-key="multi-agent">
<summary>（2）Supervisor 怎样拆分任务，并协调并行与能力不足的 Agent？</summary>
</details>

先为子任务定义目标、输入、权限、预算和带证据的输出，再按依赖关系解锁执行：真正独立的分支才能并行。子 Agent 能力不足时返回缺口与已验证进展，由协调者补信息、换能力或停止；不能让各节点无限互相委托，也不能把返回一段文字当任务已完成。

教学解释搜索与比价场景时，先看比价是否依赖搜索得到的商品 ID；若依赖，就先搜索并校验候选，再查同规格、同时间和同价格口径的报价。可独立准备的分支可以有界并行，但“意图需要两种能力”并不自动说明两者无依赖。

[Anthropic 的多 Agent 研究系统经验](https://www.anthropic.com/engineering/multi-agent-research-system)解释了专项执行者独立探索、主执行者协调汇总的作用；这种研究产品经验不是所有任务的收益保证。任务若只是固定调用和合并，用确定性流程也可能足够，不必增加一个会循环决策的 Agent。

子任务返回任务 ID、输入版本、证据、未完成项与状态。父运行时检查口径和来源，旧结果不能覆盖新计划；重复回报应去重。能力不足也要区分缺权限、缺数据、工具故障和推理未收敛，再采取对应恢复，不能通过“再加一层 Agent”掩盖同一个缺口。

延伸阅读：[多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)。

<details data-knowledge-key="agent-tool-timeout">
<summary>（3）Agent 或组件长时间无响应时，怎样设计超时、重试和降级？</summary>
</details>

用全局截止时间约束各次等待、重试和验证，并把本地超时与远端实际执行状态分开。可恢复且重复安全的操作才有限退避重试；已提交的取回结果，结果未知的先查询或对账，必要时转人工；不能因界面不动就无条件重启整条链。

教学例子：只读报价查询可在其合同允许、剩余时间足够时重试；创建订单的响应超时则可能已在远端成功。先用稳定操作 ID 查询状态，确认已提交就读取原结果，无法判断时保留 unknown，而不是换一个 Agent 再创建一次。

[RFC 9110 对幂等方法的说明](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)限制不知道重复是否安全时自动重试非幂等请求；[AWS 的退避指南](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)也强调暂时错误、幂等与重试放大。权限拒绝、参数错误和永久业务失败通常不会因等一会儿恢复。

每次尝试记录阶段、耗时、错误、取消请求与操作状态。降级可能是返回已验证的部分结果、缩小任务或等待人工；须说明缺口，不能把预算耗尽标成成功。取消只表达停止意图，仍需核对已提交和迟到结果。原文没有故障轨迹，不能替作者给出一次卡死的根因。

延伸阅读：[工具超时、取消与重试](../../../knowledge/llm/agent/agent-tool-timeout.md)。

## 参考资料

- [MongoDB：事务原子性](https://github.com/mongodb/docs/blob/main/content/manual/manual/source/core/transactions.txt)。
- [Milvus：查询一致性与可见时间点](https://github.com/milvus-io/milvus-docs/blob/v3.0.x/site/en/reference/tune_consistency.md)。
- [Anthropic：多Agent研究系统](https://www.anthropic.com/engineering/multi-agent-research-system)。
- [Anthropic：构建有效Agent](https://www.anthropic.com/engineering/building-effective-agents)。
- [RFC 9110：幂等方法与自动重试](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)。
- [AWS：Retry with backoff](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)。
