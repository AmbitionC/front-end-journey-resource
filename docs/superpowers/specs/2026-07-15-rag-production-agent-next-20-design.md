# RAG 生产化与 Agent 编排连续 20 篇知识更新设计

## 目标与批准依据

基于远端 `master` 提交 `c7c7458d3c6bf68077e4817954ba9ffd214a114e`，按 `knowledge/_tree.json` 叶子顺序和 `.codex/knowledge-update-history.json` 排除规则，创建下一批 20 个未处理知识点。用户明确要求“再更新 20 篇”，并已在前序批次确认目录顺序、逐篇配图、单 PR 合并和 Action 验收的完整发布语义，因此本批复用该设计，不再次请求相同决策。

本批用一个分支和一个 PR 交付，但内部拆成两组各 10 篇完成调研、配图、写作与结构检查。第一组出现系统性资料、图片或格式问题时，不进入第二组。

## 固定范围

严格创建以下 20 篇，不改变 key、label、filePath、目录层级或排序：

1. `rag-production-ingestion` — 生产级文档解析、索引与增量更新
2. `rag-loader-parser` — 文档 Loader、Parser 与版面解析
3. `rag-table-retrieval` — 表格、数据库与结构化数据检索
4. `rag-image-retrieval` — 图像、OCR 与多模态检索
5. `rag-code-retrieval` — 代码仓库切分、索引与检索
6. `rag-graph-rag` — GraphRAG 与知识图谱增强检索
7. `rag-parent-child` — Parent-Child 与 Small-to-Big Retrieval
8. `rag-multi-query` — Multi-Query 与多路召回
9. `rag-routing` — 查询路由与多索引选择
10. `rag-context-compression` — 检索上下文压缩与去噪
11. `rag-deduplication` — 文档去重、近重复检测与规范化
12. `rag-index-versioning` — 索引版本、重建与回滚
13. `rag-cache` — Embedding、检索与答案缓存
14. `rag-latency-cost` — RAG 延迟、吞吐与成本优化
15. `rag-testing` — RAG 测试集、Golden Set 与回归测试
16. `rag-failure-debugging` — RAG 失败诊断：数据、召回、排序与生成
17. `agent-tool-design` — Agent 工具契约、Schema 与错误语义
18. `agent-workflow-state` — 工作流状态、检查点与断点续跑
19. `agent-planning` — 任务规划、分解与动态重规划
20. `agent-handoff` — Handoff、Agent-as-Tool 与职责边界

前 16 篇写入 `knowledge/llm/rag/{key}.md`，后 4 篇写入 `knowledge/llm/agent/{key}.md`。本批不修改其他文章，不处理两个既有孤儿文件，不触碰应用或基础设施仓库。

## 学习路径与文章边界

本批先补完 RAG 分支，再进入 Agent 运行时编排：

- **数据进入知识系统**：生产摄取文章讲端到端数据生命周期；Loader/Parser 聚焦格式、版面、坐标和解析质量；表格、图像、代码分别讲结构化、多模态和符号语义检索，避免把所有输入都强行扁平化为纯文本。
- **召回结构升级**：GraphRAG 讲实体、关系、社区和局部/全局查询；Parent-Child 讲小块匹配与大块回填；Multi-Query 讲多表达召回和排名融合；Routing 讲按意图、权限和数据类型选择索引；Context Compression 只在已授权候选内删除噪声。
- **索引与运行治理**：去重解决相同/近似内容污染；索引版本讲不可变构建、影子验证和原子切换；缓存区分 embedding、检索与答案的键和失效；延迟成本建立分阶段预算；测试和失败诊断把质量回归连接到数据、召回、排序和生成层。
- **Agent 编排入口**：工具设计文章定义输入/输出 Schema、错误和副作用语义；工作流状态文章定义事件、检查点、幂等和恢复；规划文章区分任务分解、执行反馈和受限重规划；Handoff 文章区分职责转移与 Agent-as-Tool 调用，并保持上下文、权限和所有权边界。

已有 `rag-pipeline`、`rag-chunking`、`rag-hybrid-search`、`rag-query-rewrite`、`rag-reranking`、`rag-metadata-filtering`、`rag-citation-grounding`、`rag-access-control`、`agent-architecture`、`agent-react` 和 `multi-agent` 作为前置。本批不重复 RAG 定义、基础 embedding、通用工具调用或多 Agent 总览。

每篇使用 body-only 中文 Markdown，无 H1；结构以心智模型、机制、工程流程、具体示例、评测/监控、失败模式、检查清单、小结和 `## 参考资料` 递进。重要事实附近放来源链接，末尾只列正文实际使用的一手资料。

## 调研与证据策略

写作前创建仓库外证据地图，每篇记录学习目标、关键论断、来源、置信度和时效性。来源优先级为标准/规范、原始论文、官方产品或维护者文档。

- 文档摄取与解析：Apache Tika、Unstructured、PDF/HTML/OpenXML 等格式规范或官方文档；区分解析事实、版面推断和 OCR 不确定性。
- 结构化与多模态检索：PostgreSQL/数据库官方文档、OpenAI/Gemini 等当前视觉输入文档、OCR 官方资料；供应商字段标注截至 2026-07-15。
- 代码与图检索：Tree-sitter、Language Server Protocol、Git 对象模型、Microsoft GraphRAG 原始论文和官方实现；区分符号图、调用图和知识图谱推断。
- 多路检索与压缩：RAG-Fusion/RRF、RECOMP、LLMLingua 等原始论文；实验收益只作为论文结果，不外推为项目保证。
- 去重、版本、缓存与性能：MinHash/SimHash 原始资料、Elasticsearch/Qdrant/Pinecone/Redis/HTTP 缓存等官方文档；具体限制和 API 保持日期标记。
- 测试与诊断：RAGAS 原始论文、OpenTelemetry 规范、NIST TEVV/AI RMF 资料；区分召回、排名、引用和答案指标。
- Agent 工具与编排：JSON Schema、MCP、供应商工具/Agents 官方文档、ReAct 与规划论文、Temporal/LangGraph 等持久工作流文档；具体 SDK 行为只作为当前实现例子。

不得编造论文结论、供应商兼容性、固定最优 top-k、费用或性能数字。示例参数写成可评测起点，不写成通用最佳实践。

## 配图设计

每篇一张核心教学图，共 20 张。使用 16:9 高对比教学信息图，限制短英文标签，不使用品牌标识、水印、密钥、长段文字或装饰性角色。最终统一为 1672×941 RGB WebP：

1. `rag-production-ingestion-versioned-pipeline-v1.webp`：来源变更经发现、解析、规范化、分块、嵌入、影子索引和原子发布，删除事件贯穿全链路。
2. `rag-loader-parser-layout-tree-v1.webp`：文件字节经 Loader 解码后由 Parser 重建标题、段落、表格、图像、页码和坐标树，并输出质量信号。
3. `rag-table-retrieval-query-routing-v1.webp`：自然语言问题在 Schema/权限门禁后路由到 SQL、表格单元格检索或文本解释，再形成可引用证据。
4. `rag-image-retrieval-multimodal-evidence-v1.webp`：原图、OCR 文本、区域框和多模态向量共同召回，并保留坐标和来源关系。
5. `rag-code-retrieval-symbol-graph-v1.webp`：仓库快照经语法树、符号和依赖边生成多索引，查询按定义、引用、调用链和语义路径检索。
6. `rag-graph-rag-local-global-v1.webp`：文本抽取实体关系、构建社区摘要，局部实体查询与全局主题查询走不同路径并回到原始证据。
7. `rag-parent-child-small-big-v1.webp`：小块负责高精度匹配，稳定 parent ID 回填较大上下文并去重预算。
8. `rag-multi-query-fusion-v1.webp`：原始问题生成受约束的多路检索查询，各自召回后通过 RRF/加权融合去重。
9. `rag-routing-multi-index-v1.webp`：路由器基于意图、数据类型、时效和权限选择文档、表格、代码或图索引，并保留回退路径。
10. `rag-context-compression-evidence-filter-v1.webp`：已授权候选经相关片段抽取、冗余删除和 token 预算压缩，来源定位不丢失。
11. `rag-deduplication-near-duplicate-v1.webp`：规范化、精确哈希、MinHash/SimHash 候选和语义复核分层识别相同与近重复文档。
12. `rag-index-versioning-blue-green-v1.webp`：不可变 v1/v2 索引并行构建、影子评测、别名原子切换、回滚和旧版本回收。
13. `rag-cache-layered-keys-v1.webp`：Embedding、检索、重排和答案四层缓存使用不同键、权限摘要、版本和失效触发器。
14. `rag-latency-cost-budget-v1.webp`：摄取与在线查询分离，在线链路按路由、召回、重排、生成划分延迟/成本预算与降级。
15. `rag-testing-golden-set-pyramid-v1.webp`：单元、组件、离线 Golden Set、端到端和线上监控组成测试金字塔，数据切片贯穿各层。
16. `rag-failure-debugging-stage-funnel-v1.webp`：从答案症状沿 trace 逆向定位生成、上下文、重排、召回、索引和源数据阶段。
17. `agent-tool-design-contract-v1.webp`：Agent 工具契约包含输入 Schema、授权、执行、副作用、结构化结果和可判定错误。
18. `agent-workflow-state-checkpoint-v1.webp`：事件日志驱动状态机，在副作用前后写检查点，崩溃后按幂等键恢复。
19. `agent-planning-replan-loop-v1.webp`：目标分解为带依赖的计划，执行观测触发有限重规划，预算与不可变约束包围循环。
20. `agent-handoff-responsibility-boundary-v1.webp`：Orchestrator、Agent-as-Tool 和 Handoff 三种协作路径对比上下文、控制权、权限和最终责任。

发布前逐张检查箭头、顺序与边界。不得把解析推断画成原始事实、把 OCR 文本画成像素真相、把 GraphRAG 社区摘要当原始证据、把后压缩当授权、把缓存命中当新鲜、把本地取消当副作用回滚，或把 handoff 画成无边界广播。

## 数据与发布流程

1. 第一组创建前 10 篇与前 10 张图，运行组内路径、正文和图片断言。
2. 第二组创建后 10 篇与后 10 张图，再运行同样断言。
3. 将本批 20 个叶子的 `contentStatus` 从 `coming-soon` 改为 `published`，不改变其他字段。
4. 将上一批 10 条 `ai-app-rag-next-10-2026-07-15` 记录从 `pending` 提升为 `published`。
5. 新增本批 20 条历史记录：`status: pending`、`action: created`、`recordedAt: 2026-07-15`、批次 `rag-production-agent-next-20-2026-07-15`。
6. 文章、图片、目录、历史、设计和计划进入同一分支与 ready PR。
7. 合并后等待 merge SHA 对应的 `sync-content`；以 `manifests: 1`、`articles: 20`、`images: 20`、`deleted: 0`、`errors: []` 为发布完成证据。

## 预期状态与验证

合并后预期：

- 目录：300 个唯一叶子，188 `published`，112 `coming-soon`；
- 历史：89 个唯一记录，69 `published`，20 `pending`；
- 本批：20 个目标 Markdown、20 个匹配 WebP、20 个 pending 记录；
- 总体进度：89/300，四舍五入为 29.67%。

发布前必须通过：

- `pnpm run validate:tree`，只保留预期 112 个待写文件和相同两个既有孤儿警告；
- 两个 10 篇子批次各自通过 article/image/source 检查；
- 所有 WebP 可解码为 1672×941，文件名唯一；
- 每篇只有一个匹配的 OSS 图片 URL、无 H1、有 `## 参考资料`，末尾来源均在正文实际使用；
- 一手资料链接可访问，易变事实带日期或版本边界；
- 无 `IMAGE2_PENDING`、本机路径、生成目录、临时 URL、真实密钥或凭据形态文本；
- 相对远端基线，目录只改变 20 个状态，历史只提升前批 10 条并追加本批 20 条；
- `git diff --check` 通过，最终 PR 变更数为 44 个文件：20 Markdown、20 WebP、2 JSON、设计和计划。

## 完成标准

PR 合并到 `master`，远端包含全部 40 个内容资源和匹配元数据；merge SHA 的资源 Action 返回成功且无错误。报告创建 20、更新 0、跳过 0、失败 0、待处理配图 0，并以固定格式结束：

```text
整体进度：89/300（29.67%）
```
