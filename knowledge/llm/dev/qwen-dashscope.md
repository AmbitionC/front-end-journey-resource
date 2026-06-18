DashScope 是阿里云提供的大模型服务平台，通义千问（Qwen）系列模型通过它对外开放。作为国内性价比较高的选择之一，Qwen 在中文理解和代码能力上表现突出。

## 准备工作

1. 前往阿里云控制台开通 DashScope 服务
2. 在「API Key 管理」中创建 API Key
3. 将 Key 存入环境变量，**不要提交到代码仓库**：

```bash
export DASHSCOPE_API_KEY="sk-..."
```

## 两种接入方式

DashScope 提供两条路径接入 Qwen 模型：

| 方式 | 适用场景 | 优势 |
|------|----------|------|
| OpenAI 兼容接口 | 已有 OpenAI SDK 代码，想快速切换 | 零改动复用现有代码 |
| 原生 DashScope SDK | 需要 Qwen 专有功能（联网搜索等） | 功能完整，支持特有参数 |

### 方式一：OpenAI 兼容接口（推荐）

DashScope 提供了兼容 OpenAI Chat Completions 格式的接口，只需修改 `baseURL` 和 `apiKey`：

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// 基础对话
const response = await client.chat.completions.create({
  model: "qwen-turbo", // 具体模型名以官方文档为准
  messages: [
    { role: "system", content: "你是一名专业的前端工程师。" },
    { role: "user", content: "解释一下 React 的 reconciliation 算法。" },
  ],
  max_tokens: 1024,
});

console.log(response.choices[0].message.content);
```

### 流式输出

```ts
const stream = await client.chat.completions.create({
  model: "qwen-turbo", // 以官方文档为准
  messages: [{ role: "user", content: "用 TypeScript 实现一个防抖函数" }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? "";
  process.stdout.write(delta);
}
```

### 方式二：原生 DashScope SDK

适用于需要联网搜索（`enable_search`）、多模态等 Qwen 特有能力：

```bash
npm install dashscope
```

```ts
import { Generation } from "dashscope";

const response = await Generation.call({
  model: "qwen-turbo", // 以官方文档为准
  apiKey: process.env.DASHSCOPE_API_KEY,
  messages: [{ role: "user", content: "今天 A 股市场如何？" }],
  // Qwen 特有：联网搜索
  extra_body: {
    enable_search: true,
  },
});
```

> 原生 SDK 的参数和方法签名以[官方文档](https://help.aliyun.com/zh/dashscope/)为准，版本更新较频繁。

## Qwen 模型系列

Qwen 系列按能力分为多个档次（具体模型名称以官方文档为准）：

| 档次 | 特点 |
|------|------|
| `qwen-turbo` | 速度快、成本低，适合简单问答 |
| `qwen-plus` | 能力与成本均衡 |
| `qwen-max` | 最强推理能力 |
| `qwen-long` | 超长上下文（百万 token 级别） |

此外还有代码专用（`qwen-coder-*`）、数学专用等垂直领域模型。

## 多 Provider 工厂模式

实际项目中常需要支持多个 LLM 提供商，可用工厂模式统一管理：

```ts
import OpenAI from "openai";

type Provider = "openai" | "qwen" | "deepseek";

function createClient(provider: Provider): OpenAI {
  const configs: Record<Provider, { apiKey: string; baseURL?: string }> = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
    },
    qwen: {
      apiKey: process.env.DASHSCOPE_API_KEY!,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: "https://api.deepseek.com/v1",
    },
  };

  return new OpenAI(configs[provider]);
}

// 使用时只需切换 provider 和 model
const client = createClient("qwen");
```

## 常见问题

**API Key 权限不足**：确认已在控制台为 Key 开通对应模型权限，部分高级模型需单独申请。

**Rate Limit（限流）**：免费 tier 限制较严格，生产环境建议充值并升级限额。

**中文 token 计算**：中文每个字约 1.5 个 token，与英文不同，规划 context 时需注意。

## 面试常问

- **为什么推荐 OpenAI 兼容接口而非原生 SDK？** 代码复用性更高，切换模型提供商时改动极小，团队学习成本低。
- **通义千问和 GPT 系列最大的区别在哪？** 中文处理能力强，在国内网络环境下延迟更低，价格通常更低，且数据不出境。
- **如何在前端项目中安全使用 DashScope？** 必须走后端代理，绝不能将 API Key 暴露在浏览器端。
