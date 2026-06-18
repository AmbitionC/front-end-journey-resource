# LangChain.js 入门与实战

LangChain.js 是 LangChain 的 JavaScript/TypeScript 实现，提供统一的抽象层来构建 LLM 应用：标准化 LLM 调用、链式处理、Agent 循环和记忆管理。它屏蔽了不同 LLM 提供商的接口差异，让开发者专注于业务逻辑。

> 注意：LangChain.js API 迭代较快，以下代码为概念骨架，具体 API 签名以[官方文档](https://js.langchain.com)为准。

## 核心概念

### LLM / ChatModel

两种模型封装方式：

- **LLM**：文本输入 → 文本输出（旧式补全接口）
- **ChatModel**：消息列表输入 → 消息输出（主流对话接口）

LangChain.js 将各家提供商（OpenAI、Anthropic、Google 等）统一为相同接口，切换模型只需换一行代码。

### PromptTemplate

将变量插入固定模板，生成最终 prompt。支持单变量、多变量、Chat prompt（区分 system/human/ai 角色）。

### Chain 与 LCEL

Chain 是将多个组件串联的管道。旧式 Chain（`LLMChain`、`ConversationChain`）已逐渐被 **LCEL（LangChain Expression Language）** 取代。

LCEL 使用管道符 `|` 将组件串联，声明式、可组合，支持流式输出和并行执行。

### Agent 与 Tool

Agent 使用 LLM 动态决定调用哪些工具、以什么顺序调用，直到任务完成。Tool 是 Agent 可以使用的能力单元，包含名称、描述和执行函数。

## 典型代码骨架

### 1. 基础 LLM 调用

```ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // 以官方文档为准
  temperature: 0.7,
});

const response = await llm.invoke([
  new HumanMessage('用一句话解释什么是 AI Agent'),
]);

console.log(response.content);
```

### 2. PromptTemplate + LLM（LCEL 管道）

```ts
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const llm = new ChatOpenAI({ temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个专业的{domain}顾问，回答要简洁专业。'],
  ['human', '{question}'],
]);

const outputParser = new StringOutputParser();

// LCEL 管道：prompt | llm | parser
const chain = prompt.pipe(llm).pipe(outputParser);

const answer = await chain.invoke({
  domain: '前端开发',
  question: '什么是 Web Components？',
});
console.log(answer);

// 流式输出
const stream = await chain.stream({
  domain: '前端开发',
  question: '解释一下 React Fiber 架构',
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### 3. 带 Tool 的 Agent

```ts
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';

// 定义工具
const searchTool = tool(
  async ({ query }: { query: string }) => {
    // 实际场景中调用搜索 API
    return `搜索"${query}"的结果：这里是搜索返回的内容...`;
  },
  {
    name: 'web_search',
    description: '搜索互联网上的最新信息',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
    }),
  }
);

const calculatorTool = tool(
  async ({ expression }: { expression: string }) => {
    try {
      // 简化示例，生产中需要安全的表达式求值
      return String(eval(expression));
    } catch {
      return 'Invalid expression';
    }
  },
  {
    name: 'calculator',
    description: '计算数学表达式',
    schema: z.object({
      expression: z.string().describe('数学表达式，如 "2 + 3 * 4"'),
    }),
  }
);

const llm = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0 });
const tools = [searchTool, calculatorTool];

// 创建 ReAct Agent（使用 LangGraph prebuilt）
const agent = createReactAgent({ llm, tools });

const result = await agent.invoke({
  messages: [{ role: 'user', content: '今天上海天气如何？另外帮我算一下 15 * 23' }],
});

console.log(result.messages.at(-1)?.content);
```

### 4. 带记忆的对话（LCEL + RunnableWithMessageHistory）

```ts
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个友好的助手'],
  new MessagesPlaceholder('history'),
  ['human', '{input}'],
]);

const chain = prompt.pipe(llm);

const sessionHistories = new Map<string, InMemoryChatMessageHistory>();

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId: string) => {
    if (!sessionHistories.has(sessionId)) {
      sessionHistories.set(sessionId, new InMemoryChatMessageHistory());
    }
    return sessionHistories.get(sessionId)!;
  },
  inputMessagesKey: 'input',
  historyMessagesKey: 'history',
});

// 同一 session_id 的调用共享历史
await chainWithHistory.invoke(
  { input: '我叫小明' },
  { configurable: { session_id: 'user-001' } }
);

const response = await chainWithHistory.invoke(
  { input: '我叫什么名字？' },
  { configurable: { session_id: 'user-001' } }
);
console.log(response.content); // 应该能记住"小明"
```

## LCEL 的优势

LCEL（LangChain Expression Language）是 LangChain 从旧式 `LLMChain` 迁移的方向：

| 特性 | 旧式 Chain | LCEL |
|------|-----------|------|
| 语法 | 命令式，配置繁琐 | 声明式，`|` 管道简洁 |
| 流式输出 | 需要特殊配置 | 原生支持 `.stream()` |
| 并行执行 | 不支持 | `RunnableParallel` 原生支持 |
| 可组合性 | 弱 | 任意组件可拼接 |
| 调试 | 困难 | LangSmith 可视化追踪 |
| 批量处理 | 手动循环 | `.batch()` 内置并发 |

## LangChain 的争议

LangChain 在社区中存在争议，理解这些争议有助于做出合理选型：

**批评观点：**
- 抽象层过多，出现问题时难以 debug，报错信息不直观
- API 变化频繁，升级成本高（`LLMChain` → LCEL 就是一次大迁移）
- 简单场景用 LangChain 反而增加复杂度，直接调用 SDK 更清晰

**支持观点：**
- 统一多 provider 接口，切换模型成本低
- LangGraph 对复杂 Agent 的状态管理有独特优势
- 生态丰富（工具、向量库、回调、追踪）
- 对团队而言，约定了统一模式，降低协作成本

**实践建议：** 简单应用直接用 provider SDK（如 Anthropic SDK / OpenAI SDK）；需要复杂 Agent 流程、多 provider 切换或 LangGraph 状态机时再引入 LangChain.js。

## 面试常问

**LCEL 相比旧 Chain 有什么优势？**

LCEL 使用 `|` 管道符将 Runnable 组件串联，天然支持流式输出（`.stream()`）、批处理（`.batch()`）和并行执行（`RunnableParallel`）。旧式 `LLMChain` 需要繁琐配置，不支持这些能力。LCEL 的每个组件都实现了相同的 `Runnable` 接口，高度可组合，也更容易用 LangSmith 追踪每个节点的输入输出。

**LangChain 的主要争议是什么？**

主要集中在：过度抽象导致 debug 困难、API 迭代不稳定、简单场景增加不必要复杂度。核心问题是"抽象的代价"——LangChain 试图成为 LLM 应用的 Rails，但 LLM 应用还没有完全成熟的范式，导致抽象不断调整。对于有经验的团队，有时直接使用 provider SDK + 少量自写工具类会更可控。
