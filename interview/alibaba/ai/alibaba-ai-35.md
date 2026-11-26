阿里云 AI 应用开发二面的问题整理。以下回答思路为编辑补充，不代表当事人的现场回答；实习项目的具体实现与结果仅按本人实际经历说明。

## 面试问题

<details data-binding-status="pending_semantic_verification"><summary>（1）实习项目深挖（具体追问未记录）。</summary><p>关联知识点待核实。</p></details>
<p>原文没有记录具体项目、追问对象或现场回答，具体问题仍待补充。先说明业务目标、已有系统与自己负责的边界，再沿一条实际请求讲清输入、处理和交付物。用可核对的改动、用例或结果解释关键选择，区分团队成果与个人贡献，不补写未发生的上线收益。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（2）如何设计评价体系？是否搭建过相应的评测系统？</summary></details>
<p>先确定业务任务与可判定的成功标准，再准备有代表性且与开发数据隔离的样本，分别观察最终结果和执行轨迹。说明判分方式、基线、重复试验与失败分类；若搭建过系统，再按真实实现交代任务运行、结果存储和回归流程。</p>

<details data-knowledge-key="multi-agent"><summary>（3）项目是否使用多智能体？整体工作流是什么，为什么这样选型？</summary></details>
<p>先按真实项目说明是否使用多智能体，再画清职责、输入输出、状态传递与汇总方式。把单流程或单智能体作为对照，解释任务独立性带来的收益，以及通信、冲突、延迟和失败恢复的代价，不能用角色数量证明方案更好。</p>

<details data-knowledge-key="rag-pipeline"><summary>（4）知识库如何搭建？做过哪些性能优化？</summary></details>
<p>沿数据清洗、切分、索引、检索、重排与证据装配说明知识库链路，再先测量瓶颈和质量损失。按真实结果比较检索参数、索引或缓存等改动，同时观察召回质量、延迟与成本；原文未给具体实现，不能把这些候选方案当作作者做过的优化。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）实践中遇到过哪些困难，如何解决？</summary><p>关联知识点待核实。</p></details>
<p>原文没有记录具体项目、追问对象或现场回答，具体问题仍待补充。选择一次真实问题，交代预期与实际行为的差异，以及当时的约束。沿复现、证据、假设验证、修复和回归说明自己的行动，并保留尚未解决的部分，避免只报框架名称或将一次偶然成功当成修复。</p>

<details data-binding-status="pending_semantic_verification"><summary>（6）针对实习工作内容的询问（具体问题未记录）。</summary><p>关联知识点待核实。</p></details>
<p>原文没有记录具体项目、追问对象或现场回答，具体问题仍待补充。按自己负责的模块、日常任务、协作接口与交付阶段说明工作，准备一两个可继续追问的具体例子。个人完成、他人指导和团队发布分别交代；涉及内部代码或业务数据时，只说明获准公开的内容。</p>

<details data-binding-status="pending_semantic_verification"><summary>（7）编程任务：实现日志分析系统，计算关键指标。</summary><p>关联知识点待核实。</p></details>
<p>原文没有给出日志格式、指标定义、输入输出或规模，完整题目条件仍待补充。可以先澄清统计对象、时间窗口、失败判据与坏数据处理，再设计解析和聚合；具体代码与结果必须以澄清后的条件为准，不能自行还原题目。</p>

<details data-knowledge-key="agent-coding"><summary>（8）平时使用 AI 的频率如何，占比多少？</summary></details>
<p>用实际任务说明在哪些环节使用 AI，例如理解代码、生成候选补丁或辅助检查，并解释自己怎样验证结果。谈占比时说明统计时段与分母，没有记录就如实说明估计范围，不能替作者补写比例，也不能把生成代码量直接当作提效证据。</p>

## 关联复习

- [项目经历与面试表达](../../../knowledge/career/agent-resume-interview.md)
- [Agent 评测](../../../knowledge/llm/production/agent-eval-framework.md)
- [多智能体选型](../../../knowledge/llm/agent/multi-agent.md)
- [RAG 知识库](../../../knowledge/llm/rag/rag-pipeline.md)
- [日志与指标](../../../knowledge/backend/devops/logging-monitoring.md)
- [AI 编程与验证](../../../knowledge/llm/agent/agent-coding.md)
