Agent 状态不是一段可以无限追加的聊天记录。生产系统至少要区分 Thread、Run、Checkpoint、Event、Artifact 和 Long-term Memory：它们的身份、更新频率、一致性、保留期与重放语义不同。混进一张 JSON 表会让恢复、并发、删除和审计都变得不可解释。

[LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)用 thread 组织连续执行，并在图步骤边界保存 checkpoint。这是一个具体框架的实现，但它清晰展示了“会话容器”和“某次执行快照”不是同一概念。

![租户下的 Thread 包含 Run；Run 引用 Checkpoint、追加事件和 Artifact，Long-term Memory 独立存在；恢复读取快照和事件，外部副作用经幂等账本](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-state-storage-state-model-v1.webp)
*图：持久事实用于恢复，渲染和派生结果可以重建；长期记忆不等于某次 Run 的事件历史。*

## 聚合与标识

推荐层级：

~~~text
tenant_id
  thread_id
    run_id
      checkpoint_id / checkpoint_version
      event_seq
      artifact_id
memory_id
~~~

Thread 表达一个长期交互或业务上下文，Run 是一次有开始和终态的执行。相同 Thread 可以顺序或按明确分支创建多个 Run；系统要定义是否允许并发写同一 Thread。Checkpoint 属于 Run 的某个版本，不能只用“latest”作为不可变引用。

ID 使用不可猜测全局唯一值，但所有查询仍带 tenant 条件。外部 URL 中的 ID 不是授权凭据。存储主键、对象 key、Trace 和审计都使用相同逻辑身份，避免恢复时靠模糊文本匹配。

## Thread 与 Run

Thread 保存稳定元数据：所有者、标题、当前分支、策略、默认记忆作用域和最近活动时间。不要把完整消息数组每次整体覆盖；消息或事件单独追加，Thread 只引用 head version。

Run 保存输入引用、release bundle、状态、deadline、预算、当前 step、终态、错误和父 Run。状态通过 compare-and-set 或版本号更新，防止两个 Worker 覆盖。取消、审批和 lease 是持久状态，不依赖进程内变量。

## Checkpoint

Checkpoint 是可恢复边界的版本化快照：

~~~json
{
  "checkpointId": "chk_19",
  "runId": "run_7",
  "version": 19,
  "step": "after_tool_result",
  "stateRef": "obj://state/sha256/...",
  "eventSeq": 184,
  "releaseId": "rel_42",
  "pending": ["compose_answer"],
  "committedEffects": ["op_payment_8"],
  "createdAt": "..."
}
~~~

快照先写不可变对象并校验摘要，再以事务更新 checkpoint 索引和 Run head。若只先写 head，进程崩溃会指向不存在的对象。定期快照配合追加事件，避免每步复制巨大状态，也避免恢复时重放数百万事件。

## 追加事件

事件记录状态为什么改变：RunStarted、ModelCompleted、ToolRequested、ApprovalGranted、EffectCommitted、CheckpointCreated、Cancelled。每个 Run 使用递增 eventSeq 和唯一 eventId，至少一次写入按 eventId 去重。事件载荷版本化，旧读者对未知可选字段宽容。

事件日志适合审计与重建，但不是所有原始内容都要写入。Prompt、文件和大工具结果存加密对象，事件保存摘要、分类和引用。秘密永不进入通用事件。

## Artifact 与派生数据

Artifact 是文档、图片、代码、报告等可交付对象，记录 content hash、MIME、size、sourceRun、producerVersion、classification 和 retention。不可变版本便于审计；“当前文件”是指针。

区分 durable facts 与 reconstructible outputs。审批、外部确认和用户修改是事实；嵌入、缩略图、渲染和缓存通常可重建。灾备优先保护事实，派生物保留生成配方和来源版本。

## Long-term Memory

长期记忆跨 Run 使用，必须独立于事件历史。每条 memory 有 subject、scope、contentRef、sourceEvidence、confidence、createdBy、validFrom、expiresAt、status 和 version。写入经过权限、去重、冲突和隐私检查，不能把模型一句猜测直接提升为永久事实。

删除 Thread 时，长期记忆是否删除取决于来源和作用域；必须有引用和数据血缘。用户可查看、纠正和撤销可影响其行为的记忆。检索时按 tenant、主体、用途和当前授权过滤。

## Resume 与 Replay

Resume 从最新可信 checkpoint 继续未完成工作；Replay 用历史 checkpoint 创建新分支，重算后续步骤。[LangGraph Time Travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)说明，从 checkpoint 重放时，checkpoint 之前的步骤可视为已记录，之后的模型和工具会重新执行。具体行为属于框架，但提醒了关键风险：重放可能再次产生非确定输出和副作用。

所有外部副作用通过 idempotency ledger。Checkpoint 保存 operationId 与结果引用；恢复时先查询 committed、not_started 或 unknown。已提交读取旧结果，not_started 才执行，unknown 对账。重放分支默认使用模拟工具或新业务意图，不能借历史 UI 按钮再次扣款。

## 一致性与并发

Run 更新使用 expectedVersion；Worker 同时带 lease fencing token。Thread head 的分支合并需要领域规则，不能 last-write-wins 覆盖审批或用户消息。对象写、事件写和索引更新之间使用事务、outbox 或可恢复两阶段协议。

读模型可以最终一致，用事件异步构建搜索和大盘；执行恢复读取权威 Run、checkpoint 和账本。缓存命中不能绕过 tenant 与授权。

## Trace 关联

[W3C Trace Context](https://www.w3.org/TR/trace-context/)提供跨服务的 traceparent 和 tracestate。Run 可以跨多个 Trace，恢复后通常创建新 Trace；因此状态存储保存 runId 与当前/历史 traceId 关联。Trace context 不是状态存储，不能指望采样或过期的 Trace 恢复业务。

日志和 Span 记录 tenant、thread、run、checkpointVersion、eventSeq 和 releaseId 的低敏引用，便于从告警找到状态。不要把 Prompt 或 memory 内容塞进 tracestate。

## 保留、加密与删除

按类型制定保留：运行事件与审计可能较长，调试内容较短，临时 Artifact 更短，长期记忆有业务目的与过期。加密密钥按租户或数据分类隔离，密钥版本进入对象元数据。备份、索引和导出都必须执行删除策略。

Legal hold 与普通保留分开；删除操作生成审计，但审计不保存被删敏感原文。压缩事件前生成可验证快照与摘要，确保恢复和调查仍可解释。

## 验证

测试并发 Worker、旧 fencing token、对象写后索引前崩溃、重复事件、checkpoint 损坏、恢复跨版本、Replay 副作用、Thread 删除与 memory 血缘、密钥轮换和备份恢复。断言状态版本单调，旧 owner 不能写，外部效果不重复，跨租户查询为空。

## 小结

Agent 状态存储通过明确边界获得可恢复性：Thread 组织上下文，Run 表示一次执行，Checkpoint 保存恢复快照，Event 解释变化，Artifact 承载产物，Long-term Memory 独立治理。再用版本、fencing、幂等账本、保留和加密把它们连接起来，系统才可以安全暂停、恢复、重放和删除。

## 参考资料

- [LangGraph：Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph：Use time travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)
- [W3C：Trace Context](https://www.w3.org/TR/trace-context/)
