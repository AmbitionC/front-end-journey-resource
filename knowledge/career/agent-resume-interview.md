![候选人证据漏斗：resume outcome bullets→portfolio artifacts→technical screen→Agent system design→eval/debug exercise→behavioral collaboration；每层都回连到同一项目事实，禁止夸大无法验证指标](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-resume-interview-evidence-funnel-v1.webp)
*图：沿图中的节点与箭头阅读，重点是能力框架和正式招聘流程校准简历证据、项目量化、系统设计、行为面试和现场验证。*

---

很多同学准备 AI/Agent 岗位面试时，会陷入一个误区：把它当成传统工程岗来备考，刷刷算法、背几个框架 API，觉得差不多了。但当面试官问起"你的 Agent 在生产里出错了怎么排查"，或者"为什么选 RAG 而不是 Fine-tune"，就开始支支吾吾。

AI/Agent 岗位考察的核心是**系统思维**，而不只是代码能力。面试官想弄清楚的是：你有没有真正设计过一个 Agent 系统，有没有见过它在生产里出问题，有没有思考过每个技术选型背后的 trade-off。这篇课程，学长带你把简历和面试这两件事都捋清楚。

## 简历：让项目经历说话

### 项目描述怎么写

[USAJOBS 简历指南](https://usajobshelp.opm.gov/hc/en-us/articles/52839989720851-How-do-I-write-a-resume-for-a-federal-job) 要求用具体任务、上下文、结果、数字和影响描述经历；指标必须来自可核验项目事实，不能用示例数字冒充个人成果。


AI 项目描述最常见的错误，是写成工具清单："使用 LangChain + OpenAI + ChromaDB 搭建了 RAG 系统。"这句话几乎没有信息量——面试官只知道你会调 API，不知道你解决了什么问题，也不知道你做了哪些判断。

学长推荐一个简版结构：**遇到了什么问题 → 选择了什么方案 → 关键指标是什么 → 做了什么优化**。来看一个对比：

下表为虚构的写法示例，百分比和延迟只用于展示表达结构，不能当作真实项目结果。写自己的经历时，应补充指标定义、评测范围与基线，并只使用可核验数据。

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

## HR 与行为面试：让项目事实经得起追问

技术面讲清系统怎样运行，行为面还需要讲清你在约束下怎样做决定、怎样与人合作。[MIT CAPD 的 STAR 指南](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews)建议使用真实经历，交代情境（Situation）、自己承担的任务（Task）、亲自采取的行动（Action）和结果（Result），把重点放在行动上。[Amazon 的官方面试建议](https://www.aboutamazon.com/news/workplace/amazon-interview-best-tips)也强调具体经历与个人贡献。这里借用的是表达方法，不能据此推断其他公司的评分规则或招聘安排。

### 个人贡献与团队帮助怎样同时讲清

先建立一张项目事实表，再准备口头表达。事实表可以只留在个人备考笔记中；公司代码、内部日志和未公开文档不能因为面试而直接外发。

| 需要说明的事实 | 可以核对的材料或边界 |
| --- | --- |
| 接手前已经有什么 | 当时的系统版本、已有接口与遗留问题，区分接手和从零建设 |
| 你负责什么 | 自己完成的设计、提交、用例与验证，说明与他人模块的接口 |
| 谁帮助过你 | 对方提出的方向、评审意见或资源支持，以及你据此完成的工作 |
| 成果到了哪一步 | Demo、内部试用、灰度或正式使用分别说明；未上线就如实说未上线 |
| 哪个判断最困难 | 约束、备选方案、取舍依据、验证结果和仍未解决的问题 |

下面是**虚构的表达示例，不是某位候选人的现场经历**：“项目已有检索链路，我负责补充失败分类与回归用例。导师在评审中指出只看最终回答会漏掉工具错误；我据此补充工具结果核对，整理失败样本并完成回归。集成与发布由其他同事负责，我只能确认自己的改动通过内部验收，不能把团队上线后的全部效果算成个人成果。”

承认指导不会抵消个人贡献，关键是准确说明建议由谁提出、哪些判断和工作由自己完成。结果没有收益数字时，可以讲清验收对象、可复现用例与交付状态；不要把“预计节省”写成已经实现的收益。如何建立基线与结果证据，可继续阅读[用业务指标证明 Agent 项目价值](agent-project-evaluation.md)；作品展示方式见[Agent 项目与作品集设计](agent-project-portfolio.md)。

### 技术探索与交付目标冲突时怎样回答

先说明冲突发生时的共同目标与硬约束，再解释自己的方案为什么超出当前交付范围。回答中要出现真实的沟通和取舍：和负责人确认必须交付的能力与验收条件，比较最小可交付方案和探索方案的成本、风险，把暂不影响交付的验证放到后续计划。对权限、安全、质量的必要要求不能简单以赶进度为由删掉；无法同时满足时，应及时让有决策责任的人确认调整范围或延期。

**虚构示例**：“我希望尝试多智能体，但当前目标是交付可验证的单流程。评审后，我先用现有链路完成必要功能与回归，把多智能体实验另列为候选任务，写明要验证的问题与停止条件；实验没有达到可解释、可维护的要求，就不并入交付。”这个例子展示决策结构，实际回答必须换成自己发生过的事件，不可声称因此取得了未测量的提效。

被安排不感兴趣的工作时，也先解释它与团队目标的关系、自己的交付责任，再说明怎样学习、争取反馈或协商后续方向。可以坦诚偏好，但“我都愿意做”不足以说明行动；也不必把一次分歧包装成双方都满意的故事。

### 时间与压力问题需要什么证据

“我会管理时间”过于抽象。选一次真实的任务冲突，说明交付期限、依赖关系、当时可用时间和风险，再讲自己取消、延后或缩减了什么。个人项目应使用有权使用的时间、数据和设备；不能把挤占本职交付或持续超负荷当作能力证明。

**虚构示例**：“一次联调与个人项目计划发生冲突。我先确认联调依赖和阻塞项，把个人项目的新功能延后，只保留复现问题所需的最小用例，并提前同步调整后的安排。”回答还应补上真实结果：交付了什么、留下了什么问题、之后怎样改进。如果任务仍然延期，就解释原因与补救，不补写圆满结局。压力题同样按“触发情境—识别风险—具体行动—真实结果”展开；需要帮助时，说清向谁求助、带去了哪些信息、如何落实反馈。

### 已有留用意向，为什么仍看其他机会

先准确区分意向沟通、书面意向和正式 offer，再说明继续了解机会的真实原因。可以围绕工作内容、职责边界、培养方式和长期方向解释自己仍要确认的条件，并指出当前机会已经满足什么、尚有哪些信息待核实。不要把意向描述成已确定的正式 offer，不虚构竞争机会、承诺或薪资条件，也不靠贬低原团队证明动机。

**虚构示例**：“我已收到留用意向，正式职责与安排仍在沟通。我希望进一步了解不同岗位的工程责任和培养方式，再根据实际信息作选择；现有工作与交接会按约定完成。”只有这些事实确实成立时，才可用于自己的回答。对于其他流程、工作地点偏好和可到岗时间，也只说明已确认的状态、现实约束与可履行的安排；不必暴露无关个人信息。

教育背景、经历空档和技术栈确认也遵循同一原则：回答与岗位有关的事实，说明阶段选择与后续行动，记不清的数据先核对。实习收获应以具体案例说明认识如何变化；“用了某语言”本身不能证明语言熟练度，也不能证明大模型项目已经创造业务价值。

## 最后

学长见过不少同学，面试准备做得非常充分——背了很多题、总结了很多框架——但一到"讲讲你做过最有挑战的 AI 项目"，就开始语焉不详。因为他们的准备是在"补"，而不是在"整理"。

最好的面试准备，不是临时攻题，而是真的把一个 Agent 项目从头做到尾：定义问题、搭架构、跑评估、改 Prompt、上线、看数据。这些经历会在面试里自然流露，面试官是能感受到的。

课程里每个环节都有动手任务，不只是看概念——**做一个项目产生的认知密度，远高于看十篇文章**。先把手弄脏，面试的事情反而会变得容易。

## 出现于（热度来源）

补充复习导航（不计热度）：

- [阿里云 Agent 开发秋招一面](../../interview/alibaba/ai/alibaba-ai-1.md)
- [阿里国际 Accio Agent 算法一面：数据合成、任务环境与 GUI Agent](../../interview/alibaba/ai/alibaba-ai-3.md)
- [阿里淘宝闪购 Agent 算法实习一面：框架、记忆与线上排障](../../interview/alibaba/ai/alibaba-ai-6.md)

<!-- interview-source-history:start -->
- [阿里云后端与 Agent HR 面：个人贡献、协作与求职动机](../../interview/alibaba/ai/alibaba-ai-29.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../interview/bytedance/base/bytedance-base-53.md)
- [字节 AI 应用一、二面：MySQL、Redis 与编程基础](../../interview/bytedance/base/bytedance-base-36.md)
- [小红书 AI 应用一面：RAG 评测、Skill 与平方根](../../interview/redbook/ai/redbook-ai-20.md)
- [阿里云 AI 产品一面：模型基础、需求优先级与产品定位](../../interview/alibaba/ai/alibaba-ai-27.md)
- [蚂蚁 Agent 一二面：Code Agent 与应用开发](../../interview/antfin/ai/antfin-ai-2.md)
- [MiniMax 平台研发一面：数据可靠性、反馈闭环与 GMP](../../interview/minimax/ai/minimax-ai-1.md)
- [字节全栈一面：RAG、Java 与线程池](../../interview/bytedance/base/bytedance-base-37.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../interview/bytedance/base/bytedance-base-48.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../interview/bytedance/base/bytedance-base-43.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../interview/bytedance/base/bytedance-base-50.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../interview/bytedance/base/bytedance-base-41.md)
- [字节全栈二、三面：幂等、索引与字符串匹配](../../interview/bytedance/base/bytedance-base-32.md)
- [快手 Agent 开发二面关联题单：Hooks、锁与设计模式](../../interview/kuaishou/ai/kuaishou-ai-22.md)
- [字节飞书 AI 应用一面：Runtime、评测与后端基础](../../interview/bytedance/base/bytedance-base-24.md)
- [字节全栈实习：Session、权限与前端基础](../../interview/bytedance/base/bytedance-base-46.md)
- [字节抖音 Agent 一面：Skill、MCP 与记忆](../../interview/bytedance/base/bytedance-base-39.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../interview/bytedance/base/bytedance-base-34.md)
- [小红书增长方向一、二面：Harness、ReAct 与研究贡献](../../interview/redbook/ai/redbook-ai-23.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../interview/bytedance/base/bytedance-base-53.md)
- [字节 Agent 后端实习一面：LangGraph、评测集与混合检索](../../interview/bytedance/base/bytedance-base-22.md)
- [腾讯 CDG 金融科技二面：Agent 评估、协程与存储基础](../../interview/tencent/ai/tencent-ai-29.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../interview/bytedance/base/bytedance-base-56.md)
- [字节 Agent 实习：生成质量、多智能体与缓存](../../interview/bytedance/base/bytedance-base-52.md)
- [网易后端开发秋招一面：缓存一致性、死锁与分布式锁](../../interview/netease/base/netease-base-1.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../interview/bytedance/base/bytedance-base-45.md)
- [蚂蚁 Agent 实习一面：缓存、消息与 RAG](../../interview/antfin/ai/antfin-ai-6.md)
- [字节前端全栈实习一面：渲染、Worker 与认证](../../interview/bytedance/base/bytedance-base-38.md)
- [滴滴后端二面：CR Agent、Spec 与 AI Coding 场景](../../interview/didi/ai/didi-ai-1.md)
- [字节 Agent 全栈一面：工具、评测与编码](../../interview/bytedance/base/bytedance-base-40.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../interview/tencent/ai/tencent-ai-10.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../interview/bytedance/base/bytedance-base-49.md)
- [字节 Agent 实习：缓存一致性、定时任务与后端基础](../../interview/bytedance/base/bytedance-base-47.md)
- [字节 Agent 与全栈：视频工作流、工具权限与 RAG](../../interview/bytedance/base/bytedance-base-42.md)
<!-- interview-source-history:end -->

## 参考资料

- [Using the STAR method for your next behavioral interview — MIT CAPD](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews)
- [An Amazon recruiting manager offers his 3 best tips for a successful job interview — About Amazon](https://www.aboutamazon.com/news/workplace/amazon-interview-best-tips)
- [How do I write a resume for a federal job? — USAJOBS Help Center](https://usajobshelp.opm.gov/hc/en-us/articles/52839989720851-How-do-I-write-a-resume-for-a-federal-job)
- [SDE II Interview Prep — Amazon Jobs](https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep)
- [GitHub Certified: Agentic AI Developer (beta)](https://learn.microsoft.com/en-us/credentials/certifications/agentic-ai-developer/)
