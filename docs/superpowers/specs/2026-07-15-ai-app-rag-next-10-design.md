# AI 应用基础设施与 RAG 检索治理连续 10 条知识更新设计

## 目标

按远端 `master` 的 `knowledge/_tree.json` 叶子顺序和 `.codex/knowledge-update-history.json` 排除规则，创建下一批 10 个未处理知识点。本批补齐 AI 应用开发分支剩余的 5 个通用生产能力，并进入 RAG 分支的前 5 个检索质量与权限主题，以一个分支和一个 PR 完成调研、写作、配图、状态更新、校验与生产发布。

## 固定范围

本批只创建以下 10 篇文章，不改变 key、filePath、目录层级或排序：

1. `llm-audio-realtime` — 语音、音频与 Realtime 应用
2. `llm-provider-abstraction` — 模型供应商抽象层设计
3. `llm-api-security` — API Key、代理层与客户端安全
4. `llm-token-budget` — Token 预算、截断与上下文分配
5. `llm-user-feedback` — 用户反馈采集与质量闭环
6. `rag-query-rewrite` — 查询改写、分解与扩展
7. `rag-reranking` — Rerank 重排序原理与实践
8. `rag-metadata-filtering` — 元数据过滤与结构化检索
9. `rag-citation-grounding` — 引用溯源、Grounding 与事实一致性
10. `rag-access-control` — RAG 数据权限与多租户隔离

前 5 篇写入 `knowledge/llm/dev/{key}.md`，后 5 篇写入 `knowledge/llm/rag/{key}.md`。本批不修改其他知识文章，不处理两个既有孤儿 Markdown，不触碰面经、应用代码或基础设施仓库。

## 学习路径与内容边界

本批形成从实时交互基础设施进入检索增强质量治理的连续路径：

- **实时媒体与供应商边界**：音频文章解释会话、WebRTC/WebSocket、音频帧、打断和端到端延迟；抽象层文章区分领域请求、能力目录、适配器、事件和受控 provider escape hatch。
- **安全、预算与质量运营**：安全文章围绕客户端不持有长期密钥、BFF/代理鉴权、配额、最小权限、密钥轮换和日志脱敏；Token 文章建立输入/输出/工具/检索/安全余量的预算分配；反馈文章把显式评价、行为信号、问题分类、离线评测和发布门禁连接起来。
- **检索召回与排序**：查询改写解释规范化、扩展、分解、多查询合并与失败边界；Rerank 文章解释双阶段检索、cross-encoder/生成式打分、候选规模、延迟和评测。
- **过滤、证据与权限**：元数据过滤区分索引前过滤、检索器原生过滤和检索后过滤；引用文章建立 claim—evidence 映射、覆盖率与拒答；权限文章把租户、主体、资源、策略和索引/缓存隔离贯穿摄入与检索。

已有 `llm-multimodal-api`、`llm-stream-cancel-resume`、`llm-model-routing`、`prompt-context-compression`、`rag-fundamentals`、`rag-hybrid-search`、`rag-evaluation` 等文章作为前置。本批不重复音频基础、通用错误重试、向量/关键词检索入门或 RAG 总览，而是聚焦生产契约、检索质量和权限失败模式。

每篇使用 body-only 中文 Markdown，以开场心智模型、核心术语、机制、可执行示例、权衡与失败模式、小结和参考资料递进。标准、原始论文和官方文档优先；模型、实时 API、SDK 字段、上下文限制和供应商能力等易变内容明确为截至 2026-07-15 的实现现状，不写成永久通用规则。

## 调研证据要求

每篇写作前建立“论断—来源—置信度—时效性”证据地图。最低资料范围如下：

- 音频与 Realtime：WebRTC/W3C 或 MDN 标准资料、供应商官方 Realtime/Live/音频指南、浏览器音频采集与回声消除约束；区分传输、会话、模型和 UI 状态。
- 供应商抽象：OpenAI、Anthropic、Gemini 官方请求/事件/工具/错误文档；统一稳定领域语义，但不虚构跨供应商完全兼容。
- API 安全：OWASP API Security 与 LLM/GenAI 安全项目、供应商官方密钥安全建议、OAuth/HTTP 鉴权标准；不在正文给出可复制的真实密钥或弱代理示例。
- Token 预算：供应商 tokenizer、上下文与 usage 官方文档；预算公式是工程推导，明确估算与实际 usage 的差异。
- 用户反馈：供应商官方 evals/评测指南和 NIST AI RMF 等治理资料；行为信号不能直接等同满意度，训练/复用反馈数据前必须有授权。
- 查询改写与重排序：原始或权威论文、搜索/向量数据库官方文档；区分召回、排序、生成质量与端到端任务成功率。
- 元数据过滤：向量数据库官方过滤文档与数据库过滤原理；说明 pre-filter、in-filter、post-filter 的语义和选择性影响。
- 引用与 Grounding：供应商官方 grounding/citation 文档、RAG 评测研究；引用存在不等于 claim 被证据支持。
- RAG 权限：OWASP、NIST/零信任标准和数据库/向量系统的权限过滤文档；权限必须在检索前强制执行，不能靠模型拒答补救。

跨文章只复用直接支持当前论断的来源。正文重要结论附近放链接，末尾 `## 参考资料` 只列正文实际使用的来源，不复制通用资料清单。

## 配图设计

每篇生成一张核心教学图，共 10 张。沿用上一批的 warm-white 背景、navy/cyan/coral/violet 配色与精致 3D 矢量式教学信息图风格；不使用品牌标识、水印或依赖小字的语义。计划文件名与教学目的如下：

1. `llm-audio-realtime-session-pipeline-v1.webp`：麦克风、音频处理、实时传输、模型会话、增量音频与打断控制的双向链路。
2. `llm-provider-abstraction-capability-adapter-v1.webp`：领域请求经能力路由和 provider adapter 映射到不同供应商，并归一化事件与观测。
3. `llm-api-security-trust-boundary-v1.webp`：浏览器、BFF/代理、密钥库、策略/配额和供应商之间的信任边界。
4. `llm-token-budget-context-allocation-v1.webp`：固定上下文预算在指令、历史、检索、工具、输出和安全余量之间分配与回收。
5. `llm-user-feedback-quality-loop-v1.webp`：显式反馈、行为信号、问题分类、评测集、修复与灰度发布闭环。
6. `rag-query-rewrite-routing-tree-v1.webp`：原始查询经规范化、扩展、分解和多查询分支检索，再合并去重。
7. `rag-reranking-two-stage-ranking-v1.webp`：快速召回候选后由高精度重排器打分，截取小规模证据集。
8. `rag-metadata-filtering-pre-post-filter-v1.webp`：权限/元数据条件在候选生成前、中、后的三种位置与结果差异。
9. `rag-citation-grounding-evidence-chain-v1.webp`：答案 claim 与来源 chunk、文档、页码形成可核验证据链，并检查覆盖和支持关系。
10. `rag-access-control-tenant-boundary-v1.webp`：主体身份、策略决策、租户过滤、隔离索引/缓存和审计日志组成纵深权限边界。

图片保存于仓库 `images/`，统一转为 1672×941 WebP，并使用对应 OSS URL。发布前逐张检查组件、箭头和语义；不得把浏览器密钥包装当安全代理、把客户端取消当服务端停止、把 token 估算当账单、把点击当满意、把引用当事实正确，或把检索后过滤当严格权限隔离。

## 状态与发布数据流

1. 创建 10 个预期 Markdown，并把对应目录叶子的 `contentStatus` 从 `coming-soon` 改为 `published`。
2. 将上一批已合并且 Action 成功的 10 条历史记录从 `pending` 提升为 `published`：`llm-api-basics`、`llm-conversation-state`、`llm-multimodal-api`、`llm-error-retry-fallback`、`llm-model-routing`、`llm-response-api-patterns`、`llm-stream-cancel-resume`、`llm-batch-api`、`llm-file-input`、`llm-vision-app`。
3. 为本批新增 10 条历史记录，使用稳定 key、目录 label、实际 filePath、`action: created`、批次 `ai-app-rag-next-10-2026-07-15`、日期 `2026-07-15` 和 `status: pending`。
4. 文章、图片、目录和历史记录必须位于同一分支与 PR。
5. 合并后等待 merge SHA 对应的 `sync-content` Action；以 FaaS 返回 1 个 manifest、10 篇文章、10 张图片、0 删除和 `errors: []` 作为发布完成证据。
6. 本批新记录保持 `pending`，由下一批提升；整体进度按 published 与已成功发布的 merged-pending 去重计算。

## 验证与失败处理

发布前必须满足：

- 10 个目标叶子各有且只有一个预期 Markdown 文件；
- 每篇包含一张精确匹配的 OSS WebP、一个参考资料节、无 H1、无未使用的末尾来源；
- 10 张 WebP 均可解码为 1672×941，URL 与仓库文件一一对应；
- 不存在 `IMAGE2_PENDING`、本机绝对路径、临时生成路径、假引用或密钥形态内容；
- 目录只改变 10 个目标叶子的 `contentStatus`，不改变 key、filePath 和排序；
- 历史记录 key 唯一，旧 10 条 pending 正确提升，新 10 条 pending 完整；
- `pnpm run validate:tree` 通过，预期警告降为 132 个待写文件并保留相同两个孤儿警告；
- scoped diff 不含无关文件，PR 可干净合并；
- 资源 Action 对合并 SHA 返回成功。

若一手资料不足、配图语义错误、校验失败或 Action 失败，则停止在对应阶段并保留可恢复状态，不把批次报告为完成。Action 成功后不额外打开生产站点。

## 完成标准

PR 已合并，远端 `master` 包含 10 篇文章、10 张图片和匹配的目录/历史变更；FaaS 同步成功且无错误。预期目录从 158 个 published 变为 168，coming-soon 从 142 变为 132；历史从 59 条变为 69 条，其中 59 条 published、10 条 pending；整体更新进度从 59/300 变为 69/300（23.00%）。
