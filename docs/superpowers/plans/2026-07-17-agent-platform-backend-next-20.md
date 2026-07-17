# Agent Platform and Backend Next 20 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Do not delegate because this session's coordination policy forbids subagents unless the user explicitly requests them.

**Goal:** Publish the next 20 Agent-platform and backend-foundation knowledge guides with one verified light-background teaching diagram per guide.

**Architecture:** Treat the tree and update history as a deterministic selection ledger, establish a primary-source evidence map before drafting, and treat generated images and prose as untrusted until semantic and quantitative gates pass. Work in two groups of 10, then publish one atomic content/metadata PR and accept only the merge-SHA synchronization result.

**Tech Stack:** Chinese GitHub-flavored Markdown, JSON manifests, built-in imagegen/image2, Pillow, Node.js 22, npm, Git, GitHub CLI, GitHub Actions.

## Global Constraints

- Base is `origin/master` at `8e2014550b9b4f1093e4edb038d9545c6b4c2515`; branch is `content/agent-platform-backend-next-20`.
- Create exactly the 20 keys listed in the design and no other articles.
- Article files are body-only Chinese Markdown with no H1, larger than 4,500 bytes, one final `## 参考资料`, and one unique matching OSS image URL.
- Every final reference is a reachable authoritative primary source and appears near the claim it supports.
- Every image is 1672×941 RGB WebP with a warm-white/light-gray full canvas; dark canvas, dark gradients, neon, terminal, and cyberpunk styles are forbidden.
- Image gates are mean luminance ≥185, pixels below 45 ≤10%, pixels at or above 190 ≥60%, and four corner luminance values ≥150.
- Promote the previous 20 pending records and append 20 pending records dated 2026-07-17.
- Do not modify infrastructure repositories or manually open the production site after successful synchronization.

---

### Task 1: Freeze inventory and manifest

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Read: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-platform-backend-next-20-manifest.json`

- [ ] Run `npm run validate:tree` and the skill inventory script. Expected baseline: 300 leaves, 238 existing, 62 missing, zero duplicate keys, and the same two existing orphans.
- [ ] Flatten leaves in order, exclude history `published` and `pending`, and require the article to be absent. Assert the first 20 keys equal the design exactly.
- [ ] Assert the external manifest has 20 unique keys, article paths, and image names and contains only action `created`.
- [ ] Assert the branch starts from the stated base and has no unrelated worktree changes.

### Task 2: Build the evidence map

**Files:**
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-platform-backend-next-20-evidence-map.md`

- [ ] For sandboxing, auditability, and gateway boundaries, use NIST publications, Linux/Kubernetes security documentation, OpenTelemetry, W3C Trace Context, and protocol specifications.
- [ ] For queues, workers, concurrency, deadlines, caches, fallback, disaster recovery, canary releases, SLOs, and incident response, use AMQP or CloudEvents, gRPC, HTTP cache semantics, Kubernetes, and original reliability guidance.
- [ ] For backend APIs and state storage, use OpenAPI, JSON Schema, AsyncAPI, gRPC/Protocol Buffers, RFCs, and official object-storage multipart documentation.
- [ ] Record one learning outcome, at least three supported claims, URLs, confidence, and a time boundary under every key. Require 20 headings, at least 60 claims, no empty source lists, and no inaccessible final source.

### Task 3: Generate and validate images 1–10

**Files:**
- Create: `images/agent-sandbox-escape-defense-layers-v1.webp`
- Create: `images/agent-audit-log-evidence-chain-v1.webp`
- Create: `images/agent-api-gateway-policy-routing-v1.webp`
- Create: `images/agent-queue-worker-job-lifecycle-v1.webp`
- Create: `images/agent-concurrency-fair-scheduler-v1.webp`
- Create: `images/agent-timeout-budget-deadline-chain-v1.webp`
- Create: `images/agent-cache-layered-keys-v1.webp`
- Create: `images/agent-model-fallback-circuit-state-v1.webp`
- Create: `images/agent-disaster-recovery-checkpoint-replay-v1.webp`
- Create: `images/agent-canary-release-progressive-rollout-v1.webp`

- [ ] Use built-in `imagegen` once per distinct diagram and preserve every generated source outside the repository.
- [ ] Begin every prompt with the exact light-theme contract; require short English labels and one unambiguous mechanism.
- [ ] Inspect semantics: sandbox controls form independent layers; audit events flow through integrity and retention controls; the gateway authenticates and authorizes before routing; queue ownership includes lease and acknowledgement; concurrency shows admission and fair scheduling; deadlines shrink downstream; cache keys include identity and freshness; circuit states are closed/open/half-open; recovery replays from a durable checkpoint; canary exposure expands only after evidence passes.
- [ ] Convert accepted sources to 1672×941 RGB WebP and run all quantitative image gates. Regenerate failures; never relax gates.

### Task 4: Draft and validate articles 1–10

**Files:**
- Create: `knowledge/llm/production/agent-sandbox-escape.md`
- Create: `knowledge/llm/production/agent-audit-log.md`
- Create: `knowledge/llm/production/agent-api-gateway.md`
- Create: `knowledge/llm/production/agent-queue-worker.md`
- Create: `knowledge/llm/production/agent-concurrency.md`
- Create: `knowledge/llm/production/agent-timeout-budget.md`
- Create: `knowledge/llm/production/agent-cache.md`
- Create: `knowledge/llm/production/agent-model-fallback.md`
- Create: `knowledge/llm/production/agent-disaster-recovery.md`
- Create: `knowledge/llm/production/agent-canary-release.md`

- [ ] Draft each article from the evidence map with a concise mental model, dependency-first mechanism, practical contract or example, failure modes, verification, recap, and final references.
- [ ] Insert exactly one matching OSS image URL immediately after the prose that creates the visual need, with meaningful Chinese alt text and caption.
- [ ] For every file assert bytes >4,500, no H1/front matter/local path/placeholder, exactly one image URL, exactly one final reference heading, balanced fences, and every final source URL cited in the body.
- [ ] Review neighboring-topic boundaries and remove repeated generic sections.

### Task 5: Generate and validate images 11–20

**Files:**
- Create: `images/agent-slo-error-budget-loop-v1.webp`
- Create: `images/agent-incident-response-detection-recovery-loop-v1.webp`
- Create: `images/api-schema-validation-contract-pipeline-v1.webp`
- Create: `images/async-job-queue-delivery-lifecycle-v1.webp`
- Create: `images/grpc-basics-protobuf-call-path-v1.webp`
- Create: `images/webhook-design-signature-retry-ledger-v1.webp`
- Create: `images/file-upload-service-multipart-object-flow-v1.webp`
- Create: `images/api-pagination-filtering-cursor-order-v1.webp`
- Create: `images/api-idempotency-request-ledger-v1.webp`
- Create: `images/agent-state-storage-state-model-v1.webp`

- [ ] Generate and inspect one image at a time under the same light-theme contract.
- [ ] Require: SLOs connect SLIs, objective, error budget, and release policy; incident response closes detection, mitigation, recovery, and learning; schemas validate at design, boundary, and contract-test stages; async delivery distinguishes enqueue, lease, execute, acknowledge, retry, and dead-letter states; gRPC shows the generated-stub call path; webhooks verify authenticity and replay before side effects; multipart uploads verify parts before finalization; cursor pagination preserves stable order; idempotency maps a scoped key to one durable outcome; Agent storage separates state classes and reconstruction paths.
- [ ] Convert to exact final assets and apply all semantic and quantitative gates first to group B, then all 20 together.

### Task 6: Draft and validate articles 11–20

**Files:**
- Create: `knowledge/llm/production/agent-slo.md`
- Create: `knowledge/llm/production/agent-incident-response.md`
- Create: `knowledge/backend/api/api-schema-validation.md`
- Create: `knowledge/backend/api/async-job-queue.md`
- Create: `knowledge/backend/api/grpc-basics.md`
- Create: `knowledge/backend/api/webhook-design.md`
- Create: `knowledge/backend/api/file-upload-service.md`
- Create: `knowledge/backend/api/api-pagination-filtering.md`
- Create: `knowledge/backend/api/api-idempotency.md`
- Create: `knowledge/backend/storage/agent-state-storage.md`

- [ ] Draft from the evidence map and explicitly separate normative standard, documented implementation behavior, failure observation, and engineering recommendation.
- [ ] Insert one unique exact OSS image per article and apply the same content gates as group A.
- [ ] Confirm all 20 keys, images, paths, labels, sources, and topic boundaries are unique and complete.

### Task 7: Update ledgers and verify the repository

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

- [ ] Change only the selected 20 leaf `contentStatus` values from `coming-soon` to `published`.
- [ ] Change exactly 20 records in batch `agent-observability-security-next-20-2026-07-16` from `pending` to `published`.
- [ ] Append the 20 exact manifest records with `status: pending`, `action: created`, `recordedAt: 2026-07-17`, and batch `agent-platform-backend-next-20-2026-07-17`.
- [ ] Assert tree totals 300 unique / 258 published / 42 coming-soon and history totals 159 unique / 139 published / 20 pending.
- [ ] Run `npm run validate:tree`, article gates, image gates, URL checks, ledger assertions, `git diff --check`, secret/local-path scans, and exact-scope checks.
- [ ] Expect 44 changed files across three commits: two planning documents, 20 Markdown files, 20 images, and two JSON ledgers.
- [ ] Commit the exact 42 content and ledger files as `docs: add agent platform backend guides`.

### Task 8: Publish and accept synchronization

**Files:**
- Read: `.github/workflows/sync.yml`

- [ ] Push `content/agent-platform-backend-next-20` and create a ready PR to `master`.
- [ ] Require 3 commits, 44 files, clean mergeability, and no unexpected review or check blocker.
- [ ] Merge with a merge commit and capture the merge SHA.
- [ ] Find the `sync-content` Action whose `headSha` exactly equals that merge SHA; ignore branch-head runs.
- [ ] Require Action conclusion `success` and FaaS response `{manifests:1, articles:20, images:20, deleted:0, errors:[]}`.
- [ ] Re-fetch `origin/master`, recalculate inventory and ledger totals, then report created/updated/skipped/failed/pending-image counts, PR, merge SHA, Action, payload, and final progress.
