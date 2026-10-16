![学习依赖 DAG：编程/网络/数据库→LLM 与 embeddings→tool use 与 RAG→Agent runtime/state→evals/observability/security→production project；每阶段配一个可验证作品和进入条件](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-engineer-learning-dependency-roadmap-v1.webp)
*图：沿图中的节点与箭头阅读学习依赖；评估安全阶段用于深化，权限、工具副作用和失败边界从第一次工具练习就应出现，并贯穿后续阶段。*

---

学习Agent时，先确定要完成什么任务，以及还缺哪些软件与模型基础。下面把常见能力组织成可验证的学习路线；它是教学样例，不代表某位作者的个人学习经历。

图按依赖展示六类能力，正文为安排练习合并为四个阶段；编程、网络和数据库基础按已有水平先补。下面给出一个按依赖递进的学习样例。文中阶段合计的 **12 到 17 周**只是便于安排练习的节奏，不是能力或上线结果的保证；实际进度取决于已有的软件基础、每周投入和项目可靠性要求。

---

## 四个阶段总览

[CS Curricula 2023](https://csed.acm.org/final-report/) 将软件、系统、数据、AI 与安全列为相互关联的基础知识域；学习路线应先补任务所需依赖，而不是从某个流行框架倒推全部能力。


![四阶段学习节奏样例：打地基3周、Agent核心4周、进阶4周、工程化6周；横轴为从第0周开始的相对周数](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/pdf-agent-learning-roadmap-mermaid-bc885a73a4f0.png)

*图：总览保留完整阶段关系；下面两张详图沿同一相对周数轴阅读，保留重叠区域。详图边缘的文字或条带裁切不代表阶段起止，请结合总览与相邻详图阅读。*

**详图 1/2：左侧窗口**

![四阶段学习节奏局部1：放大阅读阶段名称、条带与相对周数](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/pdf-agent-learning-roadmap-mermaid-bc885a73a4f0-detail-1-1.png)

**详图 2/2：右侧窗口**

![四阶段学习节奏局部2：放大阅读阶段名称、条带与相对周数](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/pdf-agent-learning-roadmap-mermaid-bc885a73a4f0-detail-1-2.png)

---

## Phase 1：打地基（2–3 周）

**目标：** 理解大模型是怎么工作的，能自己调用 API，能表达输入约束并验证输出。

这一阶段的意义经常被低估。很多人急着上手框架，结果发现自己连"为什么这个 Prompt 没用"都搞不清楚。补足这些依赖有助于定位后续失败，但不保证每个人都按固定速度进步。

知识库推荐阅读顺序：

**大模型基础（精选入口）**
- `transformer-arch`：搞清楚 Transformer 架构，知道"注意力机制"是什么
- `llm-token-context`：理解 Token 是什么，Context Window 为什么重要
- `llm-inference-params`：temperature、top_p 这些参数到底控制什么
- `llm-model-compare`：主流模型横向对比，心里有个谱
- `llm-model-selection`：根据场景选模型的决策框架

**Prompt 工程（基础三篇）**
- `prompt-basics`：Prompt 的基本结构和写法
- `prompt-system`：System Prompt 的作用和写法
- `prompt-cot`：Chain-of-Thought，让模型"慢慢想"

**阶段实践：** 用 OpenAI 或 Claude API 写一个简单的聊天界面，能发消息、能收回复、能保留上下文。

**里程碑：** 你能向别人解释清楚"Token 是什么"，能说清楚为什么同一个问题换一种说法模型的回答质量会差很多。能到这里，第一阶段就过了。

---

## Phase 2：学 Agent 核心（3–4 周）

[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) 建议从简单、可组合的工作流开始，只在任务确需自主决策时增加 Agent 复杂度；路线中的项目应逐阶段验证这一边界。


**目标：** 从原理上搞懂 Agent 是什么，动手从零写一个 ReAct Agent。

这一阶段用小实现看清模型、工具、状态和终止条件的边界。可以先手写最小循环，再比较框架替你封装了什么；已有相应经验的人也可以直接从失败案例检验理解。

知识库推荐阅读顺序：

**AI 智能体系列**
- `agent-history`：Agent 的发展历程，知道我们站在哪里
- `agent-first-demo`：第一个 Agent Demo，跟着敲一遍
- `agent-react`：ReAct是一种组织观察、推理与行动的研究范式，重点理解其适用边界
- `agent-paradigms`：Plan-and-Execute、MRKL 等各种 Agent 范式对比
- `agent-memory`：Agent 的记忆系统，短期记忆 vs 长期记忆
- `context-engineering`：如何设计 Context，让 Agent 保持"清醒"

**Prompt 工程（进阶三篇）**
- `prompt-few-shot`：Few-shot 示例的威力
- `prompt-structured-output`：让模型输出结构化 JSON，这是 Tool Call 的基础
- `prompt-versioning`：Prompt 也要版本管理，这是工程思维

**阶段实践：** 不借助框架，手写一个能调用工具的 Agent——比如能搜索网页、然后总结内容的 Agent。

**里程碑：** 你的 Agent 能处理"先搜索，再分析，再生成报告"这种多步骤任务，中间不需要你手动干预。

---

## Phase 3：进阶与生态（3–4 周）

**目标：** 学会用主流框架，会搭 RAG 系统，理解多智能体的设计思路。

这一阶段按项目需要选择框架，检查其封装、版本和失败恢复方式；能否解释工具与状态边界，比熟悉框架名更有价值。

知识库推荐阅读顺序：

**AI 智能体系列（框架与生态）**
- `build-agent-framework`：从零理解 Agent 框架是怎么设计的
- `mcp-protocol`：Model Context Protocol，Agent 工具调用的新标准
- `multi-agent`：多 Agent 协作的模式与设计
- `agent-evaluation`：如何评估 Agent 的质量，这很重要但经常被忽视

**RAG 精选入口**
- `embedding-basics`：Embedding 是什么，语义相似度怎么算
- `rag-pipeline`：RAG 的完整流程
- `rag-chunking`：文档切割策略，细节决定成败
- `rag-hybrid-search`：混合检索；用目标问题集验证是否优于单路召回
- `rag-evaluation`：RAG 系统怎么评测
- `vector-db-selection`：向量数据库选型

**阶段实践：** 搭一个基于 RAG 的问答 Agent（比如对你自己的知识库提问），然后尝试用两个不同的框架各实现一遍。

**里程碑：** 你能搭出一个可运行、可评估的 RAG 原型，遇到检索质量问题知道从数据、分块、召回和生成链路定位；面对新框架时能识别它替你封装了哪些机制。

---

## Phase 4：工程化与实战（4–6 weeks）

**目标：** 做出一个真实的 Agent 产品，能部署上线，形成作品集。

前三个阶段是学，这个阶段是造。造一个真实产品和写一个 Demo 的差距，比你想象的要大——日志、监控、错误处理、成本控制……这些"无聊"的工程问题，往往才是真正拦住你的东西。

知识库推荐阅读顺序：

**AI 智能体系列（前沿方向）**
- `agentic-rl`：强化学习在 Agent 中的应用，理解 RLHF 背后的逻辑
- `agent-deep-research`：Deep Research 类 Agent 的架构解析

**基础设施知识**
- 数据研发模块：了解数据管道，Agent 的知识来源需要数据工程支撑
- 后端研发模块：API 设计、数据库、部署——做产品绕不开

**阶段实践（选一个做）：**
1. **知识库助手**：帮某个垂直领域（法律、医疗、技术文档）做问答 Agent
2. **Deep Research Agent**：给定一个问题，自动搜集资料、分析、生成报告
3. **代码助手**：能理解一个代码仓库，回答关于代码的问题
4. **工作流自动化**：接入邮件/日历/任务系统，帮用户处理日常工作

**里程碑：** 产品已部署，有监控，有成本控制，能向别人演示。写一篇技术博客或者录一个 Demo 视频，放进你的简历和作品集。

---


## 把学习路线写成可教、可检查的教程

上面的阶段是学习样例，不是唯一章节顺序。设计教程时，先写清每章结束后能独立完成什么任务，再检查它依赖哪些概念；小例子验证一个机制，综合项目再组合这些机制。涉及工具副作用、权限、状态恢复与外部数据的边界应在例子中出现，不能等到“生产部署”一章才补安全。

每章可用同一条质量链：问题和输入条件、最小实现、预期可观察结果、一个失败案例、改变条件后的练习。比如最小工具Agent不仅要演示成功返回，还要演示错误参数、拒绝授权和工具结果未知时如何停止或恢复。是否学会，看能否解释并修复这些变化，而不是能否背出框架名。

资料按要支持的主张组织。协议与API优先当前规范、官方文档或具体版本代码；机制与实验结论回到原始论文；项目经验保留其适用场景，不外推成行业保证。对每份资料记录用于哪个章节、版本/日期、支持哪条结论，以及示例是否实际执行。文中阅读目录只是本知识库的精选入口，不代表对应分类全部条目均已列全或质量都已获当前审核。

[CS2023的知识域与教学考虑](https://csed.acm.org/final-report/)提供以能力、基础和实践组织课程的参考；这里的章节安排与Agent失败练习是应用教学建议，不是CS2023指定的Agent课程。


## 常见误区

下面列出学习与项目验证中需要主动检查的误区：

**误区一：跳过基础，直接上框架。**
先理解当前任务涉及的工具调用、状态和检索机制，再选择框架；ReAct 是一种可研究的交互范式，不是使用所有框架的统一先修门槛。基础练习能帮助定位模型、编排和工具层的失败，不能据此推断某位学习者必然低效。

**误区二：把 Demo 当产品。**
能跑通 Happy Path 不等于做出了产品。真实的 Agent 产品需要处理各种边界情况：模型幻觉、工具调用失败、上下文超长、费用超支……这些工程问题往往比算法问题更难。Phase 4 的核心就是直面这些问题。

**误区三：只看不练，囤了一堆教程。**
知识库里的文章是给你指路的，不是让你全部背诵的。每个阶段结束之前，一定要有可以运行的代码。学完 `agent-react`，你的电脑里就应该已经有一个能跑的 ReAct Agent，哪怕只有 100 行。

**误区四：不做任务评测，只选择熟悉的模型。**
模型选择要同时检查目标任务质量、权限与可靠性、延迟和单位合格任务成本。不同模型或分级路由都需要在相同条件下验证，不能从型号或价格推断适用性。`llm-model-selection` 这篇一定要读，学会根据场景选模型。

---

每个里程碑记录输入条件、代码或产物、执行环境、验证结果和仍然失败的场景。这些证据既帮助复习，也让下一阶段的学习目标更具体。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [vivo Agent 秋招线下面：Harness 与工程诊断](../../interview/vivo/ai/vivo-ai-1.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../interview/bytedance/base/bytedance-base-43.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../interview/bytedance/base/bytedance-base-48.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../interview/bytedance/base/bytedance-base-53.md)
<!-- interview-source-history:end -->

## 参考资料

- [ACM/IEEE-CS/AAAI Computer Science Curricula 2023](https://csed.acm.org/final-report/)
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

- [ReAct原始论文（ICLR2023）](https://arxiv.org/abs/2210.03629)：用于说明一种交互范式，不代表所有Agent都应采用。
