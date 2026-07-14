通义千问在阿里云 Model Studio 中可通过多种接口调用。最常见的两条路径是：使用 OpenAI 兼容接口快速迁移现有应用，或使用 DashScope 原生接口获取更完整的厂商能力与参数。它们访问同一类模型服务，但“兼容”不等于所有字段、模型和行为完全相同。

## 先选地域、Workspace 与接口

接入前先确定三件事：

1. **资源地域**：API Key、Workspace、模型可用性和服务端点需要属于匹配的地域；
2. **Workspace**：部分地域推荐使用包含 Workspace ID 的专属域名；
3. **接口形态**：迁移与通用框架优先兼容接口，需要原生独有能力时选 DashScope。

官方文档当前列出 OpenAI-compatible Chat Completions、OpenAI-compatible Responses、Anthropic-compatible Messages 和 DashScope 原生接口；其中原生接口提供最完整的能力集合。[Model Studio 文本生成接口总览](https://www.alibabacloud.com/help/en/model-studio/qwen-api-reference/)

![业务服务先按地域与 Workspace 选择端点，再通过 OpenAI 兼容接口或 DashScope 原生接口调用 Qwen](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/qwen-dashscope-integration-v2.png)
*图：两条路径共享密钥保护、流式处理、工具校验、错误与用量监控，但请求参数和能力支持需要分别验证。*

## 方案一：OpenAI 兼容接口

如果应用已经使用 OpenAI SDK，只需把 API Key、`baseURL` 和模型名改为 Model Studio 配置，迁移成本最低。不要把端点写死在公共教程中：从当前 Workspace 控制台或官方地域表复制，并通过环境变量注入。

```bash
npm install openai
```

```env
DASHSCOPE_API_KEY=你的服务端密钥
DASHSCOPE_BASE_URL=https://你的地域与Workspace端点/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

```ts
import OpenAI from "openai";

const qwen = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
  maxRetries: 2,
  timeout: 30_000,
});

const completion = await qwen.chat.completions.create({
  model: process.env.QWEN_MODEL!,
  messages: [
    { role: "system", content: "你是技术文档助手。不确定时明确说明。" },
    { role: "user", content: "用一个例子解释 TypeScript 泛型约束。" },
  ],
});

console.log(completion.choices[0]?.message.content);
console.log(completion.usage);
```

官方兼容接口文档明确要求按地域配置 `BASE_URL`，并建议把 API Key 放入环境变量以降低暴露风险；示例模型 `qwen-plus` 只是演示，实际应从当前支持列表选择并纳入评测。[OpenAI-compatible Chat 文档](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope)

### 为什么不能假设“完全兼容”

兼容层通常覆盖常用请求与响应形状，但以下内容仍可能不同：

- 支持的模型、上下文、输出上限和地域；
- system 消息位置、角色交替等消息约束；
- `temperature`、`top_p`、`stop` 等参数范围与默认值；
- 工具调用、并行调用、结构化输出和流式组合的支持矩阵；
- 错误码、限流、请求 ID 和用量字段；
- Responses API 中内置工具与会话状态的厂商扩展。

因此多供应商适配器应只暴露经过验证的公共子集，并为每个供应商保留 capability map。切换 `baseURL` 并不能证明行为等价。

## 流式输出

使用 SDK 返回的异步迭代器处理 chunk，不要手写按行切 JSON：

```ts
const stream = await qwen.chat.completions.create({
  model: process.env.QWEN_MODEL!,
  messages: [{ role: "user", content: "逐步解释浏览器缓存。" }],
  stream: true,
  stream_options: { include_usage: true },
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);

  if (chunk.usage) {
    console.log("\nusage:", chunk.usage);
  }
}
```

官方示例说明，启用 `stream_options.include_usage` 后，用量可能在最后一个没有 `choices` 的 chunk 中返回，所以不能只处理 `choices[0]`。不同模型对“流式 + 工具”的组合支持可能不同，必须查看所选模型的当前说明。[OpenAI-compatible Chat 文档](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope)

## 工具调用

兼容接口用 OpenAI 风格的 `tools` 描述函数。模型只生成调用建议，真实函数仍在你的服务端执行。

```ts
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [{
  type: "function",
  function: {
    name: "get_order_status",
    description: "查询当前登录用户拥有的订单状态",
    parameters: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
      additionalProperties: false,
    },
  },
}];

const first = await qwen.chat.completions.create({
  model: process.env.QWEN_MODEL!,
  messages: [{ role: "user", content: "订单 A123 到哪了？" }],
  tools,
});

const call = first.choices[0]?.message.tool_calls?.[0];
if (call?.type === "function" && call.function.name === "get_order_status") {
  const args = JSON.parse(call.function.arguments) as { order_id?: unknown };
  if (typeof args.order_id !== "string") throw new Error("参数错误");

  // 服务端必须检查 currentUser 对订单的访问权限
  const result = await getOrderStatus(currentUser.id, args.order_id);
  // 后续请求需保留 assistant 的 tool_calls，并用相同 tool_call_id 回传结果
}
```

生产实现还要处理多个 tool calls、未知工具、参数 Schema、工具超时、写操作幂等与人工确认。不要把模型生成的订单 ID、用户 ID 或角色当作可信授权信息。

## 方案二：DashScope 原生接口

原生接口适合以下情况：

- 需要兼容层尚未覆盖的模型参数或多模态能力；
- 希望直接采用官方原生请求、响应和错误语义；
- 需要按 Model Studio 文档精确控制厂商特性；
- 应用本来就以 DashScope SDK / REST 为主，而非多供应商统一层。

原生接口并非天然“更好”，而是能力更完整、耦合也更深。设计适配层时，可以把业务调用抽象成自己的接口：

```ts
type GenerateRequest = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  stream?: boolean;
};

interface LlmProvider {
  generate(request: GenerateRequest): Promise<unknown>;
  capabilities(): {
    tools: boolean;
    structuredOutput: boolean;
    streamingTools: boolean;
  };
}
```

兼容适配器与原生适配器分别翻译参数、错误和用量；业务层不直接依赖供应商响应的任意字段。这样才能在切换接口时显式处理差异，而不是用大量 `if (provider === ...)` 污染业务代码。

## 模型选择与配置

不要继续沿用“turbo / plus / max 永远对应固定档位”的旧表格。模型目录会更新，且相同家族在不同地域的可用性、上下文和价格可能不同。正确流程是：

1. 从当前地域的[支持模型与能力列表](https://www.alibabacloud.com/help/en/model-studio/models)筛选候选；
2. 明确任务质量、延迟、成本、上下文与工具需求；
3. 用同一组真实评测数据比较候选；
4. 把最终模型 ID 写入版本化配置；
5. 升级模型或端点时重新回归，不依赖别名长期不变。

如果追求可复现性，优先使用文档提供的固定快照；如果选择会滚动更新的别名，就要接受行为漂移并持续监测。

## 错误、限流与可观测性

把错误分为三类处理：

- **调用方错误**：密钥、权限、参数、模型或地域不匹配；修正配置，不重试；
- **限流与容量**：429 或相应业务错误；采用指数退避、抖动、队列和并发限制；
- **暂时性服务或网络错误**：有限重试，并受业务总时限约束。

官方维护了详细的[Model Studio 错误码文档](https://www.alibabacloud.com/help/en/model-studio/error-code)。不要只记录“调用失败”，至少保留：接口类型、地域、Workspace、模型、HTTP 状态、厂商错误码、请求 ID、耗时、重试次数和 Token 用量。日志中不得出现 API Key 或未经脱敏的用户内容。

## 地域与数据边界

地域不是一个纯性能参数。它会影响端点、密钥、模型可用性、网络路径和数据治理。上线前应依据组织要求确认数据处理地域、日志保留和跨境策略，并用实际代码配置作为事实来源。不要在文章或代码中做“天然合规”之类的绝对承诺。

## 上线检查清单

- `DASHSCOPE_API_KEY` 只在服务端，且与地域 / Workspace 匹配；
- `baseURL` 来自当前控制台或官方文档，没有使用历史域名猜测；
- 模型 ID、接口类型和能力矩阵都已版本化；
- 兼容层只使用已测试参数，没有假定与 OpenAI 完全一致；
- 流式输出处理最后的 usage chunk 与客户端取消；
- 工具参数、身份、权限、超时和幂等由应用控制；
- 429 / 5xx 使用有限重试，并设置并发与总时限；
- 日志记录请求 ID、错误码、延迟和用量，不记录密钥；
- 端点或模型升级前运行集成测试与质量评测。

## 小结

接入 Qwen 的正确起点不是复制一段固定 URL，而是先确定地域、Workspace 和所需能力。OpenAI 兼容接口适合快速迁移和统一框架，DashScope 原生接口适合使用完整厂商能力。无论选择哪条路径，都要把差异显式建模，把密钥与权限留在服务端，并用当前文档、集成测试和可观测性保证线上可靠。

## 参考资料

- [Alibaba Cloud Model Studio：Text Generation API Reference](https://www.alibabacloud.com/help/en/model-studio/qwen-api-reference/)
- [Alibaba Cloud Model Studio：OpenAI-compatible Chat](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope)
- [Alibaba Cloud Model Studio：Supported Models and Capabilities](https://www.alibabacloud.com/help/en/model-studio/models)
- [Alibaba Cloud Model Studio：Error codes](https://www.alibabacloud.com/help/en/model-studio/error-code)
