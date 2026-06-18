OpenAI API 是目前前端开发者接入大语言模型能力的最主流方式之一，掌握其核心概念、安全接入方式与常见集成模式，是现代前端工程师的必备技能。

## OpenAI API 能力概览

OpenAI 提供了多个核心 API 端点，覆盖了 AIGC 应用开发的大部分场景：

| 能力 (Capability) | 端点 (Endpoint) | 典型用途 |
|---|---|---|
| 对话补全 (Chat Completions) | `/v1/chat/completions` | 聊天机器人、问答、内容生成 |
| 图像生成 (Image Generation) | `/v1/images/generations` | DALL-E 文生图、图片编辑 |
| 文本嵌入 (Embeddings) | `/v1/embeddings` | 语义搜索、文本相似度 |
| 语音处理 (Audio) | `/v1/audio/transcriptions` | 语音转文字 (Whisper)、文字转语音 |
| 内容审核 (Moderation) | `/v1/moderations` | 用户内容安全过滤 |
| 函数调用 (Function Calling) | Chat API 扩展 | 结构化输出、工具调用 |

对于前端开发者而言，使用最频繁的是**对话补全**与**文本嵌入**，前者驱动了绝大多数 AI 交互界面，后者支撑了知识库检索和语义搜索。

## API Key 安全配置

### 绝对不能做的事

**API Key 永远不能出现在前端代码中。** 这是最重要的安全原则，没有之一。

```typescript
// ❌ 错误示例 — 直接在前端调用 OpenAI
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    Authorization: `Bearer sk-proj-xxxxxxxxxxxxxxxx`, // 🚨 Key 暴露在浏览器中
  },
  // ...
})
```

浏览器的网络面板、JavaScript bundle、版本控制历史都会泄漏 Key，导致：
- API 额度被恶意消耗
- 产生意外账单
- 账号被 OpenAI 封禁

### 正确做法：环境变量 + 服务端

在服务端（Node.js / Next.js 等）通过环境变量读取 Key：

```bash
# .env（加入 .gitignore，永远不提交）
OPENAI_API_KEY=sk-proj-...
```

```typescript
// server/config.ts
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY, // ✅ 仅服务端可读
}
```

## 为什么需要后端代理 (BFF Proxy)

即使你愿意公开 Key，直接从浏览器调用 OpenAI 也存在两个根本性问题：

**1. CORS 限制 (Cross-Origin Resource Sharing)**
OpenAI API 不对浏览器请求开放跨域头，浏览器会因 CORS 策略直接拦截请求，请求根本无法到达 OpenAI 服务器。

**2. Key 泄漏风险**
即便 CORS 能绕过，Authorization Header 中的 API Key 在浏览器 DevTools 中清晰可见。

解决方案是引入 BFF（Backend For Frontend）代理层：

```mermaid
sequenceDiagram
    participant B as Browser
    participant BFF as BFF Server<br/>(Node.js / Next.js)
    participant OAI as OpenAI API

    B->>BFF: POST /api/chat { messages }
    Note over BFF: 验证用户身份<br/>注入 API Key
    BFF->>OAI: POST /v1/chat/completions<br/>Authorization: Bearer sk-...
    OAI-->>BFF: { choices: [...] }
    BFF-->>B: { content: "..." }
```

BFF 层还承载了：鉴权、限流、日志、成本归因等业务逻辑。

## BFF 代理实现

### Next.js API Route 方案（推荐）

```typescript
// app/api/chat/route.ts (Next.js App Router)
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 以官方文档为准
})

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  // 基础鉴权（实际项目应验证 session/JWT）
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  })

  return NextResponse.json({
    content: completion.choices[0].message.content,
  })
}
```

### Express 代理方案

```typescript
// server/routes/chat.ts
import express from 'express'
import OpenAI from 'openai'

const router = express.Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    })
    res.json({ content: completion.choices[0].message.content })
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

export default router
```

## 第一个完整调用示例

### 服务端（BFF）

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  })

  return NextResponse.json({
    content: completion.choices[0].message.content,
    usage: completion.usage,
  })
}
```

### 客户端（React）

```typescript
// components/ChatDemo.tsx
import { useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          {m.content}
        </div>
      ))}
      {loading && <div>思考中...</div>}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>发送</button>
    </div>
  )
}
```

## Chat API 核心参数详解

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',   // 模型选择，影响能力与成本
  messages: [             // 对话历史，角色 system/user/assistant
    { role: 'system', content: '你是一个专业的前端工程师助手' },
    { role: 'user', content: '解释一下 React Fiber 架构' },
  ],
  temperature: 0.7,       // 0~2，越高越随机/创意，越低越确定/保守
  max_tokens: 2048,       // 响应最大 token 数（以官方文档为准）
  top_p: 1,               // 核采样概率，与 temperature 二选一调整
  frequency_penalty: 0,   // -2~2，降低重复词汇的概率
  presence_penalty: 0,    // -2~2，鼓励谈论新话题
  stop: ['\n\n'],         // 遇到指定字符串时停止生成
  n: 1,                   // 返回几个候选答案
})
```

| 参数 | 推荐值 | 适用场景 |
|---|---|---|
| `temperature` | 0.2 | 代码生成、事实问答 |
| `temperature` | 0.7 | 通用对话、内容生成 |
| `temperature` | 1.0+ | 创意写作、头脑风暴 |
| `max_tokens` | 按需设置 | 避免超出预算 |
| `frequency_penalty` | 0.3~0.5 | 长文生成防止复读 |

## 流式响应 (Streaming)

流式输出让用户看到"逐字打印"效果，大幅提升感知速度。

### BFF 流式代理

```typescript
// app/api/chat/stream/route.ts
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true, // 开启流式
  })

  // 将 OpenAI stream 转为 ReadableStream 返回客户端
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta })}\n\n`))
        }
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

### 客户端消费流 (SSE)

```typescript
// hooks/useStreamChat.ts
export async function streamChat(
  messages: Message[],
  onDelta: (delta: string) => void,
) {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const text = decoder.decode(value)
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const { delta } = JSON.parse(line.slice(6))
        onDelta(delta)
      }
    }
  }
}
```

## 图像生成 DALL-E

```typescript
// app/api/image/route.ts
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  const response = await openai.images.generate({
    model: 'dall-e-3',      // 以官方文档为准
    prompt,
    n: 1,
    size: '1024x1024',      // 支持尺寸以官方文档为准
    quality: 'standard',    // standard | hd
    response_format: 'url', // url | b64_json
  })

  return NextResponse.json({ url: response.data[0].url })
}
```

客户端只需 POST `{ prompt: "一只在月球上的宇航员柴犬" }` 即可拿到图片 URL。图像生成按张计费，建议在 BFF 层增加用户调用频率限制（Rate Limiting）。

## 文本嵌入 (Embeddings) 与语义搜索

嵌入（Embedding）是将文本转化为高维向量（浮点数数组）的技术，语义相近的文本在向量空间中距离更近，是语义搜索 (Semantic Search)、RAG（检索增强生成）的底层基础。

```typescript
// 生成嵌入向量
const embeddingRes = await openai.embeddings.create({
  model: 'text-embedding-3-small', // 以官方文档为准
  input: '如何用 React 实现虚拟滚动',
})
const queryVector = embeddingRes.data[0].embedding // number[]

// 余弦相似度计算
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (normA * normB)
}

// 在知识库中找最相关的文档
const results = knowledgeBase
  .map(doc => ({ ...doc, score: cosineSimilarity(queryVector, doc.vector) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
```

典型应用：将文档库提前向量化存入向量数据库（如 Pinecone、pgvector），用户查询时先检索相关文档，再拼入 Chat API 的 `system` prompt 实现 RAG。

## 限流与错误处理

OpenAI API 有 RPM（每分钟请求数）、TPM（每分钟 Token 数）两类限额，超出时返回 HTTP 429。

```typescript
// utils/openaiWithRetry.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function chatWithRetry(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  maxRetries = 3,
): Promise<OpenAI.Chat.ChatCompletion> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await openai.chat.completions.create(params)
    } catch (err: any) {
      if (err.status === 429 && attempt < maxRetries) {
        // 指数退避 (Exponential Backoff)：1s, 2s, 4s...
        const waitMs = Math.pow(2, attempt) * 1000
        console.warn(`Rate limited, retrying in ${waitMs}ms`)
        await sleep(waitMs)
        continue
      }
      // 非 429 错误或已达最大重试次数，直接抛出
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}
```

| 错误码 | 含义 | 处理策略 |
|---|---|---|
| 401 | API Key 无效或未授权 | 检查 Key 配置 |
| 429 | 超出限流配额 | 指数退避重试 |
| 500/503 | OpenAI 服务端错误 | 短暂等待后重试 |
| 400 | 请求参数错误 | 检查请求体格式 |

## 成本管理与 Token 优化

OpenAI 按 Token（词元）计费。一个汉字约 1.5~2 个 Token，英文约 4 字符 1 Token（以官方 Tokenizer 为准）。

**模型选择建议：**

| 场景 | 推荐模型 | 原因 |
|---|---|---|
| 高频简单问答、自动补全 | `gpt-4o-mini` | 成本低，速度快 |
| 复杂推理、代码生成 | `gpt-4o` | 能力更强 |
| 大批量文本处理 | Batch API | 折扣价格（以官方文档为准） |
| 语义检索 | `text-embedding-3-small` | 成本低维度够用 |

**Token 压缩技巧：**

```typescript
// ✅ 裁剪历史消息，只保留最近 N 轮
function trimMessages(messages: Message[], maxTokenEstimate = 3000): Message[] {
  // 粗估：每条消息约 50 token，保守取近 20 条
  return messages.slice(-20)
}

// ✅ System prompt 保持简洁，避免长篇角色设定
const SYSTEM_PROMPT = '你是前端技术助手，回答简洁准确。'

// ✅ 使用 max_tokens 限制输出长度，防止超额
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  max_tokens: 512, // 按实际需求设定上限
})
```

## 常见前端集成模式

### 模式一：聊天界面 (Chat UI)

核心是维护一个 `messages` 数组，每次对话追加消息后整体发送给 API，形成上下文连贯的对话。注意要**在 BFF 层限制历史长度**，防止 Token 超出上限。

### 模式二：智能自动补全 (Autocomplete)

```typescript
// 用户停止输入 500ms 后触发补全
const debouncedComplete = useMemo(
  () =>
    debounce(async (text: string) => {
      const res = await fetch('/api/complete', {
        method: 'POST',
        body: JSON.stringify({ prefix: text }),
      })
      const { suggestion } = await res.json()
      setSuggestion(suggestion)
    }, 500),
  [],
)
```

### 模式三：内容生成 (Content Generation)

通过精心设计的 `system` prompt 约束输出格式，结合 `response_format: { type: 'json_object' }` 获取结构化 JSON 输出，再渲染到 UI。

### 完整架构图

```mermaid
graph TB
    subgraph Browser["浏览器 (Browser)"]
        UI[React UI 组件]
        Hook[useChat Hook]
    end

    subgraph BFF["BFF Server (Next.js / Node.js)"]
        Auth[鉴权中间件]
        RateLimit[限流控制]
        ChatRoute[/api/chat]
        StreamRoute[/api/chat/stream]
        ImageRoute[/api/image]
        Logger[日志 & 成本记录]
    end

    subgraph OpenAI["OpenAI API"]
        Chat[Chat Completions]
        Images[Images DALL-E]
        Embed[Embeddings]
    end

    UI -->|fetch POST| Hook
    Hook -->|HTTP /api/chat| Auth
    Auth --> RateLimit
    RateLimit --> ChatRoute
    RateLimit --> StreamRoute
    RateLimit --> ImageRoute
    ChatRoute --> Logger
    StreamRoute --> Logger
    ImageRoute --> Logger
    ChatRoute -->|API Key in env| Chat
    StreamRoute -->|SSE stream| Chat
    ImageRoute --> Images
    Logger -.-> Chat
```

---

## 常见错误

**1. 将 API Key 硬编码在前端代码或 `.env.local` 中直接暴露给客户端**
Next.js 中，只有 `NEXT_PUBLIC_` 前缀的环境变量才会注入客户端，确保 `OPENAI_API_KEY` 不带此前缀。

**2. 没有裁剪对话历史，导致 Context Length 超限**
长对话不加处理会超出模型最大 Token 限制，需在 BFF 层主动截断历史。

**3. 流式接口忘记设置正确的 Response Headers**
SSE 必须返回 `Content-Type: text/event-stream` 且禁用缓存，否则浏览器无法正确解析。

**4. 忽略 429 错误，直接向用户报错**
应实现指数退避重试，对用户展示"正在处理"状态而非错误提示。

**5. 每次请求都重新实例化 OpenAI 客户端**
`new OpenAI()` 应在模块级别单例化，避免重复创建连接池。

**6. 不控制 `max_tokens`，被超长回复消耗大量费用**
生产环境始终为不同场景设定合理上限。

---

## 最佳实践

- **Key 隔离**：不同环境（开发/测试/生产）使用不同 API Key，便于用量追踪和泄漏溯源
- **BFF 必选**：任何面向用户的产品都必须通过 BFF 代理，绝不直连
- **用量监控**：在 BFF 层记录每次调用的 Token 消耗，按用户/功能聚合，及时发现异常
- **Prompt 版本管理**：将 System Prompt 作为配置文件管理，便于 A/B 测试与回滚
- **模型分级**：简单任务用轻量模型，复杂任务才升级，避免一刀切使用最贵模型
- **错误降级**：API 不可用时给用户友好提示，关键功能应有非 AI 降级路径
- **流式优先**：涉及长文本生成时默认使用流式接口，提升感知响应速度
- **Embedding 预计算**：知识库文档的向量化应在构建/入库阶段完成，不应在请求时实时计算

---

## 面试常问

**Q1：为什么不能在前端直接调用 OpenAI API？**

有两个根本原因：一是 CORS 策略，OpenAI 服务器不允许来自浏览器的跨域请求；二是 API Key 安全，Key 一旦出现在客户端代码中就等于公开，任何人都可以拿去消耗你的额度，产生高额账单。正确做法是通过 BFF（Backend For Frontend）代理层转发请求，API Key 仅存在于服务器环境变量中。

**Q2：如何实现"打字机"流式输出效果？**

在 BFF 层调用 OpenAI Chat API 时设置 `stream: true`，将返回的 AsyncIterable 逐 chunk 转换为 SSE（Server-Sent Events）格式发送给客户端。客户端通过 `ReadableStream` 读取响应体，解析 SSE 数据后逐步 append 到 UI 文本节点。关键是 BFF 的响应头必须包含 `Content-Type: text/event-stream` 并禁用缓存。

**Q3：Token 是什么？如何估算成本？**

Token 是模型处理文本的基本单位，大致为：英文 1 Token ≈ 4 个字符，中文 1 Token ≈ 0.5~1 个汉字（以官方 Tokenizer 工具为准）。费用 = (输入 Token + 输出 Token) × 单价，不同模型单价差异很大。优化方法包括：压缩 System Prompt、裁剪历史消息、限制 `max_tokens`、为简单任务选用轻量模型。

**Q4：遇到 429 Rate Limit 错误如何处理？**

应实现指数退避（Exponential Backoff）重试策略：第一次等 1 秒，第二次等 2 秒，第三次等 4 秒，最多重试 3 次。若仍失败则向用户返回"服务繁忙请稍后重试"的友好提示。生产系统还应在 BFF 层加用户级别的请求队列，防止并发流量打爆限额。

**Q5：什么是 Embedding（文本嵌入），在前端应用中有什么用？**

Embedding 是将文本映射到高维向量空间的技术，语义相近的文本向量距离更近。在前端应用中最常见的场景是**语义搜索**：将知识库文档提前向量化存储，用户搜索时将查询词向量化，通过余弦相似度找出最相关文档，再将其注入 Chat API 的上下文中（即 RAG 模式），让模型基于私有知识库回答问题，而不仅依赖模型训练数据。

**Q6：如何设计一个支持多用户的 AI 聊天 BFF？**

核心要素：① 鉴权中间件验证用户 Token/Session；② 按用户 ID 进行限流（如每用户每分钟 10 次）；③ 将对话历史存储在服务端（Redis/DB），客户端只传 sessionId；④ 记录每次调用的 Token 消耗与费用，按用户聚合；⑤ 对 system prompt 做统一注入，避免客户端篡改角色设定；⑥ 流式响应使用 SSE 而非 WebSocket，减少服务器连接维持成本。
