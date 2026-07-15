大模型生成接口正在从“聊天消息进、单段文本出”演化为可承载内容部件、工具、后台任务、状态和事件的统一交互接口。Chat、Responses、Messages、`generateContent` 或 Interactions 的名称不同，真正需要理解的是三种层次：请求表达能力、执行生命周期、应用自己的稳定抽象。

## Chat 模式解决了什么

Chat 风格把上下文组织成角色消息序列，对多轮文本和基本工具调用非常直观：

```text
messages = [
  system instruction,
  user message,
  assistant response,
  tool result
]
```

它的优势是模型简单、生态成熟；局限是随着图片、文件、工具结果、推理事件、后台任务和持久状态增加，所有内容都挤进“消息”会变得勉强。不同供应商对 system/developer、assistant、tool 等角色的权限与合法顺序也不同。

## 统一生成/交互模式增加了什么

较新的接口倾向用多类型 item 或 interaction 表达生命周期：输入可以是消息、图片、文件或工具结果，输出可以是文本、工具调用、结构化数据、拒绝和状态引用，流中则产生带类型的事件。这不是简单改 endpoint，而是从“一个完成对象”转为“一个可继续的执行记录”。

![Chat 消息与富内容请求经应用适配器归一化为事件，并供 UI、工具、存储和观测消费](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-response-api-patterns-adapter-matrix-v1.webp)
*图：统一层应对齐业务语义和事件，同时保留供应商特有能力的受控出口。*

统一接口并不自动等于应用应该直接依赖它。供应商会继续演化字段；应用仍需要自己的生成契约，把业务与某个 SDK 版本隔离。

## 应用抽象应该放在哪里

推荐分四层：

```text
Business Use Case
  ↓ task intent
Generation Service
  ↓ normalized request / event
Provider Adapter
  ↓ exact SDK and API contract
Provider API
```

业务层只表达任务和验收标准；生成服务负责路由、预算、工具权限、事件与观测；适配器映射供应商字段；最底层才调用 SDK。

```ts
interface GenerateInput {
  taskId: string;
  conversationRef?: string;
  content: ContentPart[];
  instructions: InstructionBlock[];
  tools?: ApprovedTool[];
  output?: { schema?: object; media?: 'text' | 'image' };
}

type GenerationEvent =
  | { type: 'started'; attemptId: string }
  | { type: 'text_delta'; itemId: string; delta: string }
  | { type: 'tool_call_ready'; call: ValidatedToolCall }
  | { type: 'output_item_done'; itemId: string }
  | { type: 'completed'; result: GenerateResult }
  | { type: 'failed'; error: NormalizedError };
```

事件是比最终文本更稳的边界：UI 可以渲染增量，工具执行器只订阅就绪调用，存储只在 item/response 完成时提交，观测记录全部状态。

## 归一化什么，保留什么

适合归一化的是跨供应商稳定概念：

- 内容部件与资源引用；
- 指令层级的应用语义；
- 已获权工具与参数 Schema；
- 增量、item 完成、终态、拒绝、截断和错误；
- usage、请求 ID、模型与延迟等观测字段。

不适合假装统一的是：供应商独有推理控制、缓存断点、搜索来源、特定媒体编辑、后台模式和状态对象。可设计受控 escape hatch：

```ts
providerOptions?: {
  openai?: OpenAIOptions;
  anthropic?: AnthropicOptions;
  google?: GeminiOptions;
}
```

它只能由生成基础设施或受审查的业务模块使用，不能让任意调用方把供应商参数到处传播。适配器还要返回 `providerMetadata` 用于调试，但业务判断不能依赖未声明的原始字段。

## 完整对象与流式事件共用一个结果模型

非流式请求一次返回完整对象；流式请求逐事件到达。两条路径最终必须收敛为相同 `GenerateResult`，否则线上会出现“非流式支持工具，流式只拼文本”的双重语义。

事件聚合器需要处理：重复事件、不同 item 并行、文本增量、参数增量、流内错误和最终 usage。只有收到供应商定义的完成事件并通过验证后，才能把结果标为 completed。网络 EOF 不是成功信号。

```text
provider stream → adapter events → reducer → normalized result
                                  ↘ live UI
                                  ↘ trace
```

Reducer 应是可测试的纯状态机。把录制的事件序列作为 fixture，可重现乱序、断流和工具调用边界问题。

## 状态接口与应用状态

统一生成接口常提供上一响应引用或持久交互对象。适配器可把它封装为不透明 `continuationRef`，但应用仍保留自己的消息事件与业务事实。否则切换接口时无法迁移，也不能独立完成审计和删除。

不要把供应商 response ID 当应用 conversation ID：一次会话可能分支、重试或跨供应商，二者是多对多关系。统一层应保存本次调用使用了哪个 continuation、产生了哪个新引用，以及它对应哪些应用事件。

## 从 Chat 迁移的步骤

迁移不能只把 `chat.completions.create` 换成另一个方法名。建议：

1. 盘点消息角色、工具、图片、JSON、流式与错误依赖；
2. 录制代表性请求和验收结果，敏感数据脱敏；
3. 建立应用统一请求、事件与终态；
4. 先实现旧 Chat 适配器，证明抽象没有改变行为；
5. 增加新接口适配器，比较工具、拒绝、截断、usage 和状态；
6. 影子流量只比较，不影响用户；
7. 按任务分桶灰度，保留快速回滚；
8. 最后才启用新接口独有能力。

输出文本相近不代表迁移成功。结构化字段、工具副作用次数、首 token、费用、安全拒绝和追踪完整性都要回归。

## 截至 2026-07-15 的接口现状

OpenAI 的[迁移指南](https://developers.openai.com/api/docs/guides/migrate-to-responses)对比 Responses API 与 Chat Completions，并描述当前输入/输出 item、状态和工具等差异；[文本生成指南](https://developers.openai.com/api/docs/guides/text)提供 Responses 路线的当前用法。

Gemini 的 [Interactions API 概览](https://ai.google.dev/gemini-api/docs/interactions-overview)展示服务端状态、执行步骤与后台任务等交互能力；`generateContent` 的[文本生成指南](https://ai.google.dev/gemini-api/docs/generate-content/text-generation)仍代表另一条成熟调用路线。OpenAI 兼容层可降低迁移摩擦，但其[兼容文档](https://ai.google.dev/gemini-api/docs/openai)不应被解读为所有语义完全相同。

Anthropic Messages 等接口也可映射到应用抽象，但消息内容块、工具和流事件要按其官方契约实现，不能复制另一家接口的角色规则。

## 契约测试矩阵

每个适配器至少运行同一套用例：

| 场景 | 关键断言 |
| --- | --- |
| 文本 | item 顺序、结束原因、usage |
| JSON Schema | 结构验证失败可见，不静默修正 |
| 工具 | 调用 ID、参数、结果回填、幂等 |
| 多模态 | 内容顺序与资源引用正确 |
| 流式 | 增量聚合等于完整结果，断流不提交 |
| 拒绝/截断 | 显式状态，不伪装为正常文本 |
| 取消/超时 | 原因准确，释放本地资源 |
| 追踪 | 逻辑、attempt、供应商请求 ID 齐全 |

fixture 应随 SDK 和 API 版本更新。供应商新增事件类型时，默认策略应保留并告警，而不是无声丢弃。

## 常见误区

- 把新接口当作仅仅换名字；
- 将统一层压成字符串输入输出；
- 业务直接依赖 `rawResponse`；
- 流式和非流式实现两套结果语义；
- 把 EOF 当完成事件；
- 将供应商 response ID 当应用会话主键；
- 兼容接口能运行，就认为工具、错误与 usage 完全一致；
- 迁移只比较文本，不比较成本、拒绝和副作用。

## 小结

Chat 是消息组织模式，Responses/Interactions 类接口更接近多类型执行记录，而应用需要的是独立于两者的稳定任务、事件和终态契约。归一化稳定语义、保留受控扩展、用同一 reducer 收敛流式与非流式，并通过契约矩阵迁移，才能既利用新能力，又不把业务锁进某个短期 API 形态。

## 参考资料

- [OpenAI — Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI — Text generation](https://developers.openai.com/api/docs/guides/text)
- [Gemini API — Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Gemini API — Text generation](https://ai.google.dev/gemini-api/docs/generate-content/text-generation)
- [Gemini API — OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
