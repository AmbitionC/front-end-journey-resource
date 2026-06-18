# SSE 服务端推送事件

SSE（Server-Sent Events）是基于 HTTP 的单向实时推送技术，服务端可以持续向客户端推送数据流，无需客户端反复轮询，也不需要 WebSocket 的双向连接。

## SSE 的工作原理

SSE 本质上是一个不关闭的 HTTP 响应，使用特定的 `Content-Type: text/event-stream` 格式持续传输文本数据。

```
客户端                    服务端
   │── GET /events ──────→│
   │← 200 OK              │
   │  Content-Type:        │
   │  text/event-stream    │
   │                       │
   │← data: 消息1\n\n      │  推送
   │← data: 消息2\n\n      │  推送
   │← data: 消息3\n\n      │  推送
   │                       │
   │  （连接保持直到关闭）   │
```

## SSE 数据格式

每条事件由若干字段组成，以空行（`\n\n`）结束：

```
id: 1
event: message
data: {"text": "Hello, World!"}

id: 2
event: notification
data: {"type": "alert", "content": "新订单"}

: 这是注释行，客户端会忽略
data: 没有 event 字段时，默认事件类型为 message

```

- `data`：消息内容（必须），多行数据用多个 `data:` 表示。
- `event`：自定义事件类型（可选，默认 `message`）。
- `id`：事件 ID，断线重连时客户端会发送 `Last-Event-ID` 头，服务端可从此处续传。
- `retry`：指定重连间隔毫秒数。

## 浏览器 EventSource API

```typescript
const evtSource = new EventSource('/api/events', {
  withCredentials: true, // 跨域时携带 cookie
});

// 监听默认消息事件
evtSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
});

// 监听自定义事件
evtSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data);
  showNotification(notification);
});

// 连接建立
evtSource.addEventListener('open', () => {
  console.log('SSE 连接已建立');
});

// 连接出错（网络断开等）
evtSource.addEventListener('error', (event) => {
  if (evtSource.readyState === EventSource.CLOSED) {
    console.log('连接已关闭，浏览器将自动重连');
  }
});

// 关闭连接（如用户离开页面）
evtSource.close();
```

`EventSource` 会在连接断开后**自动重连**，无需手动实现重连逻辑。

## NestJS 服务端实现

```typescript
// events.controller.ts
@Controller('events')
export class EventsController {
  @Get('stream')
  async streamEvents(@Res() res: Response, @Req() req: Request) {
    // 设置 SSE 必要的响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
    res.flushHeaders();

    let eventId = 0;

    // 推送消息的辅助函数
    const sendEvent = (event: string, data: unknown) => {
      res.write(`id: ${++eventId}\n`);
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 发送心跳，防止代理/防火墙断开空闲连接
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    // 模拟推送业务数据
    const dataStream = setInterval(() => {
      sendEvent('update', { timestamp: Date.now(), value: Math.random() });
    }, 2000);

    // 客户端断开时清理资源
    req.on('close', () => {
      clearInterval(heartbeat);
      clearInterval(dataStream);
      res.end();
    });
  }
}
```

## AI 流式输出场景

SSE 是 AI 聊天（如 ChatGPT）流式输出的主流实现方式：

```typescript
@Post('chat/stream')
async streamChat(@Body() body: { prompt: string }, @Res() res: Response, @Req() req: Request) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // 调用 AI API 并流式转发（骨架，具体 SDK 以官方文档为准）
  const stream = await aiClient.chat.completions.create({
    model: 'some-model',
    messages: [{ role: 'user', content: body.prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();

  req.on('close', () => stream.controller?.abort());
}
```

## SSE vs WebSocket vs Long Polling

| 特性 | SSE | WebSocket | Long Polling |
|------|-----|-----------|--------------|
| 方向 | 单向（服务→客户端） | 双向 | 单向 |
| 协议 | HTTP | 独立协议（TCP） | HTTP |
| 自动重连 | 是（浏览器内置） | 否（需手动） | 否（需手动） |
| 代理兼容性 | 好（标准 HTTP） | 需配置 | 好 |
| 使用复杂度 | 低 | 中 | 低 |
| 适用场景 | 通知、进度、AI 流输出 | 聊天、游戏 | 低频状态查询 |

## 面试常问

- **SSE 和 WebSocket 如何选择？**
  只需服务端推客户端（通知、进度条、AI 生成、实时数据展示）用 SSE，更简单；需要客户端也频繁发数据（聊天、游戏）用 WebSocket。
- **SSE 能穿越代理/防火墙吗？**
  因为是标准 HTTP，兼容性好于 WebSocket；但长连接可能被某些代理超时断开，需设置心跳注释行保活，或配置代理超时时间。
- **SSE 支持 POST 吗？**
  浏览器原生 `EventSource` 只支持 GET。需要 POST（如传请求体）时，可用 `fetch` + `ReadableStream` 手动实现 SSE 解析。
- **为什么 Nginx 前要加 `X-Accel-Buffering: no`？**
  Nginx 默认会缓冲后端响应，导致 SSE 消息被积压。此头告知 Nginx 禁用缓冲，消息实时透传到客户端。
