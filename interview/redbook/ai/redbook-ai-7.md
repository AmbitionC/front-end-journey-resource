### 小红书大模型平台全栈一面：写边界、Harness 与意图澄清

以下短答与教学示例由编辑补充，不代表原作者的现场回答、实际架构或实测结果。

标题注明小红书大模型平台、Agentic 全栈研发方向一面。正文明确面试日期为 2026 年 8 月 6 日，并自述一面后结束流程。以下只使用已见题目，招聘承诺和面试官观点不作企业官方事实。

选录写操作边界、Harness 与编排、意图清晰度、Skill 与 Tool 四组。扩容、SQLite、自研框架、Java 和索引题均已见但未选；反问中关于 query 切分与 RAG 落地的讨论没有具体问答，不补成现场结论。

<details data-knowledge-key="agent-permission-model">
<summary>（1）Agent 的写操作边界怎样划分？</summary>
</details>

按主体、资源、操作、环境及影响范围定义允许动作，由受信任执行层校验权限和参数。读取、可撤销写入与高影响写入可采用不同门槛；已授权范围内执行，超范围则阻断或取得相应授权。模型的判断与工具可见性都不能自行扩大权限。

教学例子：用户授权更新一份草稿，执行层应限定文档和可改字段；即使工具也能删除整份文档，Agent 也不能把它当作同一授权。审批、幂等与结果核验分别解决不同问题。

技术核对：[NIST SP 800-162：ABAC 属性与授权](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)。

知识导航：[最小权限、授权与工具调用确认](../../../knowledge/llm/production/agent-permission-model.md)。

<details data-knowledge-key="build-agent-framework">
<summary>（2）Harness 层包括什么，编排层怎样讲清架构？</summary>
</details>

先画出模型决策、工具执行、状态保存与验证的边界，再说明谁持有上下文、预算、权限、失败恢复和终止条件。编排可以用代码或图表达依赖、分支与状态更新；Harness 的职责是让这些步骤可控、可观察、可验收，不是堆叠框架名。

教学例子：模型提出查日志，运行层先校验范围再调用工具，把结果写回当前任务状态，最后核验问题是否解决。查询接口成功只说明该步骤有结果，不能跳过目标验收就将整次排障标成功。

技术核对：[LangGraph：状态、节点和边](https://docs.langchain.com/oss/python/langgraph/graph-api)。

知识导航：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)。

<details data-knowledge-key="agent-intent-clarification">
<summary>（3）怎样判断 Query 是否足够清晰，并让意图分流可检查？</summary>
</details>

检查目标、对象、约束和必填参数是否足以选择合法动作；区分一个请求包含多个任务，还是存在互相竞争的解释。规则、分类器与 LLM 都可以给候选，但候选分数不能替代授权。缺少会改变行动的条件时，提出能消除关键分叉的澄清问题。

教学例子：“处理这条记录”可能指查看、修改或删除。先询问期望动作，再校验目标记录和权限；无需让用户重写所有已知信息，也不能只因分类器高分就执行删除。

知识导航：[意图识别、澄清反问与对话路由](../../../knowledge/llm/agent/agent-intent-clarification.md)。

<details data-knowledge-key="agent-skill-design">
<summary>（4）Skill 与 Tool 有什么区别，Skill 何时加载？</summary>
</details>

Tool 是执行操作的接口与合同，Skill 是一类任务的说明和可复用资源，可以指导使用多个工具。常见渐进式加载先让 Agent 了解名称和用途，匹配任务后再读正文，引用资料按需读取；具体加载由宿主实现，Skill 本身不能授予新的工具权限。

教学例子：报表 Skill 说明先查数据再核对口径，查询数据库是 Tool。未使用报表任务时无需加载全部说明；加载后也必须由执行层限制查询范围，不能因为 Skill 写了“可更新”就得到写权。

技术核对：[Agent Skills：渐进式披露](https://agentskills.io/specification#progressive-disclosure)。

知识导航：[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。
