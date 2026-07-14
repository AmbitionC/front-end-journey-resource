## Function Calling 到底是什么

大模型擅长理解自然语言，却不应该直接访问数据库、付款接口或操作系统。Function Calling（也称 Tool Calling）在二者之间建立了一份结构化契约：应用把可用工具及参数 Schema 告诉模型；模型决定是否建议调用某个工具；**真正的校验和执行始终由应用完成**。

它让模型从“只会说话”扩展到查询订单、搜索知识库、调用计算器或生成工单，但并没有自动解决权限、安全和业务正确性。

![Function Calling 的可信执行闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/function-calling-execution-loop-v3.webp)

## 一、完整闭环，而不是一次函数调用

一次工具交互包含以下步骤：

1. 应用把用户消息和工具定义发送给模型。
2. 模型返回一个或多个工具调用，包含工具名、JSON 参数与调用 ID。
3. 应用解析参数，完成 Schema 校验、鉴权和业务约束检查。
4. 应用执行真实函数，设置超时、并发限制与幂等保护。
5. 应用将结果绑定原 `call_id`，追加到会话。
6. 模型根据工具结果生成回答，或继续提出下一次工具调用。

模型只是控制面的“提议者”；应用才是数据面的“执行者”。如果把模型返回的工具名直接拼进 `eval`、Shell 或 SQL，就失去了这条安全边界。

## 二、定义一个清晰工具

工具应当职责单一、描述具体、参数尽量窄：

```ts
const tools = [{
  type: "function" as const,
  name: "get_weather",
  description: "查询指定城市当前天气；仅用于实时天气问题",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "城市名，例如：新加坡",
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
      },
    },
    required: ["city", "unit"],
    additionalProperties: false,
  },
}];
```

好的工具定义具备这些特征：

- 名字是稳定的动宾结构，如 `get_order_status`，而不是模糊的 `process`。
- 描述说明“何时用”和“何时不用”，避免多个工具语义重叠。
- 能用 `enum`、长度、格式表达的约束不要只写在描述里。
- `additionalProperties: false` 拒绝未声明字段。
- 不让模型提供可由服务端推导的安全字段，例如当前用户 ID、租户 ID和最终价格。

`strict: true` 的作用是提高输出满足 JSON Schema 的确定性；它不保证城市存在、用户有权限、库存充足或金额合理。

## 三、用 Responses API 跑通工具循环

下面以 OpenAI Node SDK 展示当前 Responses API 的基本模式。模型名通过环境变量配置，避免示例很快过时。

```ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getWeather(city: string, unit: string) {
  // 真实项目在这里调用受控的天气服务
  return { city, unit, temperature: 29, condition: "rain" };
}

let input: OpenAI.Responses.ResponseInput = [{
  role: "user",
  content: "新加坡现在天气如何？",
}];

for (let round = 0; round < 4; round += 1) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input,
    tools,
  });

  input.push(...response.output);
  const calls = response.output.filter((item) => item.type === "function_call");

  if (calls.length === 0) {
    console.log(response.output_text);
    break;
  }

  for (const call of calls) {
    if (call.name !== "get_weather") throw new Error("UNKNOWN_TOOL");
    const args = JSON.parse(call.arguments);
    validateWeatherArgs(args); // Zod/Ajv + 业务约束
    const result = await getWeather(args.city, args.unit);

    input.push({
      type: "function_call_output",
      call_id: call.call_id,
      output: JSON.stringify(result),
    });
  }
}
```

几个容易忽略的点：

- `call_id` 是工具请求与结果之间的关联键，不能用数组位置代替。
- 一轮可能有多个调用；只有互不依赖、无冲突的调用才适合并行执行。
- 设置最大轮数，防止模型在工具之间无限循环。
- 工具异常要转换成受控结果或错误类型，不要把堆栈、密钥和内部地址返回给模型。

不同提供方的字段名与消息回传规则可能不同，换模型时应做协议适配层，不能只替换 `baseURL` 就认为完成迁移。

## 四、验证分为三层

### 1. 结构验证

用 Zod、Ajv 等验证 JSON 类型、必填字段、枚举和长度。解析失败时不要“尽量执行”，可以把可理解的错误结果送回模型要求修正一次。

### 2. 业务验证

即使参数符合 Schema，也要检查订单是否存在、日期范围是否允许、金额是否超限、状态是否支持该操作。

### 3. 权限验证

权限依据必须来自登录态和服务端数据，而不是模型参数。比如工具参数只接收 `orderId`，`userId` 从 session 读取，再查询订单是否属于当前用户。

```ts
async function cancelOrder(orderId: string, session: Session) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.userId) throw new Error("FORBIDDEN");
  if (order.status !== "PENDING") throw new Error("INVALID_STATE");
  return db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
}
```

## 五、副作用必须单独治理

查询天气和发送付款不是同一风险等级。可以把工具分为：

| 等级 | 示例 | 默认策略 |
|---|---|---|
| 只读 | 查询天气、搜索文档 | 校验后自动执行 |
| 可撤销写入 | 创建草稿、添加标签 | 显示预览，允许撤销 |
| 高风险写入 | 付款、删除、对外发送 | 明确二次确认，严格权限与审计 |

确认页面应展示**最终真实参数**，而不是只问“是否继续”。用户确认后，服务端仍需重新检查资源状态，避免确认与执行之间发生变化。

写操作还需要幂等键。例如网络重试不能重复创建工单或扣款。幂等键应与用户、动作和业务对象绑定，由服务端持久化执行结果。

## 六、工具输出也不可信

网页搜索结果、第三方 API 响应、文档内容都可能包含提示注入，例如要求模型忽略规则或调用高权限工具。工具输出应被当作数据，而不是新的系统指令。

防护方式包括：

- 在提示中清楚标记工具输出的来源和边界。
- 只提取业务需要的字段，过滤 HTML、脚本和过长文本。
- 工具结果不能改变当前用户权限或工具白名单。
- 高风险动作总是经过确定性的服务端策略，而不是让模型自行授权。
- 对外部内容设置长度、类型和来源限制。

## 七、失败、超时与并发

工具可能超时、被限流、返回空数据或部分成功。应用应给模型稳定、可枚举的错误，而不是模糊字符串：

```json
{
  "ok": false,
  "error": {
    "code": "WEATHER_TIMEOUT",
    "retryable": true,
    "message": "天气服务暂时不可用"
  }
}
```

并行调用前要检查依赖关系。例如“查汇率”和“查余额”可以并行，“创建订单”必须等“查询库存”完成。多个工具修改同一资源时应串行，或使用事务和版本号处理冲突。

为每个工具配置：单次超时、最大并发、熔断、重试上限和输出大小上限。模型循环本身还要有总时间预算和总调用次数预算。

## 八、可观测性与测试

每次工具调用建议记录：

- 会话/请求 ID、`call_id`、工具名和版本。
- 参数校验结果与权限决策；敏感字段脱敏。
- 执行耗时、重试次数、返回大小和错误码。
- 是否要求用户确认，以及确认的最终参数摘要。
- 模型最终是否正确使用工具结果。

测试不能只覆盖函数本身，还要覆盖模型路由：该调用时能否选对工具、不该调用时是否保持克制、缺参数时是否澄清、工具失败时是否诚实说明。把这些案例做成固定评测集，升级模型或修改工具描述后自动回归。

## 上线检查清单

- [ ] 工具名和描述清晰、互不重叠，Schema 足够严格。
- [ ] 所有参数都经过结构、业务和权限三层校验。
- [ ] 用户/租户身份由服务端注入，不由模型决定。
- [ ] 写操作具备确认、幂等、审计与必要的事务保护。
- [ ] 工具输出作为不可信数据处理。
- [ ] 多调用能正确关联 `call_id`，并发只用于独立任务。
- [ ] 循环次数、总耗时、工具超时和输出大小都有上限。
- [ ] 日志可追踪但不泄露密钥和隐私。

## 参考资料

- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI：Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [DeepSeek：Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/)
