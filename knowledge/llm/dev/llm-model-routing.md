模型路由不是在代码里写一串 `if (task === ...)`。一个请求可能同时要求图像理解、结构化输出、特定区域、低延迟、严格成本和某个工具协议；供应商的可用性与能力还会变化。可靠路由要先用硬约束排除不合格候选，再用可解释策略在合格集合中选择，并把决定与结果反馈到同一条追踪链。

## 路由器需要哪些输入

把输入分成四组：

- **任务需求**：文本/视觉/音频、上下文规模、工具、结构化输出、批处理、流式；
- **治理约束**：租户允许的供应商、数据区域、保留策略、敏感等级和模型白名单；
- **服务目标**：首 token、总延迟、最低质量、可用性和单位成本上限；
- **运行状态**：模型健康、限流、队列深度、近期质量、剩余预算和熔断状态。

![请求由能力、隐私、延迟、质量、成本和健康状态共同决定路由，并留下可观测轨迹](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-model-routing-policy-decision-v1.webp)
*图：先通过硬约束门禁，再对合格模型评分；路由决定、实际执行和反馈必须可追踪。*

业务方应提交任务画像，而不是任意模型名：

```ts
interface RouteRequest {
  task: 'chat' | 'extract' | 'vision' | 'code' | 'image_generate';
  required: {
    modalities: Array<'text' | 'image' | 'audio' | 'file'>;
    tools?: boolean;
    jsonSchema?: boolean;
    minContextTokens?: number;
  };
  governance: {
    dataClass: 'public' | 'internal' | 'sensitive';
    allowedRegions: string[];
    allowedProviders: string[];
  };
  objective: 'latency' | 'quality' | 'cost' | 'balanced';
  deadlineMs: number;
}
```

少数经过授权的内部场景可以指定模型用于评测或复现，但普通用户输入不应直接穿透路由器，否则会绕过成本与合规政策。

## 能力目录必须是带证据的配置

每个候选记录 `provider + api + model + region`，包含能力、限制、价格版本、数据政策、健康状态和最后验证时间。来源包括官方文档、自动探测和自有评测；三者不能互相替代。

```text
CapabilityEntry
  supports: modalities, tools, schema, streaming, batch
  limits: context, output, file types
  governance: regions, retention profile, tenant allowlist
  economics: price_version, estimated unit cost
  quality: eval_suite_version, score, confidence
  operations: health, latency percentiles, circuit state
  verified_at, evidence_urls
```

官方宣称支持 JSON 不代表符合你的订单 Schema；探测成功不代表满足数据政策；一次离线评测也不能证明实时健康。能力条目过期时，可以拒绝高风险路由或降权，而不是继续盲信。

## 两阶段选择：硬门禁再评分

第一阶段只回答“能不能用”：模态、上下文、工具、区域、租户白名单、敏感数据和最低质量任一不满足就淘汰。硬约束不能通过更低价格补偿。

第二阶段在合格候选中计算软目标。分数可以归一化，但要保存每一项贡献：

```text
score = wq × predicted_quality
      - wl × predicted_latency
      - wc × predicted_cost
      + wh × health_confidence
```

权重按任务策略版本管理。不要直接比较不同单位的原始值；使用分位数或业务阈值归一化，并对样本少的候选降低置信度。分数相近时使用稳定散列按租户或会话分桶，避免同一会话不断切模型导致风格漂移。

## 预测成本要看完整工作流

便宜的单 token 模型不一定让一次任务更便宜。需要估算输入、输出、缓存、图片/音频、重试概率和工具回合数：

```text
expected_cost = first_call
              + retry_probability × retry_cost
              + expected_tool_rounds
              + post_validation_or_repair
```

质量不足导致二次修复、人工复核或用户重复提问，也属于路由成本。按“完成一个合格任务”的费用比较，比每百万 token 的价格更有意义。

## 多供应商适配不等于兼容接口

使用兼容客户端可以降低接入成本，但字段相似不代表语义相同。角色优先级、工具调用 ID、Schema 支持、流事件、图片细节、usage、错误和状态保存都可能不同。

统一层应归一化稳定语义：任务输入、内容部件、工具意图、事件、终态和追踪；同时提供受控的 provider options，承载确实无法抽象的能力。不要把所有接口压成“输入字符串、输出字符串”的最低公分母，也不要让业务到处读取 `rawResponse`。

适配器契约测试至少覆盖：普通文本、结构化输出、工具回合、流中断、拒绝、截断、usage、取消和可重试错误。新增供应商只有通过同一测试与任务评测后才进入候选集。

## Fallback 与路由是两次不同决策

首次路由基于正常目标选择；故障后 fallback 还要考虑已经消耗的 deadline、尝试费用、数据是否已发送和用户是否看到部分输出。不能简单“取排行榜第二名”。

保存 `route_plan`：主候选、允许的备用候选、禁止降级原因和每级最小质量。故障发生时重新执行硬门禁，并排除同一故障域。例如同一区域的两个模型可能共享容量问题，不是真正冗余。

高风险请求若没有合格备用项，正确结果是安全失败或转人工。降级到不支持工具的模型，却继续假装工具执行成功，比直接报错危险得多。

## 反馈闭环与防抖

记录预测和实际：选中候选、淘汰原因、评分分解、实际延迟、usage、费用、校验结果、用户反馈和人工修正。离线汇总后更新质量与成本估计，但不要让单次用户评价直接改变全局路由。

为避免频繁抖动，可以使用：

- 会话粘性与最短保持时间；
- 健康状态的滑动窗口和迟滞阈值；
- 小流量 canary 后再扩大；
- 按租户、任务和版本做确定性分桶；
- 策略配置审查、签名与可回滚版本。

路由器本身也要有 SLO 和降级：配置服务不可用时使用最近已验证快照，不能无条件选择默认模型。

## 截至 2026-07-15 的时效边界

模型与能力清单变化很快。OpenAI 的[模型目录](https://developers.openai.com/api/docs/models)适合建立当前候选证据，但不能替代自有评测。Anthropic 的 [Messages API](https://platform.claude.com/docs/en/api/messages/create)和 Gemini 的 [OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)展示了不同接口与兼容层的当前契约。

兼容层文档明确存在“接近熟悉接口”的价值，却不意味着完整等价。模型名、上下文、模态、地区、价格和保留策略必须在部署时按官方文档复核，并写入 `verified_at`；正文或业务代码不应把调研日型号当永久默认。

## 常见误区

- 先按价格排序，再检查合规；
- 让前端或用户任意指定模型；
- 只维护模型名，不维护 API、区域和验证时间；
- 把“官方支持”当成业务质量达标；
- 用最低公分母接口抹掉工具和流事件语义；
- fallback 固定为第二名，不重新检查故障域和 deadline；
- 每次请求都选瞬时最高分，造成会话抖动；
- 只记录最终模型，不记录淘汰理由和评分分解。

## 小结

模型路由是一项治理与决策系统：任务提交需求与边界，能力目录提供带日期的证据，硬门禁保证可用与合规，软评分在质量、延迟和成本之间优化。适配器保留语义差异，fallback 重新决策，观测闭环校正预测。做到可解释、可评测、可回滚，才真正获得多供应商弹性。

## 参考资料

- [OpenAI — Models](https://developers.openai.com/api/docs/models)
- [Anthropic — Create a Message](https://platform.claude.com/docs/en/api/messages/create)
- [Gemini API — OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
