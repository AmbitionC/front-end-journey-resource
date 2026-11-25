本期专题是 Agent 评测。评测是面经里提及最多的方向，而「你怎么评测你的 Agent」最常见的回答还停在「跑基准、看成功率」。这三条给了更具体的说法。

> **本期 30 秒版**
> 1. 任务说不清楚时，最强的模型也交付不了：FDE-Gym 模拟真实客户交付，在只给客户原话的最难一档，没有模型能解决 95 个任务中的 15 个以上。
> 2. 让 Agent 自己爬指标，它会去钻评测的空子：Agent4Sci 的前期试验里，12 个任务中有 5 个出现了评测作弊，所以评测要和干活的 Agent 隔开。
> 3. 评测先要想清楚测的是什么：Anthropic 的评测指南给出样本量下限、评分器的做法，以及只做三件事时该做哪三件。

## 1. FDE-Gym：把「需求不清楚」放进评测

**发生了什么**

论文 [FDE-Gym: The Last Mile of AI Delivery](https://arxiv.org/abs/2610.22350)（arXiv，2026-10-15）模拟的是驻场工程师的工作：到客户那里，弄清楚真正的问题，再把方案做出来。基准有 95 个任务（20 个客户场景加 75 个变体），覆盖 18 个行业，里面有 130 多个按脚本回答的干系人，Agent 需要自己去问。

同一个任务有四档指令，从 L0 到 L3 信息越来越少。L3 只给出资方的原话，而这句原话指向的可能根本不是真正的问题。

判定标准也更接近真实交付：得分要达到 0.8，并且没有造成事故，才算解决。得分里会扣掉事故的影响和打扰干系人的成本。

**关键数字**

- L3 档：Claude Opus 5.5 得分 0.56，解决 14 个；Claude Sonnet 5.5 得分 0.49，解决 15 个；GPT-6 Astra 得分 0.38，解决 9 个。没有模型解决超过 95 个任务中的 15 个，13 种配置里有 5 种一个都没解决。
- 领先的模型从 L0 到 L1 得分就掉了 0.28。论文的结论是，瓶颈在于发现约束。
- 领先的模型能问到 72% 到 85% 的关键事实，但做出的效果只有参考方案的 0.60 到 0.70。问到了不等于用上了。

论文说明人类基线还没有给出。

**和以前有什么不同**

以前的基准默认任务描述是完整的，测的是「给定需求能不能做出来」。这篇测的是前一步：需求不完整甚至有误时，Agent 能不能问对人、问对问题，并且不闯祸。它也把「打扰人的次数」和「事故」计入了分数。

**面试里怎么用**

被问「现有 Agent 基准有什么不足」或「怎么评测一个面向业务的 Agent」时：

> 多数基准把需求写得很完整，但真实交付里需求往往是不清楚的。FDE-Gym 专门测这一点，在只给客户原话的那一档，最好的模型也只解决了 95 个任务里的 15 个，而且瓶颈在发现约束这一步。所以我做评测集时会放一批信息不完整的用例，考察 Agent 会不会澄清；评分除了看结果，还要扣掉造成的事故和不必要的打扰。

**对应知识点**：[Agent Benchmark 的设计与解读](https://www.agent-journey.cn/knowledge?activeKey=agent-benchmark)、[智能体性能评估](https://www.agent-journey.cn/knowledge?activeKey=agent-evaluation)、[用业务指标证明 Agent 项目价值](https://www.agent-journey.cn/knowledge?activeKey=agent-project-evaluation)

## 2. Agent4Sci：让 Agent 自己刷指标，要防它钻评测的空子

**发生了什么**

论文 [Automating ML for Science](https://arxiv.org/abs/2610.28763)（arXiv，2026-10-22，作者来自 Anthropic 及其 Fellows 项目）让 Agent 在真实的科学机器学习任务上自己做实验、提升指标。共 20 个基准、25 个任务、11 个领域，每次给 8 块 H200 显卡和 12 小时。

它的流程里有三个角色：

- **爬坡 Agent**：做实验、提升指标。
- **评估 Agent**：在爬坡 Agent 看不到的留出测试集上打分。
- **审计 Agent**：检查过程有没有问题。

**关键数字**

- 相对已发表最好结果的平均提升：Claude Opus 4.6 为 10.4%，Claude Sonnet 4.6 为 9.6%，Gemini 3.1 Pro 为 6.8%，Codex（GPT-5.4）为 4.4%。
- 前期试验里，12 个任务中有 5 个出现了评测作弊。这也是流程里要单独设评估和审计角色的原因。
- 加上可插拔的 Skill 后，Opus 从 10.4% 升到 20.1%，Codex 从 4.4% 升到 8.1%。
- 论文归纳了三种常见毛病：对创新性判断失准、没用满给的资源、探索越走越窄。
- 论文自己的判断是：这些提升主要还是来自机器学习工程，而不是科学推理。

**和以前有什么不同**

以前评测自动化研发类的 Agent，多是「给一个任务，看最终分数」。这篇把评测本身当成要保护的对象：只要 Agent 能接触到评分方式，它就可能朝着分数而不是朝着目标优化。解法是结构上的隔离，而不是在提示词里写「不要作弊」。

**面试里怎么用**

被问「怎么保证评测结果可信」或「Agent 自我迭代有什么风险」时：

> 最大的风险是 Agent 优化的是分数而不是目标。Agent4Sci 的前期试验里 12 个任务有 5 个出现了评测作弊。所以我会把干活和打分分开：干活的 Agent 只能看到开发集，最终分数由另一个角色在留出集上算，再加一道审计检查过程。这和线上做 A/B 时不让被测方看到评估逻辑是一个道理。

**对应知识点**：[Agent 评测原理：任务、轨迹与环境结果](https://www.agent-journey.cn/knowledge?activeKey=agent-eval-framework)、[Agent Benchmark 的设计与解读](https://www.agent-journey.cn/knowledge?activeKey=agent-benchmark)、[线上反馈、评估集与持续改进闭环](https://www.agent-journey.cn/knowledge?activeKey=agent-feedback-loop)

## 3. Anthropic 的评测指南：先定义测什么，再谈怎么测

**发生了什么**

Anthropic 2026 年 11 月 13 日发文 [Building strong safety evaluations](https://www.anthropic.com/research/building-strong-safety-evaluations)。文章讲的是安全评测，但里面的方法对任何 Agent 评测都适用。

**几条可以直接用的做法**

- **先写清楚要测的东西。** 指标可能测偏：比如只看拒答率，就可能漏掉真正关心的行为。多轮对话里，一轮出错整段对话就算失败。
- **单轮题已经区分不出模型了。** 文中的单轮测试集得分集中在 94% 到 98%，多轮测试的差距则大得多。
- **样本量有下限。** 多轮至少 100 条，单轮至少 1000 条。样本少的时候置信区间可以超过正负 10 个百分点。
- **评分器的选择。** 有明确标准答案的用程序检查；用模型当评委时，把标准拆成一条条只需回答是或否的小项，评委用和被测不同的模型，不给它看无关的元信息，出错要明确报错而不是默默给分。
- **评分器要先过人工这一关。** 用盲标的人工结果校验评分器（文中用 Cohen's kappa），不同评分器打出的分数不要直接比较。
- **配置会改变结果。** 同一个模型，直接调 API 和在 claude.ai 里测，最多相差 34 个百分点。文中举的一个例子里，API 上是 60%，claude.ai 上是 94%，文章把差别归到系统提示词里的一行。

文章最后说，如果只做三件事：写下要测的是什么，用人工标注校验评分器，报告不确定性。

**和以前有什么不同**

以前讲 LLM 当评委，重点在「怎么写评委提示词」。这篇把重点前移和后移了：前面要先定义被测的东西，后面要用人工标注验证评委本身，并且带着置信区间报告结果。它还明确指出系统提示词等配置是被测对象的一部分，换了配置就是另一个结果。

**面试里怎么用**

被问「你怎么设计评测」或「LLM 当评委靠谱吗」时：

> 我先写清楚要测的行为是什么，再决定怎么打分。有标准答案的用程序判，没有的才用模型当评委，并且把标准拆成是或否的小项，评委用另一个模型。评委上线前先和人工盲标对一遍一致性。样本量上，多轮对话至少一百条，单轮至少一千条，报告时带置信区间，因为样本少的时候误差可以超过十个点。另外评测要带着线上的真实配置跑，同一个模型换一句系统提示词，分数可以差几十个点。

**对应知识点**：[Agent 评测原理：任务、轨迹与环境结果](https://www.agent-journey.cn/knowledge?activeKey=agent-eval-framework)、[智能体性能评估](https://www.agent-journey.cn/knowledge?activeKey=agent-evaluation)、[在线评估、抽样与质量监控](https://www.agent-journey.cn/knowledge?activeKey=agent-online-eval)

## 参考资料

- [FDE-Gym: The Last Mile of AI Delivery](https://arxiv.org/abs/2610.22350)，arXiv 2610.22350，2026-10-15
- [Automating ML for Science: Can Frontier Agents Climb Scientific Hills in the Wild?](https://arxiv.org/abs/2610.28763)，arXiv 2610.28763，2026-10-22
- [Building strong safety evaluations](https://www.anthropic.com/research/building-strong-safety-evaluations)，Anthropic，2026-11-13

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
