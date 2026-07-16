Agent 权限模型把“模型想做什么”转换为“当前主体在特定上下文中被允许对哪个资源执行什么操作”。认证只证明是谁，授权才决定能做什么；自然语言委托、模型置信度和工具可见性都不是权限。

## 用主体、资源、操作和环境描述请求

[NIST SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)把 ABAC 描述为根据 subject、object、requested operation 和环境属性评估策略。这个词汇非常适合 Agent：

```json
{
  "subject": { "user": "u1", "agent": "researcher", "tenant": "t1" },
  "resource": { "type": "document", "id": "d9", "classification": "internal" },
  "operation": { "name": "update", "fields": ["summary"] },
  "environment": { "purpose": "task-42", "network": "sandbox", "time": "..." }
}
```

策略返回 permit/deny/review，以及义务：字段过滤、时间限制、审批、审计、只读模式或最大金额。完整规范的 [NIST PDF](https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.SP.800-162.pdf)还讨论策略执行与属性来源等组件；生产实现要让关键属性来自受信任身份/资源服务，而不是模型自报。

![Agent 请求中的主体、资源、操作和环境属性进入策略决策；低风险读取获得绑定工具、目标、模式、TTL 与预算的能力票据，高风险写入还需绑定精确参数的升级审批，再由执行点 Permit 或 Deny 并审计](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-permission-model-capability-approval-v1.webp)
*图：可见工具不等于可调用；最终执行点重新校验 capability 与参数。*

## 最小权限的维度

最小权限不是“只给三个工具”这么简单。范围包括：

- 工具/操作：read 与 write 分开；
- 资源：具体仓库、表、目录、账号、域名；
- 字段：只能读/改必要字段；
- 时间：短 TTL，任务结束撤销；
- 数量与成本：调用次数、金额、字节、收件人数；
- 网络与环境：只能在隔离环境访问批准目标；
- 转授：默认禁止 Subagent 再转授。

例如“允许发送邮件”过宽；更合理是“任务 42 中，用户 u1 批准向两个确认收件人发送预览 hash 为 X 的邮件，一次有效，10 分钟过期”。

## Capability Token

策略通过后发放短期 capability 或直接建立受限句柄。Token 包含主体、目标、操作、参数约束、purpose、预算、过期时间、审批引用和唯一 ID，并由执行层验证签名。它不能包含长期秘密，也不应允许 bearer 在任意环境转用。

工具适配器是 Policy Enforcement Point：即使模型绕过编排层直接构造请求，也无法超出 token。执行后记录实际资源、参数 hash、结果和消耗；未使用 token 到期作废。

## Step-up Approval

读取公开信息可能自动 permit；发布、删除、支付、权限变更、外部消息和敏感数据导出需要 step-up approval。[OpenAI approvals 文档](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)展示了工具调用暂停、产生 interruption 并从保存状态恢复的当前模式。

审批必须展示意图与实际参数，绑定 action hash、目标、计划版本和过期时间。用户批准“发送草稿”后内容、附件或收件人改变，旧批准失效。审批 UI 不应只显示模型生成的友好摘要，还要有机器解析的实际目标。

## 权限继承与多 Agent

主 Agent 无法通过委派扩大自己的权限。Subagent 只获得合同所需的子集；Supervisor 负责路由但不自动拥有专家数据。共享服务以最终 principal + agent identity + purpose 评估，而不是只相信服务账号。

跨租户、跨用户和共享内存用 namespace 与访问控制同时隔离。消息中的 `sourceAgent` 可帮助审计，但需要认证，不能把自报字符串当身份。

## ReBAC、RBAC 与 ABAC 的组合

RBAC 表达岗位基线，如 reviewer 可读草稿；ReBAC 表达关系，如文档 owner 或项目成员；ABAC 表达资源分类、用途、时间和风险。生产系统常组合三者：先用角色/关系缩小候选，再用属性做细粒度判断。

拒绝规则优先于允许规则，默认 deny。策略版本化、测试和渐进发布；模型不能生成后立即启用权限策略。

## 状态与撤销

权限会在任务期间变化：用户撤销共享、账号被禁用、资源升级分类或审批过期。长任务在每个高风险调用前重新授权，不只在会话开始时检查一次。Token 短期化减少撤销窗口；紧急撤销列表可立即拒绝。

远端操作超时后，不要通过重新申请权限盲目重放。先确认业务状态，幂等键与权限是两个正交条件：有权不代表重复安全，幂等也不代表有权。

## 测试与观测

策略测试覆盖 permit、deny、review、缺属性、伪造属性、过期 token、参数漂移、跨租户、委派扩大、撤销竞态和审批重放。使用 property-based 测试验证“扩大资源/金额不会从 deny 变 permit”等单调性。

审计记录主体链、资源、操作、purpose、策略版本、决策、义务、审批、token ID 和实际效果，敏感参数只存 hash/受控引用。指标包括 deny/review 比率、过宽 token、未使用 capability、参数不匹配、撤销延迟、跨租户阻断和人工批准后取消。

## 小结

Agent 权限来自受信任策略，而不是提示词。把每次动作建模为 subject—resource—operation—environment，请求最小范围 capability，高风险参数通过 step-up approval，再由工具执行点重新校验并审计。认证、授权、审批、幂等与沙箱各自解决不同问题，不能相互代替。

## 参考资料

- [NIST — Guide to Attribute Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
- [NIST SP 800-162 PDF](https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.SP.800-162.pdf)
- [OpenAI — Guardrails and human approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)
