以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

仅覆盖已发布可见文字，不保证现场题目全部被回忆。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）请先做一个简单的自我介绍。</summary>
</details>

简要介绍岗位相关能力和一个可验证项目，并交代个人贡献。未公开的履历和现场细节不补写，避免把教程案例当作真实工作经历。

<details data-knowledge-key="agent-role-landscape">
<summary>（2）此前经历偏算法，如何理解全栈负责人岗位并选择工程方向？</summary>
</details>

全栈岗位可能需要贯通界面、服务端和 Agent，但具体职责应向团队确认。说明自己的工程经验与兴趣，用实做证据支撑方向选择，不把偏算法经历等同于工程能力不足。

<details data-knowledge-key="agent-skill-map">
<summary>（3）请评估一下你目前在偏工程方向上的能力水平，包括前端、客户端、服务端、Agent等方向。如果有一些具体的经验或理解，都可以聊聊。</summary>
</details>

按前端、客户端、服务端与模型应用列出独立完成、协作完成和仍需学习的能力。最好各配一个具体产物或测试，避免只用“熟悉技术栈”作自我评价。

<details data-knowledge-key="agent-coding">
<summary>（4）借助 AI 开发 iOS 客户端时，遇到 AI 无法解决的构建或代码问题怎么办？</summary>
</details>

先复现构建失败、读取首个有效错误，再检查工具链、依赖和最小代码差异，必要时查官方文档。AI 可协助定位，但修复仍要通过构建和行为验证。

<details data-knowledge-key="agent-project-portfolio">
<summary>（5）后端与 Agent 编排中，最有挑战的模块是什么？</summary>
</details>

选一个真实难点，解释原约束、备选方案、最终选择及失败恢复。把服务端状态和 Agent 编排的责任分开，并展示日志或测试，不替作者指定未描述的模块。

<details data-knowledge-key="agent-intent-clarification">
<summary>（6）你们系统的核心设计思路是"通过交互确认意图"，对吗？那么你觉得后端对意图识别的理解需要做到什么程度，才能应对各类场景？</summary>
</details>

意图识别应达到能选定下一步动作所需的程度，低置信度或缺关键条件时澄清。要保留多种意图和未知分支，不能要求分类器覆盖所有开放场景。

<details data-knowledge-key="rag-routing">
<summary>（7）你提到的Router在当前系统中是硬编码实现的，可以按需扩展。但如果用户意图不在Router预定义的范围内，系统如何处理？</summary>
</details>

为 Router 设置未知意图出口，转澄清、人工处理或受限通用能力，而不是强塞到已有类别。新增路由应有样例和回归测试，动态模型路由仍需验证候选动作。

<details data-knowledge-key="agent-state-storage">
<summary>（8）请介绍你们对话系统的整体设计，包括上下文管理、服务端数据存储，以及从接口接收请求到Agent处理的全链路设计。</summary>
</details>

请求先鉴权并创建会话与 run，再读取必要历史、执行 Agent、持久化消息和任务状态。流式事件可以异步推送，但数据库中的执行状态与恢复策略要一致。

<details data-knowledge-key="prompt-context-compression">
<summary>（9）单个对话窗口最多能存储多少轮对话？对于长上下文场景，是否做过专门的处理（如压缩策略）？</summary>
</details>

轮数上限应由 token 预算和任务需求决定；原文没有可泛化的固定轮数。压缩保留关键事实、待办和来源，原始历史仍可检索，防止摘要成为唯一真相。

<details data-knowledge-key="agent-project-evaluation">
<summary>（10）你提到对系统做了评测，请具体介绍一下。是针对导购效果、推荐准确性还是其他维度？</summary>
</details>

导购评测可分别检查意图理解、推荐相关性、事实正确性和任务完成率，再加入延迟与成本。离线固定样例和人工评价互补，不能用单一点击率证明所有维度。

<details data-knowledge-key="agent-chat-ui">
<summary>（11）整个系统中只做了 iOS 客户端吗？客户端与服务端的数据结构如何设计，对话数据怎样渲染到客户端？</summary>
</details>

先如实界定自己参与的客户端与其他模块，再讲接口如何返回稳定消息 ID、角色、内容块和状态，客户端按协议映射到组件。增量更新同一消息，避免每个片段都生成新条目。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（12）有没有做过专门的性能优化设计？你提到的性能问题（如评测中发现的内存问题）具体是什么？</summary>
</details>

先确定瓶颈是内存、网络、渲染还是模型等待，再用 profile 与对照实验定位。优化后复测同一任务；原帖提到的内存问题未经日志验证，不能断言具体原因。

<details data-knowledge-key="agent-learning-roadmap">
<summary>（13）你平时在学习哪些全栈相关的新技术？不限于前后端、客户端或Agent方向，可以聊聊你正在接触的技术领域。</summary>
</details>

选当前项目最缺的一项能力，安排小实验、阅读与复盘，并以实际产物检验学习。路线应服务岗位目标，没必要同时追逐所有框架的新版本。

<details data-knowledge-key="agent-skill-map">
<summary>（14）如果只选一个方向，前端和客户端你更倾向于哪一个？你对自己在这两个方向的技能掌握程度如何评估？</summary>
</details>

用项目规模、独立程度和问题排查能力比较前端与客户端掌握情况，再说明兴趣与学习计划。方向没有通用优劣，应与团队任务和个人经验对应。

<details data-knowledge-key="agent-resume-interview">
<summary>（15）你有什么想问我的吗？</summary>
</details>

可反问业务目标、实习生职责、协作方式和质量标准。公司答案需以现场回复为准，不能在教学短答中替面试官作承诺。

<details data-knowledge-key="algorithm-loop">
<summary>（16）有 100 扇门，初始全部是关闭的。你进行 100 轮操作：第 1 轮：打开所有门；第 2 轮：每 2 扇门切换一次（开→关/关→开）；第 3 轮：每 3 扇门切换一次；第 4 轮：每 4 扇门切换一次；……第 100 轮：只切换第 100 扇门。问：最后哪些门是开着的？</summary>
</details>

第 k 扇门被其所有正因数对应轮次切换；因数通常成对，只有完全平方数有奇数个因数。因此 1、4、9、16、25、36、49、64、81、100 最终开着，共 10 扇。
