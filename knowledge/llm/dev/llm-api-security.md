大模型 API 安全的第一条边界是：**浏览器、移动端和桌面安装包都不是长期密钥保险箱**。把供应商 API Key 写进前端环境变量、构建产物或可下载配置，只是换了一个泄漏位置。正确架构让客户端证明“用户是谁、允许做什么”，由受控服务端代表用户访问模型和工具。

## 先画信任边界

最小生产链路是：

```text
client → application gateway/BFF → model provider
                           ↘ tools and data
```

客户端提交用户会话和业务请求；网关验证身份、授权、配额、输入和成本上限，从密钥系统读取服务端凭据，再调用供应商。模型提出工具调用时，服务端重新做资源级授权。供应商返回的文本和工具参数仍是不可信数据，进入 HTML、SQL、Shell 或外部 API 前必须按目标上下文校验。

![浏览器到模型和工具的安全路径由服务端认证、授权、限流、密钥库、策略与审计共同保护](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-api-security-trust-boundary-v1.webp)
*图：浏览器直连长期供应商凭据的路径被阻断；模型和工具不是同一个权限域。*

## 认证之后还要逐资源授权

认证回答“这是谁”，授权回答“这个主体能否对这个资源执行这个动作”。一个登录用户并不自动拥有全部对话、文件、向量库或管理工具。[OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) 把对象级和函数级授权缺陷列为关键风险；每次根据用户传入的 conversation ID、file ID 或 tenant ID 取数据时，都要在服务端检查资源归属与策略。

```ts
const subject = await authenticate(request);
const input = parseAndValidate(await request.json());

await authorize(subject, {
  action: "model.generate",
  tenantId: input.tenantId,
  resourceId: input.conversationId,
});

await enforceQuota(subject, estimateWorstCaseCost(input));
return invokeModelWithServerCredential(input);
```

`tenantId` 不能直接相信客户端。它应来自已验证会话或服务端映射，并贯穿检索过滤、缓存键和日志。

## 密钥生命周期

长期凭据存放在密钥管理系统，按环境、服务和用途隔离；应用在运行时读取，不写进仓库、镜像层或普通日志。能使用短期、受限令牌时，限制有效期、能力、来源和预算。

[OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)强调令牌保护、受限授权和避免已知不安全模式。对供应商凭据来说，轮换也不是“改一个环境变量”：

1. 创建新凭据并部署双钥读取；
2. 验证新钥请求成功；
3. 撤销旧钥；
4. 观察认证失败并清理旧版本；
5. 记录负责人、时间和影响范围。

怀疑泄漏时先撤销、缩小权限和封堵来源，再调查日志。不要等确认攻击发生才行动。

## 代理层不能变成开放转发器

一个只接收任意 `model`、`url` 和 `body` 然后带密钥转发的 `/api/proxy`，等同把供应商账户送给攻击者。代理应使用服务器端允许列表和固定业务 Schema：

- 允许的模型/能力由服务端配置；
- 限制输入字节、图片数量、输出 token 和并发；
- 用户、租户、IP/设备和组织多维限流；
- 拒绝任意目标 URL，防止 SSRF；
- 工具名、参数 Schema 和资源范围使用允许列表；
- 设置连接、首字节、总时长和重试预算。

OWASP API Top 10 也提醒“不受限资源消耗”和“不安全消费第三方 API”：供应商响应不能因为来自可信厂商就跳过大小、类型和输出检查。

## LLM 特有风险不会被普通鉴权消除

[OWASP GenAI Top 10 2025](https://genai.owasp.org/llm-top-10/) 包含提示注入、敏感信息披露、不当输出处理、过度代理和无界消耗等风险。系统提示不是秘密保险箱，也不是权限系统。攻击者即使改变模型指令，仍应被服务端工具授权、最小权限凭据和输出校验挡住。

把用户文本、上传文档、网页检索结果和工具返回都标为不可信内容；不要让其中的指令修改上层政策。高风险动作采用结构化参数、二次授权、人工确认或事务性业务 API。

## 日志既要可查又不能泄密

审计日志记录主体、租户、请求 ID、模型/策略版本、工具名称、授权结果、usage、延迟和错误类别。默认不记录完整提示、文件内容、Authorization 头、API Key 或模型原始输出。确需内容调试时，使用有时限的受控采样、脱敏、访问审批和删除策略。

监控至少覆盖：认证失败激增、跨租户拒绝、单主体费用异常、输出 token 异常、工具拒绝、供应商 401/403、密钥读取失败和日志脱敏失败。

## 截至 2026-07-15 的实现提醒

供应商支持的项目密钥、服务账户、短期客户端会话和数据保留选项会变化，部署时应重新核对[官方生产指南](https://developers.openai.com/api/docs/guides/production-best-practices)。长期原则不变：客户端不持有长期密钥，服务端执行授权与预算，凭据按最小权限隔离，所有外部输入和模型输出都按不可信数据处理。

## 上线检查清单

- 构建产物、Source Map、日志和错误页中不存在长期密钥；
- 客户端只能调用固定业务接口，不能任意转发供应商请求；
- 对话、文件、工具和租户都有对象级授权；
- 最大输入、输出、并发、时长和费用均有硬上限；
- 工具执行再次授权，并使用幂等键保护副作用；
- 密钥可独立轮换与撤销，泄漏响应流程经过演练；
- 日志默认脱敏且有保留、访问与删除策略。

## 小结

安全的大模型代理不是“藏住一把 Key”，而是一条完整控制链：身份、对象授权、配额、密钥、出站限制、工具门禁、输出处理和审计。模型的不确定性与提示注入会变化，但这些服务端边界能把风险限制在可观察、可撤销的范围内。

## 参考资料

- [OWASP — API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP — Top 10 for LLMs and GenAI Apps 2025](https://genai.owasp.org/llm-top-10/)
- [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OpenAI — Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices)
