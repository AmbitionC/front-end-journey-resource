公司：小红书；方向：AI Agent 算法；来源自述为一面，未明确面试日期与部门。本文选录多轮研究停止、多 Agent 状态协作和租户概念三组问题。以下判定策略、状态模型与例子均为编辑教学补充。

<details data-knowledge-key="agent-run-loop">
<summary>（1）Deep Research 多轮检索应怎样判断停止，阈值怎样设？</summary>
</details>

把“证据足够可以完成”和“应停止继续消耗资源”分别判断：前者核对问题覆盖、关键声明支持与未决冲突，后者看连续无新证据、重复动作和时间、费用、轮次预算。达到预算只能说明需要停止或交付带缺口的结果，不能伪装为研究已经完成；具体阈值要用目标任务与人工判断校准。

原记录没有保留所说三类判断的具体内容，下面是一种教学设计。每轮保存尚未回答的子问题、已接受证据与来源版本、未决冲突、最近动作和剩余预算。新检索只有带来新证据或解决未决项才算进展，换个问法重复得到同一批页面不自动算进展。

例如已经能支持报告的大部分结论，但一个关键数字仍来自过期资料，不能仅因检索轮数足够就完成。可在剩余预算内改查权威数据，或明确交付“这一项未确认”的部分结果。相反，分页检索的 cursor 在推进时，即使工具名相同，也不应误判为死循环。

[OpenAI 的运行循环说明](https://developers.openai.com/api/docs/guides/agents/running-agents)区分最终输出、继续工具调用、转交和暂停；应用仍需定义自己的证据验收条件。无进展阈值、引用覆盖目标与预算应在标注任务上比较成功率、漏项、延迟与成本，不存在所有研究任务通用的“查三轮就够”。

延伸阅读：[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)。

<details data-knowledge-key="agent-multi-agent-messaging">
<summary>（2）多 Agent 怎样共享上下文并同步状态？</summary>
</details>

共享目标、约束、已确认事实、任务状态和证据引用，为每项数据规定写入者与版本；各 Agent 的临时工作上下文按需独立。消息带任务、调用和关联身份，接收与业务完成分开，重复或迟到结果经幂等、版本和状态校验后再合并。把聊天记录都放进一个共享数组，并不能自动解决并发和恢复。

教学设计中，协调器把“比较两家产品”的子任务分给两个 worker，保存 task_id、输入版本、状态和证据引用；结果先作为候选回传。协调器核对是否对应当前任务版本，再写权威状态。进度消息可以重复到达，旧 worker 的迟到结果不能把新任务覆盖回旧状态。

[LangGraph 状态文档](https://docs.langchain.com/oss/python/langgraph/graph-api)用字段更新与 reducer 说明替换和合并的区别；追加列表不是所有业务字段都适用的合并规则。[RabbitMQ 的确认语义](https://www.rabbitmq.com/docs/confirms)也区分消息投递确认与消费端确认，它们不能单独证明业务子任务已完成。

一种实现是权威数据库保存任务状态和版本，队列承载命令/事件，较大的文档留在受控存储并通过引用共享；也可以采用其他满足同一合同的存储组合。权限范围、租户、证据时效与恢复位置要随任务保存。原帖没有数据库或消息协议，不能把这套教学组合说成作者的架构。

延伸阅读：[多智能体消息、协议与状态同步](../../../knowledge/llm/agent/agent-multi-agent-messaging.md)。

<details data-knowledge-key="agent-permission-model">
<summary>（3）Agent 系统中的租户与应用概念怎样区分？</summary>
</details>

租户通常表达一组数据、管理和策略的逻辑范围，应用表达面向某类用途的功能与配置；两者不必一一对应，一个共享应用也可以服务多个租户。tenant_id 和 app_id 只是标识，真正隔离还要由服务端把身份、资源、操作和用途规则落实到每次读取与动作，不能靠提示词声明。

例如同一个客服应用服务两家企业：界面和代码可以共享，但知识库、记忆、缓存、任务结果与工具凭据要按允许范围访问。另一个应用即使属于同一租户，也不自动获得全部数据；可以按角色、资源关系或属性进一步缩小授权。命名空间减少误混，不等于已经完成权限校验。

服务端从可信登录态和应用配置取得主体、租户与用途，检索前限制候选范围，读取具体对象和调用工具时再次授权，缓存键与后台任务也携带相同范围。不要让模型通过生成另一个 tenant_id 扩大权限。[OpenAI 的护栏与工具审核说明](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)强调把检查放在产生副作用的边界，代理级入口检查不能代替每个工具的执行控制。

限流与降级解决容量和公平性，可以按租户或应用分配预算，但它们不是授权机制。租户是否对应公司、团队或项目，哪些资源允许共享，都应由实际产品合同定义；原帖只问概念，没有提供这些设置。

延伸阅读：[最小权限、授权与工具调用确认](../../../knowledge/llm/production/agent-permission-model.md)。

## 参考资料

- [OpenAI：Agent 运行循环](https://developers.openai.com/api/docs/guides/agents/running-agents)。
- [LangGraph：状态更新与 reducer](https://docs.langchain.com/oss/python/langgraph/graph-api)。
- [RabbitMQ：确认、可靠性与预取](https://www.rabbitmq.com/docs/confirms)。
- [OpenAI：Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)。
