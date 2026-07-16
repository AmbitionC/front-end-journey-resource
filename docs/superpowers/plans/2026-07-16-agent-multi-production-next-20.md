# Agent Multi-Agent and Production Next 20 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the next 20 multi-agent, memory, interaction, and production knowledge guides with one verified light-background teaching diagram per guide.

**Architecture:** Use the tree and update history as a deterministic selection ledger, establish a primary-source evidence map before drafting, and treat model-generated images and prose as untrusted until semantic and quantitative gates pass. Process articles as two groups of 10, then make one atomic metadata/content PR and accept only the merge-SHA synchronization result.

**Tech Stack:** Chinese GitHub-flavored Markdown, JSON manifests, built-in imagegen/image2, Pillow, Node.js 22, npm, Git, GitHub CLI, GitHub Actions.

## Global Constraints

- Base is `origin/master` at `6631d5c5a64c73e6bf90e37e64167fa8e7da0763`; branch is `content/agent-multi-production-next-20`.
- Create exactly the 20 keys listed in the design and no other articles.
- Article files are body-only Chinese Markdown with no H1, larger than 4500 bytes, one final `## 参考资料`, and one unique matching OSS image URL.
- Every final reference is a reachable authoritative primary source and appears near the claim it supports.
- Every image is 1672×941 RGB WebP with a warm-white/light-gray full canvas; dark canvas, dark gradient, neon, terminal, and cyberpunk styles are forbidden.
- Image gates are mean luminance ≥185, pixels below 45 ≤10%, pixels at or above 190 ≥60%, and four corner luminance values ≥150.
- Promote the previous 10 pending records and append 20 pending records dated 2026-07-16.
- Do not modify infrastructure repositories or manually open the production site after successful synchronization.

---

### Task 1: Freeze inventory and manifest

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-multi-production-next-20-manifest.json`

**Interfaces:**
- Consumes: remote baseline, ordered tree leaves, history exclusion states, filesystem existence.
- Produces: a 20-row manifest with `key`, `label`, `filePath`, `articlePath`, `image`, `action`, and `reason`.

- [ ] **Step 1: Run inventory**

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
node /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs .
```

Expected: 300 leaves, 198 existing, 102 missing, zero duplicate keys, and the same two existing orphans.

- [ ] **Step 2: Assert selection**

Flatten leaves in order, exclude history `published` and `pending`, and require the article to be absent. Expected first 20 keys:

```text
agent-parallel-tools
agent-subagents
agent-supervisor
agent-delegation
agent-multi-agent-messaging
agent-memory-architecture
agent-memory-summarization
agent-memory-forgetting
agent-browser-use
agent-computer-use
agent-coding
agent-voice
agent-guardrails
agent-permission-model
agent-failure-recovery
agent-idempotency
agent-data-privacy
agent-security-threat-model
agent-deployment
agent-feedback-loop
```

- [ ] **Step 3: Record exact image mapping**

Copy the 20 image names from the design into the manifest in the same order. Assert 20 unique keys, article paths, and image names.

- [ ] **Step 4: Verify a clean branch scope**

```bash
git status --short
git rev-parse HEAD
```

Expected: only the already committed design/plan history and HEAD descended from the stated base.

### Task 2: Build the evidence map

**Files:**
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-multi-production-next-20-evidence-map.md`

**Interfaces:**
- Consumes: the 20-row manifest and current official specifications/documentation.
- Produces: one learning outcome, at least three claims, primary sources, confidence, and time boundary per key.

- [ ] **Step 1: Research multi-agent and memory topics**

Use primary sources such as OpenAI Agents SDK orchestration/handoffs/tools, MCP, W3C or IETF messaging concepts where relevant, LangGraph multi-agent/memory docs, and original memory/summarization research. Keep framework-specific facts dated 2026-07-16.

- [ ] **Step 2: Research interaction agents**

Use current official browser/computer-use documentation, accessibility/browser standards, repository/Git documentation, and realtime audio/voice specifications. Separate DOM/browser control from pixel/input control and keep safety boundaries explicit.

- [ ] **Step 3: Research production controls**

Use NIST AI RMF/GenAI profile, OWASP Agentic AI guidance, authorization/privacy standards, RFC 9110/idempotency sources, OpenTelemetry, Kubernetes deployment docs, and official evaluation guidance as applicable. Do not reuse a source where it does not directly support the topic.

- [ ] **Step 4: Gate the evidence map**

Assert 20 headings, 20 learning outcomes, at least 60 claims, no empty source list, and explicit time boundaries. Every planned final URL must return a non-404/non-5xx response before drafting.

### Task 3: Generate and validate images 1–10

**Files:**
- Create: `images/agent-parallel-tools-dependency-dag-v1.webp`
- Create: `images/agent-subagents-contract-lifecycle-v1.webp`
- Create: `images/agent-supervisor-control-loop-v1.webp`
- Create: `images/agent-delegation-responsibility-merge-v1.webp`
- Create: `images/agent-multi-agent-messaging-protocol-state-v1.webp`
- Create: `images/agent-memory-architecture-tiered-memory-v1.webp`
- Create: `images/agent-memory-summarization-evidence-compression-v1.webp`
- Create: `images/agent-memory-forgetting-conflict-update-v1.webp`
- Create: `images/agent-browser-use-observe-act-verify-v1.webp`
- Create: `images/agent-computer-use-perception-action-safety-v1.webp`

**Interfaces:**
- Consumes: illustration specifications derived from the evidence map and the light visual contract.
- Produces: 10 accepted image sources outside the repository and 10 final WebPs.

- [ ] **Step 1: Generate one image per request**

Begin every prompt with the exact light-theme requirements from the design, describe one mechanism, use short English labels, and forbid misleading arrows. Preserve every generated source outside the repository.

- [ ] **Step 2: Inspect semantics**

Require: parallel work follows a dependency DAG and bounded join; subagents have task/context/output contracts; supervisor cannot bypass worker permissions; delegation preserves ownership; messaging uses correlation/version/deduplication; memory distinguishes write/retrieve/consolidate; browser and computer actions pass safety and post-action verification.

- [ ] **Step 3: Convert accepted sources**

```python
image = Image.open(source).convert("RGB")
assert image.size == (1672, 941)
image.save(target, "WEBP", quality=90, method=6)
```

- [ ] **Step 4: Run image gates**

Decode all 10 and assert dimensions, RGB, mean/dark/light/corner thresholds. Regenerate any semantic or quantitative failure; do not relax thresholds.

### Task 4: Draft and validate articles 1–10

**Files:**
- Create: `knowledge/llm/agent/agent-parallel-tools.md`
- Create: `knowledge/llm/agent/agent-subagents.md`
- Create: `knowledge/llm/agent/agent-supervisor.md`
- Create: `knowledge/llm/agent/agent-delegation.md`
- Create: `knowledge/llm/agent/agent-multi-agent-messaging.md`
- Create: `knowledge/llm/agent/agent-memory-architecture.md`
- Create: `knowledge/llm/agent/agent-memory-summarization.md`
- Create: `knowledge/llm/agent/agent-memory-forgetting.md`
- Create: `knowledge/llm/agent/agent-browser-use.md`
- Create: `knowledge/llm/agent/agent-computer-use.md`

**Interfaces:**
- Consumes: first 10 evidence records and accepted images.
- Produces: 10 body-only, sourced, progressive articles.

- [ ] **Step 1: Draft each article**

Use a concise mental model, dependency-first sections, one concrete contract/example, failure modes, tests/observability, recap, and final references. Explain neighboring-topic boundaries rather than copying sections.

- [ ] **Step 2: Insert exact OSS references**

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/{exact-image-filename}
```

Place one image immediately after the paragraph that creates the visual need, with meaningful Chinese alt text and a short caption.

- [ ] **Step 3: Run article gates**

For every file assert bytes >4500, no H1/front matter/local path/placeholder, exactly one image URL, exactly one `## 参考资料`, balanced fences, and every final source URL present in the body.

- [ ] **Step 4: Review group boundaries**

Confirm the five multi-agent articles and three memory articles do not duplicate one another, and browser-use does not collapse into computer-use.

### Task 5: Generate and validate images 11–20

**Files:**
- Create: `images/agent-coding-repo-loop-v1.webp`
- Create: `images/agent-voice-realtime-turn-taking-v1.webp`
- Create: `images/agent-guardrails-layered-controls-v1.webp`
- Create: `images/agent-permission-model-capability-approval-v1.webp`
- Create: `images/agent-failure-recovery-error-taxonomy-v1.webp`
- Create: `images/agent-idempotency-operation-ledger-v1.webp`
- Create: `images/agent-data-privacy-data-lifecycle-v1.webp`
- Create: `images/agent-security-threat-model-trust-boundaries-v1.webp`
- Create: `images/agent-deployment-versioned-rollout-v1.webp`
- Create: `images/agent-feedback-loop-eval-flywheel-v1.webp`

**Interfaces:**
- Consumes: last 10 evidence records and the accepted light visual contract.
- Produces: 10 accepted image sources outside the repository and 10 final WebPs.

- [ ] **Step 1: Generate and inspect one image at a time**

Require: coding loop starts from repository state and ends in tests/diff review; voice distinguishes audio transport, turn detection, model/tool work, interruption and fallback; guardrails remain layered; authorization precedes side effects; retry and idempotency do not imply rollback; privacy covers collection-to-deletion; threat model shows trust boundaries; rollout has canary/rollback; feedback requires evaluated evidence before promotion.

- [ ] **Step 2: Convert to exact final assets**

Use Pillow RGB WebP quality 90 and keep the source PNG outside the repository.

- [ ] **Step 3: Apply semantic and light-image gates**

Run the same exact assertions as Task 3 across images 11–20, then across all 20 together.

### Task 6: Draft and validate articles 11–20

**Files:**
- Create: `knowledge/llm/agent/agent-coding.md`
- Create: `knowledge/llm/agent/agent-voice.md`
- Create: `knowledge/llm/production/agent-guardrails.md`
- Create: `knowledge/llm/production/agent-permission-model.md`
- Create: `knowledge/llm/production/agent-failure-recovery.md`
- Create: `knowledge/llm/production/agent-idempotency.md`
- Create: `knowledge/llm/production/agent-data-privacy.md`
- Create: `knowledge/llm/production/agent-security-threat-model.md`
- Create: `knowledge/llm/production/agent-deployment.md`
- Create: `knowledge/llm/production/agent-feedback-loop.md`

**Interfaces:**
- Consumes: last 10 evidence records and accepted images.
- Produces: 10 body-only, sourced, progressive articles.

- [ ] **Step 1: Draft the articles**

Use the same structure and citation contract as Task 4. Mark current provider/framework behavior by date and keep authorization, validation, cancellation, compensation, privacy, and rollout claims distinct.

- [ ] **Step 2: Insert matching OSS images**

Use one unique exact filename per article; no image reuse across topics.

- [ ] **Step 3: Run group and combined article gates**

Apply all Task 4 assertions to group B and then all 20. Confirm 20 unique keys, image names, and article paths.

### Task 7: Update ledgers and verify the repository

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: the 20 validated article/image pairs.
- Produces: published tree states and resumable history state.

- [ ] **Step 1: Publish selected tree leaves**

Change only `contentStatus` from `coming-soon` to `published` for the exact 20 keys. Preserve labels, paths, ordering, and unknown fields.

- [ ] **Step 2: Promote the previous batch**

Change exactly 10 records with batch `agent-orchestration-next-10-2026-07-16` from `pending` to `published`.

- [ ] **Step 3: Append the new batch**

Append exact label/path records with:

```json
{
  "status": "pending",
  "action": "created",
  "recordedAt": "2026-07-16",
  "batch": "agent-multi-production-next-20-2026-07-16"
}
```

- [ ] **Step 4: Assert totals**

Expected tree: 300 unique, 218 published, 82 coming-soon. Expected history: 119 unique, 99 published, 20 pending. New pending order must match the manifest.

- [ ] **Step 5: Run full verification**

```bash
PATH=/Users/chenhao/.nvm/versions/node/v22.22.3/bin:$PATH npm run validate:tree
git diff --check
```

Expected: validation passes with 82 missing warnings and the same two pre-existing orphans. Re-run article, image, URL, ledger, secret/local-path, and exact-scope gates. Expected total branch scope: 44 files and three commits.

- [ ] **Step 6: Commit content**

```bash
git add .codex/knowledge-update-history.json knowledge/_tree.json knowledge/llm/agent knowledge/llm/production images
git commit -m "docs: add multi-agent production guides"
```

Stage only the exact 42 content/ledger files; the design and plan are already committed separately.

### Task 8: Publish and accept synchronization

**Files:**
- Read: `.github/workflows/sync.yml`

**Interfaces:**
- Consumes: clean three-commit branch with 44 expected files.
- Produces: merged PR and successful content synchronization for the merge SHA.

- [ ] **Step 1: Push and create ready PR**

```bash
git push -u origin content/agent-multi-production-next-20
gh pr create --base master --head content/agent-multi-production-next-20 --title "docs: add multi-agent production guides"
```

- [ ] **Step 2: Verify PR scope**

Require ready state, base `master`, 3 commits, 44 files, clean/mergeable status, and no unexpected checks or review blockers.

- [ ] **Step 3: Merge with a merge commit**

```bash
gh pr merge --merge
```

Record the exact merge SHA.

- [ ] **Step 4: Accept the merge-SHA Action only**

Wait for `sync-content` with `headSha` equal to the merge SHA. Require conclusion `success`, HTTP 200, and exact response:

```json
{"success":true,"data":{"manifests":1,"articles":20,"images":20,"deleted":0,"errors":[]}}
```

- [ ] **Step 5: Reassert remote state**

Fetch `origin/master`, assert it equals the merge SHA, parse remote ledgers to confirm 218/82 and 99/20 totals, and report created 20, updated 0, skipped 0, failed 0, pending-image 0. Compute overall progress from merged history as 119/300.
