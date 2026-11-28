美团大模型应用实习一面，原帖未注明面试日期和时长。这是一份候选人的自述题单，短答为编辑整理的备考思路，不代表当事人的现场答案。原帖只给两道手撕题的名称，未记录完整约束、代码和通过结果；以下教学合同不视为现场题目的还原。两道手撕分别列为第8、9题，反问环节另记。

<details data-knowledge-key="agent-resume-interview"><summary>（1）自我介绍</summary></details>
<p>围绕当前方向、与岗位相关的一段经历和本人职责组织介绍，说明自己做过什么、做到哪一步。与简历保持一致，只使用可核验的产物与结果，不代填原作者的项目或收益。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（2）介绍一下你的实习/项目经历，并针对项目中的核心难点、解决思路以及最终业务指标进行深入追问。</summary></details>
<p>先交代业务任务与成功标准，再选一个核心难点讲清约束、备选方案、本人行动和验证结果。指标要说明定义、数据范围与基线；没有业务效果记录时如实说明当前阶段，不能把计划写成已取得的收益。</p>

<details data-knowledge-key="transformer-arch"><summary>（3）为什么 Transformer 架构中选择使用 LayerNorm，而不是 BatchNorm？Pre-LN 和 Post-LN 分别有什么区别？</summary></details>
<p>常见语言模型按每个 Token 的隐藏维做 LayerNorm，不依赖其他样本的批统计；BatchNorm 的统计范围和默认训练、评估行为不同。Pre-LN 把归一化放在子层之前，Post-LN 放在子层与残差相加之后，后者与前者是位置选择，不能代替统计范围的比较。应结合模型与训练设置讨论稳定性，不能说某种归一化在所有设置下都最好。</p>

<details data-knowledge-key="llm-alignment"><summary>（4）SFT 之后为什么还需要进行 RLHF/DPO 等对齐训练？</summary></details>
<p>SFT 从示范学习指令和输出行为，但多种合理回答之间的相对偏好可再用比较数据优化。RLHF 常结合奖励模型与强化学习，DPO 则直接利用偏好对构造优化目标；是否采用应由任务缺口和独立评估决定，并非每次 SFT 后都必然再训练。还要检查代理奖励偏移与能力回归，不能以训练分数替代真实质量。</p>

<details data-knowledge-key="llm-lora-peft"><summary>（5）QLoRA 相比标准 LoRA 做了哪些改进？在消费级显卡上进行大模型微调时，显存开销可以降低多少？</summary></details>
<p>LoRA 减少可训练增量，QLoRA 还量化冻结基座，并结合 NF4、嵌套量化等方式减少存储；分页优化器处理的是训练状态的内存压力。若只比较理想基座载荷，16-bit 到 4-bit 是四分之一，但总训练峰值还包含元数据、适配器、激活和临时空间。原帖没有模型、序列长度、批大小或实测记录，不能回答一个通用的整机节省百分比。</p>

<details data-knowledge-key="transformer-arch"><summary>（6）FlashAttention 的核心原理是什么？它主要解决了大模型训练和推理过程中的什么瓶颈？</summary></details>
<p>FlashAttention 保持标准注意力的计算目标，通过分块等方式减少大中间矩阵的物化及 HBM 与片上存储之间的数据搬运。核心收益是 IO 和中间显存效率，不是把全量注意力的两两交互变成线性复杂度。具体训练或推理收益还取决于长度、硬件与内核实现，不能替原作者补造性能结果。</p>

<details data-knowledge-key="llm-token-context"><summary>（7）vLLM 推理框架中的 PagedAttention 机制是如何实现的？它主要解决了 KV Cache 存储中的什么问题？</summary></details>
<p>把请求的逻辑 Token 位置划成固定大小的块，再经块表映射到物理 KV 块；按实际增长分配，减少连续大空间和最大长度预留的浪费。注意力后端仍须按正确的位置、掩码读取 K/V，分页不减少每个 Token 的缓存元素，也不意味着自动把缓存换到 CPU。块表管理和尾块空槽都有代价，应结合版本与负载评估。</p>

<details data-knowledge-key="algorithm-stack-queue"><summary>（8）手撕：最长有效括号（原帖仅题名）</summary></details>
<p>原帖仅给题名，先确认字符集合、是否求连续子串及返回值等合同。对仅含左右括号、求最长有效连续长度的教学合同，可用下标栈保存未匹配左括号与最近非法边界，遇右括号后用当前位置减栈顶计算有效后缀；时间 O(n)、最坏额外空间 O(n)。这不是原作者的现场代码，也不能据此声称其通过了测试。</p>

<details data-knowledge-key="algorithm-tree"><summary>（9）手撕：二叉树层序遍历（原帖仅题名）</summary></details>
<p>原帖仅给题名，先确认节点结构、空树和返回格式。对标准无环二叉树的教学合同，用队列做 BFS，每轮固定这一层的待处理数量，记录节点值后把非空孩子入队。已有示例用数组和 head 下标避免反复 shift，但保留已处理数组项会占 O(n) 空间，不能把这个具体实现的空间误写成只与当前层宽有关。</p>

原帖反问环节：原帖未给具体问题，仅保留环节记录。原作者自述整体体验较好，面试官注重沟通、思路以及项目和简历的深入追问；不据标题推断正式录用结果。
