OpenAI 官方 JavaScript / TypeScript SDK 是对 REST API 的类型化封装。对新的文本与工具型应用，当前主路径是 **Responses API**：它把文本、图片、工具调用、结构化输出、流式事件和会话状态统一到同一套响应对象中；Chat Completions 仍受支持，但不再是新项目的首选。[OpenAI 文本生成指南](https://developers.openai.com/api/docs/guides/text)

## 安装与安全初始化

```bash
npm install openai
```

只在服务端保存 `OPENAI_API_KEY`。浏览器、移动端包、公开仓库和前端环境变量都会把长期密钥暴露给用户。SDK 默认读取环境变量，因此通常不必手写密钥：

```ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 30_000,
});
```

生产环境还应把模型 ID 放在可审计配置中，而不是散落在业务代码里。对支持的环境，可进一步采用工作负载身份和短期令牌，减少长期密钥风险。[OpenAI Node SDK](https://github.com/openai/openai-node)

## 第一个 Responses 请求

```ts
const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL!,
  instructions: "你是技术文档助手。回答简洁；不确定时明确说明。",
  input: "用一个例子解释 JavaScript 事件循环。",
});

console.log(response.output_text);
console.log({
  responseId: response.id,
  requestId: response._request_id,
  usage: response.usage,
});
```

`response.output` 是由不同类型条目组成的数组，可能包含文本消息、推理项和工具调用；`output_text` 是 SDK 提供的文本聚合便捷属性。不要假设所有结果都在 `output[0].content[0]`。

![服务端通过 OpenAI SDK 调用 Responses API，处理模型输出或工具调用，并通过事件流接收增量结果](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/openai-sdk-responses-lifecycle-v2.png)
*图：密钥只在业务服务中；模型提出工具调用，业务服务校验并执行，再把工具结果交还模型。*

## 指令与多轮状态

`instructions` 适合放应用的高层规则，`input` 放本次用户任务。官方文档说明，`instructions` 只作用于当前请求：即使通过 `previous_response_id` 延续对话，也不会自动继承上一轮指令。[OpenAI 文本生成指南](https://developers.openai.com/api/docs/guides/text)

```ts
const first = await openai.responses.create({
  model: process.env.OPENAI_MODEL!,
  instructions: "始终用中文回答，并用一句话给出结论。",
  input: "什么是闭包？",
});

const second = await openai.responses.create({
  model: process.env.OPENAI_MODEL!,
  previous_response_id: first.id,
  // 规则需要按本轮重新提供
  instructions: "始终用中文回答，并用一句话给出结论。",
  input: "再给一个最小代码示例。",
});
```

简单延续可用 `previous_response_id`；需要自己保存上下文时，应完整保留可重放的 output items 及顺序，而不是只抽取 assistant 文本。官方 SDK 提供 `toResponseInputItems()` 等辅助能力来避免丢失推理或工具条目。[OpenAI Node SDK](https://github.com/openai/openai-node)

## 流式输出

设置 `stream: true` 后返回的是异步事件流，不是一串可以任意按换行切割的完整 JSON。按事件 `type` 处理增量：

```ts
const stream = await openai.responses.create({
  model: process.env.OPENAI_MODEL!,
  input: "写一段 100 字的海边描写。",
  stream: true,
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta);
  }

  if (event.type === "response.completed") {
    console.log("\nusage:", event.response.usage);
  }
}
```

Web 服务还要处理客户端断开：用 `AbortController` 取消上游请求，停止继续计费和占用连接；同时不要在每个 delta 上执行昂贵渲染或数据库写入。[OpenAI Streaming 指南](https://developers.openai.com/api/docs/guides/streaming-responses)

## 结构化输出

当结果要进入程序，不要靠“请只返回 JSON”再手动截取代码块。Structured Outputs 可以让输出遵循 JSON Schema；TypeScript SDK 能用 Zod 生成格式并解析结果。

```bash
npm install zod
```

```ts
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const Ticket = z.object({
  category: z.enum(["billing", "bug", "question"]),
  priority: z.enum(["low", "medium", "high"]),
  summary: z.string(),
});

const response = await openai.responses.parse({
  model: process.env.OPENAI_MODEL!,
  input: "用户说：扣款两次，今天必须处理。",
  text: { format: zodTextFormat(Ticket, "ticket") },
});

const ticket = response.output_parsed;
if (!ticket) throw new Error("模型未返回可解析的工单");
```

Schema 保证的是结构，不保证业务事实。金额、订单归属和权限仍需查询可信系统并在后端校验；同时要处理拒绝、截断和请求失败等非成功路径。[OpenAI Structured Outputs 指南](https://developers.openai.com/api/docs/guides/structured-outputs)

## Function Calling：模型提议，应用执行

工具调用的完整循环是：定义工具 → 模型返回 `function_call` → 应用解析并校验参数 → 执行真实函数 → 用同一个 `call_id` 返回 `function_call_output` → 模型生成最终回答。

```ts
const tools: OpenAI.Responses.Tool[] = [{
  type: "function",
  name: "get_order_status",
  description: "根据当前已登录用户和订单号查询订单状态",
  parameters: {
    type: "object",
    properties: { orderId: { type: "string" } },
    required: ["orderId"],
    additionalProperties: false,
  },
  strict: true,
}];

let response = await openai.responses.create({
  model: process.env.OPENAI_MODEL!,
  instructions: "需要订单实时状态时使用工具，不要猜测。",
  input: "我的订单 A123 到哪了？",
  tools,
});

const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];

for (const item of response.output) {
  if (item.type !== "function_call") continue;
  if (item.name !== "get_order_status") throw new Error("未知工具");

  const args = JSON.parse(item.arguments) as { orderId: string };
  // 服务端函数必须再次校验参数和当前用户权限
  const result = await getOrderStatus(currentUser.id, args.orderId);

  toolOutputs.push({
    type: "function_call_output",
    call_id: item.call_id,
    output: JSON.stringify(result),
  });
}

if (toolOutputs.length > 0) {
  response = await openai.responses.create({
    model: process.env.OPENAI_MODEL!,
    previous_response_id: response.id,
    instructions: "根据工具结果回答；不要暴露内部字段。",
    input: toolOutputs,
    tools,
  });
}

console.log(response.output_text);
```

不要让模型决定授权，不要用 `eval` 执行参数，也不要把工具调用结果直接渲染成 HTML 或 shell 命令。并行工具调用时，要逐个保留并回传对应的 `call_id`。[OpenAI Function Calling 指南](https://developers.openai.com/api/docs/guides/function-calling)

## 错误、重试与可观测性

SDK 对连接错误、408、409、429 和部分服务端错误默认进行有限重试。重试不是越多越好：写操作要使用幂等设计，交互请求要设总时限，持续 429 应通过排队、限流或降级处理。

```ts
try {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL!,
    input: "健康检查",
  });

  logger.info({
    requestId: response._request_id,
    responseId: response.id,
    usage: response.usage,
  });
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    logger.error({
      status: error.status,
      requestId: error.request_id,
      name: error.name,
    });
  }
  throw error;
}
```

官方 SDK 会从 `x-request-id` 暴露 `_request_id`，错误对象也包含 `request_id`，这是与供应商排查问题的重要关联键。[OpenAI Node SDK](https://github.com/openai/openai-node)

生产日志建议记录模型、提示包版本、响应与请求 ID、延迟、用量、停止原因、工具名与结果状态；默认不要记录密钥、完整用户隐私数据或未经脱敏的工具结果。

## 上线检查清单

- API Key 仅在服务端，仓库和浏览器包中都不存在；
- 模型、Prompt、工具 Schema 和输出 Schema 都有版本；
- 所有外部输入和工具参数均经过长度、类型与权限校验；
- 流式请求能取消，普通请求有超时与有限重试；
- 结构化输出处理拒绝、截断和解析失败；
- 工具写操作有确认、幂等、审计与最小权限；
- 日志保存请求 ID、用量和版本，但不泄露敏感正文；
- 上线前用固定评测集回归，而不是只跑一次示例。

## 小结

OpenAI SDK 的关键不在“发出一个请求”，而在正确处理 Responses API 的多类型输出、流式事件、结构化结果和工具闭环。把密钥与权限留在服务端，把模型当作决策建议者，把 Schema、超时、重试、日志和评测作为应用责任，才能得到可上线的集成。

## 参考资料

- [OpenAI：JavaScript / TypeScript 官方 SDK](https://github.com/openai/openai-node)
- [OpenAI：Text generation](https://developers.openai.com/api/docs/guides/text)
- [OpenAI：Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [OpenAI：Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
