Supervisor 是持续维护任务状态、选择专家、验证结果并决定何时停止的中心控制器。它不同于一次性 router：router 通常只做分类和转发，Supervisor 会跨多个回合观察进度、处理失败和合并证据。

## 控制环的最小状态

监督者至少维护目标、计划版本、任务账本、证据、预算和停止条件：

```ts
type SupervisorState = {
  goal: string;
  planVersion: number;
  tasks: Record<string, TaskState>;
  evidence: EvidenceRef[];
  remaining: { turns: number; cost: number; timeMs: number };
  approvals: ApprovalRef[];
  outcome?: 'complete' | 'blocked' | 'abstained';
};
```

每轮只做有限动作：读取当前状态，选择一个或一组 ready task，构造窄合同，调用专家，校验结果，写入账本，再判断完成、重规划或升级。专家的自由文本不能直接覆盖全局状态。

[LangChain 的 Subagents 文档](https://docs.langchain.com/oss/python/langchain/multi-agent/subagents)明确区分 Supervisor 与 router：前者保持会话上下文并动态决定跨回合调用，后者通常是单步分类。把动态监督写成一串 if/else 路由，往往缺少失败恢复与终止语义。

![Supervisor 根据目标和状态选择专门 Agent，收回结果与证据后验证，并在轮次和重试上限内完成、重规划或升级](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-supervisor-control-loop-v1.webp)
*图：所有路径回到 Verify；Turn Limit 与 Retry Limit 使监督循环有界。*

## 专家目录与路由

专家目录不是一组营销描述，而是可执行能力清单：支持的任务类型、输入 schema、输出 schema、允许工具、权限等级、延迟/成本估计和已知限制。描述重叠会让监督者在相似专家间摆动；边界过窄又会产生大量协调开销。

[OpenAI 的多 Agent orchestration 指南](https://developers.openai.com/api/docs/guides/agents/orchestration)建议保持专家范围清晰，并区分 handoff 与 manager-as-tools。Supervisor 模式通常采用后者：中心管理者保留最终输出所有权，专家只返回结果。

路由决策应可审计，例如记录：任务需要哪些能力、哪些候选满足、为何选择当前专家、是否存在权限或预算限制。模型置信度不是授权依据；选中专家后仍由策略层发放实际能力。

## 监督者不应成为万能 Agent

Supervisor 的系统提示不需要包含所有领域知识。它擅长目标保持、任务分解、路由、冲突处理和交付；领域推理下沉给专家。否则中心上下文越来越大，专家只是形式上的工具，系统又退化为单 Agent。

另一方面，不要把每个微小步骤都拆成专家。单个工具即可完成且容易验证的动作，直接调用更简单。只有当任务需要独立上下文、不同工具/权限、并行或专业验收时，Subagent 才值得引入。

## 结果验证与冲突仲裁

Supervisor 收到结果后依次检查合同版本、schema、证据、artifact hash、权限和副作用。多个专家结论冲突时，不按“谁说得更肯定”决定。先比较来源质量、时间边界与假设；必要时派出独立 verifier，或把冲突和选项提交用户。

结果合并使用 reducer 而不是文本拼接：去重相同事实，保留不同观点的来源，把缺口映射回任务账本。监督者应能回答“最终每条结论来自哪个专家、哪个工具和哪份证据”。

## 有界重试与重规划

失败先分类。瞬态网络错误可在当前任务内按预算重试；参数错误应修正合同；权限拒绝需要升级或终止；能力不匹配可以换专家；目标本身不清楚则请求用户决定。

设置总 turn limit、单专家 retry limit、最大连续无进展轮次、总成本和 deadline。以下信号触发 loop guard：连续选择同一专家并得到同一错误；结果未增加证据；任务状态来回切换；计划 diff 没有实质变化。触发后进入 blocked/abstained，并总结尝试和最小解阻条件。

## 共享状态和并发

并行专家读取同一不可变快照，输出通过单一 commit 阶段写回。不要让多个专家直接修改全局 `messages` 或计划对象。每个结果带 `basePlanVersion`；若返回时版本已更新，Supervisor 重新校验是否仍可应用。

涉及外部副作用时，中心账本记录幂等键、执行状态与补偿信息。监督者的超时只表示没有及时收到结果，不表示远端写入没有发生。

## 可观测性与评估

Trace 以一次目标为根，包含每轮状态摘要、路由候选、选中理由、合同 ID、专家 span、工具 span、验证结论和计划 diff。[OpenTelemetry 的 trace 概念](https://opentelemetry.io/docs/concepts/signals/traces/)提供 parent/child span、属性和事件等通用关联模型；不要把完整敏感上下文直接塞进属性。

评估覆盖：路由准确率、无谓专家调用、任务完成率、冲突发现率、证据覆盖、越权为零、重试有效性、无进展终止、延迟与成本。还要对比单 Agent 基线；多 Agent 只有在质量、隔离或并行收益抵消协调成本时才合理。

## 常见错误

- 监督者接受专家的 `completed` 字符串，不检查 done-when；
- 允许专家直接向用户输出，中心又宣称拥有统一责任；
- 所有专家共享完整历史和全部工具；
- 路由失败就无限换专家，没有预算与停机条件；
- 只追踪模型调用，不记录合同、状态提交和外部副作用；
- 用中心化掩盖组织不清，Supervisor 成为延迟和单点故障。

## 小结

Supervisor 是有界、可审计的控制环：维护一份权威状态，通过能力目录选择窄专家，以合同调用，以证据验证，以版本化 reducer 合并，并在明确预算内完成、重规划或升级。中心化的价值是责任一致，而不是让一个模型无限自治。

## 参考资料

- [LangChain — Subagents](https://docs.langchain.com/oss/python/langchain/multi-agent/subagents)
- [OpenAI — Orchestrating multiple agents](https://developers.openai.com/api/docs/guides/agents/orchestration)
- [OpenTelemetry — Traces](https://opentelemetry.io/docs/concepts/signals/traces/)
