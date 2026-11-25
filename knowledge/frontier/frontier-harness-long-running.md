本期专题是 Harness 与长任务。Harness 指包在模型外面的那一层：循环、工具、上下文管理、检查和恢复。同一个模型，Harness 不同，能连续干多久、干成什么样差别很大。

> **本期 30 秒版**
> 1. 长任务靠分工和验收撑住，但 Harness 要跟着模型变：Anthropic 用规划、生成、评估三个角色做出了单 Agent 那次没做成的应用，换了更强的模型后又把其中一部分拆掉了。
> 2. 把「大脑」和「手」分开：Anthropic 的 Managed Agents 把模型循环、执行环境和会话日志拆成三块，首个 token 的等待时间中位数降了约 60%。
> 3. 不训练模型，只改 Harness 也能省一半 token：SoL-Pi 论文在 EdgeBench 上少用 49.0% 的 token，保住了原方案 93.7% 的得分。

## 1. Anthropic 的长任务 Harness：规划、生成、评估三个角色

**发生了什么**

Anthropic 2026 年 3 月 24 日发文 [Harness design for long-running application development](https://www.anthropic.com/research/harness-design-long-running-apps)（作者 Prithvi Rajasekaran），讲怎么让 Agent 连续几个小时做出一个完整应用。

文章先列了长任务里的三种典型失败：

- 跑久了前后不连贯。
- 「上下文焦虑」：模型觉得上下文快满了，就急着收尾。
- 自己评自己，总说做得好。

**做法**

拆成三个角色：

- **规划者**：把一句话需求展开成完整的产品规格。
- **生成者**：按冲刺一轮轮地做。
- **评估者**：用 Playwright 实际操作应用来验收，按事先定好的硬指标打分。

每一轮开工前，生成者和评估者先谈好一份「冲刺合约」，写明这一轮做完的标准是什么。

上下文方面，文章区分了两种做法：压缩是在原对话里做摘要，重置是带着交接文档开一个全新的对话。Claude Sonnet 4.5 需要重置才能克服上下文焦虑，Claude Opus 4.5 则不需要。

**关键数字**

| 任务 | 做法 | 时间 | 花费 | 结果 |
| --- | --- | --- | --- | --- |
| 做一个游戏制作工具 | 单 Agent | 20 分钟 | 9 美元 | 核心功能是坏的 |
| 同上 | 三角色 Harness | 6 小时 | 200 美元 | 规划成 10 轮冲刺、16 个功能，核心玩法能用，仍有瑕疵 |
| 做一个音乐制作工具（Opus 4.6，精简后的 Harness） | 去掉冲刺，评估只在最后做一次 | 3 小时 50 分钟 | 124.70 美元 | 完成 |

文章的总结是：Harness 里的每个部件都对应着一个「模型做不到某件事」的假设，模型每升级一次，这些假设都要重新检查，过时的就拆掉。

**和以前有什么不同**

以前把 Harness 当成越完善越好的基础设施。这篇的态度是它有保质期：为弱模型加的拐杖，到了强模型上是纯成本。另一点是验收必须由另一个角色、用真实操作来做，自评不可信。

**面试里怎么用**

被问「怎么让 Agent 完成几个小时的长任务」时：

> 我会从三方面入手。一是把规划、执行、验收分给不同角色，验收方要真的去操作产物，按事先约定的标准判，不能让执行方自评。二是管上下文，跑久了要么压缩要么带着交接文档重开对话，有的模型快到上限会急着收尾，必须重开才行。三是每一轮开工前先约定做完的标准。Anthropic 公布过对比，同一个任务单 Agent 20 分钟花 9 美元但核心功能是坏的，带 Harness 跑 6 小时花 200 美元，核心功能能用了。还有一点，Harness 的每个部件都是在补模型的短板，换了更强的模型要重新评估哪些可以拆掉。

**对应知识点**：[Agent Run Loop、轮次与终止条件](https://www.agent-journey.cn/knowledge?activeKey=agent-run-loop)、[上下文工程（Context Engineering）](https://www.agent-journey.cn/knowledge?activeKey=context-engineering)、[上下文压缩、摘要与裁剪](https://www.agent-journey.cn/knowledge?activeKey=prompt-context-compression)、[多智能体协作与适用边界](https://www.agent-journey.cn/knowledge?activeKey=multi-agent)

## 2. Managed Agents：把大脑、手和会话拆开

**发生了什么**

Anthropic 2026 年 4 月 8 日发文 [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/research/managed-agents)，讲托管 Agent 服务的架构是怎么改的。

最早的做法是把所有东西放进一个容器：模型循环、工具执行、会话状态都在里面。问题是这个容器成了不能丢的「宠物」，它一出事，会话就没了，排查也困难。

新架构拆成三块：

| 部分 | 是什么 | 特点 |
| --- | --- | --- |
| 大脑 | 模型加 Harness 循环 | 无状态，挂了可以按会话编号重新拉起 |
| 手 | 沙箱和工具 | 用统一的「执行」接口调用，可以随时丢弃重建 |
| 会话 | 只追加的事件日志 | 独立存放，是恢复的依据 |

几个细节：

- 容器挂了不是系统故障，而是作为一次工具调用的错误返回给模型，由模型决定是否重试。
- 凭证不让沙箱里的生成代码碰到：MCP 工具的 OAuth 令牌放在保险库里，由代理取用；Git 令牌在初始化沙箱时接到仓库上，Agent 自己不经手。Harness 始终不知道任何凭证。
- 拆开之后，不需要等容器启动就可以开始推理。首个 token 的等待时间，中位数降了约 60%，95 分位降了 90% 以上。

**和以前有什么不同**

以前谈 Agent 的容灾，重点是「定期存检查点」。这篇把状态直接从运行环境里拿了出去：日志是唯一的事实来源，大脑和手都可以随时换。这样恢复不是一个特殊流程，而是常规操作。

**面试里怎么用**

被问「Agent 服务怎么做高可用」或「执行环境挂了怎么办」时：

> 我会把三样东西分开：跑模型循环的部分、执行工具的沙箱、会话日志。日志只追加、独立存储，是唯一的事实来源。循环那层不存状态，挂了按会话编号读日志重新拉起；沙箱挂了就当成一次工具调用失败返回给模型，由它决定重试还是换路。凭证放在保险库里通过代理用，不进沙箱。Anthropic 的托管 Agent 就是这样拆的，拆完后首 token 延迟的中位数降了大约六成，因为不用等容器起来就能开始推理。

**对应知识点**：[失败分类、重试、补偿与恢复](https://www.agent-journey.cn/knowledge?activeKey=agent-failure-recovery)、[状态备份、灾难恢复与任务重放](https://www.agent-journey.cn/knowledge?activeKey=agent-disaster-recovery)、[工作流状态、检查点与断点续跑](https://www.agent-journey.cn/knowledge?activeKey=agent-workflow-state)、[从零构建 Agent 运行时](https://www.agent-journey.cn/knowledge?activeKey=build-agent-framework)

## 3. SoL-Pi：不动模型，只改 Harness 来省 token

**发生了什么**

NVIDIA、NTU、MIT 的论文 [SoL-Pi](https://arxiv.org/abs/2609.20519)（arXiv，2026-09-17）用一个自动研究的循环去反复改进一个现成的 Agent Harness（Pi），全程不训练模型。

最终留下的改动有四类：

- 把连续的几个动作合并成一次调用。
- 运行中随时压缩上下文。
- 把工具返回的观察结果打包精简。
- 压缩时专门保留证据类的内容。

**关键数字**

在 EdgeBench 上，相对原来的 Pi：

| 模型 | token 用量 | 成本 | 得分保留 |
| --- | --- | --- | --- |
| GPT-5.6 Sol | 少 49.0% | 低 33.2% | 93.7% |
| Claude Opus 5（直接迁移同一套改动） | 少 44.7% | 低 33.5% | 94.3% |

注意得分并没有完全保住，是用约 6% 的得分换了近一半的 token。

**和以前有什么不同**

降本的常见手段是换小模型、做缓存。这篇说明 Harness 本身就有很大的优化空间：工具结果怎么回、动作怎么合并、什么时候压缩，都直接决定 token 用量。而且这些改动在一个模型上调出来，换到另一个模型上仍然有效。

**面试里怎么用**

被问「Agent 的成本怎么优化」时：

> 除了换模型和用缓存，Harness 层面还有三处可以做：工具返回的内容先精简再给模型，连续的小动作合并成一次调用，上下文在运行中压缩并优先保留证据。有论文只做这类改动、不训练模型，token 用量少了近一半，成本降了三分之一，得分保住了百分之九十四左右。这里有取舍，要用评测集看着得分掉多少来决定压到什么程度。

**对应知识点**：[Token、延迟与成本优化](https://www.agent-journey.cn/knowledge?activeKey=llm-cost-optimize)、[上下文压缩、摘要与裁剪](https://www.agent-journey.cn/knowledge?activeKey=prompt-context-compression)、[Agent Run Loop、轮次与终止条件](https://www.agent-journey.cn/knowledge?activeKey=agent-run-loop)

## 练一练

### 高频考点题 1：为什么要单独的评估者

Anthropic 的长任务 Harness 为什么要设一个独立的评估者角色？

- A. 让生成者少写代码、少跑轮次，从而降低 token 用量
- B. 自评总说做得好，验收要另一个角色真实操作
- C. 评估者负责把一句话需求展开成产品规格
- D. 评估者替代上下文重置，解决上下文焦虑

**答案：B。** 评估者用 Playwright 实际操作应用来验收，每轮开工前先和生成者谈好冲刺合约；展开需求是规划者的职责。

### 高频考点题 2：大脑和手分开

Managed Agents 新架构里，哪一部分是恢复会话的依据？

- A. 跑模型循环的大脑，因为它保存全部状态
- B. 沙箱容器，因为工具执行结果都在里面
- C. 系统提示词，因为它描述了任务
- D. 独立存放、只追加的会话事件日志

**答案：D。** 大脑无状态，挂了按会话编号读日志重新拉起；沙箱可随时丢弃重建，容器挂了只作为一次工具调用错误返回给模型。

### 高频考点题 3：Harness 的保质期

关于 Harness 部件，文章给出的态度是什么？

- A. 部件对应模型的短板，模型升级后要重新检查
- B. Harness 越完善越好，部件只增不减
- C. 强模型不需要 Harness，直接单 Agent 跑即可
- D. 部件一旦验证有效就应该固定下来，避免后续回归

**答案：A。** 为弱模型加的拐杖到强模型上是纯成本；例如换到 Opus 4.6 后去掉了冲刺，评估只在最后做一次，仍然完成了音乐制作工具。

## 参考资料

- [Harness design for long-running application development](https://www.anthropic.com/research/harness-design-long-running-apps)，Anthropic，2026-03-24
- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/research/managed-agents)，Anthropic，2026-04-08
- [SoL-Pi: Recursively Scaling Auto-Research Loops for Efficient Agent Harness](https://arxiv.org/abs/2609.20519)，arXiv 2609.20519，2026-09-17

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
