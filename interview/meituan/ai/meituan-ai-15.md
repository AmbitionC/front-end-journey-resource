这份记录自述为美团暑期后端二面，4 月 3 日进行，约 40 分钟；原文没有注明面试年份，不能由帖子发布时间补定。作者在 4 月 13 日后记中自述收到 offer 邮件，经历与结果均未获企业独立证实。

仅整理已见文字。作者称 AI Coding 未完成，之后讨论项目动机、会话记忆和评估缺口；下面区分原文记录与编辑复习思路，不补写实际实现或量化收益。

<details data-binding-status="pending_semantic_verification"><summary>（1）AI Coding：用 AI 处理违规评论。（完整任务条件待补）</summary><span>关联知识点待核实。</span></details>
<p>原文只保留任务名称，没有输入输出、违规判定规则、接口或验收要求，不能还原成一套审核系统需求或补写代码。作者自述此前未做过类似功能，现场生成较慢，pom.xml 被生成后又删除，项目出现错误，最终只向面试官解释思路；这些现象不证明故障根因，本组待补且不绑定知识。</p>

<details data-knowledge-key="agent-coding"><summary>（2）你认为刚刚 AI Coding 过程中存在的问题是什么？</summary></details>
<p>先复盘实际任务、关键操作和可见故障，区分需求不清、生成延迟、误删文件和验证不足，不能只归因于“模型不行”。原文记录了生成慢及 pom.xml 被删除，但没有日志、完整变更或测试结果；作为编辑思路，可先保留可运行基线、缩小改动并检查差异，再依据构建与行为验证定位问题，不能声称现场已经完成这些检查。 <a href="../../../knowledge/llm/agent/agent-coding.md">知识详解</a></p>

<details data-knowledge-key="agent-coding"><summary>（3）你怎么看待 AI Coding，认为它是机会还是挑战？</summary></details>
<p>可以按具体任务讨论它如何辅助搜索、修改和验证，也要说明需求判断、审查与结果责任如何落实。生成更快不自动等于交付可靠，应在同一仓库和任务范围比较完成质量、人工修订与成本；原文只保留提问，没有作者对机会或挑战的完整回答，这段仅提供复习角度。 <a href="../../../knowledge/llm/agent/agent-coding.md">知识详解</a></p>

<details data-knowledge-key="agent-project-requirements"><summary>（4）做这些项目的背景和动机是什么？</summary></details>
<p>作者只记下 RAG 项目的动机从兴趣走向应用场景，没有给出具体用户、问题规模或业务收益。编辑复习可按目标用户、原有工作流、当前困难、可获得数据和验收方式说明为什么值得做，再解释技术选择；不能把兴趣项目包装成已经验证的生产需求。 <a href="../../../knowledge/career/agent-project-requirements.md">知识详解</a></p>

<details data-knowledge-key="agent-memory-architecture"><summary>（5）项目中遇到过什么困难？</summary></details>
<p>原文回答涉及会话记忆方案选型，并延伸讨论 Claude Code 的会话记忆，但没有留下具体配置、对比结果或故障细节。复习时可先区分当前上下文、恢复状态与长期记忆，再依据来源、权限、生命周期和并发一致性比较方案；这里只提供分析路径，不还原作者选用了哪种存储或产品机制。 <a href="../../../knowledge/llm/agent/agent-memory-architecture.md">知识详解</a></p>

<details data-knowledge-key="rag-evaluation"><summary>（6）项目中有哪些没有达到预期的地方？</summary></details>
<p>作者明确说尚未做数字化评估，忠实度、相关度、准确率与召回率只是拟评估思路，没有实测数值。编辑复习可先固定带依据的任务集，分别检查回答是否受上下文支持、是否回应问题，以及检索与任务结果；准确率和召回率还须说明预测目标、金标与分母，不能把指标名称当作已经证明的效果。 <a href="../../../knowledge/llm/rag/rag-evaluation.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（7）做完这个项目之后，你的收获是什么？</summary><span>关联知识点待核实。</span></details>
<p>原文只概括为了解 Agent 领域已有技术和应用，具体学会了什么、独立实现了什么、怎样验证均未展开，不能代作者补成掌握某个框架或具备生产经验。实际复盘可用一个完成的机制、一次失败及对应证据说明能力变化；本项保留为学习反思，暂不计入知识热度。</p>
