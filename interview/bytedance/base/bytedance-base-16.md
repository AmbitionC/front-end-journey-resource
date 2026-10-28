### 字节大模型应用开发一面：Agent、RAG 与可靠性

原帖发布于 2026 年 8 月，未披露具体面试日期。本文按主题归并原帖可见技术问题及追问，省略自我介绍、面试评价和个人复盘；以下短答是教学整理，不代表候选人当场答案或已实现的生产能力。原帖状态冲突示例中的字段名被遮蔽，本文不复原该字段名，只说明一般校验方法。

这轮一面连续深挖 Agent 模块、AI Coding 沙箱、Tool 契约、Memory、规划范式、多 Agent、RAG 和线上稳定性。复习时可结合这些问题检查模型能力与软件工程控制之间的边界。

#### （1）为什么选择 AI 应用开发？

<details data-binding-status="pending_semantic_verification">
<summary>（1）为什么选择 AI 应用开发？</summary>
<p>关联知识点待核实。</p>
</details>

把个人经历与真实问题连接起来：你曾在哪个流程中遇到规则难覆盖、检索不准或人力成本高的问题，为什么模型能力有价值，又为什么仍需要工程系统兜底。回答应体现“用 AI 解决问题”，而不是“因为方向热门”。

#### （2）AI Coding 的代码执行怎样隔离？

<details data-binding-status="pending_semantic_verification">
<summary>（2）AI Coding 的代码执行怎样隔离？</summary>
<p>关联知识点待核实。</p>
</details>

生成和执行必须分权。代码在临时容器或轻量虚拟机中运行，使用只读基础镜像、非特权用户、网络白名单、CPU/内存/进程数/磁盘配额和总超时；输入、依赖与产物有大小限制。执行结束销毁环境并保留审计记录，高风险能力需要人工批准。多轮修复也要设最大次数，失败后返回证据而非无限自愈。

#### （3）一个 Agent 系统应有哪些模块？

<details data-binding-status="pending_semantic_verification">
<summary>（3）一个 Agent 系统应有哪些模块？</summary>
<p>关联知识点待核实。</p>
</details>

核心包括目标与指令、模型、上下文/记忆、规划或路由、工具执行、状态与控制循环；生产环境还要补权限、预算、评测、Tracing 和人工接管。每轮读取状态、选择动作、校验参数、执行工具、验证结果并更新状态，直到成功、失败或预算耗尽。

延伸阅读：[Agent 架构与 Loop](../../../knowledge/llm/agent/agent-architecture.md)。

#### （4）Tool 契约怎样设计？

<details data-binding-status="pending_semantic_verification">
<summary>（4）Tool 契约怎样设计？</summary>
<p>关联知识点待核实。</p>
</details>

一个 Tool 只承担清晰职责，参数用严格 Schema 表达类型、枚举、范围和必填项，响应区分成功、业务拒绝、参数错误、权限拒绝、限流和临时故障。服务端必须重新鉴权和校验；有副作用的调用使用幂等键、审批与审计；大结果分页或摘要返回，避免污染上下文。

延伸阅读：[Agent 工具契约](../../../knowledge/llm/agent/agent-tool-design.md)。

#### （5）短期与长期 Memory 怎样实现和去重？

<details data-binding-status="pending_semantic_verification">
<summary>（5）短期与长期 Memory 怎样实现和去重？</summary>
<p>关联知识点待核实。</p>
</details>

短期记忆保存当前任务消息、计划与工具证据，按 Token 预算做窗口、摘要和结构化压缩；长期记忆只保存跨会话仍有价值的事实、偏好和经验。写入时记录主体、来源、时间、置信度和版本，用语义指纹合并重复；读取时做权限隔离、时间衰减和相关性排序，并允许旧事实被纠正。

#### （6）ReAct 与 Plan-and-Execute 如何选择？

<details data-binding-status="pending_semantic_verification">
<summary>（6）ReAct 与 Plan-and-Execute 如何选择？</summary>
<p>关联知识点待核实。</p>
</details>

探索性、每一步依赖新观察的任务适合 ReAct；依赖关系清楚、可提前拆解的长任务适合 Plan-and-Execute；复杂分支和恢复更适合显式状态图。三者都必须有最大轮次、预算、超时、重复动作检测和终止条件。不要把模型的“思考完成”当作系统成功，验收应由外部条件判断。

#### （7）多 Agent 怎样通信并避免状态冲突？

<details data-binding-status="pending_semantic_verification">
<summary>（7）多 Agent 怎样通信并避免状态冲突？</summary>
<p>关联知识点待核实。</p>
</details>

先确认是否真的需要多 Agent。需要时用明确角色、任务 ID、输入输出契约和中心协调者分工；消息通过持久队列或事件总线传递，状态写入带版本的共享存储。更新使用乐观锁或单写者规则，冲突结果交给验证器或人工，而不是让 Agent 互相辩论到超时。

延伸阅读：[多智能体协作边界](../../../knowledge/llm/agent/multi-agent.md)。

#### （8）Chunk 与检索效果怎样实验？

<details data-binding-status="pending_semantic_verification">
<summary>（8）Chunk 与检索效果怎样实验？</summary>
<p>关联知识点待核实。</p>
</details>

Chunk 大小和重叠度由文档结构与真实查询决定。建立标注问题集，对不同解析、语义边界、大小、重叠、Embedding、Top-K 和 Rerank 方案做消融；分别观察 Recall@K、MRR/nDCG、引用覆盖和最终回答正确率。不能只用“256 或 512 效果好”作为跨业务结论。

#### （9）向量召回不准怎样定位？

<details data-binding-status="pending_semantic_verification">
<summary>（9）向量召回不准怎样定位？</summary>
<p>关联知识点待核实。</p>
</details>

按数据、解析、Chunk、Embedding、查询改写、过滤、召回、融合、Rerank 和生成逐层回放。专有名词和编号可补 BM25，语义问题用向量召回，候选用 RRF 或学习排序融合。固定正确证据后模型仍答错，问题在生成；正确片段从未进入候选，才是召回问题。

#### （10）线上稳定性和可观测性怎样设计？

<details data-binding-status="pending_semantic_verification">
<summary>（10）线上稳定性和可观测性怎样设计？</summary>
<p>关联知识点待核实。</p>
</details>

一次 Run 记录模型版本、Prompt、Token、检索候选、工具参数与结果、阶段耗时、重试和终止原因。调用设置连接、首 Token、总生成和工具分阶段超时；有限重试带退避，只重试幂等操作；模型或依赖故障时切换降级路径。监控成功率、P95/P99、成本、循环率和人工接管率。

延伸阅读：[Agent 可观测性](../../../knowledge/llm/production/ai-observability.md)、[工具超时与重试](../../../knowledge/llm/agent/agent-tool-timeout.md)。

#### （11）怎样画清 AI Coding 项目流程，生成代码不准确时怎样处理？

<details data-binding-status="pending_semantic_verification">
<summary>（11）怎样画清 AI Coding 项目流程，生成代码不准确时怎样处理？</summary>
<p>关联知识点待核实。</p>
</details>

把输入、上下文获取、代码生成、隔离执行、结果校验、有限修复和人工接管画成有明确状态的流程。失败时保存错误证据，区分生成错误与环境错误，在轮次和成本预算内修正；达到上限后返回现状及复现方法。流程图应标出真实已实现和计划实现的部分。

#### （12）怎样学习前沿技术，日常使用哪些 AI 编程工具？

<details data-binding-status="pending_semantic_verification">
<summary>（12）怎样学习前沿技术，日常使用哪些 AI 编程工具？</summary>
<p>关联知识点待核实。</p>
</details>

用一手论文、官方发布说明和开源代码建立候选，再通过小实验和固定评测验证是否适合自己的任务。工具使用可以按补全、仓库修改、调试、评测分类，说明本人实际采用的工具、使用边界和如何验证产物；不能把原帖列举的工具当成自己的经历。

#### （13）Memory 的访问次数要每次写库吗？

<details data-binding-status="pending_semantic_verification">
<summary>（13）Memory 的访问次数要每次写库吗？</summary>
<p>关联知识点待核实。</p>
</details>

先明确计数用途和允许误差。只用于热度或淘汰参考时，可在内存累加后批量异步写回，配合合并策略、周期刷新和故障后的误差说明；涉及计费或严格审计时，应采用可追溯的持久事件与幂等聚合。异步更新会有丢失窗口，不能一概视为精确计数。

#### （14）RAG 的整体流程怎样展开？

<details data-binding-status="pending_semantic_verification">
<summary>（14）RAG 的整体流程怎样展开？</summary>
<p>关联知识点待核实。</p>
</details>

索引阶段解析、清洗、切分文档，记录来源、版本和权限，计算表示并建立索引；查询阶段理解问题、检索和过滤候选、融合与重排，组装有限证据后生成可引用的答案。把召回、排序、生成和系统指标分开评测，才能定位哪一层失败。

#### （15）BM25 与 TF-IDF 有何差别，Rerank 如何实现和调权？

<details data-binding-status="pending_semantic_verification">
<summary>（15）BM25 与 TF-IDF 有何差别，Rerank 如何实现和调权？</summary>
<p>关联知识点待核实。</p>
</details>

BM25 在词项匹配中加入词频饱和与文档长度归一化，不能把它与某个搜索产品简单画等号。重排可使用交叉编码器，也可融合语义、词项、时效等特征；先校准不同分数，再用标注集调参、留出集验证，并测延迟和成本。原帖中的经验权重不作为通用最优值。

#### （16）RAG 与微调如何选择和组合？

<details data-binding-status="pending_semantic_verification">
<summary>（16）RAG 与微调如何选择和组合？</summary>
<p>关联知识点待核实。</p>
</details>

需要更新事实、私有知识和引用证据时先建立 RAG 基线；需要稳定改变输出格式、风格或任务行为时评估微调。两者可以组合，例如用微调改善查询改写或输出格式，再由 RAG 提供当前证据。比较效果、数据授权、更新成本与维护难度，不能认为微调必然消除检索需求。

#### （17）怎样降低 RAG 延迟与成本，Embedding 模型怎样选？

<details data-binding-status="pending_semantic_verification">
<summary>（17）怎样降低 RAG 延迟与成本，Embedding 模型怎样选？</summary>
<p>关联知识点待核实。</p>
</details>

先分阶段测量延迟和成本，再评估缓存、并行召回、减少冗余上下文、结果复用和模型路由。Embedding 选型要在同一语料与查询集上比较召回质量、语言覆盖、延迟、部署与维护成本，并记录版本；不能把原帖的某次换模型经历或速度数字当成自己的实测结论。

#### （18）遇到幻觉 Bad Case 怎样定位，Reviewer 的成本怎样控制？

<details data-binding-status="pending_semantic_verification">
<summary>（18）遇到幻觉 Bad Case 怎样定位，Reviewer 的成本怎样控制？</summary>
<p>关联知识点待核实。</p>
</details>

固定输入、索引版本、召回证据和模型输出，先判定证据未召回、排序遗漏还是生成歪曲。关键数字和日期可做引用校验，缺证据时允许拒答；Reviewer 只是额外检查，不能保证正确。按风险触发检查，用规则处理可确定的约束，并在固定样本上同时评估漏检、误报、延迟与成本。

#### （19）异步模式怎样影响用户体验，何时适用？

<details data-binding-status="pending_semantic_verification">
<summary>（19）异步模式怎样影响用户体验，何时适用？</summary>
<p>关联知识点待核实。</p>
</details>

报告等可等待任务可以先返回任务标识和状态，再用轮询或事件通知交付结果；在线问答通常需要明确首响应与总超时。界面要区分已受理、执行中、成功、失败和取消，不能把“已提交”显示为“已完成”。选择同步或异步应依据等待容忍度、可靠交付和交互反馈。
