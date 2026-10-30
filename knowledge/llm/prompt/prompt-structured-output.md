结构化输出让模型结果进入程序世界：不再依赖正则从自然语言中猜字段，而是让回复遵循明确的数据结构。但“JSON 可解析”“符合 JSON Schema”和“业务事实正确”是三层不同保证，任何一层都不能省略。

## 三种常见方案

### Prompt-only JSON

只在 Prompt 中要求输出 JSON。兼容性最好，但模型可能添加代码围栏、漏字段、写错枚举或输出被截断。它适合原型或没有原生能力的模型，不应被当作强保证。

### JSON mode

以 OpenAI 当前 [Structured Outputs 指南](https://developers.openai.com/api/docs/guides/structured-outputs#structured-outputs-vs-json-mode)中的 JSON mode 为例，它约束 JSON 语法，不承诺符合应用的具体字段 Schema。还要检查响应是否完整、是否拒答，再验证必填字段、类型和枚举；其他供应商的同名模式须分别核对，不能从名称推断相同保证。

### Structured Outputs / Strict Tool Use

在支持该能力的模型和接口中，原生结构化输出可约束结果匹配所支持的 JSON Schema 子集。OpenAI 的同一指南将其与仅保证语法的 JSON mode 区分，并列出拒答、输出不完整和不支持的 Schema 等需要处理的状态。它加强的是结构合同，不是事实正确性；接口、模型或兼容层变化后，支持范围需要重新验证。

![Prompt 和 JSON Schema 经过约束解码、Schema 校验与业务校验后得到可信对象](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/prompt-structured-output-pipeline-v3.webp)
*图：上方约束解码节点适用于已确认支持原生结构化输出的路径；Prompt-only 生成仍从解析和校验开始。Schema 合法只证明结构符合约束，事实、权限和业务规则仍需单独验证。*

## 先设计数据合同

以工单分类为例：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "enum": ["billing", "delivery", "product", "other"]
    },
    "order_id": {
      "type": ["string", "null"],
      "description": "输入中明确出现的订单号；没有则为 null"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "evidence": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 3
    }
  },
  "required": ["category", "order_id", "confidence", "evidence"],
  "additionalProperties": false
}
```

设计要点：

- 用 `required` 明确必须存在的字段；
- 用 `enum` 表达封闭集合，不用模糊字符串；
- 缺失与空值要有明确语义；
- `additionalProperties: false` 可拒绝未声明字段；
- 使用 `minimum`、`maximum`、`minItems` 等收紧范围；
- `description` 说明字段含义和证据要求；
- schema 尽量扁平，避免不必要的深层嵌套。

先确认平台支持哪些 JSON Schema 关键字。完整标准与某个模型 API 支持的子集不是一回事。

## Schema 校验仍应放在应用端

即使平台宣称严格结构化输出，应用也应再次验证。原因包括：SDK/网关转换、模型不支持、响应截断、降级路径和未来版本变化。

TypeScript 可使用 Ajv、Zod 等工具。下例使用 Ajv v8 的 `Ajv2020`，与上文声明的 draft 2020-12 对齐；默认 `Ajv` 类使用 draft-07，不能直接编译这份 schema。不同草案应使用匹配的实例（[Ajv 官方：JSON Schema 版本](https://ajv.js.org/json-schema.html#draft-2020-12)）：

```typescript
import Ajv2020 from 'ajv/dist/2020.js'

const ajv = new Ajv2020({ allErrors: true })
const validate = ajv.compile(ticketSchema)

const parsed = JSON.parse(responseText)
if (!validate(parsed)) {
  throw new Error(JSON.stringify(validate.errors))
}
```

不要在校验失败后静默使用部分对象。记录错误类型、模型版本和原始响应，进入受控重试或降级。

## 结构正确不等于事实正确

下面的对象完全可能符合 schema，却是模型编造的：

```json
{
  "category": "billing",
  "order_id": "ORD-999999",
  "confidence": 0.99,
  "evidence": ["用户提到已扣款"]
}
```

还要做语义和业务校验：

- `order_id` 是否真的出现在输入或数据库；
- 枚举值是否允许当前状态转换；
- 金额、日期和单位是否在合理范围；
- 引用 ID 是否存在并支持结论；
- 工具参数是否通过鉴权；
- 高风险动作是否需要人工确认。

`confidence` 是模型输出字段，不应直接当成校准概率或权限依据。

## Structured Output 与 Tool Calling

- **Structured Output**：应用需要结构化回答，例如抽取、分类或 UI 数据。
- **Tool Calling**：模型提出调用某个外部能力及参数，应用决定是否执行。

二者都可使用 schema，但语义不同。工具调用必须经过应用鉴权、参数校验和副作用确认；schema 合法不代表模型有权执行。

接入兼容层时，应把结构约束列为需要实测的接口合同：确认当前模型接受哪些参数与 Schema 关键字，检查完整响应、拒答和截断怎样表示，再用正常、缺字段、额外字段和失败样例验证网关与客户端的实际处理。客户端类型检查通过，只能证明本地代码满足类型约束，不能代替服务端行为证据；不要由“OpenAI 风格端点”推断 `strict` 语义一致。

## 错误处理状态机

至少处理：

1. API/网络失败；
2. 拒答或安全停止；
3. 长度截断；
4. JSON 解析失败；
5. Schema 校验失败；
6. 语义/业务校验失败；
7. 工具执行失败。

可恢复的格式错误允许一次带明确错误信息的重试；高风险语义错误应降级或转人工。无限重试既昂贵，也可能重复同一错误。

## 版本与兼容性

为 schema 设置自己的版本号，并让消费者支持明确版本：

```json
{
  "schema_version": "ticket-classification.v2",
  "category": "delivery"
}
```

新增字段、修改 `required`、收紧枚举都可能破坏消费者。schema、Prompt、模型和解析器应在同一发布流程中测试与回滚。

## 常见误区

- **“只返回 JSON”就是 Structured Outputs**：Prompt-only 没有机制保证。
- **JSON mode 保证字段正确**：它通常只保证 JSON 语法。
- **Schema 通过就能直接写数据库**：仍需事实、权限和业务校验。
- **所有 JSON Schema 关键字都支持**：平台通常只支持子集。
- **`strict` 在兼容 API 中行为相同**：兼容层可能忽略或改写参数。
- **模型 confidence 可以决定高风险动作**：需要独立校准和权限策略。

## 小结

生产结构化输出应形成完整链路：原生约束解码 → JSON 解析 → Schema 校验 → 语义/业务校验 → 受控重试、降级或人工处理。格式正确只是可靠对象的第一步。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [小红书 AI 全栈暑期二面：MCP 更新安全与 JSON 验收](../../../interview/redbook/ai/redbook-ai-11.md)
- [字节 AI 应用开发一、二面：规划、结构化输出与部署取舍](../../../interview/bytedance/base/bytedance-base-65.md)
- [小红书 Agent 开发二面：结论正确性、安全边界与本地云端扩展](../../../interview/redbook/ai/redbook-ai-3.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../../interview/bytedance/base/bytedance-base-34.md)
- [字节 Agent 开发一面：评分、Harness 与任务可靠性](../../../interview/bytedance/base/bytedance-base-57.md)
- [字节搜广推引擎架构一面：JSON 输出、并发与系统基础](../../../interview/bytedance/base/bytedance-base-74.md)
<!-- interview-source-history:end -->

## 参考资料

- [Ajv：JSON Schema 版本与 draft 2020-12](https://ajv.js.org/json-schema.html#draft-2020-12)
- [OpenAI API：Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [JSON Schema 2020-12 Validation](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00)
- [Understanding JSON Schema：Objects](https://json-schema.org/understanding-json-schema/reference/object)

OpenAI 指南与 JSON Schema 对象语义核验于 2026-10-29；Ajv 示例按 v8.17.1 官方文档核对。上文完整 Schema 是应用端 draft 2020-12 合同示意，不声称它能原样用于任意模型、微调版本或兼容服务。
