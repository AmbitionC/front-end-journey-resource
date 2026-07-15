流式响应改善的是“更早看到结果”，不是让生成天然可恢复。客户端收到的是一串有类型的事件；网络可能在任意字节断开，HTTP 200 之后也可能出现错误；调用 `abort()` 往往只保证本地不再等待，不一定停止服务端计算或计费。可靠实现要把传输、模型执行和应用持久状态分开。

## 把流当事件，不要只拼字符串

典型流会包含响应开始、item 创建、文本增量、工具参数增量、item 完成、usage、整体完成和错误。应用应先解析帧，再根据事件类型更新状态机：

```ts
type StreamState = {
  phase: 'idle' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  items: Map<string, OutputItem>;
  lastEventId?: string;
  usage?: Usage;
};

function reduce(state: StreamState, event: GenerationEvent): StreamState {
  // 根据 itemId 与事件类型更新；未知事件保留并告警
  return nextState;
}
```

纯字符串拼接会丢失 item 边界、工具调用、拒绝和终态。网络 EOF 也不能当成功：只有收到供应商定义的完成事件，且所有必需 item 通过校验，结果才可提交。

![客户端取消流后服务端工作可能继续；已确认事件进入日志和快照，新请求从应用状态恢复](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-stream-cancel-resume-event-log-v1.webp)
*图：传输取消与服务端取消是两件事；恢复依赖持久应用状态，而不是随意接回半个字节流。*

## 浏览器与服务端的背压

WHATWG Streams 把数据生产与消费连接成带队列的流。消费者处理较慢时要尊重背压，避免无界缓存。浏览器读取 `fetch()` 的 `ReadableStream` 时，先用流式 `TextDecoder` 处理跨 chunk 的 UTF-8，再按协议帧边界解析；一个网络 chunk 可能含半个事件，也可能含多个事件。

```ts
const decoder = new TextDecoder();
let buffer = '';

for await (const chunk of response.body!) {
  buffer += decoder.decode(chunk, { stream: true });
  const { frames, rest } = splitCompleteFrames(buffer);
  buffer = rest;
  for (const frame of frames) consume(parseEvent(frame));
}
```

若前端通过自有服务接收上游流，服务端也要处理两段背压：供应商到服务端、服务端到浏览器。浏览器断开后应及时取消本地 reader、释放连接并停止无意义的转发；但是否能取消供应商任务，要看具体 API。

## 取消信号要贯穿整条调用链

DOM 的 `AbortController`/`AbortSignal`提供统一取消语义。一次用户操作创建一个 signal，传给 `fetch`、SDK、解析循环和允许取消的本地任务：

```ts
const controller = new AbortController();

const promise = generate({
  request,
  signal: controller.signal,
  deadlineAt,
});

cancelButton.onclick = () => controller.abort('user_cancelled');
```

区分取消原因：用户停止、页面卸载、总 deadline、空闲超时、服务关闭。它们在指标和是否重试上不同。取消必须幂等，多次触发只产生一个终态；清理逻辑放在 `finally`，移除监听器、关闭 reader 和释放锁。

关键限制是：AbortSignal 主要是客户端协作机制。某些 SDK 明确说明，它停止当前请求的客户端等待，但远端工作可能继续并产生费用。应用 UI 应写“已停止接收”，不要承诺“模型已停止计算”，除非供应商提供可查询、可取消的任务并返回确认。

## 前端取消、上游取消和业务撤销

三者不要混为一个动作：

- **前端取消**：不再渲染或等待；
- **上游取消**：通过 API/连接尝试停止模型任务，成功与否要确认；
- **业务撤销**：阻止尚未执行的工具副作用，或以补偿操作撤销已发生副作用。

用户在模型已经发出工具调用后点击停止，邮件可能已发送。工具执行器必须检查调用状态和幂等键，UI 则展示真实结果，不能因为文本流被取消就假装副作用消失。

## “续传”至少有三种含义

### 传输层重连

标准 Server-Sent Events 支持事件 ID 与重连语义，但只有服务端保留事件并理解 `Last-Event-ID` 时才能续接。很多大模型 SDK 使用 SSE 形态传事件，并不承诺任意断点重放；不能仅看到 `data:` 就假设可续传。

### 查询同一后台任务

若 API 创建可持久后台响应/任务，可以断开实时流，之后按任务 ID 查询状态或重新订阅。这是供应商能力，应在适配器中显式建模。

### 应用级恢复

最通用方法是持久化已完成事件、工具副作用和业务事实，失败后从应用状态发起新请求。新的生成不是“接着上一个 token”，而是基于确认点继续任务。要告诉模型已完成什么，并用幂等键防止重复工具操作。

因此，只有得到协议保证的 event ID 才能作为传输游标；任意字节偏移、最后一个 token 或 UI 已显示字符都不是可靠恢复点。

## 确认点与持久化策略

增量每到一个字符就写数据库代价高，而且会把未完成内容变成正式事实。可以分层：

- UI 内存状态：所有 delta，允许丢失；
- 临时快照：按时间/长度合并，用于刷新后显示“未完成草稿”；
- 持久事件：item 完成、工具调用确认、工具结果、整体完成；
- 业务事实：通过验证后单独写业务数据库。

草稿必须标记 `incomplete`，不能参与下一轮权威历史，除非恢复流程明确选择并校验它。完整响应提交时保存覆盖的事件范围、供应商请求 ID 与 usage。

## 截至 2026-07-15 的实现依据

OpenAI 的[流式响应指南](https://developers.openai.com/api/docs/guides/streaming-responses)描述 Responses API 当前的语义化事件与消费方式。Anthropic TypeScript SDK 的[官方仓库](https://github.com/anthropics/anthropic-sdk-typescript)列出 MessageStream 的 text、message、error、abort、end 等事件与 `.abort()`/终态帮助方法。

Google Gen AI JavaScript SDK 的[官方文档](https://googleapis.github.io/js-genai/)支持传入 `abortSignal`，并明确提醒取消属于客户端行为，可能不会取消服务端工作或相关计费。这一提醒适合作为通用保守假设，直到所用供应商提供更强保证。

[WHATWG Streams Standard](https://streams.spec.whatwg.org/)规定 Web Streams 与背压模型，[DOM Standard](https://dom.spec.whatwg.org/#aborting-ongoing-activities)定义 AbortSignal 的取消机制，[HTML Standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)定义 Server-Sent Events。供应商事件字段仍以当期 API 文档为准。

## 测试清单

- UTF-8 字符被分割到两个 chunk；
- 一个 chunk 包含多个事件；
- HTTP 200 后出现流内错误；
- 文本完成但整体完成事件缺失；
- 工具参数中途断流；
- 用户连续点击取消；
- 浏览器断开但上游仍运行；
- 取消与完成同时到达；
- 重连时服务端不支持 event replay；
- 临时草稿不会被当作权威历史。

观测指标包括首事件延迟、事件间最大空闲、取消原因、取消后上游持续时间、未收到终态比例、临时快照大小和工具重复次数。

## 常见误区

- 每个网络 chunk 就是一条完整事件；
- 收到 HTTP 200 就认为不会失败；
- EOF 等于 completed；
- `abort()` 一定停止远端计算和计费；
- 看到 SSE 就自动支持 `Last-Event-ID` 续传；
- 把最后一个 token 当可靠游标；
- 将半截文本写成正式 assistant 历史；
- 文本取消后忽略已经执行的工具副作用。

## 小结

可靠流式调用以事件状态机为中心：正确处理帧、UTF-8、背压和流内错误，用 AbortSignal 传播本地取消，但不夸大服务端保证。持久化完成 item 与业务副作用，通过任务查询或应用确认点恢复，而不是从任意 token 续接。这样流式体验才不会牺牲一致性和可审计性。

## 参考资料

- [OpenAI — Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [Anthropic — TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Google Gen AI SDK for TypeScript and JavaScript](https://googleapis.github.io/js-genai/)
- [WHATWG — Streams Standard](https://streams.spec.whatwg.org/)
- [WHATWG — DOM Standard: aborting ongoing activities](https://dom.spec.whatwg.org/#aborting-ongoing-activities)
- [WHATWG — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
