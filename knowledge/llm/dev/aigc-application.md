## 集成大模型，重点不是一个请求按钮

演示项目只需要在浏览器里发出请求；可上线的产品还要处理密钥、身份、配额、流式状态、内容安全、工具权限、上下文和可观测性。最稳妥的基本架构是：**浏览器只访问自己的 BFF，BFF 再访问模型与工具服务**。

![大模型前端应用的 BFF 与流式架构](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/aigc-application-bff-stream-v3.webp)

## 一、为什么必须有自己的服务端

模型密钥一旦进入浏览器，就能被开发者工具、代理或打包产物读取。CORS 不是密钥保护机制，即使请求技术上能从浏览器发出，也不应把长期 Provider Key 交给用户设备。

BFF（Backend for Frontend）承担：

- 校验登录态，将请求绑定用户与租户。
- 保存模型密钥，按环境切换提供方和模型。
- 限制输入长度、频率、并发和预算。
- 组装系统指令、上下文与知识检索结果。
- 执行工具的权限验证和副作用确认。
- 把不同模型的流式事件转换成前端稳定协议。
- 记录 request ID、usage、延迟和错误分类。

前端因此只依赖自有接口，例如 `POST /api/chat`，不会被提供方协议绑死。

## 二、先设计消息与状态机

聊天 UI 不应只用 `loading: boolean`。一次回答至少会经历：

```ts
type RequestState =
  | "idle"
  | "submitting"
  | "streaming"
  | "completed"
  | "error"
  | "cancelled";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "streaming" | "done" | "error";
  requestId?: string;
};
```

推荐流程：

1. 用户提交后立即插入用户消息与空的 assistant 占位消息。
2. 状态切到 `submitting`，防止重复提交。
3. 收到 `start` 事件保存服务端 `requestId`，切到 `streaming`。
4. `delta` 只追加到当前 assistant 消息。
5. 收到 `done` 后固化消息；收到 `error` 或取消时保留已生成内容并标记状态。

通过消息 ID 定位更新对象，不要假设“数组最后一条永远是当前回答”，否则并发会话或重试很容易串写。

## 三、BFF 流式接口

以下用通用 Web API 展示结构；模型 SDK 可以替换，但浏览器协议保持不变。

```ts
export async function POST(request: Request) {
  const session = await requireSession(request);
  const { message, conversationId } = await request.json();

  validateInput(message);
  await enforceQuota(session.userId);

  const requestId = crypto.randomUUID();
  const upstream = await createModelStream({
    message,
    conversationId,
    userId: session.userId,
    signal: request.signal,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(
          `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
        ));
      };

      send("start", { requestId });
      try {
        for await (const item of upstream) {
          if (item.type === "text") send("delta", { text: item.text });
          if (item.type === "tool") send("tool", item.publicStatus);
        }
        send("done", {});
      } catch (error) {
        if (!request.signal.aborted) {
          send("error", toPublicError(error));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
```

`request.signal` 很重要：浏览器停止生成或关闭页面后，BFF 应取消上游，避免无用计算继续消耗配额。

## 四、前端消费流

聊天通常是 POST，因此使用 `fetch` 与 `ReadableStream`。解析器必须跨网络 chunk 缓冲 SSE 帧，不能把一次 `read()` 当作一个事件。

```ts
const controller = new AbortController();

async function sendMessage(message: string) {
  setState("submitting");
  const assistantId = createAssistantPlaceholder();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    await consumeSSE(response, (event) => {
      const data = JSON.parse(event.data);
      if (event.event === "start") setState("streaming");
      if (event.event === "delta") queueText(assistantId, data.text);
      if (event.event === "done") markDone(assistantId);
      if (event.event === "error") markError(assistantId, data);
    });
  } catch (error) {
    if ((error as DOMException).name === "AbortError") {
      markCancelled(assistantId);
      setState("cancelled");
    } else {
      markError(assistantId, { code: "NETWORK_ERROR" });
      setState("error");
    }
  }
}
```

频繁拼接文本会引发大量渲染。可以在内存中累计 delta，用 `requestAnimationFrame` 批量更新 React/Vue 状态；Markdown 解析也应节流，完成后再做一次完整渲染。

## 五、Markdown 与内容安全

模型输出是不可信文本。若渲染 Markdown：

- 默认禁用原始 HTML，或用成熟的 sanitizer 严格净化。
- 限制链接协议为 `https` 等允许列表，阻止 `javascript:`。
- 代码块只做语法高亮，不执行其中代码。
- 外链使用安全的 `rel` 属性，必要时显示离站提示。
- 不把模型内容直接传给 `innerHTML`。

提示词不能替代输出净化。即使系统指令要求“不要输出脚本”，模型也可能复述用户输入或外部检索内容。

## 六、上下文不能无限追加

把整个会话每次都从浏览器回传既浪费 token，也让用户可以篡改历史。更稳妥的方式是浏览器传 `conversationId` 和新消息，服务端从可信存储读取历史。

上下文管理通常包含：

- 保留最近若干轮原文。
- 将更早内容压缩为可追踪摘要。
- 只检索与当前问题相关的知识片段。
- 对工具结果和附件使用引用 ID，而不是重复注入全文。
- 计算 token 预算，为回答预留输出空间。

摘要会丢失信息，关键事实应存为结构化状态并让用户确认，而不是只依赖模型总结。

## 七、工具交互要让用户看得懂

前端不应只显示“思考中”。统一事件协议可以公开安全的工具状态：

```ts
type PublicToolEvent = {
  name: "search_docs" | "query_order";
  status: "waiting_confirmation" | "running" | "done" | "failed";
  summary: string;
};
```

查询类工具可显示“正在搜索知识库”；付款、删除和发送消息等操作必须展示最终参数并要求确认。确认按钮调用独立受保护接口，不能让模型的一段文字直接触发高风险动作。

## 八、错误和重试体验

至少区分：

- `401/403`：登录或权限问题，引导重新登录，不重试模型。
- `429`：频率或配额限制，显示可重试时间。
- `5xx`：服务暂时不可用，可提供手动重试。
- 流中断：保留已经生成的文字，明确标记不完整。
- 用户取消：属于正常状态，不显示成系统故障。

重试时应生成新的 assistant 消息版本，并保留原用户输入。对可能产生副作用的工具不能自动重放；服务端需用幂等键去重。

## 九、监控真正影响体验的指标

除了总响应时间，还应记录：

- 首事件时间与首字时间。
- 流式生成持续时间、异常中断率和用户取消率。
- 输入/输出 token、单用户成本和缓存命中。
- 工具调用成功率、确认率与 P95 延迟。
- Markdown 渲染耗时、长任务掉帧与前端错误。
- 按模型/提示版本分组的质量评测结果。

浏览器只接收脱敏后的 `requestId`，服务端用它串联 BFF 日志、模型请求和工具调用。不要把完整提示词、隐私内容或密钥写进前端埋点。

## 上线检查清单

- [ ] Provider Key 只在 BFF，未进入浏览器代码和接口响应。
- [ ] 接口验证登录态、输入长度、频率、并发和预算。
- [ ] 前端有明确状态机，能完成、失败、停止和重试。
- [ ] 流式解析跨 chunk 缓冲，取消信号能传到模型端。
- [ ] Markdown/链接按不可信内容净化。
- [ ] 会话历史由服务端可信存储管理，并有 token 预算。
- [ ] 高风险工具展示最终参数并要求用户确认。
- [ ] request ID、usage、首字延迟和错误分类可观测。
- [ ] 核心任务有固定评测集，模型或提示升级后会回归。

## 参考资料

- [OpenAI：Text generation](https://developers.openai.com/api/docs/guides/text)
- [OpenAI：Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI：Safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices)
- [WHATWG：Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
