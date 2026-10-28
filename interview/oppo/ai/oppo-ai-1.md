### OPPO AI 全栈一面：AI Coding、Skill 与数据结构

作者记述这是一轮不到半小时的 AI 全栈一面，重点涉及 AI 工具使用、Skill、项目协作和基础数据结构；具体面试日期未披露，采集元数据中的 2026 年 8 月是发帖时间。本文选录下列 8 组问题，未收录使用过哪些 Skill 的个人清单、是否读过 grill-me 原文的经历追问、爱好，以及关于业务职责/技术栈、AI 使用场景、前端转全栈趋势的三组反问。以下是教学整理；Skill 短而有效的解释不是对特定 Skill 原文或候选人阅读经历的核验。

<details data-binding-status="pending_semantic_verification">
<summary>（1）用过哪些 AI 开发工具，应该怎样回答？</summary>
<p>关联知识点待核实。</p>
</details>

不要只报产品名。按需求理解、代码检索、实现、测试、Review 和文档说明各工具承担什么，再给一个真实例子：输入了哪些约束，模型产出哪里不可靠，你如何验证，最后节省了什么时间或减少了什么缺陷。重点是可控工作流，不是“AI 写了多少代码”。

<details data-knowledge-key="agent-coding">
<summary>（2）AI 生成代码效果不佳时怎样处理？</summary>
</details>

先定位失败类型：上下文缺失、需求歧义、错误 API、架构不匹配，还是测试不足。补充最小相关文件和验收标准，把大任务拆小；先写复现或失败测试，再让模型做窄修改。之后运行类型检查、单元/集成测试并审阅 diff。多轮仍失败时应回到设计或人工实现，而不是继续堆 Prompt。

延伸阅读：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)。

<details data-knowledge-key="agent-skill-design">
<summary>（3）Skill 为什么可以很短却有效？</summary>
</details>

Skill 的价值不在字数，而在是否给模型正确的决策边界：何时触发、需要读哪些资源、按什么顺序执行、什么算完成、遇到风险何时停止。短 Skill 可以把稳定流程指向脚本、模板和引用资料，按需加载，避免每次把全部背景塞进上下文。若只是口号或省略验收标准，再短也没有复用价值。

延伸阅读：[Agent Skill 的设计与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（4）怎样介绍项目和自己的角色？</summary>
<p>关联知识点待核实。</p>
</details>

先用一句话说明用户与问题，再画出关键数据流。区分本人负责、共同完成和复用现成组件；选一个最难决策讲约束、备选方案、取舍和结果。项目已上线就给监控与反馈；未上线则如实说明验证环境、演示范围和下一步，不能把 demo 指标包装成生产结果。

<details data-binding-status="pending_semantic_verification">
<summary>（5）团队意见不一致时怎么办？</summary>
<p>关联知识点待核实。</p>
</details>

先把争议改写成可比较的目标，例如交付时间、可靠性、维护成本或性能，而不是争论偏好。记录约束，设计小型实验或 spike，用数据和风险表决策；仍无法统一时由明确 owner 拍板并记录原因。执行后复盘结果，避免把一次让步变成永久技术债。

<details data-binding-status="pending_semantic_verification">
<summary>（6）常见线性数据结构怎样分类？</summary>
<p>关联知识点待核实。</p>
</details>

数组、链表、栈、队列、双端队列都按线性顺序组织元素，但访问和修改特性不同。数组连续存储、随机访问快；链表通过指针连接，已知节点时局部插入删除更直接；栈和队列主要约束访问顺序。工程选择还要考虑缓存局部性、内存开销和语言运行时实现。

<details data-binding-status="pending_semantic_verification">
<summary>（7）数组和链表分别适合什么场景？</summary>
<p>关联知识点待核实。</p>
</details>

频繁按下标读取、批量扫描或数据规模稳定时优先数组；需要在已定位位置频繁插入删除、节点稳定引用时可考虑链表。现实中链表并不总比数组快，因为寻找位置仍需遍历，指针和缓存未命中也有成本。

<details data-binding-status="pending_semantic_verification">
<summary>（8）栈、队列和 BFS 的关系是什么？</summary>
<p>关联知识点待核实。</p>
</details>

栈后进先出，常用于调用、撤销和深度优先搜索；队列先进先出，适合任务调度与广度优先搜索。BFS 从起点逐层扩展，把未访问邻居入队，因此在无权图中第一次到达节点时即可得到最少边数距离。实现时要在入队时标记访问，避免同一节点重复进入队列。
