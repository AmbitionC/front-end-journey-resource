# LLM Foundations Next 10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create, illustrate, validate, and publish the next 10 missing LLM foundation articles in directory order.

**Architecture:** Treat the resource repository as the only content source of truth. Research each topic from primary sources, create one body-only Markdown article and one teaching image per key, update tree/history metadata atomically, then publish through one branch, one PR, and the repository sync Action.

**Tech Stack:** GitHub-flavored Markdown, JSON manifests, Node.js validation, image2/gpt-image-2 educational diagrams, GitHub CLI and GitHub Actions.

## Global Constraints

- Scope is exactly the 10 keys listed in the approved design; do not change key, filePath, hierarchy, or ordering.
- Create one accepted WebP teaching image per article under `images/` and reference its final OSS URL.
- Use primary sources for technical claims and descriptive links near the supported claims.
- Keep all 10 articles, 10 images, tree changes, and history changes in one branch and PR.
- Promote the five already-synchronized historical pending records to published; add this batch as pending.
- Publication is complete only after merge to `master` and a successful `sync-content` Action.

---

### Task 1: Establish the research evidence map

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Reference: `docs/superpowers/specs/2026-07-14-llm-foundations-next-10-design.md`

**Interfaces:**
- Consumes: the exact 10 keys and article learning targets from the approved design.
- Produces: a claim/source outline for each article, used directly in article citations.

- [ ] **Step 1: Verify the manifest and history selection**

Run the bundled `knowledge-inventory.mjs` and assert that the first 10 unrecorded leaves match the approved list. Expected: all 10 have `exists: false`, no duplicate key, and paths under `knowledge/llm/basics/`.

- [ ] **Step 2: Research capability, modality, and tokenization**

Use primary sources: NIST GenAI Profile and model/system-card evidence for capability boundaries; original CLIP/Flamingo/Whisper or equivalent model papers for multimodality; SentencePiece and subword/BPE papers plus official tokenizer documentation for tokenization. Capture the mechanism, limitations, and version-sensitive claims needed by the first three articles.

- [ ] **Step 3: Research training, pretraining, and alignment**

Use original GPT/scaling-law/Chinchilla and current open-model technical reports for training and pretraining; InstructGPT, Constitutional AI, and official safety/model documentation for alignment. Separate pretraining objectives from post-training and safety evaluation.

- [ ] **Step 4: Research preference optimization, quantization, MoE, and reasoning**

Use InstructGPT, RLAIF/Constitutional AI, and DPO papers; GPTQ/AWQ and official quantization documentation; Switch Transformer/Mixtral/DeepSeekMoE reports; and current official reasoning-model documentation plus primary inference-time-scaling reports. Record disagreements and do not turn benchmark results into universal claims.

### Task 2: Generate and verify 10 teaching images

**Files:**
- Create: `images/llm-capability-boundaries-confidence-loop-v1.webp`
- Create: `images/llm-multimodal-basics-fusion-pipeline-v1.webp`
- Create: `images/llm-tokenizer-segmentation-pipeline-v1.webp`
- Create: `images/llm-training-overview-lifecycle-v1.webp`
- Create: `images/llm-pretraining-scaling-triangle-v1.webp`
- Create: `images/llm-alignment-post-training-stack-v1.webp`
- Create: `images/llm-rlhf-dpo-preference-paths-v1.webp`
- Create: `images/llm-quantization-memory-accuracy-v1.webp`
- Create: `images/llm-moe-routing-experts-v1.webp`
- Create: `images/llm-reasoning-models-budget-loop-v1.webp`

**Interfaces:**
- Consumes: one verified mechanism outline per topic from Task 1.
- Produces: 10 semantically checked project-local WebP assets with short English labels.

- [ ] **Step 1: Generate each diagram with image2**

Use the `scientific-educational`/`infographic-diagram` image prompt style: 16:9 landscape, clean vector-like shapes, restrained indigo/cyan/orange palette, high contrast, generous spacing, one mechanism, short exact English labels, no logos, no watermark, and no fabricated UI.

- [ ] **Step 2: Inspect every image**

Confirm required components, arrow direction, hierarchy, label spelling, and factual constraints. Regenerate only the image with a semantic failure.

- [ ] **Step 3: Save accepted assets under `images/`**

Copy accepted outputs to the exact filenames above, convert to WebP if necessary without enlarging, and confirm each file is non-empty and decodable.

### Task 3: Create the 10 body-only Markdown articles

**Files:**
- Create: `knowledge/llm/basics/llm-capability-boundaries.md`
- Create: `knowledge/llm/basics/llm-multimodal-basics.md`
- Create: `knowledge/llm/basics/llm-tokenizer.md`
- Create: `knowledge/llm/basics/llm-training-overview.md`
- Create: `knowledge/llm/basics/llm-pretraining.md`
- Create: `knowledge/llm/basics/llm-alignment.md`
- Create: `knowledge/llm/basics/llm-rlhf-dpo.md`
- Create: `knowledge/llm/basics/llm-quantization.md`
- Create: `knowledge/llm/basics/llm-moe.md`
- Create: `knowledge/llm/basics/llm-reasoning-models.md`

**Interfaces:**
- Consumes: verified evidence and the corresponding accepted image from Tasks 1–2.
- Produces: self-contained Chinese learning articles referenced by the existing tree leaves.

- [ ] **Step 1: Draft articles 1–3**

Explain capability/uncertainty, multimodal encoding/fusion, and tokenizer segmentation in dependency order. Include concrete examples, operational boundaries, the corresponding OSS image URL, and only sources used by each article.

- [ ] **Step 2: Draft articles 4–6**

Explain the end-to-end training lifecycle, pretraining objectives/data/scaling, and post-training alignment. Distinguish optimization objective, data source, evaluation, and safety controls.

- [ ] **Step 3: Draft articles 7–10**

Compare RLHF/RLAIF/DPO without collapsing their data and optimization differences; explain weight/activation quantization tradeoffs; explain sparse MoE routing and load balance; explain reasoning-model test-time compute, budgets, verification, and limitations.

- [ ] **Step 4: Run article-level checks**

Verify body-only format, at least one meaningful image with alt text, nearby citations, final `## 参考资料`, no duplicate boilerplate, no `IMAGE2_PENDING`, and no local absolute paths.

### Task 4: Update tree and history atomically

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: the 10 completed article keys and the existing 29 history records.
- Produces: 10 `contentStatus: published` leaves, five prior records promoted to published, and ten new pending records.

- [ ] **Step 1: Update the 10 leaf statuses**

Change only the selected leaves from `coming-soon` to `published`; preserve every other property and array position.

- [ ] **Step 2: Promote the five synchronized pending records**

For `rag-hybrid-search`, `rag-evaluation`, `agent-architecture`, `agent-first-demo`, and `agent-history`, change only `status` from `pending` to `published`.

- [ ] **Step 3: Append this batch's records**

Append one record per selected key with its exact label/filePath, `status: pending`, `action: created`, `recordedAt: 2026-07-14`, and `batch: llm-foundations-next-10-2026-07-14`. Update the history `updatedAt` to `2026-07-14`.

### Task 5: Validate content and scoped diff

**Files:**
- Test: `scripts/validate-tree.mjs`
- Test: all files modified by Tasks 2–4.

**Interfaces:**
- Consumes: the complete batch diff.
- Produces: evidence that the batch is structurally valid and publishable.

- [ ] **Step 1: Run repository validation**

Run: `node scripts/validate-tree.mjs`

Expected: exit 0, knowledge leaves remain 300, missing count decreases from 172 to 162, and the two pre-existing orphan warnings remain unchanged.

- [ ] **Step 2: Verify images and references**

Parse Markdown image URLs, map each OSS basename to `images/{basename}`, decode all 10 WebP assets, and assert no selected article lacks its expected asset.

- [ ] **Step 3: Verify metadata invariants**

Assert 300 unique leaves, exactly 138 `contentStatus: published`, exactly 162 `coming-soon`, 39 unique history keys, 29 published history records, 10 pending history records, and unchanged key/filePath/order for all leaves.

- [ ] **Step 4: Review the scoped diff**

Run `git diff --check`, inspect `git diff --stat`, scan for secrets/absolute paths/pending placeholders, and confirm no unrelated knowledge article changed.

### Task 6: Commit, publish, and verify production synchronization

**Files:**
- Commit: design, plan, 10 Markdown articles, 10 WebP images, `knowledge/_tree.json`, and `.codex/knowledge-update-history.json`.

**Interfaces:**
- Consumes: the validated batch.
- Produces: a merged PR and successful production `sync-content` Action.

- [ ] **Step 1: Commit the validated batch**

Commit content with an intentional message such as `content: add next 10 LLM foundation guides` after re-running validation on the exact staged tree.

- [ ] **Step 2: Push and open a draft PR**

Push `content/llm-foundations-next-10`, open a PR against `master`, summarize the 10 topics and validation evidence, and review the GitHub patch.

- [ ] **Step 3: Merge after checks are acceptable**

Merge the PR into `master`, then wait for the push-triggered `sync-content` Action.

- [ ] **Step 4: Verify publication and recompute progress**

Require Action conclusion `success` and FaaS response with `success: true` and `errors: []`. Read current `master` tree/history and report `整体进度：39/300（13.00%）`, with 29 recorded published and 10 merged pending records as the metadata breakdown.
