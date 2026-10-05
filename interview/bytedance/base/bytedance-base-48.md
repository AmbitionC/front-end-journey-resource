以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

仅核对可见文字，可能折叠内容是否展开仍未确认。个人推测的淘汰原因不作为企业事实。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）问到岗时间，实习时长。</summary>
</details>

如实说明到岗日期、每周可投入时间和可持续时长，避免无法兑现的承诺。作者对淘汰原因的判断仅为个人猜测，不能据此推导企业规则。

<details data-knowledge-key="agent-coding">
<summary>（2）你平常使用什么AI工具？</summary>
</details>

说明实际使用的 AI 工具及任务，例如查代码、生成建议或执行验证，并区分工具输出与个人判断。展示时保护凭证与他人代码，不虚构使用经历。

<details data-knowledge-key="agent-project-requirements">
<summary>（3）Agent项目主要解决什么问题？</summary>
</details>

从用户问题、输入输出和成功标准说明项目，再解释为何需要模型能力。若规则方案已能满足需求，先比较复杂度，不因项目名含 Agent 就默认需要自主循环。

<details data-knowledge-key="agent-memory-summarization">
<summary>（4）最近在做的知识卡片怎么做的？</summary>
</details>

知识卡片可由对话或文档提取事实、主题和来源，校验结构后再保存。把原文引用与总结分开，保留时间和出处，避免抽取结果直接成为不可撤销的记忆。

<details data-knowledge-key="agent-memory-architecture">
<summary>（5）短期记忆如何做的？</summary>
</details>

短期记忆保存当前任务和近期对话，按 token 预算选取或摘要，并保留可追溯原始历史。它不等于把所有轮次一股脑塞入 prompt。

<details data-knowledge-key="prompt-template-design">
<summary>（6）然后直接看知识卡片抽取的prompt怎么写的。</summary>
</details>

展示真实提示入口、输入变量、输出 Schema 和异常样例，解释每条约束解决什么问题。抽取提示要限制证据范围，未知字段留空或标记不确定。

<details data-knowledge-key="prompt-basics">
<summary>（7）从PE的视角看，它是在做什么？</summary>
</details>

PE 在此语境通常指 Prompt Engineering，目的是把任务、输入与输出约束表达清楚，并用样例回归。若面试官指其他含义应先澄清，不能只背缩写。

<details data-knowledge-key="prompt-few-shot">
<summary>（8）你为什么会写好和不好的示例？</summary>
</details>

正例展示目标格式，反例帮助解释边界，但示例要与任务一致并避免反例被照抄。是否比零样例更好要测试，数量过多还会占用上下文。

<details data-knowledge-key="llm-token-context">
<summary>（9）大语言模型的原理是什么？预测的过程是什么？</summary>
</details>

自回归模型根据已有 token 的上下文计算下一 token 分布，再按解码策略选择并继续。概率预测不等于事实验证，训练知识、检索证据和输出约束影响最终结果。

<details data-knowledge-key="agent-project-portfolio">
<summary>（10）项目比较复杂的技术点是什么？</summary>
</details>

用一项真实技术难点说明约束、尝试、验证与取舍，可结合日志和代码入口。不要把“项目很复杂”本身当成能力证据。

<details data-knowledge-key="agent-memory-architecture">
<summary>（11）短期记忆是怎么设计的？</summary>
</details>

说明短期状态的结构、更新触发与使用位置，并区分会话历史、摘要和临时工作状态。每轮是否提取由任务和预算决定，不能默认必须全量重算。

<details data-knowledge-key="agent-memory-summarization">
<summary>（12）什么时候提取短期记忆？流程是什么？短期记忆拼到哪里？对应的代码在哪里？</summary>
</details>

在任务节点、上下文接近预算或有新事实时提取，校验后存储并在组装上下文时选择使用。给出实际函数调用链；摘要写入不应破坏原始消息与来源。

<details data-knowledge-key="prompt-system">
<summary>（13）最终system prompt的组装逻辑在哪里？</summary>
</details>

从请求入口追到上下文组装函数，说明基础指令、动态任务、记忆与检索片段的优先级。不要把不可信材料拼进高权限指令，版本和长度应可观测。

<details data-knowledge-key="prompt-context-compression">
<summary>（14）短期记忆一定是每一轮都交互吗？那每轮是怎么交互的？摘要直接替换的话，不会丢失信息吗？</summary>
</details>

短期记忆不必每轮都重写；可增量更新并记录覆盖范围。摘要会丢信息，关键事实与待办应结构化保留，必要时检索原始历史，而非只相信替换后的文本。

<details data-knowledge-key="agent-state-storage">
<summary>（15）历史对话记录存在哪里？</summary>
</details>

历史消息可按会话与租户持久化到数据库，另有事件或内容存储需求时再扩展。明确定义保存期限、访问权限与恢复策略，客户端缓存不是唯一权威来源。

<details data-knowledge-key="agent-memory-forgetting">
<summary>（16）给了个场景，30天之和智能体说我在北京上班，但现在调到上海去了，怎么处理？</summary>
</details>

把地点记忆记录时间、来源和有效状态；新明确陈述可更新当前地点，旧记录保留历史或失效。冲突时澄清，不把两条事实并列拼入 prompt 让模型自行猜。

<details data-knowledge-key="agent-memory-architecture">
<summary>（17）长期记忆存在哪里？</summary>
</details>

长期记忆可保存结构化事实和检索索引，按用户隔离并支持删除、更新与过期。向量库只是检索设施，不能代替权威事实和生命周期管理。

<details data-knowledge-key="rag-hybrid-search">
<summary>（18）你的召回是怎么做的？</summary>
</details>

查询先标准化并带权限条件，再按关键词或向量召回、合并去重、必要时 rerank，最后组装证据。需要用测试集判断召回是否改善，不能只展示返回片段。

<details data-knowledge-key="embedding-basics">
<summary>（19）向量化模型用的哪个？要看对应的代码。</summary>
</details>

指出实际 Embedding 模型、版本、维度和调用入口，并说明索引与查询端一致性。不同模型的向量不可随意混用，候选人具体配置未在教学中验证。

<details data-knowledge-key="agent-coding">
<summary>（20）基于刚才cursor对话的视角，讲一下输入到它完成任务之间发生了什么事情？</summary>
</details>

典型链路是读取用户任务与相关代码、规划修改、调用工具、检查结果和迭代验证。IDE 的具体权限与工具由实现决定，不能凭一次聊天断言其隐藏内部流程。

<details data-knowledge-key="agent-skill-design">
<summary>（21）你有在claudecode装什么skill吗？</summary>
</details>

列出已安装技能、触发条件和资源，说明实际如何帮助任务。技能名称不证明质量，加载后仍需权限、版本与结果验证。

<details data-knowledge-key="agent-skill-design">
<summary>（22）以superpowers这个插件为例，它有什么作用？</summary>
</details>

“superpowers”没有在原帖绑定版本或仓库，无法确认具体行为。可以先展示实际插件说明与一次调用，区分通用任务指导和该插件已核实能力。

<details data-knowledge-key="agent-skill-design">
<summary>（23）这个插件背后是怎么实现的？</summary>
</details>

从插件入口、技能索引、触发逻辑与工具调用查实现，说明哪些内容按需加载。没有读对应版本代码时不能编造内部 hooks 或默认审批策略。

<details data-knowledge-key="agent-memory-summarization">
<summary>（24）知识卡片具体如何生成？</summary>
</details>

重复追问可进一步讲卡片的字段、证据引用、去重和修订流程，并展示失败样例。抽取是生成候选事实，必须校验再进入可检索知识。

<details data-knowledge-key="rag-hybrid-search">
<summary>（25）怎样设计公开群聊搜索，决定哪些群排在前面？</summary>
</details>

群聊搜索先按可见权限召回，再根据查询相关性、活跃度与质量特征排序，并用离线和线上指标验证。用户个性化应有数据边界，不能只按群规模排序。

<details data-knowledge-key="feature-store">
<summary>（26）给定群主、用户标识与爱好等群数据，怎样建立特征提取系统？</summary>
</details>

定义群与用户的特征、统计窗口和更新频率，先清洗字段并处理缺失，再保存带版本的特征快照。避免用未来行为生成训练特征，也不把敏感 UID 当公开展示内容。

<details data-knowledge-key="agent-coding">
<summary>（27）配合claudecode给出特征提取系统的方案。</summary>
</details>

先让 AI 基于明确数据 Schema 和目标生成小方案，逐项检查来源、处理规则与测试。约束允许修改的文件和执行动作，不能把 AI 选的技术栈直接当必要需求。

<details data-knowledge-key="batch-stream-processing">
<summary>（28）你对方案里面的flink和spark了解吗？</summary>
</details>

Flink 常用于有状态流处理，Spark 提供批与流等计算能力，选型看延迟、规模和运维。没有实际经验应说明，不能因为 AI 推荐就声称已经掌握。

<details data-knowledge-key="feature-store">
<summary>（29）如果让你做一个MVP版本，你如何去做？</summary>
</details>

MVP 可用定时 SQL 或小脚本产出少量可解释特征，先验证排序是否有效；数据规模与时延要求增长后再评估分布式计算。保留数据版本和一致的评测基线。

<details data-knowledge-key="agent-human-in-loop">
<summary>（30）期间claudecode使用了superpowers插件，然后一直给我选项确认，面试官问假设你现在要走人了，如何让它直接自己做，不让你确认。</summary>
</details>

提前给清楚的任务范围、可自主动作和必须停下的条件，工具侧仍执行权限约束。减少重复询问不等于取消安全边界，破坏性或越权操作不能靠提示绕过。

<details data-knowledge-key="agent-role-landscape">
<summary>（31）未来想做什么？</summary>
</details>

说明自己希望发展的能力与愿意承担的任务，再给实际学习或项目证据。职业目标是个人选择，不需要编造与岗位完全一致的口号。

<details data-knowledge-key="agent-resume-interview">
<summary>（32）你觉得你的优点是什么？</summary>
</details>

用一次具体行为和结果证明优点，例如独立排查、沟通或持续学习，并说明可改进之处。不要用没有证据的形容词或虚构指标支撑。

<details data-knowledge-key="agent-resume-interview">
<summary>（33）有其他的实习offer没？</summary>
</details>

如实说明当前进展和决策约束，可只披露必要信息。面经没有可推广的标准答案，不能替作者编造 offer 或谈判策略。

<details data-knowledge-key="agent-resume-interview">
<summary>（34）实习生参与的业务是什么？</summary>
</details>

可询问实习生参与的真实业务、任务范围和导师支持，判断岗位匹配。对方回复未记录时不补造公司职责。

<details data-knowledge-key="agent-learning-roadmap">
<summary>（35）能来的话需要补哪些技术栈？</summary>
</details>

向团队确认必需技术栈，再按实际任务补最缺能力并做小实验。学习清单应区分入职必需与可后续了解，不把所有流行框架列成硬要求。
