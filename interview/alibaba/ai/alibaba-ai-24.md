这份记录自述阿里大模型算法校招，未说明具体部门、轮次和面试日期。题目涉及模型机制、后训练、工具编排与评测；以下是编辑补充的回答思路，不代表当事人的项目实现、现场答案或结果。

<details data-knowledge-key="transformer-arch"><summary>（1）Transformer 中 Attention 的本质是什么，能否从数学角度解释？</summary></details>
<p>从 Q、K、V 的投影说起：QK 点积给出匹配分数，缩放并经掩码与 Softmax 得到权重，再对 V 加权聚合。多头在不同子空间计算后合并表示；权重只是中间计算，不能直接当成模型的完整因果解释。</p>

<details data-knowledge-key="transformer-arch"><summary>（2）Agent 多轮对话中，Attention 有哪些局限？</summary></details>
<p>标准全量 Attention 的位置两两交互带来随长度增长的计算与内存成本，长距离可见也不保证关键信息一定被可靠使用。多轮系统还要在模型窗口内选择当前证据，避免过期或矛盾历史持续干扰；外部状态与记忆检索属于系统层能力，不能把 Attention 本身当作持久数据库。</p>

<details data-knowledge-key="llm-alignment"><summary>（3）SFT 的核心流程和数据集构建策略是什么，SFT 后常见的 Post-Training 方法与目的有何区别？</summary></details>
<p>先按任务定义输入、理想输出和保留评测集，清洗去重并固定聊天模板，再核对哪些目标 Token 参与 SFT 损失。SFT 主要教授示范行为，偏好优化学习回答之间的取舍，带奖励的在线优化还要治理采样与奖励。阶段选择依据可复现的失败类型与评测结果，不能只因模型叫 Qwen 就指定某个 Loss。</p>

<details data-knowledge-key="rag-evaluation"><summary>（4）RAG 怎样提升生成质量，与检索加模型生成有何区别，如何评估系统是否有效？</summary></details>
<p>RAG 本质就是让生成过程使用检索得到的外部证据，并非与“检索加模型生成”截然不同的算法。应说明资料、权限、索引、检索和上下文如何连接，再分开测召回与排序、回答的证据支持和最终任务效果。资料缺失、召回错误或生成误用都可能失败，不能只凭答案流畅判断有效。</p>

<details data-knowledge-key="llm-rlhf-dpo"><summary>（5）PPO 和 DPO 在大模型对齐中有何区别，DPO 训练要注意什么，是否用过 GRPO？</summary></details>
<p>经典 PPO 式 RLHF 通常用奖励与价值估计优化当前策略采样；经典离线 DPO 用同一输入的偏好对直接优化相对参考策略的概率优势。DPO 要核对标签方向、模板、截断、数据覆盖及独立评测，损失下降不等于任务效果提高。GRPO 用同一提示的组内相对奖励形成优势并省去独立 Critic；若未实际训练过，应说明理解范围，不编造使用经验或成绩。</p>

<details data-knowledge-key="agent-planning"><summary>（6）项目中的 Modular Agent 如何实现多步规划？</summary></details>
<p>先给出目标、不可变约束和完成证据，再把子任务组织成带输入输出与依赖的可执行状态。执行结果经过校验后更新计划，只有未完成且允许改变的部分才重规划。预算、停止条件和副作用状态应由运行协议约束，不能让模型自由循环或把计划文本当完成证明。</p>

<details data-knowledge-key="agent-tool-timeout"><summary>（7）多工具调用链路如何调度，异常时有哪些 fallback 策略？</summary></details>
<p>先区分数据依赖、共享状态和副作用，独立只读分支才适合并行，依赖链按结果顺序推进。异常时按错误类别、总 deadline 和幂等性决定退避、降级或转人工，权限拒绝与参数错误不能盲重试。写操作超时先查原 operation 状态，不能换工具或换 key 重做未知副作用。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（8）Agent 评估有哪些维度，怎样衡量 planning 能力与 hallucination rate？</summary></details>
<p>将任务完成、过程约束和实际环境结果分别验收，规划可检查依赖有效、遗漏步骤、无效动作及有限重规划。幻觉率则先定义可核验声明和证据支持判据，明确统计单位与分母，不与规划分数混成一个总分。用相同任务、初始状态和版本比较，模型评分还需独立校准和失败切片。</p>

<details data-knowledge-key="llm-alignment"><summary>（9）项目微调 Qwen 时，怎样选择训练阶段和 Loss 函数？</summary></details>
<p>先定位是指令与格式、偏好取舍还是可验证任务能力不足，再匹配示范、偏好对或奖励数据，保留未参与调优的任务集。自回归 SFT 常用目标位置的下一 Token 交叉熵，实际位置由模板与标签掩码决定；DPO 或在线 RL 则有不同目标与数据合同。原文未给出模型版本和实际训练方案，回答不能替当事人指定已采用的阶段或收益。</p>

<details data-knowledge-key="prompt-examples-selection"><summary>（10）Prompt 自动推荐模块有哪些优化策略，是否尝试过 Prompt 压缩或 Embedding 表示？</summary></details>
<p>先澄清推荐的是模板、示例还是可训练的连续提示：Embedding 可用于检索候选，之后仍需恢复内容并按权限与任务筛选。文本压缩要保留否定条件、实体和输出合同，Soft Prompt 则需要专门训练与模型输入路径，不能等同于把向量当普通文本传入。用固定任务比较推荐质量、错误类型与资源占用，未做过的实验应明确说明。</p>

<details data-knowledge-key="agent-parallel-tools"><summary>（11）Agent 推理链路包含 3 个工具且请求频繁，整体延迟较高时怎样优化？</summary></details>
<p>先沿排队、模型、三个工具及汇合阶段定位关键路径，区分单次慢与高频请求引发的拥塞。只有无依赖且无共享副作用的工具可并行，其他调用应通过缓存、批处理、合理超时与有界并发按瓶颈优化。比较相同负载下的端到端尾延迟、错误率与任务质量，不能把并发数增加当成必然提速。</p>

<details data-knowledge-key="algorithm-graph"><summary>（12）如何计算岛屿数量？</summary></details>
<p>原帖只列出题名，需先确认四邻接或八邻接、网格表示及能否改写输入。按四邻接矩形 0/1 网格的教学约定，扫描到未访问陆地时计数加一，再用 BFS 或显式栈 DFS 标记整个连通分量，入队或入栈时就标记，避免重复。时间为 O(mn)，保留输入时访问表与栈最坏占 O(mn) 额外空间。</p>
