问题选自作者自述的字节Agent开发一面记录。以下短答用于备面讲解，不代表作者当场作答。原记录标注9.3；页面发表于2026-09-04，面试年份不由发布日期反推。

<details data-knowledge-key="prompt-structured-output">
<summary>（1）简历评分如何输出结构化结果，并定义评分维度？</summary>
</details>

先明确岗位与可观测维度，为每项输出分值、依据片段、缺失信息和适用评分规则版本。用Schema校验结构，再检查分值范围与证据是否真的支持评价；格式合法不代表评分公正或事实正确。维度和权重需与业务标注校准，不能编造项目实际采用的比例。

<details data-knowledge-key="rag-pipeline">
<summary>（2）RAG 的离线上传与在线问答如何分开？</summary>
</details>

离线完成解析、清洗、分块、编码、权限及版本索引，在线按用户权限检索、重排、组织证据并回答。分别观察索引新鲜度、检索覆盖和生成忠实度；离线上传成功并不等于在线能召回正确证据。

<details data-knowledge-key="agent-coding">
<summary>（3）怎样理解 Agent Harness？</summary>
</details>

可把它理解为使模型持续完成任务的运行环境与控制设施：工具接口、状态与上下文管理、执行沙箱、权限预算、错误反馈、评测和恢复。术语边界随系统而异，回答要画出自己项目的模型、运行器和外部环境职责，不能把某一个Prompt或工具调用等同全部Harness。

<details data-knowledge-key="ai-observability">
<summary>（4）通常五分钟的任务变成十五到二十分钟，如何诊断？</summary>
</details>

以同任务、输入规模与版本对比trace，拆出排队、检索、模型首token与生成、工具耗时、重试和汇总；再看上下文膨胀、循环空转、并发竞争和下游限流。先找时间花在哪一段，不能只凭总时长判断模型变慢。

<details data-knowledge-key="ai-observability">
<summary>（5）找到慢环节后，如何优化并验证？</summary>
</details>

针对实测瓶颈选择有界并发、上下文裁剪、缓存、模型选择或工具批处理，并同时约束正确率、失败率与成本。长任务用队列与持久状态处理，deadline贯穿排队和重试；不能为了降低时延无条件提高并发或跳过结果核验。

<details data-knowledge-key="agent-tool-design">
<summary>（6）模型生成固定工具参数，如何保障调用可靠性？</summary>
</details>

先约束输入Schema并做业务和权限校验，错误返回稳定可解释的状态。结果须校验真实性与后置状态；对可重试错误设预算，副作用用幂等键，状态未知先对账。工具能返回文本不等于目标动作已完成。

<details data-knowledge-key="prompt-context-compression">
<summary>（7）对话轮次增加时，如何控制上下文，并减少摘要损失？</summary>
</details>

把当前目标、结构化状态、必要近期对话和按需检索证据分开，控制预算。压缩保留约束、否定、关键事实与来源、失败和未完事项，摘要可回查原文；用后续任务评测检查是否漏掉影响决策的信息。

<details data-knowledge-key="algorithm-backtracking">
<summary>（8）使用给定数字构造严格小于上界的最大数，怎样处理边界？</summary>
</details>

原文以n=23121、A={2,4,9}、结果22999说明数字可重复的例子。可沿上界高位保持相等，能选更小位时把后缀填最大值，走不通则回退；本例第二位选2小于3，后面填999。题目要求严格小于，构造结果恰好等于n时仍需找前驱；0、前导零、较短位数和无解表示应先澄清。

