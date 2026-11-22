科大讯飞 Java 开发一面，围绕个人项目、实习职责、Agent 记忆和 AI 辅助开发展开。原记录未注明面试日期。

以下题目按已见文字整理，短答是编辑补充的备考思路，不能当作当事人的现场回答或公司的真实实现。原记录另列“一些对实习经历的深度挖掘”和“反问”，没有具体问题内容。

## 项目与实习复盘

<details data-knowledge-key="agent-resume-interview"><summary>（1）请做一下自我介绍，包括个人基本情况、学习、项目经历等。</summary></details>
<p>围绕应聘岗位简要交代学习背景和相关能力，再用一个真实项目说明解决的问题、个人职责及已验证的结果。只介绍与岗位有关且自己能被追问的经历，不补造个人情况或成果。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（2）做的项目主要是出于什么目的？</summary></details>
<p>先说明项目服务谁、原来哪个步骤有困难，以及不用 AI 时的基线，再解释为什么选择这个项目和当前方案。区分学习验证与实际业务目标，用能够核对的验收结果说明做到哪一步，不能把预期收益说成已经实现。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（3）这个项目里你觉得最难的地方是什么？AI 相关信息里你掌握最深、收获最大的是什么？</summary></details>
<p>选一个真实难点，按约束、备选方案、定位证据、采取的改动和验证结果说明自己的判断。再讲在 AI 相关知识上理解最深的一点，以及它怎样改变后续设计或排查方式；难点与收获都应落到亲自参与的事实。</p>

<details data-knowledge-key="agent-memory"><summary>（4）（个人项目中）你提到记忆和 prompt 管理，具体是怎么设计的？遇到了什么问题？</summary></details>
<p>先区分当前会话状态与跨会话记忆，说明保存什么、何时检索，以及权限、过期和错误更正怎样处理。Prompt 管理则交代模板与模型、工具等配置怎样固定版本、回归验证和回滚。最后各用真实问题解释定位与改进；原记录没有披露具体实现，不能据此推定使用过某个框架或存储方案。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（5）美团内部那个产品（Agent 平台）已经上线了吗？做了多久？</summary></details>
<p>按亲自确认的事实区分 Demo、内部试用、灰度和正式使用，并交代自己参与的时间范围与交付阶段。原记录没有给出该内部产品的上线状态或开发周期，不能替当事人补写结论。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（6）具体讲一下你主要的工作内容或成果。</summary></details>
<p>先划清接手前已有的能力、自己负责的模块和与团队的接口，再说明亲自完成的设计、实现与验证。成果以实际交付物和可核对的结果表达，团队整体收益、他人工作和未上线预期应分别说明。</p>

<details data-knowledge-key="agent-quality-gates"><summary>（7）你在美团实习中负责的“上线前风险检测”方案是怎么设计的？最终形成的方案是什么样的？</summary></details>
<p>先说明检测对象、需要发现的风险和发布边界，再交代检查规则或用例、证据、判定条件，以及阻断或人工复核的处理方式。结合真实失败样本解释方案怎样迭代、最终怎样验收；原记录未披露实际规则和最终方案，通用门禁设计只能作为备考思路。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（8）团队协作中有没有遇到什么问题？</summary></details>
<p>选一次真实协作问题，交代共同目标、职责依赖和分歧，再说明自己怎样带着证据沟通并落实调整。结果包括仍未解决的限制和后续改进，不把协作问题简化成责怪他人，也不补写圆满结局。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（9）当时负责人或代理人对你个人、对你开发的代码有什么建议或评价？</summary></details>
<p>分别说明关于个人协作或能力的反馈，以及针对代码的具体建议，再讲自己怎样理解、核实和落实。用实际修改、复核结果或后续行为说明变化，尚未收到或记不清的评价如实说明，不能虚构负责人的认可。</p>

## AI 编程与个人成长

<details data-knowledge-key="agent-coding"><summary>（10）你刚才提到用 AI 辅助开发，具体用了哪些工具？公司项目里有什么限制？</summary></details>
<p>只列实际用过的工具和用途，再说明当时允许的账号、功能、模型与入口，以及哪些代码、日志和业务数据可以提交。还要区分数据去向、命令与网络权限、交付审查等限制，不能把内容排除当成文件系统隔离。原记录没有披露公司的具体制度，回答应以自己核实过的政策为准。</p>

<details data-knowledge-key="agent-coding"><summary>（11）你觉得在这个时代应该怎么用 AI 工具？你在 AI 编程上有没有自己的心得？怎么让 AI 生成的代码更高级？</summary></details>
<p>把 AI 用于有明确需求和验收条件的开发环节，提供相关接口、调用方、仓库规范与失败证据，保持改动可审查。所谓“更高级”应落实到正确性、可读性、维护成本和边界处理，再通过类型检查、行为测试与 Diff 审查核验。结合自己的真实使用案例说明有效做法和失败教训，不用堆叠抽象或模型自称完成代替质量证据。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（12）你对他们这个平台架构也做过一些了解，虽然架构不是你搭建的，你有没有做过预测或了解？</summary></details>
<p>先区分亲自实现、通过文档或接口确认，以及尚待验证的架构推测，明确自己没有负责的部分。沿一次真实请求说明了解的模块职责与边界，推测则讲依据、替代解释和验证办法，不能把通用 Agent 架构当成该平台的事实。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（13）在 AI 编程、大模型或前沿技术方面，你做过哪些学习或了解？</summary></details>
<p>选自己实际学过并动手验证的主题，说明起点、阅读或实验方法，以及能解释的机制和边界。用一个真实产出或失败复盘展示理解程度，区分“了解过”和“已经掌握”，不靠罗列模型与工具名称证明能力。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（14）你觉得自己最大的不足是什么？可以总结一下。</summary></details>
<p>选择与工作相关、能够用真实例子说明的不足，解释它造成过什么影响，以及目前采取的改进。说明怎样检查进步和仍未解决的部分，不把优点换一种说法包装成缺点，也不虚构改善结果。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（15）刚才聊的过程中，有没有觉得哪些地方可能是亮点，需要再补充的？</summary></details>
<p>回看前面的职责与成果，只补充尚未表达清楚且与岗位有关的事实，例如自己的关键判断或验证证据。简要说明它为什么有价值，并保持与已讲经历一致，没有新证据时不临时增加成绩。</p>

## 延伸学习

- [AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)
- [从真实需求定义 Agent 项目](../../../knowledge/career/agent-project-requirements.md)
- [短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)
- [Prompt 版本管理与 A/B 测试（第 4 题补充阅读）](../../../knowledge/llm/prompt/prompt-versioning.md)
- [Agent 发布质量门禁](../../../knowledge/llm/production/agent-quality-gates.md)
- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)
