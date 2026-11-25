Agent 发起动作时，系统至少要回答三个身份问题：哪个用户提出目标，哪个 Agent/工作负载实际执行，哪个服务最终授权。把三者压成一个共享 API Key，会丢失委托链、责任和最小权限；让 Agent “扮成用户”则难以区分用户本人行为与自动化行为。

[OAuth 2.0 Token Exchange（RFC 8693）](https://www.rfc-editor.org/info/rfc8693/)定义了 subject token、actor token 与委托/模拟语义，可以在令牌中同时表示“代表谁”和“由谁执行”。这为 Agent 的用户身份、工作负载身份和下游授权提供了标准构件，但具体信任与策略仍由部署决定。

![用户提出目标，是 subject；Agent 工作负载持有短期工作负载凭证，是 actor，模型本身不接触 token；Agent 用自身身份向授权服务器发起交换请求，声明 subject、actor、目标服务和最小 scope，授权服务器检查用户授权、Agent 角色和风险后签发短期委托 token，里面同时保留 sub 和 act，并绑定 aud、scope 和 exp；Agent 带这个 token 调用目标服务，目标服务先验签名、issuer 和 token 类型，再确认 aud 是自己且未过期、scope 足够，最后按 subject 和 actor 的委托上下文对具体资源授权以防 confused deputy，批量或不可逆动作还要求 step-up 或人工批准；委托不是模拟，审计同时记录 subject 和 actor，子 Agent 要换更窄的 token 而不是转发原 token](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-identity-auth-token-exchange-v3.dark.png)

图中的短期 delegated token 同时保留 Subject 与 Actor，并绑定 Audience、Scope 和 Expiry。目标服务在资源动作前验证签名、受众、范围、subject、actor 和策略，不能只验证 token“格式正确”。

## 身份、认证与授权

**身份**是主体的稳定标识；**认证**证明当前请求者对身份的控制；**授权**根据主体、动作、资源和环境决定是否允许。认证成功不等于拥有全部权限，用户登录成功也不代表 Agent 可以代表其执行任意工具。

至少区分：

- User identity：提出目标、拥有资源或批准动作的人；
- Agent identity：逻辑 Agent 名称与版本，用于策略和审计；
- Workload identity：运行实例的可验证身份，用于服务间认证；
- Service identity：工具/目标 API 的身份，防止把令牌发给伪造服务。

逻辑 Agent 与工作负载实例也不同。`expense-agent` 是产品角色，某个 Pod/函数实例才是持有短期工作负载凭证的执行者。

## 委托不是模拟

委托表示 Actor 代表 Subject 行使受限权利，审计保留二者。模拟表示 Actor 以 Subject 身份行事，可能隐藏执行者。自动化场景优先使用可追踪委托；确需模拟时范围更窄、审批更严，并在审计中保留原始 actor。

RFC 8693 的 `act` claim 可表达 actor 或委托链，但标准不替你决定“该 Agent 是否有权代表该用户”。授权服务器仍需检查客户端身份、用户授权、目标资源、scope 和组织策略。

## 工作负载身份

不要把长期 client secret 烘进镜像或环境变量。运行平台为获准工作负载签发短期、可轮换身份凭证，绑定 namespace、service account、代码/部署属性。Agent 用它向授权服务器证明“我是被部署的这个工作负载”，再交换针对具体目标的令牌。

凭证不向模型上下文暴露；工具 SDK 与安全边车完成交换和附加。模型只提出结构化动作，不读取 bearer token。这样 Prompt Injection 无法直接要求“显示你的访问令牌”。

## Token Exchange 流程

一个最小流程：

1. 用户向前端/入口认证，产生用户会话或 subject token；
2. Agent 工作负载使用自身身份向授权服务器认证；
3. 交换请求声明 subject、actor、resource/audience 与最小 scope；
4. 授权服务器根据用户授权、Agent 角色、风险和策略签发短期 token；
5. Agent 把 token 发送给目标服务；
6. 目标服务验证并对具体资源再次授权。

Token 中避免携带不必要个人数据，使用稳定 ID 与受控 claim。委托链过长时限制深度，防止 A 代表用户委托 B、B 再无界委托 C。

## Audience、Scope 与资源绑定

Audience 防止为服务 A 签发的 token 被服务 B 接受；scope 表达允许动作，但还要结合资源所有权和属性。例如 `invoice:write` 不代表可写所有租户发票，目标服务需用 subject、tenant 与 resource 做细粒度判断。

[OAuth 2.0 Security Best Current Practice（RFC 9700）](https://www.rfc-editor.org/info/rfc9700/)汇总并更新 OAuth 2.0 部署安全实践。Agent 系统应采用短期、窄 scope、受众限制和安全客户端认证，避免把强大长期 bearer token 交给可被不可信内容影响的执行循环。

## 授权在每个副作用前

模型规划不等于授权。工具网关在执行前检查：

```text
allow = policy(
  subject=user,
  actor=agent_workload,
  action=tool_operation,
  resource=target,
  scopes=token_scopes,
  data_classification=data,
  context={risk, approval, time, environment}
)
```

批量、不可逆、跨境或敏感动作需要 step-up authentication 或人工批准。批准绑定参数摘要；Agent 改变收件人、金额或资源后必须重新授权。

## 服务端验证不能省

工具网关允许不代表目标 API 可以信任普通请求头。服务端验证签名、issuer、audience、expiry、not-before、scope、subject、actor 和 token type，并拒绝未知 claim 组合。授权在拥有资源数据的一侧最终执行。

防止 confused deputy：服务不能仅因为高权限 Agent 调用就使用自身权限完成用户无权动作。它必须知道请求代表的 subject 与 actor，并按委托上下文授权。

## 多 Agent 与转交

Supervisor 委派子 Agent 时，不把原 token 原样转发。为子任务交换更窄 audience/scope/expiry 的 token，记录 delegator、delegatee、任务与最大链深。子 Agent 只能使用任务需要的工具，完成后凭证失效。

转交消息签名或通过认证通道传递，防止伪造 actor。共享队列消费也用工作负载身份，不能把“知道 Run ID”当成授权。

## 人工审批与身份

审批者需要重新认证或具备有效会话，审批事件记录 approver identity、subject、actor、动作、参数摘要、时间和策略。Agent 不能代替用户点击自己的审批，也不能复用另一个资源的批准。

审批 UI 清楚显示“Agent X 将代表用户 Y 对资源 Z 执行动作 A”，让人看见委托关系，而不是只显示“是否继续”。

## 审计与撤销

每次资源动作记录 subject、actor、workload、token ID/摘要、issuer、audience、scope、策略与审批，不记录完整 token。发现工作负载或用户账户被攻破时，撤销会话/刷新令牌、阻止新交换、轮换工作负载身份，并查询历史 actor/subject 链。

短期 token 减少撤销延迟，但不能替代事件响应。高风险系统可使用 token introspection、证明持有或更短有效期；具体机制按威胁模型选择。

[OWASP Agentic Threats Navigator](https://genai.owasp.org/resource/owasp-gen-ai-security-project-agentic-threats-navigator/)把身份与权限列为 Agent 攻击面。红队应覆盖主体混淆、actor 丢失、跨 audience 重放、过宽 scope、子 Agent 权限放大和审批复用。

## 常见误区

- 所有 Agent 共用一个长期 API Key，无法归责和撤销。
- 只记录用户，不记录实际执行的 actor/workload。
- 为服务 A 的 token 被服务 B 接受，没有 audience 校验。
- scope 正确就放行，不检查租户与资源所有权。
- 子 Agent 继承 Supervisor 全部权限，而不是按任务交换窄 token。
- 模型能够读取或打印 bearer token。

## 小结

安全 Agent 身份链同时保留用户 Subject、Agent Actor、工作负载和目标服务。认证证明身份，Token Exchange 签发面向目标的短期委托，目标服务再按资源和策略授权。委托不隐藏执行者，scope 不替代资源判断，规划不替代授权。这样系统既能自动行动，也能回答“谁代表谁，以什么权限做了什么”。

## 练一练

### 高频考点题 1：委托和模拟

Agent 代表用户调用 API，「委托」和「模拟」的区别是？

- A. 委托同时保留用户和 Agent 两个身份
- B. 没有区别，都是用用户的身份去调用
- C. 模拟更安全，因为审计记录里只有用户一个人
- D. 委托只能用于内部服务，模拟用于外部服务

**答案：A。** 委托在审计里同时保留 Subject 和 Actor，能追溯是谁代表谁做的。RFC 8693 的 act claim 可以表达委托链。

### 高频考点题 2：Agent 的凭证

Agent 工作负载访问下游服务的凭证，推荐怎么提供？

- A. 把长期 client secret 打包进镜像
- B. 写进环境变量，所有实例共用一份
- C. 平台签发短期凭证，不暴露给模型上下文
- D. 放进系统提示里，让模型调用时带上

**答案：C。** 工具 SDK 或安全边车完成交换和附加，模型只提出动作，看不到凭证。

### 高频考点题 3：目标服务收到 token

目标服务收到一个合法签名的委托 token 后，还需要做什么？

- A. 校验 audience、scope，对资源再授权
- B. 只检查 token 是否过期，没过期就可以执行
- C. 不用做了，签名合法就直接执行
- D. 把 token 转发给其他服务继续使用

**答案：A。** token 要绑定 audience、scope 和有效期；目标服务对具体资源再次授权，防止 token 被拿去别处用。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent 实习：模型选择与可信通信](../../../interview/bytedance/base/bytedance-base-54.md)
- [拼多多服务器开发一面：模型网关、动态鉴权与 Tool 授权](../../../interview/pinduoduo/ai/pinduoduo-ai-4.md)
<!-- interview-source-history:end -->

## 参考资料

- [RFC 8693：OAuth 2.0 Token Exchange](https://www.rfc-editor.org/info/rfc8693/)
- [RFC 9700：Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/info/rfc9700/)
- [OWASP：Agentic Threats Navigator](https://genai.owasp.org/resource/owasp-gen-ai-security-project-agentic-threats-navigator/)
