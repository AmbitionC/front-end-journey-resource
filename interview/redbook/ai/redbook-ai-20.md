### 小红书 AI 应用一面：RAG 评测、Skill 与平方根

原帖发表于 2026 年 9 月，自述为小红书 AI 应用研发一面，标题给出 9 月 15 日。业务说明指向社区搜索相关方向，但未给出正式部门名称与具体系统配置。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-knowledge-key="rag-evaluation"><summary><strong>（1）RAG 系统怎样评测？</strong></summary></details>
<p>先固定查询、证据标注、语料和权限版本，再分别看检索覆盖、排序及回答的证据支持。同步记录时延与成本，用失败切片解释结果，不把单一模型裁判总分当成完整验收。</p>

<details data-knowledge-key="agent-resume-interview"><summary><strong>（2）怎样复盘项目难点与解决过程？</strong></summary></details>
<p>选择一个真实失败，按现象、定位证据、尝试和验收结果说明迭代。区分已经解决、仍有限制和后续设想，原文没有实际案例，不能代作者编写成果。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（3）怎样说明自己使用 AI 工具与跟进技术的方法？</strong></summary>关联知识点待核实。</details>
<p>用实际任务说明工具解决了什么问题、怎样验证结果以及何时需要人工判断。区分亲手使用与只读资料的内容，避免用热词清单代替能力证据。</p>

<details data-knowledge-key="agent-skill-design"><summary><strong>（4）怎样设计可复用的 Agent Skill？</strong></summary></details>
<p>明确触发条件、输入输出、操作边界和必要资源，再用真实任务验证可执行性。将稳定指导与按需读取的细节分开，并管理版本与失败路径，避免只堆砌一大段提示。</p>

<details data-knowledge-key="agent-coding"><summary><strong>（5）怎样介绍编程助手 CLI 的能力与使用边界？</strong></summary></details>
<p>按实际版本说明上下文、工具调用、代码修改与验证能力，并给出自己的使用流程。具体命令和默认行为需要查对应版本文档，原帖没有提供配置，不能补成现场答案。</p>

<details data-knowledge-key="multi-agent"><summary><strong>（6）为什么需要 Agent 群聊，怎样证明已经落地？</strong></summary></details>
<p>先说明业务是否真的需要多角色协作，再比较单 Agent、工作流和群聊方案的成本与收益。用可运行路径、职责协议和任务验收证明落地，不能靠聊天界面或多个角色名字判断架构有效。</p>

<details data-knowledge-key="algorithm-array"><summary><strong>（7）给定非负数，怎样求平方根并处理两位小数精度？</strong></summary></details>
<p>先澄清负数、误差与取整约定，再在包含平方根的区间上二分，注意小于一时右界不能直接取原数。按精度或迭代上限终止，比较乘法时还要考虑溢出，显示两位小数与计算误差是两个问题。</p>
