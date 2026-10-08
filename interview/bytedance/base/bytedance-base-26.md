公司：字节跳动；方向：火山引擎方舟 Managed Agent；招聘场景：27 届秋招；轮次：一面，作者记录约 57 分钟。正文文字未给具体面试日；候选人附图标记2026年8月13日19:00、57分22秒，属于作者附图记录，未独立证实。

背景、经历和提问范围来自候选人自述，未独立证实。以下问题按原文归纳；答题思路为独立教学整理，不代表作者现场作答或企业标准答案。

## 教学演算：收到流式文本不代表工具已经成功

教学设定用户只授权查房源，不授权预约。模型提出book_room，运行时按用户权限拒绝，并保存任务失败原因；即使SSE已推送“正在预约”的中间文本，最终状态仍不能写成功。客户端断线时提交Last-Event-ID，服务器只有保存可重放事件并实现游标查询，才能补取之后的事件；SSE规范并没有自动保存业务日志。本例没有实际订房或运行服务。

同一原问涉及多个既有专题时，下方分列复习入口；它们不代表新增独立题目或面试流程。题后的回答均为整理教学，不是候选人现场作答。

#### （1）怎样构建可比 benchmark，系统比其他方案慢时如何定位？

<details data-knowledge-key="agent-eval-framework">
<summary>（1）怎样构建可比 benchmark，系统比其他方案慢时如何定位？</summary>
</details>

冻结任务、环境、版本、预算与判分；报告最终成功、成本和延迟分位，不能只挑成功例子。按阶段打点定位模型、检索、工具、等待和重试成本，再用 profile 验证热点。对比对象能力与约束不同，速度差不能直接解释为实现更差。

<details data-knowledge-key="agent-benchmark">
<summary>（2）同一原问的复习入口（Agent Benchmark 的设计与解读）：怎样构建可比 benchmark，系统比其他方案慢时如何定位？</summary>
</details>

冻结任务、环境、版本、预算与判分；报告最终成功、成本和延迟分位，不能只挑成功例子。按阶段打点定位模型、检索、工具、等待和重试成本，再用 profile 验证热点。对比对象能力与约束不同，速度差不能直接解释为实现更差。

<details data-knowledge-key="logging-monitoring">
<summary>（3）同一原问的复习入口（日志、指标、Tracing 与告警）：怎样构建可比 benchmark，系统比其他方案慢时如何定位？</summary>
</details>

冻结任务、环境、版本、预算与判分；报告最终成功、成本和延迟分位，不能只挑成功例子。按阶段打点定位模型、检索、工具、等待和重试成本，再用 profile 验证热点。对比对象能力与约束不同，速度差不能直接解释为实现更差。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[Agent Benchmark 的设计与解读](../../../knowledge/llm/production/agent-benchmark.md)、[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)。

#### （2）从输入到最终展示的 Agent 请求链路是什么？工具结果怎样回到上下文？

<details data-knowledge-key="function-calling">
<summary>（4）从输入到最终展示的 Agent 请求链路是什么？工具结果怎样回到上下文？</summary>
</details>

入口先验证用户和任务范围，运行时组装上下文调用模型。模型提出工具调用，宿主验证后执行，保存调用标识、结果和错误，再构造下一轮输入；工具结果应与对应调用关联，具体消息格式按模型接口版本。循环由业务验收、预算和失败规则停止，而非收到任意自然语言回复就算完成。

<details data-knowledge-key="agent-run-loop">
<summary>（5）同一原问的复习入口（Agent Run Loop、轮次与终止条件）：从输入到最终展示的 Agent 请求链路是什么？工具结果怎样回到上下文？</summary>
</details>

入口先验证用户和任务范围，运行时组装上下文调用模型。模型提出工具调用，宿主验证后执行，保存调用标识、结果和错误，再构造下一轮输入；工具结果应与对应调用关联，具体消息格式按模型接口版本。循环由业务验收、预算和失败规则停止，而非收到任意自然语言回复就算完成。

<details data-knowledge-key="context-engineering">
<summary>（6）同一原问的复习入口（上下文工程（Context Engineering））：从输入到最终展示的 Agent 请求链路是什么？工具结果怎样回到上下文？</summary>
</details>

入口先验证用户和任务范围，运行时组装上下文调用模型。模型提出工具调用，宿主验证后执行，保存调用标识、结果和错误，再构造下一轮输入；工具结果应与对应调用关联，具体消息格式按模型接口版本。循环由业务验收、预算和失败规则停止，而非收到任意自然语言回复就算完成。

知识导航：[Function Calling 与工具调用](../../../knowledge/llm/dev/function-calling.md)、[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)、[工具结果校验、解析与反馈](../../../knowledge/llm/agent/agent-tool-result-validation.md)、[上下文工程（Context Engineering）](../../../knowledge/llm/agent/context-engineering.md)。

#### （3）ReAct 是什么，何时继续或结束循环？

<details data-knowledge-key="agent-react">
<summary>（7）ReAct 是什么，何时继续或结束循环？</summary>
</details>

ReAct 交替根据观察推理与采取行动；工程上保存可审计的行动与观察，不必公开模型完整内部思维。任务达成且后置条件通过时结束；无进展、重复动作或预算耗尽时保存失败状态、澄清或接管。规划是可修订工作视图，不是成功保证。

<details data-knowledge-key="agent-run-loop">
<summary>（8）同一原问的复习入口（Agent Run Loop、轮次与终止条件）：ReAct 是什么，何时继续或结束循环？</summary>
</details>

ReAct 交替根据观察推理与采取行动；工程上保存可审计的行动与观察，不必公开模型完整内部思维。任务达成且后置条件通过时结束；无进展、重复动作或预算耗尽时保存失败状态、澄清或接管。规划是可修订工作视图，不是成功保证。

知识导航：[ReAct：推理与行动框架](../../../knowledge/llm/agent/agent-react.md)、[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)。

#### （4）Coding Agent、Context Engineering 与 Skill 怎样用于研发任务？

<details data-knowledge-key="agent-coding">
<summary>（9）Coding Agent、Context Engineering 与 Skill 怎样用于研发任务？</summary>
</details>

用真实修改任务说明检索代码、编辑、测试和验收的顺序。上下文选择保留任务约束、证据与相关代码，按需加载 Skill，并由运行时限制实际工具权限。Skill 自动修改之后需在冻结任务上回归；作者未提供具体工具使用数据，不补造。

<details data-knowledge-key="agent-skill-design">
<summary>（10）同一原问的复习入口（Agent Skill：渐进式披露、热插拔与版本治理）：Coding Agent、Context Engineering 与 Skill 怎样用于研发任务？</summary>
</details>

用真实修改任务说明检索代码、编辑、测试和验收的顺序。上下文选择保留任务约束、证据与相关代码，按需加载 Skill，并由运行时限制实际工具权限。Skill 自动修改之后需在冻结任务上回归；作者未提供具体工具使用数据，不补造。

<details data-knowledge-key="context-engineering">
<summary>（11）同一原问的复习入口（上下文工程（Context Engineering））：Coding Agent、Context Engineering 与 Skill 怎样用于研发任务？</summary>
</details>

用真实修改任务说明检索代码、编辑、测试和验收的顺序。上下文选择保留任务约束、证据与相关代码，按需加载 Skill，并由运行时限制实际工具权限。Skill 自动修改之后需在冻结任务上回归；作者未提供具体工具使用数据，不补造。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)、[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)、[上下文工程（Context Engineering）](../../../knowledge/llm/agent/context-engineering.md)。

#### （5）Auto Research 如何记录实验，如何比较两个 Skill 的效果？

<details data-knowledge-key="agent-eval-framework">
<summary>（12）Auto Research 如何记录实验，如何比较两个 Skill 的效果？</summary>
</details>

每轮保存输入、环境、版本、耗时、token、结果与失败路线。先用可执行验收或人工标签判分，再校准模型评审；开发和盲测分离，同一输入比较候选与基线。平均分提高但关键约束退化时阻断。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)。

相关机制阅读（不计专题频次）：[发布质量门禁与回归阻断](../../../knowledge/llm/production/agent-quality-gates.md)。仅阅读离线评估部分，用相同任务、Harness 和评分器比较基线与候选 Skill 输出；原帖未问生产发布门禁、SLSA 或灰度放行。

#### （6）WebSocket 和 SSE 的区别及场景是什么？

<details data-knowledge-key="websocket">
<summary>（13）WebSocket 和 SSE 的区别及场景是什么？</summary>
</details>

SSE 是 HTTP 上的单向服务器事件流，WebSocket 支持双向消息。按交互方向、代理、鉴权、重连和背压选型；SSE 的事件 id 与 Last-Event-ID 需配合可重放日志，WebSocket 要自行约定重连游标。长连接不是业务成功的唯一事实源。

<details data-knowledge-key="sse-server">
<summary>（14）同一原问的复习入口（SSE 服务端推送与连接管理）：WebSocket 和 SSE 的区别及场景是什么？</summary>
</details>

SSE 是 HTTP 上的单向服务器事件流，WebSocket 支持双向消息。按交互方向、代理、鉴权、重连和背压选型；SSE 的事件 id 与 Last-Event-ID 需配合可重放日志，WebSocket 要自行约定重连游标。长连接不是业务成功的唯一事实源。

知识导航：[WebSocket 实时通信](../../../knowledge/backend/api/websocket.md)、[SSE 服务端推送与连接管理](../../../knowledge/backend/api/sse-server.md)、[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

#### （7）Cookie 与 JWT 有何区别，JWT 如何验证？

<details data-knowledge-key="localStorage-sessionStorage">
<summary>（15）Cookie 与 JWT 有何区别，JWT 如何验证？</summary>
</details>

Cookie 是浏览器保存和随请求发送数据的机制，JWT 是签名或加密令牌格式；Cookie 可以承载 JWT，也可以承载随机 Session ID。签名验证还要校验允许算法、发行者、受众和有效期，签名不等于加密。常见签名 JWT 可本地验证，但撤销、轮换、权限变化仍可能需要服务端状态。

<details data-knowledge-key="jwt-auth">
<summary>（16）同一原问的复习入口（JWT 认证机制）：Cookie 与 JWT 有何区别，JWT 如何验证？</summary>
</details>

Cookie 是浏览器保存和随请求发送数据的机制，JWT 是签名或加密令牌格式；Cookie 可以承载 JWT，也可以承载随机 Session ID。签名验证还要校验允许算法、发行者、受众和有效期，签名不等于加密。常见签名 JWT 可本地验证，但撤销、轮换、权限变化仍可能需要服务端状态。

知识导航：[Cookie、Storage 与浏览器状态](../../../knowledge/network/others/localStorage-sessionStorage.md)、[JWT 认证机制](../../../knowledge/backend/auth/jwt-auth.md)。

#### （8）爬楼梯每次走一或二级，如何从递归优化？

<details data-knowledge-key="algorithm-loop">
<summary>（17）爬楼梯每次走一或二级，如何从递归优化？</summary>
</details>

对约定 n>=0 的计数问题，设 f(0)=1、f(1)=1，n>=2 时 f(n)=f(n-1)+f(n-2)。朴素递归重复计算子问题，记忆化或自底向上将计算次数降到 O(n)；只保存前两项可用 O(1) 辅助空间。大 n 需考虑整数溢出，边界必须先与面试官约定。

<details data-knowledge-key="algorithm-complexity">
<summary>（18）同一原问的复习入口（时间复杂度、空间复杂度与性能估算）：爬楼梯每次走一或二级，如何从递归优化？</summary>
</details>

对约定 n>=0 的计数问题，设 f(0)=1、f(1)=1，n>=2 时 f(n)=f(n-1)+f(n-2)。朴素递归重复计算子问题，记忆化或自底向上将计算次数降到 O(n)；只保存前两项可用 O(1) 辅助空间。大 n 需考虑整数溢出，边界必须先与面试官约定。

知识导航：[递归、分治与搜索](../../../knowledge/data-structure/algorithm/algorithm-loop.md)、[时间复杂度、空间复杂度与性能估算](../../../knowledge/cs/algorithm/algorithm-complexity.md)。

#### （9）不用现成哈希表，用数组实现 Map 要考虑什么？

<details data-knowledge-key="algorithm-hash">
<summary>（19）不用现成哈希表，用数组实现 Map 要考虑什么？</summary>
</details>

用哈希函数把 key 映射到桶，碰撞用拉链或开放寻址处理，比较 key 判断真正命中。开放寻址删除不能随意清空会阻断探测链的位置；负载增长触发扩容并重新散列。平均 O(1) 依赖分布和受控装载，冲突集中会退化，不能承诺每次操作常数时间。

知识导航：[哈希表、缓存与去重](../../../knowledge/data-structure/algorithm/algorithm-hash.md)。

## 原帖记录边界

原帖含题库推荐，推广内容已移除，题库推荐表中的“高频”宣传不作为真实原题证据，也未据此背书产品。反问中的团队职责仅为作者转述，未独立核实。

口述要点：模型提出动作，宿主验证后才执行，工具结果关联原调用并写入状态；终态、权限与预算决定停止，流式展示和生成文本都不能替代业务事实。

教学模拟追问（非原题）：

- **JWT签名通过就能执行预约吗？** 仍需校验算法、发行者、受众、时效和当前业务权限；有效令牌不能扩大授权动作。
- **两个Skill平均评分更高但越权次数增加，如何选择？** 权限约束独立阻断；检查真实轨迹和评分器，修复后按同输入、预算和留出标准复测。

## 整理依据

核验于2026-10-02；HTML及框架为滚动资料，JWT规则采用RFC8725，以下不背书原帖题库宣传。

- [WHATWG HTML：SSE和Last-Event-ID](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [RFC8725：JWT算法、发行者与受众校验](https://www.rfc-editor.org/rfc/rfc8725.html)
- [LangGraph Persistence：状态与恢复](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Anthropic Agent evals：结果、轨迹与独立判据](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
