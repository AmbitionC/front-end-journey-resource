# AI Application Next 10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the next 10 directory-order FrontEnd Journey AI application-development articles, each with one verified teaching image, through the resource repository PR and Action workflow.

**Architecture:** Treat `AmbitionC/front-end-journey-resource` as the sole source of truth. Research and draft the ten provider-aware but supplier-neutral application articles, then atomically update their Markdown, image assets, tree status, and history records in one branch; validate locally before merging and use the resource Action as publication authority.

**Tech Stack:** GitHub-flavored Markdown, JSON manifests, image2/imagegen, WebP, Node.js validation scripts, Git/GitHub CLI, GitHub Actions, OSS/FaaS content sync.

## Global Constraints

- Work only in `AmbitionC/front-end-journey-resource`; do not modify application, manager, FaaS, or investment repositories for routine publication.
- Keep all existing `key`, `filePath`, hierarchy, and ordering values unchanged.
- Use body-only Chinese Markdown with `##` sections and a final `## 参考资料`; do not add duplicate H1 titles.
- Use standards, specifications, and current official provider documentation for technical claims; date provider-specific behavior when it is time-sensitive.
- Create exactly one semantically useful WebP diagram per article under `images/`, with a unique `-v1.webp` filename and matching OSS URL.
- Promote the previous 10 successful pending records to `published`; add this batch as 10 unique `pending` records with batch `ai-application-next-10-2026-07-15`.
- Do not publish any placeholder, local absolute path, temporary URL, credential, or incorrect diagram.
- Publish as branch → PR → merge into `master` → successful `sync-content` Action; do not perform a production browser smoke test after Action success.

---

### Task 1: Reconfirm the batch and build the evidence map

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/ai-application-next-10-evidence-map.md`

**Interfaces:**
- Consumes: latest `master` tree, existing article inventory, history exclusion rule, and design scope.
- Produces: a 10-row manifest and per-article claim/source map used by Tasks 2–4.

- [ ] **Step 1: Run the bundled inventory on the isolated worktree**

Run:

```bash
/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs \
  /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/fej-ai-app-next-10
```

Expected: 300 knowledge leaves, 148 existing/published article leaves plus the repository's current article inventory, 152 missing article paths before this batch, zero duplicate keys, and the two known orphan warnings.

- [ ] **Step 2: Assert the deterministic selection**

Run a Node check that excludes all history records with `published` or `pending` status and asserts the first 10 eligible keys are exactly:

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

Expected: all 10 nodes have `contentStatus: coming-soon`, their expected Markdown files do not exist, and none has a history record.

- [ ] **Step 3: Research authoritative sources and record an evidence map**

The evidence map must record article key, learning outcome, consequential claims, source URL, confidence, and time sensitivity. At minimum evaluate these primary-source groups:

- API basics and interface patterns: current OpenAI Responses/Chat documentation, Anthropic Messages API, Gemini generation/Interactions documentation, and official usage/stop-reason definitions.
- Conversation state: official OpenAI conversation/response chaining documentation, Anthropic message-history semantics, and Gemini stateful-interaction documentation.
- Multimodal and vision: current OpenAI, Anthropic, and Gemini image/file input guides plus official image-generation guidance used by the article.
- Reliability: HTTP Semantics and Retry-After behavior, official provider error-code/rate-limit docs, and the exact SDK retry behavior cited in examples.
- Routing: official provider model catalogs/capability docs and internally derived policy rules clearly marked as engineering design rather than provider guarantees.
- Streaming recovery: WHATWG Streams, AbortController, and SSE specifications; distinguish transport reconnection from durable application replay.
- Batch and files: current official Batch/File API docs for providers actually compared and OWASP File Upload Cheat Sheet.

Expected: no consequential claim depends only on a secondary blog, every planned reference is used by its article, and volatile limits/prices are dated or omitted.

### Task 2: Generate and verify 10 teaching images

**Files:**
- Create: `images/llm-api-basics-request-lifecycle-v1.webp`
- Create: `images/llm-conversation-state-authoritative-state-v1.webp`
- Create: `images/llm-multimodal-api-content-parts-pipeline-v1.webp`
- Create: `images/llm-error-retry-fallback-reliability-ladder-v1.webp`
- Create: `images/llm-model-routing-policy-decision-v1.webp`
- Create: `images/llm-response-api-patterns-adapter-matrix-v1.webp`
- Create: `images/llm-stream-cancel-resume-event-log-v1.webp`
- Create: `images/llm-batch-api-offline-lifecycle-v1.webp`
- Create: `images/llm-file-input-ingestion-pipeline-v1.webp`
- Create: `images/llm-vision-app-understand-generate-loop-v1.webp`

**Interfaces:**
- Consumes: the 10 illustration specifications in the design and evidence map.
- Produces: 10 accepted local WebP assets whose exact filenames are referenced by Tasks 3 and 4 Markdown.

- [ ] **Step 1: Generate one 16:9 educational diagram per article**

Use image2/imagegen with a shared visual system: crisp vector-like shapes, restrained dark navy/cyan/amber/green palette, strong contrast, generous spacing, short English labels, no logos, no decorative characters, no watermark, and no fabricated provider UI.

Each prompt must state reading direction and factual constraints. Do not depict cache as conversation storage, cancellation as transaction rollback, fallback as unconditional, a file extension as trusted content type, or a valid structured response as truthful/authorized.

- [ ] **Step 2: Inspect every generated image at original detail**

Check all components, arrows, hierarchy, label spelling, and semantic relationships. Regenerate any image with misleading direction or unreadable labels. Accept only one final image per key.

- [ ] **Step 3: Convert accepted bytes to WebP and validate decoding**

Use the bundled Python/Pillow runtime to save accepted images under the exact filenames above. Assert all 10 files decode as WebP, have one consistent 1672×941 output size, and are non-empty.

Expected: `images_verified=10`, no duplicate filename, no temporary generated asset included in Git.

### Task 3: Write the first five application-foundation articles

**Files:**
- Create: `knowledge/llm/dev/llm-api-basics.md`
- Create: `knowledge/llm/dev/llm-conversation-state.md`
- Create: `knowledge/llm/dev/llm-multimodal-api.md`
- Create: `knowledge/llm/dev/llm-error-retry-fallback.md`
- Create: `knowledge/llm/dev/llm-model-routing.md`

**Interfaces:**
- Consumes: Task 1 evidence and Task 2 image filenames.
- Produces: five self-contained body-only articles referenced by existing AI application leaves.

- [ ] **Step 1: Draft `llm-api-basics.md`**

Explain the provider-neutral request envelope, roles/content parts, synchronous/streaming responses, usage/stop reasons, token accounting, pricing dimensions, request IDs, rate limits, data retention boundaries, and a normalization example. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-api-basics-request-lifecycle-v1.webp
```

- [ ] **Step 2: Draft `llm-conversation-state.md`**

Separate UI session, application conversation, provider response chain, authoritative business state, message/event log, summaries, idempotency, branching, deletion/retention, concurrency, and replay. Emphasize that model context is not the database of record. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-conversation-state-authoritative-state-v1.webp
```

- [ ] **Step 3: Draft `llm-multimodal-api.md`**

Cover typed content parts, media transport options, MIME and size validation, preprocessing, token/cost implications, ordering, capability discovery, multi-output responses, accessibility, privacy, and a minimal provider-neutral envelope. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-multimodal-api-content-parts-pipeline-v1.webp
```

- [ ] **Step 4: Draft `llm-error-retry-fallback.md`**

Cover total deadline budgets, error taxonomy, retry eligibility, exponential backoff with jitter, `Retry-After`, idempotency, circuit breakers, load shedding, fallback compatibility, safety/quality regression, user-visible failure, and observability. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-error-retry-fallback-reliability-ladder-v1.webp
```

- [ ] **Step 5: Draft `llm-model-routing.md`**

Cover rule-based and score-based routing, capability and policy gates, data residency, quality/latency/cost constraints, shadow evaluation, confidence/complexity classifiers, fallback routes, routing feedback, and anti-oscillation controls. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-model-routing-policy-decision-v1.webp
```

- [ ] **Step 6: Review the five articles for overlap and source placement**

Expected: each article introduces one distinct system boundary, uses nearby citations for important claims, includes meaningful alt text/caption, ends with only actually used references, and contains no H1.

### Task 4: Write the five interface, long-task, file, and vision articles

**Files:**
- Create: `knowledge/llm/dev/llm-response-api-patterns.md`
- Create: `knowledge/llm/dev/llm-stream-cancel-resume.md`
- Create: `knowledge/llm/dev/llm-batch-api.md`
- Create: `knowledge/llm/dev/llm-file-input.md`
- Create: `knowledge/llm/dev/llm-vision-app.md`

**Interfaces:**
- Consumes: Task 1 evidence, Task 2 image filenames, and the first five articles' terminology.
- Produces: five non-duplicative articles that complete this batch's application-development sequence.

- [ ] **Step 1: Draft `llm-response-api-patterns.md`**

Compare message-centric Chat/Message APIs with item-centric Responses/Interactions interfaces, including instructions, typed items, tool loops, state handles, streaming events, structured outputs, migration, capability detection, and a loss-aware internal adapter. Do not claim one universal wire format. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-response-api-patterns-adapter-matrix-v1.webp
```

- [ ] **Step 2: Draft `llm-stream-cancel-resume.md`**

Cover client cancellation, abort propagation, cancellation versus provider completion, partial text handling, event IDs, checkpoints, durable event logs, idempotent replay, resume tokens, non-replayable side effects, and recovery UX without duplicating SSE frame parsing. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-stream-cancel-resume-event-log-v1.webp
```

- [ ] **Step 3: Draft `llm-batch-api.md`**

Cover offline suitability, deterministic request IDs, JSONL/task manifests, validation, submission, polling/webhooks, result correlation, partial failures, selective replay, expiry, privacy, cost/throughput measurement, and current provider differences dated `2026-07-15`. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-batch-api-offline-lifecycle-v1.webp
```

- [ ] **Step 4: Draft `llm-file-input.md`**

Cover secure upload, extension/MIME/magic-byte checks, malware and archive-bomb defenses, object storage, parsing/OCR, normalized document models, chunking/indexing, direct provider-file references, citations, deletion/retention, and large-file async UX. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-file-input-ingestion-pipeline-v1.webp
```

- [ ] **Step 5: Draft `llm-vision-app.md`**

Separate image understanding from image generation/editing, then cover input quality, detail/resolution controls, prompt and reference-image handling, coordinate/measurement limitations, structured results, output provenance, human review, image safety, accessibility, and task-specific evaluation. Reference exactly:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-vision-app-understand-generate-loop-v1.webp
```

- [ ] **Step 6: Cross-review all five articles**

Expected: each article uses its exact matching OSS image URL, has at least one concrete example/checklist, states time-sensitive provider differences narrowly, and includes only sources used in the body.

### Task 5: Update the tree and publication history atomically

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: all 10 completed Markdown/image pairs.
- Produces: 158 published tree leaves, 142 coming-soon leaves, and 59 unique history records with 49 published plus 10 pending.

- [ ] **Step 1: Publish only the 10 selected tree leaves**

Change `contentStatus` from `coming-soon` to `published` for exactly the selected 10 keys. Preserve every key, label, filePath, order, and unrelated node byte-for-byte where practical.

- [ ] **Step 2: Promote the previous successful batch**

Change history status from `pending` to `published` for exactly:

```text
llm-long-context
llm-open-source-deployment
prompt-testing-debugging
prompt-role-boundaries
prompt-instruction-hierarchy
prompt-template-design
prompt-examples-selection
prompt-output-validation
prompt-context-compression
prompt-cache-design
```

- [ ] **Step 3: Append the new batch records**

Add one record per selected key with the exact tree label and `filePath: llm/dev`, `status: pending`, `action: created`, `recordedAt: 2026-07-15`, and `batch: ai-application-next-10-2026-07-15`.

Expected: no duplicate history key and `updatedAt` remains or becomes `2026-07-15`.

### Task 6: Run full local verification and review the scoped diff

**Files:**
- Verify: all files created or modified by Tasks 2–5.

**Interfaces:**
- Consumes: the complete unpublished branch.
- Produces: evidence sufficient to commit and open a PR.

- [ ] **Step 1: Run repository validation**

Run:

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  /Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm run validate:tree
```

Expected: validation passes with 142 expected missing-file warnings and the same two pre-existing orphan warnings.

- [ ] **Step 2: Run structural assertions**

Use Node to assert: 300 unique leaves; 158 published and 142 coming soon; 59 unique history keys; 49 published and 10 pending; exactly 10 new batch records; all 10 expected Markdown and image files exist; each body has one matching OSS WebP URL plus `## 参考资料`, no H1, and no unused final reference.

- [ ] **Step 3: Verify image bytes and content hygiene**

Use Pillow to decode all 10 WebP files and assert consistent 1672×941 dimensions. Search the 10 Markdown files for `IMAGE2_PENDING`, `/Users/`, `file://`, temporary generated-image paths, leaked credentials, and malformed references; expected result is no match.

- [ ] **Step 4: Review Git scope**

Run `git diff --check`, `git status --short`, `git diff --stat`, and inspect the tree/history diff. Expected scope: 10 Markdown files, 10 images, two JSON files, and the committed spec/plan only.

- [ ] **Step 5: Commit the content batch**

Stage only the intended files and commit:

```bash
git commit -m "docs: add AI application development guides"
```

### Task 7: Publish through GitHub and verify the remote result

**Files:**
- Publish: branch `content/ai-app-next-10`
- Target: `master`

**Interfaces:**
- Consumes: the verified local commits.
- Produces: merged PR, successful `sync-content` Action, and final progress evidence from remote `master`.

- [ ] **Step 1: Push and open a ready PR**

Push with upstream tracking. Create a PR titled `docs: add AI application development guides` whose body lists the 10 topics, image count, metadata transitions, and exact local checks.

- [ ] **Step 2: Inspect and merge the PR**

Verify base/head branches, changed-file scope, mergeability, and checks. Merge only when GitHub reports a clean merge and no required check is failing.

- [ ] **Step 3: Wait for the merge-SHA Action**

Watch the `sync-content` run triggered by the merge commit. Expected FaaS response:

```json
{"success":true,"data":{"manifests":1,"articles":10,"images":10,"deleted":0,"errors":[]}}
```

If the Action fails, inspect logs and stop; do not report publication complete or modify infrastructure without separate authorization.

- [ ] **Step 4: Recompute progress from remote `master`**

Fetch `origin/master` and assert the merged SHA, all 20 new article/image paths, 158/142 tree status counts, and 49/10 history status counts. Report created 10, updated 0, skipped 0, failed 0, pending images 0, plus PR and Action links.

Expected final line:

```text
整体进度：59/300（19.67%）
```
