“智能体”不是“能调用一次模型的聊天机器人”，也不是把一串固定步骤换成时髦名字。一个系统之所以更像智能体，是因为它能围绕目标持续感知环境、选择行动、读取行动结果，并在满足停止条件前调整下一步。

## 一、先区分模型、工作流和智能体

这三个概念经常混在一起：

| 概念 | 核心职责 | 路径是否预先确定 |
|---|---|---|
| 模型 | 根据输入生成预测、文本或结构化决策 | 单次调用 |
| 工作流 | 按代码定义的步骤处理任务 | 大体固定 |
| 智能体 | 根据当前状态动态选择下一步和工具 | 运行时决定 |

工作流并不“低级”。当业务路径稳定、合规要求严格时，确定性工作流通常更可靠、更便宜、更易测。Anthropic 将两者区分为：workflow 通过预定义代码路径编排模型和工具，而 agent 让模型动态决定过程与工具使用。[Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

判断是否真的需要智能体，可以问：

1. 任务能否提前写成稳定流程？
2. 中间结果是否会改变后续步骤？
3. 是否需要在多个工具间动态选择？
4. 错误是否可检测、可回滚、可让人介入？
5. 动态性带来的收益是否大于成本与风险？

## 二、经典定义：智能体活在环境里

在经典人工智能中，智能体通过传感器接收环境信息，通过执行器作用于环境，并根据绩效度量选择行动。《Artificial Intelligence: A Modern Approach》将设计智能体的第一步定义为完整描述任务环境，并用 PEAS 表示 Performance、Environment、Actuators、Sensors。[AIMA 第 2 章：Intelligent Agents](https://aima.cs.berkeley.edu/4th-ed/pdfs/newchap02.pdf)

这一定义比“由 LLM 驱动”更重要。LLM 只是可能的决策组件，智能体还需要目标、边界、状态、工具和停止机制。

## 三、用 PEAS 把模糊需求变成系统边界

PEAS 包含四项：

- **P — Performance measure，绩效度量**：怎样算完成得好？
- **E — Environment，环境**：系统在哪些外部条件下运行？
- **A — Actuators，执行器**：系统能采取哪些行动？
- **S — Sensors，传感器**：系统能观察到什么？

以“企业知识助手”为例：

| PEAS | 设计内容 |
|---|---|
| P 绩效 | 答案正确、引用充分、不越权、延迟与成本可控 |
| E 环境 | 用户、知识库、权限系统、模型服务、网络与工单系统 |
| A 执行器 | 搜索、读取文档、创建草稿、发起审批、提交工单 |
| S 传感器 | 用户问题、身份、文档片段、工具返回、错误码、审批结果 |

PEAS 会暴露许多被 Prompt 掩盖的问题。例如“帮用户修改工单”看似简单，但执行器究竟只能生成草稿，还是能直接提交？绩效是否只看任务完成，还是必须包含审批与可追溯？这些都需要在模型调用前确定。

![PEAS 定义环境、传感器、执行器和绩效目标，智能体内部通过观察、决策、行动、校验持续循环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-architecture-peas-loop-v2.png)

读图时要抓住两条边界：

- 环境信息只能通过允许的传感器进入智能体。
- 智能体只能通过受控执行器改变环境。

模型“知道某件事”不等于系统有权读取它；模型“能生成一个动作”也不等于系统有权执行它。

## 四、Agent Loop 是怎样运行的

一个最小循环可以写成：

~~~text
观察 → 更新状态 → 选择行动 → 执行工具 → 读取结果 → 校验 → 继续或停止
~~~

### 1. 观察（Observe）

观察可以是用户输入、API 返回、文件内容、页面状态、错误信息或人工审批结果。进入上下文前应做权限检查、格式校验和必要压缩。

### 2. 决策（Decide）

模型结合指令、当前状态和可用工具，决定下一步是回答、调用工具、请求澄清、等待审批还是停止。生产系统更适合使用结构化工具调用，不应依赖正则从自由文本中猜动作。

### 3. 行动（Act）

执行器把结构化决策转为真实调用。这里必须重新校验工具名、参数、权限、幂等键、预算和超时。模型输出只是提议，不是授权。

### 4. 校验（Check）

系统读取 Observation，判断行动是否成功、任务是否完成、是否偏离目标，以及是否应重试、换策略或升级给人。

### 5. 停止（Stop）

停止条件应写进代码，而不是只写在 Prompt：

- 已获得满足验收标准的结果；
- 需要用户补充信息；
- 达到步骤、token、时间或费用上限；
- 工具连续失败；
- 即将执行高风险或不可逆操作；
- 安全策略拒绝继续。

OpenAI 的 agent 指南同样把循环与退出条件视为核心，并强调 guardrail 与人工审批可让运行暂停或停止。[OpenAI：A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)

## 五、智能体内部有哪些模块

### 模型与指令

模型负责理解、选择和生成，但能力边界取决于任务。较强模型适合高歧义决策，较小模型可以处理分类、提取等稳定步骤。System Prompt 应描述角色、目标、禁止事项和工具语义，不应承担本可由代码保证的权限控制。

### 状态与记忆

**状态**是当前运行必须知道的信息，例如任务、已执行步骤、工具结果和剩余预算。

**记忆**是跨步骤或跨会话保留的信息。它可以分成：

- 工作记忆：当前轨迹中的必要上下文；
- 情景记忆：过去任务与结果；
- 语义记忆：可检索的知识；
- 用户偏好：经授权保存的稳定偏好。

记得更多不一定更聪明。无关历史会挤占上下文，过期记忆会造成错误，敏感信息还涉及保留期限和访问控制。

### 工具

工具是智能体与世界交互的接口。一个好工具应具备：

- 名称与用途明确；
- 参数 Schema 精确；
- 返回值紧凑、可判定成功或失败；
- 错误码可行动；
- 权限范围最小；
- 写操作支持幂等、审计与回滚；
- 文档包含正反例和边界。

Anthropic 的工程经验强调，Agent–Computer Interface 的质量与工具文档、测试同样关键，而不只是模型选择。[Anthropic：Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)

## 六、经典智能体类型如何理解

AIMA 常用以下类型帮助理解能力递进：

1. **简单反射型**：只根据当前观察匹配规则。
2. **基于模型型**：维护内部状态，补足不可见环境。
3. **目标型**：根据目标比较可选行动。
4. **效用型**：在多个可行结果中权衡收益、风险与成本。
5. **学习型**：根据反馈改进策略或组件。

现代 LLM 智能体通常混合这些思想：模型做语义决策，代码规则做安全约束，状态机控制流程，评测和反馈推动后续优化。不要把它简单归为一种传统类型。

## 七、环境属性决定架构难度

设计时还要判断环境是否：

- **完全可观察 / 部分可观察**：是否能看到完成决策所需的全部信息？
- **确定性 / 随机性**：相同行动是否必然得到相同结果？
- **静态 / 动态**：决策期间环境会不会变化？
- **离散 / 连续**：状态与行动空间能否枚举？
- **单智能体 / 多智能体**：是否存在协作或竞争者？

网页操作、投资交易和真实机器人都属于动态、部分可观察且存在失败的环境，不能只靠“多循环几次”。需要刷新状态、处理并发、确认副作用，并设置更严格的人工门槛。

## 八、安全不是循环外的一圈装饰

至少需要四层控制：

1. **输入层**：身份、权限、敏感信息和提示注入检查。
2. **决策层**：只向模型暴露当前任务需要的工具和数据。
3. **执行层**：参数校验、限额、审批、幂等、沙箱和审计。
4. **结果层**：事实、引用、策略与副作用校验。

高风险工具应默认“提议—预览—批准—执行”，并向用户展示将要发生什么。OpenAI 的 guardrail 与 human review 文档也把自动校验与人工批准定义为互补控制。[OpenAI：Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)

## 常见误区

- **有 LLM 就叫智能体**：单次问答没有环境闭环。
- **步骤越多越智能**：更多循环也可能只是更多成本和失败机会。
- **把所有工具一次性暴露给模型**：扩大误调用和提示注入影响面。
- **把权限写在 Prompt 里**：模型不能替代服务端授权。
- **保存完整历史当记忆**：会引入噪声、隐私与过期信息。
- **只判断工具 HTTP 成功**：业务结果可能仍未达标。
- **没有停止预算**：智能体会重试、绕圈或持续消耗。

## 小结

智能体是一套围绕环境闭环运行的系统。PEAS 先定义目标、环境、可见信息和可执行动作；Agent Loop 再把观察、决策、行动、校验和停止串起来。LLM 提供灵活决策，但可靠性来自清晰工具、显式状态、代码级权限、停止条件、评测与人工控制。

## 参考资料

- [Russell & Norvig：Intelligent Agents](https://aima.cs.berkeley.edu/4th-ed/pdfs/newchap02.pdf)
- [Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Anthropic：Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [OpenAI：A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
- [OpenAI：Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)

