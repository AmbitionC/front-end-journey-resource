Agent 工具不是“把一个函数名字告诉模型”这么简单。它是跨越模型与真实系统的契约：Schema 约束数据形状，服务端授权决定能不能做，执行预算限制怎么做，结果语义告诉 Agent 应该继续、重试、补参还是停止。任何一层含糊，模型都会用自然语言猜测填空。

## 工具意图要窄而可判定

一个好工具完成一个可命名动作，并有明确成功条件。`manage_customer()` 太宽；可以拆为 `get_customer`、`update_customer_email`、`issue_refund`。读与写分离，高风险写操作单独审批。

描述包含“何时使用、何时不用、关键限制”，不要把业务规则全塞进名称。输出字段稳定，避免有时返回字符串、有时返回对象。

## Input Schema 约束形状

```json
{
  "type": "object",
  "properties": {
    "order_id": { "type": "string", "pattern": "^ord_[A-Za-z0-9]+$" },
    "reason": { "type": "string", "enum": ["duplicate", "damaged", "other"] },
    "request_id": { "type": "string" }
  },
  "required": ["order_id", "reason", "request_id"],
  "additionalProperties": false
}
```

Schema 提供类型、必填、枚举、范围和额外字段策略。[JSON Schema 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core)定义了描述 JSON 文档结构与验证的核心语义；具体提供商只支持其中子集时，应在适配层验证。

当前 [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling)建议启用 strict mode，使函数参数遵循 schema；截至 2026-07-15，其严格模式要求对象关闭额外属性并把字段列入 required（可用 nullable 表达可选）。这些是当前 API 行为，不能替代服务端校验。

![Agent 工具调用依次经过输入 Schema、授权与执行预算，副作用之后返回结构化成功、部分成功、可重试或终止错误](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-design-contract-v1.webp)
*图：Schema 失败 REJECT，授权失败 DENY；Schema 不授予权限。*

## Authorization 是独立硬门禁

模型给出合法 `order_id`，不代表当前用户有权退款。工具服务从受信任会话获取 principal/tenant/scope，不接受模型自报的 `is_admin`。校验对象归属、状态、金额与审批策略，并记录 policy decision。

授权发生在读取敏感对象和副作用前。工具列表本身也可按主体裁剪，但“模型看不到工具”只是降低误用，不是服务端授权替代。

## 副作用语义必须显式

每个工具标注：read-only、idempotent、destructive、open-world，以及是否需要确认。MCP 当前 [Tools 规范](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)定义工具名、描述、inputSchema、可选 outputSchema，并区分协议错误与执行错误；它也要求服务器验证输入、实施访问控制、限流和清理输出。

写工具接受 idempotency key：相同 key 与相同参数返回原结果；相同 key 参数不同则冲突。取消本地等待不等于外部操作回滚，结果要支持后续查询。

## 时间、次数与资源预算

契约包含 timeout、rate limit、最大页数/行数/字节和允许重试：

```ts
type ToolPolicy = {
  timeoutMs: number;
  maxAttempts: number;
  retryableCodes: string[];
  idempotencyRequired: boolean;
  approval: 'none' | 'user' | 'admin';
};
```

超时要说明状态未知还是确定未执行。非幂等副作用在未知状态下不得盲重试；先用 request_id 查询执行状态。

## 结构化输出与错误分类

```ts
type ToolResult<T> =
  | { status: 'success'; data: T; traceId: string }
  | { status: 'partial'; data: Partial<T>; missing: string[]; traceId: string }
  | { status: 'error'; code: string; retryable: boolean; message: string; traceId: string };
```

错误码给 Agent 决策，message 给用户解释。`INVALID_ARGUMENT` 可修参一次；`RATE_LIMITED` 按 retry-after；`POLICY_DENIED` 与 `NOT_FOUND` 通常不重试；`SIDE_EFFECT_STATUS_UNKNOWN` 先查状态。

不要把栈、SQL、内部 URL 或密钥返回模型。Partial 明确已完成与未完成部分，避免 Agent 把一半结果当全部成功。

## Tool Contract Test

每个工具独立于模型测试：合法/缺失/额外字段、边界值、跨租户、状态竞争、超时、幂等重复、相同 key 不同参数、部分成功、输出 schema 和敏感错误清理。

再做 Agent 集成测试：是否选对工具、参数来源、何时审批、错误后是否正确重试/停止。录制工具 fixture 保证回归确定；生产沙箱验证真实授权与副作用隔离。

## 可观测性

记录 tool name/version、call ID、trace ID、principal/tenant 的非敏感标识、schema/auth decision、时长、attempt、idempotency key hash、结果 code 和副作用资源 ID。参数按字段分类脱敏，不记录原始密码、token 和文档正文。

指标包括选择率、参数验证失败、授权拒绝、成功/partial/error、重试放大、未知状态、p95 和用户取消。Agent trace 与服务 trace 通过 call ID 关联。

## 常见误区

- 一个万能工具承载所有业务动作；
- 把 Schema 校验当授权；
- 工具接收 `tenantId` 后直接信任；
- 非幂等写超时后自动重试；
- 错误只返回自由文本，Agent 无法判断；
- Partial 被包装成 success；
- 取消 HTTP 请求就声称副作用已回滚；
- 工具没有版本和 contract tests。

## 小结

工具契约把模型的不确定输出包在确定性边界里：窄意图与 Schema 约束输入，服务端授权决定权限，预算与幂等控制副作用，结构化结果和错误指导后续行为。契约测试、trace 和审批使 Agent 能安全地从“会说”跨到“会做”。

## 参考资料

- [JSON Schema — Draft 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core)
- [OpenAI — Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Model Context Protocol — Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
