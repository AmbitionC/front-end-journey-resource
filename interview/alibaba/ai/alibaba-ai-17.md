### 阿里 Token Foundry AI 应用研发一面：Critic、上下文与幂等

公司：阿里；方向：Token Foundry AI 应用研发；轮次：一面。原文只记面试月日“8.17”，未给年份，不据发帖日补写。

根据候选人公开自述选录技术问题，经历未获外部认证。原帖未提供完整现场答案；下方短答与例子均为编辑补充，不代表作者实际作答、项目实现或企业标准答案。本文选录4组问题。

<details data-knowledge-key="agent-paradigms">
<summary>（1）Critic 在工作流中主要解决什么问题？</summary>
</details>

Critic 根据任务目标、原始证据和验收标准检查候选结果，指出遗漏、矛盾或约束违反，再把可操作反馈交给执行环节修订。可确定的字段、权限与业务规则仍由程序校验；评审模型说“通过”不能独自证明结果正确，修订也要受次数、时间和成本预算限制。 参见[Evaluator-optimizer 说明](https://www.anthropic.com/research/building-effective-agents#workflow-evaluator-optimizer)。

教学例子：资料问答生成一份摘要，Critic 发现“材料齐全”的结论缺少两项材料记录，就要求补查或保留未知；它不能凭另一段模型文字把材料变成已存在。

知识阅读：[Reflection、Plan-and-Execute 与 Tool-Use](../../../knowledge/llm/agent/agent-paradigms.md)。

<details data-knowledge-key="context-engineering">
<summary>（2）第一次与后续一次 Agent 调用分别需要哪些上下文？</summary>
</details>

首次调用需要目标、允许动作、输出约束、当前已知事实和必要的业务资料；后续调用还要加入本轮对应的问题、用户新回复、已验证工具结果、当前任务阶段及未决事项。按本轮任务选取信息，保留来源与状态版本，避免每次复制全部历史。

教学例子：首轮询问一项材料是否上传，用户随后回答“已上传”。下一轮必须知道它回答的是哪项材料、属于哪个任务，并核对可取得的上传记录，不能把这三个字解释成所有资料都已齐全。

知识阅读：[上下文工程（Context Engineering）](../../../knowledge/llm/agent/context-engineering.md)。

<details data-knowledge-key="agent-event-driven">
<summary>（3）客户回复后，怎样确认它对应正确的问题和信审任务？</summary>
</details>

发问时保存任务标识、问题标识、接收对象和状态版本，回复通过受控入口携带关联标识。服务端检查身份及访问范围、问题是否属于该任务、当前是否仍待回答，再原子记录回复并推进状态。重复、过期或关联不明的回复进入去重、过期或澄清分支；关联标识本身不能替代授权。

教学例子：同一客户同时处理两个任务，各有一道“是否补齐材料”的问题。“是”必须关联具体问题；若旧问题已取消，迟到回复不能推进新任务。

知识阅读：[事件驱动 Agent 与异步编排](../../../knowledge/llm/agent/agent-event-driven.md)。

<details data-knowledge-key="agent-idempotency">
<summary>（4）这个业务的幂等键应该怎样设计？</summary>
</details>

先定义什么算同一次业务动作，再让幂等键在租户、任务与操作范围内稳定标识该意图。重试沿用原键，并绑定规范化参数指纹；用唯一约束或原子占位记录进行中、成功及结果。同键不同参数应拒绝或要求新意图，涉及外部动作还要传递幂等标识、查询结果并处理未知状态。

教学例子：同一待补材料提醒因网络重试两次，应复用同一个提醒操作ID并返回既有状态；不能每次用当前时间生成新键，也不能仅靠一次“先查再写”抵御并发。

知识阅读：[幂等性、重复执行与副作用控制](../../../knowledge/llm/production/agent-idempotency.md)。
