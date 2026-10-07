![浏览器 EventSource 到 SSE server 的长连接时序：text/event-stream 持续发送 id/event/data，网络断开后按 retry 延迟携带 Last-Event-ID 重连；中间代理明确关闭缓冲](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/sse-reconnect-event-id-flow-v1.webp)
*图：沿 EventSource 与服务端时间线读取 `id/event/data` 事件；断线后顺着 `retry` 和 `Last-Event-ID` 回到重连分支，并留意代理缓冲边界。*

---

SSE（Server-Sent Events）是构建 LLM 流式输出服务的事实标准——ChatGPT、Claude、Gemini 的逐 token 打字机效果，底层几乎无一例外地使用了 SSE。理解 SSE 协议细节与服务端实现，是 AI/Agent 后端工程师的必备技能。

## SSE 协议本质

SSE 的事件流仍运行在 HTTP 响应之上，状态码、字段和缓存含义遵循 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)；`text/event-stream` 的解析与自动重连则由 HTML 标准规定。


SSE 使用一个可长期保持的 HTTP 响应，响应头声明 `Content-Type: text/event-stream`，服务端以纯文本格式持续写入事件，浏览器 `EventSource` 增量消费。连接仍可能因服务端结束、超时或网络故障关闭，客户端再按标准规则决定是否重连。

### 数据帧格式

每条事件由若干字段行组成，以**空行（`\n\n`）** 作为事件终止标志：

```
id: 42
event: token
data: {"text": "Hello"}

id: 43
event: token
data: {"text": " World"}

: 这是注释行，客户端忽略，常用于心跳保活

retry: 3000

```

四个字段含义：

| 字段 | 是否必填 | 说明 |
|------|----------|------|
| `data` | 必填 | 消息正文，多行时每行写一个 `data:` |
| `event` | 可选 | 自定义事件类型，默认为 `message` |
| `id` | 可选 | 事件 ID，断线重连时作为 `Last-Event-ID` 头发送 |
| `retry` | 可选 | 重连等待毫秒数，服务端可动态调整客户端重连间隔 |

**注意**：每行必须以 `\n` 结尾，事件块以 `\n\n`（即额外一个空行）结束，这是最常见的初学者踩坑点。

---

## 浏览器 EventSource API（TypeScript）

```typescript
// 建立 SSE 连接
const evtSource = new EventSource('/api/chat/stream', {
  withCredentials: true, // 跨域时携带 cookie
});

// 监听默认 message 事件
evtSource.addEventListener('message', (e: MessageEvent) => {
  const payload = JSON.parse(e.data) as { text: string };
  appendToUI(payload.text);
});

// 监听自定义 event 类型（如经过处理的 Agent 阶段摘要）
evtSource.addEventListener('thought', (e: MessageEvent) => {
  const thought = JSON.parse(e.data) as { step: string; content: string };
  renderThoughtBubble(thought);
});

// 监听 done 事件，主动关闭连接
evtSource.addEventListener('done', () => {
  evtSource.close();
  markGenerationComplete();
});

evtSource.addEventListener('error', (e: Event) => {
  if (evtSource.readyState === EventSource.CONNECTING) {
    console.warn('连接暂时中断，浏览器正在按重连规则尝试恢复');
  } else if (evtSource.readyState === EventSource.CLOSED) {
    console.warn('连接已终止，浏览器不再自动重连');
  }
});
```

`EventSource` 的关键特性：
- **状态与重连**：`CONNECTING` 表示首次连接或正在重连；`CLOSED` 表示不再尝试重连（如主动 `close()` 或终止性失败）。初始重连间隔由浏览器实现定义，合法的 `retry:` 字段可修改它；不能把所有断开都当成会重连。参见 [WHATWG EventSource 状态定义](https://html.spec.whatwg.org/multipage/server-sent-events.html#the-eventsource-interface)。
- **Last-Event-ID 续传**：重连请求自动携带 `Last-Event-ID` 请求头，服务端可据此从断点处续发
- **仅支持 GET**：原生 API 不支持 POST 请求体；需要传参时，可改用 `fetch` + `ReadableStream` 手动解析

---

## SSE vs WebSocket vs 长轮询（Long Polling）

| 维度 | SSE | WebSocket | Long Polling |
|------|-----|-----------|--------------|
| 通信方向 | 单向（Server → Client） | 双向 | 单向（模拟） |
| 协议层 | 纯 HTTP/1.1 或 HTTP/2 | 独立 TCP（Upgrade） | HTTP |
| 浏览器自动重连 | 是（内置） | 否（需手动实现） | 否（需手动循环） |
| 代理/防火墙兼容 | 优（标准 HTTP） | 需额外配置 | 优 |
| 服务端实现复杂度 | 低 | 中 | 低 |
| 连接数开销 | 中（长连接） | 中（长连接） | 高（反复建连） |
| 典型场景 | LLM 流式输出、通知推送、进度条 | 实时聊天、在线游戏 | 低频状态轮询 |

**选型建议**：凡是"服务端持续向客户端推数据、客户端不需要频繁反向发送消息"的场景，优先选 SSE——协议简单、天然重连、HTTP 兼容性最佳，LLM 流式输出是其黄金用例。

---

## SSE 连接建立与 LLM Token 流式推送时序

```mermaid
sequenceDiagram
    participant Browser as 浏览器 / 前端
    participant Nginx as Nginx 反向代理
    participant Backend as Node.js 后端
    participant LLM as LLM API（OpenAI / Anthropic）

    Browser->>Nginx: GET /api/chat/stream<br/>Accept: text/event-stream
    Nginx->>Backend: 透传请求（proxy_buffering off）
    Backend->>LLM: POST /chat/completions<br/>stream: true

    LLM-->>Backend: chunk: "Hello"
    Backend-->>Nginx: data: {"text":"Hello"}\n\n
    Nginx-->>Browser: 实时透传（无缓冲）

    LLM-->>Backend: chunk: " World"
    Backend-->>Nginx: data: {"text":" World"}\n\n
    Nginx-->>Browser: 实时透传

    LLM-->>Backend: [DONE]
    Backend-->>Nginx: event: done\ndata: {}\n\n
    Nginx-->>Browser: 实时透传
    Backend-->>Nginx: 关闭响应流
    Browser->>Browser: evtSource.close()
```

---

## 服务端实现：NestJS + Express（TypeScript）

### 基础 SSE 响应骨架

```typescript
// events.controller.ts
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('events')
export class EventsController {
  @Get('stream')
  async streamEvents(@Res() res: Response, @Req() req: Request) {
    if (res.destroyed || res.writableEnded) return;
    // 必须的响应头三件套
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // 通知 Nginx 禁用缓冲（见后文 Nginx 配置章节）
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders(); // 立即发送响应头，不等待第一条数据

    let eventId = 0;

    const sendEvent = (eventType: string, data: unknown) => {
      res.write(`id: ${++eventId}\n`);
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 心跳注释行，防止代理/防火墙因空闲超时断连
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15_000);

    // 客户端断开时必须清理，否则 setInterval 持续泄漏
    res.once('close', () => {
      clearInterval(heartbeat);
    });
  }
}
```

### LLM 流式输出核心实现

以下骨架同时覆盖 OpenAI 与 Anthropic SDK 的流式调用模式：

```typescript
import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

@Controller('chat')
export class ChatController {
  private readonly anthropic = new Anthropic();
  private readonly openai = new OpenAI();

  // ---- Anthropic 流式示例 ----
  @Post('anthropic/stream')
  async anthropicStream(
    @Body() body: { prompt: string },
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const controller = new AbortController();
    let completed = false;
    const onClose = () => {
      if (!completed) controller.abort();
    };
    res.once('close', onClose); // 必须先于 SDK 建流与消费

    try {
      if (res.destroyed || res.writableEnded) {
        controller.abort();
        return;
      }
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const stream = await this.anthropic.messages.stream({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: body.prompt }],
      }, { signal: controller.signal });

      if (controller.signal.aborted || res.destroyed || res.writableEnded) {
        controller.abort();
        return;
      }
      for await (const event of stream) {
        if (controller.signal.aborted || res.destroyed || res.writableEnded) {
          controller.abort();
          break;
        }
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          res.write(`event: token\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
      if (!controller.signal.aborted && !res.destroyed && !res.writableEnded) {
        completed = true; // 正常 end 引发的 close 不应再取消
        res.end('event: done\ndata: {}\n\n');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        controller.abort();
        res.destroy(); // 响应头已发送，不再拼接伪 done 或错误 JSON
        throw error; // 交由框架处理；日志脱敏由应用负责
      }
    } finally {
      res.off('close', onClose);
    }
  }

  // ---- OpenAI 流式示例 ----
  @Post('openai/stream')
  async openaiStream(
    @Body() body: { prompt: string },
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const controller = new AbortController();
    let completed = false;
    const onClose = () => {
      if (!completed) controller.abort();
    };
    res.once('close', onClose);

    try {
      if (res.destroyed || res.writableEnded) {
        controller.abort();
        return;
      }
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: body.prompt }],
        stream: true,
      }, { signal: controller.signal });

      if (controller.signal.aborted || res.destroyed || res.writableEnded) {
        controller.abort();
        return;
      }
      for await (const chunk of stream) {
        if (controller.signal.aborted || res.destroyed || res.writableEnded) {
          controller.abort();
          break;
        }
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          res.write(`event: token\ndata: ${JSON.stringify({ text: delta })}\n\n`);
        }
      }
      if (!controller.signal.aborted && !res.destroyed && !res.writableEnded) {
        completed = true;
        res.end('event: done\ndata: {}\n\n');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        controller.abort();
        res.destroy();
        throw error;
      }
    } finally {
      res.off('close', onClose);
    }
  }
}
```

这里监听的是响应 `res` 的 `close`，不是把请求 `req` 的 `close` 当成断网：[Node 22 HTTP 文档](https://github.com/nodejs/node/blob/v22.22.3/doc/api/http.md)说明请求 close 也会在请求消息完成时出现。响应 close 同样包含正常结束，所以示例另记 `completed`。两种 SDK 都在第二参数接收取消 `signal`，它覆盖等待上游建流及消费期间的断开；`finally` 移除响应监听，真实上游失败则关闭响应并交给框架处理，日志脱敏仍由应用负责。

取消支持见 [Anthropic MessageStream 的 signal 处理](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/lib/MessageStream.ts)与[OpenAI RequestOptions](https://github.com/openai/openai-node/blob/master/src/internal/request-options.ts)。这是连接承载的展示型生成示例，取消是协作请求，不保证模型立即停止或已产生费用归零。持久 Agent 任务是否取消由任务合同决定；不能把断流作为下单或工具副作用的撤销。生产仍需按下文管理背压和错误观测。

**Agent 扩展**：在 Agent 场景中，除了 `token` 事件，还可以自定义事件类型：

```typescript
// 经过处理的阶段进度；thought 是自定义事件名，不传内部思维链
res.write(`event: thought\n`);
res.write(`data: ${JSON.stringify({ step: 'planning', content: '正在整理任务输入' })}\n\n`);

// 工具调用开始
res.write(`event: tool_call\n`);
res.write(`data: ${JSON.stringify({ tool: 'web_search', input: 'SSE specification' })}\n\n`);

// 工具调用结果
res.write(`event: tool_result\n`);
res.write(`data: ${JSON.stringify({ tool: 'web_search', output: '…搜索结果…' })}\n\n`);
```

前端监听对应事件，展示任务阶段、工具动作及经过处理的结果摘要；`thought` 只是本例事件名，不代表应公开模型内部思维链。工具参数和结果也须按用户权限脱敏后展示。

---

## 断线重连与 Last-Event-ID 续传

[HTML Server-sent Events 标准](https://html.spec.whatwg.org/multipage/server-sent-events.html) 定义 EventSource 状态、事件流解析、`retry`、自动重连和 `Last-Event-ID`；连接可能因网络或服务端结束而关闭，并非“永不关闭”。


浏览器在需要重建连接时进入 `CONNECTING`，已有非空事件 ID 时重连请求携带 `Last-Event-ID`；主动 close 或终止性失败进入 `CLOSED` 后不再自动重连：

```typescript
@Get('stream')
async streamWithResume(@Req() req: Request, @Res() res: Response) {
  // 读取客户端上次收到的最后事件 ID
  const lastEventId = req.headers['last-event-id'] as string | undefined;
  const startFromId = lastEventId ? parseInt(lastEventId, 10) + 1 : 0;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  res.write('retry: 3000\n\n'); // SSE 正文字段，不是 HTTP retry 响应头

  // 从 startFromId 处开始补发历史消息（适用于通知/日志场景）
  const missedEvents = await this.eventStore.getFrom(startFromId);
  for (const event of missedEvents) {
    res.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${event.payload}\n\n`);
  }

  // 继续推送后续事件…
}
```

> 重建连接和重做任务分开设计。纯展示型生成可按产品合同重发；涉及下单、工具副作用或长任务时，先按 taskId 查询持久状态并恢复事件，不能因为 SSE 断流就重新执行动作。Last-Event-ID 只传游标，服务端仍需保留并授权回放事件；游标过旧时返回快照后接续。

---

### 心跳、慢消费者与清理

心跳可发送 `: heartbeat\n\n` 这样的注释帧，频率按代理与产品超时配置确定；它不代表任务完成，也不替代应用级结果校验。写入遭遇背压时限制待发队列，监听连接关闭并清理订阅与心跳，避免慢客户端积压无限事件。断开是否取消任务须由任务合同决定，不能把关闭响应对象直接当作取消成功。

## Nginx 反向代理配置

Nginx 默认开启响应体缓冲（`proxy_buffering on`），会将后端数据积攒到足够大的 buffer 才一次性发给客户端，导致 SSE 的 token 无法实时到达，这是生产环境最高频的 SSE 故障。

```nginx
# /etc/nginx/sites-available/your-app.conf

server {
    listen 80;
    server_name api.example.com;

    location /api/chat/stream {
        proxy_pass http://backend:3000;

        # 关键：关闭缓冲，SSE 数据实时透传
        proxy_buffering off;
        proxy_cache off;

        # 保持长连接
        proxy_http_version 1.1;
        proxy_set_header Connection '';

        # 防止代理 60s 超时断连（LLM 推理可能较慢）
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;

        # 透传必要请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

除 Nginx 配置外，服务端响应头也可设置 `X-Accel-Buffering: no`，效果等同于 `proxy_buffering off`，适合在代码层面兜底。

---

## Agent 后端意义

在 AI Agent 服务中，SSE 不只是"打字机效果"的实现手段，它直接影响用户对 Agent 智能程度的感知：

- **安全的阶段进度**：推送任务阶段、已完成单位和经过处理的行动摘要，不把模型内部思维链作为业务事件或审计合同
- **工具调用实时反馈**：`event: tool_call` 和 `event: tool_result` 让用户看到 Agent 正在调用哪些工具、获得了什么结果，提升透明度
- **长任务进度汇报**：对于需要多步骤执行的 Agent 任务（如代码生成、数据分析），SSE 可以实时汇报每个阶段的完成情况，而不是让用户盯着转圈圈等待
- **错误提前感知**：若某个工具调用失败，可立即通过 `event: error` 推送，前端及时展示局部错误，无需等待整个任务结束

---

## 常见误区与最佳实践

### 误区一：Nginx 未关缓冲，token 积攒后一次性推送

**现象**：本地开发正常，部署到带 Nginx 的生产环境后，LLM 响应全部等到生成完才一次性出现。

**修复**：在 Nginx location 块中加 `proxy_buffering off;`，或在服务端响应头中设置 `X-Accel-Buffering: no`。

### 误区二：忘记 `\n\n` 结束符

**现象**：`res.write('data: hello\n')` 写完，客户端收不到任何事件。

**原因**：SSE 协议规定事件块必须以**两个换行符**（空行）结束，单个 `\n` 只是字段行分隔，不触发事件分发。

**修复**：始终以 `\n\n` 结尾：`res.write('data: hello\n\n')`。

### 误区三：未处理客户端断连导致内存/资源泄漏

**现象**：服务运行数小时后内存持续增长，重启后恢复。

**原因**：客户端关闭标签页或网络断开后，服务端的 `setInterval`（心跳、数据推送）、上游 LLM 请求仍在运行，且持有 `res` 对象引用，无法被 GC。

**修复**：必须监听 `req.on('close', cleanup)`，在回调中清理所有定时器并 `abort()` 上游请求。

### 误区四：用 `res.send()` 或 `res.json()` 发送 SSE

**现象**：调用后连接立即关闭，只收到一条数据。

**原因**：`res.send()` / `res.json()` 会自动关闭响应流，SSE 必须使用 `res.write()` 持续写入 + 最后手动 `res.end()`。

### 最佳实践清单

- `res.flushHeaders()` 在写任何数据前调用，确保响应头立即发送
- 始终设置 `X-Accel-Buffering: no` 作为代码层缓冲兜底
- 心跳注释行（`: heartbeat\n\n`）间隔 15~30 秒，防止代理超时
- 生产环境将 `proxy_read_timeout` 设置为不低于 LLM 最大推理时间
- 使用 `event:` 字段区分不同数据类型（token / thought / tool_call / done / error），前端按类型分别处理，避免所有逻辑堆在 `message` 事件里

---

## 面试常问要点

**Q：SSE 和 WebSocket 如何选型？**

单向推送（通知、进度、LLM 流式输出）优先 SSE——更简单、天然支持自动重连、纯 HTTP 无需协议升级；需要客户端频繁双向通信（实时聊天、在线协同编辑、多人游戏）时用 WebSocket。

**Q：SSE 能穿越代理/防火墙吗？**

由于是标准 HTTP，兼容性优于 WebSocket；但长连接可能被某些代理因空闲超时断开，需要心跳注释行保活，并在代理侧配置足够长的 `read_timeout`。

**Q：浏览器原生 EventSource 不支持 POST，怎么传复杂参数？**

方案一：将参数序列化到 URL query string（GET 请求体积限制约 2~8 KB）。方案二：先用 POST 接口创建一个 session ID，再用 GET + session ID 建立 SSE 连接。方案三：改用 `fetch` + `ReadableStream` 手动实现 SSE 解析，支持任意 HTTP 方法。

**Q：为什么 LLM 流式输出几乎都用 SSE 而不是 WebSocket？**

LLM 推理是典型的"单次请求、持续响应"模型，客户端只需发一次 prompt，服务端持续推送 token，属于单向推送场景。SSE 协议开销更小，浏览器自动重连省去额外实现，且 HTTP/2 下可多路复用——选型上 SSE 占尽优势。

**Q：Last-Event-ID 的工作原理？**

服务端在每个事件帧写 `id: <number>`，浏览器自动记录最后一次收到的 ID。连接断开重连时，浏览器自动在请求头中附带 `Last-Event-ID: <last-id>`，服务端读取此头，从对应 ID 之后的事件续发，实现断点续传。

**Q：SSE 在 HTTP/2 下有什么变化？**

HTTP/2 原生支持多路复用，多个 SSE 流可以在同一个 TCP 连接上并发传输，解决了 HTTP/1.1 下浏览器同源连接数限制（通常 6 个）的问题，在大量并发 Agent 任务的场景下尤为重要。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 全栈一面：Pipeline 质量、Doris 与消息轮播（2026 年 9 月）](../../../interview/bytedance/base/bytedance-base-23.md)
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-26.md)
- [腾讯 Agent 实习一面：RAG、工具与通信（2026 年 3 月发帖）](../../../interview/tencent/ai/tencent-ai-10.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [字节 Agent 开发一面：权限、SSE 与 Python 字典](../../../interview/bytedance/base/bytedance-base-58.md)
<!-- interview-source-history:end -->

## 参考资料

- [HTML Standard: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
