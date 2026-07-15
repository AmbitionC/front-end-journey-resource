# Long Context and Prompt Engineering Next 10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the next 10 directory-order FrontEnd Journey knowledge articles, each with one verified teaching image, through the resource repository PR and Action workflow.

**Architecture:** Treat `front-end-journey-resource` as the sole source of truth. Research and draft the two remaining LLM basics articles plus eight Prompt/context-engineering articles, then atomically update their Markdown, image assets, tree status, and history records in one branch; validate locally before merging and use the resource Action as publication authority.

**Tech Stack:** GitHub-flavored Markdown, JSON manifests, image2/imagegen, WebP, Node.js validation scripts, Git/GitHub CLI, GitHub Actions, OSS/FaaS content sync.

## Global Constraints

- Work only in `AmbitionC/front-end-journey-resource`; do not modify application, manager, FaaS, or investment repositories for routine publication.
- Keep all existing `key`, `filePath`, hierarchy, and ordering values unchanged.
- Use body-only Chinese Markdown with `##` sections and a final `## 参考资料`; do not add duplicate H1 titles.
- Use primary sources for technical claims and identify provider-specific, version-sensitive behavior explicitly.
- Create exactly one semantically useful WebP diagram per article under `images/`, with a unique `-v1.webp` filename and matching OSS URL.
- Promote the previous 10 successful pending records to `published`; add this batch as 10 unique `pending` records with batch `long-context-prompt-next-10-2026-07-15`.
- Do not publish any placeholder, local absolute path, temporary URL, credential, or incorrect diagram.
- Publish as branch → PR → merge into `master` → successful `sync-content` Action; do not perform a production browser smoke test after Action success.

---

### Task 1: Build the batch manifest and evidence map

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/long-context-prompt-next-10-evidence-map.md`

**Interfaces:**
- Consumes: latest `master` tree, existing article inventory, and history exclusion rule.
- Produces: a 10-row manifest and per-article claim/source map used by Tasks 2–4.

- [ ] **Step 1: Re-run the bundled inventory on the isolated worktree**

Run:

```bash
/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs \
  /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/fej-long-context-prompt-10
```

Expected: 300 knowledge leaves, 138 existing articles, 162 missing articles, zero duplicate keys, and the two known orphan warnings.

- [ ] **Step 2: Assert the deterministic selection**

Run a Node check that excludes all history records with `published` or `pending` status and asserts the first 10 eligible keys are exactly:

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

Expected: all 10 nodes have `contentStatus: coming-soon`, their expected Markdown files do not exist, and none has a history record.

- [ ] **Step 3: Research authoritative sources and record an evidence map**

The evidence map must record article key, learning outcome, consequential claims, source URL, confidence, and time sensitivity. At minimum evaluate these primary sources:

- Long context: RoPE (`arXiv:2104.09864`), Lost in the Middle (`arXiv:2307.03172`), LongBench (`arXiv:2308.14508`).
- Open-source deployment: current Hugging Face model-card and safetensors documentation, vLLM documentation, llama.cpp repository documentation, and each example model's license/model card.
- Prompt testing: current OpenAI evaluation best-practices documentation, Anthropic evaluation documentation, and applicable official SDK/testing docs.
- Role boundaries and hierarchy: current OpenAI Model Spec/API message docs, Anthropic system-prompt docs, and Instruction Hierarchy (`arXiv:2404.13208`).
- Templates: official Jinja template documentation plus official provider prompt-engineering guidance; distinguish template rendering from provider message semantics.
- Dynamic Few-Shot: Learning To Retrieve Prompts for In-Context Learning (NAACL 2022) and primary embedding/retrieval documentation used in the example.
- Output validation: JSON Schema 2020-12 specification and current official structured-output documentation; separate syntax validation from business-rule validation.
- Context compression: LLMLingua (`arXiv:2310.05736`) and LongLLMLingua (`arXiv:2310.06839`) plus long-context evaluation evidence.
- Prompt cache: current OpenAI, Anthropic, and Gemini caching documentation; record that cache keys, TTL, minimum sizes, billing, and explicit/automatic behavior are provider-specific and time-sensitive.

Expected: no claim depends only on a secondary blog, and every planned reference is actually used by its article.

### Task 2: Generate and verify 10 teaching images

**Files:**
- Create: `images/llm-long-context-effective-context-loop-v1.webp`
- Create: `images/llm-open-source-deployment-serving-stack-v1.webp`
- Create: `images/prompt-testing-debugging-eval-loop-v1.webp`
- Create: `images/prompt-role-boundaries-message-layers-v1.webp`
- Create: `images/prompt-instruction-hierarchy-conflict-resolution-v1.webp`
- Create: `images/prompt-template-design-render-pipeline-v1.webp`
- Create: `images/prompt-examples-selection-retrieval-ranking-v1.webp`
- Create: `images/prompt-output-validation-repair-loop-v1.webp`
- Create: `images/prompt-context-compression-budget-pipeline-v1.webp`
- Create: `images/prompt-cache-design-stable-prefix-v1.webp`

**Interfaces:**
- Consumes: the 10 illustration specifications in the design and evidence map.
- Produces: 10 accepted local WebP assets whose exact filenames are referenced by Task 3 and Task 4 Markdown.

- [ ] **Step 1: Generate one 16:9 educational diagram per article**

Use image2/imagegen with a shared visual system: clean vector-like shapes, restrained indigo/teal/amber palette, off-white background, strong contrast, generous spacing, short English labels, no logos, no decorative characters, no watermark, and no fabricated UI.

Each prompt must state the required reading direction and factual constraints. In particular, do not depict context length as guaranteed recall, user messages as overriding higher-authority instructions, schema validation as proving factual correctness, or cache hits as universal across providers.

- [ ] **Step 2: Inspect every generated image at original detail**

Check all components, arrows, hierarchy, label spelling, and semantic relationships. Regenerate any image with a misleading direction or unreadable label. Accept only one final image per key.

- [ ] **Step 3: Convert accepted bytes to WebP and validate decoding**

Use the bundled Python/Pillow runtime to save the accepted images under the exact filenames above. Assert all 10 files decode as WebP, have one consistent 16:9 output size, and are non-empty.

Expected: `images_verified=10`, no duplicate filename, no temporary generated asset included in Git.

### Task 3: Write the two remaining LLM basics articles

**Files:**
- Create: `knowledge/llm/basics/llm-long-context.md`
- Create: `knowledge/llm/basics/llm-open-source-deployment.md`

**Interfaces:**
- Consumes: Task 1 evidence and Task 2 image filenames.
- Produces: two self-contained body-only articles referenced by the existing LLM basics leaves.

- [ ] **Step 1: Draft `llm-long-context.md`**

Cover context window versus effective use, token position and RoPE intuition, attention/KV-cache cost, retrieval position bias and “lost in the middle,” context construction, evaluation across length/position, failure modes, and a practical checklist. Reference:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-long-context-effective-context-loop-v1.webp
```

- [ ] **Step 2: Draft `llm-open-source-deployment.md`**

Cover license/model-card review, architecture and tokenizer compatibility, safetensors/GGUF distinction, quantization, vLLM versus llama.cpp-style runtimes, weight/KV/activation memory budgeting, serving API, observability, security, benchmark methodology, and deployment acceptance. Reference:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-open-source-deployment-serving-stack-v1.webp
```

- [ ] **Step 3: Review the pair for overlap and source placement**

Expected: each article introduces one mental model, uses nearby citations for important claims, includes meaningful alt text and a caption, ends with only actually used references, and contains no H1.

### Task 4: Write the eight Prompt and context-engineering articles

**Files:**
- Create: `knowledge/llm/prompt/prompt-testing-debugging.md`
- Create: `knowledge/llm/prompt/prompt-role-boundaries.md`
- Create: `knowledge/llm/prompt/prompt-instruction-hierarchy.md`
- Create: `knowledge/llm/prompt/prompt-template-design.md`
- Create: `knowledge/llm/prompt/prompt-examples-selection.md`
- Create: `knowledge/llm/prompt/prompt-output-validation.md`
- Create: `knowledge/llm/prompt/prompt-context-compression.md`
- Create: `knowledge/llm/prompt/prompt-cache-design.md`

**Interfaces:**
- Consumes: Task 1 evidence, Task 2 image filenames, and the existing `prompt-basics`, `prompt-system`, `prompt-few-shot`, `prompt-structured-output`, `prompt-cot`, and `prompt-versioning` articles as prerequisites.
- Produces: eight non-duplicative articles that complete the current Prompt/context missing sequence.

- [ ] **Step 1: Write testing/debugging and role-boundary articles**

`prompt-testing-debugging.md` must cover datasets, deterministic checks, model graders with calibration, pairwise/regression comparison, failure taxonomy, trace capture, and CI gates. `prompt-role-boundaries.md` must distinguish system/developer/user/tool responsibilities, clarify that roles are provider interfaces rather than a universal wire standard, and explain where application authorization belongs.

- [ ] **Step 2: Write hierarchy and template articles**

`prompt-instruction-hierarchy.md` must explain authority, later-versus-earlier conflicts at the same level, untrusted quoted/retrieved content, conflict handling, and safe stopping. `prompt-template-design.md` must explain fixed versus variable regions, typed inputs, delimiters, escaping, rendering, versioning, injection boundaries, and rendered-prompt tests.

- [ ] **Step 3: Write example selection and output validation articles**

`prompt-examples-selection.md` must compare static, similarity-based, diversity-aware, and task/rule-filtered selection, including ordering and token budgets. `prompt-output-validation.md` must separate parsing, JSON Schema, domain rules, provenance, repair retry, and human review; emphasize that valid JSON is not necessarily true or authorized.

- [ ] **Step 4: Write compression and cache articles**

`prompt-context-compression.md` must distinguish deletion, extraction, summarization, and learned compression, with protected facts and evaluation. `prompt-cache-design.md` must explain stable-prefix ordering, dynamic suffixes, cache economics and invalidation while keeping current provider mechanics in a dated comparison rather than a universal rule.

- [ ] **Step 5: Cross-review all eight articles**

Expected: each article uses its exact matching OSS image URL, has at least one concrete example/checklist, does not duplicate an existing prerequisite article, and includes only sources used in the body.

### Task 5: Update the tree and publication history atomically

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: all 10 completed Markdown/image pairs.
- Produces: 148 published tree leaves, 152 coming-soon leaves, and 49 unique history records with 39 published plus 10 pending.

- [ ] **Step 1: Publish only the 10 selected tree leaves**

Change `contentStatus` from `coming-soon` to `published` for exactly the selected 10 keys. Preserve every key, label, filePath, order, and unrelated node byte-for-byte where practical.

- [ ] **Step 2: Promote the previous successful batch**

Change history status from `pending` to `published` for exactly:

```text
llm-capability-boundaries
llm-multimodal-basics
llm-tokenizer
llm-training-overview
llm-pretraining
llm-alignment
llm-rlhf-dpo
llm-quantization
llm-moe
llm-reasoning-models
```

- [ ] **Step 3: Append the new batch records**

Add one record per selected key with the exact tree label and filePath, `status: pending`, `action: created`, `recordedAt: 2026-07-15`, and `batch: long-context-prompt-next-10-2026-07-15`.

Expected: no duplicate history key and `updatedAt` is `2026-07-15`.

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

Expected: validation passes with 152 expected missing-file warnings and the same two pre-existing orphan warnings.

- [ ] **Step 2: Run structural assertions**

Use Node to assert: 300 unique leaves; 148 published and 152 coming soon; 49 unique history keys; 39 published and 10 pending; exactly 10 new batch records; all 10 expected Markdown and image files exist; and each body has one matching OSS WebP URL plus `## 参考资料` and no H1.

- [ ] **Step 3: Verify image bytes and content hygiene**

Use Pillow to decode all 10 WebP files and assert consistent dimensions. Search the 10 Markdown files for `IMAGE2_PENDING`, `/Users/`, `file://`, temporary image paths, leaked credentials, and malformed references; expected result is no match.

- [ ] **Step 4: Review Git scope**

Run `git diff --check`, `git status --short`, `git diff --stat`, and inspect the tree/history diff. Expected scope: 10 Markdown files, 10 images, two JSON files, and the committed spec/plan only.

- [ ] **Step 5: Commit the content batch**

Stage only the intended files and commit:

```bash
git commit -m "docs: add long context and prompt guides"
```

### Task 7: Publish through GitHub and verify the remote result

**Files:**
- Publish: branch `content/long-context-prompt-next-10`
- Target: `master`

**Interfaces:**
- Consumes: the verified local commits.
- Produces: merged PR, successful `sync-content` Action, and final progress evidence from remote `master`.

- [ ] **Step 1: Push and open a ready PR**

Push with upstream tracking. Create a PR titled `docs: add long context and prompt guides` whose body lists the 10 topics, image count, metadata transitions, and exact local checks.

- [ ] **Step 2: Inspect and merge the PR**

Verify base/head branches, changed-file scope, mergeability, and checks. Merge only when GitHub reports a clean merge and no required check is failing.

- [ ] **Step 3: Wait for the merge-SHA Action**

Watch the `sync-content` run triggered by the merge commit. Expected FaaS response:

```json
{"success":true,"data":{"manifests":1,"articles":10,"images":10,"deleted":0,"errors":[]}}
```

If the Action fails, inspect logs and stop; do not report publication complete or modify infrastructure without separate authorization.

- [ ] **Step 4: Recompute progress from remote `master`**

Fetch `origin/master` and assert the merged SHA, all 20 new article/image paths, 148/152 tree status counts, and 39/10 history status counts. Report created 10, updated 0, skipped 0, failed 0, pending images 0, plus PR and Action links.

Expected final line:

```text
整体进度：49/300（16.33%）
```
