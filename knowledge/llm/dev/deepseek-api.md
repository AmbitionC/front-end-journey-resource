DeepSeek 是国内领先的大语言模型，以极高的性价比著称——在多项基准测试上接近 GPT-4 级别的表现，但 API 调用成本远低于同级产品。对于前端或全栈开发者来说，掌握 DeepSeek API 的接入方式，既能快速构建 AI 功能，又能有效控制成本。

## DeepSeek 的核心优势

DeepSeek 提供了与 OpenAI 完全兼容的 API 接口。这意味着你不需要学习新的 SDK——直接使用 `openai` npm 包，修改 `baseURL` 即可切换到 DeepSeek 后端。这种兼容性大大降低了迁移和接入成本。

主要模型系列（具体模型 ID 以官方文档为准）：

| 模型系列 | 适用场景 |
|---|---|
| `deepseek-chat` | 通用对话、文本生成、代码辅助 |
| `deepseek-reasoner` | 复杂推理、数学、逻辑分析 |

## 环境准备

在 [DeepSeek 开放平台](https://platform.deepseek.com) 注册账号并申请 API Key，然后安装依赖：

```bash
npm install openai
```

将 API Key 存入环境变量，**切勿硬编码在源码中**：

```env
DEEPSEEK_API_KEY=your_api_key_here
```

## 基础对话接入

利用 OpenAI SDK 的 `baseURL` 参数指向 DeepSeek 端点：

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

async function chat(userMessage: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'deepseek-chat', // 以官方文档为准
    messages: [
      { role: 'system', content: '你是一个专业的前端开发助手。' },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0].message.content ?? '';
}

// 使用示例
const answer = await chat('解释一下 React useCallback 的使用场景');
console.log(answer);
```

## 流式响应（Streaming）

对于需要实时输出的场景（如聊天界面），流式响应可以显著提升用户体验：

```typescript
async function streamChat(userMessage: string): Promise<void> {
  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      process.stdout.write(delta); // 或推送到前端
    }
  }
}
```

流式接入配合 SSE（Server-Sent Events）可以将 token 实时推送到浏览器，详见《SSE 流式响应实现详解》。

## 在 Next.js API Route 中接入

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: message }],
  });

  return Response.json({
    content: response.choices[0].message.content,
  });
}
```

## 成本控制建议

DeepSeek 按 token 计费，输入和输出 token 价格不同。几个实用的控制手段：

- **system prompt 精简化**：system prompt 每次都会计入输入 token，保持简洁
- **合理截断上下文**：多轮对话中，只保留最近 N 轮历史，避免上下文无限增长
- **缓存高频问答**：对于固定问题（如 FAQ），在应用层缓存结果，不重复调用 API
- **选对模型**：简单任务用轻量模型，复杂推理才用 reasoner 系列

## 错误处理

```typescript
import OpenAI from 'openai';

async function safeChat(message: string) {
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(`API Error ${error.status}: ${error.message}`);
      // 429 = 超出速率限制，可加重试逻辑
      // 402 = 余额不足
    }
    throw error;
  }
}
```

## 面试常问

**Q: 为什么 DeepSeek 可以直接用 OpenAI SDK？**

DeepSeek 的 API 遵循 OpenAI Chat Completions 规范，接口路径、请求/响应结构完全一致。SDK 本质上是一个 HTTP 客户端，只需替换 `baseURL` 即可复用。

**Q: API Key 泄露了怎么办？**

立即在 DeepSeek 平台吊销旧 Key 并生成新 Key。前端项目中绝不能把 API Key 暴露在客户端代码里，所有 API 调用必须经过后端代理。

**Q: 如何评估模型效果？**

通过 `temperature`（创造性）和 `top_p`（采样范围）调参；建立测试集，对比不同模型在业务场景下的输出质量，再做模型选型决策。

---

> 具体的模型 ID、定价和速率限制以 [DeepSeek 官方文档](https://platform.deepseek.com/docs) 为准，接入前建议先阅读最新文档。
