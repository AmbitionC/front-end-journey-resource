# AI 应用开发连续 10 条知识更新设计

## 目标

按 `knowledge/_tree.json` 的叶子顺序和 `.codex/knowledge-update-history.json` 的排除规则，创建当前下一批 10 个未处理知识点。本批连续补齐 AI 应用开发分支中从通用 API 契约到视觉应用的 10 篇文章，以一个分支和一个 PR 完成研究、写作、配图、状态更新、校验与生产发布。

## 固定范围

本批只创建以下 10 篇文章，不改变 key、filePath、目录层级或排序：

1. `llm-api-basics` — 大模型 API 通用模型：消息、响应与计费
2. `llm-conversation-state` — 对话状态、会话与历史管理
3. `llm-multimodal-api` — 多模态输入输出应用开发
4. `llm-error-retry-fallback` — 超时、重试、Fallback 与错误处理
5. `llm-model-routing` — 模型路由与多供应商适配
6. `llm-response-api-patterns` — Responses、Chat 与统一生成接口模式
7. `llm-stream-cancel-resume` — 流式请求取消、续传与状态恢复
8. `llm-batch-api` — Batch 批处理与离线任务
9. `llm-file-input` — 文件上传、解析与大文件处理
10. `llm-vision-app` — 视觉理解与图像生成应用

全部文章写入 `knowledge/llm/dev/{key}.md`。本批不修改其他知识文章，不处理两个既有孤儿 Markdown，也不触碰面经内容或基础设施仓库。

## 学习路径与内容边界

本批形成一条连续的生产应用路径：

- **通用请求模型**：先解释消息、内容分片、响应、用量、停止原因和计费观测，再把对话状态区分为供应商状态、应用状态和可重放事件。
- **输入能力与可靠性**：多模态文章聚焦内容部件、媒体处理和能力发现；错误处理文章建立超时预算、有限重试、熔断、降级和人工失败出口。
- **接口抽象与演进**：模型路由解释能力、质量、延迟、成本和合规约束；统一接口文章比较 Responses、Chat 等接口形态，并用内部领域模型隔离差异。
- **长任务与媒体应用**：流式恢复文章围绕取消传播、事件序列、幂等和重放；Batch 文章解释离线任务生命周期；文件文章覆盖安全上传、解析、分块和引用；视觉文章区分图像理解与生成的输入、输出、评测和安全边界。

已有 `openai-sdk`、`function-calling`、`llm-sse-streaming`、`aigc-application` 等文章作为前置材料。本批只解释供应商中立的系统模型与跨接口设计，不复制已有 SDK 入门、SSE 帧解析或 BFF 基础内容。

每篇采用 body-only 中文 Markdown，不重复目录标题。结构按开场心智模型、核心术语、工作机制、可执行示例、权衡与失败模式、小结、参考资料展开。重要事实优先使用标准、规范和供应商官方文档；API、保留策略、Batch 窗口、媒体限制、计费与模型能力等易变内容明确供应商差异和核验日期，不写成永久通用规则。

## 调研证据要求

每篇在写作前建立“论断—来源—置信度—时效性”证据图谱。最低资料范围如下：

- 通用 API 与接口模式：OpenAI Responses/Chat 官方文档、Anthropic Messages API、Gemini generateContent/Interactions 文档，以及各接口的 usage、停止原因和多模态内容结构。
- 对话状态：OpenAI Conversations/previous response 机制、Anthropic Messages 无服务端会话假设、Gemini交互状态文档；应用侧事件溯源与摘要结论只作为工程推导明确标注。
- 错误与可靠性：HTTP Semantics、供应商错误码/重试指南和 SDK 官方行为；区分连接失败、限流、服务端失败、内容拒绝、用户取消与业务校验失败。
- 路由：各供应商模型能力与模型目录官方文档；路由策略以可测能力和应用政策为准，不用营销榜单代替业务评测。
- 流、批处理与文件：WHATWG Streams/Abort API、SSE 规范、官方 Batch/File API 文档和 OWASP 文件上传安全指南。
- 视觉应用：官方视觉理解与图像生成指南，以及输入图像细节、输出格式、内容安全和质量评测的当前接口说明。

跨供应商差异仅在直接支持该论断时引用；不复制通用参考资料列表。正文中的重要结论附近放来源链接，末尾 `## 参考资料` 只列正文实际使用的来源。

## 配图设计

每篇生成一张核心教学图，共 10 张，采用统一的深色高对比教育信息图风格；每张图只解释一个核心机制，短英文标签由中文正文和图注补充。计划文件名与教学目的如下：

1. `llm-api-basics-request-lifecycle-v1.webp`：从消息与内容部件到模型响应、usage、计费与日志的请求生命周期。
2. `llm-conversation-state-authoritative-state-v1.webp`：供应商响应链、应用事件日志、结构化事实与压缩历史的权威边界。
3. `llm-multimodal-api-content-parts-pipeline-v1.webp`：文本、图像、音频、文件等内容部件经能力检查与预处理进入模型并产生多类型输出。
4. `llm-error-retry-fallback-reliability-ladder-v1.webp`：超时预算、错误分类、退避重试、熔断、模型降级和安全失败阶梯。
5. `llm-model-routing-policy-decision-v1.webp`：请求约束、能力目录、质量/延迟/成本/合规策略与执行后反馈。
6. `llm-response-api-patterns-adapter-matrix-v1.webp`：内部生成请求经适配器映射到 Responses、Chat、Messages、generateContent 等接口。
7. `llm-stream-cancel-resume-event-log-v1.webp`：取消信号贯穿客户端与上游，持久事件日志支持确认点和受控恢复。
8. `llm-batch-api-offline-lifecycle-v1.webp`：JSONL/任务清单、校验、提交、轮询/回调、结果关联、失败重跑与过期清理。
9. `llm-file-input-ingestion-pipeline-v1.webp`：安全上传、类型检测、恶意内容扫描、解析、分块、索引与带引用使用。
10. `llm-vision-app-understand-generate-loop-v1.webp`：视觉理解与图像生成两条路径的输入、模型、校验、编辑反馈和安全出口。

图片统一保存于仓库 `images/` 并使用对应 OSS URL。发布前逐张检查组件、箭头、标签和语义；不得把缓存当状态持久化、把取消当服务端回滚、把 Fallback 当无条件静默切换、把 Schema 正确当事实正确，或把文件扩展名当可信 MIME。

## 状态与发布数据流

1. 创建 10 个预期 Markdown，并把对应目录叶子的 `contentStatus` 从 `coming-soon` 改为 `published`。
2. 将历史记录中上一批已合并且 Action 成功的 10 条 `pending` 提升为 `published`：`llm-long-context`、`llm-open-source-deployment` 和 8 个 Prompt 文章键。
3. 为本批新增 10 条历史记录，写入稳定 key、label、filePath、`action: created`、批次 `ai-application-next-10-2026-07-15`、日期 `2026-07-15` 和 `status: pending`。
4. 文章、图片、目录树和历史记录放在同一分支与 PR 中。
5. 合并到 `master` 后等待 `sync-content` Action；以 merge SHA 匹配、FaaS 返回文章/图片/manifest 数量且 `errors: []` 作为发布完成证据。
6. 本批新记录在本次合并中保持 `pending`，下一批再提升；整体进度按 published 与已成功发布的 merged-pending 去重计算。

## 验证与失败处理

发布前必须满足：

- 10 个目标叶子各有且只有一个预期 Markdown 文件；
- 每篇包含一张匹配的 OSS WebP 图、一个参考资料节、无 H1、无未使用的末尾来源；
- 10 张图片均能解码为一致尺寸，URL 与仓库文件一一对应；
- 不存在 `IMAGE2_PENDING`、本机绝对路径、临时 URL、生成目录或密钥；
- 目录只改变 10 个目标叶子的 `contentStatus`，不改变 key、filePath 和顺序；
- 历史记录 key 唯一，旧 10 条 pending 正确提升，新 10 条 pending 完整；
- `pnpm run validate:tree` 通过，scoped diff 不含无关文件；
- PR 可干净合并，资源 Action 对合并 SHA 返回成功。

如果一手资料不足、配图语义错误、校验失败或 Action 失败，则停止在对应阶段并保留可恢复状态，不把批次报告为完成。Action 成功后不额外打开生产站点。

## 完成标准

PR 已合并，远端 `master` 包含 10 篇文章、10 张图片和匹配的目录/历史变更；FaaS 同步成功且无错误。预期目录状态从 148 个 published 变为 158 个 published，待写从 152 变为 142；历史从 49 条变为 59 条，其中 49 条 published、10 条 pending；整体更新进度从 49/300 变为 59/300（19.67%）。
