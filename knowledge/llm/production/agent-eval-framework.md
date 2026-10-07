Agent 会选择工具、改变外部状态并持续执行。评测因此要回答三个问题：任务是否完成，执行过程中是否遵守约束，结果为什么成功或失败。最终回复只是其中一项证据；写了“已经完成”，不等于文件存在、代码可用或业务状态已经更新。

## 先分清五个概念

| 概念 | 含义 | 容易混淆的边界 |
| --- | --- | --- |
| 任务用例（task/case） | 用户输入、初始环境、允许动作、成功判据组成的评测单位 | 一道问题加一句参考答案，往往不足以描述可执行任务 |
| 一次执行（trial） | 某个 Agent 版本在该用例上的一次完整运行 | 同一用例重复运行，可能走出不同路径 |
| 执行轨迹（trace） | 可记录的模型与工具交互、返回值、时间和错误 | 轨迹记录不等于模型隐藏的思维过程，也不保证日志完整 |
| 环境结果（outcome） | 执行后实际存在的状态或产物 | 要从环境、文件、数据库或测试读取，不能只接受 Agent 自述 |
| 评分器（grader） | 按成功判据检查证据、给出分数或判断的程序、模型或人工流程 | 评分器也会出错；评分结果不是未经核验的真值 |

这组区分让“有没有做成”和“怎么做的”可以分别检查。不同路径可能达到同一个有效结果；同一句最终回复也可能对应完全不同的环境状态。[Anthropic：Agent 评测的基本概念](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。

## 一次评测如何运行

![Agent 评测结构：执行器恢复隔离环境并启动 Agent，轨迹和实际状态分别送入评分器，成功规则直接约束评分，最后形成结果报告。](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-eval-framework-task-trace-outcome-archify-v1.png)
*图：使用 Archify v2.16.0 绘制；验收同时读取运行轨迹和环境终态，成功规则由评分器检查。*

图中的任务用例提供输入、初始状态和成功规则。评测执行器（Eval Runner）恢复隔离环境后启动 Agent；Agent 调用工具，环境返回结果并保存实际变化。运行结束后，轨迹记录（Trace Log）与状态快照（State Snapshot）分别进入评分器（Graders），再汇总为带理由和场景分类的报告。

成功规则中的隐藏验收条件供评分器使用，不应作为额外提示泄露给被测 Agent；Agent 可以知道正常任务本来就应告知的要求。轨迹采集、状态读取和评分应尽量由被测 Agent 之外的评测系统完成，避免让它自己决定“是否通过”。

隔离环境尤其重要：前一次执行留下的文件、数据或缓存，可能帮助下一次执行碰巧通过。恢复初始状态，是让两次比较面对同一道任务的前提。τ-bench 采用任务目标与环境数据库终态的比较来验收执行，说明对有状态任务，验收可以独立于对话措辞。[τ-bench 原始论文](https://arxiv.org/html/2406.12045v1)。

## 成功判据先于评分方法

写用例时，先明确目标和限制，再决定怎样判分。至少要能回答：用户要什么，起始环境是什么，哪些动作允许，什么状态算完成，哪些情况即使结果看似正确也不能通过。

例如，“导出订单汇总”可以要求指定范围、字段和一致的合计，允许不同的查询与计算路径；只读任务则不能通过偷偷修改数据来让结果成立。这些是设计示例，具体条件应来自业务要求，而非随意增加的评分偏好。

对于有硬约束的任务，可以把成功定义为“目标成立，并且全部硬约束满足”。再单独报告表达质量、延迟和成本。若把权限违规与漂亮文案一起求平均，较高的文案分数就可能掩盖一次不可接受的执行。

| 证据维度 | 适合检查什么 | 不能单独证明什么 |
| --- | --- | --- |
| 最终回复 | 内容正确性、表达完整性、是否明确说明未完成 | 外部写入真的成功、产物真的可用 |
| 环境状态与产物 | 文件内容、数据变化、测试结果、任务终态 | 中途是否越权、是否造成过已被回滚的副作用 |
| 执行轨迹 | 工具与参数、异常恢复、禁止动作、耗时去向 | 最终任务一定完成；日志缺失时尤其不能据此下结论 |

因此，验收结果与检查过程互相补充。过程约束应只检查业务真正要求的条件；如果把一条示范工具序列当成唯一正确路径，就会误拒绝有效的替代方案。

## 确定条件用程序，开放质量用经校准的判断

程序评分适合结构、数值、状态与测试这类可执行规则。例如 Coding Agent 声称修好了缺陷，应检查原失败测试是否通过，以及需要保留的原通过测试是否仍通过；SWE-bench 的评分实现就区分这两类测试。测试通过只能说明满足了相应测试的条件，不能证明所有可能输入都正确。[SWE-bench 评分实现](https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/grading.py)。

对于解释是否清晰、总结是否覆盖重点等开放质量，可以使用模型评分，但应给出明确量表、必要证据和经人工审核的示例。裁判输出的分数与理由仍需抽查；它可能偏好较长回答，或在成对比较中受答案位置影响。早期 MT-Bench 研究分析了这些偏差，具体强度依赖当时的模型和实验，不能直接当成今天所有裁判的表现。[LLM-as-a-judge 原始研究](https://arxiv.org/html/2306.05685v4)。

实践中可以抽取成功、失败和边界案例，与人工判断比较，查看裁判最常错在哪类任务；成对比较时交换或随机化顺序，观察结论是否改变。人工判断也要有一致规则，并处理意见分歧。模型、程序和人工各自适合不同证据，不必把所有维度压成一个模型总分。[OpenAI：评测与人工校准](https://developers.openai.com/api/docs/guides/evaluation-best-practices)。

证据缺失时应输出“无法判断”或明确的错误状态。例如测试容器未启动，不能记为测试通过，也不应未经诊断就归因于 Agent 能力。报告应同时列出计划执行数、有效执行数、环境故障数和任务失败数，说明分母，避免靠删除坏运行抬高成功率。

## 回归比较为什么要看切片和重复执行

Agent 的改动可能影响工具选择、提示词、检索、上下文管理或运行逻辑。为了判断改动是否有效，应保存基线版本、用例版本、环境配置、工具版本、预算和评分规则，再在可比较条件下运行新版本。固定这些条件能够减少混杂因素，但不保证模型每次输出完全相同。

按任务类型、歧义程度、执行长度或已知失败模式拆分结果，能发现总分掩盖的退化。例如一项改动提高了普通检索成功率，却降低了需要澄清的查询成功率；若普通检索占比很高，平均值仍可能上升。此时应检查变化发生在哪些任务，以及失败轨迹是否指向同一原因。

同一任务重复执行，可以观察偶然成功与持续可靠性的差别。“k 次里至少成功一次”和“k 次全部成功”回答不同问题，不能相互替代；只有在独立、同分布等假设成立时，才适合用简单概率公式互推。重复次数、重试政策和环境故障处理方式都应随结果一起报告。[τ-bench：重复执行的可靠性指标](https://arxiv.org/html/2406.12045v1)。

用于开发的错例集可以持续加入新案例，回归集保留已解决的问题，独立保留集用于检查对未参与调优任务的表现。反复根据保留集失败去改系统，会逐渐失去独立评估的意义；应记录数据用途与版本，而不是把同一批题同时用于调优和最终证明。

## 线上观测与离线评测如何形成闭环

离线评测在已知条件下比较版本，线上观测则反映真实任务分布和系统运行状况。二者可以共享失败分类和评分思路，但数据获取方式、可用证据及问题分布往往不同。[LangSmith：离线与线上评测](https://docs.langchain.com/langsmith/evaluation-concepts)。

负反馈是调查线索。用户不满意可能来自答案错误、需求被误解、响应太慢，也可能来自任务本身无法完成；沉默或点赞同样不能直接证明外部结果正确。将获准保留的记录脱敏后，结合工具轨迹与环境证据定位原因，再把能够复现且经过审核的任务加入适当的数据集。

长程任务的观测要区分正在取得进展、卡在重复调用和等待外部系统。执行较久不必然失败，是否超限应依据任务预算和完成条件；按不同任务分别观察耗时分布，比统一设置一条“慢即失败”的规则更有解释力。

对于无法取得后台数据的产品比较，统一可见的输入、任务目标、测试时间和可用资源，说明产品版本及观测边界。只能据此讨论外部表现，不能从结果倒推出其隐藏工具、数据或内部轨迹。

## 生成评测用例也需要独立验收

模型可以辅助扩充用例、扰动输入和提出候选成功条件，但生成器的输出仍是待审核材料。先用人工维护的少量真实任务确定任务分布和量表，再检查生成样本是否可执行、答案是否有独立证据、是否混入评测系统的隐藏判据。随机抽查不足时，另抽查失败、低置信度和分歧样本，保留被拒样本与理由。[OpenAI：评测与人工校准](https://developers.openai.com/api/docs/guides/evaluation-best-practices)。

比较版本还要保持切片权重可比。教学示例中，普通任务从 72/80 提高到 76/80，而边界任务从 12/20 降到 6/20，总成功数就从 84/100 降到 82/100；“大部分任务提升”不能推出整体提升。反过来，若新版本恰好测试了更多简单任务，未经固定分布或分层比较的总体分数也可能误导。示例数字用于解释计算，不代表真实产品成绩。

## 检查理解

下面两问用于自检理解：

- 两条不同调用路径都完成了任务，为什么可能都应通过？因为验收针对目标和必要约束，示范路径通常不是唯一有效实现。
- 最终回复正确、环境结果却错误时如何处理？按实际成功判据判失败或未完成，再用轨迹定位是理解、调用、执行还是验证出了问题。

## 相关考点与延伸阅读

本篇展开 Agent 评测框架这一核心主题，其余相关考点可继续阅读已有文章。以下链接对应现有知识条目。

| 相关考点 | 知识文章 |
| --- | --- |
| 评测框架、轨迹与结果 | [Agent 评测框架](https://www.agent-journey.cn/knowledge?activeKey=agent-eval-framework) |
| 修复错例与发现退化 | [Agent 提示词回归](https://www.agent-journey.cn/knowledge?activeKey=agent-prompt-regression) |
| 标题切分与整篇输入比较 | [RAG 文档分块](https://www.agent-journey.cn/knowledge?activeKey=rag-chunking) |
| 离线指标、线上反馈与错例回流 | [Agent 项目评测](https://www.agent-journey.cn/knowledge?activeKey=agent-project-evaluation) |
| 项目职责、设计和验证 | [Agent 项目展示](https://www.agent-journey.cn/knowledge?activeKey=agent-project-portfolio) |
| 查询意图消歧 | [RAG 路由](https://www.agent-journey.cn/knowledge?activeKey=rag-routing) |
| 自研循环、图编排与框架选择 | [构建 Agent 框架](https://www.agent-journey.cn/knowledge?activeKey=build-agent-framework) |
| 通用任务与竞品公平比较 | [Agent 基准评测](https://www.agent-journey.cn/knowledge?activeKey=agent-benchmark) |
| 单词与前缀查询 | [Trie](https://www.agent-journey.cn/knowledge?activeKey=algorithm-trie) |
| 有序数组的线性合并 | [数组算法](https://www.agent-journey.cn/knowledge?activeKey=algorithm-array) |

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 全栈一面：Pipeline 质量、Doris 与消息轮播（2026 年 9 月）](../../../interview/bytedance/base/bytedance-base-23.md)
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-26.md)
- [字节飞书 AI 应用一面：Runtime、评测与后端基础（2026 年 9 月发帖）](../../../interview/bytedance/base/bytedance-base-24.md)
- [腾讯 AI 开发一面：Coding Agent 记忆、评测与可靠运行（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-8.md)
- [字节 Agent 后端实习一面：LangGraph、评测集与混合检索（2026 年 9 月）](../../../interview/bytedance/base/bytedance-base-22.md)
- [字节 Agent 开发实习一面：自进化与评测（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-8.md)
- [字节抖音电商 Agent 一面：分层、上下文与 GRPO（2026 年 9 月发帖）](../../../interview/bytedance/base/bytedance-base-21.md)
- [深信服 Agent 开发一面：MCP、多 Agent、安全与网络（2026 年 8 月）](../../../interview/sangfor/ai/sangfor-ai-1.md)
- [字节 AI 平台一面：Agent 评测、框架与数据结构](../../../interview/bytedance/base/bytedance-base-33.md)
- [字节Agent全栈一面：工具、评测与编码](../../../interview/bytedance/base/bytedance-base-40.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../../interview/bytedance/base/bytedance-base-49.md)
<!-- interview-source-history:end -->


## 参考资料

引用用于核对技术概念；例子为教学设计，不代表实际产品数据。滚动文档核验于 2026-10-03，论文版本分别见原文。

- [Anthropic：Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)：任务、执行、轨迹、结果与评分器。
- [τ-bench 原始论文](https://arxiv.org/html/2406.12045v1)：有状态任务验收与重复执行指标。
- [SWE-bench 评分实现](https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/grading.py)：原失败测试和原通过测试的检查。
- [Judging LLM-as-a-Judge](https://arxiv.org/html/2306.05685v4)：裁判偏差及其边界。
- [OpenAI：Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)：任务专属评测、人工校准与持续评测。
- [LangSmith：Evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts)：数据集、实验及线上线下评测。
