# Agent 主题 300 点核心知识架构

> 状态：已于 2026-07-14 应用到 `knowledge/_tree.json`。新增文章按目录顺序逐步发布。

## 目标比例

| 方向 | 核心知识点 | 占比 |
|---|---:|---:|
| Agent 与大模型核心 | 165 | 55% |
| 服务端工程 | 45 | 15% |
| 数据工程 | 35 | 11.67% |
| 计算机与算法基础 | 25 | 8.33% |
| 前端核心 | 20 | 6.67% |
| 项目与职业 | 10 | 3.33% |
| **合计** | **300** | **100%** |

## 设计结果

- Agent 与 LLM 占 55%，构成网站主题和默认学习顺序。
- 服务端、数据、计算机与算法合计 35%，覆盖运行、存储、检索、可靠性和性能基础。
- 前端缩减为 20 个核心点，并增加 Agent Chat UI、流式渲染、引用展示和工具审批等产品能力。
- 项目与职业保留 10 个结果导向知识点。
- 当前方案复用 128 个现有知识点，规划新增 172 个知识点。
- 已完成更新的 29 个知识点全部保留在核心地图中。
- 未匹配新目录的 189 篇旧文章已按任务要求删除，迁移明细见 `resource-migration-manifest.json`。

## 核心知识点

### Agent 与大模型核心（165）

#### LLM 基础（17）

1. `transformer-arch` — Transformer 架构原理
2. `llm-token-context` — Token、Context Window 与 KV Cache
3. `llm-inference-params` — LLM 推理参数：Temperature / Top-P / Top-K
4. `llm-model-selection` — 模型能力评估与选型（由“如何选择合适的模型和版本”调整）
5. `llm-model-compare` — 主流模型能力与适用场景对比（由“主流模型对比：GPT / Claude / Qwen / DeepSeek”调整）
6. `llm-capability-boundaries` — 大模型的能力边界、幻觉与不确定性（新增）
7. `llm-multimodal-basics` — 多模态模型基础：文本 / 图像 / 音频（新增）
8. `llm-tokenizer` — Tokenizer、词表与子词切分（新增）
9. `llm-training-overview` — 大模型训练全流程概览（新增）
10. `llm-pretraining` — 预训练目标、数据与 Scaling（新增）
11. `llm-alignment` — 模型对齐：SFT、偏好数据与安全（新增）
12. `llm-rlhf-dpo` — RLHF、RLAIF 与 DPO 的差异（新增）
13. `llm-quantization` — 模型量化与精度权衡（新增）
14. `llm-moe` — MoE 混合专家模型原理（新增）
15. `llm-reasoning-models` — 推理模型、思考预算与使用边界（新增）
16. `llm-long-context` — 长上下文、注意力稀释与有效利用（新增）
17. `llm-open-source-deployment` — 开源模型选型、推理与本地部署（新增）

#### Prompt 与上下文工程（15）

1. `prompt-basics` — Prompt 设计基础与原则
2. `prompt-system` — System Prompt 设计模式
3. `prompt-few-shot` — Few-Shot 与 Zero-Shot 提示
4. `prompt-structured-output` — 结构化输出与 JSON Schema
5. `prompt-cot` — 推理提示策略与适用边界（由“Chain-of-Thought 思维链技巧”调整）
6. `context-engineering` — 上下文工程（Context Engineering）（由“上下文工程(Context Engineering)”调整）
7. `prompt-versioning` — Prompt 版本管理与 A/B 测试
8. `prompt-testing-debugging` — Prompt 调试、测试与回归验证（新增）
9. `prompt-role-boundaries` — System、Developer、User 消息的职责边界（新增）
10. `prompt-instruction-hierarchy` — 指令优先级与冲突处理（新增）
11. `prompt-template-design` — Prompt 模板、变量与复用设计（新增）
12. `prompt-examples-selection` — 示例选择、排序与动态 Few-Shot（新增）
13. `prompt-output-validation` — 模型输出校验与自动修复（新增）
14. `prompt-context-compression` — 上下文压缩、摘要与裁剪（新增）
15. `prompt-cache-design` — Prompt Cache 与稳定前缀设计（新增）

#### AI 应用开发（24）

1. `llm-api-basics` — 大模型 API 通用模型：消息、响应与计费（新增）
2. `openai-sdk` — OpenAI SDK 核心使用（由“OpenAI SDK 完整使用指南”调整）
3. `function-calling` — Function Calling 与工具调用（由“Function Calling 工具调用”调整）
4. `llm-sse-streaming` — SSE 流式响应与增量渲染（由“SSE 流式响应实现详解”调整）
5. `aigc-application` — 将大模型集成到 Web 应用（由“如何集成大模型到前端应用”调整）
6. `llm-conversation-state` — 对话状态、会话与历史管理（新增）
7. `llm-multimodal-api` — 多模态输入输出应用开发（新增）
8. `llm-error-retry-fallback` — 超时、重试、Fallback 与错误处理（新增）
9. `llm-model-routing` — 模型路由与多供应商适配（新增）
10. `llm-response-api-patterns` — Responses、Chat 与统一生成接口模式（新增）
11. `llm-stream-cancel-resume` — 流式请求取消、续传与状态恢复（新增）
12. `llm-batch-api` — Batch 批处理与离线任务（新增）
13. `llm-file-input` — 文件上传、解析与大文件处理（新增）
14. `llm-vision-app` — 视觉理解与图像生成应用（新增）
15. `llm-audio-realtime` — 语音、音频与 Realtime 应用（新增）
16. `llm-provider-abstraction` — 模型供应商抽象层设计（新增）
17. `llm-api-security` — API Key、代理层与客户端安全（新增）
18. `llm-token-budget` — Token 预算、截断与上下文分配（新增）
19. `llm-user-feedback` — 用户反馈采集与质量闭环（新增）
20. `claude-sdk` — Anthropic Claude SDK 核心使用（由“Anthropic Claude SDK 使用指南”调整）
21. `qwen-dashscope` — 通义千问 DashScope API 接入
22. `deepseek-api` — DeepSeek API 接入实践
23. `aigc-openai` — OpenAI API 调用基础（由“如何调用GPT的OpenAPI”调整）
24. `aigc-frontend` — 大模型与前端产品的结合场景（由“大模型和前端有哪些结合场景”调整）

#### RAG 与知识系统（27）

1. `embedding-basics` — Embedding 原理与向量相似度
2. `rag-chunking` — 文本分块策略（Chunking）
3. `vector-db-selection` — 向量数据库选型（由“向量数据库选型：Pinecone / Chroma / pgvector”调整）
4. `rag-pipeline` — RAG 完整流程实战
5. `rag-hybrid-search` — Hybrid Search 混合检索
6. `rag-evaluation` — RAG 评估与优化
7. `rag-query-rewrite` — 查询改写、分解与扩展（新增）
8. `rag-reranking` — Rerank 重排序原理与实践（新增）
9. `rag-metadata-filtering` — 元数据过滤与结构化检索（新增）
10. `rag-citation-grounding` — 引用溯源、Grounding 与事实一致性（新增）
11. `rag-access-control` — RAG 数据权限与多租户隔离（新增）
12. `rag-production-ingestion` — 生产级文档解析、索引与增量更新（新增）
13. `rag-loader-parser` — 文档 Loader、Parser 与版面解析（新增）
14. `rag-table-retrieval` — 表格、数据库与结构化数据检索（新增）
15. `rag-image-retrieval` — 图像、OCR 与多模态检索（新增）
16. `rag-code-retrieval` — 代码仓库切分、索引与检索（新增）
17. `rag-graph-rag` — GraphRAG 与知识图谱增强检索（新增）
18. `rag-parent-child` — Parent-Child 与 Small-to-Big Retrieval（新增）
19. `rag-multi-query` — Multi-Query 与多路召回（新增）
20. `rag-routing` — 查询路由与多索引选择（新增）
21. `rag-context-compression` — 检索上下文压缩与去噪（新增）
22. `rag-deduplication` — 文档去重、近重复检测与规范化（新增）
23. `rag-index-versioning` — 索引版本、重建与回滚（新增）
24. `rag-cache` — Embedding、检索与答案缓存（新增）
25. `rag-latency-cost` — RAG 延迟、吞吐与成本优化（新增）
26. `rag-testing` — RAG 测试集、Golden Set 与回归测试（新增）
27. `rag-failure-debugging` — RAG 失败诊断：数据、召回、排序与生成（新增）

#### Agent 原理与编排（37）

1. `agent-architecture` — 智能体定义、类型、PEAS 与 Agent Loop（由“初识智能体:定义 / 类型 / PEAS / Agent Loop”调整）
2. `agent-first-demo` — 实现第一个 Thought-Action-Observation Agent（由“动手:5 分钟实现第一个智能体(Thought-Action-Observation)”调整）
3. `agent-history` — 智能体发展史
4. `agent-react` — ReAct：推理与行动框架（由“ReAct:推理与行动框架”调整）
5. `agent-paradigms` — Reflection、Plan-and-Execute 与 Tool-Use（由“经典范式:Reflection / Plan-and-Execute / Tool-Use”调整）
6. `agent-memory` — 短期记忆、长期记忆与检索（由“记忆与检索”调整）
7. `build-agent-framework` — 从零构建 Agent 运行时（由“从零构建你的 Agent 框架”调整）
8. `mcp-protocol` — MCP / A2A 智能体通信协议（由“智能体通信协议:MCP / A2A”调整）
9. `multi-agent` — 多智能体协作与适用边界（由“多智能体协作:CrewAI / AutoGen / MetaGPT / LangGraph”调整）
10. `agent-evaluation` — 智能体性能评估
11. `agent-deep-research` — 深度研究智能体实战（由“实战:自动化深度研究智能体”调整）
12. `agent-tool-design` — Agent 工具契约、Schema 与错误语义（新增）
13. `agent-workflow-state` — 工作流状态、检查点与断点续跑（新增）
14. `agent-planning` — 任务规划、分解与动态重规划（新增）
15. `agent-handoff` — Handoff、Agent-as-Tool 与职责边界（新增）
16. `agent-human-in-loop` — Human-in-the-loop 审批与人工接管（新增）
17. `agent-sandbox` — 代码执行、浏览器与文件操作沙箱（新增）
18. `agent-run-loop` — Agent Run Loop、轮次与终止条件（新增）
19. `agent-state-machine` — 用状态机建模 Agent 行为（新增）
20. `agent-event-driven` — 事件驱动 Agent 与异步编排（新增）
21. `agent-deterministic-workflow` — 确定性 Workflow 与 Agent 的组合（新增）
22. `agent-dynamic-workflow` — 动态工作流生成与执行（新增）
23. `agent-tool-selection` — 工具发现、选择与路由（新增）
24. `agent-tool-result-validation` — 工具结果校验、解析与反馈（新增）
25. `agent-tool-timeout` — 工具超时、取消与重试（新增）
26. `agent-parallel-tools` — 并行工具调用与依赖调度（新增）
27. `agent-subagents` — Subagent 子智能体设计（新增）
28. `agent-supervisor` — Supervisor 监督者模式（新增）
29. `agent-delegation` — 任务委派、职责与结果合并（新增）
30. `agent-multi-agent-messaging` — 多智能体消息、协议与状态同步（新增）
31. `agent-memory-architecture` — Agent 记忆系统架构设计（新增）
32. `agent-memory-summarization` — 会话摘要、压缩与记忆提炼（新增）
33. `agent-memory-forgetting` — 遗忘策略、冲突处理与记忆更新（新增）
34. `agent-browser-use` — Browser-use 网页操作智能体（新增）
35. `agent-computer-use` — Computer-use 桌面操作智能体（新增）
36. `agent-coding` — Coding Agent 的架构与执行循环（新增）
37. `agent-voice` — Voice Agent 与实时对话编排（新增）

#### 生产级 Agent（45）

1. `ai-observability` — Agent 可观测性与全链路 Tracing（由“AI 应用可观测性：LangSmith / Langfuse”调整）
2. `llm-cost-optimize` — Token、延迟与成本优化（由“LLM 成本优化策略”调整）
3. `prompt-injection-defense` — Prompt Injection 与间接注入防御（由“Prompt Injection 防御”调整）
4. `ai-rate-limiting` — AI 应用限流、配额与背压（由“AI 应用限流与配额控制”调整）
5. `agent-eval-framework` — 生产级 Agent 评估系统设计（由“Agent 评估框架设计”调整）
6. `agent-guardrails` — 输入、输出与工具 Guardrails（新增）
7. `agent-permission-model` — 最小权限、授权与工具调用确认（新增）
8. `agent-failure-recovery` — 失败分类、重试、补偿与恢复（新增）
9. `agent-idempotency` — 幂等性、重复执行与副作用控制（新增）
10. `agent-data-privacy` — 敏感数据、日志脱敏与隐私保护（新增）
11. `agent-security-threat-model` — Agent 威胁建模与安全测试（新增）
12. `agent-deployment` — Agent 服务部署、扩缩容与版本发布（新增）
13. `agent-feedback-loop` — 线上反馈、评估集与持续改进闭环（新增）
14. `agent-trace-model` — Trace、Span、Run 与工具调用事件模型（新增）
15. `agent-metrics` — 成功率、质量、延迟、成本与业务指标（新增）
16. `agent-logs` — Agent 结构化日志与上下文关联（新增）
17. `agent-debugging` — Agent 调试方法与失败复现（新增）
18. `agent-test-pyramid` — Agent 单元、集成、场景与端到端测试（新增）
19. `agent-simulation` — 用户模拟器与环境模拟测试（新增）
20. `agent-red-teaming` — Agent 红队测试与对抗样本（新增）
21. `agent-benchmark` — Agent Benchmark 的设计与解读（新增）
22. `agent-online-eval` — 在线评估、抽样与质量监控（新增）
23. `agent-ab-testing` — Agent A/B 测试与实验设计（新增）
24. `agent-quality-gates` — 发布质量门禁与回归阻断（新增）
25. `agent-prompt-regression` — Prompt、工具与模型升级回归测试（新增）
26. `agent-indirect-injection` — 网页、文件与邮件中的间接 Prompt Injection（新增）
27. `agent-tool-poisoning` — 工具描述、Schema 与返回值投毒（新增）
28. `agent-memory-poisoning` — 记忆污染与持久化攻击（新增）
29. `agent-data-exfiltration` — 数据外泄路径与阻断策略（新增）
30. `agent-identity-auth` — Agent 身份、用户身份与委托授权（新增）
31. `agent-secrets-management` — 密钥、凭证与 Secret 生命周期（新增）
32. `agent-supply-chain` — 模型、工具、MCP 与依赖供应链安全（新增）
33. `agent-network-egress` — 网络出口、域名白名单与数据边界（新增）
34. `agent-sandbox-escape` — 沙箱逃逸风险与纵深防御（新增）
35. `agent-audit-log` — 不可抵赖审计日志与合规留痕（新增）
36. `agent-api-gateway` — Agent Gateway 与统一接入层（新增）
37. `agent-queue-worker` — 队列、Worker 与长任务执行（新增）
38. `agent-concurrency` — 并发控制、资源隔离与公平调度（新增）
39. `agent-timeout-budget` — 端到端超时预算与 Deadline 传播（新增）
40. `agent-cache` — 模型、工具、检索与结果缓存（新增）
41. `agent-model-fallback` — 模型降级、Fallback 与熔断（新增）
42. `agent-disaster-recovery` — 状态备份、灾难恢复与任务重放（新增）
43. `agent-canary-release` — 灰度、Canary 与模型版本发布（新增）
44. `agent-slo` — Agent SLI、SLO 与错误预算（新增）
45. `agent-incident-response` — Agent 线上事故响应与复盘（新增）

### 服务端工程（45）

#### 运行时与框架（9）

1. `node-knowledge` — Node.js 运行时与核心模块（由“NodeJS基本概念与特点”调整）
2. `node-event-loop-deep` — Node.js 事件循环与异步 I/O（由“Node.js 事件循环深度解析”调整）
3. `node-stream` — Stream 流式处理原理与实践
4. `fastapi-basics` — FastAPI 构建 AI 服务（由“FastAPI 快速构建 AI 后端”调整）
5. `node-buffer` — Buffer、二进制与编码（由“Buffer 与二进制数据处理”调整）
6. `node-worker-threads` — Worker Threads 与 CPU 密集任务（由“Worker Threads 多线程模型”调整）
7. `express-core` — Express 核心原理与中间件（由“Express 核心原理”调整）
8. `nestjs-architecture` — NestJS 模块化服务架构（由“NestJS 企业级架构”调整）
9. `koa-middleware` — 请求上下文与洋葱模型（由“Koa 中间件机制”调整）

#### API 与异步任务（12）

1. `restful-design` — RESTful API 设计规范
2. `websocket` — WebSocket 实时通信
3. `api-versioning` — API 版本管理与兼容性
4. `api-schema-validation` — API Schema 校验、错误码与契约测试（新增）
5. `async-job-queue` — 消息队列、异步任务与后台 Job（新增）
6. `graphql-core` — GraphQL Schema、查询与 Resolver（由“GraphQL 核心概念与使用”调整）
7. `sse-server` — SSE 服务端推送与连接管理（由“SSE 服务端推送事件”调整）
8. `grpc-basics` — gRPC、Protobuf 与服务通信（新增）
9. `webhook-design` — Webhook 签名、重试与幂等（新增）
10. `file-upload-service` — 文件上传、分片与对象存储（新增）
11. `api-pagination-filtering` — 分页、过滤、排序与游标设计（新增）
12. `api-idempotency` — API 幂等键与重复请求处理（新增）

#### 存储与状态（11）

1. `mysql-index` — 数据库索引原理与查询优化（由“MySQL 索引原理与优化”调整）
2. `db-transaction-lock` — 事务、隔离级别与锁（由“事务与锁机制”调整）
3. `redis-cache` — Redis 缓存策略与一致性（由“Redis 缓存策略与穿透击穿雪崩”调整）
4. `agent-state-storage` — Agent 会话、检查点与任务状态存储（新增）
5. `typeorm-entity` — ORM 实体、关系与查询边界（由“TypeORM 实体设计与关联查询”调整）
6. `redis-data-structure` — Redis 数据结构与使用场景
7. `db-sharding` — 分库分表、读写分离与扩展（由“分库分表与读写分离”调整）
8. `postgresql-transaction` — PostgreSQL 事务、MVCC 与锁（新增）
9. `database-migration` — 数据库 Migration、回滚与兼容发布（新增）
10. `object-storage` — 对象存储、预签名 URL 与生命周期（新增）
11. `event-store` — 事件存储、Outbox 与状态重建（新增）

#### 安全与交付（13）

1. `jwt-auth` — JWT 认证机制（由“JWT 认证机制深度解析”调整）
2. `oauth2` — OAuth 2.0 授权流程
3. `rate-limit-circuit` — 接口限流、熔断与降级（由“接口限流与熔断”调整）
4. `docker-basics` — Docker 容器化基础
5. `cicd-pipeline` — CI/CD 流水线与安全发布（由“CI/CD 流水线设计”调整）
6. `password-encrypt` — 密码哈希、Salt 与凭证存储（由“密码加密与存储最佳实践”调整）
7. `sql-injection` — SQL 注入与参数化查询（由“SQL 注入防御”调整）
8. `docker-compose` — Docker Compose 多服务开发环境（由“Docker Compose 多服务编排”调整）
9. `nginx-proxy` — Nginx 反向代理与负载均衡
10. `logging-monitoring` — 日志、指标、Tracing 与告警（由“日志收集与监控报警”调整）
11. `secrets-config` — 配置、Secret 与环境隔离（新增）
12. `health-check` — 健康检查、优雅启停与就绪探针（新增）
13. `backup-restore` — 数据库备份、恢复与演练（新增）

### 数据工程（35）

#### Python 工程基础（6）

1. `python-env` — Python 环境与包管理（由“Python 环境与包管理（pip / conda / uv）”调整）
2. `python-typing` — Python 类型注解与 Pydantic
3. `python-async` — Python 异步编程（asyncio）
4. `python-oop` — Python 数据模型与面向对象（由“Python 数据类型与面向对象”调整）
5. `numpy-basics` — NumPy 数值计算基础
6. `jupyter-practices` — Jupyter Notebook 工程实践

#### 数据处理与质量（8）

1. `pandas-basics` — Pandas 数据清洗与分析
2. `data-formats` — JSON / CSV / Parquet 数据格式（由“数据格式：JSON / CSV / Parquet”调整）
3. `text-preprocessing` — 文本预处理与清洗策略
4. `data-quality` — 数据质量评估与异常检测
5. `data-labeling` — AI 数据采集、标注与审核（由“AI 训练数据采集与标注”调整）
6. `data-schema-evolution` — 数据 Schema 演进与兼容性（新增）
7. `data-deduplication` — 精确去重、近似去重与污染控制（新增）
8. `data-sampling` — 数据采样、分层与代表性（新增）

#### 数据存储与检索（9）

1. `sql-core` — SQL 核心语法与进阶查询
2. `postgresql-features` — PostgreSQL 与 JSON 数据（由“PostgreSQL 特性与 JSON 支持”调整）
3. `pgvector-usage` — pgvector 向量存储与检索（由“pgvector：PostgreSQL 向量扩展”调整）
4. `ann-hnsw` — ANN 与 HNSW 向量检索算法（由“向量检索：ANN 算法与 HNSW”调整）
5. `sql-window-function` — 窗口函数与分析查询（由“窗口函数与分析函数”调整）
6. `sql-index-optimize` — 索引、执行计划与查询优化（由“索引优化与执行计划”调整）
7. `clickhouse-intro` — ClickHouse 与列式分析（由“ClickHouse 列式数据库入门”调整）
8. `embedding-models` — Embedding 模型评估与选型（由“Embedding 模型选型与对比”调整）
9. `vector-database-internals` — 向量数据库索引、过滤与一致性（新增）

#### 数据管道（8）

1. `etl-design` — ETL / ELT 流程设计（由“ETL 流程设计与最佳实践”调整）
2. `embedding-pipeline` — Embedding 管道自动化
3. `dvc-basics` — 数据集与数据版本管理（由“数据版本管理（DVC）”调整）
4. `batch-stream-processing` — 批处理、流处理与 Lambda/Kappa 架构（新增）
5. `data-orchestration` — 数据任务编排、依赖与重试（新增）
6. `data-lineage` — 数据血缘、元数据与可追溯性（新增）
7. `data-observability` — 数据新鲜度、完整性与管道可观测（新增）
8. `data-contracts` — Data Contract 与上下游协作（新增）

#### 分析与实验（4）

1. `matplotlib-seaborn` — Matplotlib / Seaborn 数据可视化（由“Matplotlib & Seaborn 可视化”调整）
2. `python-data-report` — 用 Python 构建可复现数据报告（由“用 Python 构建数据报告”调整）
3. `experiment-analysis` — 实验设计、显著性与效果分析（新增）
4. `feature-store` — 特征、标签与 Feature Store 基础（新增）

### 计算机与算法基础（25）

#### 计算机基础（10）

1. `os-process-thread` — 进程、线程与协程（由“进程、线程与协程有什么区别?”调整）
2. `os-virtual-memory` — 内存、虚拟内存与分页（由“虚拟内存与分页机制是怎么工作的?”调整）
3. `tcpIp-model` — OSI、TCP/IP 与端到端通信（由“OSI和TCP/IP模型是什么？”调整）
4. `http-message` — HTTP 请求、响应与报文结构（由“HTTP的报文结构是什么？”调整）
5. `os-ipc` — 进程间通信（IPC）（由“进程间通信(IPC)有哪些方式?”调整）
6. `os-thread-sync` — 锁、信号量与并发同步（由“线程同步与互斥:锁、信号量与条件变量”调整）
7. `os-deadlock` — 死锁、检测与避免（由“死锁是如何产生的?如何预防和避免?”调整）
8. `tcp-handshake` — TCP 建连、断开与连接状态（由“TCP三次握手过程？”调整）
9. `tcp-udp` — TCP、UDP 与传输场景（由“TCP与UDP的区别与场景？”调整）
10. `dns-analysis` — DNS 解析、缓存与容灾（由“DNS解析时有什么算法和方式减少重复操作?”调整）

#### 算法与数据结构（15）

1. `algorithm-complexity` — 时间复杂度、空间复杂度与性能估算（新增）
2. `algorithm-array` — 数组、字符串与双指针（由“数据结构-数组”调整）
3. `algorithm-stack-queue` — 栈、队列与任务调度（新增）
4. `algorithm-hash` — 哈希表、缓存与去重（由“哈希表的应用”调整）
5. `algorithm-tree` — 树、图与遍历（由“数据结构-树”调整）
6. `algorithm-loop` — 递归、分治与搜索（由“递归与分治”调整）
7. `algorithm-string` — 字符串、匹配与文本处理（由“数据结构-字符串”调整）
8. `algorithm-heap` — 堆、优先队列与 Top-K（新增）
9. `algorithm-linked-list` — 链表、指针与 LRU（新增）
10. `algorithm-trie` — Trie、前缀检索与自动补全（新增）
11. `algorithm-sorting` — 排序算法、稳定性与外部排序（新增）
12. `algorithm-graph` — BFS、DFS、最短路与拓扑排序（新增）
13. `algorithm-backtracking` — 回溯、剪枝与组合搜索（新增）
14. `linear-algebra-ai` — 向量、矩阵与线性代数直觉（新增）
15. `probability-statistics-ai` — 概率、分布、采样与统计估计（新增）

### 前端核心（20）

#### Web 基础（6）

1. `web-semantic-accessibility` — 语义化 HTML 与 Web 可访问性（新增）
2. `responsive-layout` — 现代 CSS 布局与响应式设计（由“如何实现响应式布局”调整）
3. `event-loop` — 浏览器事件循环、任务与渲染时机（由“事件循环机制”调整）
4. `promise` — Promise、async/await 与异步控制流（由“Promise概念”调整）
5. `localStorage-sessionStorage` — Cookie、Storage 与浏览器状态（由“LocalStorage、SessionStorage和Cookie的区别”调整）
6. `web-attack` — XSS、CSRF、CSP 与 Web 安全基础（由“常见的Web攻击分类”调整）

#### TypeScript 与 UI 工程（7）

1. `type-system` — TypeScript 类型系统与类型建模（由“TypeScript的类型系统”调整）
2. `react-hooks` — React 函数组件、Hooks 与状态（由“React Hooks的作用及原理”调整）
3. `design-components` — 可复用组件、状态与通信设计（由“如何设计一个高度封装的组件”调整）
4. `vite-testing` — Vite、前端构建与测试基础（新增）
5. `ts-generics` — TypeScript 泛型与可复用类型（由“TypeScript中的泛型有什么用途”调整）
6. `useCallback-useMemo` — React 渲染、Memo 与性能优化（由“useCallback和useMemo性能优化”调整）
7. `design-state` — 前端状态管理与服务端状态（由“如何实现组件的状态管理”调整）

#### Agent 产品界面（7）

1. `agent-chat-ui` — Agent Chat UI、消息模型与会话列表（新增）
2. `agent-streaming-ui` — 流式文本、光标、取消与继续生成（新增）
3. `agent-markdown-code-ui` — Markdown、代码块、图表与安全渲染（新增）
4. `agent-citation-ui` — 引用、来源与检索证据展示（新增）
5. `agent-tool-approval-ui` — 工具调用状态、参数预览与审批界面（新增）
6. `agent-error-retry-ui` — 错误、重试、恢复与降级交互（新增）
7. `agent-ui-accessibility-testing` — Agent UI 可访问性、测试与跨端适配（新增）

### 项目与职业（10）

#### Agent 工程师成长（10）

1. `agent-role-landscape` — Agent 工程师的职责与岗位方向（由“Agent 工程师到底做什么”调整）
2. `agent-learning-roadmap` — 从零到 Agent 工程师的学习路线（由“学习路线图：从 0 到能做 Agent”调整）
3. `agent-project-portfolio` — Agent 项目与作品集设计（由“做出能打的 Agent 作品集”调整）
4. `agent-resume-interview` — AI / Agent 岗位简历与面试（由“AI/Agent 岗位的简历与面试”调整）
5. `agent-skill-map` — Agent 工程师技能图谱
6. `agent-project-requirements` — 从真实需求定义 Agent 项目（新增）
7. `agent-project-evaluation` — 用业务指标证明 Agent 项目价值（新增）
8. `agent-project-deployment` — 将 Demo 做成可运行的线上项目（新增）
9. `agent-open-source-contribution` — 参与 Agent 开源项目与技术社区（新增）
10. `agent-interview-system-design` — Agent 系统设计面试与案例拆解（新增）

## 迁移顺序

1. 冻结 300 点核心地图的分组、命名和排序。
2. 优先更新已存在且进入核心地图的文章。
3. 按依赖顺序补齐 172 个新增知识点，每批 5 篇。
4. 合并重复文章并建立前置知识链接；稳定 key、filePath 和旧链接优先保留。
5. 未入选内容迁入扩展资料区，在核心地图稳定前不物理删除。
6. 在完整仓库中校验树结构、文章路径、重复 key、孤儿文件和更新进度后再发布。
