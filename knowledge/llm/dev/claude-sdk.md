# Anthropic Claude SDK 使用指南

`@anthropic-ai/sdk` 是 Anthropic 官方提供的 TypeScript/Node.js SDK，用于调用 Claude 系列模型（Opus、Sonnet、Haiku）。与 OpenAI SDK 设计类似但有几处关键区别，了解这些差异能避免踩坑，也是面试中考察 LLM 接入经验的常见切入点。

## 安装与初始化

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

SDK 会自动读取 `ANTHROPIC_API_KEY` 环境变量，`apiKey` 可省略。

## 核心差异：Messages API 结构

Claude SDK 和 OpenAI SDK 最重要的结构区别：**`system` 是顶层参数，不放在 `messages` 数组里**。

```typescript
// ✅ Claude 正确写法
const response = await client.messages.create({
  model: 'claude-3-5-sonnet-...',   // 以官方文档为准
  max_tokens: 1024,                  // 必填，没有默认值
  system: '你是一个前端架构师，回答简洁专业。',  // 顶层参数
  messages: [
    { role: 'user', content: '什么是 React Server Components？' },
  ],
});
```

```typescript
// ❌ 常见错误：把 system 放进 messages 数组
messages: [
  { role: 'system', content: '...' },  // Claude 不支持这种写法
  { role: 'user', content: '...' },
]
```

### 响应结构

```typescript
const text = response.content[0].text;   // 文本内容
const stopReason = response.stop_reason; // 'end_turn' | 'max_tokens' | 'stop_sequence'
const usage = response.usage;            // { input_tokens, output_tokens }
```

注意：响应内容在 `response.content` 数组里，类型为 `ContentBlock[]`，文本块取 `block.text`。

## 模型选择

Claude 提供三个层次的模型，以官方文档为准获取最新 model ID：

| 系列 | 定位 |
|------|------|
| Opus | 最强推理能力，适合复杂任务 |
| Sonnet | 能力与速度均衡，日常首选 |
| Haiku | 极快响应、低成本，适合简单任务 |

> model 字段的具体字符串（如 `claude-3-5-sonnet-...`）请以 [官方文档](https://docs.anthropic.com) 为准，版本迭代较快。

## Streaming 流式响应

推荐使用 SDK 内置的 stream helper，比手动处理 SSE 更简洁：

```typescript
const stream = client.messages.stream({
  model: 'claude-3-5-sonnet-...',
  max_tokens: 1024,
  messages: [{ role: 'user', content: '解释 CSS 盒模型。' }],
});

// 方式一：逐 token 处理
stream.on('text', (text) => {
  process.stdout.write(text);
});

// 等待完成并获取最终消息
const finalMessage = await stream.finalMessage();
console.log('总 token 用量:', finalMessage.usage);
```

也可以用 `for await` 直接遍历原始事件流：

```typescript
const stream = await client.messages.create({
  model: 'claude-3-5-sonnet-...',
  max_tokens: 1024,
  messages: [...],
  stream: true,
});

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

## 多轮对话

Claude 的多轮对话和 OpenAI 一样，需要手动维护 messages 历史。注意 `messages` 数组必须以 `user` 角色开头，且 `user`/`assistant` 必须交替出现：

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const history: Anthropic.MessageParam[] = [];

async function chat(userInput: string): Promise<string> {
  history.push({ role: 'user', content: userInput });

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-...',
    max_tokens: 1024,
    system: '你是一个代码审查专家。',
    messages: history,
  });

  const reply = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  history.push({ role: 'assistant', content: reply });
  return reply;
}
```

## Tool Use 工具调用基础

Claude 支持 function calling（称为 Tool Use），允许模型请求调用外部工具：

```typescript
const response = await client.messages.create({
  model: 'claude-3-5-sonnet-...',
  max_tokens: 1024,
  tools: [
    {
      name: 'get_weather',
      description: '获取指定城市的当前天气',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
        },
        required: ['city'],
      },
    },
  ],
  messages: [{ role: 'user', content: '北京今天天气怎么样？' }],
});

// 检查模型是否请求调用工具
if (response.stop_reason === 'tool_use') {
  const toolUse = response.content.find(b => b.type === 'tool_use');
  console.log('模型想调用:', toolUse?.name, '参数:', toolUse?.input);
  // 执行工具 → 将结果以 tool_result 形式追加到 messages 继续对话
}
```

完整的 Tool Use 循环较复杂，以官方文档为准了解 `tool_result` 的格式要求。

## 错误处理

```typescript
import Anthropic from '@anthropic-ai/sdk';

try {
  const response = await client.messages.create({ ... });
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    console.error(error.status);   // HTTP 状态码
    console.error(error.message);
    console.error(error.error);    // 原始错误对象
  }
}
```

常见错误：
- `401`：API Key 无效
- `429`：请求频率超限
- `529`：服务过载（Claude 特有），需要退避重试

## 面试常问

**Q：Claude SDK 和 OpenAI SDK 最大的结构区别是什么？**

最常见的区别是 `system` prompt 的位置：OpenAI 把它放在 `messages` 数组里作为 `role: 'system'` 的消息，而 Claude 把 `system` 作为顶层参数与 `messages` 平级。另外 Claude 的 `max_tokens` 是必填的，没有默认值。

**Q：为什么 messages 数组里不能出现连续的 user 消息？**

Claude 要求对话轮次严格交替（user → assistant → user → ...），这是模型训练时的对话格式约束。实践中如果有多个用户输入，可以合并成一条 user 消息，或在中间插入一条简短的 assistant 占位消息。

**Q：stop_reason 有哪些值，分别代表什么？**

`end_turn`：模型正常完成输出；`max_tokens`：达到 `max_tokens` 上限被截断；`stop_sequence`：触发了自定义的停止序列；`tool_use`：模型请求调用工具，需要继续对话。

**Q：如何估算 token 用量？**

每次响应的 `usage` 字段包含 `input_tokens` 和 `output_tokens`。流式响应结束后通过 `stream.finalMessage()` 获取完整的 usage 统计。具体计费以官方文档为准。

## 常见错误与最佳实践

- **`max_tokens` 是必填项**，漏写会报参数错误，没有隐式默认值
- **messages 必须以 `user` 开头**，且 role 严格交替
- **不要把 `system` 放进 `messages` 数组**，这是从 OpenAI 迁移时最常见的错误
- **使用 `stream helper` 而非手动解析 SSE**，SDK 内置的 `.stream()` 处理了断连重试等边界情况
- **context 过长时及时截断**，token 超出 context window 会报错
