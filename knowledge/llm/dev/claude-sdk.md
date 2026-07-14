Anthropic 官方 TypeScript SDK `@anthropic-ai/sdk` 是 Claude Messages API 的类型化客户端，提供消息、流式事件、错误重试和工具辅助能力。它负责可靠地调用 API，但不会替应用完成权限校验、工具执行、对话持久化和业务审计。

## 安装与初始化

```bash
npm install @anthropic-ai/sdk
```

```ts
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 2,
  timeout: 30_000,
});
```

`ANTHROPIC_API_KEY` 只应存在于服务端。官方 SDK 默认从环境变量读取密钥，并为请求、响应、流式事件和错误提供 TypeScript 类型。[Anthropic TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript)

## Messages API 的基本心智模型

Messages API 接收顶层 `system` 与一组 `user` / `assistant` 消息，返回一个 `Message`。`content` 不是单个字符串，而是内容块数组；常见块包括 `text`、`tool_use`，启用其他能力时还可能出现更多类型。

```ts
const message = await anthropic.messages.create({
  model: process.env.ANTHROPIC_MODEL!,
  max_tokens: 1024,
  system: "你是代码审查助手。只报告能够定位到具体代码的问题。",
  messages: [
    { role: "user", content: "审查：const total = items.reduce((a, b) => a + b.price, 0)" },
  ],
});

const text = message.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("");

console.log(text);
console.log(message.usage, message.stop_reason);
```

不要假设 `content[0]` 一定是文本，也不要忽略 `stop_reason`。`max_tokens` 达到上限、模型请求工具或正常结束，需要不同处理。

![TypeScript 服务通过 Messages API 接收内容块，校验并执行 tool_use，再用 tool_result 继续对话](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/claude-sdk-messages-tools-v2.png)
*图：只有 `tool_use` 路径进入参数校验和工具执行；普通 `text` 块可以直接组成回答。*

## 模型 ID 与推理配置

模型名称变化很快，不要把“最强”“最快”的结论永久写进代码。把模型 ID 放入配置，并在升级前用自己的评测集验证。Anthropic 当前模型文档说明，较新的模型 ID 本身是固定快照，而不是永远漂移的别名；也可通过 Models API 查询能力和 Token 限制。[Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)

截至 2026-07-14，官方示例使用如 `claude-opus-4-8` 等当前模型；生产代码仍建议使用环境变量：

```ts
const model = process.env.ANTHROPIC_MODEL;
if (!model) throw new Error("缺少 ANTHROPIC_MODEL");
```

不要把旧教程中的 `budget_tokens`、采样参数或模型名直接复制到新模型。当前模型可能使用自适应思考与 `effort`，支持组合也会随模型变化；应按选定模型的能力表配置，而不是依赖跨代默认值。

## 流式输出

SDK 提供两种常用方式：`messages.create({ stream: true })` 返回低开销异步事件迭代器；`messages.stream()` 提供文本回调与最终消息聚合。

```ts
const stream = anthropic.messages
  .stream({
    model: process.env.ANTHROPIC_MODEL!,
    max_tokens: 2048,
    messages: [{ role: "user", content: "解释浏览器渲染流水线。" }],
  })
  .on("text", (delta) => process.stdout.write(delta));

const finalMessage = await stream.finalMessage();
console.log("\nusage:", finalMessage.usage);
```

底层 SSE 会依次产生 `message_start`、`content_block_start`、`content_block_delta`、`content_block_stop` 和 `message_delta` 等事件。不要自己用字符串换行猜测 JSON 边界；使用 SDK 迭代器，并在客户端断开时取消流。[Anthropic Streaming Messages](https://platform.claude.com/docs/en/build-with-claude/streaming)

## 工具调用闭环

自定义工具在你的应用中执行。Claude 返回 `tool_use` 内容块和 `stop_reason: "tool_use"`；应用执行后，应保留这次 assistant 的完整内容块，再用对应 `tool_use_id` 发送 `tool_result`。

```ts
const tools: Anthropic.Tool[] = [{
  name: "get_order_status",
  description: "查询当前登录用户拥有的订单状态",
  input_schema: {
    type: "object",
    properties: { order_id: { type: "string" } },
    required: ["order_id"],
    additionalProperties: false,
  },
}];

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "订单 A123 到哪了？" },
];

const first = await anthropic.messages.create({
  model: process.env.ANTHROPIC_MODEL!,
  max_tokens: 1024,
  system: "需要实时订单数据时使用工具，不要猜测。",
  tools,
  messages,
});

const toolUse = first.content.find((block) => block.type === "tool_use");

if (toolUse?.type === "tool_use") {
  if (toolUse.name !== "get_order_status") throw new Error("未知工具");
  const input = toolUse.input as { order_id?: unknown };
  if (typeof input.order_id !== "string") throw new Error("参数错误");

  // 必须在服务端依据 currentUser 再做订单归属和权限校验
  const result = await getOrderStatus(currentUser.id, input.order_id);

  messages.push(
    { role: "assistant", content: first.content },
    {
      role: "user",
      content: [{
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      }],
    },
  );

  const final = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL!,
    max_tokens: 1024,
    system: "根据工具结果回答，不暴露内部字段。",
    tools,
    messages,
  });
}
```

并行工具调用可能一次返回多个 `tool_use` 块，应逐个执行并在同一后续 user 消息中返回相应 `tool_result`。工具错误也应以明确的错误结果返回，避免模型把超时或权限拒绝当作空数据。[Anthropic Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

SDK 也提供 Tool Runner 等辅助循环，但它不会消除业务校验责任。无论使用手写循环还是辅助器，都要限制工具列表、验证 Schema、实施最小权限，并为写操作设计确认与幂等。

## Prompt Caching

长而稳定的 system 指令、工具定义、示例或文档前缀会在每轮重复输入。Prompt Caching 可以复用相同前缀；当前 API 支持顶层自动缓存，也支持在内容块上设置显式 `cache_control`。

```ts
const message = await anthropic.messages.create({
  model: process.env.ANTHROPIC_MODEL!,
  max_tokens: 1024,
  cache_control: { type: "ephemeral" },
  system: "这里是跨轮次稳定的应用规则与知识前缀……",
  messages,
});
```

缓存键依赖前缀内容及顺序。应把稳定的 `tools`、`system`、示例放在前面，把时间戳、用户问题等动态内容放在后面；否则每次变化都会导致未命中。缓存降低重复处理成本，不会扩大上下文窗口，也不会替代对话裁剪。[Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

## 错误、重试与日志

官方 TypeScript SDK 默认对连接错误、408、409、429 和部分服务端错误做有限指数退避重试；可通过 `maxRetries` 调整。交互请求仍应设置业务总时限，持续限流要通过排队、并发控制或降级解决，而不是无限重试。[Anthropic TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript)

```ts
try {
  const { data: message, response } = await anthropic.messages
    .create({
      model: process.env.ANTHROPIC_MODEL!,
      max_tokens: 128,
      messages: [{ role: "user", content: "ping" }],
    })
    .withResponse();

  logger.info({
    requestId: response.headers.get("request-id"),
    usage: message.usage,
    stopReason: message.stop_reason,
  });
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    logger.error({ status: error.status, name: error.name });
  }
  throw error;
}
```

不要在生产环境长期打开包含请求体和响应体的 debug 日志。官方 SDK 也提醒，详细日志可能包含敏感正文；应使用脱敏字段、访问控制与保留期限。

## 上线检查清单

- 密钥只在服务端，模型 ID 与提示包版本可追踪；
- 按内容块类型处理响应，并检查 `stop_reason`；
- 流式连接可取消，最终消息和用量能正确聚合；
- `tool_use` 的名称、参数、身份与权限均由应用校验；
- assistant 内容块与 `tool_result` 的 ID 完整对应；
- 缓存前缀稳定，动态内容位于后部；
- 超时、有限重试、限流、请求 ID 和用量日志已配置；
- 模型或 Prompt 升级前跑固定评测集。

## 小结

Claude SDK 的核心抽象是“消息 + 内容块”。文本只是其中一种结果，工具调用需要应用完成一个可信的往返循环，流式输出需要按事件累积。把模型选择、缓存、重试、权限和可观测性一起设计，才能让示例代码变成可靠服务。

## 参考资料

- [Anthropic：TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript)
- [Anthropic：Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic：Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Anthropic：Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Anthropic：Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
