智能体的发展不是一条“旧技术被新技术完全替代”的直线。规则系统、规划、强化学习、神经网络和语言模型在不同年代解决了不同问题，今天仍会在同一个产品里同时出现。理解这段历史，重点不是背年份，而是看每一代系统怎样扩大“感知—决策—行动”的能力边界。

![从图灵测试、Shakey、专家系统与强化学习，到 Transformer、ReAct 和现代 LLM 智能体的发展时间线](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-history-timeline-v2.png)

## 一、1950：先把“机器能思考吗”变成可讨论的问题

Alan Turing 在 1950 年发表《Computing Machinery and Intelligence》。他没有试图先给“思考”下一个完美定义，而是提出模仿游戏，用可观察的语言行为讨论机器智能。[Turing 1950 原文](https://turing.academicwebsite.com/publications/21-computing-machinery-and-intelligence)

它还不是今天意义上的 Agent 架构，却留下了一个重要转向：**评价智能系统，不能只看内部实现，也要看它在交互中的行为表现**。现代 Agent 的任务成功率、轨迹评估和人机协作指标，都延续了这种行为导向。

## 二、1956：人工智能成为研究议程

1955 年的 Dartmouth 夏季研究计划提案提出，在 1956 年组织一次关于 Artificial Intelligence 的研究项目，并假设学习与智能的各个方面原则上可以被精确描述，使机器能够模拟。[Dartmouth 提案原文](https://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf)

这次会议常被视为人工智能研究领域的起点。早期研究同时探索语言、神经网络、抽象、创造性和自我改进，并不是后来被概括的“纯规则时代”那么单一。

## 三、1966—1972：Shakey 把感知、规划和行动接成闭环

SRI 的 Shakey 是智能体史上关键的一步。它不只是按遥控指令移动，而是把摄像机等感知输入、环境模型、路径规划和动作执行连接起来。SRI 的项目资料记录了 1966 至 1972 年的研究；相关工作还推动了 A* 搜索和 STRIPS 规划等重要成果。[Shakey 项目资料](https://ai.stanford.edu/~nilsson/OnlinePubs-Nils/shakey-the-robot.pdf)

Shakey 展示了一个现代 Agent 仍在使用的骨架：

~~~text
读取环境 → 建立状态 → 规划行动 → 执行动作 → 再次观察
~~~

它的环境高度受控、计算能力有限、行动很慢，但第一次清楚说明：推理如果不能通过传感器和执行器与世界闭环，就只是离线计算。

## 四、1970s—1980s：专家系统扩大知识推理，也暴露规则瓶颈

专家系统把领域知识写成规则，由推理机根据事实触发结论。它们在医疗、配置和故障诊断等封闭领域展示了价值：

~~~text
IF 条件成立
THEN 产生结论或建议
~~~

这种系统可解释、可审计，但知识获取成本很高。专家经验难以全部写成规则，规则越多，冲突、例外和维护越困难。真实环境一旦超出知识库边界，系统就容易表现脆弱。

这类方法并没有消失。今天 Agent 的权限策略、审批规则、业务约束和确定性路由仍大量使用符号规则。区别在于，规则不再被期待独自承担所有理解与规划。

## 五、强化学习：从写规则转向在交互中学习策略

强化学习把问题描述为智能体在状态中选择动作、获得奖励，并优化长期回报。它关心的不是单次分类是否正确，而是连续行动怎样影响未来结果。

其思想和数学基础跨越多个年代，1980s 以后形成更系统的方法，2010s 又与深度神经网络结合。2016 年 AlphaGo 将策略网络、价值网络、搜索与强化学习结合，击败顶尖围棋棋手。[AlphaGo 论文](https://www.nature.com/articles/nature16961)

AlphaGo 不是通用 LLM Agent，但它证明了三件事：

1. 复杂行动可以通过搜索与学习共同选择。
2. 长期目标不能只靠局部最优动作。
3. 通过环境反馈改进策略，可能超越手写规则。

需要区分 AlphaGo 与后来的 AlphaGo Zero：2016 年对弈李世石的 AlphaGo 使用了人类棋谱监督学习与自我对弈强化学习；“完全从自我对弈开始”是 AlphaGo Zero 的特点。

## 六、1990s—2010s：软件 Agent、多智能体与机器人持续发展

在互联网、分布式系统和机器人研究中，“Agent”逐渐用于描述具有一定自治性、能通信、协作或竞争的软件与实体系统。

这一阶段的重要问题包括：

- 单个 Agent 如何维护信念、目标和计划；
- 多个 Agent 如何协商、分工和处理冲突；
- 机器人如何在不确定环境中定位、感知和控制；
- 强化学习如何在更大状态空间中学习策略。

今天的多智能体框架并不是突然出现的，它继承了更早的分布式 AI、博弈、组织建模和协作机制。不过，早期系统通常依赖明确协议和专用状态表示，缺少大语言模型提供的通用语言接口。

## 七、2017：Transformer 提供了通用语言与上下文基础

2017 年的《Attention Is All You Need》提出 Transformer，以注意力机制为核心处理序列。[Transformer 论文](https://arxiv.org/abs/1706.03762)

Transformer 本身不是智能体。它不会自动拥有目标、工具、记忆和环境闭环。但大规模预训练让模型能够：

- 用自然语言理解开放任务；
- 根据上下文进行少样本适配；
- 生成代码、计划和结构化数据；
- 作为统一接口连接不同知识与工具。

这使智能体的“决策核心”从大量手写规则，逐渐转为能处理开放语言任务的通用模型。

## 八、2022：ReAct 把推理与外部行动交错起来

ReAct 提出让语言模型交替生成推理轨迹与任务动作。行动可以访问搜索、知识库或交互环境，Observation 再反过来更新下一步推理。[ReAct 论文](https://arxiv.org/abs/2210.03629)

它解决了纯语言推理的一个根本限制：模型内部记忆可能过期或不足，而外部行动可以获取新证据。最小循环是：

~~~text
Thought → Action → Observation → Thought → …
~~~

在现代工程实现中，Action 通常使用结构化工具调用；系统保存必要轨迹和决策摘要，不应把模型的私有长推理当成必须展示的产品功能。

## 九、2023 至今：LLM Agent 从 Demo 走向工程系统

工具调用、长上下文、结构化输出、Agent SDK、状态图和 MCP 等能力，让 LLM Agent 更容易连接真实软件。现代系统通常包含：

- 模型与指令；
- 工具注册和执行层；
- 短期状态与长期记忆；
- 规划、反思或任务分解；
- 权限、预算、审批和停止条件；
- trace、评测、回放和人工接管。

Anthropic 将 agent 描述为模型动态指导工具使用和过程的系统，并建议从最简单可工作的模式开始；复杂自治只有在能带来可测收益时才值得引入。[Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

OpenAI 的 Agents SDK 文档也将 agent 概括为模型、指令、工具、guardrails、handoff 和结构化输出等运行能力的组合。[OpenAI：Agent definitions](https://developers.openai.com/api/docs/guides/agents/define-agents)

## 十、历史中反复出现的五条主线

### 1. 从封闭环境走向开放环境

Shakey 和专家系统在受控环境中表现突出；现代 Agent 面对网页、代码库、企业数据和真实用户，环境更动态、更不完整，也更容易出现安全问题。

### 2. 从手写知识走向数据与预训练

规则仍适合明确约束，但开放世界知识难以人工枚举。神经网络与预训练把大量模式压入模型参数，再由检索和工具补充实时事实。

### 3. 从单次回答走向连续决策

Turing 的对话行为、强化学习的序贯决策、ReAct 的多步行动，都强调“智能”需要在时间中展开，而不只是给定输入后输出一次结果。

### 4. 从模型能力走向系统可靠性

模型更强不等于 Agent 自动可靠。权限、状态、工具设计、恢复、审批、评测与可观测性越来越成为核心工程工作。

### 5. 从全自动幻想回到合理自治

每一轮技术热潮都容易高估系统的独立性。生产实践更重视可控自治：低风险步骤自动执行，高风险步骤由人批准，遇到不确定性时能够暂停和升级。

## 十一、不要把历史讲成三种错误故事

### “符号主义已经消失”

没有。规则、类型系统、Schema、状态机、数据库约束和访问控制仍是可靠 Agent 的骨架。语言模型擅长处理歧义，不适合代替所有确定性约束。

### “Transformer 发明了智能体”

没有。Agent 的环境、目标、传感器、执行器、规划和学习思想早已存在。Transformer 提供了强大的通用语言模型，使这些组件更容易通过自然语言协作。

### “能循环调用工具就是通用智能”

也不是。循环只是一种控制结构。真正能力取决于环境可见性、工具质量、模型判断、状态管理、停止条件和评测。一个没有权限边界的循环，往往只是更快制造副作用。

## 小结

从图灵的行为问题、Dartmouth 的研究议程，到 Shakey 的感知—规划—行动闭环，再到专家系统、强化学习、Transformer 与 ReAct，智能体的发展始终围绕同一个问题：怎样让机器在环境中持续采取有目标、可校验的行动。

今天的 LLM Agent 并不是凭空出现的新物种，而是把语言模型的通用理解能力，与几十年积累的规划、工具、规则、学习和系统工程重新组合。看懂这段历史，才能知道哪些问题可以交给模型，哪些边界必须由代码和人来守住。

## 参考资料

- [Turing：Computing Machinery and Intelligence](https://turing.academicwebsite.com/publications/21-computing-machinery-and-intelligence)
- [McCarthy et al.：Dartmouth Summer Research Project Proposal](https://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf)
- [Nilsson et al.：Shakey the Robot](https://ai.stanford.edu/~nilsson/OnlinePubs-Nils/shakey-the-robot.pdf)
- [Silver et al.：Mastering the game of Go with deep neural networks and tree search](https://www.nature.com/articles/nature16961)
- [Vaswani et al.：Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Yao et al.：ReAct](https://arxiv.org/abs/2210.03629)
- [Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OpenAI：Agent definitions](https://developers.openai.com/api/docs/guides/agents/define-agents)

