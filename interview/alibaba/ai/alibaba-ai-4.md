### 阿里淘天 Agent 算法一面：任务构造、轨迹与训练路线

这轮淘天 Agent 算法一面先讨论职业规划和 AI 发展，再围绕实习项目深挖任务构造、数据回流、轨迹验证及训练路线。原记录没有明确面试日期；本页选录下列八组问题，未收录自我介绍、正在做什么、最长一段实习的公司业务与职责，以及 AI 落地情况反问。

题面依据记录整理；短答、比较框架与方案示例为教学补充，不代表作者当时的回答、项目实现或实际效果。

<details data-knowledge-key="agent-role-landscape">
<summary>（1）怎样回答职业规划与 AI 发展方向？</summary>
</details>

职业规划应围绕希望长期解决的问题、已有能力和下一阶段缺口展开，而不是只列岗位名称。谈 AI 发展时可区分两条尺度：AGI 叙事关注能力边界和通用性，业务落地关注确定任务中的质量、成本、延迟、安全与可维护性。两者并不冲突，但面试回答要给出可证伪的判断和现实约束。

<details data-knowledge-key="llm-training-overview">
<summary>（2）模型效果不好时，怎样判断问题来自预训练、后训练还是数据？</summary>
</details>

先建立可复现的错误集，将失败拆成知识缺失、指令不遵循、推理错误、工具错误和分布外输入。知识或基础能力普遍缺失可能指向预训练或继续预训练；任务格式和行为偏差更可能通过后训练改善；若错误集中在少数场景，要优先检查数据覆盖、标注一致性和泄漏。随后做单变量消融，不能凭直觉直接训练。

<details data-knowledge-key="llm-training-overview">
<summary>（3）实习项目中的任务怎样构造？</summary>
</details>

先说明实际任务目标、环境、工具、输入分布和成功判据，再解释任务来自统一构造还是实际用户反馈，以及如何验证覆盖、执行结果和数据隔离。训练任务族与合成数据可以作为复习延伸，不能补成作者当时的具体方案。

知识导航：[大模型训练全流程概览](../../../knowledge/llm/basics/llm-training-overview.md)。

<details data-knowledge-key="llm-training-overview">
<summary>（4）统一管线构造与用户数据回流的方法有什么差异？</summary>
</details>

可按任务或数据来源、覆盖范围、构造和验证方式比较：统一构造便于控制实验和复现，用户回流贴近真实分布但要处理隐私、采样偏差与反馈质量。具体管线实现原记录未披露，不把这套比较框架当作当时实施事实。

<details data-knowledge-key="agent-evaluation">
<summary>（5）Agent 轨迹怎样做验证？</summary>
</details>

只验证最终结果会漏掉碰巧答对、错误工具调用和不可接受副作用。轨迹验证应检查每步动作是否可执行、参数是否合法、证据是否支持结论、状态转移是否符合环境，以及路径是否违反权限或预算。没有可靠 verifier 时可先使用结果验证加抽样人工审核，但应承认它无法完整约束过程。

<details data-knowledge-key="agent-evaluation">
<summary>（6）怎样比较“做验证”与“不做验证”的路线？</summary>
</details>

是否做轨迹验证，要先说明验证的是工具动作、过程约束还是环境终态。可执行测试、模拟器或规则能提供外部反馈，反馈既可能是终局稀疏信号，也可能覆盖过程检查点；不验证完整轨迹不等于无需结果评估。取舍应比较验证覆盖、误判与成本，以及未验证过程可能隐藏的错误和副作用；原记录未指定某一种训练算法或奖励设计。

<details data-knowledge-key="llm-training-overview">
<summary>（7）Mid-training 和 Post-training 有什么区别？</summary>
</details>

Mid-training 通常位于通用预训练与任务对齐之间，通过领域语料、长上下文或特定能力数据继续训练，主要改变知识和能力分布。Post-training 更关注指令遵循、偏好、安全和任务策略，常见方法包括 SFT、偏好优化与强化学习。边界在不同团队中可能不同，回答时应说明数据、目标函数和预期能力变化，而不是只争论名称。

<details data-knowledge-key="llm-training-overview">
<summary>（8）业务算法什么时候应该训练模型？</summary>
</details>

先确认问题是稳定的模型能力缺口，而非检索、工具、Prompt、上下文或业务规则缺陷。只有当高质量数据可持续获得、离线指标与业务结果相关、训练收益能覆盖成本，并有部署和回滚能力时才适合训练。低频规则、强确定性约束和快速变化知识通常更适合代码、检索或工作流解决。

#### 延伸阅读

- [大模型预训练](../../../knowledge/llm/basics/llm-pretraining.md)
- [LLM 训练全流程概览](../../../knowledge/llm/basics/llm-training-overview.md)
- [Agent 评测体系](../../../knowledge/llm/agent/agent-evaluation.md)
- [模型对齐与后训练](../../../knowledge/llm/basics/llm-alignment.md)
- [Agentic RL](../../../knowledge/llm/agent/agentic-rl.md)
