Agent 工具不是“把一个函数名字告诉模型”这么简单。它是跨越模型与真实系统的契约：Schema 约束数据形状，服务端授权决定能不能做，执行预算限制怎么做，结果语义告诉 Agent 应该继续、重试、补参还是停止。任何一层含糊，模型都会用自然语言猜测填空。

## 工具意图要窄而可判定

一个好工具完成一个可命名动作，并有明确成功条件。`manage_customer()` 太宽；可以拆为 `get_customer`、`update_customer_email`、`issue_refund`。读与写分离，高风险写操作单独审批。

描述包含“何时使用、何时不用、关键限制”，不要把业务规则全塞进名称。输出字段稳定，避免有时返回字符串、有时返回对象。

## Input Schema 约束形状

```json
{
  "type": "object",
  "properties": {
    "order_id": { "type": "string", "pattern": "^ord_[A-Za-z0-9]+$" },
    "reason": { "type": "string", "enum": ["duplicate", "damaged", "other"] },
    "request_id": { "type": "string" }
  },
  "required": ["order_id", "reason", "request_id"],
  "additionalProperties": false
}
```

Schema 提供类型、必填、枚举、范围和额外字段策略。[JSON Schema 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core)定义了描述 JSON 文档结构与验证的核心语义；具体提供商只支持其中子集时，应在适配层验证。

当前 [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling)建议启用 strict mode，使函数参数遵循 schema；截至 2026-07-15，其严格模式要求对象关闭额外属性并把字段列入 required（可用 nullable 表达可选）。这些是当前 API 行为，不能替代服务端校验。

![Agent 工具调用依次经过输入 Schema、授权与执行预算，副作用之后返回结构化成功、部分成功、可重试或终止错误](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-design-contract-v1.webp)
*图：Schema 失败 REJECT，授权失败 DENY；Schema 不授予权限。*

## Authorization 是独立硬门禁

模型给出合法 `order_id`，不代表当前用户有权退款。工具服务从受信任会话获取 principal/tenant/scope，不接受模型自报的 `is_admin`。校验对象归属、状态、金额与审批策略，并记录 policy decision。

授权发生在读取敏感对象和副作用前。工具列表本身也可按主体裁剪，但“模型看不到工具”只是降低误用，不是服务端授权替代。

## 副作用语义必须显式

每个工具标注：read-only、idempotent、destructive、open-world，以及是否需要确认。以 [MCP 2025-06-18 Tools 规范](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)为例，该版本定义工具名、描述、inputSchema、可选 outputSchema，并区分协议错误与执行错误；它也要求服务器验证输入、实施访问控制、限流和清理输出。

写工具接受 idempotency key：相同 key 与相同参数返回原结果；相同 key 参数不同则冲突。取消本地等待不等于外部操作回滚，结果要支持后续查询。

## 时间、次数与资源预算

契约包含 timeout、rate limit、最大页数/行数/字节和允许重试：

```ts
type ToolPolicy = {
  timeoutMs: number;
  maxAttempts: number;
  retryableCodes: string[];
  idempotencyRequired: boolean;
  approval: 'none' | 'user' | 'admin';
};
```

超时要说明状态未知还是确定未执行。非幂等副作用在未知状态下不得盲重试；先用 request_id 查询执行状态。

## 结构化输出与错误分类

```ts
type ToolResult<T> =
  | { status: 'success'; data: T; traceId: string }
  | { status: 'partial'; data: Partial<T>; missing: string[]; traceId: string }
  | { status: 'error'; code: string; retryable: boolean; message: string; traceId: string };
```

错误码给 Agent 决策，message 给用户解释。`INVALID_ARGUMENT` 可修参一次；`RATE_LIMITED` 按 retry-after；`POLICY_DENIED` 与 `NOT_FOUND` 通常不重试；`SIDE_EFFECT_STATUS_UNKNOWN` 先查状态。

不要把栈、SQL、内部 URL 或密钥返回模型。Partial 明确已完成与未完成部分，避免 Agent 把一半结果当全部成功。

参数或输出校验失败时，只修复当前调用的候选参数或结果，不要把整个任务从头重跑。重试前用 `callId` 或幂等键查询已提交副作用：确定未执行才可重放，状态未知则先对账；若收件人、金额、文件或其他高风险参数发生变化，原审批立即失效并重新确认。

## MCP 工具调用的运行清单

MCP 解决发现与调用协议，不替代工具本身的生产契约。把一个工具交给 Agent 前，至少检查：

- **发现有界**：按任务与主体裁剪候选；分页加载工具描述，名称冲突按可信 server 标识消歧；
- **输入可信度为零**：工具注解、网页内容和模型参数都可能受注入影响，执行端独立校验 Schema 与授权；
- **输出有界**：限制字节、页数和 MIME，大结果存 Artifact 并返回摘要与引用，避免挤爆上下文；
- **错误可决策**：区分协议错误、参数错误、临时依赖故障、策略拒绝、业务失败与副作用状态未知；
- **重试可证明**：只有标记为可重试且满足幂等条件的调用才自动重试，遵守总 deadline 与 `retry-after`；
- **高风险先确认**：确认页展示实际工具、目标资源和关键参数，批准绑定参数 hash，参数变化后重新确认。

工具失败时，Agent 先读取 `retryable`、状态与证据，再选择修参、退避、替代工具、降级或转人工。不能把任意错误自由文本继续塞回模型形成无限循环，也不能因为 MCP 调用返回 `isError: false` 就跳过业务结果校验。

## Tool Contract Test

每个工具独立于模型测试：合法/缺失/额外字段、边界值、跨租户、状态竞争、超时、幂等重复、相同 key 不同参数、部分成功、输出 schema 和敏感错误清理。

再做 Agent 集成测试：是否选对工具、参数来源、何时审批、错误后是否正确重试/停止。录制工具 fixture 保证回归确定；生产沙箱验证真实授权与副作用隔离。

## 新增 Action：从能力查重到受控发布

这里把 Action 当作一项可验收的业务操作，具体语义见[本体与 Action 建模](agent-ontology-modeling.md)。新增需求先查现有能力，而不是先起一个新工具名：比较业务意图、对象与状态、输入输出、授权和副作用。两个名称不同却满足同一合同，可以复用接口或增加受控适配；名称相同但权限或业务状态不同，则应保留边界，不能强行合并。

下面是一套工程准入设计，并非 MCP 规定的发布流程：

| 阶段 | 要留下的可审核产物 | 不能跳过的判断 |
| --- | --- | --- |
| 需求与查重 | 真实用例、成功判据、现有 Action / 接口对照 | 是能力缺失，还是工具发现、参数或语义映射有问题？ |
| 合同与适配 | 版本化 Schema、前置条件、权限、副作用、错误和超时语义 | 旧接口能否兑现合同，谁维护权威状态？ |
| 评审与验证 | 业务及接口 owner 的确认、契约测试、Agent 场景回归 | 正常、拒绝、未知结果、重复执行和失败恢复是否被覆盖？ |
| 发布与回退 | 工具注册版本、限定开放范围、观测指标和停用办法 | 新旧调用方是否兼容，运行中任务继续使用哪一版？ |

[MCP 2025-11-25 工具规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)提供发现、Schema、结果及错误的协议合同，并要求服务端校验输入与访问控制；这些能力仍需业务方落实到上述准入证据。已有接口不能满足授权、幂等或结果查询时，包装成工具并没有补齐缺口，应先修接口或缩小开放能力。

发布后按版本观察误选工具、参数错误、权限拒绝、未知副作用和实际任务结果，出现退化先停用或回退注册版本。回退工具代码或目录不会撤销已发生的业务变化；已提交和状态未知的操作仍按 operation ID 对账，必要时补偿。这样新增能力的验收单位是“合同被真实兑现”，而非“工具列表多了一项”。

## 可观测性

记录 tool name/version、call ID、trace ID、principal/tenant 的非敏感标识、schema/auth decision、时长、attempt、idempotency key hash、结果 code 和副作用资源 ID。参数按字段分类脱敏，不记录原始密码、token 和文档正文。

指标包括选择率、参数验证失败、授权拒绝、成功/partial/error、重试放大、未知状态、p95 和用户取消。Agent trace 与服务 trace 通过 call ID 关联。

## 常见误区

- 一个万能工具承载所有业务动作；
- 把 Schema 校验当授权；
- 工具接收 `tenantId` 后直接信任；
- 非幂等写超时后自动重试；
- 错误只返回自由文本，Agent 无法判断；
- Partial 被包装成 success；
- 取消 HTTP 请求就声称副作用已回滚；
- 工具没有版本和 contract tests。

## 小结

工具契约把模型的不确定输出包在确定性边界里：窄意图与 Schema 约束输入，服务端授权决定权限，预算与幂等控制副作用，结构化结果和错误指导后续行为。契约测试、trace 和审批使 Agent 能安全地从“会说”跨到“会做”。

## 练一练

### 高频考点题 1：工具粒度

下面哪种工具设计更好？

- A. 一个 `manage_customer(action, data)`，用 action 区分查询、修改、删除
- B. 拆成 `get_customer`、`update_customer_email` 等窄工具，每个只完成一个可命名、可判定成功的动作
- C. 把所有业务规则写进工具名称里
- D. 输出字段随情况变化，有时返回对象有时返回字符串

**答案：B。** 宽工具既难授权又难判断成功，模型也更容易误用。描述里写清「何时用、何时不用、关键限制」，输出字段保持稳定。

### 高频考点题 2：Schema 和授权的关系

模型生成的退款参数完全符合 JSON Schema（`order_id` 格式正确、`reason` 在枚举内）。下面哪种说法正确？

- A. 参数合法，可以直接退款
- B. Schema 只约束形状，工具服务还要从受信任会话取用户和租户身份，检查当前用户是否有权退这笔订单
- C. 只要模型看不到退款工具就安全了
- D. 让模型在参数里传入 tenant_id 来证明身份

**答案：B。** 授权是独立的硬门禁，发生在读取敏感对象和产生副作用之前。身份不能由模型传入，「模型看不到工具」只能降低误用，不是授权。

### 高频考点题 3：超时后能不能重试

一个非幂等的「创建付款」工具调用超时了，不知道对方有没有执行。正确做法是？

- A. 立即重试，直到成功
- B. 不盲目重试，先用 request_id 查询执行状态，确认未执行再决定；写工具应支持幂等键
- C. 当作失败，告诉用户付款没成功
- D. 换一个工具再付一次

**答案：B。** 超时要区分「状态未知」和「确定未执行」。相同幂等键加相同参数返回原结果，相同键不同参数应报冲突。

### 面试题 4：Tool 应该怎么抽象？Schema 和错误码怎么设计？

> 出自：[字节 AI 应用开发一面：Agent 与 RAG](../../../interview/bytedance/base/bytedance-base-12.md)

面试官问：Agent 的 Tool 应该怎么抽象？Schema 和错误码你会怎么设计？

**参考答案：** ①**什么适合做 Tool**：有明确输入输出、可授权、可重试或可审计的能力，而不是含糊的「大而全助手」。②**Schema 严格**：类型、枚举、格式、边界、必填，禁止额外字段，描述写清语义和副作用（只读、幂等、破坏性、是否要确认）。③**错误分类**：区分参数错误、业务拒绝、策略拒绝、限流、超时、临时故障、副作用状态未知，并声明是否可重试；错误码给 Agent 决策，message 给用户看，不泄露栈和内部地址。④**执行端兜底**：执行端再次校验参数和授权，模型生成不等于授权；写操作带幂等键。

### 面试题 5：你接入了哪些工具，怎么约束模型的调用？

> 出自：[腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)

面试官问：你的项目接入了哪些工具？你是怎么约定和约束模型去调用它们的？

**参考答案：** ①**逐个讲清楚**：每个实际工具的用途、输入 Schema、权限、超时、错误和副作用，不只报工具数量。②**身份不由模型给**：租户和用户身份从受信任的服务端上下文取，模型传入别的租户 ID 也拿不到数据。③**先校验再执行**：模型只提议调用，运行时校验参数和调用者授权后才执行，外部服务返回结果后再交回模型。④**预算和输出有界**：超时、调用次数、返回大小都有限制，大结果存引用；高风险操作要用户确认，批准绑定具体参数。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
- [百度 Agent 秋招二三面：记忆、工具可靠性与运行循环](../../../interview/baidu/ai/baidu-ai-6.md)
- [OPPO IT 开发一面：ReAct、MCP 与智能问数](../../../interview/oppo/ai/oppo-ai-3.md)
- [美团北斗大模型算法一至四面：过程监督、GRPO 与工具参数](../../../interview/meituan/ai/meituan-ai-3.md)
- [淘天 AI Agent / 大模型应用研发二面：幻觉治理、Action 与轨迹偏好](../../../interview/alibaba/ai/alibaba-ai-30.md)
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [字节后端与 Agent 开发三面：领域建模、项目评测与基础](../../../interview/bytedance/base/bytedance-base-80.md)
- [字节 Agent Infra 校招：运行时、MySQL 与 LRU](../../../interview/bytedance/base/bytedance-base-25.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [字节 Agent 开发一面：评分、Harness 与任务可靠性](../../../interview/bytedance/base/bytedance-base-57.md)
- [海康威视 AI Agent 开发一面：可靠工具与任务状态](../../../interview/hikvision/ai/hikvision-ai-1.md)
- [字节 TRAE 后端秋招二面：项目逻辑、工具与编辑距离](../../../interview/bytedance/base/bytedance-base-76.md)
- [淘天 Agent 一面：工具调用、上下文与记忆更新](../../../interview/alibaba/ai/alibaba-ai-11.md)
- [快手大模型应用 Java 实习一面：Agent、SkillHub 与 Vibe Coding](../../../interview/kuaishou/ai/kuaishou-ai-1.md)
- [美团业务后台综合面：本体建模、Agent 评测与一致性](../../../interview/meituan/ai/meituan-ai-13.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
- [字节 Agent 与全栈：视频工作流、工具权限与 RAG](../../../interview/bytedance/base/bytedance-base-42.md)
<!-- interview-source-history:end -->

## 参考资料

- [JSON Schema — Draft 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core)
- [OpenAI — Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Model Context Protocol — Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [MCP 2025-11-25 — Tools：发现、合同、校验与访问控制](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
