### 阿里国际 Accio Agent 算法一面：数据合成、任务环境与 GUI Agent

这轮一面围绕实习经历展开，追问数据合成、Auto Research、通用 Agent 任务环境、模型效果和 GUI Agent，候选人还反问了 AI/Agent 落地、商业前景与模型训练情况。原记录未披露绝对面试日期或具体模型参数量。作者听下来觉得可能偏 Accio Work 的模型后训练，这只是其面试印象，不能升级为团队已披露的岗位职责。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）怎样介绍 Agent 算法方向的实习经历？</summary>
</details>

先用“业务目标—任务环境—数据—训练或推理链路—评测”说明项目全貌，再明确本人负责的模块。效果不能只报一个总分，应交代基线、测试集、关键指标和失败类型；若项目仍在实验阶段，就把已验证结论和待验证假设分开。这样既能体现算法工作，也能说明方案如何服务真实任务。

<details data-knowledge-key="llm-training-overview">
<summary>（2）Agent 数据合成应该怎样设计？</summary>
</details>

先定义目标任务分布和能力标签，再从真实请求模板、规则组合、模型生成或环境采样构造候选。候选数据要经过格式校验、去重、难度分层、污染检查和可执行验证，必要时由规则、模拟器或人工复核答案。训练集、验证集和测试集应按用户、模板或任务族隔离，避免同源泄漏导致指标虚高。

延伸阅读：[LLM 训练全流程概览](../../../knowledge/llm/basics/llm-training-overview.md)、[Agent 仿真测试与模拟环境](../../../knowledge/llm/production/agent-simulation.md)。

<details data-knowledge-key="agent-resume-interview">
<summary>（3）怎样介绍 Auto Research 实习工作？</summary>
</details>

先说明研究任务、可用环境和本人负责的模块，再讲目标如何拆分、怎样执行与评估、失败案例和已验证结果。原记录只写了 Auto Research，没有披露它具体是资料研究还是自动实验流程；介绍时应以自己的真实工作为准，不能从名称推断系统的检索、训练或实验链路。

<details data-knowledge-key="agent-simulation">
<summary>（4）怎样合成通用 Agent 的任务环境？</summary>
</details>

任务环境至少包含初始状态、可用工具、状态转移、成功判据、失败条件和可重置机制。合成时既要覆盖标准路径，也要注入权限拒绝、超时、脏数据、工具返回异常和中途状态变化。可以用确定性规则或隐藏测试充当 verifier，并保存完整轨迹，确保任务能够复现、评分和归因。

<details data-knowledge-key="agent-evaluation">
<summary>（5）怎样评测 Agent 的模型效果？</summary>
</details>

原记录只写了“模型效果”，未披露评测方法或指标。准备时先明确任务目标、测试集、对照基线和指标；除最终输出外，还可把轨迹质量作为教学扩展来检查工具选择、参数、执行顺序、权限、状态变化、证据引用与多余副作用。版本对比应固定任务集，结合任务完成率、步骤成功率、成本、延迟与人工接管率定位失败；这些是通用作答方法，不代表当时团队使用的评测方案。

延伸阅读：[Agent 评测体系](../../../knowledge/llm/agent/agent-evaluation.md)。

<details data-knowledge-key="agent-computer-use">
<summary>（6）GUI Agent 的难点和验证方法是什么？</summary>
</details>

GUI Agent 需要把截图或界面结构解析为可操作对象，结合目标选择点击、输入、滚动等动作，并在每步后重新观察状态。难点包括视觉定位漂移、动态页面、遮挡、异步加载和高风险操作。验证时不只比较最终页面，还要检查关键状态、动作是否合法、是否误操作，并在付款、发送和删除等动作前设置确认门禁。

延伸阅读：[Computer Use Agent](../../../knowledge/llm/agent/agent-computer-use.md)。

<details data-knowledge-key="llm-training-overview">
<summary>（7）候选人反问了哪些 AI/Agent 落地、商业前景与模型训练问题？</summary>
</details>

反问围绕 AI/Agent 的落地情况、商业前景、训练模型的参数量与训练阶段展开。原记录未给出参数量和业务结论，不能补成事实。准备此类交流时，可区分预训练、中期训练和后训练的目标，再结合稳定失败、可用数据与收益成本讨论是否值得训练；这些是通用讨论方法，不能当作当时团队披露的方案。

延伸阅读：[模型对齐与后训练](../../../knowledge/llm/basics/llm-alignment.md)。
