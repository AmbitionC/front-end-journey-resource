### 百度 Agent 秋招二三面：记忆、工具可靠性与运行循环

两份记录发表于 2026 年 8 月，分别自述百度 Agent 秋招二面与后续三面，标题给出 8 月 7 日和 18 日但未注明面试年份。此处复用同一流程页面，保留原有执行范式与记忆问题，并补充三面的可确认追问；具体部门、模型和配置未披露。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-knowledge-key="agent-paradigms"><summary><strong>（1）已有助手怎样从提示推理扩展为规划与行动？</strong></summary></details>
<p>先分清纯提示推理与真正执行外部动作。任务结构较稳定时可显式规划再执行；下一步依赖工具观察时可采用 ReAct，或在大计划中嵌入局部循环和受控重规划。先比较同任务的成功率、延迟与成本，并保留权限、状态和停止条件；换范式名称不等于效果提高。</p>

<details data-knowledge-key="agent-memory-architecture"><summary><strong>（2）短期记忆、长期记忆与上下文压缩怎样配合？</strong></summary></details>
<p>短期状态保存当前任务和近期对话，长期记忆保存经核验、有用途和作用域的跨会话事实。模型输入只是从这些数据中选择的有限工作视图；压缩保留目标、约束、来源和未完成动作，原始记录可追溯。摘要更短不代表已成为长期事实，也不能覆盖用户的新指令。</p>

<details data-knowledge-key="agent-tool-design"><summary><strong>（3）怎样提高大模型工具调用的准确性？</strong></summary></details>
<p>先定义清楚工具职责、参数 Schema、权限和错误语义，再用代表性任务检验选择及参数是否正确。执行前校验、执行后验证真实结果，并区分格式合规与任务完成，不能靠模型自述保证准确。</p>

<details data-knowledge-key="agent-coding"><summary><strong>（4）使用编程助手时，怎样组织自己的工作流程？</strong></summary></details>
<p>用真实任务说明如何提供上下文、拆分改动、限制工具范围并验证结果。保留测试、代码复核和可恢复的版本记录，原帖没有披露具体配置，不能补造个人使用习惯。</p>

<details data-knowledge-key="agent-timeout-budget"><summary><strong>（5）Agent Loop 响应慢时怎样优化？</strong></summary></details>
<p>先沿运行轨迹分解模型、工具、检索、排队和重复循环的耗时，再优化实际关键路径。比较缩短上下文、独立任务并行及减少无效轮次的收益，同时检查质量、并发上限和尾延迟。</p>
