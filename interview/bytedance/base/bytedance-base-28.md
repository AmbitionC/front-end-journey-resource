字节跳动 · Agent 开发 · 二面。面试经历为候选人自述，未独立证实；以下归纳记录中的问题，回答为独立整理，不代表现场作答或企业标准答案。

<details data-knowledge-key="rag-pipeline">
<summary>（1）如何介绍 RAG 系统的整体流程？</summary>
</details>

先讲文档摄取、解析、切分和索引，再讲查询侧的检索、重排、上下文组装与回答。说明正文、向量、版本和权限如何关联，最后用固定问题集验证召回与答案；流程能跑通不等于回答有证据或数据更新正确。

<details data-knowledge-key="rag-chunking">
<summary>（2）Markdown 怎样按标题分块、聚合和重叠？尾段怎样处理，分块与聚合大小分别设多少？</summary>
</details>

先保留标题与段落边界，再在长度预算内拆分或合并，需要父块时维护子块到父章节的映射。尾段是否合并取决于语义完整性和检索效果，不必补到固定长度；分块大小与聚合预算应给出项目实际值，并用评测解释依据。重叠能保留边界信息，也会增加重复召回，参数没有通用最优值。 [Unstructured：文档分块与合并](https://docs.unstructured.io/open-source/core-functionality/chunking)。

<details data-knowledge-key="rag-loader-parser">
<summary>（3）图片和列表怎样处理？逐图推理会不会拖慢入库？</summary>
</details>

列表保留层级与相邻说明，图片保留资产引用及所在位置；只对需要提取信息的图片选择 OCR 或视觉处理。相同资产可去重和缓存，耗时解析放入可追踪的异步任务。不能默认每张图片都要模型推理，也不能把尚未完成的解析记成已入库。

<details data-knowledge-key="vector-db-selection">
<summary>（4）项目实际用了什么 Embedding 模型和向量数据库，为什么这样选？</summary>
</details>

先如实给出项目实际模型、数据库和版本，再说明目标语言、领域查询、规模、过滤、更新频率、时延与运维约束。用相同查询集比较候选的检索质量，并记录维度和索引配置；换模型可能需要重建向量，不能只替换查询端名称。

<details data-knowledge-key="rag-query-rewrite">
<summary>（5）怎样举例解释问题改写，并说明子问题的拆解目的？</summary>
</details>

改写用于消歧、补足已确认上下文，拆解把多条件问题分成可求证的子问题。教学例子：已明确商品 A 后问“它能退吗”，可改写成查询商品 A 的退货条件；若还问退款到账时间，可分别检索条件和时效。原问题的实体、否定和范围必须保留，不能用改写补造用户意图。

<details data-knowledge-key="rag-latency-cost">
<summary>（6）改写和拆解一次做还是分步做？怎样控制用户等待？</summary>
</details>

可一次输出改写及子问题，也可分步验证，取舍看质量、依赖和时延预算。只有互不依赖的工作才适合并行；对不需要改写的问题直接跳过。分别测量处理、检索与生成耗时，展示进度不能算作已经开始回答。

<details data-knowledge-key="rag-hybrid-search">
<summary>（7）混合检索和重排怎样衔接？</summary>
</details>

关键词与向量各自召回候选，先按稳定文档或块 ID 去重，再融合排名，最后用重排器细化相关性。不同检索器的原始分数不能默认相加；重排无法补回候选池中不存在的证据，要分别评测召回、排序、答案及延迟。 [Elasticsearch：融合不同检索器的排名](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)。

<details data-knowledge-key="rag-access-control">
<summary>（8）企业级 RAG 与学习 Demo 有什么区别？</summary>
</details>

把企业级要求落到可验收行为：文档权限贯穿检索与缓存，更新和删除能传播，引用能定位版本，故障可追踪，质量与时延可回归验证。业务规模和收益要拿实际证据说明，不能仅用部署上线或企业级标签证明成熟度。

<details data-knowledge-key="probability-statistics-ai">
<summary>（9）只用等概率返回 0—4 的 random5()，怎样生成等概率的 0—6？</summary>
</details>

假设各次调用独立，取两次结果 a、b，令 x=5a+b，得到等概率的 0—24；只接受 x<21，再返回 x%7，否则重试。接受集合中每个余数恰好出现三次，直接对全部 25 个值取模会有偏差；拒绝采样没有固定的最坏尝试次数上限。

## 候选人反问（原帖记录）

<details data-knowledge-key="agent-skill-map">
<summary>（10）反问：Agent 方向校招生应准备哪些能力？</summary>
</details>

准备应围绕目标岗位的实际任务，展示能解释模型与工具执行边界、实现可验证的工程链路、定位失败并完成编码。具体招聘要求要以团队说明为准；候选人未记录该反问的现场答案，这里提供的是准备方法。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [Unstructured：文档分块与合并](https://docs.unstructured.io/open-source/core-functionality/chunking)（滚动文档）
- [Elasticsearch：融合不同检索器的排名](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)（滚动文档）
