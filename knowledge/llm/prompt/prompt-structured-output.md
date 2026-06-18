# 结构化输出与 JSON Schema

LLM 默认输出自然语言，但程序需要结构化数据。结构化输出（Structured Output）技术让模型的回复直接符合预定义的 JSON Schema，省去解析自然语言的麻烦，是 LLM 集成到业务系统的关键环节。

## 为什么需要结构化输出

```typescript
// 不可靠：解析自由格式文本
const freeFormOutput = `
用户姓名是张三，年龄 28，职业是工程师。
`
// 需要复杂的正则或再次调用 LLM 来提取字段

// 可靠：直接获得 JSON
const structuredOutput = {
  name: "张三",
  age: 28,
  occupation: "工程师"
}
// 直接 JSON.parse，类型安全，可直接入库
```

**结构化输出的核心价值：**
- 消除输出格式的不确定性
- 与下游系统直接集成（数据库、API、UI 组件）
- 便于类型检查和自动化测试

## 方法一：Prompt 约束（通用）

最基础的方法是在 Prompt 中明确指定格式要求：

```typescript
const prompt = `
从以下文本中提取结构化信息，严格按照 JSON 格式返回，不要输出任何其他内容：

文本：「订单号 ORD-20241218-001，客户王芳，购买了 iPhone 15（2件）和 AirPods（1件），总金额约 9000 元，配送地址是上海市浦东新区某街道。」

输出格式：
{
  "order_id": "订单号",
  "customer_name": "客户姓名",
  "items": [
    { "name": "商品名", "quantity": 数量 }
  ],
  "total_amount": 总金额数字,
  "shipping_address": "地址"
}
`
```

**优点：** 通用，任何模型都可用。
**缺点：** 模型仍可能输出格式错误（多余文字、缺字段、JSON 语法错误），需要额外的错误处理。

## 方法二：Function Calling / Tool Use

通过工具调用机制强制模型生成符合 Schema 的参数：

```typescript
import OpenAI from 'openai'

const client = new OpenAI()

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: '从这段文本中提取用户信息：张三，28岁，软件工程师，北京。' }
  ],
  tools: [{
    type: 'function',
    function: {
      name: 'extract_user_info',
      description: '提取用户基本信息',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '用户姓名' },
          age: { type: 'integer', description: '用户年龄' },
          occupation: { type: 'string', description: '职业' },
          city: { type: 'string', description: '城市' },
        },
        required: ['name', 'age', 'occupation'],
      }
    }
  }],
  tool_choice: { type: 'function', function: { name: 'extract_user_info' } }
})

// 提取工具调用结果
const toolCall = response.choices[0].message.tool_calls?.[0]
if (toolCall) {
  const userInfo = JSON.parse(toolCall.function.arguments)
  console.log(userInfo) // { name: '张三', age: 28, occupation: '软件工程师', city: '北京' }
}
```

## 方法三：Structured Outputs API（OpenAI）

OpenAI 提供了原生的 Structured Outputs 支持，通过 `response_format` 参数传入 JSON Schema，**保证**输出严格符合 Schema：

```typescript
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const client = new OpenAI()

// 用 Zod 定义 Schema（推荐方式，类型安全）
const UserSchema = z.object({
  name: z.string(),
  age: z.number().int(),
  occupation: z.string(),
  skills: z.array(z.string()),
})

const response = await client.beta.chat.completions.parse({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: '张三，28岁，前端工程师，擅长 React 和 TypeScript。' }
  ],
  response_format: zodResponseFormat(UserSchema, 'user_info'),
})

const user = response.choices[0].message.parsed
// TypeScript 自动推断类型：{ name: string; age: number; occupation: string; skills: string[] }
```

## 方法四：Claude 的 Tool Use

Claude 同样支持通过工具使用来约束输出格式：

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const response = await client.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: 1024,
  tools: [{
    name: 'extract_order',
    description: '提取订单信息',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: { type: 'string' },
        customer: { type: 'string' },
        amount: { type: 'number' },
        status: {
          type: 'string',
          enum: ['pending', 'shipped', 'delivered', 'cancelled']
        }
      },
      required: ['order_id', 'customer', 'amount', 'status']
    }
  }],
  tool_choice: { type: 'tool', name: 'extract_order' },
  messages: [{
    role: 'user',
    content: '订单 ORD-001，客户李华，金额 299 元，已发货。'
  }]
})

const toolUse = response.content.find(b => b.type === 'tool_use')
if (toolUse && toolUse.type === 'tool_use') {
  const order = toolUse.input
  console.log(order)
}
```

## JSON Schema 设计要点

### 使用 enum 约束枚举值

```json
{
  "status": {
    "type": "string",
    "enum": ["active", "inactive", "pending"]
  }
}
```

### 嵌套对象和数组

```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "integer" },
        "name": { "type": "string" }
      },
      "required": ["id", "name"]
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

### 用 description 引导模型理解字段

```json
{
  "sentiment_score": {
    "type": "number",
    "description": "情感得分，-1 表示极负面，0 表示中性，1 表示极正面"
  }
}
```

## 错误处理

即使用了结构化输出 API，也应做防御性处理：

```typescript
function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    // 尝试提取 markdown 代码块中的 JSON
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (match) {
      try {
        return JSON.parse(match[1]) as T
      } catch {
        return fallback
      }
    }
    return fallback
  }
}
```

## 方法对比

| 方法 | 格式保证 | 兼容性 | 类型安全 | 适用场景 |
|------|---------|-------|---------|---------|
| Prompt 约束 | 弱 | 所有模型 | 无 | 简单场景、快速原型 |
| Function Calling | 强 | OpenAI / 兼容 API | 手动 | 工具集成 |
| Structured Outputs | 最强 | OpenAI 特定模型 | Zod 集成 | 生产级数据提取 |
| Claude Tool Use | 强 | Claude | 手动 | Claude 场景 |

## 面试常问

- 为什么不能直接让模型输出 JSON，而需要专门的结构化输出机制？
- Function Calling 和 Structured Outputs 有什么区别？
- 如何处理模型输出不符合 Schema 的情况？
- JSON Schema 中的 `required` 字段有什么重要性？
- Zod + OpenAI Structured Outputs 如何实现端到端的类型安全？
