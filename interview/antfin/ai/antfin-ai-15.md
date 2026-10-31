### 蚂蚁机器学习实习一面：RAG 数据、幻觉与热点识别

原帖发表于 2024 年 4 月，自述为蚂蚁机器学习算法实习一面，约 50 分钟。具体部门、模型、数据集和面试日期未披露，以下保留可确认的技术问题。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-binding-status="pending_semantic_verification"><summary><strong>（1）RAG 项目的数据集怎样构建，先要澄清什么用途？</strong></summary>关联知识点待核实。</details>
<p>先区分知识语料、训练数据与问答评测数据，再按各自目标确定授权来源、质量和覆盖。保留出处与版本，独立验收集应避免近重复和调优泄漏，不能默认原帖所说的数据集属于其中某一种。</p>

<details data-knowledge-key="llm-capability-boundaries"><summary><strong>（2）怎样定位并缓解 RAG 中的大模型幻觉？</strong></summary></details>
<p>先区分没有检索到证据、上下文装配错误和生成越界，再分别检查召回、出处及回答约束。用独立样本验证引用是否支持结论，证据不足时澄清或保留不确定性，不能把接入知识库等同于消除幻觉。</p>

<details data-knowledge-key="rag-chunking"><summary><strong>（3）构建问答数据时，切分怎样保留语义？</strong></summary></details>
<p>按文档结构和语义边界切分，让问题、答案及限定条件能够一起被取回。保留标题、来源与相邻关系，并用真实检索样本比较粒度和重叠的影响，避免只按固定字数判断效果。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（4）论文中的情绪划分与共情怎样定义（论文细节待补）？</strong></summary>关联知识点待核实。</details>
<p>先给出论文实际使用的标签定义、标注规则和验证方式，再解释它们如何对应研究目标。原文没有披露论文、数据或方法，不能据此还原具体分类体系及实验结果。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（5）群聊场景中，怎样识别热点话题？</strong></summary>关联知识点待核实。</details>
<p>先明确时间窗口、话题定义和需要过滤的重复或噪声，再讨论聚合、排序与趋势检测。用人工核验样本检查主题一致性和时效性；原帖未披露输入规模与实现方案，具体知识关联待核实。</p>

<details data-knowledge-key="algorithm-array"><summary><strong>（6）三数之和怎样去重并控制复杂度？</strong></summary></details>
<p>以求和为零、三元组去重的常见版本为教学例，先排序，固定一个数后用双指针寻找其余两个数。跳过重复值并检查边界与溢出，典型时间复杂度为 O(n²)；原文没有记录目标值与输入约束。</p>
