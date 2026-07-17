流式 UI 接收的不是“不断变长的字符串”，而是一条可能断开、重复、乱序并包含文本、引用、工具和状态的事件流。正确做法是把字节解码、协议解析、幂等 reducer 和渲染调度分层，再为取消、重连和继续生成定义服务端语义。

![Agent 流式 UI 从字节 Chunk、事件解析、序号校验到幂等 Reducer 和渲染状态](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-streaming-ui-event-reducer-v1.webp)
*图：网络 chunk 不等于 token 或事件；runId、eventId 与 seq 让重连和重复投递可对账。*

## Transport 与逻辑事件分开

[WHATWG Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html)定义 `text/event-stream`、event/data/id/retry 字段和 EventSource 重连。SSE 适合服务端单向推送，浏览器可带 last event id；但认证 header、POST 输入和代理超时需结合部署评估。

Fetch body 的 ReadableStream 更灵活。[Streams Standard](https://streams.spec.whatwg.org/)说明数据以 chunk 到达；chunk 边界可能切在 UTF-8 字符或 JSON 中间，也可能包含多个事件。必须用流式 TextDecoder，再按协议分隔符累积解析，不能每个 chunk 直接 `JSON.parse`。

## 定义 typed event

事件 envelope 至少含 runId、eventId、seq、type 和 payload：

```json
{"runId":"r1","seq":17,"type":"text.delta","payload":{"partId":"p1","delta":"..."}}
```

类型可包括 run.started、message.created、text.delta、citation.added、tool.requested、tool.result、usage.updated、run.completed 和 error。最终 completed 携带服务端权威 message/version/hash，用于校验增量结果。

不要用文本内容去重；相同词可以合法出现两次。eventId/seq 才是身份。协议版本进入响应，未知 optional 事件可忽略，未知关键事件应停止并提示升级。

## Reducer 保证幂等

网络层只产生完整事件，reducer 纯函数地把 `(state,event)` 变成新状态。已见 eventId 忽略；seq 小于 nextSeq 视为重复，大于则检测 gap，暂停应用并请求补发。不同 run 不能写同一 active buffer。

React 渲染不必跟每个 token 同步。事件先进入内存队列，按 animation frame 或 30–60ms 批处理，减少 Markdown 重解析和 layout。数据层仍保留每个事件，显示层可合并 delta。

## 取消有三层语义

关闭 UI、abort fetch 和取消服务端 run 是三件事。`AbortController` 只保证客户端不再读取，服务端模型或工具可能继续消耗资源。取消接口以 runId + expectedVersion 提交，服务端转换为 cancelling，传播到可取消操作并最终发 cancelled。

不可取消的外部工具可能已经执行。UI 显示“已停止继续生成；某操作可能已提交”，并查询 tool operation ledger。不要把 Stop 按钮宣传成撤销。

## 重连与恢复

客户端保存 lastAppliedSeq，断线后请求 `/runs/r1/events?after=17`。服务端在保留窗口内重放；超出窗口则返回当前 snapshot 和 nextSeq。snapshot 也有 version/hash，reducer 原子替换，不把旧增量再次拼上。

网络在线不代表 stream 活跃。心跳、idle deadline 和代理配置要协调；心跳不进入业务 reducer。重连指数退避带抖动，并在离线时等待浏览器 online 只是提示，仍以实际请求为准。

## Continue 与 Retry

Retry 若服务端未确认原 run 是否提交，复用 idempotency key 查询，不能直接开新 run。Continue 通常创建 child run，输入引用上一条已提交 message 和 continuation point；原回答保留，避免拼接成无法审计的单条消息。

当上下文已超限或权限过期，继续按钮应引导用户修改，而不是无限重试同一请求。可恢复错误显示已保留的部分文本，并明确后续动作会产生新 run。

## 渲染与辅助技术

流式 Markdown 在 fence 未闭合时可能结构抖动。解析器应容忍 incomplete block，代码块先作为纯文本，完成后再高亮。滚动只在用户接近底部时跟随。

屏幕阅读器不播每个 delta；使用可访问状态“正在生成”，在完整句/段或完成后礼貌通知。Stop、Retry、Continue 有稳定名称和焦点，完成时不强制跳焦点。

## 验证

用随机 chunk 边界切割多字节字符和 JSON，测试多个事件同 chunk、重复 seq、gap、乱序、断线、snapshot fallback、取消竞态、完成事件丢失和多 run 并发。属性测试同一事件序列重复投递后状态不变。

流式体验的顺滑来自协议可恢复和 reducer 可证明，而不是更频繁地 `setState`。当网络最差时仍不重复、不串流、不丢终态，才是合格实现。

## 参考资料

- [WHATWG HTML：Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [WHATWG：Streams Standard](https://streams.spec.whatwg.org/)
