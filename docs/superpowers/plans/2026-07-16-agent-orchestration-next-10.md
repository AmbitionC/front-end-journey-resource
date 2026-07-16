# Agent Orchestration Next 10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and publish the next 10 Agent orchestration knowledge guides with one verified light-background teaching diagram per guide.

**Architecture:** Treat `knowledge/_tree.json` and `.codex/knowledge-update-history.json` as the deterministic selection ledger. Research primary sources before drafting, generate one light sample image before the remaining assets, validate articles/images as two groups of five, then publish one ready PR and accept only the merge-SHA `sync-content` result.

**Tech Stack:** Chinese GitHub-flavored Markdown, JSON manifests, built-in imagegen/image2, Pillow, Node.js 22, npm, Git/GitHub CLI, GitHub Actions.

## Global Constraints

- Base is `origin/master` at `6ab72c91da0f0bac651b042d37a1b00996abb205`; branch is `content/agent-orchestration-next-10`.
- Create exactly the 10 keys in the design and no other articles.
- Article files are body-only Chinese Markdown under `knowledge/llm/agent/`, with no H1 and one final `## 参考资料` section.
- Every final reference must be an authoritative primary source and must also appear near the claim it supports.
- Generate exactly one teaching diagram per article, stored under `images/` and referenced through the stable OSS URL.
- Every image must be 1672×941 RGB WebP with a warm-white/light-gray full canvas; black, dark-navy, neon, and dark-gradient canvases are forbidden.
- Every image must have mean grayscale luminance ≥185, pixels below 45 ≤10%, pixels at or above 190 ≥60%, and four non-dark corners.
- Generate and accept `agent-human-in-loop-approval-gate-v1.webp` before generating the other nine images.
- Promote the previous 20 pending history records and append this batch as 10 pending records dated 2026-07-16.
- Do not modify infrastructure repositories or manually open the production site after successful synchronization.

---

### Task 1: Freeze inventory and evidence map

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-orchestration-next-10-evidence-map.md`

**Interfaces:**
- Consumes: remote baseline, tree order, history exclusion states.
- Produces: a 10-row manifest and claim/source map used by article drafting.

- [ ] **Step 1: Run the bundled inventory**

```bash
PATH=/Users/chenhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  node /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs \
  /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/fej-agent-orchestration-next-10
```

Expected: 300 leaves, 188 existing, 112 missing, zero duplicate keys, and the same two existing orphans.

- [ ] **Step 2: Assert the exact selection**

Flatten tree leaves in order, exclude history `published`/`pending`, and exclude paths already present. Expected keys, in order:

```text
agent-human-in-loop
agent-sandbox
agent-run-loop
agent-state-machine
agent-event-driven
agent-deterministic-workflow
agent-dynamic-workflow
agent-tool-selection
agent-tool-result-validation
agent-tool-timeout
```

- [ ] **Step 3: Research primary evidence**

Record a learning outcome, at least three key claims, primary URLs, confidence, and time sensitivity for every article. Start from:

```text
agent-human-in-loop: NIST AI RMF / Generative AI Profile; OpenAI Agents human-in-the-loop docs
agent-sandbox: Linux namespaces; seccomp; WASI capability/security docs
agent-run-loop: OpenAI Agents run lifecycle; ReAct paper
agent-state-machine: W3C SCXML; XState state machine concepts
agent-event-driven: CloudEvents specification; AsyncAPI or Temporal Signals
agent-deterministic-workflow: Temporal deterministic constraints; LangGraph workflows/agents
agent-dynamic-workflow: JSON Schema; OpenAI Agents orchestration; DAG validation sources
agent-tool-selection: MCP Tools; OpenAI function calling/tool search docs
agent-tool-result-validation: JSON Schema; MCP tool results; OWASP agent/tool output guidance
agent-tool-timeout: WHATWG AbortController; RFC 9110 idempotent methods; AWS retry/backoff guidance
```

Use current official docs dated 2026-07-16 where behavior can change. Replace inaccessible or obsolete starting URLs with current primary pages; do not substitute unsupported secondary claims.

- [ ] **Step 4: Verify the evidence map**

Assert 10 unique keys, each with learning outcome, claims, sources, confidence, and time boundary. Stop on missing evidence or topic overlap that changes article scope.

### Task 2: Generate and approve the light-background sample

**Files:**
- Create: `images/agent-human-in-loop-approval-gate-v1.webp`
- Keep source outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-orchestration-next-10-image-sources/`

**Interfaces:**
- Consumes: illustration specification in the design.
- Produces: the accepted light visual template for the remaining nine images.

- [ ] **Step 1: Generate only the sample**

Use one built-in imagegen request. The prompt must start with these explicit constraints:

```text
LIGHT THEME ONLY. Full-bleed warm-white or very light gray background. Dark navy text and thin outlines. Restrained blue, teal, amber, violet, and green accents. No black canvas, no dark navy canvas, no dark gradient, no neon glow, no nighttime or terminal aesthetic.
```

Then describe the exact approve/reject/expire/takeover flow, short English labels, 16:9 left-to-right reading, generous whitespace, no brands, no decorative characters, no watermark, and no extra text.

- [ ] **Step 2: Inspect semantic correctness**

Require the risky action and immutable approval snapshot before the decision; approve may execute only within validity, reject stops, expire requires renewal, and takeover transfers control to a human. Regenerate if any arrow or ownership boundary is wrong.

- [ ] **Step 3: Convert and run the luminance gate**

Convert the accepted source to 1672×941 RGB WebP quality 90. With Pillow, assert:

```python
assert image.mode == "RGB"
assert image.size == (1672, 941)
assert mean_luminance >= 185
assert dark_pixel_ratio <= 0.10
assert light_pixel_ratio >= 0.60
assert all(corner_luminance >= 150 for corner_luminance in corners)
```

- [ ] **Step 4: Freeze the visual template**

Record the accepted prompt prefix, palette, spacing, line weight, and quantitative output values in the outside-repository image source folder. Do not generate the remaining images until this step passes.

### Task 3: Generate the remaining nine images

**Files:**
- Create: `images/agent-sandbox-capability-boundary-v1.webp`
- Create: `images/agent-run-loop-turn-state-v1.webp`
- Create: `images/agent-state-machine-transition-guards-v1.webp`
- Create: `images/agent-event-driven-async-correlation-v1.webp`
- Create: `images/agent-deterministic-workflow-agent-boundary-v1.webp`
- Create: `images/agent-dynamic-workflow-plan-validation-v1.webp`
- Create: `images/agent-tool-selection-progressive-discovery-v1.webp`
- Create: `images/agent-tool-result-validation-trust-boundary-v1.webp`
- Create: `images/agent-tool-timeout-deadline-retry-v1.webp`

**Interfaces:**
- Consumes: accepted light template and exact diagram semantics from the design.
- Produces: nine final local assets ready for Markdown references.

- [ ] **Step 1: Generate one asset per prompt**

Reuse the exact light-theme prefix from Task 2, then add only the diagram-specific mechanism. One imagegen call produces one image; do not create a contact sheet or reuse one source for multiple files.

- [ ] **Step 2: Inspect every diagram**

Check required components, arrows, hierarchy, labels, and prohibited relationships. In particular: sandbox permission precedes execution; dynamic plans never execute before validation; unauthorized tools never reach model candidates; timeout/cancel never implies confirmed remote rollback.

- [ ] **Step 3: Convert every accepted source**

Use Pillow to resize/crop without distortion to 1672×941, convert to RGB, and save WebP quality 90. Keep generated source files outside the repository.

- [ ] **Step 4: Run the light-image gate for all 10**

Decode all 10 final WebPs and apply the exact luminance/corner assertions from Task 2. Regenerate only failing images; do not lower thresholds to make a dark result pass.

### Task 4: Draft article group A

**Files:**
- Create: `knowledge/llm/agent/agent-human-in-loop.md`
- Create: `knowledge/llm/agent/agent-sandbox.md`
- Create: `knowledge/llm/agent/agent-run-loop.md`
- Create: `knowledge/llm/agent/agent-state-machine.md`
- Create: `knowledge/llm/agent/agent-event-driven.md`

**Interfaces:**
- Consumes: evidence map and first five accepted images.
- Produces: five progressive, sourced body-only articles.

- [ ] **Step 1: Draft the five articles**

Each article must include a concise opening, dependency-first `##` sections, one practical model/example, explicit failure modes, tests/observability, summary, and one final references section. Use no H1 and no front matter.

- [ ] **Step 2: Insert one matching OSS image reference per article**

Use:

```text
https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/{exact-filename}
```

Place it immediately after the paragraph that creates the visual need, with precise Chinese alt text and a one-sentence caption.

- [ ] **Step 3: Run group A article gate**

For each article assert: expected path, byte length greater than 4500, no H1, exactly one matching image URL, exactly one `## 参考资料`, balanced fences, useful alt text, no local paths/placeholders/credentials, and every final reference URL appears in the body.

- [ ] **Step 4: Review topic boundaries**

Confirm the five articles do not duplicate `agent-tool-design`, `agent-workflow-state`, or one another. Fix all group failures before starting group B.

### Task 5: Draft article group B

**Files:**
- Create: `knowledge/llm/agent/agent-deterministic-workflow.md`
- Create: `knowledge/llm/agent/agent-dynamic-workflow.md`
- Create: `knowledge/llm/agent/agent-tool-selection.md`
- Create: `knowledge/llm/agent/agent-tool-result-validation.md`
- Create: `knowledge/llm/agent/agent-tool-timeout.md`

**Interfaces:**
- Consumes: evidence map, last five accepted images, and group A terminology.
- Produces: the remaining five progressive articles.

- [ ] **Step 1: Draft the five articles**

Use the same body-only and evidence rules as group A. Explicitly separate deterministic skeleton from bounded model choice, candidate plan from executable plan, tool discovery from authorization, structural output from trusted result, and local timeout from remote operation state.

- [ ] **Step 2: Insert one matching OSS image reference per article**

Use the exact final filename and meaningful Chinese alt/caption. Do not reuse an image from another article.

- [ ] **Step 3: Run group B article gate**

Run the same complete assertions as group A for all five articles. Stop on any unused final reference, malformed code fence, wrong image, or local residue.

- [ ] **Step 4: Run the combined 10-article gate**

Repeat the assertions across all 10 articles together and confirm 10 unique article keys, 10 unique image filenames, and no duplicated reference list copied across unrelated topics.

### Task 6: Update tree and history ledgers

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

**Interfaces:**
- Consumes: validated 10-article batch.
- Produces: exact publication manifest and resumable history state.

- [ ] **Step 1: Publish the 10 tree leaves**

Change only `contentStatus` from `coming-soon` to `published` for the 10 selected keys. Preserve labels, paths, order, and all unknown fields.

- [ ] **Step 2: Promote the previous 20 records**

Change `status` from `pending` to `published` for exactly the records whose batch is `rag-production-agent-next-20-2026-07-15`.

- [ ] **Step 3: Append the new 10 records**

Use exact tree label/filePath and:

```json
{
  "status": "pending",
  "action": "created",
  "recordedAt": "2026-07-16",
  "batch": "agent-orchestration-next-10-2026-07-16"
}
```

- [ ] **Step 4: Assert ledger totals**

Expected: tree 300 unique leaves, 198 published/102 coming-soon; history 99 unique keys, 89 published/10 pending; new pending order exactly matches the selected 10.

### Task 7: Full verification and commit

**Files:**
- Verify: all files changed by Tasks 2–6.

**Interfaces:**
- Consumes: complete local batch.
- Produces: fresh evidence and one content commit.

- [ ] **Step 1: Run repository validation**

```bash
PATH=/Users/chenhao/.nvm/versions/node/v22.22.3/bin:$PATH npm run validate:tree
```

Expected: pass with 102 missing-file warnings and the same two existing orphan warnings.

- [ ] **Step 2: Run content, image, source, and JSON assertions**

Re-run all 10 article checks, decode all 10 WebPs, enforce all luminance thresholds, verify final reference URLs have no hard 404/5xx failure, and assert exact tree/history states and prior promotions.

- [ ] **Step 3: Review scoped diff**

Run `git diff --check`, `git status --short`, `git diff --stat origin/master`, and semantic JSON comparison. Expected final scope after the two documentation commits: 24 files—design, plan, 10 Markdown, 10 WebP, and two JSON files.

- [ ] **Step 4: Commit content**

Stage only intended content/assets/JSON files and commit:

```bash
git commit -m "docs: add agent orchestration guides"
```

### Task 8: Publish, merge, and verify synchronization

**Files:**
- Publish branch: `content/agent-orchestration-next-10`
- Target branch: `master`

**Interfaces:**
- Consumes: verified three-commit branch.
- Produces: merged PR, successful merge-SHA Action, and remote state proof.

- [ ] **Step 1: Push and create a ready PR**

Confirm current remote master remains an ancestor, three commits, and 24-file scope. Push with upstream and create a non-draft PR titled `docs: add agent orchestration guides`.

- [ ] **Step 2: Inspect and merge**

Require base `master`, correct head, 24 files, three commits, clean mergeability, and no failing required check. Merge with a merge commit.

- [ ] **Step 3: Wait for merge-SHA `sync-content`**

Lock to the merge commit and require workflow success, HTTP 200, and exact body:

```json
{"success":true,"data":{"manifests":1,"articles":10,"images":10,"deleted":0,"errors":[]}}
```

- [ ] **Step 4: Recompute from remote master**

Fetch remote master and assert merge SHA, all 20 article/image resource paths, tree 198/102, history 89/10, and batch count 10. Report created 10, updated 0, skipped 0, failed 0, pending images 0, with PR and Action URLs.

Expected final line:

```text
整体进度：99/300（33.00%）
```
