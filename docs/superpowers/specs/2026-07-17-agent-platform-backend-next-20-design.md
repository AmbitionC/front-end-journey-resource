# Agent Platform and Backend Next 20 Design

## Goal

Publish the next 20 missing FrontEnd Journey knowledge points in deterministic tree order. The batch completes the remaining production-Agent topics around isolation, auditability, gateways, asynchronous execution, resilience, release safety, SLOs, and incident response; it then introduces the first backend API and state-storage foundations. Every article receives one semantically checked light-background teaching diagram and authoritative primary-source citations.

## Selection contract

The source of truth is `origin/master` at `8e2014550b9b4f1093e4edb038d9545c6b4c2515`. Flatten `knowledge/_tree.json` in directory order, exclude every key recorded as `published` or `pending` in `.codex/knowledge-update-history.json`, and require the expected Markdown path to be absent.

The exact batch is:

1. `agent-sandbox-escape` — 沙箱逃逸风险与纵深防御
2. `agent-audit-log` — 不可抵赖审计日志与合规留痕
3. `agent-api-gateway` — Agent Gateway 与统一接入层
4. `agent-queue-worker` — 队列、Worker 与长任务执行
5. `agent-concurrency` — 并发控制、资源隔离与公平调度
6. `agent-timeout-budget` — 端到端超时预算与 Deadline 传播
7. `agent-cache` — 模型、工具、检索与结果缓存
8. `agent-model-fallback` — 模型降级、Fallback 与熔断
9. `agent-disaster-recovery` — 状态备份、灾难恢复与任务重放
10. `agent-canary-release` — 灰度、Canary 与模型版本发布
11. `agent-slo` — Agent SLI、SLO 与错误预算
12. `agent-incident-response` — Agent 线上事故响应与复盘
13. `api-schema-validation` — API Schema 校验、错误码与契约测试
14. `async-job-queue` — 消息队列、异步任务与后台 Job
15. `grpc-basics` — gRPC、Protobuf 与服务通信
16. `webhook-design` — Webhook 签名、重试与幂等
17. `file-upload-service` — 文件上传、分片与对象存储
18. `api-pagination-filtering` — 分页、过滤、排序与游标设计
19. `api-idempotency` — API 幂等键与重复请求处理
20. `agent-state-storage` — Agent 会话、检查点与任务状态存储

No other tree leaf or article belongs in this batch.

## Content architecture

Every article is body-only Chinese Markdown at `knowledge/{filePath}/{key}.md`, larger than 4,500 bytes, and progresses from a concise mental model through mechanism, implementation, failure modes, verification, recap, and one final `## 参考资料` section. Important factual claims link to reachable primary sources near the claim and list only used sources in the final section.

Neighbor boundaries are explicit:

- sandbox escape explains containment failure and layered controls; audit logging explains evidence integrity and traceability; the gateway is the policy and routing boundary before agent execution;
- queue-worker explains durable work ownership; concurrency explains admission, quotas, and fairness; timeout-budget explains absolute deadlines and cancellation propagation;
- caching explains identity, freshness, and invalidation per model/tool/retrieval/result layer; fallback explains bounded degradation and circuit-breaker states rather than blind retries;
- disaster recovery explains durable checkpoints, backup objectives, and replay safety; canary release explains exposure control and rollback; SLOs turn user outcomes into reliability policy; incident response covers detection through learning;
- schema validation covers API boundary correctness and contract testing; async-job-queue generalizes delivery semantics outside Agent-specific execution; gRPC covers Protobuf contracts and RPC lifecycle;
- webhook design covers receiver-side authenticity, replay defense, retry, and idempotency; file upload covers multipart transfer, integrity, and object-store finalization; pagination covers stable ordering and cursors; API idempotency covers request-result ledgers;
- agent-state-storage separates conversation, run, checkpoint, event, and artifact state and states what may be reconstructed versus what must be durable.

## Evidence and time boundaries

Research precedes drafting. Prefer NIST container and audit guidance, Linux kernel and Kubernetes security documentation, OpenTelemetry and W3C trace context, CloudEvents, RFCs, OpenAPI and JSON Schema specifications, AsyncAPI, gRPC and Protocol Buffers documentation, AMQP, object-storage multipart documentation, and original reliability literature. Provider-specific behavior is dated 2026-07-17 and presented as an implementation example rather than a universal contract.

An outside-repository evidence map records a learning outcome, at least three supported claims, URLs, confidence, and time sensitivity for every key. Final citations must be reachable authoritative sources. Security and reliability articles distinguish normative standard, documented implementation behavior, observed failure mode, and engineering recommendation.

## Illustration system

Create exactly one teaching diagram per article with these filenames:

1. `agent-sandbox-escape-defense-layers-v1.webp`
2. `agent-audit-log-evidence-chain-v1.webp`
3. `agent-api-gateway-policy-routing-v1.webp`
4. `agent-queue-worker-job-lifecycle-v1.webp`
5. `agent-concurrency-fair-scheduler-v1.webp`
6. `agent-timeout-budget-deadline-chain-v1.webp`
7. `agent-cache-layered-keys-v1.webp`
8. `agent-model-fallback-circuit-state-v1.webp`
9. `agent-disaster-recovery-checkpoint-replay-v1.webp`
10. `agent-canary-release-progressive-rollout-v1.webp`
11. `agent-slo-error-budget-loop-v1.webp`
12. `agent-incident-response-detection-recovery-loop-v1.webp`
13. `api-schema-validation-contract-pipeline-v1.webp`
14. `async-job-queue-delivery-lifecycle-v1.webp`
15. `grpc-basics-protobuf-call-path-v1.webp`
16. `webhook-design-signature-retry-ledger-v1.webp`
17. `file-upload-service-multipart-object-flow-v1.webp`
18. `api-pagination-filtering-cursor-order-v1.webp`
19. `api-idempotency-request-ledger-v1.webp`
20. `agent-state-storage-state-model-v1.webp`

Generated sources remain outside the repository; accepted outputs are 1672×941 RGB WebP under `images/`. The visual system uses a full-canvas warm-white or very light gray background, white cards, fine charcoal outlines, restrained blue/teal/orange/violet/green accents, and generous whitespace. Black or dark-navy canvas, dark gradients, neon, terminal, and cyberpunk aesthetics are forbidden.

Quantitative gates for every image:

- mean grayscale luminance at least 185;
- pixels below 45 no more than 10%;
- pixels at or above 190 at least 60%;
- all four corner luminance values at least 150;
- dimensions exactly 1672×941, mode RGB, decodable WebP;
- required components, arrows, ownership, retry direction, and trust boundaries are semantically correct.

Each article references exactly one stable OSS URL matching its image filename.

## Batch and failure strategy

Process as two reviewable groups of 10. Establish evidence and image specifications before drafting. Generate and inspect images individually, then draft group A and group B with the same article/image gates. A systemic source, format, semantic, or luminance failure stops the affected group; acceptance thresholds are never reduced.

## Metadata transition

Change only the 20 selected tree leaves from `coming-soon` to `published`. Promote exactly the previous batch `agent-observability-security-next-20-2026-07-16` from `pending` to `published`. Append 20 unique history records with action `created`, date `2026-07-17`, batch `agent-platform-backend-next-20-2026-07-17`, and status `pending`.

Expected ledger after the change:

- tree: 300 unique leaves, 258 `published`, 42 `coming-soon`;
- history: 159 unique records, 139 `published`, 20 `pending`.

## Verification and publication

Before publication, require article gates, image gates, reachable final references, metadata totals, `npm run validate:tree`, `git diff --check`, and a scoped diff of exactly 44 files across three commits: this design, one implementation plan, 20 Markdown files, 20 images, and two JSON ledgers.

Push a ready PR against `master`, verify it is clean and contains exactly the expected commits and files, merge with a merge commit, and accept only the `sync-content` run for the merge SHA. The expected FaaS payload is one manifest, 20 articles, 20 images, zero deletions, and no errors. Do not open the production site after a successful Action.
