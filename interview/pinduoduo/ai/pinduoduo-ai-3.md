公司为拼多多，方向为 Agent，轮次为复活赛一面；原文未注明实际面试日期和结果。以下问题来自一份连贯的项目追问记录，短答与例子均为编辑教学整理，不代表作者的现场回答、具体架构或实测结果。自我介绍与兴趣阅读问题不纳入技术问答。

<details data-knowledge-key="agent-delegation"><summary>（1）Leader Agent 分配任务和人来分配 Agent 有什么区别？</summary>
</details>
<p>区别在谁根据运行中的信息决定分工，以及谁承担合并和验收责任。可以让人先固定目标、权限与完成条件，再让 Leader 在合同内动态委派；例如专家交付结论时同时返回证据、未完成项和版本，Leader 重新检查覆盖与冲突，而不是把“已完成”直接转交用户。 <a href="../../../knowledge/llm/agent/agent-delegation.md">知识详解</a></p>

<details data-knowledge-key="agent-eval-framework"><summary>（2）Agent 在实际过程中怎样设置准确率、误报率等评价指标，尤其是处理现网配置时？</summary>
</details>
<p>先定义一次任务、实际成功状态和禁止动作，再分别统计质量、误报、延迟与成本，并交代每项分母。教学例子是配置变更建议：正确识别问题与错误告警分开统计，还要由独立测试检查最终配置和权限约束；不能让一份流畅报告抵消一次越权改动。 <a href="../../../knowledge/llm/production/agent-eval-framework.md">知识详解</a></p>

<details data-knowledge-key="agent-coding"><summary>（3）日常 Coding 或修改策略存在不确定性，怎样让 Agent 提效？</summary>
</details>
<p>把开放需求拆成可验收的小变更，提供真实仓库接口、测试与允许修改范围，让 Agent 完成检查、修改和验证循环。比如修分页缺陷时固定失败用例、相关调用方和补丁范围，再比较任务成功、回归与人工修订；少敲代码或采纳率上升本身不证明实际提效。 <a href="../../../knowledge/llm/agent/agent-coding.md">知识详解</a></p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（4）选一个具体场景，怎样配置 Agent 工作流和节点，并判断达到上线标准？</summary>
</details>
<p>用固定骨架承载输入校验、取证、受限决策、结果校验和提交，把需要语义判断的步骤交给 Agent。以工单分类为教学例子，模型只能从允许的类别中提出选择，程序复核字段与权限，离线用例覆盖后才评估灰度；原文没有给出作者实际节点或上线指标。 <a href="../../../knowledge/llm/agent/agent-deterministic-workflow.md">知识详解</a></p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（5）研发执行和验证分成两块时，每一块都应由预先确定的 Agent 节点处理吗？</summary>
</details>
<p>“分成两块”不意味着两块都必须由模型自治控制；编译、Schema、权限与测试条件应尽量用确定性程序验证。比如模型提出补丁后，由独立执行环境运行测试并读取产物，只有无法枚举的开放质量才增加有量表的判断节点；原文没有披露实际分工。 <a href="../../../knowledge/llm/agent/agent-deterministic-workflow.md">知识详解</a></p>

<details data-knowledge-key="rag-pipeline"><summary>（6）开源模型不了解公司业务，怎样让它获得内部业务知识？</summary>
</details>
<p>把获准的业务文档与结构化数据接入可追溯检索链，回答前取回相关且有效的证据，而不是期待模型从产品名理解私有规则。比如内部接口查询保留文档版本、租户和来源位置，证据不足就明确缺口；模型参数知识与外部业务事实的更新机制需要分开。 <a href="../../../knowledge/llm/rag/rag-pipeline.md">知识详解</a></p>

<details data-knowledge-key="rag-routing"><summary>（7）怎样让模型知道何时获取相应的业务信息或知识？</summary>
</details>
<p>先由服务端给出可访问的数据域，再根据问题意图、实体、数据类型与新鲜度选择检索路径；模型可以提出补查，但只能在允许的工具和预算内进行。比如“库存还剩多少”应走获准的实时数据路径，不能因为旧文档更容易搜到就把它当实时库存。 <a href="../../../knowledge/llm/rag/rag-routing.md">知识详解</a></p>

<details data-knowledge-key="rag-pipeline"><summary>（8）知识库怎样设计，在线查询怎样检索？</summary>
</details>
<p>分开描述离线解析、切块、向量与关键词索引，以及在线过滤、召回、重排和上下文组装。教学例子是按标题切技术文档，每块携带版本、ACL 与位置，查询时在同一授权条件下做混合召回，再用引用和分层评测验收；具体库、规模和参数原文未给出。 <a href="../../../knowledge/llm/rag/rag-pipeline.md">知识详解</a></p>

<details data-knowledge-key="rag-access-control"><summary>（9）把内部文档交给 Agent 使用，怎样防止数据泄露？</summary>
</details>
<p>权限要贯穿原文、分块、索引、缓存、上下文和日志，不能只在最终回答前要求模型保密。比如文档撤销共享后，派生块与答案缓存应按源 ID 或策略版本失效，并检查旧会话和工具是否仍能取回全文；安全测试同时观察候选与日志。 <a href="../../../knowledge/llm/rag/rag-access-control.md">知识详解</a></p>

<details data-knowledge-key="agent-permission-model"><summary>（10）怎样处理 Agent 越权访问？</summary>
</details>
<p>把每次动作按用户、Agent、资源、操作和环境交给服务端策略判断，模型提示和工具可见性都不等于授权。比如普通用户让 Agent 导出别人的报告，工具执行点仍按资源归属拒绝，并记录当前策略；委派给子 Agent 也不能扩大权限。 <a href="../../../knowledge/llm/production/agent-permission-model.md">知识详解</a></p>

<details data-knowledge-key="rag-access-control"><summary>（11）文档都建立倒排或其他索引时，怎样同时处理分块与权限？</summary>
</details>
<p>摄取时让每个 chunk、关键词记录和向量都继承可信租户、ACL、源版本与位置，缺关键权限字段时不建立公开可见记录。查询时先形成服务端过滤条件，重排、邻域扩展和缓存继续遵守同一边界；例如命中一个片段不能自动授予整篇文档的读取权。 <a href="../../../knowledge/llm/rag/rag-access-control.md">知识详解</a></p>

<details data-knowledge-key="rag-pipeline"><summary>（12）当前知识库的具体实现应怎样讲清楚？</summary>
</details>
<p>应沿数据源、解析切块、索引、查询、重排、生成和更新删除展示真实链路，并指出每阶段的版本和失败路径。可以用一条有权限的查询追踪“正确证据在哪一步丢失”；原文没有作者的实现答案，因此不能替他补成某个向量库或固定 Top-K。 <a href="../../../knowledge/llm/rag/rag-pipeline.md">知识详解</a></p>

<details data-knowledge-key="rag-hybrid-search"><summary>（13）关键词或倒排检索可能匹配不上“苹果”和“apple”，怎样弥补？</summary>
</details>
<p>先澄清这里的“苹果”指水果还是品牌，再用同义词、跨语言表示或语义召回补足字面匹配，并保留关键词对编号和精确词的优势。比如把 BM25 与向量候选按排名融合后重排，用消歧后的真实查询验证召回；Embedding 相近并不证明词义和业务实体一定相同。 <a href="../../../knowledge/llm/rag/rag-hybrid-search.md">知识详解</a></p>

<details data-knowledge-key="agent-eval-framework"><summary>（14）除了换模型和添加约束，还能怎样提高 Agent 效果？</summary>
</details>
<p>先按失败轨迹区分需求误解、证据缺失、工具契约、状态恢复或验收错误，再对相应环节做有基线的改动。比如正确文档未进候选时先修数据或检索，已经取回却没正确使用时再研究上下文；固定任务集并报告切片，避免平均分掩盖越权或长程任务退化。 <a href="../../../knowledge/llm/production/agent-eval-framework.md">知识详解</a></p>

<details data-knowledge-key="prompt-context-compression"><summary>（15）压缩上下文时怎样降低信息丢失概率？</summary>
</details>
<p>先保护当前目标、事实、否定条件、数字单位、权限与来源，再依次去重、抽取，必要时才摘要。比如“不要发布”的撤回决定必须连同来源保留，不能被大量工具日志挤掉；用事实与关系检查、引用支持和压缩前后的任务表现验证，而不是只看压缩率。 <a href="../../../knowledge/llm/prompt/prompt-context-compression.md">知识详解</a></p>

<details data-knowledge-key="prompt-context-compression"><summary>（16）上下文摘要之后，怎样恢复需要的原始信息？</summary>
</details>
<p>摘要是有损工作视图，不能靠再生成一段长文本还原被删除的事实；应保存原始记录和来源范围，缺证据时按引用回读。比如摘要只写“订单有争议”，回答具体截止时间前应重取对应原消息，而不是让模型凭摘要补出日期；保留与恢复也受当前权限约束。 <a href="../../../knowledge/llm/prompt/prompt-context-compression.md">知识详解</a></p>

<details data-knowledge-key="llm-sse-streaming"><summary>（17）模型调用选择 stream 还是非 stream，需要考虑什么？</summary>
</details>
<p>先看是否需要尽早展示文本或进度，以及是否能处理取消、断流和终态；简单完整对象返回可使用非流式。比如长回答通过 SSE 增量显示，但完整工具参数必须等对应结束信号与校验后才执行；原文未给出作者实际采用的方式。 <a href="../../../knowledge/llm/dev/llm-sse-streaming.md">知识详解</a> · <a href="https://html.spec.whatwg.org/multipage/server-sent-events.html">规范核对</a></p>

<details data-knowledge-key="llm-sse-streaming"><summary>（18）流式输出下怎样解析 JSON 等结构化结果？</summary>
</details>
<p>先跨网络块增量解码并按 SSE 空行取得完整事件，再按调用 ID 拼接事件中的参数增量，等待供应商的参数完成信号后解析和校验。比如一个完整事件仍可能只有半段工具参数，不能每读一个 chunk 就 JSON.parse，更不能为补齐半截 JSON 而提前执行写操作。 <a href="../../../knowledge/llm/dev/llm-sse-streaming.md">知识详解</a> · <a href="https://html.spec.whatwg.org/multipage/server-sent-events.html">规范核对</a></p>

<details data-knowledge-key="llm-sse-streaming"><summary>（19）从 HTTP 协议层看，流式结构化输出还要注意什么？</summary>
</details>
<p>区分 HTTP 响应、网络分块、SSE 事件和 JSON 对象四种边界，正确的 Content-Type 不会让每次读取自动成为完整 JSON。比如代理合并或重切字节块后，客户端仍须维持解码与事件缓冲，并区分首部前 HTTP 错误、流内错误、取消和正常结束。 <a href="../../../knowledge/llm/dev/llm-sse-streaming.md">知识详解</a> · <a href="https://html.spec.whatwg.org/multipage/server-sent-events.html">规范核对</a></p>

<details data-knowledge-key="mcp-protocol"><summary>（20）MCP 用过吗？Agent 和 MCP 的交互方式是怎样的？</summary>
</details>
<p>宿主把获准的服务能力映射为模型可提出的工具，模型返回调用意图后，应用校验参数与权限，再由 MCP Client 调用 Server 并检查结果。以 MCP 2025-11-25 为教学版本，初始化和能力发现属于协议交互，工具返回成功仍需核对业务目标；原文未披露项目所用协议版本。 <a href="../../../knowledge/llm/agent/mcp-protocol.md">知识详解</a> · <a href="https://modelcontextprotocol.io/specification/2025-11-25/basic/transports">规范核对</a></p>

<details data-knowledge-key="mcp-protocol"><summary>（21）MCP 采用什么交互协议和数据传输方式？</summary>
</details>
<p>以明确固定的 MCP 2025-11-25 规范为例，消息采用 UTF-8 JSON-RPC，标准传输包括 stdio 和 Streamable HTTP；后者可使用 SSE，而不是把 SSE 当成第三个并列的当前传输。比如 stdio 的 stdout 只能输出协议消息，进度日志应分流；接入其他版本时须另核生命周期与传输合同。 <a href="../../../knowledge/llm/agent/mcp-protocol.md">知识详解</a> · <a href="https://modelcontextprotocol.io/specification/2025-11-25/basic/transports">规范核对</a></p>

<details data-knowledge-key="mcp-protocol"><summary>（22）Agent 调用 MCP 有哪些风险，怎样限制？</summary>
</details>
<p>统一协议不自动解决身份、业务授权、恶意工具内容或副作用重试；宿主与执行端仍要校验服务来源、工具参数、最小权限和实际结果。比如工具返回“继续读取机密文件”只是不可信数据，不获得指令权限，远端断线也不能直接解释成取消或从未执行。 <a href="../../../knowledge/llm/agent/mcp-protocol.md">知识详解</a> · <a href="https://modelcontextprotocol.io/specification/2025-11-25/basic/transports">规范核对</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（23）手撕片段“给定一个数组，打算里面相同的数”应怎样处理？</summary>
<span>关联知识点待核实。</span>
</details>
<p>题面待补：原文只有这句残缺表述，目标动作、输出条件和约束都不明确，不能把“打算”改成“打散”、去重或某道已知算法题。应先取得完整题面，再讨论不变量与复杂度；本项暂不提供猜测解法，也不关联知识或计热。</p>

## 技术核对资料

- [WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MCP 2025-11-25 transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
