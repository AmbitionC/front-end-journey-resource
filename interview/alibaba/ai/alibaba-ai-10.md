问题选自作者自述的面试记录。以下短答用于备面讲解，不代表作者当场作答；仅选录可核实的教学范围，未覆盖的原帖子问不补写。页面标注3月10日，未确认面试年份。

<details data-knowledge-key="rag-pipeline">
<summary>（1）RAG 的流程和编码模型能力怎样说明与验证？</summary>
</details>

先解析并切分资料，编码入索引，再为查询召回、重排、组装证据并生成可溯源回答。编码模型把输入映射到可比较向量，但相似度不等于答案正确；用领域查询与相关文档标注评估召回，并检查长文、专有词、多语言和成本。端到端还要单独看回答与引用。

<details data-knowledge-key="rag-image-retrieval">
<summary>（2）图文检索中的文本代理与原生多模态表示有什么不同？</summary>
</details>

文本代理可用OCR或图像描述转文本后检索，便于复用文本索引，但可能丢掉布局和视觉细节；多模态表示让图像和文本进入可比较空间。CLIP可用于图文相似检索，但不能仅凭相似度证明某界面控件的交互语义，仍需界面文档与状态信息。

<details data-knowledge-key="rag-evaluation">
<summary>（3）RAG 评估应优先看什么？</summary>
</details>

先按任务定义正确结果，再分开测检索覆盖、证据相关性、回答正确性和忠实度，同时记录拒答、延迟与成本。没有跨任务恒定的“最重要单指标”：检索缺证据就先修召回，高风险任务还需把错误引用与不当作答单列约束。

<details data-knowledge-key="rag-graph-rag">
<summary>（4）普通 RAG 的局限，以及 GraphRAG 增量更新的难处？</summary>
</details>

跨段关系和全局主题可能难由局部向量相似度覆盖。GraphRAG增加实体关系、社区和摘要等派生索引，代价是抽取错误、实体消歧和构建成本。增量数据会影响邻域、社区和摘要，需保留原文出处与版本，区分可局部更新和需重算的部分；不能把生成的图当事实源。

<details data-knowledge-key="llm-training-overview">
<summary>（5）讲微调经历时，怎样说明真正负责的工作？</summary>
</details>

按目标失败、数据来源与清洗、训练配置、对照实验和保留测试集说明个人职责。数据泄漏和评价口径比堆训练参数更值得先排查；没有做过的训练环节应明确说明，不编造增益或职责。

<details data-knowledge-key="llm-rlhf-dpo">
<summary>（6）DPO 与采用 PPO 的偏好优化路径有什么差异？</summary>
</details>

DPO通常直接用chosen/rejected偏好对和参考策略构造优化目标；经典PPO式RLHF常包含奖励模型、当前策略采样与受约束策略更新。DPO省去显式奖励模型和训练内PPO rollout，却仍依赖偏好覆盖与独立测试；PPO的在线探索也有奖励投机与训练复杂性。

<details data-knowledge-key="agent-workflow-state">
<summary>（7）选择 LangGraph 等框架时应看哪些约束？</summary>
</details>

从有无显式图状态、持久化检查点、恢复、人工介入和动态工具选择需求出发，再核对实际版本能力。固定流程和动态Agent都可以建在图上，框架名称不会替代工具契约、终止条件和业务验收。

<details data-knowledge-key="rag-image-retrieval">
<summary>（8）解释软件截图中的组件，如何避免把视觉相似当成功能相同？</summary>
</details>

把截图区域、OCR文本、布局、应用版本和组件文档一起检索；图片框与视频框可结合播放标识、控件属性或产品文档区分。只有静态像素不足时，给候选解释并明确不确定性或请求补充状态；不能猜隐藏交互。

