## SSE 解决什么问题

大模型生成通常需要数秒甚至更久。如果等完整结果生成后再返回，用户会面对一段无反馈的空白。SSE（Server-Sent Events）允许服务端在一个 HTTP 响应中持续发送文本事件，前端收到增量后立即更新界面。

它适合“请求一次、服务端持续向客户端推送”的场景，例如聊天回答、任务进度和日志。它不是双向协议：如果客户端和服务端都需要高频主动发送消息，WebSocket 往往更合适。

![SSE 中网络分块与事件边界的区别](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-sse-streaming-boundaries-v2.png)

## 一、先理解协议帧

SSE 响应的媒体类型是 `text/event-stream`，编码固定为 UTF-8。一个事件由若干字段行组成，并由**空行**结束：

```text
event: delta
id: 42
data: {"text":"你好"}

event: done
data: {"usage":{"output_tokens":12}}

```

四个常用字段：

- `data`：事件内容；多个 `data` 行会用换行符拼接。
- `event`：事件类型；省略时默认为 `message`。
- `id`：事件 ID，可用于断线续传。
- `retry`：建议客户端重连等待的毫秒数。

以 `:` 开头的行是注释，常用作心跳。字段名区分大小写，未知字段会被忽略。行尾可能是 `LF`、`CRLF` 或 `CR`，健壮解析器不能只假设一种形式。

## 二、EventSource 与 fetch 流不是一回事

浏览器原生 `EventSource` 使用简单，具备自动重连与 `Last-Event-ID` 语义，适合可用 GET 表达的订阅：

```ts
const source = new EventSource("/api/jobs/123/events");

source.addEventListener("progress", (event) => {
  const payload = JSON.parse((event as MessageEvent).data);
  console.log(payload.percent);
});

source.addEventListener("done", () => source.close());
```

但聊天请求通常需要 POST JSON、鉴权头和 `AbortController`。原生 `EventSource` 构造器不提供任意请求体或自定义请求头，因此更常见的做法是 `fetch()` 发起 POST，再读取 `response.body`。

选择原则：

| 场景 | 推荐 |
|---|---|
| GET 订阅、希望浏览器自动重连 | `EventSource` |
| POST 聊天、需要自定义头和请求体 | `fetch` + `ReadableStream` |
| 真正双向实时通信 | WebSocket |

## 三、服务端：定义自己的稳定事件协议

不要把某家模型提供方的原始事件直接透传给前端。BFF 应将不同提供方事件统一为业务协议，例如：

```ts
type ChatEvent =
  | { type: "start"; requestId: string }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string; status: "running" | "done" }
  | { type: "done"; usage?: { input: number; output: number } }
  | { type: "error"; code: string; retryable: boolean };

function encodeSSE(event: ChatEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
```

以 Web 标准 `ReadableStream` 为例：

```ts
export async function POST(request: Request) {
  const body = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const requestId = crypto.randomUUID();
      controller.enqueue(encoder.encode(encodeSSE({ type: "start", requestId })));

      try {
        for await (const text of generateModelDeltas(body, request.signal)) {
          controller.enqueue(encoder.encode(encodeSSE({ type: "delta", text })));
        }
        controller.enqueue(encoder.encode(encodeSSE({ type: "done" })));
      } catch (error) {
        if (!request.signal.aborted) {
          controller.enqueue(encoder.encode(encodeSSE({
            type: "error", code: "MODEL_STREAM_FAILED", retryable: true,
          })));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
```

真实实现还要在客户端断开时取消上游模型请求，并避免继续向已关闭的 controller 写入。部署在 Nginx 等代理后时，还要确认响应未被代理聚合；`X-Accel-Buffering: no` 是 Nginx 专用提示，不是 SSE 标准的一部分。

## 四、前端：跨 chunk 增量解析

这是最容易写错的地方：一次 `reader.read()` 得到的是网络字节块，不是完整 SSE 事件。一个 UTF-8 字符、字段行甚至空行都可能被拆到两个 chunk 中；一个 chunk 也可能包含多个事件。

因此必须：增量解码 → 保留未完成缓冲 → 按空行取完整帧 → 逐行解析字段。

```ts
type ParsedEvent = { event: string; data: string; id?: string };

function parseFrame(frame: string): ParsedEvent | null {
  let event = "message";
  let id: string | undefined;
  const data: string[] = [];

  for (const line of frame.split(/\r\n|\r|\n/)) {
    if (line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id" && !value.includes("\0")) id = value;
  }

  return data.length ? { event, data: data.join("\n"), id } : null;
}

async function consumeSSE(response: Response, onEvent: (e: ParsedEvent) => void) {
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split(/\r\n\r\n|\r\r|\n\n/);
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const event = parseFrame(frame);
      if (event) onEvent(event);
    }
  }

  buffer += decoder.decode();
  // 按 SSE 规范，没有以空行结束的残缺事件不应被派发。
}
```

不能在每个 chunk 上直接 `split("\n")` 后解析；那会在弱网、中文多字节字符或代理重新分块时随机失败。

## 五、聊天调用与取消

```ts
const controller = new AbortController();

const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "解释事件循环" }),
  signal: controller.signal,
});

await consumeSSE(response, (event) => {
  const payload = JSON.parse(event.data);
  if (event.event === "delta") appendText(payload.text);
  if (event.event === "error") showError(payload.code);
});

// 用户点击停止
controller.abort();
```

UI 不宜每收到一个 token 就触发一次完整渲染。可以先累计文本，再通过 `requestAnimationFrame` 或 16～50ms 的小窗口批量刷新。这样既保留流式体感，又避免大量布局和 Markdown 解析。

## 六、重连、幂等与错误语义

流在中途断开时，客户端不知道上游是否已经产生费用或执行工具。因此“自动重试整个 POST”可能造成重复回答或重复副作用。

可靠方案包括：

- 每次请求生成稳定的幂等键，服务端保存执行状态。
- 每个业务事件带递增 `id`，服务端保留短期事件日志。
- 重连时携带最后确认的事件 ID，只补发后续事件。
- 只对明确可重试的读取操作自动重试；写操作由用户确认。
- 区分 HTTP 建连失败、流内 `error` 事件、用户取消与正常 `done`。

如果不实现续传，就应明确告诉用户“连接已中断，请重新生成”，不要假装能够无缝恢复。

## 七、生产环境排查

### 一直等到最后才出现

通常是框架、CDN、压缩器或反向代理缓冲了响应。检查 `Content-Type`、缓存/转换设置、代理缓冲配置，并用 `curl -N` 观察是否逐段到达。

### 偶发 JSON 解析错误

通常是把 chunk 当事件，或没有处理多行 `data`、CRLF 和 UTF-8 跨块字符。采用持久缓冲和增量 `TextDecoder`。

### 用户停止后仍然计费

前端只停止渲染但没有 `abort()`，或 BFF 没把断开信号传给上游。取消必须贯穿浏览器、BFF 和模型请求。

### 长连接被网关切断

发送注释心跳、配置合理空闲超时，并让客户端正确识别可重试错误。心跳间隔必须小于链路中最短空闲超时。

## 上线检查清单

- [ ] 使用 `text/event-stream; charset=utf-8`，事件以空行结束。
- [ ] BFF 输出统一业务事件，不直接暴露提供方协议。
- [ ] 客户端跨 chunk 缓冲，支持多行 `data` 与不同换行符。
- [ ] `AbortController` 能真正取消上游请求。
- [ ] UI 对 delta 批量渲染，Markdown 经过安全净化。
- [ ] 代理、压缩和 CDN 不会无意缓冲流。
- [ ] `done`、流内错误、HTTP 错误和用户取消彼此可区分。
- [ ] 重连策略与幂等/副作用规则一致。

## 参考资料

- [WHATWG HTML：Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [WHATWG Streams Standard](https://streams.spec.whatwg.org/)
- [OpenAI：Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
