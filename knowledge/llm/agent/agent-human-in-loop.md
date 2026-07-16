Human-in-the-loop（HITL）不是在界面上放一个“确认”按钮，而是把一次高风险 Agent 行动改造成可暂停、可审计、可过期、可安全恢复的协议。真正需要人工确认的对象不是一句模糊意图，而是某个主体在特定上下文中准备执行的具体工具、参数、资源范围与有效期限。

## 先判断什么必须由人决定

人工门禁适合不可逆、影响外部世界或责任边界明确的动作，例如付款、删除、向外发送内容、修改生产系统、访问敏感数据和越权例外。低风险只读查询若全部等待人工，会产生审批疲劳；高风险动作若只靠模型自评，又把控制权交给了待约束对象。

可以把策略写成确定性函数：依据主体、租户、工具、参数、数据分级、金额、环境与风险等级，返回 `allow`、`deny` 或 `require_approval`。模型可以提供说明，但不能自行降低风险等级。NIST 的[生成式 AI 风险管理框架](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)把人工监督放在更完整的治理、测量和管理活动中；这意味着 HITL 是控制的一环，而不是授权、测试和监控的替代品。

## 冻结可审批的行动快照

进入等待前，应生成不可变的 approval snapshot，至少包含：

```ts
type ApprovalSnapshot = {
  runId: string;
  callId: string;
  principalId: string;
  toolName: string;
  toolVersion: string;
  argumentsHash: string;
  resourceScope: string[];
  policyVersion: string;
  createdAt: string;
  expiresAt: string;
};
```

审批页面展示经脱敏的实际参数、预计副作用、目标资源、理由与过期时间。批准必须绑定 `callId + argumentsHash + scope`，不能只绑定“这个工具以后都允许”。如果等待期间模型改了金额、目标或正文，旧批准应失效并重新提交。

[OpenAI Agents SDK 的 HITL 流程](https://openai.github.io/openai-agents-python/human_in_the_loop/)支持在敏感工具调用处暂停，序列化运行状态，为具体调用记录批准或拒绝，再恢复原运行。这是当前 SDK 的一种实现；无论框架如何，核心契约都应是“恢复被冻结的那次调用”，而不是重新让模型猜一次。

![人工审批门禁将风险动作冻结为包含工具、参数、范围和期限的快照，并分流为批准、拒绝、过期或人工接管](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-human-in-loop-approval-gate-v1.webp)
*图：批准后仍需重新校验；拒绝直接停止，过期需要续签，接管则把后续控制权交给人工。*

## 暂停与恢复必须可持久化

审批可能跨越分钟甚至数天，不能依赖单进程内存。暂停点要持久化运行状态、待审批调用、对话与工具版本、策略决策、幂等键和 trace ID。恢复操作应以事务方式把状态从 `WAITING_APPROVAL` 改为单一后继状态，避免审批消息重复投递导致执行两次。

[LangGraph Functional API](https://docs.langchain.com/oss/python/langgraph/functional-api)展示了通过持久化与 interrupt/resume 组织长运行任务的方式。工程上仍要自行规定状态版本、并发控制和副作用边界：checkpoint 保存成功，不表示外部动作已安全；恢复两次，也不能产生两次付款。

审批决定可设计为：

- `approve`：仅授权快照中的一次调用；
- `reject`：写入理由并进入终止或重新规划；
- `expire`：超过期限自动失效，不静默继续；
- `takeover`：暂停 Agent，由人工拥有后续操作；
- `request_changes`：返回结构化修改意见，产生新的快照。

## 批准之后还要重新校验

等待期间外部状态会变化：库存已被占用、工单已关闭、用户角色被撤销、策略已升级，甚至工具实现已换版本。因此执行前至少重验主体会话、资源归属、策略版本、参数哈希、有效期和业务前置条件。批准表达的是“人在当时同意这个提案”，不是永久能力令牌。

对高风险写操作，执行服务还应执行自己的授权与幂等校验。即便审批 UI 被绕过，工具层也不能仅凭 `approved: true` 放行。审批证据最好签名或由受信任服务保存，模型不能构造或改写。

## 人工接管与所有权转移

接管不是“人发一条新提示”，而是状态所有权发生变化。系统应停止自动工具调用，标记 `owner=human`，冻结剩余预算，记录接管人和时间。人工完成处理后，可选择结束任务，或用新的明确上下文将控制权交回 Agent。

多人审批还要定义 quorum、角色分离和冲突规则。例如制单人与复核人不能相同；拒绝是否拥有否决权；第一个批准到达后是否仍等待第二人。不要依靠消息到达顺序隐含这些规则。

## 失败模式与防护

- **批准漂移**：批准 A 参数却执行 B 参数。用参数哈希、工具版本与资源范围绑定。
- **永久批准**：一次同意扩展成长期能力。默认单次、短期、最小范围。
- **重复恢复**：审批回调重试导致重复副作用。使用状态版本和幂等键。
- **过期后静默执行**：恢复时没有检查期限。把 expiry 设为强制 guard。
- **审批疲劳**：请求过多且信息不清。基于风险分层，给出差异与后果摘要。
- **假接管**：UI 显示人工处理，后台 Agent 仍在运行。所有权必须由服务端状态控制。

## 测试与可观测性

单元测试覆盖 allow/deny/approval 策略、快照哈希、过期与状态迁移。并发测试模拟重复批准、批准与拒绝同时到达、恢复进程崩溃和工具成功后回执丢失。安全测试验证模型伪造批准字段、跨租户审批和旧策略重放都会被拒绝。

日志记录 run/call/approval ID、决策者、策略版本、快照哈希、决定、等待时长、恢复次数和最终副作用 ID，但不记录敏感原文。指标包括审批触发率、批准/拒绝/过期/接管比例、p95 等待时间、重复回调、批准后重验失败和人工纠正率。

## 小结

可靠的 HITL 门禁把高风险行动冻结成可验证快照，以持久化状态等待明确决定，并在批准后重新检查授权与现实状态。拒绝、过期和接管都是一等终态。这样人工监督才真正收回控制权，而不是给自动执行流程增加一个装饰按钮。

## 参考资料

- [OpenAI Agents SDK — Human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/)
- [LangGraph — Functional API](https://docs.langchain.com/oss/python/langgraph/functional-api)
- [NIST AI 600-1 — Artificial Intelligence Risk Management Framework: Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
