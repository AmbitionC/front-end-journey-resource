以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

“找出小于 n 的最大数”缺少可用数字等约束，不能指定算法变体。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）实习拷打</summary>
</details>

用实际实习任务说明职责、技术决策和结果，并明确协作边界。原文只有问题类别，不能扩写成未发生的具体项目追问。

<details data-knowledge-key="agent-coding">
<summary>（2）你的项目的难点在于什么地方，在aicoding的全栈开发的流程是怎么样的呢，你如何解决这些问题的？</summary>
</details>

把全栈任务拆成接口契约、数据模型、UI 与验证，AI 可协助各段，但要在边界处做审查和联调。难点应通过真实错误、修复与回归说明，而不是把生成代码当作完成。

<details data-knowledge-key="llm-model-selection">
<summary>（3）用的什么模型，不同模型有什么样的体感的区别？Cli和IDE的vibe coding的区别？</summary>
</details>

用同一任务集比较正确率、延迟、成本与工具行为，再描述实际体感。CLI 侧重命令与批量执行，IDE 便于代码导航和交互审查，但具体能力取决于产品版本。

<details data-knowledge-key="build-agent-framework">
<summary>（4）langgraph有哪些组件，以及它能实现的功能，这个框架的优点在哪里？</summary>
</details>

LangGraph 以状态、节点和边组织执行，结合检查点可支持恢复与人工中断等场景。需定义状态更新、持久化和副作用幂等；框架提供机制，不替应用决定这些合同。

<details data-knowledge-key="agent-subagents">
<summary>（5）请给我介绍一下deepagents的设计的框架，也可以在白板上面画一下他的大概架构图，作为一个系统设计。那最近的agent swarm有了解么，是什么呢？</summary>
</details>

Deep Agents 官方设计包含文件上下文和子代理，计划与技能可按版本配置，可按职责拆解后在白板画状态与工具边界。“agent swarm”未指定实现，不能认定某个框架；协作仍需明确所有权和归并。

<details data-knowledge-key="agent-eval-framework">
<summary>（6）如何做评估的体系呢，怎么评判你的效果，或者bad case?那最后项目的效果如何？</summary>
</details>

用固定任务、运行轨迹与环境结果评估，区分回答质量、任务成功、成本和时延，并把失败分类回归。真实项目效果须有样本和数据，不从作者描述推导成功率。

<details data-knowledge-key="agent-skill-design">
<summary>（7）场景题：如果要你运用skills运用到你的项目当中，你需要怎么设计，请给我设计一下？你说抽象通用技能和特定技能赋予，能详细展开说说么？</summary>
</details>

把稳定任务流程提取成技能，描述触发条件、输入输出、依赖与失败出口；通用规则与业务技能分层。先小范围验证再复用，技能仍受工具权限和版本约束。

<details data-knowledge-key="prompt-system">
<summary>（8）PE你要如何分层设计会减少问题呢</summary>
</details>

基础身份与边界、业务规则、当前任务和外部材料分别组织，避免互相冲突。低可信数据不升格为系统指令；提示分层后仍要用实际失败样例验证效果。

<details data-knowledge-key="llm-open-source-deployment">
<summary>（9）有做过本地部署模型训练么，强化学习和监督微调了解过么？本地部署用的多大的模型，你的GPU指标参数是什么，如何做好推理优化和并行加速有了解过么？显存给我讲讲，cuda的架构以及模型训练的同步方式，以及如何可以进行高效的通信？</summary>
</details>

先如实交代模型、设备和是否训练：SFT 学示范，强化学习按奖励优化策略。显存需容纳权重、激活、优化器或 KV；量化、批处理及并行有不同代价，分布式训练还要协调梯度通信，不能给未测吞吐或编造 GPU 配置。

<details data-knowledge-key="algorithm-complexity">
<summary>（10）找出小于n的最大数</summary>
</details>

原帖仅写“找出小于 n 的最大数”，未给输入类型、合法数字、位数与重复限制，也未说明目标数的约束。需取得完整题意和样例；目前无法给确定解法或复杂度，不补隐藏前提。
