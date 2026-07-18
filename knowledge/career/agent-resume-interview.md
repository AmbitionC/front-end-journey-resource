![候选人证据漏斗：resume outcome bullets→portfolio artifacts→technical screen→Agent system design→eval/debug exercise→behavioral collaboration；每层都回连到同一项目事实，禁止夸大无法验证指标](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-resume-interview-evidence-funnel-v1.webp)
*图：沿图中的节点与箭头阅读，重点是能力框架和正式招聘流程校准简历证据、项目量化、系统设计、行为面试和现场验证。*

---

很多同学准备 AI/Agent 岗位面试时，会陷入一个误区：把它当成传统工程岗来备考，刷刷算法、背几个框架 API，觉得差不多了。但当面试官问起"你的 Agent 在生产里出错了怎么排查"，或者"为什么选 RAG 而不是 Fine-tune"，就开始支支吾吾。

AI/Agent 岗位考察的核心是**系统思维**，而不只是代码能力。面试官想弄清楚的是：你有没有真正设计过一个 Agent 系统，有没有见过它在生产里出问题，有没有思考过每个技术选型背后的 trade-off。这篇课程，学长带你把简历和面试这两件事都捋清楚。

## 简历：让项目经历说话

### 项目描述怎么写

[USAJOBS 简历指南](https://help.usajobs.gov/faq/application/documents/resume/what-to-include) 要求用具体任务、上下文、结果、数字和影响描述经历；指标必须来自可核验项目事实，不能用示例数字冒充个人成果。


AI 项目描述最常见的错误，是写成工具清单："使用 LangChain + OpenAI + ChromaDB 搭建了 RAG 系统。"这句话几乎没有信息量——面试官只知道你会调 API，不知道你解决了什么问题，也不知道你做了哪些判断。

学长推荐一个简版结构：**遇到了什么问题 → 选择了什么方案 → 关键指标是什么 → 做了什么优化**。来看一个对比：

| 写法 | 示例 |
|------|------|
| 流水账（差） | 使用 LangChain 搭建了内部知识库问答系统，接入了公司文档 |
| 有结构（好） | 为内部文档问答设计并落地 RAG 系统，通过混合检索（BM25 + 向量）将召回准确率从 61% 提升至 84%，平均响应延迟 1.8s，月均成本较 Fine-tune 方案降低约 70% |

好的描述里有**问题背景**、**关键决策**、**可量化的结果**。三样缺一都会让描述显得空洞。

### 哪些指标值得写

- 检索/召回：Precision@K、召回率、MRR
- 生成质量：ROUGE、BERTScore，或者你自己设计的 LLM Judge 评分
- 系统性能：P50/P95 延迟、每次查询成本（Token 折算美元）
- 业务结果：解决率、人工介入率、用户满意度

### 技能栏怎么列

原则是：**列你能被追问的，别列你只是听说过的**。"熟悉 Prompt Engineering、RAG、Agent 框架"——这句话几乎人人都能写，毫无区分度。更有力的写法是具体到场景和判断，比如：

> LLM 应用工程（RAG 系统设计与评估、Multi-Agent 编排、Prompt 调优）；工程化（LLM 可观测性、Token 成本管控、Eval Pipeline 搭建）

## 面试考点方向

[Amazon SDE II 面试准备说明](https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep) 展示了申请、评估和面试 loop，并同时覆盖 coding、system design、技术与行为能力；不同公司的流程会变化，应以目标岗位当期说明为准。


AI/Agent 岗位面试通常覆盖以下几个方向。学长不列具体题目，因为题目年年在变——但考察的底层能力是稳定的。

**大模型基础**：考察你对模型行为的直觉，而不是背参数。什么因素影响生成质量？为什么会出现幻觉，工程上怎么缓解？Tokenization 对 Prompt 设计有什么影响？对这部分底子还不扎实的同学，建议先去**知识库 → 大模型基础**系统复习一遍。

**Prompt 与上下文工程**：模型给出不符合预期的输出时，你的排查路径是什么？上下文窗口怎么分配——历史对话、检索结果、工具输出、系统指令，谁的优先级高？

**RAG**：Chunking 策略怎么选？什么时候用混合检索而不是纯向量检索？怎么评估 RAG 系统的质量？**知识库 → RAG** 里有系统性覆盖，建议面试前过一遍。

**Agent 架构**：ReAct 和 Planning 范式各适合什么场景？工具调用失败了，Agent 怎么处理？多轮任务的记忆存哪里、怎么检索？面试官希望看到的是你能在方案之间权衡，而不是"我用了 X 框架所以选了 X 做法"。**知识库 → AI 智能体 → 架构** 里的几篇文章（ReAct、Memory、Multi-Agent）是很好的备考材料。

**工程化能力**：Agent 怎么做可重复的 Eval Pipeline？出了问题怎么溯源？Token 成本在生产里怎么控制？这些考察你有没有认真把 Agent 当成生产系统来维护。**知识库 → AI 智能体 → 评估** 里有专门的文章值得仔细读。（参见 [GitHub Certified: Agentic AI Developer (beta)](https://learn.microsoft.com/en-us/credentials/certifications/agentic-ai-developer/)）

**系统设计题**：大厂面试里越来越常见——"设计一个客服 Agent，支持多轮对话、接入知识库、出错时平滑降级"；"设计一个代码 Review Agent"。这类题考察的是：你能不能识别核心约束（延迟 vs 准确率 vs 成本），能不能把系统拆成合理的模块，能不能说清楚每个模块的取舍。

## 面试中怎么讲清楚你的项目

介绍 AI 项目这个环节，很多同学会用来背功能列表——用了哪些工具、实现了哪些能力。这是在浪费机会。

学长建议用**故事线**来讲：问题背景（为什么用 Agent）→ 关键设计决策（选型判断和理由）→ 实现与踩坑（遇到了什么意外）→ 评估与迭代（怎么判断跑得好不好）。这样讲完，面试官会感受到：这个候选人是想清楚了再做的，不只是调 API。

你还需要提前准备几类追问：

- **"为什么选 X 而不是 Y"**——要有具体理由，不能只说"X 更流行"
- **"你怎么衡量项目是否成功"**——要有指标、有基线、有对比
- **"生产里出过什么问题"**——哪怕是"发现是 Prompt 里有个隐式格式要求没写清楚"也比"没出过问题"有说服力

还有越来越常见的 **live debugging**：面试官给你一个 Agent 的输出结果，让你说出可能的出错原因。解题路径是：先看输出格式是否异常 → 看 Prompt 构造 → 看检索结果是否噪声多 → 看工具调用是否符合预期。提前在心里跑几遍这个路径，现场会从容很多。

## 最后

学长见过不少同学，面试准备做得非常充分——背了很多题、总结了很多框架——但一到"讲讲你做过最有挑战的 AI 项目"，就开始语焉不详。因为他们的准备是在"补"，而不是在"整理"。

最好的面试准备，不是临时攻题，而是真的把一个 Agent 项目从头做到尾：定义问题、搭架构、跑评估、改 Prompt、上线、看数据。这些经历会在面试里自然流露，面试官是能感受到的。

课程里每个环节都有动手任务，不只是看概念——**做一个项目产生的认知密度，远高于看十篇文章**。先把手弄脏，面试的事情反而会变得容易。

## 参考资料

- [How do I write a resume for a federal job? — USAJOBS Help Center](https://help.usajobs.gov/faq/application/documents/resume/what-to-include)
- [SDE II Interview Prep — Amazon Jobs](https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep)
- [GitHub Certified: Agentic AI Developer (beta)](https://learn.microsoft.com/en-us/credentials/certifications/agentic-ai-developer/)
