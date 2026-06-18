# MCP 协议原理与 MCP Server 开发

MCP（Model Context Protocol）是 Anthropic 提出的开放协议，目标是让 AI 模型与外部工具、数据源之间的通信标准化。它解决了"每个 AI 应用都要重新实现工具集成"的重复建设问题，让工具提供方只需实现一次 MCP Server，就能被任意支持 MCP 的 AI 应用使用。

## 为什么需要 MCP

在 MCP 出现之前，每个 AI 应用（Claude Desktop、Cursor、自研 Agent）都需要：

1. 为每个工具单独编写集成代码
2. 维护不同 LLM 的 Function Calling 格式差异
3. 处理工具的生命周期、错误、权限等各种细节

MCP 将这个问题标准化：**工具提供方实现 MCP Server，AI 应用实现 MCP Client，两者通过标准协议通信**，解耦工具与应用。

```mermaid
graph LR
    subgraph AI 应用层 (MCP Client)
        CD[Claude Desktop]
        CU[Cursor]
        CA[自研 Agent]
    end
    subgraph MCP 协议
        P((MCP))
    end
    subgraph 工具层 (MCP Server)
        FS[文件系统 Server]
        DB[数据库 Server]
        API[自定义 API Server]
        GH[GitHub Server]
    end
    CD & CU & CA <-->|标准协议| P
    P <--> FS & DB & API & GH
```

## 核心概念

### Client 与 Server

- **MCP Client**：AI 应用侧，负责发现 Server 能力、发起工具调用请求
- **MCP Server**：能力提供方，暴露工具（Tools）、资源（Resources）、提示词（Prompts）

### 三类能力

| 能力类型 | 说明 | 典型用途 |
|----------|------|----------|
| **Tools** | 可执行的函数，LLM 主动调用 | 搜索、写文件、调 API |
| **Resources** | 可读取的数据，类似 REST 资源 | 读文件内容、获取数据库记录 |
| **Prompts** | 预定义的 prompt 模板 | 代码审查 prompt、文档生成 prompt |

Tools 是最常用的能力类型，Resources 用于 LLM 需要上下文数据但不需要"执行"的场景。

### 与 Function Calling 的关系

MCP 不是 Function Calling 的替代品，而是更高层的协议：

| 维度 | Function Calling | MCP |
|------|-----------------|-----|
| 层级 | LLM API 层 | 应用协议层 |
| 范围 | 单次请求内 | 跨会话、独立进程 |
| 工具定义 | 每次请求携带 | Server 独立声明 |
| 运行方式 | 在调用方进程内 | 独立 Server 进程 |
| 标准化程度 | 各家格式略有差异 | 统一协议 |
| 发现机制 | 无（需手动配置） | 自动发现 Server 能力 |

可以理解为：**Function Calling 是 LLM 宣告"我要调用工具"的机制，MCP 是工具以独立进程存在并被发现和调用的协议**。

## 传输方式

MCP 支持两种传输层：

### stdio（标准输入输出）

Client 以子进程方式启动 Server，通过标准输入输出传递 JSON-RPC 消息。适合本地开发工具（如 Claude Desktop、Cursor）集成本地工具。

```
Client Process
    ↓ stdin (JSON-RPC request)
MCP Server Process
    ↓ stdout (JSON-RPC response)
Client Process
```

### HTTP + SSE（Server-Sent Events）

Server 作为独立 HTTP 服务运行，Client 通过 HTTP 请求和 SSE 流通信。适合远程部署、云端工具服务、需要多 Client 共享的场景。

## 开发一个 MCP Server

> 以下骨架使用 `@modelcontextprotocol/sdk`，具体 API 以[官方文档](https://modelcontextprotocol.io)为准。

### 安装依赖

```bash
npm install @modelcontextprotocol/sdk zod
```

### 基础 Server 骨架（TypeScript）

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// 创建 MCP Server 实例
const server = new McpServer({
  name: 'my-tools-server',
  version: '1.0.0',
});

// 定义 Tool：查询天气
server.tool(
  'get_weather',                          // 工具名称
  '获取指定城市的实时天气信息',             // 工具描述（LLM 依赖此决定何时调用）
  {
    city: z.string().describe('城市名称，如"上海"'),
    unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  },
  async ({ city, unit }) => {
    // 实际调用天气 API
    const weather = await fetchWeatherAPI(city);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            city,
            temperature: unit === 'celsius' ? weather.tempC : weather.tempF,
            condition: weather.condition,
            humidity: weather.humidity,
          }),
        },
      ],
    };
  }
);

// 定义 Tool：读取文件
server.tool(
  'read_file',
  '读取本地文件内容',
  {
    path: z.string().describe('文件的绝对路径'),
    encoding: z.enum(['utf-8', 'base64']).optional().default('utf-8'),
  },
  async ({ path, encoding }) => {
    const fs = await import('fs/promises');
    try {
      const content = await fs.readFile(path, encoding as BufferEncoding);
      return {
        content: [{ type: 'text', text: content }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// 定义 Resource：暴露配置信息
server.resource(
  'config://app',
  'app configuration',
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ version: '1.0.0', env: process.env.NODE_ENV }),
      },
    ],
  })
);

// 启动 Server（stdio 传输）
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server 现在监听 stdin，响应通过 stdout 发送
}

main().catch(console.error);
```

### HTTP + SSE 传输方式骨架

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const server = new McpServer({ name: 'remote-tools', version: '1.0.0' });

// ... 注册工具（同 stdio 版本）

// SSE 连接端点
app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

// 消息端点（Client 发送请求）
app.post('/messages', express.json(), async (req, res) => {
  // transport 处理消息路由
});

app.listen(3000, () => {
  console.log('MCP Server running on http://localhost:3000');
});
```

### 在 Claude Desktop 中配置 MCP Server

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "my-tools": {
      "command": "node",
      "args": ["/path/to/my-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## 典型使用场景

- **文件系统访问**：让 AI 读写本地文件，实现代码助手、文档处理
- **数据库查询**：AI 直接查询 MySQL/PostgreSQL/MongoDB，回答数据相关问题
- **内部 API 集成**：将公司内部服务暴露为 MCP Server，不需要每个 AI 工具单独集成
- **开发工具**：Cursor、Claude Desktop 通过 MCP 集成 git、npm、测试运行器等
- **知识库检索**：将向量数据库封装为 MCP Server，为 AI 提供语义搜索能力

## 面试常问

**MCP 解决了什么核心问题？**

解决了 AI 工具集成的 **M×N 问题**：M 个 AI 应用 × N 个工具，原本需要 M×N 个集成。MCP 将其降为 M + N：每个工具实现一次 MCP Server，每个 AI 应用实现一次 MCP Client，通过标准协议连接。同时，MCP Server 作为独立进程运行，天然隔离了权限和安全边界。

**MCP 与直接 Function Calling 的区别？**

Function Calling 是在单次 LLM API 请求中临时定义工具，工具逻辑运行在调用方进程内，每次都需要传递工具定义。MCP Server 是独立进程，持续运行，通过标准协议被发现和调用，无需每次传递定义，也无需了解调用方是哪个 LLM。MCP 更适合需要复用工具、跨应用共享工具、或工具需要维护状态的场景。

**MCP Server 的安全性如何保证？**

- stdio 模式下，Server 只能被启动它的进程访问，天然隔离
- 工具应遵守最小权限原则，只暴露必要能力
- 敏感操作（写文件、执行命令）应该在工具描述中明确告知，让用户知情
- 生产环境的 HTTP 模式需要增加认证（API Key、OAuth）
- Server 应校验所有输入参数（使用 Zod 等），防止注入攻击
