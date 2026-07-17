Agent 系统设计面试考察的不是能否画出“用户—LLM—工具”三格图，而是能否从模糊需求收敛目标，量化 workload 和质量/安全指标，追踪一次请求的状态与故障边界，并解释为什么当前方案比替代方案合适。

![Agent 系统设计面试从需求澄清、指标与容量到架构、请求链路、瓶颈和权衡的答题框架](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-interview-system-design-requirement-architecture-v1.webp)
*图：先定义用户结果与权限，再画控制/数据流；每个组件都连接容量、失败、状态和观测。*

## 前五分钟：收敛问题

假设题目是“设计企业客服 Agent”。先问用户是谁、输入渠道、输出是草稿还是自动发送、知识来源、是否使用客户数据、工具有哪些、风险等级、地区和保留要求。明确第一版只覆盖哪类工单，哪些交给人工。

写出成功：“90% 常见工单在 30 秒内生成带政策引用草稿，严重错误低于 0.2%，不自动退款。”这比“回答准确、低延迟”可设计。再说明规模：日请求、峰值 QPS、平均/最大上下文、并发 stream、工具扇出、数据量和增长。

## 指标与 SLO

[Google SRE：SLO](https://sre.google/sre-book/service-level-objectives/)强调用户中心的 SLI 与目标。Agent 指标分任务成功、引用支持/人工修改、严重错误、安全越权、首 token/端到端延迟、可用性和每成功任务成本。

组件 uptime 只是诊断。模型 API 99.9% 不代表任务成功，工具慢也可能通过降级给草稿。给 SLO 窗口、分位数和错误预算，并说明 canary 自动停止门槛。

## 画出端到端架构

典型控制流：API gateway 鉴权与限流 → conversation/run service 持久化 → orchestrator/model gateway → retrieval service/vector + ACL → tool gateway/policy/approval → event stream → UI。旁路包括 queue、checkpoint、operation ledger、observability 和 eval pipeline。

画箭头时说清数据：requestId/runId、releaseId、user/tenant、event seq、citation provenance、tool operationId。区分权威状态数据库、可重建索引和缓存。不要让聊天 WebSocket 成为唯一 run 状态。

## 追踪一条请求

用户提交带 clientRequestId，服务端幂等创建 run 和事件；检索在授权过滤下返回带 locator 的 evidence；prompt builder 按 token 预算组装；模型流出 typed events；若提出工具，policy 校验并可能进入 awaiting approval；批准绑定 request hash；执行结果写 operation ledger；最终 message/checkpoint 提交并发送 completed。

逐步指出超时、重试和取消。网络断开后客户端用 lastSeq 补事件；模型响应丢失可重试生成，支付结果未知先对账；取消向模型/工具传播但不承诺撤销已提交副作用。

## 一致性与状态

Thread、Run、Message、Checkpoint、Approval、Tool Operation 分开。事件至少一次投递，用 eventId 去重；run 更新带 expectedVersion；worker lease 有 fencing。外部写入通过 idempotency key/outbox。

向量索引最终一致时，返回 sourceVersion，删除先在权威 ACL 层阻止。Prompt/model/tool schema 组成 release bundle，使一次 run 可复现并可安全回滚。

## RAG 与质量边界

说明 chunk、embedding、hybrid retrieval、rerank、ACL 和 citation，不把 RAG 说成“解决幻觉”。资料冲突、过期、无结果时 UI 明示；高风险回答要求证据或转人工。评测有真实分布集、挑战集和切片，线上持续抽样。

索引规模与 latency 决定 ANN 参数；缓存 key 包含 tenant、query normalization、index/policy version，防止跨权限复用。内容更新通过版本化索引与原子 alias 切换。

## 工具与安全

Tool schema 描述参数和 effect，gateway 执行最小权限、网络限制、超时与审计。模型输出只是 proposed call；服务端重新验证。读公开数据可自动，外发/删除/付款需具体审批。

[NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)提供 Govern、Map、Measure、Manage 风险框架。面试中可按语境与受影响者识别风险，给测量、控制和上线后监控，而不是只说加过滤器。

## 容量与成本估算

用数字：100 QPS × 平均 8k input tokens，模型 provider rate limit 是否足够；平均 20 秒 stream 对并发连接的影响；工具连接池与队列；索引内存；每任务成本。给缓存、batch、模型路由和 token budget 的收益与质量代价。

过载时有界队列、tenant quota、admission control 和降级，不无限等待。长任务转异步并通知，实时交互有 deadline。多区域设计说明状态归属、数据驻留和故障切换，而不是随口“加 CDN”。

## 故障与可观测

列出模型限流、检索 stale、工具超时、事件流断开、数据库故障、provider 输出漂移和 prompt injection。每个给检测、用户行为、恢复和是否 fail-open。安全边界通常 fail-closed，低风险生成可降级。

Trace 按 run 关联 model/retrieval/tool，metrics 看 SLO、队列、成本和安全，日志低敏。Runbook 支持关闭工具/模型/索引，Canary 对照 control，回滚完整 bundle。

## 讲权衡与演进

单 Agent workflow 比多 Agent 易调试，第一版优先；只有并行专长和隔离上下文带来可测收益才拆分。SSE 适合单向流，WebSocket 用于真正双向实时；SQL + pgvector 可先满足一致性，规模/功能需要时再拆专用向量库。

最后回扣目标：当前设计满足哪些 SLO、最大风险在哪里、下一阶段数据达到什么阈值才扩展。强答案不是组件最多，而是每个选择都从需求、数字和故障语义推导出来。

## 参考资料

- [Google SRE：Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [NIST AI RMF：Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
