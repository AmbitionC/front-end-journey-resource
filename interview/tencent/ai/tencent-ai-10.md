公司：腾讯；岗位：Agent 开发实习；轮次：一面。帖子发表于 2026-03-30，原文没有给具体面试日期。

以下原题范围来自候选人自述，未独立证实；28 条提问按相近主题合并，括号标明对应原题序号。答题思路、贯穿例子与模拟追问为独立整理，不代表作者实际作答或企业标准答案。本文要解决的是：怎样把资料问答的导入、检索、工具调用、流式输出与恢复连成可解释的运行过程。

## 先走通一次资料问答（教学补充）

设租户 t1 的用户询问“资料里的退款条件是什么”。资料 d3 的 v2 版本已经完成解析、分块与索引，每块带租户、来源和访问权限。系统为本次问答保存 run r1、所用索引版本和预算，只给运行时开放 search_docs、get_passage 两个只读工具。工具名和状态名是教学设定，未在完整系统运行；不是原帖披露的工具配置。

最小过程是：服务端鉴权并建立 r1 → 模型提出检索工具和参数 → 运行时重新验证参数与权限 → 检索服务返回允许访问的片段 → 模型根据片段生成答案和引用 → 服务端记录完成结果。若问题只需固定检索与生成，可先实现确定性的 RAG 链；确实需要按观察补查资料时，再增加决策循环。

SSE 可以持续传递检索进度与文本增量，前端看到半句话时，r1 仍可能是 running。预算耗尽要记录原因并结束或暂停，不能展示为成功；连接断开后，客户端查询 r1 的状态和已保存结果，按约定的事件游标恢复展示。这个恢复能力由应用的状态与事件存储提供，不能仅凭“用了 SSE”推定存在。下面的原题都可以用这条过程说明状态归谁、下一步为何发生。

## 原始提问归纳与答题思路

同一原问涉及多个既有专题时，下方分列复习入口；它们不代表新增独立题目或面试流程。题后的回答均为整理教学，不是候选人现场作答。

#### （1）实习和项目怎样介绍，检索是否基于向量，完整 RAG 系统有哪些组成？（原题 1–3）

<details data-knowledge-key="rag-pipeline">
<summary>（1）实习和项目怎样介绍，检索是否基于向量，完整 RAG 系统有哪些组成？（原题 1–3）</summary>
</details>

从业务目标和自己的贡献进入，沿 d3 说明两条链：导入链把原始资料变成有来源与版本的索引；问答链将用户问题变成候选片段，再组织上下文生成答案。Spring AI 的 ETL 官方章节将读取、变换、写入分开，可用来理解导入职责，但不能据此认定原项目采用了 Spring AI。[Spring AI ETL Pipeline](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)

<details data-knowledge-key="agent-resume-interview">
<summary>（2）同一原问的复习入口（AI / Agent 岗位简历与面试）：实习和项目怎样介绍，检索是否基于向量，完整 RAG 系统有哪些组成？（原题 1–3）</summary>
</details>

从业务目标和自己的贡献进入，沿 d3 说明两条链：导入链把原始资料变成有来源与版本的索引；问答链将用户问题变成候选片段，再组织上下文生成答案。Spring AI 的 ETL 官方章节将读取、变换、写入分开，可用来理解导入职责，但不能据此认定原项目采用了 Spring AI。[Spring AI ETL Pipeline](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)

回答“是否基于向量”要给实际实现：是否用了 embedding、保存在哪个索引、怎样过滤权限、是否还有词法召回。不要把只调用一次向量查询说成完整生产 RAG。权限、更新删除、失败状态与观测也需要沿两条链说明；检索结果进入模型前就必须符合用户访问范围。[Elasticsearch 文档级访问控制](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level)

**口述结论：**我会沿实际数据流介绍贡献，因为完整 RAG 包含索引构建与在线问答的连接；向量召回只是其中一环，权限和版本也必须落实。

知识导航：[RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)、[AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)。

#### （2）文档上传和分块怎样实现，为什么每个用户只能上传一个文件？（原题 4、15）

<details data-knowledge-key="rag-production-ingestion">
<summary>（3）文档上传和分块怎样实现，为什么每个用户只能上传一个文件？（原题 4、15）</summary>
</details>

上传入口先检查授权、文件类型与大小，保存原文件并创建可查询的导入任务；后续解析、切块和索引写入记录任务与资料版本。以 d3 为例，章节标题和来源页码应随片段保留，否则生成引用时无法说明证据来自哪里。新版本未准备好时继续读取旧的完整版本，是本例避免半成品暴露的设计选择。

<details data-knowledge-key="rag-chunking">
<summary>（4）同一原问的复习入口（文本分块策略（Chunking））：文档上传和分块怎样实现，为什么每个用户只能上传一个文件？（原题 4、15）</summary>
</details>

上传入口先检查授权、文件类型与大小，保存原文件并创建可查询的导入任务；后续解析、切块和索引写入记录任务与资料版本。以 d3 为例，章节标题和来源页码应随片段保留，否则生成引用时无法说明证据来自哪里。新版本未准备好时继续读取旧的完整版本，是本例避免半成品暴露的设计选择。

<details data-knowledge-key="file-upload-service">
<summary>（5）同一原问的复习入口（文件上传、分片与对象存储）：文档上传和分块怎样实现，为什么每个用户只能上传一个文件？（原题 4、15）</summary>
</details>

上传入口先检查授权、文件类型与大小，保存原文件并创建可查询的导入任务；后续解析、切块和索引写入记录任务与资料版本。以 d3 为例，章节标题和来源页码应随片段保留，否则生成引用时无法说明证据来自哪里。新版本未准备好时继续读取旧的完整版本，是本例避免半成品暴露的设计选择。

分块要结合文档结构与检索任务，查看一个片段是否能完整解释退款条件、多个条件是否被无意义拆开，再用标注查询验证效果。大小和重叠不是脱离语料的通用常数。单文件限制可能来自界面、配额或实现范围，原帖没有披露原因，不能替作者填一个理由。应给自己真实限制、用户影响和扩展验收条件；多文件还需要去重、版本与访问范围管理。

**口述结论：**我让上传返回任务状态，再按资料结构与查询证据调整分块；单文件限制必须如实解释，扩展时要同时处理容量和跨文件索引管理。

知识导航：[生产级文档解析、索引与增量更新](../../../knowledge/llm/rag/rag-production-ingestion.md)、[文本分块策略（Chunking）](../../../knowledge/llm/rag/rag-chunking.md)、[文件上传、分片与对象存储](../../../knowledge/backend/api/file-upload-service.md)。

#### （3）单次向量召回耗时、Rerank 与匹配度评测怎样说明？（原题 5–6）

<details data-knowledge-key="rag-reranking">
<summary>（6）单次向量召回耗时、Rerank 与匹配度评测怎样说明？（原题 5–6）</summary>
</details>

先给测量口径：一次请求从哪里开始、在哪里结束，语料量、候选数、并发、缓存情况与延迟分位是什么。拆开 embedding、检索、重排与生成的耗时，避免把整次问答延迟叫向量检索耗时。Rerank 对已经召回的候选重新排序；若有关片段根本没进入候选集，重排不能从集合外找回它。因此是否使用重排，要比较同一候选与查询下的排序质量和额外成本。[Elasticsearch Text similarity reranker](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/text-similarity-reranker-retriever)

<details data-knowledge-key="rag-evaluation">
<summary>（7）同一原问的复习入口（RAG 评估与优化）：单次向量召回耗时、Rerank 与匹配度评测怎样说明？（原题 5–6）</summary>
</details>

先给测量口径：一次请求从哪里开始、在哪里结束，语料量、候选数、并发、缓存情况与延迟分位是什么。拆开 embedding、检索、重排与生成的耗时，避免把整次问答延迟叫向量检索耗时。Rerank 对已经召回的候选重新排序；若有关片段根本没进入候选集，重排不能从集合外找回它。因此是否使用重排，要比较同一候选与查询下的排序质量和额外成本。[Elasticsearch Text similarity reranker](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/text-similarity-reranker-retriever)

<details data-knowledge-key="rag-latency-cost">
<summary>（8）同一原问的复习入口（RAG 延迟、吞吐与成本优化）：单次向量召回耗时、Rerank 与匹配度评测怎样说明？（原题 5–6）</summary>
</details>

先给测量口径：一次请求从哪里开始、在哪里结束，语料量、候选数、并发、缓存情况与延迟分位是什么。拆开 embedding、检索、重排与生成的耗时，避免把整次问答延迟叫向量检索耗时。Rerank 对已经召回的候选重新排序；若有关片段根本没进入候选集，重排不能从集合外找回它。因此是否使用重排，要比较同一候选与查询下的排序质量和额外成本。[Elasticsearch Text similarity reranker](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/text-similarity-reranker-retriever)

为“退款条件是什么”等业务查询标出相关片段，检查相关内容是否被召回、是否排到前面；再验证最终答案有无遗漏、引用是否支持结论。Elasticsearch 官方排序评估接口使用带相关性评分的文档和代表查询评估检索结果，这比仅观察相似度分数更能回答业务匹配问题。[Elasticsearch 排序评估](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-rank-eval)

原帖没有给真实耗时、模型、候选数或效果数据，本文不补数字。没有相同条件的实验，也不宣称某个重排模型一定更好。

**口述结论：**我用明确计时边界和标注查询说明耗时与质量，因为高相似度不等于业务相关；重排只处理候选集，召回遗漏必须先在召回侧解决。

知识导航：[Rerank 重排序原理与实践](../../../knowledge/llm/rag/rag-reranking.md)、[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)、[RAG 延迟、吞吐与成本优化](../../../knowledge/llm/rag/rag-latency-cost.md)。

#### （4）怎样理解 Agent 的核心模块与 ReAct 范式？（原题 7–8）

<details data-knowledge-key="agent-architecture">
<summary>（9）怎样理解 Agent 的核心模块与 ReAct 范式？（原题 7–8）</summary>
</details>

先从行为定义：运行时保存目标和当前状态，调用模型决定下一步，执行被授权的工具，将观察结果带入后续决策，并判断是否停止。本例中检索返回“条件只适用于线上订单”，下一步才决定是否补查线下规则；如果第一轮证据已经完整，就直接生成答案而不是为了循环而循环。

<details data-knowledge-key="agent-react">
<summary>（10）同一原问的复习入口（ReAct：推理与行动框架）：怎样理解 Agent 的核心模块与 ReAct 范式？（原题 7–8）</summary>
</details>

先从行为定义：运行时保存目标和当前状态，调用模型决定下一步，执行被授权的工具，将观察结果带入后续决策，并判断是否停止。本例中检索返回“条件只适用于线上订单”，下一步才决定是否补查线下规则；如果第一轮证据已经完整，就直接生成答案而不是为了循环而循环。

ReAct 原论文研究将推理与行动交替，让行动带来的观察帮助修正后续步骤。工程介绍应说明可审计的工具输入、结果和状态变化，无需公开模型完整内部思维过程；确定性链路与模型自主决策也应分清。[ReAct 原论文（2022）](https://arxiv.org/abs/2210.03629)

**口述结论：**Agent 的关键是观察能影响下一步行动，而 ReAct 给出推理与行动交替的范式；简单固定问答可以先用 RAG 链，循环是否有价值取决于任务是否需要补查和改策。

知识导航：[智能体定义、类型、PEAS 与 Agent Loop](../../../knowledge/llm/agent/agent-architecture.md)、[ReAct：推理与行动框架](../../../knowledge/llm/agent/agent-react.md)。

#### （5）一般几步完成，达到最大步数仍未完成怎么办，是否设置 Plan？（原题 9、13）

<details data-knowledge-key="agent-run-loop">
<summary>（11）一般几步完成，达到最大步数仍未完成怎么办，是否设置 Plan？（原题 9、13）</summary>
</details>

只报告自己任务分布中的真实轨迹，并定义“步”是一次模型调用还是一次工具动作；没有通用最优步数。r1 同时限制轮次、时间、token 和工具调用预算，工具返回后更新剩余预算，决定继续、完成或停止。达到上限但证据不足时，保存已取得的资料、停止原因和可恢复位置，明确告知未完成，再按策略澄清或交给人工处理。

<details data-knowledge-key="agent-planning">
<summary>（12）同一原问的复习入口（任务规划、分解与动态重规划）：一般几步完成，达到最大步数仍未完成怎么办，是否设置 Plan？（原题 9、13）</summary>
</details>

只报告自己任务分布中的真实轨迹，并定义“步”是一次模型调用还是一次工具动作；没有通用最优步数。r1 同时限制轮次、时间、token 和工具调用预算，工具返回后更新剩余预算，决定继续、完成或停止。达到上限但证据不足时，保存已取得的资料、停止原因和可恢复位置，明确告知未完成，再按策略澄清或交给人工处理。

Plan 可把依赖复杂的任务拆成步骤，但工具观察可能否定计划，重规划也要消耗预算。固定的“检索→生成”本例未必需要独立 Plan 调用；若改成跨多份资料核对冲突，显式计划可以帮助追踪还有哪些证据没取到。检查点是应用持久状态，需要明确保存哪些输入与结果，不能从使用某个框架推定断点续跑已完成。

**口述结论：**我根据真实轨迹设置多种预算，并在耗尽时记录未完成原因；Plan 适合复杂依赖，但必须随观察修订且有恢复和停止边界。

知识导航：[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)、[任务规划、分解与动态重规划](../../../knowledge/llm/agent/agent-planning.md)、[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)。

#### （6）接入了哪些工具，怎样约定并约束模型调用？（原题 10–11）

<details data-knowledge-key="agent-tool-design">
<summary>（13）接入了哪些工具，怎样约定并约束模型调用？（原题 10–11）</summary>
</details>

逐个说实际工具的用途、输入 Schema、权限、超时、错误和副作用。本例只读工具接受资料 ID 与检索词，租户和用户身份由受信任的服务端上下文取得，不能由模型传入另一个租户就获得访问。模型提议 get_passage(d3)，运行时先校验参数和调用者授权，再执行查询，外部服务返回结果后才交回模型。

<details data-knowledge-key="agent-tool-selection">
<summary>（14）同一原问的复习入口（工具发现、选择与路由）：接入了哪些工具，怎样约定并约束模型调用？（原题 10–11）</summary>
</details>

逐个说实际工具的用途、输入 Schema、权限、超时、错误和副作用。本例只读工具接受资料 ID 与检索词，租户和用户身份由受信任的服务端上下文取得，不能由模型传入另一个租户就获得访问。模型提议 get_passage(d3)，运行时先校验参数和调用者授权，再执行查询，外部服务返回结果后才交回模型。

结构化调用约束的是表达形式，授权决定能否执行；合法 JSON 仍可能是越权参数。MCP 工具规范要求服务端校验输入并实施访问控制，客户端还应处理结果校验、超时与审计。风险与用户范围决定候选工具，运行时仍要再检查实际调用。[MCP 2026-07-28 Tools：Security Considerations](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#security-considerations)

原帖未给工具清单或配置，不能把教学例的两个工具写成作者实际接入情况。

**口述结论：**我用 Schema 描述调用合同，用运行时鉴权决定执行，因为模型输出只是调用提议；只读也有数据访问风险，正确格式不能替代权限判断。

知识导航：[Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)、[工具发现、选择与路由](../../../knowledge/llm/agent/agent-tool-selection.md)。

#### （7）项目推流是否用 SSE，SSE、WebSocket 与 HTTP 怎样关联？（原题 12、14）

<details data-knowledge-key="sse-server">
<summary>（15）项目推流是否用 SSE，SSE、WebSocket 与 HTTP 怎样关联？（原题 12、14）</summary>
</details>

先如实说明自己推流实现。SSE 用 HTTP 响应承载 text/event-stream 事件，适合服务器持续向客户端发消息；浏览器 EventSource 规范提供重连与 Last-Event-ID，但服务端必须自己保留并按游标补发事件。WebSocket 在 RFC 6455 描述的握手后提供双方独立发送消息的通道。SSE 并不独立于 HTTP，也不能把 HTTP 简化为只能一次返回完整内容。[WHATWG Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)、[RFC 6455：双向消息通道](https://www.rfc-editor.org/rfc/rfc6455.html#section-1.2)

<details data-knowledge-key="websocket">
<summary>（16）同一原问的复习入口（WebSocket 实时通信）：项目推流是否用 SSE，SSE、WebSocket 与 HTTP 怎样关联？（原题 12、14）</summary>
</details>

先如实说明自己推流实现。SSE 用 HTTP 响应承载 text/event-stream 事件，适合服务器持续向客户端发消息；浏览器 EventSource 规范提供重连与 Last-Event-ID，但服务端必须自己保留并按游标补发事件。WebSocket 在 RFC 6455 描述的握手后提供双方独立发送消息的通道。SSE 并不独立于 HTTP，也不能把 HTTP 简化为只能一次返回完整内容。[WHATWG Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)、[RFC 6455：双向消息通道](https://www.rfc-editor.org/rfc/rfc6455.html#section-1.2)

在同一资料问答任务下，文本与进度主要从服务器推送，可评估 SSE；少量取消或补充输入可走独立 HTTP 请求。如果需要双方持续高频交互，再比较 WebSocket 的连接、消息路由和恢复成本。选择还受鉴权、代理超时、事件保留与慢客户端处理影响，不能仅比较协议名称。

r1 的 running、completed 或 budget_exhausted 是应用状态，文本增量和连接关闭都不是成功证明。断线后重新鉴权，查询 r1；已有结果则恢复展示，仍在运行则重新订阅，无法恢复则明确返回原因。是否断线就取消后端任务要在应用合同中定义。这里讨论的是前端展示流；下文 MCP 的请求流取消规则要按相应协议版本另外实现。

**口述结论：**SSE 是 HTTP 事件流，WebSocket 提供双向消息；本例先按交互方向选，再用持久 run 状态确认结果，因为传输结束不等于业务完成，重连也不自动获得历史事件。

知识导航：[SSE 服务端推送与连接管理](../../../knowledge/backend/api/sse-server.md)、[WebSocket 实时通信](../../../knowledge/backend/api/websocket.md)。

#### （8）图像识别为什么选传统模型而非多模态大模型，项目用了哪些 LLM？（原题 16–17）

<details data-knowledge-key="rag-image-retrieval">
<summary>（17）图像识别为什么选传统模型而非多模态大模型，项目用了哪些 LLM？（原题 16–17）</summary>
</details>

把比较放在同一输入和验收条件下：任务是固定标签识别、OCR，还是开放的图文解释？看领域精度、延迟、成本、数据治理与维护条件。若专用方案已满足固定标签目标，就需要说明升级多模态方案能解决什么未满足的问题；若任务需要开放语义描述，再用同一数据集比较。这里是选型判断方法，没有断言哪类模型普遍更好。

<details data-knowledge-key="llm-model-selection">
<summary>（18）同一原问的复习入口（仅原题16：传统识别与多模态方案选择）：图像识别为什么选传统模型而非多模态大模型？</summary>
</details>

把比较放在同一输入和验收条件下：任务是固定标签识别、OCR，还是开放的图文解释？看领域精度、延迟、成本、数据治理与维护条件。若专用方案已满足固定标签目标，就需要说明升级多模态方案能解决什么未满足的问题；若任务需要开放语义描述，再用同一数据集比较。这里是选型判断方法，没有断言哪类模型普遍更好。

原帖没披露识别模型、LLM、配置或结果，不替作者填型号。自己的回答应给实际版本与调用时间、测试集和错误样例，区分模型能力与应用经过验证的能力；不能仅以模型宣传能力为项目成绩。

**口述结论：**我按同一任务与指标比较专用模型和多模态模型，因为输入目标变了才可能改变方案；未披露的模型和效果不补写，自己的选择用实际版本和数据说明。

知识导航：[图像、OCR 与多模态检索](../../../knowledge/llm/rag/rag-image-retrieval.md)。

原题对应阅读（仅原题 16 的传统识别与多模态方案选择）：[模型能力评估与选型](../../../knowledge/llm/basics/llm-model-selection.md)。原题 17 所用模型名单不作为此关联依据；本文不声称原项目已完成这些对照实验。

#### （9）Go 并发与其他语言怎样比较，goroutine 的核心原理是什么？（原题 18–19）

<details data-knowledge-key="os-process-thread">
<summary>（19）Go 并发与其他语言怎样比较，goroutine 的核心原理是什么？（原题 18–19）</summary>
</details>

并发表示多个任务推进，CPU 并行表示同一时刻实际执行多个计算任务，两者不能混用。Go 官方 FAQ 将 goroutine 描述为由运行时复用到线程上的执行单元；runtime 的调度说明中，G 是 goroutine，M 是 OS 线程，P 是执行 Go 代码所需的调度资源，P 的数量由 GOMAXPROCS 决定。这是当前实现模型，不能把 P 直接等同于物理 CPU 核。[Go FAQ：Why goroutines](https://go.dev/doc/faq#goroutines)、[Go runtime：Gs, Ms, Ps](https://go.dev/src/runtime/HACKING)

在 r1 的检索和远程模型调用中，等待时可让别的任务推进，但需要限制在途调用、设置超时和取消，避免供应商限额或队列内存成为新瓶颈。比较其他语言时，应明确具体运行时与工作负载，例如同一远程 I/O 任务或同一本地计算，报告实际测量条件；不能宣称 Go 对所有语言都更快。

**口述结论：**goroutine 由 Go 运行时调度到 OS 线程上，等待可以与其他任务重叠；并发能力仍受 CPU、内存和下游配额限制，跨语言比较必须固定工作负载与版本。

知识导航：[进程、线程与协程](../../../knowledge/cs/os/os-process-thread.md)。

#### （10）锁解决什么问题，日常常用什么锁，多机多进程如何选择？（原题 20–22）

<details data-knowledge-key="os-thread-sync">
<summary>（20）锁解决什么问题，日常常用什么锁，多机多进程如何选择？（原题 20–22）</summary>
</details>

锁协调对共享状态的访问，例如并发更新 r1 的预算与状态时，不能让两个执行者各自看到旧余额后都放行。进程内可用互斥锁保护短临界区，读写锁允许多个读者或一个写者；是否有收益还要看实际竞争、持锁时间与读写负载。网络调用不应仅为图省事放进长时间持锁区。日常使用哪种锁只报告真实经验。[Go sync：Mutex 与 RWMutex](https://pkg.go.dev/sync)

<details data-knowledge-key="redis-distributed-lock">
<summary>（21）同一原问的复习入口（Redis 分布式锁：租约、续期与故障边界）：锁解决什么问题，日常常用什么锁，多机多进程如何选择？（原题 20–22）</summary>
</details>

锁协调对共享状态的访问，例如并发更新 r1 的预算与状态时，不能让两个执行者各自看到旧余额后都放行。进程内可用互斥锁保护短临界区，读写锁允许多个读者或一个写者；是否有收益还要看实际竞争、持锁时间与读写负载。网络调用不应仅为图省事放进长时间持锁区。日常使用哪种锁只报告真实经验。[Go sync：Mutex 与 RWMutex](https://pkg.go.dev/sync)

进程内锁不能协调另一台机器。多实例共同修改数据库状态时，可用数据库事务和条件版本更新落实不变量；确实需要独占任务时再讨论协调服务或分布式租约。租约过期后，暂停的旧持有者可能恢复并继续写，续期也不能证明它一直拥有有效权限。关键写可由下游验证单调的 fencing token 或业务版本，拒绝旧持有者的写入；令牌必须由可信的协调机制产生，且下游真正检查才有作用。[Redis 分布式锁：租约与 fencing 建议](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)

**口述结论：**锁保护共享状态的不变量，范围必须覆盖所有写者；多机租约还要应对旧持有者恢复，关键提交不能只相信“我曾经拿到锁”。

知识导航：[锁、信号量与并发同步](../../../knowledge/cs/os/os-thread-sync.md)、[Redis 分布式锁：租约、续期与故障边界](../../../knowledge/backend/database/redis-distributed-lock.md)。

#### （11）MCP、Function Call 与 A2A 怎样区分，接入和手写 MCP 服务如何说明？（原题 23–24）

<details data-knowledge-key="mcp-protocol">
<summary>（22）MCP、Function Call 与 A2A 怎样区分，接入和手写 MCP 服务如何说明？（原题 23–24）</summary>
</details>

先区分三个层次。Function Call/Tool Use 是模型接口表达结构化调用意图的能力；对于应用自定义工具，运行时执行后把结果返回给模型。MCP 是应用与能力服务交换工具、资源等的协议；A2A 是独立 Agent 系统发现能力、交换消息、跟踪任务和结果的协作协议。它们可以组合，不应仅用“谁能处理长任务”区分。[Anthropic 自定义工具执行流程](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)、[A2A 1.0.0：Introduction 与 Relationship to MCP](https://a2a-protocol.org/v1.0.0/specification/)

<details data-knowledge-key="agent-tool-design">
<summary>（23）同一原问的复习入口（Agent 工具契约、Schema 与错误语义）：MCP、Function Call 与 A2A 怎样区分，接入和手写 MCP 服务如何说明？（原题 23–24）</summary>
</details>

先区分三个层次。Function Call/Tool Use 是模型接口表达结构化调用意图的能力；对于应用自定义工具，运行时执行后把结果返回给模型。MCP 是应用与能力服务交换工具、资源等的协议；A2A 是独立 Agent 系统发现能力、交换消息、跟踪任务和结果的协作协议。它们可以组合，不应仅用“谁能处理长任务”区分。[Anthropic 自定义工具执行流程](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)、[A2A 1.0.0：Introduction 与 Relationship to MCP](https://a2a-protocol.org/v1.0.0/specification/)

在本例中，问答应用是 MCP host，它管理与检索服务交互的 MCP client；检索服务是 MCP server，暴露检索工具及其输入合同。模型选择工具后，host 的运行时校验并让 client 发送 tools/call，server 验证访问范围、执行检索并返回结果。**client 不是用户本人，server 也不必是另一个 Agent。**协议没有替应用决定如何使用 LLM 或管理上下文。[MCP 2026-07-28 架构与参与者](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)

本次核验的 MCP 版本为 **2026-07-28**：请求携带版本与能力元数据，server/discover 用于发现服务支持的版本和能力，客户端可先发现再调用。该版本不再要求旧式初始化握手；Streamable HTTP 用 POST 发送消息，响应可为 JSON 或请求范围的 SSE，移除了旧的协议级会话和 GET 流端点。实现必须匹配所用 SDK 与协议版本，不能混抄旧版教程。[MCP Versioning and Compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)、[Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)、[Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

手写服务可从一个只读工具开始：选择对应版本 SDK 与 stdio 或 Streamable HTTP，实现发现、工具清单与调用、参数验证、鉴权、超时和错误语义，再用协议客户端实际验证。包装一个函数不等于服务合同已经完成。原帖未披露接入了哪些 MCP 服务、是否真的手写及其版本，本文不替作者回答经历。

若问答应用把“核对退款规则”委托给独立专业 Agent，才进入 A2A 协作：通过 Agent Card 了解接口、能力与认证，发送消息并按 task ID 跟踪状态和产物；对方内部工具与记忆不必暴露。A2A 任务查询也不能推定消息流重连会补齐所有历史更新。[A2A 1.0.0：Task、Agent Discovery 与 Messages and Artifacts](https://a2a-protocol.org/v1.0.0/specification/)

**口述结论：**模型提出调用，运行时决定执行，MCP client 与 server 交换能力和结果，A2A 则支持独立 Agent 的任务协作；实现要对齐协议版本，接口发现不等于获得数据权限。

知识导航：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)、[Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)。

#### （12）日常 AI 工具与 command/skill 经验，Claude Code 和 OpenClaw 原理怎样讲？（原题 25–28）

<details data-knowledge-key="agent-coding">
<summary>（24）日常 AI 工具与 command/skill 经验，Claude Code 和 OpenClaw 原理怎样讲？（原题 25–28）</summary>
</details>

先给自己实际用过的产品、版本、任务与一次可复查结果，不把“听过工具名”说成使用经验。command/skill 可以封装重复的指令和流程，但权限、执行与验收仍由运行时及使用者的约束决定。当前 Claude Code 文档说明自定义 commands 已合并到 skills，已有命令文件继续工作；SKILL.md 提供指令，可按相关性加载或用命令调用。这是滚动产品文档的现状，不回填作者当时的配置。[Claude Code Skills](https://code.claude.com/docs/en/skills)

<details data-knowledge-key="agent-skill-design">
<summary>（25）同一原问的复习入口（Agent Skill：渐进式披露、热插拔与版本治理）：日常 AI 工具与 command/skill 经验，Claude Code 和 OpenClaw 原理怎样讲？（原题 25–28）</summary>
</details>

先给自己实际用过的产品、版本、任务与一次可复查结果，不把“听过工具名”说成使用经验。command/skill 可以封装重复的指令和流程，但权限、执行与验收仍由运行时及使用者的约束决定。当前 Claude Code 文档说明自定义 commands 已合并到 skills，已有命令文件继续工作；SKILL.md 提供指令，可按相关性加载或用命令调用。这是滚动产品文档的现状，不回填作者当时的配置。[Claude Code Skills](https://code.claude.com/docs/en/skills)

<details data-knowledge-key="build-agent-framework">
<summary>（26）同一原问的复习入口（从零构建 Agent 运行时）：日常 AI 工具与 command/skill 经验，Claude Code 和 OpenClaw 原理怎样讲？（原题 25–28）</summary>
</details>

先给自己实际用过的产品、版本、任务与一次可复查结果，不把“听过工具名”说成使用经验。command/skill 可以封装重复的指令和流程，但权限、执行与验收仍由运行时及使用者的约束决定。当前 Claude Code 文档说明自定义 commands 已合并到 skills，已有命令文件继续工作；SKILL.md 提供指令，可按相关性加载或用命令调用。这是滚动产品文档的现状，不回填作者当时的配置。[Claude Code Skills](https://code.claude.com/docs/en/skills)

Claude Code 官方将运行过程描述为收集上下文、采取行动、验证结果的循环，模型负责决策，工具执行读写与命令，用户的权限规则限制可执行动作。可沿“查文件→修改→验证”解释已公开机制，但不能据此还原所有内部实现或声称每次运行都成功。[Claude Code How it works](https://code.claude.com/docs/en/how-claude-code-works)

OpenClaw 官方架构描述一个持续运行的 Gateway 管理消息渠道，控制端与节点通过 WebSocket 连接；Agent loop 文档描述会话解析、上下文组装、模型调用、工具执行、流式事件与持久状态。Gateway 的连接与路由职责不能混成模型的思考或工具授权职责。它与 Claude Code 的入口、状态和产品目标应按实际版本比较，而不是凭演示称为同一实现。[OpenClaw Gateway architecture](https://docs.openclaw.ai/concepts/architecture)、[OpenClaw Agent loop](https://docs.openclaw.ai/concepts/agent-loop)

**口述结论：**我会用实际任务解释工具、技能、权限和状态如何配合；Claude Code 与 OpenClaw 只能按公开文档和使用证据分析，不能把公开架构说明当成全部内部细节。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)、[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)、[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)。

## 教学补充：改变条件后的模拟追问

以下不是原帖提问。

1. **单文件只读问答改为多租户多文件，并允许模型删除资料，哪些边界必须重做？**要点：索引版本与删除传播、服务端身份绑定、实际调用鉴权和写操作授权都要落实；不能只把 Schema 加一个 delete 字段。对应第（1）–（2）、（6）、（11）题。
2. **客户端在文本流第 20 个事件断线，后台恰好预算耗尽，重连能直接显示成功吗？**要点：先查询 r1 的权威状态，再从保留游标补展示；区分部分文本、未完成原因与最终结果。EventSource 重连不自动提供事件日志；前端断线与 MCP 请求取消也不是同一合同。对应第（5）、（7）、（11）题。
3. **固定退款资料检索改成跨组织委托专业 Agent，是否只新增一个 MCP 工具就够？**要点：若只调用一个受控能力，MCP 工具可能足够；若对方独立维护长任务、需追踪协作状态与产物，可评估 A2A。无论哪种，能力发现不等于授权，仍需接口版本与恢复合同。对应第（4）–（6）、（11）题。

## 原帖记录边界

原始 28 条问题全部映射到上述 12 组，未把模拟追问列为原题。只能确认帖子发表于 2026-03-30；实际面试日、识别与 LLM 型号、工具清单、检索耗时、步数和效果配置均未披露。本文无可运行代码；示例与恢复过程为教学设计，未在完整环境执行，未提供实测成绩。

## 参考资料与版本

本文实际使用的官方章节已在相应论断后链接。MCP 按 2026-07-28，A2A 按 1.0.0，ReAct 按 2022 原论文，WebSocket 按 RFC 6455；其余为滚动文档，核验于 2026-10-02。当前核验版本不代表原作者当时使用版本，也不代表已验证某产品的全部内部实现。

- [Spring AI ETL](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)、[Elasticsearch 文档权限](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level)、[候选重排](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/text-similarity-reranker-retriever)、[排序评估](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-rank-eval)。
- [ReAct 原论文](https://arxiv.org/abs/2210.03629)、[WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)、[RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html)、[Go FAQ](https://go.dev/doc/faq)、[runtime 调度](https://go.dev/src/runtime/HACKING)、[sync](https://pkg.go.dev/sync)、[Redis 分布式锁](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)。
- [工具调用执行](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)、[MCP 架构](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)、[工具合同](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)、[版本兼容](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)、[发现](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)、[Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)、[A2A 1.0.0](https://a2a-protocol.org/v1.0.0/specification/)。
- [Claude Code 循环](https://code.claude.com/docs/en/how-claude-code-works)、[Skills](https://code.claude.com/docs/en/skills)、[OpenClaw Gateway](https://docs.openclaw.ai/concepts/architecture)、[Agent loop](https://docs.openclaw.ai/concepts/agent-loop)。
