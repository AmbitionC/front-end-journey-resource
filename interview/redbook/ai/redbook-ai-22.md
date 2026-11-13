### 小红书 AI 全栈开发实习一面：多 Agent、Harness 与项目评测

这份个人回忆记录了小红书 AI 全栈开发实习一面，作者自述约 40 分钟围绕项目讨论，且记忆不完整。本文只整理已见文字；附图占位的内容未核验，面试年份未确定，不补充未披露的技术细节。记录中的自我介绍与反问没有具体内容，仅作为面试环节背景。

以下短答为编辑整理的回答思路，不代表当事人的现场回答或项目真实实现。

<details data-knowledge-key="multi-agent"><summary>（1）项目是做什么的？为什么要做成多 Agent，具体怎样编排？</summary></details>
<p>先说明项目目标与任务依赖，再解释哪些子任务需要独立上下文和多轮探索，以及结果如何交接、验证。用同一批任务与可比较预算对照单 Agent 或固定流程，说明收益能否覆盖交接、延迟和成本；原帖没有披露项目拓扑或实际对比结果。</p>

<details data-knowledge-key="agent-skill-design"><summary>（2）什么是 Skill？</summary></details>
<p>Skill 将一类任务的操作说明与所需资源组织成可复用单元，通常先提供描述，命中后再按需加载正文或脚本。说明它教 Agent 怎样做事，而工具负责执行动作；具体加载与权限仍由宿主实现，不能把 Skill 当作额外授权。</p>

<details data-knowledge-key="rag-pipeline"><summary>（3）项目的 RAG 是怎么做的？向量数据库相关方案是什么？</summary></details>
<p>沿离线解析、切块、向量化与索引，再到在线召回、上下文组装和生成，说明项目链路及向量库承担的检索职责。结合数据更新、权限与评测解释选择，区分检索不到证据和生成未正确使用证据；原帖未给出数据库产品、参数或实际实现。</p>

<details data-knowledge-key="build-agent-framework"><summary>（4）了解什么是 Harness 吗？</summary></details>
<p>Agent Harness 是围绕模型组织输入、驱动循环、编排工具并交付结果的运行支撑。可从工具执行、状态与上下文、权限和停止条件解释职责，同时区分用于运行与评分的 Evaluation Harness；原帖没有提供当事人的定义或实现。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（5）项目如何评测、取得了什么成果？同事是否反馈过准确率表现？</summary></details>
<p>先定义任务成功条件、评测集、评分方法和准确率分母，再结合轨迹与实际产物比较基线，说明成果和失败案例。同事反馈应作为排查线索，经核验后补入回归用例；原帖没有给出任何真实指标或同事评价，不能替项目报数。</p>

<details data-binding-status="pending_missing_keyword"><summary>（6）项目有没有做 *** 功能（原文记为“xx”，功能名待补）？</summary></details>
<p>原帖只记为“xx”，无法判断是关键字被遮蔽还是作者未记录，具体功能名待补。补齐原题后才能讨论实现；目前不能推测具体功能或补写实现思路。</p>
