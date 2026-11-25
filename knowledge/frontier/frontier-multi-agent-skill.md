本期专题是多 Agent 与 Skill。过去一年「多 Agent 架构」几乎是项目介绍的标配，而现在厂商的建议在往回收：能用一个 Agent 加 Skill 解决的，就不要拆子 Agent。

> **本期 30 秒版**
> 1. Anthropic 建议把子 Agent 收回主循环：在多个企业部署的对比里，一个带 Skill 的单 Agent 经常比子 Agent 方案质量更好，成本和延迟也往往更低。
> 2. Skill 多了，怎么选对成了新问题：Skill Adapter 论文测到，Skill 池从 50 个涨到 1000 个时，对比方法的成功率从约 87% 掉到约 60%。
> 3. Skill 还可以反过来当训练材料：Skill2Env 从 Skill 自动生成 2963 个可执行任务，用来训练模型。

## 1. Anthropic：什么时候该把子 Agent 收回主循环

**发生了什么**

Anthropic 2026 年 10 月 22 日发了一篇面向企业的实践文章 [When to fold subagents into your main agent loop](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)（作者 Diane Sarkis）。核心建议是：少用子 Agent，改用渐进式披露的上下文和工具，可以在提升质量的同时降低成本和延迟。

文章给的依据来自多个企业部署的对比：一个带 Skill 的单 Agent，经常同时胜过「一个大提示词包办一切」和「拆成子 Agent」两种设计。文章没有给出部署数量和具体百分比，用词是「经常」「往往」。

**子 Agent 为什么会泛滥**

文章的观察是，很多企业给每个团队或每类问题配一个子 Agent，最后 Agent 架构长成了组织架构图的样子。由此带来几个问题：

- Agent 之间传话会丢细节，像传话游戏。
- 子 Agent 越来越多，功能重叠，没有统一标准和负责人。
- 每个团队都往系统提示词里加一句，规则互相打架。
- 延迟变高。有一个客户对比后发现，单 Agent 循环比原来的多 Agent 方案快约 2 倍。

**推荐的做法**

一个模型、一个上下文窗口、一个带限制的工具循环。原来写在各个子 Agent 里的流程和领域知识改成 Skill，用到才加载；必须遵守的硬约束（校验、审批）放进工具里。工具按用户意图分组，而不是一个接口一个工具。文章提到，系统提示词里的工具定义超过 30 到 50 个，选工具的效果就会变差。

组织上，一个中心团队负责整体质量和系统提示词，各业务团队从「拥有一个 Agent」改成「拥有自己的 Skill 和工具」。

**什么时候仍然该用子 Agent**

文章列了三种情况：

- 单 Agent 因为上下文膨胀出现了可测量的效果下降。
- 多个任务需要并行，各自用全新的、用完即弃的上下文。
- 单 Agent 选不好工具，或者系统提示词里有互相冲突的指令。

**怎么迁移**

先建评测集（文章说 10 条标准样例就够起步），再把子 Agent 当工具调用拿到基线，然后一次只收一个：提示词改成 Skill，接口调用改成 MCP 工具，对比收之前和收之后的评测结果。要看具体哪些用例变了，而不只看总分，每个用例多跑几次。只有收回后分数变差的子 Agent 才保留。

**和以前有什么不同**

以前被问「为什么用多 Agent」，回答「职责分离、各司其职」就够了。现在只靠这个理由就不够了：职责分离往往可以靠 Skill 实现，不一定需要独立的上下文。按这篇文章的建议，拆子 Agent 要落在上面三种情况里，并且用评测验证。

**面试里怎么用**

被问「你的项目为什么用多 Agent」或「单 Agent 和多 Agent 怎么选」时：

> 我默认从单 Agent 加 Skill 开始。流程和领域知识写成 Skill 按需加载，硬约束放进工具，这样没有 Agent 之间传话丢信息的问题，延迟也低。只有三种情况我才拆子 Agent：上下文膨胀导致效果可测量地下降；任务需要并行并且各自要干净的上下文；工具太多选不准，或者指令互相冲突。拆不拆用评测说话，把子 Agent 收回主循环后分数没掉，就不该保留它。Anthropic 最近给企业的建议也是这个方向。

**对应知识点**：[多智能体协作与适用边界](https://www.agent-journey.cn/knowledge?activeKey=multi-agent)、[Subagent 子智能体设计](https://www.agent-journey.cn/knowledge?activeKey=agent-subagents)、[Agent Skill：渐进式披露、热插拔与版本治理](https://www.agent-journey.cn/knowledge?activeKey=agent-skill-design)、[工具发现、选择与路由](https://www.agent-journey.cn/knowledge?activeKey=agent-tool-selection)

## 2. Skill Adapter：Skill 池变大以后，路由成了瓶颈

**发生了什么**

南京大学和江南大学的论文 [Skill Adapter](https://arxiv.org/abs/2611.17007)（arXiv，2026-11-12）处理两个问题：通用 Skill 怎么适配到具体用户，以及 Skill 很多时怎么选。

做法是把通用 Skill 和每个用户的「适配器」分开存，执行任务时先把任务拆成有依赖关系的步骤，再由一个路由 Agent 按当前步骤挑 Skill 和适用的适配器，路由最多选 8 个通用 Skill。路由和适配两个策略是训练出来的，执行任务的模型不动。

**关键数字**

| 对比项 | 对比方法 SkillRL | Skill Adapter |
| --- | --- | --- |
| ALFWorld | 87.14 | 95.48 |
| WebShop | 72.73 | 81.53 |
| SkillsBench | 21.43 | 38.57 |
| Skill 池从 50 个涨到 1000 个 | 约 87.2% 降到约 60.3% | 约 95.5% 降到约 80.4% |

最后一行最值得看：Skill 数量涨到 20 倍，参与对比的方法都在掉，只是掉得多少不同。

**和以前有什么不同**

渐进式披露解决的是「Skill 多了上下文放不下」，默认模型看着名字和描述就能选对。这篇说明，Skill 多到一定程度，光靠描述选不准，选择本身需要专门设计。这和第 1 条里「工具定义超过 30 到 50 个，选择效果下降」是同一个问题。

**面试里怎么用**

被问「Skill 或工具很多的时候怎么办」时：

> 渐进式披露只解决了上下文占用，没解决选得准不准。有论文测过，Skill 池从 50 涨到 1000，成功率会明显下降。我的做法是分两层：先按任务检索或路由出少量候选，再让模型在候选里选；同时控制描述的质量，让每个 Skill 的触发条件互不重叠。评测时要单独看「有没有加载对的 Skill」，不能只看最终结果。

**对应知识点**：[Agent Skill：渐进式披露、热插拔与版本治理](https://www.agent-journey.cn/knowledge?activeKey=agent-skill-design)、[工具发现、选择与路由](https://www.agent-journey.cn/knowledge?activeKey=agent-tool-selection)

## 3. Skill2Env：从 Skill 反推训练任务

**发生了什么**

论文 [Skill2Env](https://arxiv.org/abs/2609.33772)（arXiv，2026-09-27）换了一个方向用 Skill：不是让 Agent 在运行时读 Skill，而是从 Skill 自动生成可执行的终端任务，用来训练模型。

它一共生成了 2963 个任务。用其中 1500 条轨迹对 Qwen3.6-35B-A3B 做监督微调后，7 个基准的平均分从 36.6 升到 45.0，Terminal-Bench 2.1 从 44.9 升到 58.4。

**和以前有什么不同**

Skill 原本是「写给模型看的说明书」。这篇把它当成能力的描述：一份 Skill 说明了某件事该怎么做，就可以据此造出考这件事的环境和任务。这给训练数据和评测用例提供了一个新的来源。

**面试里怎么用**

被问「Agent 的训练数据或评测用例从哪来」时，可以补一句：

> 除了人工标注和线上日志，还可以从已有的 Skill 反推。一份 Skill 写清了某类任务的做法，就能据此自动生成对应的可执行任务，既能当评测用例，也能产出轨迹做微调。有论文用这个办法生成了近三千个任务，微调后在多个基准上都有提升。

**对应知识点**：[Agent Skill：渐进式披露、热插拔与版本治理](https://www.agent-journey.cn/knowledge?activeKey=agent-skill-design)、[Agent Benchmark 的设计与解读](https://www.agent-journey.cn/knowledge?activeKey=agent-benchmark)

## 练一练

### 高频考点题 1：默认架构

按 Anthropic 给企业的建议，Agent 默认应从什么架构开始？

- A. 每个团队配一个子 Agent，让架构对齐组织架构
- B. 一个大提示词包办全部流程和知识
- C. 单模型单上下文的工具循环，知识写成 Skill
- D. 先拆成尽可能多的子 Agent，再根据效果逐步合并

**答案：C。** 硬约束放进工具，流程知识用 Skill 渐进式披露；按组织架构拆子 Agent 会带来传话丢细节、功能重叠和规则打架。

### 高频考点题 2：仍该用子 Agent 的情况

下列哪种情况属于文章认为仍应拆子 Agent 的情形？

- A. 任务要并行，各自需要用完即弃的上下文
- B. 每个业务团队都想拥有自己的 Agent
- C. 系统里的职责可以清楚地划分成几块
- D. 希望项目介绍里能体现出多 Agent 架构的设计

**答案：A。** 另外两种是上下文膨胀导致可测量的效果下降、以及工具选不准或指令互相冲突；单纯的职责分离往往可以靠 Skill 实现。

### 高频考点题 3：Skill 池变大

Skill Adapter 的实验说明 Skill 池从 50 个涨到 1000 个时会出现什么问题？

- A. 上下文放不下全部 Skill，渐进式披露彻底失效
- B. Skill 文件格式开始不兼容
- C. 执行任务的模型必须随 Skill 数量重新训练
- D. 只靠描述选不准，选择需要专门设计

**答案：D。** 对比方法成功率从约 87% 降到约 60%；渐进式披露只解决上下文占用，选得准不准需要检索或路由先出少量候选。

## 参考资料

- [Building agents: When to fold subagents into your main agent loop](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)，Anthropic，2026-10-22
- [Skill Adapter: Personalized Modification and Online Routing of General-Purpose Skills](https://arxiv.org/abs/2611.17007)，arXiv 2611.17007，2026-11-12
- [Skill2Env: Capability-Oriented Environment Synthesis from Skills for General Agents](https://arxiv.org/abs/2609.33772)，arXiv 2609.33772，2026-09-27

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
