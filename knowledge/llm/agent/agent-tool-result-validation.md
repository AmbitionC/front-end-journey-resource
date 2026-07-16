工具返回 `200` 或 `success: true`，只说明某层协议或执行没有报告失败，不代表内容真实、完整、获授权、足够新或适合进入 Agent 状态。工具结果必须跨越一条独立信任边界：解析信封、验证结构、检查语义和策略，再转成带来源的 accepted evidence。

## 先区分协议错误与执行错误

协议错误表示消息本身无法按契约处理，例如 JSON-RPC 格式错误、未知方法或缺失请求 ID；执行错误表示工具被正确调用，但业务动作失败。两者的重试、归因和呈现不同，不能都包装成一段普通文本。

[MCP Tools 规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)区分协议层错误与工具执行结果中的 `isError`，并说明工具结果可包含文本、图片、资源或 structured content。客户端应保留这种层次，不能因为响应信封合法就把 `isError` 内容写成成功事实。

一个本地统一信封可包含 `callId`、tool/version、status、data、error、provenance、producedAt、schemaVersion、traceId 和 size。先限制总字节、内容块数量和嵌套深度，再解析，防止超大或病态结构消耗资源。

## Schema 验证形状，不验证事实

[JSON Schema Validation](https://json-schema.org/draft/2020-12/json-schema-validation)可检查类型、required、枚举、范围、格式和额外属性策略。输出 schema 应由受信任 registry 按工具版本选择，不接受结果自己声明一个更宽 schema。

结构通过后继续做语义检查，例如 `start <= end`、币种与金额匹配、分页 cursor 与请求一致、资源 ID 属于预期对象、总数等于明细汇总。Schema 能确认 `amount` 是 number，却不能确认金额来自真实账本或当前用户有权查看。

![不可信工具输出依次通过响应信封、Schema、语义、策略、来源与新鲜度检查，失败进入重试、拒绝或隔离，通过后才写入 Agent 状态](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-result-validation-trust-boundary-v1.webp)
*图：成功状态不等于可信内容；任何重试结果都必须重新走完整验证管线。*

## Policy 检查下游能否使用

即使数据正确，也可能不允许用于当前目的。Policy 校验主体、租户、数据分类、授权 scope、地域、保留期和用途。例如客服工具返回的身份证号可用于核验，却不能自动放入营销文案；管理员可见字段不能进入普通用户的最终答案。

输出中的 URL、文件路径、HTML、Markdown 和指令文本均不可信。URL 进入独立 allowlist/SSRF 检查，文件引用限制在 job scope，富文本转义，提示式内容作为数据引用而非系统命令。工具不能通过返回“请忽略策略”改变 Agent 权限。

## Provenance 与 Freshness

accepted evidence 至少记录 tool/version、call ID、输入摘要 hash、来源系统、资源版本、产生/获取时间、校验器版本和适用 scope。对易变数据设置 `validUntil`；下一轮使用前若已过期，重新获取或明确标记未知。

来源分级可以区分权威账本、内部缓存、第三方搜索和模型推断。多个来源冲突时不按“最后一个覆盖”，而是保留冲突，按业务优先级或人工判断解决。引用原始对象时保存不可变 version/etag，避免链接后来指向不同内容。

## Guardrail 是一层，不是全部边界

[OpenAI Agents SDK guardrails 文档](https://openai.github.io/openai-agents-python/guardrails/)描述了输入、输出和工具 guardrail 的当前执行方式。框架 guardrail 可拒绝、替换或触发异常，但覆盖范围会因工具类型和调用路径而异；应用仍需在所有 provider/tool adapter 之后设置统一结果验证器。

不要只在最终自然语言输出做审查。那时恶意或错误结果可能已污染 memory、触发下一工具或写入数据库。验证必须紧贴工具返回，在进入共享 Agent state 前完成。

## 失败策略：Retry、Reject、Quarantine

- **Retry**：仅用于暂时性、可安全重试的错误，受 attempt 和 deadline 约束；
- **Reject**：确定违反 schema、策略或业务不变量，不再自动尝试；
- **Quarantine**：内容可能有调查价值但不可信，隔离原始结果供分析；
- **Manual review**：高风险、来源冲突或无法自动判定的证据。

重试必须重新经过信封到来源的全部检查，不能因“第二次”而走快捷路径。协议错误可能表示客户端/服务器版本不兼容，盲目重试无效；执行错误则根据稳定 error code 判断是否改参、等待或停止。

## Partial 与缺失数据

工具可能只返回部分页面、部分成功或降级缓存。信封明确 `complete=false`、`missing`、`nextCursor` 和 `warnings`，Agent 不得把 partial 当全量。若业务需要完整集合，validation 直接阻止完成状态；若允许部分答案，最终输出明确覆盖范围和缺口。

聚合多个工具结果时，为每个字段保留 provenance，不要把不同时间和权限范围的数据合并成看似单一权威对象。敏感字段在写入共享 memory 前做字段级裁剪。

## 示例验证器

```ts
async function acceptResult(raw: unknown, ctx: ValidationContext) {
  const envelope = parseWithLimits(raw);
  assertCallIdentity(envelope, ctx.expectedCall);
  assertSchema(envelope.data, ctx.outputSchema);
  assertSemanticInvariants(envelope.data, ctx.request);
  await assertPolicy(envelope.data, ctx.principal, ctx.purpose);
  const provenance = verifyProvenance(envelope, ctx.trustedRegistry);
  assertFresh(provenance, ctx.now);
  return toAcceptedEvidence(envelope.data, provenance, ctx.validatorVersion);
}
```

函数命名体现顺序：任何一步失败都没有 Agent state 写入。真实实现还要对资源读取、解压、图片解码等内容型结果设专门沙箱和预算。

## 测试与观测

契约测试覆盖合法、缺失、额外字段、错误类型、超大 payload、协议错误、执行错误、partial、来源缺失和过期。安全测试加入 HTML/Markdown 注入、恶意 URL、路径穿越、伪造 tenant、提示注入与压缩炸弹。变异测试随机删改字段，确认 validator fail closed。

记录 call/tool/schema/validator version、各阶段 pass/fail、payload size、provenance、freshness、decision 与 quarantine ID。指标包括结构失败、语义失败、策略拒绝、来源缺失、过期、partial、重试后通过和错误内容进入下游的事故率。

## 常见误区

- HTTP 200 就写入 memory；
- 只做 JSON parse，不按版本校验 schema；
- schema 通过就认为事实正确；
- 把 `isError` 文本当正常 data；
- 信任工具自报的来源、权限与安全 annotation；
- 最终回答时才做 guardrail；
- 重试绕过验证或 partial 被当 complete；
- 原始富文本直接进入浏览器和下一轮提示。

## 小结

工具结果验证把“返回了什么”转换为“系统允许相信和使用什么”。先保留协议与执行错误语义，再按受控 schema、业务不变量、策略、来源、新鲜度和大小逐层收口；失败明确重试、拒绝、隔离或人工复核。只有 accepted evidence 可以进入 Agent 状态。

## 参考资料

- [Model Context Protocol — Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [JSON Schema — Draft 2020-12 Validation](https://json-schema.org/draft/2020-12/json-schema-validation)
- [OpenAI Agents SDK — Guardrails](https://openai.github.io/openai-agents-python/guardrails/)
