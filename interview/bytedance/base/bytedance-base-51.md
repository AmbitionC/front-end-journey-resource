以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

产品与框架能力须核对实际版本，追问不证明候选人已实现相关功能。

<details data-knowledge-key="function-calling">
<summary>（1）AI agent 与function call有什么区别。</summary>
</details>

Function Calling 是模型提出结构化工具调用的一种接口能力；Agent 还包含状态、循环、权限与终止等执行系统。一次工具调用不等于完整自主智能体。

<details data-knowledge-key="agent-coding">
<summary>（2）AI Coding用过什么。</summary>
</details>

列出实际使用的工具、具体任务和验证方式，区分建议生成与获准执行。工具名与模型版本可能变动，应以当时真实环境为准。

<details data-knowledge-key="agent-coding">
<summary>（3）AI Coding和AI Agent如何一起使用，即如何用AI Coding开发一个AI Agent</summary>
</details>

先定义 Agent 的输入输出、工具合同和测试，再用 AI Coding 实现小模块并逐段审查。生成的工具调用、权限和状态恢复代码必须验证，不能因为能运行就宣称任务可靠。

<details data-knowledge-key="build-agent-framework">
<summary>（4）有没有试过用langchain和langgraph做AI Agent的开发？有什么感受？</summary>
</details>

可用 LangChain 集成模型与工具，用 LangGraph 表达有状态编排，选择取决于任务复杂度。真实感受要对应实现与故障案例，没有用过时应明确只了解机制。

<details data-binding-status="pending_semantic_verification">
<summary>（5）对云熟不熟？有哪些产品？相关的实践有哪些？</summary>
<p>关联知识点待核实。</p>
</details>

按实际经验说明计算、存储、网络和托管服务如何分工，并交代版本、访问边界与可观测性。云产品清单不等于部署实践，不能补造上线结果。

<details data-knowledge-key="llm-open-source-deployment">
<summary>（6）有哪些推理引擎？大模型推理有哪些指标？</summary>
</details>

可比较 vLLM、TensorRT-LLM、llama.cpp 等推理引擎，先核对版本和硬件。选择看模型支持、硬件、批处理与并行能力；指标包括首 token 时延、每 token 时延、吞吐、并发和错误率。比较需固定工作负载，不能只看单条回答速度。

<details data-knowledge-key="llm-token-context">
<summary>（7）为什么要用PD分离？业界方案是怎么样的？mooncake的KV Cache是否有外挂？</summary>
</details>

Prefill 与 Decode 的资源需求不同，分离可独立调度但带来 KV 传输开销。Mooncake 是围绕分离式推理与 KV Cache 的方案；是否外部存储、介质和拓扑须看具体版本，不能笼统承诺外挂即提速。

<details data-knowledge-key="agent-role-landscape">
<summary>（8）你如何看待AI Agent的发展现状？未来又是什么看法？</summary>
</details>

可讨论已验证的任务价值、工具可靠性、成本与权限等工程约束，再给个人判断。未来方向是推测，不能把厂商宣传或技术趋势当确定事实。

<details data-knowledge-key="agent-deterministic-workflow">
<summary>（9）langchain的主要在这个chain 怎么理解这个chain</summary>
</details>

chain 可理解为把有明确输入输出的步骤组合起来，前一步产物成为后一步输入。只有需要状态、分支或恢复时再增加复杂编排，线性链本身不等于自主规划。

<details data-knowledge-key="prompt-basics">
<summary>（10）提示词怎么设计的 如何设计</summary>
</details>

明确任务、证据范围、约束和输出形式，并用代表性样例验证。提示版本与模型配置一起记录，错误时先定位原因再改，不堆泛化口号。

<details data-knowledge-key="rag-pipeline">
<summary>（11）rag怎么构建的</summary>
</details>

离线解析、分块、Embedding 与建索引，在线改写、召回、排序、组装证据和生成；每段保留权限与来源。先测召回与回答质量，不能把检索到片段等同于正确回答。

<details data-knowledge-key="llm-training-overview">
<summary>（12）模型微调qwen2.5-3B 用llamafacotry 怎么做的</summary>
</details>

先核对 LLaMA-Factory 对该模型版本的支持，准备获准数据、划分训练与评测集，确定 SFT 等训练目标，再选择全量更新或 LoRA 等参数更新方式并验证产物。显存和数据质量决定可行性，不能凭模型名给固定训练参数。

<details data-knowledge-key="mcp-protocol">
<summary>（13）mcp mcp是什么</summary>
</details>

MCP 定义宿主、客户端与服务器之间发现和调用工具、读取资源等交互机制。模型不直接执行协议，宿主负责把发现结果提供给模型并实施授权与调用。

<details data-knowledge-key="agent-tool-timeout">
<summary>（14）工具调用失败 怎么办</summary>
</details>

区分输入错、权限错、瞬态故障和结果未知，分别修正、拒绝、有限重试或查询。工具返回要稳定结构化，不能把无限重试当恢复能力。

<details data-knowledge-key="prompt-structured-output">
<summary>（15）想要按照结构输出怎么办？</summary>
</details>

优先使用供应商支持的结构化输出约束，并在宿主校验 Schema 与业务规则。解析失败有明确错误或有限修复，格式合法也不代表字段内容真实。

<details data-knowledge-key="multi-agent">
<summary>（16）多agent协作 如何做 设置工作流</summary>
</details>

先划分角色与输入、确定共享状态所有者和结果归并，再用工作流表达依赖及并行分支。限制每个角色权限和预算，处理失败与冲突，不因角色多就自动质量更高。

<details data-knowledge-key="agent-project-portfolio">
<summary>（17）介绍一下你的项目</summary>
</details>

说明需求、链路、个人贡献和验证结果，挑一处设计取舍深入讲。作者项目细节不完整，教学短答不替其补造架构。

<details data-knowledge-key="agent-deterministic-workflow">
<summary>（18）你提到的coze，coze有两版，一个是拖拽式的编排，新的一版是直接使用agent？，你使用的是哪一种？你是怎么设计节点的？</summary>
</details>

先确认使用的 Coze 产品、版本与实际功能，再说明节点输入输出和状态。原帖对版本的说法未经核实，不能据此概括所有 Coze 产品形态。

<details data-knowledge-key="agent-tool-design">
<summary>（19）你编写了哪些MCP工具，介绍一下</summary>
</details>

展示实际工具名称、输入 Schema、鉴权、输出和一次失败处理。只写接口描述还不够，宿主需要校验参数和限制可执行动作。

<details data-knowledge-key="context-engineering">
<summary>（20）上下文管理是怎么做的，如何进行记忆</summary>
</details>

按任务预算组合指令、近期消息、检索证据与必要记忆，记录来源和时间。长期记忆要有写入、修订与删除规则，压缩后保留可回查原始材料。
