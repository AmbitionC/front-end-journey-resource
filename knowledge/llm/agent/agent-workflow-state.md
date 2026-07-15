长任务会跨越模型轮次、进程重启、人工审批和外部副作用。只把“当前步骤”放在内存里，崩溃后只能从头再来；只在副作用前 checkpoint，又可能重放付款或发信。可靠工作流要区分事件、派生状态与外部事实，用意图日志和幂等键在副作用两侧建立恢复边界。

## State 与 Event 分开

Event 是不可变发生记录，State 是事件归约后的当前视图：

```ts
type WorkflowEvent = {
  runId: string;
  stepId: string;
  seq: number;
  type: string;
  payloadRef: string;
  occurredAt: string;
  schemaVersion: number;
};
```

状态可以重建，事件不可静默改写。runId 标识一次工作流，stepId 标识逻辑步骤，attemptId 区分重试。对话消息只是状态的一部分，不应承担所有业务进度。

[Temporal Workflow Execution](https://docs.temporal.io/workflow-execution)将工作流描述为持久、可靠的函数执行；失败后通过 Event History replay 从最近记录位置恢复。这揭示核心：恢复依赖确定事件，而不是恢复某个进程内存快照。

![事件日志驱动步骤状态，副作用步骤按写意图、幂等键、执行、提交结果和检查点推进，崩溃后查询既有结果再恢复](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-workflow-state-checkpoint-v1.webp)
*图：副作用之后存在 COMMIT RESULT 与 CHECKPOINT；Replay 不应重复外部效果。*

## Checkpoint 保存可继续的边界

Checkpoint 包含当前 state、下一节点、已完成 task、等待条件、版本和关联 event seq。不要保存不可序列化连接、临时文件描述符或未提交数据库事务。

当前 [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)用 checkpointer 在 graph super-step 保存 state，并按 thread 组织 checkpoint，支持 memory、time travel、human-in-the-loop 与 fault tolerance。具体 saver 与 API 属于当前实现；通用要求是持久化后能用稳定 thread/run ID 恢复。

## 副作用的安全序列

```text
write intent → derive idempotency key → execute effect
             → commit result → checkpoint next state
```

Intent 记录操作、参数 hash、授权与目标；幂等键例如 `runId:stepId:logicalOperation`。外部系统支持 key 时直接使用；不支持时建立本地 operation table 与唯一约束。

崩溃可能发生在效果成功但结果未提交之间。恢复先用 idempotency key 查询外部或 operation table：已存在则复用结果，确定未执行才重试，状态未知则进入人工/补偿流程。

[Temporal Python error handling](https://docs.temporal.io/develop/python/best-practices/error-handling)说明 Activity 采用 at-least-once 执行，建议保持幂等，并用 workflow run ID 与 activity ID 组成幂等键。这比声称“exactly once”更诚实：系统通过可重试执行与幂等副作用获得等效结果。

## Lease 防止并发恢复

两个 worker 同时恢复同一 run 会重复推进。获取带过期时间的 lease，包含 owner 与 fencing token；每次提交验证 token。过期 worker 即使重新上线也不能覆盖新 owner 的结果。

长步骤发送 heartbeat 延长 lease，但 heartbeat 不等于业务完成。外部调用使用独立 timeout；worker 丢失后按幂等序列恢复。

## Resume、Retry 与 Replay

- Retry：重新执行某个失败操作；
- Resume：从持久状态继续未完成流程；
- Replay：按历史事件重建决策/状态，通常不重复真实副作用。

工作流代码必须对 replay 确定：时间、随机数、网络响应和模型输出作为事件记录，replay 读取旧结果；不能重新调用模型得到不同计划。新运行可选择重新评估，但那是 fork，不是复现。

## Compensation 不是回滚时间

外部世界没有通用事务。已发邮件不能“未发送”，付款可能只能退款。每个副作用定义 compensating action、可逆窗口、审批和失败处理。Saga 按相反顺序补偿已提交步骤，但补偿也可能失败，也要幂等与可观测。

不可逆动作在执行前审批和预览；取消工作流只停止未来步骤，不自动撤销已完成效果。

## Schema Migration 与代码升级

长期 run 可能跨版本。事件与 checkpoint 标 schemaVersion；读取时做显式 upcaster，保留旧字段语义。工作流图变化要兼容历史节点：完成步骤不重跑，新必需步骤如何插入由迁移策略决定。

上线前用历史 Event History replay 新代码，检测非确定变更。无法迁移的 run 保持旧 worker 或进入受控人工流程，不能丢弃状态。

## 人工审批与等待

等待审批是持久状态：记录请求、审批范围、过期、允许角色与当前数据版本。恢复后不会重复发送审批；输入带审批 ID 和版本，防止用户批准的是旧计划、执行的是新参数。

等待期间 ACL 或资源状态可能改变，执行前重新授权。审批允许动作，不冻结外部世界。

## 观测与测试

Trace 保存 run/step/attempt、checkpoint seq、lease、intent、effect ID、result 与补偿。指标：运行/等待/失败、checkpoint lag、恢复次数、重复被幂等拦截、未知副作用、lease 冲突和迁移失败。

故障注入覆盖副作用前、成功后提交前、提交后 checkpoint 前、worker 丢失、重复事件、乱序输入和补偿失败。断言最终效果最多一个、状态可恢复、trace 可解释。

## 小结

Agent 工作流可靠性来自事件驱动状态和副作用协议：run/step ID 标识进度，checkpoint 保存可继续边界，write intent 与幂等键包围外部操作，commit result 后再推进。Lease、补偿、schema migration 和 replay 让任务跨崩溃与升级继续，而不把重试误当 exactly-once。

## 参考资料

- [Temporal — Workflow Execution](https://docs.temporal.io/workflow-execution)
- [Temporal — Python error handling](https://docs.temporal.io/develop/python/best-practices/error-handling)
- [LangGraph — Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
