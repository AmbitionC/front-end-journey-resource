记忆让 Agent 跨会话保持偏好、事实和任务状态，也把一次输入的影响延长到未来。记忆投毒是攻击者让错误、恶意或越权内容进入可检索存储，随后在其他时间、任务或 Agent 中被当成可信上下文。与一次性 Prompt Injection 相比，它更隐蔽，因为最初攻击结束后影响仍会持续。

[OWASP Agentic Threats Navigator](https://genai.owasp.org/resource/owasp-gen-ai-security-project-agentic-threats-navigator/)把 Memory 视为独立攻击面；[OWASP 多智能体威胁建模指南](https://genai.owasp.org/resource/multi-agentic-system-threat-modeling-guide-v1-0/)也列出攻击者修改记忆以操纵后续决策的风险。共享记忆会进一步扩大影响范围。

![Agent 候选记忆经过来源、范围、置信、冲突与审核后入库并可撤销删除](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-memory-poisoning-memory-trust-lifecycle-v1.webp)

图中 Observation 不会直接写 Memory Store。每条候选先带 provenance、scope、confidence、conflict 与 review；被识别的 poisoned input 进入 quarantine，已入库错误则通过 revoke/delete 阻断检索。

## 哪些内容可能被投毒

记忆不只是对话摘要，还包括用户偏好、实体事实、任务状态、工具经验、检索文档、反思规则和多 Agent 共享黑板。不同类型需要不同信任：用户偏好可由用户修改，订单状态必须来自权威系统，安全策略绝不能从普通对话学习。

先为记忆分类：

- **偏好**：语言、展示格式，可由对应用户声明；
- **事实**：姓名、组织、业务状态，需要来源和时效；
- **情节**：某次 Run 的经过，用于恢复与审计；
- **程序经验**：工具用法或策略，不应由单个未审会话直接改变；
- **安全/权限**：来自受信配置，禁止模型学习写入。

不分类就无法定义谁能写、谁能读、何时过期。

## 候选写入而非自动持久化

模型提出 memory candidate，运行时验证：

```json
{
  "claim": "User prefers Chinese responses",
  "type": "preference",
  "subject": "user:u-17",
  "tenant": "t-3",
  "source": "conversation:run_01J...:turn_8",
  "sourceTrust": "user_asserted",
  "confidence": 0.85,
  "allowedUses": ["response_language"],
  "createdAt": "2026-07-16T12:00:00Z",
  "expiresAt": "2027-01-16T12:00:00Z",
  "schemaVersion": 2
}
```

候选不含“从今以后忽略公司策略”这类程序指令；类型与 allowedUses 限制其影响。写入服务独立于模型执行权限，根据 Schema、主体、来源和策略决定接受、审核或隔离。

## Provenance 不能被摘要丢失

每条记忆保存原始证据引用、产生它的变换和审核。摘要或合并后仍能追溯到来源；否则“网页声称退款期 90 天”可能在压缩后变成“退款期是 90 天”，不可信断言被洗白。

内容哈希帮助检测篡改，但不证明内容真实。来源签名证明是谁提供，也不证明提供者有权声明该事实。可信度由来源、主体授权、权威性、时效和交叉验证共同决定。

## Scope 与租户隔离

记忆至少按 tenant、user/subject、Agent、purpose 和 environment 隔离。检索查询携带调用者身份和用途，存储层强制过滤；不能先全库向量检索再在应用层删除其他租户结果，因为越界内容已经进入排序和模型上下文。

共享记忆采用显式发布流程。一个子 Agent 的观察先进入其私有区，经验证后才能成为团队共享事实。写权限与读权限分开，普通用户不能猜测其他用户 ID 写入其记忆。

## 置信、冲突与版本

置信度不是模型随口给的数字，应来自来源规则和验证。例如权威 API 高于网页，用户自述只对自身偏好有效。新事实与旧事实冲突时，不要静默覆盖：保留两个版本、来源、有效时间和冲突状态，要求重新查询权威系统或人工确认。

采用 append-only 事件：create、confirm、supersede、revoke、expire、delete。当前视图由事件折叠，审计可以还原当时 Agent 看见哪个版本。并发更新使用版本号或 compare-and-swap，避免最后写入者覆盖更可信记录。

## 过期与再验证

不同记忆有不同半衰期。语言偏好可以较久，库存和权限很短，安全规则只能来自配置。检索时检查 expiresAt；过期记录不进入模型，可触发从权威来源刷新。

长时间未使用、低置信或来源撤销的记忆降低优先级。对高风险决策，即使记忆未过期，也重新读取权威系统，记忆只作为线索。

## 检索时仍需验证

检索不是信任终点。返回项带来源、置信、时间和用途，模型上下文明确标注。策略阻止低可信记忆触发写工具、身份变化或数据外发；关键动作要求当前用户确认或权威查询。

向量相似度只代表文本接近，不代表事实正确、主体相同或权限允许。先执行租户/类型/时间过滤，再向量排序；结果数量和单条长度受限，防止攻击者用大量近似内容淹没可信事实。

## 撤销、删除与影响分析

发现投毒后立即 revoke，使其不再被检索；delete 处理隐私或合规删除，但审计可以保留不含原文的删除事件。二者不同：撤销保留证据用于调查，删除满足数据生命周期。

使用 provenance 查找派生摘要、嵌入、缓存和共享副本，级联失效。查询历史 Run 确定哪些决策读取过该记忆，评估是否需要补偿、通知或重新执行。只删除主表一行会留下缓存和派生向量。

## 检测与红队

监控异常写入量、跨主体写入、低可信来源高命中、反复冲突、相同内容多账号注入、记忆导致的工具变化和未知来源。写入、检索、更新、撤销都记录 Run/Trace、主体和策略版本。

红队测试猜测用户 ID、共享记忆污染、慢速多轮投毒、摘要洗白、过期绕过、冲突覆盖和删除残留。断言不只是模型回答，还包括存储事件、检索集合、工具轨迹和派生副本。

[NIST AI RMF Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)强调持续评估、风险管理和人类反馈。记忆策略变化、新来源接入和跨 Agent 共享都属于高风险架构变更，应触发威胁模型与回归。

## 常见误区

- 每轮结束让模型自由总结并自动写长期记忆。
- 向量检索后才做租户过滤，越界内容已经参与排序。
- 摘要只保留结论，不保留来源与不可信标签。
- 新记录静默覆盖旧记录，没有冲突、版本和审核。
- 删除主记录却不清理嵌入、缓存、摘要和共享副本。
- 允许记忆直接改变权限、安全策略或工具注册表。

## 小结

安全记忆系统把每次写入当作有来源、有范围、有生命周期的状态变更。候选经过 Schema、provenance、租户、置信、冲突和审核；检索仍携带信任信息并受用途约束；撤销与删除级联到派生副本。记忆可以帮助决策，但不能成为文字绕过权限的持久通道。

## 参考资料

- [OWASP：Agentic Threats Navigator](https://genai.owasp.org/resource/owasp-gen-ai-security-project-agentic-threats-navigator/)
- [OWASP：Multi-Agentic System Threat Modeling Guide](https://genai.owasp.org/resource/multi-agentic-system-threat-modeling-guide-v1-0/)
- [NIST：AI RMF Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)
