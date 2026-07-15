# AI App Infrastructure and RAG Governance Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Research, create, illustrate, validate, and publish the next 10 directory-order FrontEnd Journey knowledge articles spanning five AI application infrastructure topics and five RAG retrieval governance topics.

**Architecture:** Treat `origin/master` as the source of truth. Build a primary-source evidence map before drafting, create one semantic WebP illustration per article, write body-only Chinese Markdown through a provider-neutral engineering lens, then update the tree and history atomically. Publish through a ready PR and accept only the merge-SHA `sync-content` Action as completion evidence.

**Tech Stack:** Markdown, JSON, Node.js inventory/assertion scripts, imagegen/image2-compatible generated illustrations, Pillow WebP verification, Git, GitHub CLI, GitHub Actions.

## Global Constraints

- Repository: `AmbitionC/front-end-journey-resource`; base branch: `master`; work branch: `content/ai-app-rag-next-10`.
- Selection is exactly the 10 keys listed in Task 1 and follows tree traversal order after excluding published/pending history keys.
- Write Chinese body-only Markdown with no H1; every article ends with `## 参考资料` containing only sources used in the body.
- Use primary sources for technical claims; mark volatile provider behavior as current on `2026-07-15`.
- Create exactly one 1672×941 WebP teaching illustration per article under `images/`; reference the exact final OSS URL once.
- Promote the previous 10 successful pending history records to published; append this batch as 10 pending records with batch `ai-app-rag-next-10-2026-07-15`.
- Do not alter any unrelated article, leaf key, filePath, hierarchy, order, orphan file, interview content, application repository, or infrastructure repository.
- Publish only after local validation; after merge, require Action response `manifests: 1`, `articles: 10`, `images: 10`, `deleted: 0`, and `errors: []`.

---

### Task 1: Reconfirm scope and build the evidence map

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/ai-app-rag-next-10-evidence-map.md`

**Interfaces:**
- Consumes: the current remote tree/history and authoritative web documentation.
- Produces: an exact 10-entry action manifest and a claim/source/confidence/time-sensitivity map used by all drafts.

- [ ] **Step 1: Run the bundled inventory**

Run:

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  node /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs \
  /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/fej-ai-rag-next-10
```

Expected: 300 leaves, 158 existing, 142 missing, zero duplicate keys, and the same two unrelated orphans.

- [ ] **Step 2: Assert the deterministic selection**

Assert the first 10 `coming-soon` leaves absent from published/pending history are exactly:

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

Expected: all 10 expected Markdown paths are missing and all selected keys are absent from history.

- [ ] **Step 3: Research AI application infrastructure sources**

Use current official sources and capture supported claims for:

```text
https://developers.openai.com/api/docs/guides/realtime
https://developers.openai.com/api/docs/guides/audio
https://ai.google.dev/gemini-api/docs/live
https://www.w3.org/TR/webrtc/
https://www.w3.org/TR/mediacapture-streams/
https://developers.openai.com/api/docs/guides/migrate-to-responses
https://platform.claude.com/docs/en/api/messages/create
https://ai.google.dev/gemini-api/docs/openai
https://owasp.org/API-Security/editions/2023/en/0x11-t10/
https://genai.owasp.org/llm-top-10/
https://www.rfc-editor.org/rfc/rfc9700.html
https://platform.claude.com/docs/en/build-with-claude/token-counting
https://ai.google.dev/gemini-api/docs/tokens
https://developers.openai.com/api/docs/guides/evals
https://www.nist.gov/itl/ai-risk-management-framework
```

Expected: stable engineering principles are separated from current model/API fields, limits, prices, and transport capabilities.

- [ ] **Step 4: Research RAG retrieval governance sources**

Use original papers, official database documentation, and standards for query rewriting, reranking, filters, citations, grounding, and tenant isolation. Minimum source families:

```text
https://arxiv.org/abs/2212.10496
https://arxiv.org/abs/1901.04085
https://docs.cohere.com/docs/rerank-overview
https://qdrant.tech/documentation/concepts/filtering/
https://docs.pinecone.io/guides/search/filter-by-metadata
https://platform.claude.com/docs/en/build-with-claude/citations
https://ai.google.dev/gemini-api/docs/google-search
https://arxiv.org/abs/2309.15217
https://csrc.nist.gov/pubs/sp/800/207/final
```

Expected: the evidence map distinguishes retrieval recall, ranking quality, claim support, authorization, and end-to-end answer quality.

- [ ] **Step 5: Write and self-review the evidence map**

For every key record: one-sentence learning outcome, claims, sources, confidence, volatile details, and topics explicitly out of scope. Scan for unsupported limits, benchmarks, pricing, or invented compatibility claims.

### Task 2: Generate and normalize the 10 teaching illustrations

**Files:**
- Create: `images/llm-audio-realtime-session-pipeline-v1.webp`
- Create: `images/llm-provider-abstraction-capability-adapter-v1.webp`
- Create: `images/llm-api-security-trust-boundary-v1.webp`
- Create: `images/llm-token-budget-context-allocation-v1.webp`
- Create: `images/llm-user-feedback-quality-loop-v1.webp`
- Create: `images/rag-query-rewrite-routing-tree-v1.webp`
- Create: `images/rag-reranking-two-stage-ranking-v1.webp`
- Create: `images/rag-metadata-filtering-pre-post-filter-v1.webp`
- Create: `images/rag-citation-grounding-evidence-chain-v1.webp`
- Create: `images/rag-access-control-tenant-boundary-v1.webp`

**Interfaces:**
- Consumes: the illustration specifications in the design and verified domain mechanisms from Task 1.
- Produces: ten semantically reviewed, project-local WebP assets used by Tasks 3 and 4.

- [ ] **Step 1: Generate one source image per concept**

Use built-in imagegen once per distinct prompt. Require a warm-white background, navy/cyan/coral/violet palette, clear 16:9 reading direction, no brands, no watermark, no random text, and one mechanism per image.

- [ ] **Step 2: Inspect all source images**

Check arrows, stages, trust boundaries, ranking order, filter position, claim/evidence links, tenant isolation, and absence of misleading labels. Regenerate any image where cancellation implies rollback, post-filtering implies authorization, or citations imply truth.

- [ ] **Step 3: Save final project assets**

Copy accepted source bytes from `$CODEX_HOME/generated_images/...` without deleting originals, then convert each asset to 1672×941 RGB WebP at quality 90 under its exact final filename.

- [ ] **Step 4: Verify bytes**

Decode every final asset with Pillow and assert format `WEBP`, dimensions `(1672, 941)`, non-zero byte size, and ten unique filenames.

### Task 3: Draft the five AI application infrastructure articles

**Files:**
- Create: `knowledge/llm/dev/llm-audio-realtime.md`
- Create: `knowledge/llm/dev/llm-provider-abstraction.md`
- Create: `knowledge/llm/dev/llm-api-security.md`
- Create: `knowledge/llm/dev/llm-token-budget.md`
- Create: `knowledge/llm/dev/llm-user-feedback.md`

**Interfaces:**
- Consumes: Task 1 evidence entries and the first five Task 2 assets.
- Produces: five body-only, source-backed Markdown articles ready for tree publication.

- [ ] **Step 1: Draft `llm-audio-realtime.md`**

Explain the bidirectional session model, media capture, WebRTC versus WebSocket responsibilities, frame/buffer handling, voice activity, interruption/barge-in, latency budget, consent, failure recovery, and dated provider differences. Use exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-audio-realtime-session-pipeline-v1.webp
```

- [ ] **Step 2: Draft `llm-provider-abstraction.md`**

Define domain request/event/result types, capabilities, adapters, routing, normalized errors/usage, provider escape hatches, contract tests, and migration boundaries. Do not claim identical roles, tools, streams, or state across providers. Use the exact matching capability-adapter image URL.

- [ ] **Step 3: Draft `llm-api-security.md`**

Explain browser/BFF/provider trust boundaries, user authentication, authorization, key vaults, scoped credentials, quotas, request validation, egress controls, rotation, audit, and incident response. Reject long-lived provider secrets in browsers and weak open proxies. Use the exact matching trust-boundary image URL.

- [ ] **Step 4: Draft `llm-token-budget.md`**

Build a total budget formula and allocate instructions, protected facts, recent history, retrieval evidence, tool definitions/results, output reserve, and safety margin. Cover estimation drift, truncation order, compaction, output caps, observability, and provider token counting. Use the exact matching context-allocation image URL.

- [ ] **Step 5: Draft `llm-user-feedback.md`**

Separate explicit ratings, reason codes, corrections, behavioral signals, support incidents, and sampled expert review. Connect issue taxonomy to frozen eval sets, candidate fixes, canary release, and monitoring; state privacy/consent limits. Use the exact matching quality-loop image URL.

- [ ] **Step 6: Cross-review the five articles**

Expected per file: one concrete architecture or code example, one image, one current-provider section only where necessary, common failure modes, a concise recap, and used-only final sources.

### Task 4: Draft the five RAG retrieval governance articles

**Files:**
- Create: `knowledge/llm/rag/rag-query-rewrite.md`
- Create: `knowledge/llm/rag/rag-reranking.md`
- Create: `knowledge/llm/rag/rag-metadata-filtering.md`
- Create: `knowledge/llm/rag/rag-citation-grounding.md`
- Create: `knowledge/llm/rag/rag-access-control.md`

**Interfaces:**
- Consumes: Task 1 evidence entries and the last five Task 2 assets.
- Produces: five body-only, source-backed Markdown articles ready for tree publication.

- [ ] **Step 1: Draft `rag-query-rewrite.md`**

Explain normalization, intent preservation, acronym/entity handling, expansion, HyDE-like hypothetical documents, decomposition, multi-query retrieval, reciprocal/weighted merging, deduplication, rewrite drift, and evaluation. Use the exact matching routing-tree image URL.

- [ ] **Step 2: Draft `rag-reranking.md`**

Explain fast first-stage recall followed by cross-encoder or service reranking, candidate depth, feature and score semantics, truncation, diversity, latency/cost, offline ranking metrics, and end-to-end answer evaluation. Use the exact matching two-stage image URL.

- [ ] **Step 3: Draft `rag-metadata-filtering.md`**

Define metadata schema and typed filters; compare pre-filtering, vector-engine integrated filtering, and post-filtering; cover selectivity, ANN recall, missing/dirty metadata, time/version filters, filter observability, and testing. Use the exact matching pre/post-filter image URL.

- [ ] **Step 4: Draft `rag-citation-grounding.md`**

Separate source attribution from claim support. Build stable document/chunk/page provenance, claim—evidence mapping, support/coverage checks, quote limits, stale-source handling, refusal, and evaluation. Use the exact matching evidence-chain image URL.

- [ ] **Step 5: Draft `rag-access-control.md`**

Apply subject/resource/action/context policies before retrieval; cover tenant namespaces versus filters, row-level policy, ingestion labels, cache and embedding isolation, deleted/revoked data, audit, and adversarial tests. State that model-side refusal and post-filtering cannot repair unauthorized retrieval. Use the exact matching tenant-boundary image URL.

- [ ] **Step 6: Cross-review the five articles**

Expected: the series progresses from query representation to candidate ranking, filtering, evidence, and authorization without duplicating the RAG fundamentals articles.

### Task 5: Update the tree and publication history atomically

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: all ten completed Markdown/image pairs.
- Produces: 168 published tree leaves, 132 coming-soon leaves, and 69 unique history records with 59 published plus 10 pending.

- [ ] **Step 1: Publish only the 10 selected leaves**

Change `contentStatus` from `coming-soon` to `published` for the exact selected keys. Preserve every label, filePath, hierarchy, order, and unrelated node.

- [ ] **Step 2: Promote the previous successful batch**

Change history status from pending to published for exactly:

```text
llm-api-basics
llm-conversation-state
llm-multimodal-api
llm-error-retry-fallback
llm-model-routing
llm-response-api-patterns
llm-stream-cancel-resume
llm-batch-api
llm-file-input
llm-vision-app
```

- [ ] **Step 3: Append the new batch records**

Add one record per selected key with the exact tree label and filePath, `status: pending`, `action: created`, `recordedAt: 2026-07-15`, and `batch: ai-app-rag-next-10-2026-07-15`.

### Task 6: Run complete local verification and commit

**Files:**
- Verify: all files created or modified by Tasks 2–5.

**Interfaces:**
- Consumes: the complete unpublished branch.
- Produces: fresh evidence sufficient for a safe commit and PR.

- [ ] **Step 1: Run repository validation**

Run:

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  /Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm run validate:tree
```

Expected: pass with 132 expected missing-file warnings and the same two pre-existing orphan warnings.

- [ ] **Step 2: Run structural assertions**

Assert: 300 unique leaves; 168 published and 132 coming soon; 69 unique history keys; 59 published and 10 pending; exactly 10 new batch records; all 20 article/image paths exist; each article contains one exact matching OSS WebP URL plus `## 参考资料`, no H1, and no unused final reference.

- [ ] **Step 3: Verify image and content hygiene**

Decode all ten WebP files at 1672×941. Search the ten Markdown files for `IMAGE2_PENDING`, `/Users/`, `file://`, generated-image paths, credential-shaped tokens, malformed references, and duplicated generic boilerplate; expected: no match or unexplained duplication.

- [ ] **Step 4: Review scoped diff**

Run `git diff --check`, `git status --short`, `git diff --stat`, and inspect the tree/history diff. Expected content scope: 10 Markdown files, 10 images, two JSON files, plus the committed design and plan.

- [ ] **Step 5: Commit the content batch**

Stage only intended files and commit:

```bash
git commit -m "docs: add AI app and RAG governance guides"
```

### Task 7: Publish through GitHub and verify the remote result

**Files:**
- Publish branch: `content/ai-app-rag-next-10`
- Target: `master`

**Interfaces:**
- Consumes: the verified local commits.
- Produces: a merged PR, successful `sync-content` Action, and remote progress evidence.

- [ ] **Step 1: Push and open a ready PR**

Push with upstream tracking. Create a ready PR titled `docs: add AI app and RAG governance guides`; describe the 10 topics, illustrations, metadata transition, and exact checks.

- [ ] **Step 2: Inspect and merge the PR**

Confirm base/head, 24-file total scope including design/plan, mergeability, and check state. Merge only when GitHub reports a clean merge and no required check is failing.

- [ ] **Step 3: Wait for the merge-SHA Action**

Watch `sync-content` for the exact merge SHA. Expected FaaS body:

```json
{"success":true,"data":{"manifests":1,"articles":10,"images":10,"deleted":0,"errors":[]}}
```

If the Action fails, inspect its logs and stop. Do not modify infrastructure or report publication complete without separate authorization.

- [ ] **Step 4: Recompute progress from remote `master`**

Fetch `origin/master` and assert the merge SHA, all 20 new article/image paths, tree counts 168/132, history counts 59/10, and new batch count 10. Report created 10, updated 0, skipped 0, failed 0, pending images 0, plus PR and Action links.

Expected final line:

```text
整体进度：69/300（23.00%）
```
