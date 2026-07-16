Subagent 是由主 Agent 通过明确合同调用的专门执行单元。它不是“再开一个聊天窗口”，也不是天然更聪明；价值来自职责收窄、上下文隔离、工具最小化和可独立验证。没有合同的子智能体只会把同一份模糊目标复制到更多模型实例里。

## 先定义调用合同

一个可用合同至少包含目标、输入、允许工具、不可变约束、预算、完成条件和结果 schema：

```ts
type SubagentContract<I, O> = {
  contractVersion: string;
  goal: string;
  input: I;
  allowedTools: string[];
  constraints: string[];
  budget: { turns: number; milliseconds: number; cost?: number };
  doneWhen: string[];
  outputSchema: Schema<O>;
};
```

合同由主 Agent 生成，但必须继承用户目标、组织策略和授权边界。主 Agent 不能把自己无权执行的操作委派给子 Agent；子 Agent 也不能通过再次委派扩大权限。

[OpenAI 的 Agent orchestration 文档](https://developers.openai.com/api/docs/guides/agents/orchestration)区分 handoff 与 agents-as-tools：前者转移当前会话所有权，后者由管理者调用专家并继续负责最终回答。本篇讨论的是后者；若专家直接接管用户交互，责任、状态和退出协议都不同。

![主 Agent 以目标、输入、工具、限制和完成条件合同调用隔离的 Subagent，Subagent 观察、工作、验证后返回带证据、状态和风险的结果](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-subagents-contract-lifecycle-v1.webp)
*图：Subagent 返回结果，不获得直接的用户所有权；主 Agent 仍负责合并和交付。*

## 上下文隔离不是上下文缺失

[LangChain 的 Subagents 文档](https://docs.langchain.com/oss/python/langchain/multi-agent/subagents)把上下文隔离列为核心特征：专家通常从干净上下文开始，避免主会话持续膨胀。但“只传一句任务”也会丢失关键事实。

应按最小充分原则构造 context envelope：

- 当前目标与验收标准，而不是整个聊天记录；
- 已确认事实及其来源，不把推测伪装成事实；
- 与该子任务直接相关的文件、状态快照和计划版本；
- 已尝试路径、失败原因和禁止重复的动作；
- 权限、审批、时间与成本上限。

输入使用快照或内容 hash，防止子 Agent 工作期间底层资源变化。若任务需要最新状态，合同应要求执行前重新读取，而不是依赖主 Agent 复制的陈旧摘要。

## 状态与命名空间

默认把子 Agent 视为单次、无状态调用：输入决定输出，结束后只保留结果和 trace。确实需要跨调用记忆时，必须使用独立命名空间和显式生命周期，避免两个专家因调用顺序变化而读到对方状态。

[LangGraph 的 Subgraphs 文档](https://docs.langchain.com/oss/python/langgraph/use-subgraphs)说明子图可以作为多智能体和团队分工的模块，并强调稳定命名空间与接口 schema。工程上还应把 `agentId`、`contractId`、`attempt`、`threadId` 分开：同一合同的重试不应意外创建新长期身份。

## 结果必须可合并

自由文本很难判断是否完成。结果 envelope 可以这样设计：

```json
{
  "contractId": "research-42",
  "status": "completed",
  "claims": [{ "text": "...", "evidence": ["url-or-artifact"] }],
  "artifacts": [{ "path": "...", "sha256": "..." }],
  "assumptions": [],
  "risks": [],
  "remaining": []
}
```

`completed` 只有在 done-when 全部满足时使用。遇到缺权限、需要用户决定或证据不足，返回 `blocked`，并给出最小阻塞条件；不要把半成品包装成成功。主 Agent 重新校验 schema、来源和副作用，再决定接受、重试或派给另一个专家。

## 同步、异步与取消

主流程下一步依赖专家结果时使用同步调用；独立耗时工作可后台运行，但需要 job ID、查询状态、获取结果和通知四个接口。异步并不等于丢下任务不管：主 Agent 必须知道它何时完成、如何取消，以及用户目标变化后旧结果是否仍有效。

多个独立 Subagent 可以并行，但合同不能重叠写同一资源。需要共享状态时，指定单一 owner 或通过事件/合并器协调；不要让专家直接互改对方记忆。

## 权限和工具配置

每个专家只得到完成其职责所需的工具。例如研究专家有只读网页与资料库，发布专家有受审批的写入接口。不要因为主 Agent 拥有十个工具就把十个都传下去。工具描述要说明输入、输出、风险、副作用、幂等性和错误分类，避免专家靠名字猜用途。

高风险动作仍在执行边界重新授权。主 Agent 的“请发布”不是系统批准；审批应绑定实际目标、参数 hash、合同版本和过期时间。

## 常见失效

- **职责重叠**：两个专家都认为自己负责最终输出，产生冲突版本；
- **上下文洪水**：把完整会话传给每个专家，成本上升且隔离失效；
- **摘要污染**：主 Agent 的错误摘要成为所有子 Agent 的共同前提；
- **无限递归**：子 Agent 再创建子 Agent，没有深度和预算限制；
- **结果不可验证**：只返回“已完成”，没有证据或 artifact hash；
- **状态串线**：复用同一 thread/namespace，跨用户或跨专家泄漏记忆。

## 测试与观测

合同测试验证输入缺字段、超预算、工具拒绝、专家超时、结果 schema 错误和证据不足。隔离测试使用诱饵信息确认专家看不到未授权上下文；并发测试确认不同命名空间不串线；安全测试确认主 Agent 与 Subagent 都不能越权。

Trace 记录合同版本、输入摘要/hash、授予工具、预算、每次调用、结果状态、验证失败和主 Agent 的接受理由。评估不仅看最终成功率，还看是否不必要地调用专家、上下文压缩率、重复工作、合并冲突、人工介入与单位成功成本。

## 小结

Subagent 设计的重点是边界，而不是数量：以窄合同传入最小充分上下文，以独立命名空间执行，以最小工具授权，以结构化证据返回。主 Agent 始终承担验证、合并和用户交付责任，才不会把复杂度藏进更多模型调用。

## 参考资料

- [OpenAI — Orchestrating multiple agents](https://developers.openai.com/api/docs/guides/agents/orchestration)
- [LangChain — Subagents](https://docs.langchain.com/oss/python/langchain/multi-agent/subagents)
- [LangGraph — Subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs)
