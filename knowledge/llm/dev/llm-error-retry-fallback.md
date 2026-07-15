大模型调用跨越客户端、网关、供应商排队、模型执行、流式传输和工具系统，任一环节都可能失败。可靠性设计的目标不是“遇错就重试”，而是在总时间与成本预算内，区分确定失败、未知结果和可恢复故障，并让降级仍满足安全与业务底线。

## 先建立错误分类

可按“谁能修复”和“是否值得重试”分类：

| 类别 | 例子 | 默认动作 |
| --- | --- | --- |
| 请求错误 | Schema、参数、超限、内容类型不支持 | 不重试，修正请求 |
| 身份与权限 | 密钥无效、租户无权、区域不符 | 不重试，告警或重新授权 |
| 资源与策略 | 模型不可用、内容被拒、预算不足 | 按策略换能力或安全失败 |
| 限流 | HTTP 429、供应商容量限制 | 遵守 `Retry-After`，延迟重试 |
| 瞬时服务故障 | 部分 5xx、网关连接失败 | 有界退避重试 |
| 超时/断线 | 未收到终态、流中断 | 结果可能未知，先查状态或按幂等策略处理 |

![错误先分类，再由超时预算、幂等保护和重试预算控制退避、降级或人工处理](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-error-retry-fallback-reliability-ladder-v1.webp)
*图：可靠性是一条受预算与安全门禁控制的阶梯，并非所有错误都走向重试。*

同一个 HTTP 状态不总能决定动作。流式响应可能已经返回 200，随后在事件中报告错误；网关 504 可能表示上游仍在执行。必须同时解析 HTTP、供应商错误类型、流事件和本地取消原因。

## 超时是一个预算，不是一个数字

为用户操作定义总预算，再分给排队、连接、首 token、持续读取和工具执行：

```text
total_deadline = 20s
connect_budget = 2s
time_to_first_token = 8s
stream_idle_timeout = 5s
tool_budget = remaining_deadline
```

每次重试继承同一个绝对 deadline，不能重新得到 20 秒。否则三次重试会把用户等待放大到一分钟。区分：

- **连接超时**：尚未建立连接；
- **首 token 超时**：已发出请求但无首个事件；
- **空闲超时**：流开始后长时间无新事件；
- **总截止时间**：无论进展如何都必须结束；
- **用户取消**：业务主动终止，不应包装成供应商故障。

超时后是否重试取决于幂等性。纯文本生成重复一次主要增加费用和结果分叉；带工具或外部副作用的代理回合可能重复发邮件、扣款或写数据，必须依赖应用幂等键和工具执行日志。

## 有界指数退避与抖动

重试只针对明确的瞬时故障。若响应包含 `Retry-After`，优先遵守；否则使用指数退避并加入随机抖动，避免大量实例同时再次冲击上游。

```ts
function retryDelay(attempt: number, retryAfterMs?: number) {
  if (retryAfterMs !== undefined) return retryAfterMs;
  const cap = Math.min(8_000, 250 * 2 ** attempt);
  return Math.random() * cap; // full jitter
}
```

必须同时限制：最大尝试次数、总截止时间、单用户并发、租户 token/费用和全局重试比例。一次上游故障如果把全部请求都放大三倍，会形成重试风暴。可为重试设置独立预算，例如一分钟内重试调用不得超过正常流量的某个比例。

SDK 自带重试只是一层实现细节。若网关、业务服务和 SDK 都各重试两次，一次用户请求可能产生多次乘法放大。应明确唯一主要重试层，并记录 SDK 的真实配置。

## 幂等与未知结果

HTTP 方法是否幂等不等于业务操作是否幂等。生成接口常用 POST，但应用可以用逻辑请求 ID 归并重复结果；工具执行必须有独立的业务幂等键。

```text
logical_request_id: 用户一次意图
attempt_id: 每次网络尝试
tool_operation_id: 一次外部副作用
provider_request_id: 供应商追踪标识
```

当客户端断线但上游状态未知时，优先查询可查询的任务/响应对象或等待回调；无法查询时，把原 attempt 标为 `unknown`，新的尝试仍与同一逻辑请求关联。不要伪装成“第一次从未发生”。

## Fallback 不是随便换个模型

降级前先经过硬门禁：数据是否允许发往备用供应商、目标区域是否合规、工具与多模态能力是否齐全、输出 Schema 是否支持、质量是否达到任务最低线。之后才按延迟和成本选择。

常见降级顺序可以是：

1. 同供应商同能力的健康部署；
2. 同任务经评测通过的备用模型；
3. 减少非关键功能，例如关闭图片生成但保留文字；
4. 返回缓存的安全信息或进入异步队列；
5. 清楚地失败并允许用户稍后重试。

降级不能悄悄改变承诺。医疗、财务、代码修改等高风险任务若备用模型未通过门禁，应失败或转人工，而不是为了“可用性”牺牲安全。UI 可标注进入简化模式，便于用户理解结果差异。

## 熔断、隔离与探测

熔断器针对持续故障快速失败，保护线程、连接和费用。它不应只看总体错误率：按供应商、区域、模型和错误类别分桶，否则一个冷门模型故障可能误伤全部请求。

半开状态只放少量探测流量。租户或批处理使用独立并发池，避免离线任务占满实时请求资源。健康状态应结合主动探测与真实流量，但模型质量下降不能只靠 HTTP 健康检查发现，还需在线评测和异常指标。

## 截至 2026-07-15 的实现依据

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)定义 HTTP 语义、幂等方法与 `Retry-After`；[RFC 6585](https://www.rfc-editor.org/rfc/rfc6585.html)定义 429 Too Many Requests。客户端应遵守服务端提供的等待提示，但具体供应商错误体仍需适配。

Anthropic 的[错误文档](https://platform.claude.com/docs/en/api/errors)列出当前 API 错误类型，并说明官方 SDK 对部分瞬时故障的默认退避重试；[速率限制文档](https://platform.claude.com/docs/en/api/rate-limits)说明 429 与 `retry-after`。这些默认次数属于 SDK 版本行为，不是协议保证。

OpenAI 官方 Node SDK 的[仓库文档](https://github.com/openai/openai-node)说明当前的错误类型、请求 ID、超时、重试与取消用法。应用升级 SDK 后要重新确认默认值，避免与外层策略叠加。

## 可观测性与演练

记录逻辑请求、attempt、上游请求 ID、错误类别、HTTP 状态、供应商错误码、是否可重试、退避时长、剩余 deadline、实际模型和 fallback 原因。指标至少包括：首试成功率、重试后成功率、重试放大率、熔断状态、fallback 比例、P95/P99 延迟和失败成本。

上线前做故障注入：连接失败、首 token 延迟、流内错误、429 带/不带 `Retry-After`、500、工具超时、备用模型不支持 Schema、用户中途取消。断言总截止时间、最大尝试和副作用次数，而不只是最终是否返回了文字。

## 常见误区

- 所有非 2xx 都重试；
- 每次重试重置总超时；
- 网关、业务层和 SDK 同时重试；
- 不加抖动，所有实例同步重试；
- 将断流后的未知结果直接记为“未执行”；
- fallback 绕过数据、能力与质量门禁；
- 把用户取消记成模型故障；
- 只看最终成功率，不看重试放大与失败费用。

## 小结

可靠的大模型调用先分类错误，再用总 deadline、幂等键和重试预算控制恢复；限流遵守 `Retry-After`，瞬时故障采用有界抖动退避，未知结果保留因果证据。Fallback 必须经过合规、能力和质量门禁。系统的目标不是永远返回内容，而是在故障中仍保持可解释、可控且不产生重复副作用。

## 参考资料

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 6585 — Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585.html)
- [Anthropic — API errors](https://platform.claude.com/docs/en/api/errors)
- [Anthropic — Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- [OpenAI — openai-node](https://github.com/openai/openai-node)
