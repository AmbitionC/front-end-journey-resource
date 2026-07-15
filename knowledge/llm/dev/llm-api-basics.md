调用大模型 API 看似只是“发一段文字、收一段文字”，生产系统却必须同时处理消息语义、内容类型、模型能力、流式事件、工具调用、用量与计费、错误和追踪。可靠的心智模型不是一个聊天输入框，而是一条可验证、可观测的请求生命周期。

## 一次调用包含哪些层

可以把调用拆成五层：业务意图、统一请求、供应商适配、模型执行、统一响应。

1. **业务意图**描述“总结合同”“提取字段”或“回答用户”，不出现供应商字段；
2. **统一请求**声明消息、内容部件、工具、输出契约和预算；
3. **供应商适配**把统一请求映射到实际 API，并处理能力差异；
4. **模型执行**可能生成文本、调用工具、拒绝、截断或在流中失败；
5. **统一响应**保留结果、结束原因、usage、请求 ID 和原始供应商元数据。

![从应用请求、消息与内容部件进入模型，再分解为结果、工具、用量与追踪信息](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-api-basics-request-lifecycle-v1.webp)
*图：一次逻辑调用不只产生文本，还要携带可执行结果、用量和可追踪证据。*

分层的价值是把变化隔离在边缘：业务逻辑不应到处读取某一家 SDK 的字段，供应商升级也不应改变“结构化提取必须通过 Schema 校验”这样的业务规则。

## 输入不是一个字符串

现代接口通常把输入组织为消息或内容部件。即使字段名不同，也可以抽象为：角色或来源、按顺序排列的内容、可用工具、生成约束和请求元数据。

```ts
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; mediaType: string }
  | { type: 'file'; fileId: string; mediaType: string };

interface GenerationRequest {
  requestId: string;
  modelPolicy: 'fast' | 'balanced' | 'accurate';
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: ContentPart[];
  }>;
  tools?: ToolDefinition[];
  outputSchema?: object;
  maxOutputTokens?: number;
}
```

这里的 `modelPolicy` 是应用策略，不是模型名。真正的模型选择留给路由器。消息角色也不能机械地跨供应商复制：某些接口把高优先级指令放在专门字段中，某些接口允许更丰富的 item 类型。适配器需要保持语义，而不是只保持字段拼写。

发送前至少验证：内容类型是否受目标模型支持、远程 URL 是否允许访问、文件是否仍有效、工具名称是否唯一、Schema 是否可序列化、输入是否超过预算，以及敏感数据是否允许发往目标区域。

## 响应也不是一个字符串

一个稳健的统一响应要能表达多种终态：正常文本、结构化数据、工具调用、拒绝、长度截断、内容过滤和错误。只读取第一个文本字段，会吞掉工具调用或把半截输出当成功。

```ts
interface GenerationResult {
  status: 'completed' | 'needs_tool' | 'refused' | 'incomplete';
  text?: string;
  toolCalls?: Array<{ id: string; name: string; arguments: unknown }>;
  structured?: unknown;
  finishReason?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    reasoningTokens?: number;
  };
  providerRequestId?: string;
  providerMetadata?: unknown;
}
```

`status` 是应用根据供应商事件归一化后的状态；`finishReason` 保留更细的原始原因。工具参数和结构化输出仍是不可信输入，必须验证类型、枚举、长度和权限，不能因为“由模型生成”就直接执行。

## usage、价格与成本不是同一件事

`usage` 是一次响应报告的计量数据，价格是供应商在某个时间点对不同 token 类别、模型和功能的单价，成本是应用结合两者计算出的业务指标。三者不能混为一个字段。

推荐保存原始 usage，再用带版本的价格表异步计算：

```text
estimated_cost =
  input_tokens × input_rate
  + cached_input_tokens × cached_rate
  + output_tokens × output_rate
  + other_metered_units
```

不要假设所有供应商都返回相同 token 分类，也不要在请求代码中硬编码当前单价。流中断、批处理、工具执行、图像或音频可能采用不同计量方式；对账应以供应商账单为准，应用估算用于预算、告警和归因。

成本指标至少按租户、功能、模型策略和请求结果聚合。单看“每次请求均价”会掩盖上下文不断增长、失败重试或异常大输出。

## 请求生命周期与状态机

一次逻辑请求可使用以下状态：

```text
created → validated → dispatched → streaming/tool_wait → completed
                          ↘ retry_wait
                          ↘ failed/cancelled
```

逻辑请求 ID 由应用生成，在重试间保持不变；每次网络尝试另有 attempt ID；供应商请求 ID 原样记录。这样才能回答“用户点了一次，为什么上游出现三次调用”。工具调用形成新的受控回合：先校验调用，执行获权工具，再把工具结果作为新 item 送回，而不是让模型直接访问内部系统。

## 截至 2026-07-15 的接口差异

- OpenAI 的 [Responses API](https://developers.openai.com/api/docs/guides/text)以多类型 input/output item 组织生成，并可承载工具与多模态能力；官方[迁移指南](https://developers.openai.com/api/docs/guides/migrate-to-responses)说明它与 Chat Completions 的状态和返回形态差异。
- Anthropic 的 [Messages API](https://platform.claude.com/docs/en/api/messages/create)以消息和内容块组织输入输出，系统指令、工具与流事件有自己的契约。
- Gemini 同时存在 `generateContent` 路线与较新的 Interactions 路线；[文本生成指南](https://ai.google.dev/gemini-api/docs/generate-content/text-generation)和 [Interactions 概览](https://ai.google.dev/gemini-api/docs/interactions-overview)应按实际 API 分别核对。

这些是调研日的产品形态，不是跨供应商标准。模型名、能力、usage 字段和保存策略都应通过配置与适配器管理，升级 SDK 时重新执行契约测试。

## 可观测与安全基线

每次尝试至少记录：逻辑请求 ID、attempt ID、供应商请求 ID、租户、模型策略与实际模型、输入/输出 token、缓存 token、首 token 延迟、总延迟、结束原因、重试原因和估算成本。日志里不要保存完整提示词、文件内容或工具凭证；可以记录经过脱敏的模板版本、内容哈希和长度。

密钥只留在服务端，通过密钥管理系统注入并轮换。前端不得直接持有长期供应商密钥。对用户可控的模型、最大输出、工具和文件权限设置服务端上限；否则“参数透传”会变成成本与数据外泄通道。

## 上线检查清单

- 业务代码只依赖统一请求/响应，不直接解析供应商对象；
- 发送前验证能力、大小、权限、Schema 和预算；
- 将工具调用、拒绝、截断与流内错误建模为显式状态；
- 保存原始 usage，用带版本的价格表计算估算成本；
- 区分逻辑请求、网络尝试和供应商请求 ID；
- 对结构化输出和工具参数再次校验；
- 日志脱敏，密钥不进入客户端、提示词或异常堆栈；
- 对适配器建立固定样例、流事件和错误映射的契约测试。

## 小结

大模型 API 的基础不是某个 SDK 方法，而是端到端契约：结构化输入经过能力与安全校验，由适配器送往模型，再把多类型结果、终止状态、用量和追踪信息统一返回。把计量与价格分开、把逻辑请求与网络尝试分开、把模型输出继续视为不可信输入，系统才有资格从 Demo 进入生产。

## 参考资料

- [OpenAI — Text generation](https://developers.openai.com/api/docs/guides/text)
- [OpenAI — Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [Anthropic — Create a Message](https://platform.claude.com/docs/en/api/messages/create)
- [Gemini API — Text generation](https://ai.google.dev/gemini-api/docs/generate-content/text-generation)
- [Gemini API — Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
