作者自述参加百度搜索框架部门的 Agent 智能体研发日常实习面试。一面为 1 月 6 日、约 40 分钟，二面为 1 月 16 日、约 1 小时；原文没有注明面试年份，两轮按同一流程合并记录。

面试经历为个人自述，未获企业独立确认。本页依据已采集到的文字整理，未核验作者身份或实时页面展开状态。以下短答为编辑教学思路，不代表当事人的现场回答、项目实现或实验结果；缺失题干、歧义术语和产品规则分别保留待补。

## 一面：算法、上下文与后端基础

<details data-binding-status="pending_semantic_verification"><summary>（1）二叉树的右视图怎样做？（题干与约束待补）</summary><p>关联知识点待核实。</p></details>
<p>原文只有题名，没有输入表示、规模、空树与输出要求。先补齐完整题干和 ACM 输入输出协议，再讨论算法与复杂度；本页不复原常见平台版本，也不把主观完成描述当作测试通过证据。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）最长递增子序列怎样做？（题干与约束待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有说明输入规模、是否严格递增、返回长度还是序列，以及重复值规则。待完整条件确认后再比较动态规划或其他候选方案；这里只保留题名，不补造原题用例与验收结果。</p>

<details data-knowledge-key="multi-agent"><summary>（3）Multi-Agent 怎么做？</summary></details>
<p>先解释为什么任务需要独立执行者，再说明职责、输入输出、各自上下文和结果归并规则，并与单 Agent 或固定流程比较。共享事实应有明确所有者，返回结果需带任务、版本与证据，不能把角色增加当作效果提升；原文未披露当事人项目的具体实现。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）“共享上下文哈希冲突”怎么解决？（含义待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有说明这里的哈希用于什么、冲突发生在哪个数据结构或操作，以及如何复现。先补充键和值、冲突样例与读写路径，再判断问题；不能把它自动解释为一致性哈希、并发覆盖或摘要冲突。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（5）上下文压缩有哪些策略？</summary></details>
<p>先按任务保护目标、约束、关键事实、来源和未完成动作，再选择裁剪、抽取或摘要，并为输入与输出安排预算。保留原始记录的回读路径，检查否定、数字和关系是否失真，再比较继续任务的质量与总成本；原文没有披露具体压缩实现。</p>

<details data-knowledge-key="agent-memory-architecture"><summary>（6）上下文怎样存储？</summary></details>
<p>先区分当前模型输入、可恢复的运行状态、跨会话事实与原始证据，再按用途选择存储及加载方式。持久化后仍需版本、来源、权限、冲突和删除规则，存下来的内容不等于本轮已经加载；原项目的存储组件与数据结构未披露。</p>

<details data-knowledge-key="redis-cache"><summary>（7）Cache-Aside 策略怎样组织读写？</summary></details>
<p>以数据库为权威来源：读时先查缓存，未命中再回源并按规则回填；写入提交后使缓存失效。继续说明失效失败、旧读晚回填及过期兜底等窗口，关键业务条件仍在权威存储中校验，不能把一次删除说成强一致。</p>

<details data-binding-status="pending_semantic_verification"><summary>（8）Redisson 的作用是什么？（项目用途待补）</summary><p>关联知识点待核实。</p></details>
<p>先补充项目所用版本、实际调用的组件、要解决的问题和约束，再解释它承担的作用。原文只给出名称，不能据此断言使用了分布式锁、看门狗或某种缓存方案；待真实调用证据补齐后再关联具体知识。</p>

<details data-knowledge-key="async-job-queue"><summary>（9）为什么选择 RocketMQ？</summary></details>
<p>先给出需要异步解耦、缓冲或消息投递的真实需求，再比较可靠性、顺序粒度、延时、重复处理与运维成本。所需消息合同要与实际版本和配置对应，业务完成仍靠状态与幂等验证；原帖没有披露当事人的选型依据、容量和配置。</p>

<details data-knowledge-key="redis-cache"><summary>（10）多级缓存怎么做？</summary></details>
<p>先定义各层保存什么、谁是权威来源和允许的陈旧窗口，再说明读取、失效传播与回填顺序。本地缓存和共享缓存各有生命周期，要处理通知中断、晚回填和热点失效；原项目层数、组件和参数仍未披露。</p>

<details data-knowledge-key="mysql-index"><summary>（11）怎样理解 MySQL 的联合索引？</summary></details>
<p>从真实查询的过滤、排序与输出字段出发解释复合键的有序组织，再讨论最左前缀、范围、覆盖与回表成本。用对应版本的执行计划和实际工作量验证选择，不能机械断言范围后的列全部无用，或缺前导列就绝对不使用索引。</p>

## 二面：项目实现与效果验证

<details data-binding-status="pending_semantic_verification"><summary>（12）项目中的 Multi-Agent 怎么实现，为什么直接采用 Claude Agent SDK？（实现与选型依据待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有给出 SDK 版本、实际能力调用、编排逻辑或替代方案对比。先补齐职责、数据流、权限、失败恢复及自己的代码边界，再说明 SDK 提供什么、项目仍需负责什么；本页不替作者编造选型结论。</p>

<details data-binding-status="pending_semantic_verification"><summary>（13）任务调度器怎样实现？（原项目调度合同待补）</summary><p>关联知识点待核实。</p></details>
<p>先补充调度的是模型回合、依赖任务、定时任务还是后台 Job，以及并发、优先级和恢复要求。没有这些条件，不能直接指定 DAG、队列、线程池或某个框架；原文未披露实现，保留待补。</p>

<details data-binding-status="pending_semantic_verification"><summary>（14）项目里的 MCP 是怎么做的？（接入实现待补）</summary><p>关联知识点待核实。</p></details>
<p>原文未披露协议版本、客户端与服务端角色、传输、工具清单或实际调用。复盘应提供真实接口与回执，分别说明参数、授权、错误和结果校验；本页不据一个协议名补造项目架构。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（15）二面继续追问：上下文怎样压缩？</summary></details>
<p>可沿保护信息、分配预算、选择裁剪或摘要、保存来源、验证继续任务这条顺序回答，并解释压缩失败如何回源。压缩率、单轮 token 变少都不能单独证明总体收益，还要计入摘要与重试成本；原文没有给出二面的具体方案和参数。</p>

<details data-knowledge-key="agent-debugging"><summary>（16）Agent 出现 Bug 时，只有重试这一种办法吗？</summary></details>
<p>先定义失败现象，保存输入、版本、状态和轨迹，再在隔离环境复现并定位最早偏差。代码或决策缺陷要修复并回归，只有安全且暂时的故障才考虑有界重试；涉及未知副作用时先查状态，原文没有披露当事人的恢复实现。</p>

<details data-knowledge-key="agent-coding"><summary>（17）给 Agent 一个代码重构任务，应怎样组织完成与验收？</summary></details>
<p>先澄清重构目标、允许改动范围和必须保持的行为，固定仓库状态并读取相关代码与测试，再形成小范围补丁。按风险运行静态检查与受影响测试，审查 diff 和剩余限制；这是教学流程，原文没有提供具体重构输入、代码或执行结果。</p>

<details data-knowledge-key="llm-lora-peft"><summary>（18）LoRA 的原理是什么？</summary></details>
<p>在经典 LoRA 中冻结基座权重，用两个较小矩阵表示可训练的低秩权重增量，并把该增量与原层输出组合。低秩针对增量，参数节省不等于固定比例的显存节省或任务准确率提升；实际效果需要独立评测。</p>

<details data-binding-status="pending_semantic_verification"><summary>（19）所谓“准确率上升 20%”是怎么测出来的？（测量证据待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有数据集、基线、样本分母、指标定义或可复查结果，作者还承认不了解测量过程，因此这个数字不能作为实测收益。待补充独立保留集、同条件基线与完整记录后，才能判断“20%”指相对变化还是百分点；仅记得 ROUGE、BLEU 名称无法补齐证据。</p>

<details data-binding-status="pending_semantic_verification"><summary>（20）Mem0 的架构怎样说明？（版本与项目证据待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有所用版本、部署和组件资料，作者也承认不清楚架构。先核对对应版本的官方设计与实际代码，再解释写入、检索、更新和图关系如何组合；不能把关于付费版或图记忆的模糊回忆当成当前产品事实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（21）“长期上下文”在什么条件下触发？（机制含义待补）</summary><p>关联知识点待核实。</p></details>
<p>先确认“触发”指长窗口调用、历史回读、压缩，还是长期记忆的读写，并补充业务条件和观测证据。原文没有说明机制，不能据此指定阈值、自动摘要或语义检索，也不能声称原项目已经实现。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（22）Agent 的评估体系中，Function Calling 应评调用时机还是调用结果？</summary></details>
<p>两者分别评：轨迹层检查是否需要调用、工具与参数是否合适、是否满足顺序和权限约束，结果层检查真实环境状态与任务是否完成。固定任务、版本、环境和评分规则，允许有效的替代调用路径，并同时报告失败切片、延迟与成本；格式正确或工具返回成功都不能替代任务验收。</p>

<details data-knowledge-key="rag-pipeline"><summary>（23）RAG 怎样通过查询改写、多路召回与重排优化？</summary></details>
<p>先用失败样本判断问题发生在查询表达、召回还是排序，再选择必要的改写、扩展或多路检索，并去重、融合和重排。改写必须保留实体与约束，重排不能找回完全漏召回的证据；用固定问题集分别评召回、排序、答案支持、延迟和成本，不能只堆步骤。</p>

<details data-binding-status="pending_semantic_verification"><summary>（24）“RAG 怎么分”具体指什么？（关键词待补）</summary><p>关联知识点待核实。</p></details>
<p>原文没有说明“分”的对象，只提到思路和语义相似度。先补充完整问法，再区分是否涉及分块、分类、路由或其他处理；不能替原文补成 Chunking 题，更不能增加块长、重叠和边界条件。</p>

<details data-knowledge-key="embedding-basics"><summary>（25）你知道哪些 Embedding 模型？</summary></details>
<p>编辑示例可以举 Qwen3-Embedding-0.6B 与 OpenAI text-embedding-3-small，再说明语言、任务、输入约定、维度、部署和评测条件。查询与文档编码器需使用经验证兼容的组合，同维度不等于同一向量空间；这两个型号用于教学，原文只记得两个系列，未披露现场或项目的具体型号。</p>

<details data-binding-status="pending_semantic_verification"><summary>（26）交流中提到的“Opus 4.5 五小时限制”是什么意思？（产品规则待核验）</summary><p>关联知识点待核实。</p></details>
<p>原文只记录了一段未经核验的问答，没有账户套餐、规则页面或使用记录。额度窗口、重置方式和连续运行时长不是同一概念，具体含义需按对应产品、时间与账户规则核对；本页不把这段回忆写成厂商限制事实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（27）最长回文子串怎样做？（题干与约束待补）</summary><p>关联知识点待核实。</p></details>
<p>原文仅有题名及屏幕共享、关闭代码补全的形式要求，没有输入范围、字符规则、并列答案与输出协议。先补齐完整题干再比较方案，并独立验证边界用例；不根据熟悉题名补造实现或成功测试记录。</p>

## 相关资料

以下官方资料用于核对教学思路与编辑示例，不证明原项目曾采用这些实现。

- [Anthropic：Agent 架构与工作流取舍](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic：上下文压缩与信息保留](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents)
- [LangGraph：短期状态与跨线程存储](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Microsoft：Cache-Aside 模式与一致性边界](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [RocketMQ 5.0：Topic 与消息类型](https://rocketmq.apache.org/docs/domainModel/02topic/)
- [MySQL 8.4：复合索引](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)
- [Hugging Face PEFT：LoRA 权重增量](https://github.com/huggingface/peft/blob/main/docs/source/package_reference/lora.md)
- [Anthropic：Agent 评测中的任务、轨迹与环境结果](https://www.anthropic.com/research/demystifying-evals-for-ai-agents)
- [Qwen3-Embedding 官方模型清单](https://github.com/QwenLM/Qwen3-Embedding)
- [OpenAI：text-embedding-3-small](https://developers.openai.com/api/docs/models/text-embedding-3-small)
