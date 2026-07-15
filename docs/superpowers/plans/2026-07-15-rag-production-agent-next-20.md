# RAG Production and Agent Orchestration Next 20 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Research, illustrate, write, validate, and publish the next 20 directory-order FrontEnd Journey knowledge articles covering RAG production engineering and the first four Agent orchestration topics.

**Architecture:** Treat `origin/master` at `c7c7458d3c6bf68077e4817954ba9ffd214a114e` as the immutable selection baseline. Work in one isolated branch but implement two independently validated groups of ten; create a primary-source evidence map before drafting, generate one semantic WebP per article, then update tree/history atomically and publish through one ready PR. The merge-SHA `sync-content` response is the only production completion signal.

**Tech Stack:** Chinese body-only Markdown, JSON manifests, Node.js assertions, built-in imagegen, Pillow WebP normalization, Git, GitHub CLI/app, GitHub Actions.

## Global Constraints

- Repository: `AmbitionC/front-end-journey-resource`; branch: `content/rag-production-agent-next-20`; base: `master`.
- Scope is exactly the 20 keys in Task 1; no unrelated article, leaf, order, orphan, app, or infrastructure change.
- Process Group A (keys 1–10) and Group B (keys 11–20) separately; validate Group A before drafting Group B.
- Every article is body-only Chinese Markdown with no H1, one concrete mechanism/example, one matching image, common failures, concise recap, and used-only `## 参考资料`.
- Use primary sources; mark current vendor/API behavior as verified on `2026-07-15`.
- Every final image is a unique 1672×941 RGB WebP in `images/` and appears exactly once through the matching OSS URL.
- Promote the previous 10 successful pending records, then append 20 pending records with batch `rag-production-agent-next-20-2026-07-15`.
- Final expected state: tree 300 total / 188 published / 112 coming-soon; history 89 total / 69 published / 20 pending.
- Expected Action response: `{"success":true,"data":{"manifests":1,"articles":20,"images":20,"deleted":0,"errors":[]}}`.

---

### Task 1: Reconfirm deterministic scope and build the evidence map

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/rag-production-agent-next-20-evidence-map.md`

**Interfaces:**
- Consumes: remote tree/history and authoritative sources.
- Produces: a 20-entry action/evidence manifest used by all article and image tasks.

- [ ] **Step 1: Run the bundled inventory**

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  node /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs \
  /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/fej-rag-agent-next-20
```

Expected: 300 leaves, 168 existing, 132 missing, zero duplicate keys, and the same two unrelated orphans.

- [ ] **Step 2: Assert the exact selection**

Assert the first 20 coming-soon leaves absent from published/pending history are:

```text
rag-production-ingestion
rag-loader-parser
rag-table-retrieval
rag-image-retrieval
rag-code-retrieval
rag-graph-rag
rag-parent-child
rag-multi-query
rag-routing
rag-context-compression
rag-deduplication
rag-index-versioning
rag-cache
rag-latency-cost
rag-testing
rag-failure-debugging
agent-tool-design
agent-workflow-state
agent-planning
agent-handoff
```

Expected: all 20 expected Markdown files are absent and no selected key exists in history.

- [ ] **Step 3: Research ingestion and specialized retrieval sources**

Capture supported claims from source families below, choosing exact current pages during research:

```text
Apache Tika / Unstructured official parser documentation
PDF, HTML, OOXML, OCR, and layout-model official specifications or maintainer docs
PostgreSQL official SQL/query documentation
OpenAI and Gemini official image-understanding documentation
Tree-sitter, Git object model, and Language Server Protocol documentation
Microsoft GraphRAG original paper and official repository/docs
```

Expected: parsing facts, inferred structure, OCR text, multimodal embeddings, code symbols, graph communities, and original evidence are never conflated.

- [ ] **Step 4: Research retrieval strategy and production-governance sources**

Use original papers and official systems documentation for Parent-Child, RRF/RAG-Fusion, routing, RECOMP/LLMLingua, MinHash/SimHash, index aliases/snapshots, HTTP/Redis caching, latency, RAGAS, OpenTelemetry, and NIST TEVV.

Expected: every benchmark claim remains scoped to its paper; current database/API limits are dated rather than generalized.

- [ ] **Step 5: Research Agent orchestration sources**

Use JSON Schema, MCP, current provider tool/agent docs, durable workflow/checkpoint documentation, ReAct/planning research, and current handoff/agent-as-tool documentation.

Expected: tool contract, workflow state, plan state, control ownership, context transfer, authorization, and side-effect semantics are separately defined.

- [ ] **Step 6: Write and self-review the 20-entry evidence map**

For each key record one-sentence learning outcome, supported claims, sources, confidence, volatile details, and explicit out-of-scope topics. Scan for unsupported limits, prices, compatibility claims, and invented paper results.

### Task 2: Generate and validate Group A teaching illustrations

**Files:**
- Create: `images/rag-production-ingestion-versioned-pipeline-v1.webp`
- Create: `images/rag-loader-parser-layout-tree-v1.webp`
- Create: `images/rag-table-retrieval-query-routing-v1.webp`
- Create: `images/rag-image-retrieval-multimodal-evidence-v1.webp`
- Create: `images/rag-code-retrieval-symbol-graph-v1.webp`
- Create: `images/rag-graph-rag-local-global-v1.webp`
- Create: `images/rag-parent-child-small-big-v1.webp`
- Create: `images/rag-multi-query-fusion-v1.webp`
- Create: `images/rag-routing-multi-index-v1.webp`
- Create: `images/rag-context-compression-evidence-filter-v1.webp`

**Interfaces:**
- Consumes: Group A evidence and image specifications from the design.
- Produces: ten inspected project-local WebP assets for Task 3.

- [ ] **Step 1: Generate ten distinct source images**

Use one built-in imagegen call per image. Prompts must implement the exact teaching relationships in the design, 16:9 left-to-right layout, dark navy/cyan/violet/green/amber visual system, short exact labels, and explicit factual constraints. Do not use logos, provider names, paragraphs, watermarks, random text, or decorative characters.

- [ ] **Step 2: Inspect semantic correctness**

Reject any image that makes parser inference look like source truth, lets SQL bypass schema/authorization, treats OCR as pixel truth, loses code snapshot/version, uses graph summaries as citations, reverses child/parent roles, routes generated queries directly to answers, allows routing to change authorization, or compresses before authorization.

- [ ] **Step 3: Preserve accepted sources and normalize finals**

Copy accepted PNG sources without deleting generated originals to:

```text
/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/rag-production-agent-next-20-image-sources/group-a/
```

Use Pillow `ImageOps.fit(..., (1672, 941), LANCZOS)` and save RGB WebP at quality 90 under the exact filenames above.

- [ ] **Step 4: Verify Group A bytes**

Decode all ten finals and assert `WEBP`, `(1672, 941)`, non-zero size, and ten unique names.

### Task 3: Draft and validate Group A articles

**Files:**
- Create: `knowledge/llm/rag/rag-production-ingestion.md`
- Create: `knowledge/llm/rag/rag-loader-parser.md`
- Create: `knowledge/llm/rag/rag-table-retrieval.md`
- Create: `knowledge/llm/rag/rag-image-retrieval.md`
- Create: `knowledge/llm/rag/rag-code-retrieval.md`
- Create: `knowledge/llm/rag/rag-graph-rag.md`
- Create: `knowledge/llm/rag/rag-parent-child.md`
- Create: `knowledge/llm/rag/rag-multi-query.md`
- Create: `knowledge/llm/rag/rag-routing.md`
- Create: `knowledge/llm/rag/rag-context-compression.md`

**Interfaces:**
- Consumes: Task 1 evidence map and Task 2 assets.
- Produces: ten body-only Markdown articles that pass the Group A gate.

- [ ] **Step 1: Draft the ingestion and parsing pair**

`rag-production-ingestion.md` must cover source registry, event/idempotency model, parsing/chunk/embedding versions, incremental upsert/delete, shadow build, atomic publish, lineage, backfill, monitoring, and replay. `rag-loader-parser.md` must cover Loader versus Parser, MIME/encoding, layout tree, page/coordinate provenance, tables/images/footnotes, OCR fallback, confidence, malformed/encrypted documents, and parser evaluation.

- [ ] **Step 2: Draft the table and image pair**

`rag-table-retrieval.md` must distinguish governed SQL generation, schema retrieval, cell/row retrieval, semantic layers, result evidence, aggregation correctness, injection, and timeout/row limits. `rag-image-retrieval.md` must cover original assets, OCR regions, captions, visual embeddings, late/early fusion, spatial grounding, deduplication, privacy, and multimodal evaluation.

- [ ] **Step 3: Draft the code and GraphRAG pair**

`rag-code-retrieval.md` must cover repository snapshot, parser AST, symbol/definition/reference/call/import edges, text and structural chunks, hybrid query routes, generated files, access, freshness, and code-answer evaluation. `rag-graph-rag.md` must cover entity/relation extraction, provenance, community detection/summaries, local versus global queries, graph update, conflict, cost, and citation back to original sources.

- [ ] **Step 4: Draft the Parent-Child and Multi-Query pair**

`rag-parent-child.md` must explain small child embeddings, stable parent linkage, parent expansion, adjacent-window alternative, dedup/token budgets, updates, and evaluation. `rag-multi-query.md` must explain bounded query variants, constraint preservation, parallel recall, RRF/weighted fusion, duplicate control, drift, budgets, and comparison with the preceding rewrite article.

- [ ] **Step 5: Draft the routing and compression pair**

`rag-routing.md` must define route labels, hard authorization/data-type filters, classifier/rule/embedding routes, fan-out, fallback, abstention, calibration, observability, and routing evaluation. `rag-context-compression.md` must explain post-retrieval extraction/filtering, source-span preservation, redundancy removal, token allocation, lossy failure modes, injection resistance, and faithfulness evaluation.

- [ ] **Step 6: Run the Group A gate**

Assert ten expected files, exactly one matching OSS WebP URL per article, useful alt text, no H1, one `## 参考资料`, all final sources linked in the body, balanced code fences, no local/generated paths, and no credential-shaped text. Decode all ten images again before proceeding.

### Task 4: Generate and validate Group B teaching illustrations

**Files:**
- Create: `images/rag-deduplication-near-duplicate-v1.webp`
- Create: `images/rag-index-versioning-blue-green-v1.webp`
- Create: `images/rag-cache-layered-keys-v1.webp`
- Create: `images/rag-latency-cost-budget-v1.webp`
- Create: `images/rag-testing-golden-set-pyramid-v1.webp`
- Create: `images/rag-failure-debugging-stage-funnel-v1.webp`
- Create: `images/agent-tool-design-contract-v1.webp`
- Create: `images/agent-workflow-state-checkpoint-v1.webp`
- Create: `images/agent-planning-replan-loop-v1.webp`
- Create: `images/agent-handoff-responsibility-boundary-v1.webp`

**Interfaces:**
- Consumes: Group B evidence and image specifications from the design.
- Produces: ten inspected project-local WebP assets for Task 5.

- [ ] **Step 1: Generate ten distinct source images**

Use one built-in imagegen call per asset with the same production visual system and exact mechanism from the design. Keep essential labels short; do not put vendor names, long prose, logos, watermarks, or secrets in images.

- [ ] **Step 2: Inspect semantic correctness**

Reject images that merge exact and near duplicate decisions, mutate an index in place during blue/green release, share caches across authorization/version boundaries, show latency as one undifferentiated number, use online traffic as a frozen golden set, skip trace stages, let Schema authorize tools, checkpoint only before side effects, allow unbounded replanning, or broadcast all context during handoff.

- [ ] **Step 3: Preserve accepted sources and normalize finals**

Copy accepted PNG sources to the repository-external `group-b/` source folder, preserve originals, and convert to exact 1672×941 RGB WebP quality 90 filenames above.

- [ ] **Step 4: Verify Group B bytes**

Decode all ten finals and assert `WEBP`, `(1672, 941)`, non-zero size, and ten unique names distinct from Group A.

### Task 5: Draft and validate Group B articles

**Files:**
- Create: `knowledge/llm/rag/rag-deduplication.md`
- Create: `knowledge/llm/rag/rag-index-versioning.md`
- Create: `knowledge/llm/rag/rag-cache.md`
- Create: `knowledge/llm/rag/rag-latency-cost.md`
- Create: `knowledge/llm/rag/rag-testing.md`
- Create: `knowledge/llm/rag/rag-failure-debugging.md`
- Create: `knowledge/llm/agent/agent-tool-design.md`
- Create: `knowledge/llm/agent/agent-workflow-state.md`
- Create: `knowledge/llm/agent/agent-planning.md`
- Create: `knowledge/llm/agent/agent-handoff.md`

**Interfaces:**
- Consumes: Task 1 evidence map and Task 4 assets.
- Produces: ten body-only Markdown articles that pass the Group B gate.

- [ ] **Step 1: Draft the deduplication and index-versioning pair**

`rag-deduplication.md` must separate normalization, exact hash, shingling/MinHash/SimHash candidates, semantic adjudication, canonical selection, provenance, cluster updates, and false merge/split metrics. `rag-index-versioning.md` must cover immutable build manifests, source/chunk/embedding versions, dual write limits, shadow queries, release gates, alias/route switch, rollback, migration, and garbage collection.

- [ ] **Step 2: Draft the cache and latency/cost pair**

`rag-cache.md` must distinguish embedding, retrieval, rerank, context and answer cache keys; include tenant/ACL, model, index and prompt versions; explain TTL/event invalidation, negative caching, stampede control, stale serving, privacy, and metrics. `rag-latency-cost.md` must partition offline/online cost and route/retrieve/rerank/generate latency, then cover batching, parallelism, early exit, budgets, queues, backpressure, degradation, SLOs, and quality tradeoffs.

- [ ] **Step 3: Draft the testing and failure-debugging pair**

`rag-testing.md` must define dataset provenance, representative/hard/adversarial slices, relevance judgments, golden-set versioning, component and end-to-end metrics, deterministic fixtures, statistical comparison, release gates, and drift refresh. `rag-failure-debugging.md` must start from symptoms and trace backward through generation, context, rerank, recall, index and source; include trace schema, counterfactual probes, replay, stage ownership, and incident playbook.

- [ ] **Step 4: Draft the tool and workflow-state pair**

`agent-tool-design.md` must define narrow tool intent, JSON Schema inputs, server authorization, time/idempotency budgets, side effects, structured success/error/partial results, retryability, observability, and contract tests. `agent-workflow-state.md` must define state versus event, run/step IDs, durable checkpoints, write-ahead intent, idempotency, leases, resume, compensation, schema migration, and replay without duplicating effects.

- [ ] **Step 5: Draft the planning and handoff pair**

`agent-planning.md` must cover goal/constraints, DAG-like tasks, dependencies, evidence, execution observations, bounded replanning, budgets, approval boundaries, loop prevention, and plan evaluation. `agent-handoff.md` must compare router, Agent-as-Tool and ownership-transfer handoff; define context envelope, capability/permission, control return, user-visible ownership, errors, tracing, and evaluation.

- [ ] **Step 6: Run the Group B gate**

Run the same article/image/reference/hygiene assertions as Group A for the ten Group B files. Stop on any mismatch before modifying tree/history.

### Task 6: Update tree and history atomically

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: twenty completed article/image pairs.
- Produces: final navigation and resumable publication metadata.

- [ ] **Step 1: Publish only the 20 selected leaves**

Change `contentStatus` from `coming-soon` to `published` for the exact Task 1 keys. Preserve every other JSON value and array order.

- [ ] **Step 2: Promote the previous successful pending batch**

Change `status` from `pending` to `published` for exactly:

```text
llm-audio-realtime
llm-provider-abstraction
llm-api-security
llm-token-budget
llm-user-feedback
rag-query-rewrite
rag-reranking
rag-metadata-filtering
rag-citation-grounding
rag-access-control
```

- [ ] **Step 3: Append 20 new pending records**

Use exact tree label/filePath, `status: pending`, `action: created`, `recordedAt: 2026-07-15`, and batch `rag-production-agent-next-20-2026-07-15`.

### Task 7: Run full verification and commit

**Files:**
- Verify: all files created or modified by Tasks 2–6.

**Interfaces:**
- Consumes: complete local branch.
- Produces: fresh evidence for safe publication.

- [ ] **Step 1: Run repository validation**

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  /Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm run validate:tree
```

Expected: pass with 112 missing-file warnings and the same two orphan warnings.

- [ ] **Step 2: Run structural assertions**

Assert 300 unique leaves; 188 published / 112 coming-soon; 89 unique history keys; 69 published / 20 pending; exact 20-record new batch; exact 20 previous promotions; all 40 article/image paths exist.

- [ ] **Step 3: Run content/image/source hygiene checks**

Assert per article: body-only, one matching image URL, one references section, all final references linked in body, balanced fences, no residue/credentials. Decode 20 WebPs at 1672×941. Check every final reference URL; expected HTTP 200 or an explained official-site access response, never 404.

- [ ] **Step 4: Review the scoped diff**

Run `git diff --check`, `git status --short`, `git diff --stat origin/master`, and JSON semantic comparisons against `origin/master`. Expected total scope after both documentation commits: 44 files, comprising design, plan, 20 Markdown, 20 WebP, and two JSON files.

- [ ] **Step 5: Commit the content batch**

Stage only intended files and commit:

```bash
git commit -m "docs: add RAG production and agent orchestration guides"
```

### Task 8: Publish, merge, and verify remote state

**Files:**
- Publish branch: `content/rag-production-agent-next-20`
- Target branch: `master`

**Interfaces:**
- Consumes: verified local commits.
- Produces: merged PR, successful sync Action, and recomputed progress.

- [ ] **Step 1: Push and create a ready PR**

Push with upstream tracking. Create a non-draft PR titled `docs: add RAG production and agent orchestration guides` describing the 20 topics, two group gates, 20 images, metadata transition, and exact verification output.

- [ ] **Step 2: Inspect and merge**

Confirm base/head, 44-file scope, three commits, clean mergeability, and no failing required check. Merge with a merge commit only when these conditions hold.

- [ ] **Step 3: Wait for merge-SHA `sync-content`**

Watch the run whose `headSha` equals the merge commit. Require workflow success, HTTP 200, and exact body:

```json
{"success":true,"data":{"manifests":1,"articles":20,"images":20,"deleted":0,"errors":[]}}
```

If it fails, inspect logs with the CI-debugging workflow and do not modify infrastructure without separate authorization.

- [ ] **Step 4: Recompute from remote `master`**

Fetch remote master and assert merge SHA, 40 resource paths, tree 188/112, history 69/20, and new batch count 20. Report created 20, updated 0, skipped 0, failed 0, pending images 0, PR and Action URLs.

Expected final line:

```text
整体进度：89/300（29.67%）
```
