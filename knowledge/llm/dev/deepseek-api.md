## 先建立正确认识

接入 DeepSeek API 的本质，是让自己的**服务端**通过 HTTP 调用模型，再把业务需要的结果返回给前端。模型密钥、限流、重试、工具权限和日志都应该留在服务端。

DeepSeek 同时提供 OpenAI 与 Anthropic 风格的兼容入口。这里的“兼容”主要指请求结构和 SDK 使用方式相近，并不意味着模型名称、扩展参数、错误行为和能力边界完全相同。迁移时必须重新检查这些差异。

![DeepSeek API 的请求、思考与工具闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/deepseek-api-thinking-tools-v3.webp)

截至 2026 年 7 月，官方文档列出的主力模型是 `deepseek-v4-flash` 与 `deepseek-v4-pro`。历史别名 `deepseek-chat`、`deepseek-reasoner` 已进入弃用窗口，不应继续写进新项目。模型和价格会变，生产代码应通过环境变量配置，并在上线前核对官方模型与计费页。

## 一、最小可用接入

安装 OpenAI 官方 Node SDK：

```bash
npm install openai
```

将密钥放进服务端环境变量，绝不能写进前端代码或提交到 Git：

```bash
DEEPSEEK_API_KEY=your_server_side_key
DEEPSEEK_MODEL=deepseek-v4-pro
```

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
  timeout: 60_000,
  maxRetries: 2,
});

const response = await client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro",
  messages: [
    { role: "system", content: "你是严谨的技术助手；不确定时明确说明。" },
    { role: "user", content: "解释浏览器事件循环中的微任务。" },
  ],
});

console.log(response.choices[0]?.message.content ?? "");
```

这个例子只有三个关键配置：服务端密钥、DeepSeek 的 `baseURL`、当前可用模型名。不要因为 SDK 名为 `OpenAI` 就误以为请求发往 OpenAI；真正的目标由 `baseURL` 决定。

## 二、思考模式不是“展示完整思维链”

当前模型支持思考模式。它可能返回两部分：用于衔接请求的 `reasoning_content`，以及可以展示给用户的 `content`。应用应把后者当作最终回答，不应把内部推理原样展示给终端用户。

```ts
const result = await client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro",
  messages: [{ role: "user", content: "比较两种缓存方案并给出选择依据。" }],
  reasoning_effort: "high",
  // DeepSeek 扩展字段；若本地 SDK 类型尚未收录，可做局部类型适配。
  ...({ thinking: { type: "enabled" } } as Record<string, unknown>),
});
```

需要注意：

- 思考模式下，部分采样参数可能被忽略，不能把旧的温度调参经验直接套用。
- 当一轮思考产生工具调用时，继续会话必须按官方协议回传上一条 assistant 消息中的 `reasoning_content`；丢失它可能得到 `400`。
- 推理更长通常意味着延迟和费用更高。只有复杂规划、数学推理、代码诊断等任务才值得默认开启。
- 不要依赖内部推理文本作为稳定接口。业务决策应依赖结构化输出、工具结果和独立校验。

## 三、流式返回

长回答适合开启 `stream`。服务端消费提供方事件，再转换成自己的 SSE 或其他流式协议；不要把提供方响应不加处理地透传给浏览器。

```ts
const stream = await client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
  messages: [{ role: "user", content: "分步骤解释 HTTP 缓存。" }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) {
    // 写入自己的 SSE/NDJSON 流，同时处理断开与背压
    process.stdout.write(delta);
  }
}
```

完整工程还要处理客户端取消、上游超时、首字延迟、流中途失败、代理缓冲和最终 usage 记录。流式只改变传输体验，不会减少模型生成的 token 数。

## 四、工具调用的完整闭环

工具调用不是模型直接执行函数。模型只返回工具名和参数，应用负责校验、授权和执行，再把结果送回模型。

```ts
const tools = [{
  type: "function" as const,
  function: {
    name: "get_order_status",
    description: "按订单号查询当前用户自己的订单状态",
    parameters: {
      type: "object",
      properties: { orderId: { type: "string" } },
      required: ["orderId"],
      additionalProperties: false,
    },
  },
}];
```

安全执行顺序应当是：

1. 模型返回 `tool_calls`。
2. 服务端按 JSON Schema 校验参数，并验证当前用户是否有权访问该订单。
3. 对写入、付款、发送消息等副作用操作要求用户确认。
4. 设置超时、并发限制和幂等键，执行真实函数。
5. 将工具结果与对应 `tool_call_id` 一起回传。
6. 重复直到模型给出最终文本，或达到最大循环次数。

`strict` 只能提高参数结构符合 Schema 的概率，不能替代业务权限、金额范围、资源归属和输入净化。工具输出同样可能包含恶意内容，送回模型前仍需按不可信输入处理。

## 五、JSON 输出

需要稳定对象时可以启用 JSON 模式，但仍要做运行时校验：

```ts
const result = await client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
  messages: [{
    role: "user",
    content: "请只返回 JSON，字段为 summary:string、risks:string[]。分析这段发布计划……",
  }],
  response_format: { type: "json_object" },
  max_tokens: 1_000,
});

const raw = result.choices[0]?.message.content ?? "{}";
const value = JSON.parse(raw); // 随后使用 Zod/Ajv 校验
```

提示词必须明确要求 JSON，并预留足够的输出 token，避免对象被截断。即使 JSON 能解析，也不代表字段值在业务上有效。

## 六、错误、重试与可观测性

常见状态码可以这样分类：

| 状态 | 含义 | 建议 |
|---|---|---|
| 400 / 422 | 请求格式或参数错误 | 不盲目重试，记录脱敏后的请求结构 |
| 401 | 密钥无效 | 检查服务端密钥与部署环境 |
| 402 | 余额不足 | 告警并停止自动重试 |
| 429 | 触发频控 | 指数退避并加随机抖动，限制并发 |
| 500 / 503 | 临时服务错误 | 有上限地重试，必要时降级 |

每次请求至少记录：内部 `request_id`、模型名、耗时、首字延迟、输入/输出用量、重试次数、结束原因和错误分类。日志不应保存密钥，也应避免长期保存用户完整隐私内容。

生产系统还应具备：

- 总超时与单次尝试超时，防止请求无限悬挂。
- 指数退避、抖动和最大重试次数，防止故障放大。
- 按用户或租户限流、预算阈值和并发隔离。
- 可切换模型的配置层，而不是把模型名散落在代码里。
- 针对核心样例的离线评测，避免升级模型后质量静默回退。

## 七、上线检查清单

- [ ] 密钥只存在于服务端的密钥管理或环境变量中。
- [ ] 使用当前官方模型名，旧别名没有写进新代码。
- [ ] 请求具备超时、有限重试、限流和取消机制。
- [ ] JSON 结果经过语法与业务 Schema 双重校验。
- [ ] 工具调用经过权限、参数、副作用确认和幂等控制。
- [ ] 思考模式的多轮/工具消息按官方协议完整回传。
- [ ] 日志包含 request ID、usage 与延迟，但不泄露敏感信息。
- [ ] 上线前跑过真实任务集，而不是只验证“接口能通”。

## 参考资料

- [DeepSeek API 文档首页](https://api-docs.deepseek.com/)
- [DeepSeek 思考模式](https://api-docs.deepseek.com/guides/thinking_mode/)
- [DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/)
- [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)
- [DeepSeek 错误码](https://api-docs.deepseek.com/quick_start/error_codes/)
- [DeepSeek 模型与价格](https://api-docs.deepseek.com/quick_start/pricing/)
