### 饿了么 AIGC 实习一面：Attention、训练与扩散模型

记录自述为 2024 年 3 月饿了么 AIGC 暑期实习一面，原帖发表于同年 4 月。实际部门、项目配置和训练数据未披露，以下选取可确认的技术问题。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-knowledge-key="llm-capability-boundaries"><summary><strong>（1）怎样说明自己对 AIGC 与 LLM 的理解？</strong></summary></details>
<p>先区分内容生成任务、语言模型的机制与产品能力，再用自己实际验证过的任务说明效果。交代幻觉、数据时效和工具依赖等边界，避免把生成流畅或一次演示视为通用可靠能力。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（2）怎样讨论 AGI 的可能性与判断标准？</strong></summary>关联知识点待核实。</details>
<p>先明确所采用的 AGI 定义和可检验能力标准，再区分已观察到的结果与对未来的推测。原文没有给出判断标准，不能把主观看法写成确定预测或把语言能力等同于意识。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（3）怎样介绍自己的预训练实践（个人实践待补）？</strong></summary>关联知识点待核实。</details>
<p>按真实参与范围说明数据、目标、训练配置和验证证据，区分亲自执行、旁观理解与复现学习。原帖没有公开实际实践细节，不能代作者编写训练经历或指标。</p>

<details data-knowledge-key="transformer-arch"><summary><strong>（4）Transformer 中的 Attention 怎样计算，解决什么问题？</strong></summary></details>
<p>沿 Q、K、V 的来源、相似度、缩放、掩码和加权汇总解释信息如何按上下文组合。再说明多头、位置与复杂度的作用，避免只背公式而不解释输入输出和适用条件。</p>

<details data-knowledge-key="llm-training-overview"><summary><strong>（5）LLM 训练的整体过程怎样说明？</strong></summary></details>
<p>先说明预训练目标与数据，再区分监督微调、偏好对齐和评测各自改变什么。沿数据质量、验证与回归解释每个阶段的验收，而不是把所有模型都描述成同一条固定流水线。</p>

<details data-knowledge-key="llm-rlhf-dpo"><summary><strong>（6）RLHF 的目标与流程怎样理解？</strong></summary></details>
<p>先解释如何收集偏好并构造评价信号，再说明策略优化及与参考行为的约束。区分经典奖励模型加策略优化的 RLHF 与直接偏好优化等方法，并检查奖励偏差和能力回归。</p>

<details data-knowledge-key="diffusion-basics"><summary><strong>（7）DDPM 的加噪训练与反向采样有什么区别？</strong></summary></details>
<p>训练从真实样本构造带噪输入，学习给定时间步下的预测目标；采样从噪声出发迭代更新，逐步得到样本。区分已知前向过程、可学习模型和采样调度，不能把一次训练更新当成完整生成链。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（8）NLP 的发展脉络怎样概括（考察范围待补）？</strong></summary>关联知识点待核实。</details>
<p>先明确要比较的是表示方式、模型结构还是训练范式，再解释各阶段解决了哪些问题与保留哪些限制。原帖没有给出预期范围，不补造具体年代或现场追问。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（9）怎样复盘一次 PyTorch 问题（实际案例待补）？</strong></summary>关联知识点待核实。</details>
<p>用真实错误、最小复现、定位证据和修复后验证组织回答。原帖没有给出具体 Bug，不能替作者捏造显存、精度或梯度问题。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（10）怎样按任务选择常见损失函数？</strong></summary>关联知识点待核实。</details>
<p>先定义预测目标、输出形式与标签类型，再核对损失函数接受的是概率、对数值还是原始分数及其数值约束。结合实际任务比较误差与指标，原帖没有指定函数清单，具体知识关联待核实。</p>
