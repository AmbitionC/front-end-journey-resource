### OPPO AI 全栈一面：Prompt 到 UI、RAG 与前端性能

作者记述这是一轮 AI 全栈一面，并标注 8 月 13 日，未明示面试年份；采集元数据中的 2026 年 8 月是发帖时间。本文只选录 Prompt 到页面的链路、Chunk、证据不足拒答、单/多 Agent、记忆、HTTP 状态码与页面卡顿这 7 组技术题。未收录项目选择与完整展开、个人最擅长的全栈部分、体现前端能力的个人经历、独立的幻觉经历追问，以及岗位要求和培养发展的反问。以下是教学答法，不补造候选人的前端故事、指标或实际回答。

<details data-knowledge-key="llm-response-api-patterns">
<summary>（1）从用户输入 Prompt 到前端输出，做了哪些处理？</summary>
</details>

入口先完成鉴权、限流、输入长度与敏感内容处理，并生成请求 ID。服务端将用户消息、会话状态和检索证据组装成受控上下文，调用模型或工具；每一步记录耗时、模型版本、引用和错误类型。前端使用流式协议逐段渲染，同时区分“生成中、需澄清、无证据、工具失败、完成”等状态，支持取消与重试。最终内容应经过 Markdown/富文本安全渲染，引用可回看，不能把模型原始输出直接当成可信 HTML。

知识导航：[Responses、Chat 与统一生成接口模式](../../../knowledge/llm/dev/llm-response-api-patterns.md)。

延伸阅读：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)、[对话状态、会话与历史管理](../../../knowledge/llm/dev/llm-conversation-state.md)。

<details data-knowledge-key="rag-chunking">
<summary>（2）为什么按段落切分 RAG Chunk？怎样判断它是否有效？</summary>
</details>

段落通常比固定字符窗口更接近一个完整论点，能减少把结论与条件、标题与正文拆开的情况。切分器仍要识别标题层级、列表、表格、代码块和过长段落；为每块保留文档、章节、位置和权限等元数据，必要时用小重叠缓解边界断裂。

不能凭“回答看起来不错”判断效果。应在标注问题集上比较不同大小、重叠和分隔符的证据命中率、Recall@K、上下文利用率、答案正确性、延迟和成本，并抽样检查 Chunk 是否能脱离相邻文本独立理解。

延伸阅读：[RAG Chunk 切分策略](../../../knowledge/llm/rag/rag-chunking.md)、[RAG 评测](../../../knowledge/llm/rag/rag-evaluation.md)。

<details data-knowledge-key="rag-citation-grounding">
<summary>（3）如何在证据不足时做到有依据地拒答？</summary>
</details>

把“拒答”建在检索与验证的明确门槛上：先看召回结果是否来自允许的数据、是否覆盖问题核心、是否互相矛盾或过期；再由规则或轻量校验器判断证据质量。未达到门槛时，回答应说明缺少哪类资料，给出补充信息或转人工的路径，而不是编造一个听起来完整的结论。

知识导航：[引用溯源、Grounding 与事实一致性](../../../knowledge/llm/rag/rag-citation-grounding.md)。

对可回答请求，答案只能引用本轮通过过滤的证据；对拒答案例也要进入评测集，观察过度拒答和放行幻觉的比例。不要把模型自报的置信度当成唯一依据。

延伸阅读：[RAG 失败诊断](../../../knowledge/llm/rag/rag-failure-debugging.md)。

<details data-knowledge-key="multi-agent">
<summary>（4）什么时候一个 Agent 足够，什么时候才拆多 Agent？</summary>
</details>

若任务步骤稳定、工具相近、上下文高度共享，一个受状态机和权限约束的单 Agent 更容易调试、评测和恢复。只有职责、工具权限、上下文或并行任务确实可以隔离时，例如规划、执行与独立质量核验，才考虑拆分。拆分后必须定义消息 Schema、状态归属、冲突处理、总预算和最终裁决者；“多角色 Prompt”本身不是多 Agent 的理由。

延伸阅读：[多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)。

<details data-knowledge-key="agent-memory">
<summary>（5）怎样理解长短期记忆和它们的分工？</summary>
</details>

短期记忆保存当前任务的约束、阶段状态和必要对话摘要，随会话结束或过期策略清理。长期记忆只保存经过抽取与确认的稳定事实、偏好或经验，并带上用户/租户、来源、时间、置信度、权限和版本。读取时按相关性、时效和访问控制检索；冲突信息不能静默覆盖，要保留来源并允许纠正、撤回和审计。

延伸阅读：[Agent Memory](../../../knowledge/llm/agent/agent-memory.md)、[Agent 记忆架构](../../../knowledge/llm/agent/agent-memory-architecture.md)。

<details data-knowledge-key="http-message">
<summary>（6）常见 HTTP 状态码分别表示什么？</summary>
</details>

`2xx` 表示请求已被成功处理，`3xx` 表示客户端仍需按具体状态进一步处理，例如重定向或缓存验证；`304` 应按缓存合同使用经验证的缓存表示，不是跳转，`4xx` 通常是请求、身份或权限不满足条件，`5xx` 是服务端未能完成有效请求。实践中应能举出：`200` 成功、`201` 创建、`204` 无响应体、`400` 参数不合法、`401` 未认证、`403` 无权限、`404` 资源不存在、`409` 状态冲突、`429` 被限流、`500` 未处理错误、`502` 网关收到无效上游响应、`503` 服务暂不可用、`504` 网关等待上游超时。

状态码不是错误详情的替代品。接口还应返回稳定的机器错误码、可展示的安全提示和 request ID，便于客户端选择重试、刷新认证或提示用户修改输入。

延伸阅读：[HTTP 报文与状态码](../../../knowledge/network/http/http-message.md)。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（7）页面卡顿怎样定位并修复？</summary>
</details>

先用用户感知现象界定范围：首屏慢、输入延迟、滚动掉帧还是流式内容越积越卡。结合浏览器 Performance 面板、Long Task、网络瀑布图、内存快照和真实用户指标，区分主线程长 JavaScript、频繁强制布局、过量 DOM、图片/字体、请求瀑布、泄漏或服务端流式节奏问题。

修复要对应根因：拆分长任务或移交 Worker、批量读写 DOM、虚拟列表、按需加载资源、节流渲染 token、取消失效请求、修正缓存与泄漏。上线前以同一设备和场景复测 INP、LCP、长任务与内存曲线，不能只看一次本地 FPS。

延伸阅读：[前端性能诊断与优化](../../../knowledge/frontend/engineering/frontend-performance-diagnostics.md)。
