这份记录自述为美团 AI 全栈二面，约 45 分钟。面试日期与最终结果未披露；“如果通过后续是 HR 面”的条件表述不等于已经通过。与已整理的一面记录按同一求职流程的不同轮次自述整理，此处只保留二面技术讨论。

整理范围仅限已见文字：原记录中有未加载的图片占位，图片内容与是否包含补充题目均未知，本页未依据图片补题。以下短答为编辑整理的备考思路，不能当作完整现场回答；AI Coding 原任务、业务模型和框架名称等缺口已保留。

## 问题与简答

<details data-knowledge-key="agent-coding"><summary>（1）如何介绍面试前限时 2 小时的 AI Coding 作业与人机协作过程？（原任务未披露）</summary></details>
<p>原记录自述未完成作业、测试检查不足，并展示了与 AI 的对话；原始任务没有公开，不能还原具体功能。复盘时可明确已完成与未完成边界，用需求约束、关键对话、实际变更和验证记录说明协作；代码生成和模型确认都不能代替已运行的测试。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）这个系统有哪些核心表？（业务需求和表结构待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有给出系统业务、实体、表结构或数据约束。需要先补真实需求及实体关系，再说明各表承载的事实、关键约束与访问方式；本页不代填表名、字段或关系模型。</p>

<details data-knowledge-key="vite-testing"><summary>（3）这个系统的测试用例如何设计？（实际任务与用例待补）</summary></details>
<p>先依据真实需求列出主流程、输入边界、异常与状态变化，再把断言分配到适当的单元、集成和关键端到端测试中，并保留执行环境与结果。原作业及具体用例未披露，这只是通用设计方法，不代表当事人已经覆盖或通过这些测试，也不推断项目用了某个测试框架。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）这个系统的状态机如何设计？（业务状态与迁移条件待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有给出状态集合、事件、迁移条件、异常路径或副作用。应先补齐真实业务约束，再说明哪些迁移合法、如何处理重复或迟到事件，以及怎样验证；不能把一种通用状态图冒称该项目设计。</p>

<details data-knowledge-key="agent-coding"><summary>（5）如何看待 AI 时代的前端与客户端开发，怎样更好地用 AI 编写两端，两者有什么区别？</summary></details>
<p>两端都应先明确需求、现有代码、平台约束与验收标准，再审查 AI 生成的变更并在目标环境验证。比较时应落到实际运行环境、交互与设备能力、构建发布和测试方式；原记录未指明客户端平台或技术栈，不能把它默认成某种手机或跨端框架。</p>

<details data-binding-status="pending_semantic_verification"><summary>（6）面试官提到的“多 Agent 协作和暴露本地服务”框架是什么？（名称与机制待补）</summary><span>关联知识点待核实。</span></details>
<p>原记录没有框架名称、版本、接口或准确机制，只记录作者未听过并与面试官讨论。需先取得原名称与能力描述，再判断协作和本地服务接入分别由什么机制提供；不能从这两个功能词猜成某个框架、协议或产品。</p>

## 延伸学习

- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)
- [Vite、前端构建与测试基础](../../../knowledge/frontend/engineering/vite-testing.md)
