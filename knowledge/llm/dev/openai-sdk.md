# OpenAI SDK 完整使用指南

OpenAI 官方提供了 Node.js/TypeScript SDK（npm 包名 `openai`），让开发者可以用几行代码调用 GPT 系列模型完成文本生成、对话、函数调用等任务。掌握它是对接 LLM 能力的基础，也是面试中经常被考察的实操知识点。

## 安装与初始化

```bash
npm install openai
```

初始化客户端时需要提供 API Key。推荐通过环境变量注入，不要硬编码在代码里。

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

SDK 会自动读取 `OPENAI_API_KEY` 环境变量，所以如果该变量已设置，`apiKey` 参数可以省略。

## 基础对话：Chat Completions

### messages 数组结构

Chat Completions API 的核心是 `messages` 数组，每条消息有两个必填字段：

| 字段 | 说明 |
|------|------|
| `role` | 消息角色：`system`、`user`、`assistant` |
| `content` | 消息内容，字符串或多模态内容数组 |

- `system`：设定模型的行为和角色，放在数组第一位
- `user`：用户输入
- `assistant`：模型的历史回复（多轮对话时需要带上）

### 基础调用示例

```typescript
const response = await client.chat.completions.create({
  model: 'gpt-4o',          // 具体可用模型以官方文档为准
  messages: [
    { role: 'system', content: '你是一个前端开发助手，回答简洁专业。' },
    { role: 'user', content: '解释一下 JavaScript 的事件循环。' },
  ],
  temperature: 0.7,         // 0~2，越高越随机，默认 1
  max_tokens: 1024,         // 限制输出 token 数
});

const text = response.choices[0].message.content;
console.log(text);
```

### 多轮对话

多轮对话的关键是**手动维护 messages 历史**，每次请求都把完整上下文带上：

```typescript
const history: OpenAI.ChatCompletionMessageParam[] = [
  { role: 'system', content: '你是一个代码审查专家。' },
];

async function chat(userInput: string): Promise<string> {
  history.push({ role: 'user', content: userInput });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: history,
  });

  const reply = response.choices[0].message.content ?? '';
  history.push({ role: 'assistant', content: reply });
  return reply;
}
```

## Streaming 流式响应

对于较长的回复，使用 streaming 可以实现打字机效果，改善用户体验：

```typescript
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '写一首关于编程的短诗。' }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? '';
  process.stdout.write(delta); // 逐 token 输出
}
```

`stream: true` 后返回的是一个异步迭代器，每个 `chunk` 包含增量内容 `delta.content`。最后一个 chunk 的 `delta.content` 为空，`finish_reason` 为 `'stop'`。

## 关键参数说明

```typescript
client.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  temperature: 0.7,     // 创造性/随机性，0 = 确定性输出
  max_tokens: 2048,     // 最大输出 token，注意和 context window 的区别
  top_p: 1,             // 核采样，与 temperature 配合使用
  stop: ['\n\n'],       // 遇到此字符串时停止生成
  n: 1,                 // 同时生成几个候选回复
});
```

> 以官方文档为准：不同模型支持的参数和上下文窗口大小有所不同，使用前确认目标模型规格。

## 错误处理

SDK 提供了结构化的错误类型，推荐针对不同错误做不同处理：

```typescript
import OpenAI from 'openai';

try {
  const response = await client.chat.completions.create({ ... });
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error('Status:', error.status);     // HTTP 状态码
    console.error('Message:', error.message);   // 错误描述
    console.error('Code:', error.code);         // 业务错误码

    if (error.status === 429) {
      // Rate limit，可做指数退避重试
    } else if (error.status === 401) {
      // API Key 无效
    }
  }
}
```

常见错误码：
- `401`：API Key 无效或未设置
- `429`：请求频率超限（Rate limit）或余额不足
- `500`/`503`：OpenAI 服务端错误，可重试

## TypeScript 类型

`openai` 包导出了完整的 TypeScript 类型，推荐使用：

```typescript
import OpenAI from 'openai';

// 消息类型
type Message = OpenAI.ChatCompletionMessageParam;

// 完整响应类型
type Completion = OpenAI.ChatCompletion;

// 单条 choice 类型
type Choice = OpenAI.ChatCompletion.Choice;
```

## 面试常问

**Q：messages 里 system、user、assistant 各有什么作用？**

`system` 定义模型的行为规则和角色，优先级最高但并非绝对约束；`user` 是用户输入；`assistant` 是模型历史回复，多轮对话时需要带上以维持上下文。

**Q：temperature 和 top_p 有什么区别，能同时设置吗？**

两者都控制输出的随机性，但机制不同。`temperature` 缩放 logits 分布，`top_p` 截断概率累计到 p 的 token 集合。OpenAI 建议只调整其中一个，同时修改可能导致不可预期的输出。

**Q：streaming 时如何知道生成结束？**

每个 chunk 有 `choices[0].finish_reason`，值为 `null` 表示还在生成，`'stop'` 表示正常结束，`'length'` 表示达到 `max_tokens` 被截断。

**Q：max_tokens 超出模型 context window 会怎样？**

会报 `400` 错误。`max_tokens` 是输出上限，实际上输入 tokens + max_tokens 不能超过模型的总 context window。

## 常见错误与最佳实践

- **不要把 API Key 写死在代码里**，使用 `.env` + `dotenv` 或平台的 Secret 管理
- **不要忽略 finish_reason**，`'length'` 说明回复被截断，可能需要增大 `max_tokens` 或分批处理
- **多轮对话注意 context 长度**，超长历史需要做截断或摘要，否则超出 context window
- **生产环境做好重试逻辑**，针对 `429` 和 `5xx` 实现指数退避
