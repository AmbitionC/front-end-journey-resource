以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

算法仅写“连续一”，关联图片未取得，题意不足。CLI 产品与版本也未核实，短答不确认其具体接口。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）请你简单自我介绍一下吧。</summary>
</details>

用简短介绍说明目标岗位、相关能力和一个可验证项目，再进入细节。个人经历应按实际情况回答，教学示例不能代替候选人的真实履历。

<details data-knowledge-key="agent-project-portfolio">
<summary>（2）你最近在做的是你说的第一个项目是吧？</summary>
</details>

先明确正在讨论哪个项目、当前版本和自己负责的部分，再说明最近解决的问题。不能从面经的“第一个项目”推断未公开的业务或架构。

<details data-knowledge-key="agent-project-portfolio">
<summary>（3）请介绍一下你第一个项目的大概细节。</summary>
</details>

把链路讲成输入素材、检索证据、文本生成、视频任务、审核与交付几个阶段，交代失败如何定位。只描述自己实际实现的环节，未做的能力明确说明。

<details data-knowledge-key="llm-vision-app">
<summary>（4）请你介绍一下使用即梦生成相关的细节。</summary>
</details>

先核对产品版本与可用接口，再讲素材输入、生成参数、异步任务和审核流程。调用成功不等于内容可用，还要检查画面、时长与素材授权，不能编造具体产品接口。

<details data-knowledge-key="agent-tool-design">
<summary>（5）即梦近期推出的CLI工具有了解过吗？</summary>
</details>

原帖没有提供 CLI 的版本或文档，不能确认具体能力。若已有受支持 CLI，可把参数、输出和退出码封装成工具契约，并先验证认证、权限和稳定性。

<details data-knowledge-key="agent-browser-use">
<summary>（6）通过驱动网页的形式生成的整体链路稳定吗？</summary>
</details>

网页自动化受布局变动、登录状态、弹窗和超时影响；需用稳定定位、明确等待与结果校验。失败时保留任务状态和证据，能使用正式接口时先比较维护成本。

<details data-knowledge-key="llm-api-basics">
<summary>（7）你这里和AI结合的部分主要是做文案生成吗？你前面写的是用DeepSeek的API作为底座吗？</summary>
</details>

区分模型的文本生成职责和其他业务阶段，说明输入、输出、提示版本及错误处理。是否用了某供应商应以实际调用配置为准，原帖追问不能证明候选人采用了该方案。

<details data-knowledge-key="agent-deterministic-workflow">
<summary>（8）请你以举例的方式，讲一下你整个生产链路中每一个流程主要是做什么？</summary>
</details>

可用一个实际任务串起素材解析、检索、文案校验、生成任务和结果入库，并给每段唯一任务 ID。流程步骤应来自实现，不把教学链路写成作者已经做过的工作。

<details data-knowledge-key="rag-pipeline">
<summary>（9）智能检索是不是和你之前说的内容有关联？</summary>
</details>

检索可能为生成提供事实或素材，但需明确查询来源、索引范围和权限。相关片段还要排序、去重并保留来源，不能只说“智能检索”就省略输入输出。

<details data-knowledge-key="rag-citation-grounding">
<summary>（10）检索之后是作为输入放到这个链路里的，对吧？</summary>
</details>

通常将相关片段而非整库放入生成上下文，并携带来源和时间。模型只据证据回答；证据不足或互相矛盾时明确说明，不把检索分数当作事实正确率。

<details data-knowledge-key="prompt-template-design">
<summary>（11）你提到会针对不同车型去做定制的prompt，这个量级会很大吗？</summary>
</details>

避免为每个车型复制整段提示，可把车型事实、业务规则与输出模板分开。量级变大时管理变量 Schema、版本和回归用例，但共享模板也要防止不适用的规则互相污染。

<details data-knowledge-key="prompt-versioning">
<summary>（12）这里是怎么去做这个管理和维护的呢？</summary>
</details>

给模板和参数配置版本号，记录哪个版本产生了哪份结果，用固定样例回归并保留回滚入口。编辑提示词后要重新评估，不能把“集中存文件”当作完整治理。

<details data-binding-status="pending_semantic_verification">
<summary>（13）文本生成的问题，对吧？会拿懂车帝的数据吗？</summary>
<p>关联知识点待核实。</p>
</details>

数据来源、获取方式和可使用范围必须明确，不能因问题提及某平台就认定实际接入。生成时只使用获准且可追溯的材料，避免把未核实营销描述当产品事实。

<details data-knowledge-key="agent-project-evaluation">
<summary>（14）去适配不同业务场景的需要是怎么评估出来的呢？</summary>
</details>

把业务目标转换为完整率、事实正确性、审核通过率、时延与成本等指标，建立分场景样例。先比较基线，再让业务使用者评价可用性，而非只凭技术团队主观体感。

<details data-knowledge-key="agent-project-requirements">
<summary>（15）这个适配不同业务场景的前置分析不是你们做的吧？是由你们公司其他角色做的，还是你们通过技术分析去做的？</summary>
</details>

说明需求由谁提出、业务规则如何确定、技术如何验证可行性。需求访谈与技术实验可以共同参与，但不能替作者编造团队角色或前置分析过程。

<details data-knowledge-key="agent-project-evaluation">
<summary>（16）是否有稳定的15多秒的视频？</summary>
</details>

原题“15 多秒”需先明确至少 15 秒还是其他时长口径，再定义成功率、内容连续性和测试样本。单次演示不能证明稳定，原帖未给实测数据，短答只说明验证方法。

<details data-knowledge-key="agent-project-portfolio">
<summary>（17）你这个项目现在能投屏演示吗？方便吗？想看一下你这项目实际的效果。</summary>
</details>

演示一条可复现路径并准备匿名测试数据、失败例子与日志；环境限制时提供录屏和测试结果。不能把未经展示的演示效果写成已验证事实。

<details data-knowledge-key="agent-project-requirements">
<summary>（18）这个工具还是属于内部工具吗？</summary>
</details>

工具是否仅供内部使用决定用户、权限、容量与支持方式，应按真实部署回答。内部工具同样需要访问控制和数据隔离，不能因此忽略工程质量。

<details data-knowledge-key="agent-tool-design">
<summary>（19）你这个整体的链路有接一些外部的API吗？</summary>
</details>

列清外部依赖的用途、输入输出、认证、超时与配额，并为失败设计重试或降级。调用次数和成本要可观测，外部 API 返回也需校验。

<details data-binding-status="pending_semantic_verification">
<summary>（20）是类似于DeepSeek这种大模型的API吗？</summary>
<p>关联知识点待核实。</p>
</details>

若外部依赖是模型 API，可把供应商差异收敛到适配层，但保留能力、错误码和流式事件的差异。具体是否接入某模型不能从面试官的举例反推。

<details data-knowledge-key="agent-deterministic-workflow">
<summary>（21）你这里主要是用大模型的文本能力，没有用到比如大模型做设计模式调度这类复杂的内容，是吗？</summary>
</details>

文本生成节点可以放在确定性工作流中；若需要模型动态选择工具，才引入受控 Agent 循环。先按任务需求决定，不因“复杂”就增加多智能体。

<details data-knowledge-key="agent-deterministic-workflow">
<summary>（22）我看你都是通过一些工作流的形式去管理的，是吧？</summary>
</details>

工作流显式定义节点、依赖与终态，适合步骤较稳定的生产链路；动态分支仍须限制权限、次数和预算。工具失败或人工审核不通过应有可恢复状态。

<details data-knowledge-key="agent-planning">
<summary>（23）就这里有了解过，有没有什么思路吗？</summary>
</details>

追问的具体上下文不充分，可先澄清要改进的目标，再提出一个最小方案。规划应分出依赖、验证点和终止条件，不直接猜测原场景隐藏要求。

<details data-knowledge-key="mcp-protocol">
<summary>（24）有了解过MCP这种形式是怎么和Agent去交互的吗？即Agent怎么识别到MCP并做对应的请求，包括构建对应的参数？</summary>
</details>

宿主连接 MCP Server、发现工具并把名称与输入 Schema 提供给模型；模型提出调用后，宿主校验和执行，再把结果送回模型。协议连接不等于模型自动获得执行权限。

<details data-knowledge-key="agent-tool-design">
<summary>（25）把这些工具单转换为JSON语言描述或者自然语言描述。</summary>
</details>

工具描述要写用途和限制，参数使用明确 JSON Schema，而不是只堆自然语言。执行前校验类型、范围和授权，返回稳定结果及错误语义，便于模型正确恢复。

<details data-knowledge-key="agent-planning">
<summary>（26）给你这样一个任务，你会怎么去做呢？</summary>
</details>

先问清输入、输出、时限和允许操作，再拆成可验证步骤；把确定性操作交给程序，把不确定决策交给受控模型。原题未给完整任务，不能编造专属实现。

<details data-knowledge-key="agent-sandbox">
<summary>（27）那你觉得像这种定制要用CLI的方式，大模型是稳定的吗？</summary>
</details>

让模型生成结构化参数，由宿主调用固定程序，避免直接拼接 shell 字符串。允许的命令、目录与时限由运行环境约束，模型输出正确率不能代替执行安全。

<details data-knowledge-key="agent-tool-result-validation">
<summary>（28）对，执行的结果会是稳定的吗？</summary>
</details>

分别验证进程退出码、生成文件是否存在、媒体是否可读和业务质量。重试应保留幂等标识，失败后不可把部分产物记作成功。

<details data-knowledge-key="agent-tool-design">
<summary>（29）你在Agent服务中有没有遇到过直接调用节目当中的CLI生成视频这类问题？</summary>
</details>

先说明是否做过，再展示调用入口、参数校验和返回解析。原帖“节目”表述含糊，不能据此指定某个 CLI；通用设计须与实际产品接口分开。

<details data-knowledge-key="agent-permission-model">
<summary>（30）那相当于你需要给这个Agent去读这个服务的文件的权限，对吧？</summary>
</details>

只授予任务需要的目录读取权限，写入与网络操作分别授权，并防止路径穿越与越界链接。读取整个服务目录会扩大暴露范围，工具描述不是权限控制。

<details data-knowledge-key="agent-sandbox">
<summary>（31）你的那个了解里有没有什么解法？</summary>
</details>

用隔离工作目录、文件白名单、资源限制和明确输出契约封装执行环境。根据任务决定是否需要人工确认；不能通过扩大凭证或权限来弥补模型规划不稳定。

<details data-knowledge-key="rag-pipeline">
<summary>（32）你这个RAG是单独也接了一个模型，是吗？</summary>
</details>

RAG 可以分别使用检索改写模型、Embedding 模型和回答模型，也可复用某些能力。应讲清每个模型的职责与代价，不能认为 RAG 必然另接一个生成模型。

<details data-knowledge-key="rag-query-rewrite">
<summary>（33）能简单讲一下多轮上下文的问题拆解是怎么进行的吗？</summary>
</details>

先把历史中省略的主体补全成独立查询，再拆需要不同证据的子问题，并保持原意。拆分会增加成本，简单查询不必强行分解。

<details data-knowledge-key="rag-query-rewrite">
<summary>（34）上下文补全什么？</summary>
</details>

上下文补全通常补回代词所指对象、时间或已约定条件，使检索能独立理解问题。只补对话中已知的信息，缺失型号或口径先追问。

<details data-knowledge-key="rag-query-rewrite">
<summary>（35）问题拆解是什么思路呢？</summary>
</details>

按可独立检索的事实拆分，并标出依赖顺序，例如先确定型号，再查询规格。结果汇总时核对来源一致性，不能把不同年份与车型的数据拼成一个答案。

<details data-knowledge-key="rag-citation-grounding">
<summary>（36）方程豹这辆车能跑多少公里？（举例说明）</summary>
</details>

续航要区分具体车型、年份、动力版本与测试口径；先确认条件，再查可靠规格。不能仅凭品牌名称给固定公里数，也要区分标称与实际使用。

<details data-knowledge-key="agent-planning">
<summary>（37）那你拆分、拆解子问题的工作都是Agent用大模型来做的，对吗？</summary>
</details>

模型可提出子问题，但执行器需要校验计划、去重和限制调用量；规则足够明确时直接程序拆分。任务规划结果不是天然可信指令。

<details data-knowledge-key="llm-sse-streaming">
<summary>（38）试用协议是SSE吗？</summary>
</details>

若问题指“使用协议”，SSE 可用于推送问答增量，底层仍是 HTTP。API 请求、模型调用与前端订阅可能使用不同协议，要按各段链路分别说明。

<details data-binding-status="pending_semantic_verification">
<summary>（39）你说的轻量化具体是指什么方面？可以讲一些例子吗？</summary>
<p>关联知识点待核实。</p>
</details>

轻量化可以指更小模型、减少检索候选、缩短上下文或精简部署依赖，须给具体指标。必须同时测质量与时延，不能只看 token 数下降。

<details data-knowledge-key="agent-project-portfolio">
<summary>（40）你在大模型相关的工程上有做过什么实践吗？</summary>
</details>

用一项真实工程实践说明需求、实现、测试和故障处理，分清个人完成与协作部分。没有实际实践时可讲学习实验，但不能冒充线上项目。

<details data-knowledge-key="agent-role-landscape">
<summary>（41）就是传统的后端工程项目是吧？</summary>
</details>

传统后端与模型应用可以共享鉴权、状态、队列和可观测性等基础能力。回答应说明模型特有的不确定输出、成本和评测问题，而非仅换一个项目标签。

<details data-knowledge-key="agent-architecture">
<summary>（42）如果现在让你设计的话，你会怎么去设计呢？</summary>
</details>

先确定任务和权限，再设计输入、检索、模型、工具执行、状态与评测的最小闭环。可先做确定性工作流，只有需要动态决策时再增加 Agent 循环。

<details data-knowledge-key="rag-cache">
<summary>（43）那假设这个生成的内容过期了呢？</summary>
</details>

给证据、索引和答案缓存记录版本及有效期，源数据更新时失效或重新生成。过期内容不能靠模型猜测修正；关键事实需重新检索并展示新来源。

<details data-binding-status="pending_semantic_verification">
<summary>（44）连续一</summary>
<p>关联知识点待核实。</p>
</details>

原帖算法仅写“连续一”，未给数组、允许操作或目标定义，无法确定是哪一道题。需取得完整题意与样例，目前无法给确定解法或复杂度；不补隐藏前提。
