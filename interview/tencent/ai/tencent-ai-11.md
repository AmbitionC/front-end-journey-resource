问题选自作者自述的面试记录。以下短答用于备面讲解，不代表作者当场作答；仅选录可核实的教学范围，未覆盖的原帖子问不补写。页面发表于2026-04-04，未披露面试绝对日期。

<details data-knowledge-key="agent-coding">
<summary>（1）已有成熟 Coding Agent 时，自研项目该怎样证明差异？</summary>
</details>

从目标用户、任务边界、可控数据与工具、质量基线说起，对同一任务比较完成率、返工、时延与成本。明确哪些能力更适配、哪些落后和维护代价；不能把接入另一个模型、界面不同或一次成功演示当作优势。

<details data-knowledge-key="context-engineering">
<summary>（2）上下文分层时，各层怎样分工？</summary>
</details>

把稳定规则、当前目标与约束、近期对话、任务状态、长期记忆和按需检索证据分开。按任务装配并保留来源与权限；层次不是固定行业标准，应解释自己系统中每层的生命周期、写入者和失效条件。

<details data-knowledge-key="prompt-context-compression">
<summary>（3）摘要质量怎样保证？</summary>
</details>

摘要要保留目标、已证实事实、否定条件、失败记录、未完成事项和出处。用原文对照和后续任务评估检查事实遗漏与歧义；模型选择须比较代表性样例。摘要不能替代需要逐字确认的原始证据。

<details data-knowledge-key="agent-subagents">
<summary>（4）什么时候启动子 Agent，主子 Agent 如何通信？</summary>
</details>

子任务能独立、有明确输入输出且上下文隔离有价值时再拆分。通过结构化任务合同和结果消息交接，携带任务ID、状态、证据及失败信息；主节点负责汇总、冲突与全局预算。共享可变状态需要版本控制，不能靠多个Agent同时改一份记录。

<details data-knowledge-key="agent-run-loop">
<summary>（5）Agent 重复空转怎样发现与终止？</summary>
</details>

记录目标状态、已获证据、工具及规范化参数，识别连续无进展或同一失败反复出现。设置轮次、时间、token、费用和工具调用预算；区分临时错误、参数错误、权限拒绝与结果未知，再修复、查询对账或升级人工。重复换措辞不算进展。

<details data-knowledge-key="agentic-rl">
<summary>（6）GRPO 和 PPO 该怎样比较？</summary>
</details>

先说明所讨论实现与目标。PPO通过受约束策略更新，常结合价值估计；GRPO使用同一问题的一组采样结果构造相对优势，典型实现省去独立价值模型。采样组大小、奖励质量、KL约束和任务分布都会影响效果，不能只用“更省显存”代替算法与评估。

<details data-knowledge-key="agentic-rl">
<summary>（7）KL 约束过强或过弱会怎样？</summary>
</details>

它限制当前策略偏离参考策略的程度。约束过强可能抑制必要学习，过弱可能鼓励追逐不可靠奖励并损害原有能力；需联合奖励尺度、训练曲线和保留任务评测调节，不能给所有实现一个通用固定值。本组选录仅解释强弱影响，原问“具体如何加入”的实现子问尚未覆盖，不把某种KL估计或加项位置当作作者实际方案。

<details data-knowledge-key="algorithm-hash">
<summary>（8）哈希表怎样定位与处理冲突，解释 Python 实现前需确认什么？</summary>
</details>

哈希表先由哈希定位候选位置，再以键比较和碰撞处理确定元素；平均高效不等于所有输入都恒定O(1)。Python字典的具体存储和扩容细节应固定解释器与版本。此处仅讲哈希原理与实现核验边界，未覆盖原帖的字典底层实现子问。

<details data-knowledge-key="os-deadlock">
<summary>（9）形成死锁通常有哪些条件？</summary>
</details>

结合互斥、持有并等待、不可抢占、循环等待分析；可用统一锁顺序、一次申请资源或适当释放等待破坏条件，具体策略仍需检查业务原子性。

