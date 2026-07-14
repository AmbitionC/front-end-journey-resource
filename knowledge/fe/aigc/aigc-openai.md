## 先澄清标题中的 OpenAPI

这里“GPT 的 OpenAPI”指的是调用 **OpenAI API**。严格来说，OpenAPI 是一套描述 HTTP 接口的规范，与公司名 OpenAI 不是同一个概念。本文聚焦从自己的服务端调用 GPT 文本模型的最短生产路径。

对于新建文本应用，OpenAI 官方推荐 Responses API。Chat Completions 仍受支持，但不应再作为新教程的默认起点。

![从浏览器到 OpenAI Responses API 的请求链路](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/aigc-openai-responses-minimal-v2.png)

## 一、准备服务端环境

安装官方 Node SDK：

```bash
npm install openai
```

在部署平台的密钥管理或本地 `.env` 中设置：

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5-mini
```

密钥只能存在于服务端。不要使用 `VITE_`、`NEXT_PUBLIC_` 等会注入浏览器的环境变量前缀，也不要为了绕过 SDK 的保护选项而允许浏览器直连。

模型会持续更新，代码最好读取 `OPENAI_MODEL`。示例中的默认值只是可运行起点，上线应根据账号当前可用模型、质量评测、延迟和成本选择。

## 二、第一次调用 Responses API

```ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45_000,
  maxRetries: 2,
});

const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  instructions: "你是前端学习助手。使用中文，先给结论，再解释原因。",
  input: "为什么浏览器不能直接保存模型 API Key？",
});

console.log(response.output_text);
console.log(response.id);
```

几个字段的职责：

- `model`：选用的模型，生产环境通过配置控制。
- `instructions`：本次请求的高层行为规则。
- `input`：用户输入，可以是字符串或结构化消息列表。
- `output_text`：SDK 汇总好的文本便利字段。
- `id`：OpenAI 响应 ID，可用于排查与关联日志。

不要依赖 `output[0]` 一定是文本。Responses 的 `output` 还可能包含工具调用等其他条目；只取文本时优先使用 `output_text`。

## 三、直接用 HTTP 理解底层请求

SDK 最终发送的是 HTTPS 请求。理解原始接口有助于排查代理、运行时或 SDK 问题：

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-mini",
    "input": "用一句话解释事件循环"
  }'
```

实际执行时应使用环境变量，不要把真实密钥写入 Shell 历史、截图或文档。浏览器也不应直接执行这段请求；浏览器调用的是自己的 `/api/chat`，由服务端代为调用 OpenAI。

## 四、在自己的 API 路由中封装

```ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const user = await requireLogin(request);
  const { message } = await request.json();

  if (typeof message !== "string" || message.length > 8_000) {
    return Response.json({ code: "INVALID_INPUT" }, { status: 400 });
  }

  await enforceUserQuota(user.id);

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    instructions: "回答用户的技术问题；不确定时明确说明。",
    input: message,
  });

  return Response.json({
    text: response.output_text,
    requestId: response._request_id,
    usage: response.usage,
  });
}
```

`_request_id` 是 SDK 从响应头提取的请求标识，适合日志关联。客户端可以拿到你自己的业务 request ID；是否把提供方 ID 返回给浏览器，应按隐私和排障需求决定。

## 五、流式输出

当回答较长时，可以让 SDK返回语义化事件：

```ts
const stream = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  input: "分步骤解释 HTTP 强缓存与协商缓存。",
  stream: true,
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta);
  }
  if (event.type === "response.completed") {
    console.log("\n完成");
  }
}
```

真实网站中，服务端应把这些提供方事件转换为自己的 `start`、`delta`、`done`、`error` 协议，再通过 SSE 传给浏览器。这样以后更换模型或增加工具时，前端无需理解每家提供方的事件结构。

流中途断开不等于请求从未执行。自动重试要结合幂等和副作用语义；客户端取消也必须通过 `AbortController` 传到服务端和 SDK。

## 六、多轮对话

Responses API 可以通过 `previous_response_id` 连接上下文：

```ts
const first = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  instructions: "你是 TypeScript 教练。",
  input: "解释泛型约束。",
});

const second = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  previous_response_id: first.id,
  instructions: "你是 TypeScript 教练。",
  input: "再给一个实际例子。",
});
```

需要特别注意：`instructions` 只作用于当前请求，不会因为设置 `previous_response_id` 自动继承，因此每轮都要提供仍然生效的规则。

另一种方式是由应用保存消息并显式发送。它更容易实现数据留存控制、跨模型迁移和对话编辑，但应用要自己做 token 预算、历史裁剪与摘要。无论哪种方式，都不要完全信任浏览器传来的历史记录。

## 七、结构化输出

业务代码不应靠正则从自然语言中“抠 JSON”。使用 Structured Outputs，把输出绑定到 Schema，并在服务端得到解析结果：

```ts
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const Review = z.object({
  summary: z.string(),
  risks: z.array(z.string()),
  recommendation: z.enum(["approve", "revise", "reject"]),
});

const response = await openai.responses.parse({
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  input: "评审这份发布计划：……",
  text: { format: zodTextFormat(Review, "release_review") },
});

const review = response.output_parsed;
```

Schema 合规不等于业务事实正确。金额、权限、库存、日期等仍需用数据库和确定性代码校验；对模型拒答、输出不完整和解析失败也要准备错误分支。

## 八、错误处理与重试

官方 SDK 会把非 2xx 响应转换成带状态码的 API 错误，并默认对部分可重试错误做有限重试。应用仍需要按业务分类：

```ts
try {
  await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input: "你好",
  });
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error({
      status: error.status,
      requestId: error.request_id,
      code: error.code,
    });
  }
  throw error;
}
```

原则如下：

- `400/422` 多为请求问题，修正参数，不盲目重试。
- `401/403` 检查服务端密钥、项目权限与环境配置。
- `429` 使用指数退避和随机抖动，同时限制自身并发。
- `5xx` 可有限重试；超过上限后降级并显示友好错误。
- 对写操作或工具副作用，只有具备幂等键时才可自动重试。

不要把 SDK 原始错误、堆栈、请求体或密钥返回给浏览器。对外只暴露稳定错误码和可重试标志。

## 九、成本、延迟与可观测性

每次请求建议记录：

- 自有 request ID 与 OpenAI request ID。
- 模型和提示版本。
- 总耗时、首字延迟、重试次数和结束原因。
- `usage` 中的输入/输出用量，以及估算成本。
- 用户/租户配额命中情况。

降低成本通常从四处入手：缩短无关上下文、限制最大输出、对稳定前缀使用缓存能力、为简单任务选择更小模型。但任何模型切换都要先跑真实任务评测；单纯“接口返回 200”不代表质量可接受。

生产日志应脱敏。除非确有合规依据，不要默认长期保存完整用户输入、模型回答、上传文件和工具返回内容。

## 十、常见误区

### 在 React/Vue 中直接创建 SDK

这会导致密钥被打包进前端。正确做法是前端调用自有 BFF。

### 所有任务都使用同一模型和长提示词

任务复杂度不同。将模型、提示版本、超时和输出上限配置化，并用评测决定路由。

### 只读取 `output[0].content[0]`

Responses 输出可能混合文本、工具调用等多种条目。纯文本使用 `output_text`，复杂流程按 `type` 分支处理。

### 流式就是逐 chunk 解析 JSON

网络 chunk 没有事件边界。服务端应消费 SDK 的语义事件；浏览器消费自有 SSE 时要跨 chunk 缓冲。

## 上线检查清单

- [ ] 使用 Responses API 作为新文本应用的默认接口。
- [ ] API Key 只在服务端密钥管理中，前端包不含任何密钥。
- [ ] 模型名、超时与重试策略通过环境配置。
- [ ] BFF 校验登录态、输入长度、频率、并发和预算。
- [ ] 流式事件经过自有协议规范化，并支持取消。
- [ ] 多轮对话明确管理 instructions 与历史可信来源。
- [ ] 结构化输出仍经过业务验证。
- [ ] 日志包含 request ID、usage 和延迟，但敏感内容已脱敏。
- [ ] 模型或提示升级前运行固定评测集。

## 参考资料

- [OpenAI：Text generation](https://developers.openai.com/api/docs/guides/text)
- [OpenAI：Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [OpenAI：Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Node SDK](https://github.com/openai/openai-node)
