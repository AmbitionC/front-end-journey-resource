多 Agent 协作有三种经常混淆的控制模式：Router 选择一次处理者，Agent-as-Tool 让 manager 调用专家但保留控制，Handoff 则把后续用户交互所有权转给专家。选错模式会让最终责任、上下文、权限与错误回传都变得模糊。

## Router：选择路径，不一定转移对话

Router 根据意图和能力选择 specialist。若 Router 外还有 orchestrator 收集结果并生成最终回复，控制仍在 orchestrator；若路由后用户直接进入 specialist，会话所有权实际发生转移，应该按 handoff 管理。

路由决策保存候选、选择理由、置信度和 fallback。授权先确定可用 agents/tools，路由器不能选择未授权 specialist。

## Agent-as-Tool：Manager 保留控制

Manager 把一个有界子任务作为工具调用给 specialist：

```ts
type AgentToolCall = {
  taskId: string;
  goal: string;
  inputs: string[];
  expectedOutput: string;
  limits: { timeMs: number; toolScopes: string[] };
};
```

Specialist 返回结构化结果或错误，manager 决定下一步和最终答案。这适合翻译、数据分析、代码审查等明确子任务。

当前 [OpenAI Agents Tools 文档](https://openai.github.io/openai-agents-python/tools/)把 Agents as tools 描述为 manager 保持控制、调用 specialist；[Multi-agent 文档](https://openai.github.io/openai-agents-python/multi_agent/)也区分 manager 编排与 handoff 的去中心模式。具体 API 截至 2026-07-15 可作为实现例子，控制语义才是核心。

![Router、Agent-as-Tool 与 Handoff 三种模式对比上下文、控制权和最终责任，Handoff 经过权限检查后才转移用户可见所有权](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-handoff-responsibility-boundary-v1.webp)
*图：前两种模式的 Final Owner 仍是 Orchestrator；Handoff 另有 Return Control 与 Error 路径。*

## Handoff：显式转移所有权

Handoff 的语义是：当前 agent 选择目标 agent，并把会话控制转交，目标 agent 继续面向用户。当前 [OpenAI Agents Handoffs 文档](https://openai.github.io/openai-agents-python/handoffs/)支持配置 handoff 输入类型与 input filter；默认会话历史可传递，因此生产系统必须主动最小化。

适合目标 agent 需要连续追问、长期领域上下文或直接承担用户关系的场景，例如售后 agent 转给退款专家。一次性计算通常用 Agent-as-Tool 更清楚。

## Context Envelope：最小而充分

不要广播完整历史。Envelope 只包含：

```ts
type HandoffEnvelope = {
  goal: string;
  state: Record<string, unknown>;
  evidenceRefs: string[];
  limits: {
    allowedTools: string[];
    forbiddenActions: string[];
    expiresAt: string;
  };
  traceId: string;
};
```

删去无关对话、私密字段、其他任务工具结果和内部推理。Evidence 使用受控引用，目标 agent 按自身权限读取；不能因为来源 agent 看过就自动继承。

## Capability 与 Permission 分离

Capability 表示 specialist 会做什么，permission 表示当前主体允许它做什么。Handoff 前求交集：用户授权、来源 agent 可委派范围、目标 agent 工具 scope 和资源 ACL。

目标 agent 不继承更高权限；若目标需要新增外部写入，重新审批。Envelope 中的 `allowedTools` 是上限，工具服务仍独立授权。

## 控制返回与最终责任

协议明确：

- 谁当前 user-facing owner；
- specialist 完成后直接回答，还是 return control；
- 需要澄清由谁提问；
- 错误/超时回到谁；
- 用户取消影响哪些 run 和副作用。

Agent-as-Tool 的 specialist 不直接改变用户对话所有者；Handoff 后 UI/trace 应显示当前处理者。Return control 携带结果、未完成事项、错误和已发生副作用，orchestrator 不要假设“没返回就是没做”。

## 错误语义

目标不可用、拒绝接收、权限不足、上下文不完整、执行失败分开编码：

```text
NO_CAPABLE_AGENT
HANDOFF_DENIED
CONTEXT_INCOMPLETE
TARGET_UNAVAILABLE
TARGET_FAILED
```

可重试的 unavailable 使用有界 fallback；permission denied 不换另一个更宽权限 agent。Handoff 已发生副作用后失败，按 workflow compensation 处理，不能简单回滚对话状态。

## Trace 与审计

同一 trace 记录：source/target agent、模式、envelope hash、permission decision、control owner 时间线、工具调用、return/error 和用户可见消息。敏感 envelope 存在受控存储，普通 trace 只留引用。

指标：route/handoff 率、接受/拒绝、重复转交、ping-pong、return latency、权限失败、上下文缺失、任务成功和用户纠正。两个 agent 互相 handoff 要由 loop guard 终止。

## 评测三种模式

测试：

- Router 是否选到能力匹配且授权的目标；
- Agent-as-Tool 是否按输出契约返回，manager 是否正确整合；
- Handoff 后 owner 是否唯一、上下文是否最小充分；
- 权限不升级、隐藏字段不传播；
- target failure/timeout/return control 是否可恢复；
- ping-pong、取消和副作用状态是否正确。

用同一任务比较 manager 与 handoff：最终质量、工具调用、延迟、上下文 token、权限暴露和用户交互次数。不是 agent 越多越好，控制模式要匹配任务形态。

## 小结

Router 决定去哪，Agent-as-Tool 委派子任务但 manager 保持最终责任，Handoff 转移用户可见控制。三者都需要最小 Context Envelope、独立权限检查、明确 return/error 和统一 trace。把“谁能做、谁可做、谁负责回答”分别建模，协作才不会变成无边界广播。

## 参考资料

- [OpenAI Agents SDK — Tools](https://openai.github.io/openai-agents-python/tools/)
- [OpenAI Agents SDK — Multi-agent orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
- [OpenAI Agents SDK — Handoffs](https://openai.github.io/openai-agents-python/handoffs/)
