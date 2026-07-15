模型供应商抽象层的目标不是把所有 API 压成一个“最低公分母”，而是让业务依赖稳定的领域语义，同时保留供应商能力差异。设计过薄，业务代码到处出现供应商判断；设计过厚，又会掩盖流式事件、工具、多模态和状态模型的真实差别。

## 从业务契约开始

先写应用真正需要的能力，而不是照着某个 SDK 重命名字段：

```ts
type Capability =
  | "text"
  | "stream"
  | "tools"
  | "image-input"
  | "audio-realtime"
  | "structured-output";

type ModelRequest = {
  traceId: string;
  messages: DomainMessage[];
  required: Capability[];
  tools?: DomainTool[];
  outputSchema?: object;
  budget: { maxInputTokens: number; maxOutputTokens: number };
};

type ModelEvent =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; call: DomainToolCall }
  | { type: "usage"; input: number; output: number }
  | { type: "completed"; result: ModelResult };
```

这里的 `DomainMessage`、`DomainTool` 和 `ModelEvent` 是产品内部契约。适配器负责映射成供应商请求，并把返回事件转换回来。内部类型不应泄漏某个 SDK 的类实例，否则升级 SDK 时业务层仍会一起震荡。

![应用请求先经过能力目录和路由，再由不同适配器保留原生差异并归一化结果](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-provider-abstraction-capability-adapter-v1.webp)
*图：能力协商决定可用适配器；统一结果和受控原始响应同时保留。*

## 能力目录比供应商枚举重要

“供应商 A 支持工具”过于粗糙。能力目录至少需要记录：

- 模型/接口组合与验证日期；
- 支持的输入模态、流式、工具和结构化输出；
- 是否支持并行工具、会话状态或异步批处理；
- 区域、数据保留、延迟等级和内部合规状态；
- 当前被自有契约测试验证过的能力，而非营销页上出现过的能力。

路由器先检查硬约束，再比较质量、延迟、费用和健康状态。缺少硬能力时直接失败或选择产品定义的降级方案，不能默默删除图片、工具或 Schema 后继续请求。

```ts
function selectAdapter(req: ModelRequest, catalog: ModelProfile[]) {
  const eligible = catalog.filter(profile =>
    req.required.every(capability => profile.capabilities.has(capability))
  );

  if (eligible.length === 0) throw new Error("CAPABILITY_UNAVAILABLE");
  return rankByPolicy(eligible, req);
}
```

## 哪些应该统一，哪些不应该

适合统一的是稳定领域概念：请求 ID、文本增量、工具意图、结束原因、usage、可重试分类、超时和取消信号。

不宜强行统一的是：

- 消息角色和系统指令的精确语义；
- 流式事件的边界与顺序；
- 工具调用 ID、并发规则和结果回传方式；
- 服务端会话、缓存、推理预算和安全判定；
- 图片、音频、文件和引用的内容块结构。

截至 2026-07-15，[OpenAI 文本生成指南](https://developers.openai.com/api/docs/guides/text)的当前应用路线以 Responses 为主，[Anthropic Messages API](https://platform.claude.com/docs/en/api/messages)使用 Messages 内容块，[Gemini 文本生成指南](https://ai.google.dev/gemini-api/docs/text-generation)也有自身的内容与函数调用结构。适配器可以暴露统一事件，却不能承诺三者完全同构。

## 原始响应逃生舱要受控

归一化结果无法覆盖所有供应商特性，可以保留一个只在适配器边界使用的原始视图：

```ts
type ModelResult = {
  text: string;
  toolCalls: DomainToolCall[];
  finishReason: "stop" | "length" | "tool" | "blocked" | "unknown";
  usage?: NormalizedUsage;
  providerMeta: {
    provider: string;
    requestId?: string;
    raw?: unknown; // 仅诊断/实验路径读取，禁止业务随意依赖
  };
};
```

若某项原生能力成为核心业务依赖，应把它提升为新的显式领域能力并补齐其他适配器的“不支持”行为，而不是让业务长期读取 `raw`。

## 错误归一化不能丢掉证据

统一错误类别便于策略处理：`authentication`、`permission`、`rate-limit`、`invalid-request`、`content-blocked`、`timeout`、`provider-unavailable`、`unknown`。同时保留供应商错误码、请求 ID、HTTP 状态和 `Retry-After` 等诊断信息。

“可重试”不是错误码的固定属性，还取决于请求是否幂等、是否已产生工具副作用、剩余时限以及重试预算。适配器只提供事实与建议，调用策略层决定是否重试、换模型或失败。

## 流式、取消与背压

把所有流都变成字符串会丢掉工具、usage 和错误事件。内部应使用带类型的异步事件流，并支持 `AbortSignal`：

```ts
interface ProviderAdapter {
  readonly id: string;
  supports(required: Capability[]): boolean;
  invoke(req: ModelRequest, signal: AbortSignal): AsyncIterable<ModelEvent>;
}
```

适配器要定义：取消是只停止本地读取，还是也向上游发出取消；完成事件是否保证出现；usage 可能在何时到达。消费者设置队列上限，慢客户端不得拖垮供应商连接。

## 契约测试是抽象层的生命线

每个适配器运行同一组黑盒测试：普通文本、空输出、Unicode、长输入、流式顺序、工具参数、Schema 失败、取消、超时、限流、usage 缺失和安全阻断。测试断言领域行为，不断言供应商原始 JSON 完全一致。

另设少量供应商特有测试验证原生逃生能力。模型或 API 版本变更先在冻结样本上跑契约、质量、延迟和费用回归，再更新能力目录的 `verifiedAt`。

## 常见误区

- 用一个 `generate(prompt)` 隐藏所有消息、工具和模态；
- 路由时只看价格，不检查硬能力和合规约束；
- 把不支持的字段静默丢弃；
- 将所有结束原因都映射成 `stop`；
- 业务代码直接读取适配器的 `raw`；
- 认为更换供应商只需替换 base URL；
- 只有 mock 测试，没有对真实沙箱接口的契约验证。

## 小结

好的供应商抽象层围绕“领域契约 + 能力目录 + 适配器 + 策略路由 + 契约测试”组织。它统一的是业务必须稳定的语义，显式承认的是接口无法抹平的差异。这样迁移、降级和多供应商路由才是可验证工程能力，而不是分散的条件判断。

## 参考资料

- [OpenAI — Text generation](https://developers.openai.com/api/docs/guides/text)
- [Anthropic — Messages API](https://platform.claude.com/docs/en/api/messages)
- [Gemini API — Text generation](https://ai.google.dev/gemini-api/docs/text-generation)
