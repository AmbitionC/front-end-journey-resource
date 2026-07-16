Agent 的一次回答并不是一个不可分割的“模型调用”，而是一棵有因果关系的操作树：接收请求、规划、检索、调用模型、执行工具、等待外部系统、校验结果，最后汇总输出。Trace 模型的价值，是让每段工作拥有边界、父子关系和可比较的结果；这样“慢”“贵”“错”才能落到具体环节，而不是只剩一条总耗时。

[OpenTelemetry 对信号的定义](https://opentelemetry.io/docs/concepts/signals/)把 Trace 描述为请求穿过系统的路径，把 Span 描述为其中一段有开始和结束的工作。Agent 工程可以沿用这套稳定心智模型，但还要额外表达 Run、模型轮次、工具副作用和人工审批等业务语义。

![Agent Run 中 Trace、Span 与点事件的因果层级](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-trace-model-trace-waterfall-v1.webp)

图中最重要的不是瀑布图外观，而是三条约束：同一条 Trace 共享 Trace ID；每个 Span 有自己的 Span ID；Event 只是 Span 内某一时刻发生的事实，不是假装成瞬时 Span 的另一段工作。

## 四个容易混淆的对象

### Run：一次产品语义上的执行

Run 是 Agent 产品最自然的聚合边界，例如“用户提交一次报销核验请求”或“定时任务处理一个工单”。它可能跨多个进程、队列消息和人工等待，也可能因为恢复机制延续数小时。Run ID 用于产品侧检索和状态管理，不应取代 Trace ID。

一次 Run 可以有一条主 Trace，也可能在异步恢复、超长等待或跨保留周期时拆成多条 Trace，再用 Run ID 或 Link 关联。强行让一条 Trace 永不结束，会造成采样、存储和可视化工具难以承受。

### Trace：一次因果传播链

Trace 表达“这些操作为什么属于同一次请求”。跨 HTTP、消息队列、工具网关传播时，应使用标准上下文而不是自造请求头。[W3C Trace Context](https://www.w3.org/TR/trace-context/)定义了 `traceparent` 与 `tracestate` 的传播格式，使不同组件可以在不共享内部实现的前提下延续同一条因果链。

传播上下文不等于传播全部业务数据。Trace ID 可以跨服务，用户输入、密钥、完整工具参数则不应因为“方便排障”而无条件写入 Baggage 或 Span 属性。

### Span：一段有持续时间的工作

Span 适合表示模型推理、检索、工具执行、审批等待、队列消费等有清晰开始与结束的操作。一个 Span 至少应包含：操作名、开始/结束时间、状态、父 Span、关键低基数属性和错误类型。操作名要稳定，例如 `agent.invoke`、`model.generate`、`tool.execute`，不要把用户问题或 URL 全文塞进名称，否则会制造高基数和隐私风险。

### Event：Span 中的点状事实

[OpenTelemetry 的事件约定](https://opentelemetry.io/docs/specs/semconv/general/events/)建议：当信息描述一个可重复出现、需要独立时间戳的点状发生时使用 Event；当它有持续时间和有意义的边界时使用 Span。比如“重试被调度”“审批被拒绝”“流式首个 token 到达”可以是 Event，而“等待审批 18 分钟”应是 Span。

## 一套可落地的事件模型

可以先定义最小公共信封，再为不同操作扩展属性：

```json
{
  "eventId": "evt_01J...",
  "runId": "run_01J...",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "parentSpanId": "b7ad6b7169203331",
  "occurredAt": "2026-07-16T12:03:04.123Z",
  "kind": "tool.completed",
  "schemaVersion": 3,
  "attributes": {
    "tool.name": "invoice.lookup",
    "tool.version": "2026-07-10",
    "outcome": "success"
  }
}
```

`eventId` 支持去重，`schemaVersion` 支持长期演进，`occurredAt` 表示事实发生时间。采集器收到数据的时间可以另存为 observed time，不能覆盖原始发生时间，否则排队和网络抖动会重排因果顺序。

模型、工具与 Agent 的语义属性仍在快速演进。2026-07-16 查看 OpenTelemetry GenAI 约定时，相关属性明确标注了不同稳定性阶段。因此生产系统应固定所采用的语义版本，并在升级时做字段映射，而不是把“当前文档里的字段名”当成永久数据库契约。

## 如何划分 Span

划分过粗时，只能看到 `agent.run = 12s`；划分过细时，每个函数都变成 Span，成本高却没有诊断价值。一个实用判断法是：某段工作是否拥有独立的依赖、超时、重试、成本、权限或失败责任？只要其中一项答案为“是”，通常就值得成为 Span。

例如一次带工具的回答可以这样分层：

```text
agent.invoke
├── planner.decide
├── retrieval.search
├── model.generate
├── tool.execute
│   ├── approval.wait
│   └── http.client
└── response.validate
```

并行工具调用不应伪装为串行子节点；它们拥有重叠时间区间。异步队列生产与消费之间可以用传播上下文或 Span Link 表达，不要通过修改时间戳制造假的连续瀑布。

## 状态、错误与结果

Span 的状态只回答“这段操作是否按技术约定完成”，不等于业务质量。模型成功返回 200 但答案错误时，模型 Span 可以是技术成功，Run 的质量评估则记录为失败。把这两个概念混在一个 `success` 布尔值里，会让可靠性指标失真。

错误记录至少包含稳定的 `error.type`、可公开的消息摘要、是否可重试以及失败阶段。堆栈、Prompt、工具参数和结果常含敏感信息，应采用显式允许列表、脱敏和分级保留策略。Trace 是调查索引，不是把所有上下文永久复制一份的借口。

## 采样与成本

全量保留所有成功 Run 往往昂贵，单纯随机采样又可能漏掉罕见高风险失败。常见组合是：头部进行低比例随机采样，尾部根据错误、极端延迟、高成本、安全规则命中或用户投诉提升保留率。无论使用哪种策略，都必须保留采样决策及其版本，否则指标分母和失败率无法解释。

还要避免用 Trace 属性承载无限基数：用户 ID、完整文档 ID、自由文本和每次变化的 Prompt 都会拖垮索引。可以将受控哈希、分桶、数据分类或对象引用写入 Trace，把敏感原文放在有权限和保留期控制的证据仓库中。

## 常见误区

- 把 Run ID 当 Trace ID，导致跨系统传播不兼容，也无法表达一个 Run 的多条 Trace。
- 每个日志行都创建 Span，使瀑布图充满零价值节点；点状事实应优先使用 Event。
- 只记录开始事件、不保证结束或超时收口，最终大量 Span 永久悬挂。
- 用技术成功替代任务成功，掩盖“调用完成但答案无效”的质量问题。
- 把输入、密钥和工具返回值默认写入属性，先造成泄露，再试图用访问控制补救。
- 升级语义约定却不记录版本，使相同字段在不同月份代表不同含义。

## 验收清单

一个可用的 Agent Trace 系统应能回答：某次 Run 为什么触发这个工具；工具使用了哪个版本；审批和重试发生在何时；哪个 Span 消耗了主要延迟与 token；结果校验为什么失败；数据是否被采样、脱敏或截断。若这些问题仍需拼接多个没有共同 ID 的日志文件，Trace 模型还没有真正落地。

## 小结

Run 是产品执行边界，Trace 是因果传播链，Span 是有持续时间的操作，Event 是带时间戳的点状事实。正确的建模先保证父子关系、传播和版本，再谈漂亮的瀑布图。它最终服务于指标、日志、调试和审计，因此必须同时控制基数、成本与敏感数据。

## 参考资料

- [OpenTelemetry：Signals](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry：Semantic conventions for events](https://opentelemetry.io/docs/specs/semconv/general/events/)
- [W3C：Trace Context](https://www.w3.org/TR/trace-context/)
