# Complete Knowledge Next 50 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Create all 42 remaining missing articles, substantially update 8 deterministically audited weak articles, add 50 verified teaching images, and publish the batch through the resource Action.

**Architecture:** Work in five ten-article groups. Each group consumes a shared external manifest and evidence map, produces body-only Markdown plus one unique light-theme WebP per article, passes group gates, and receives its own commit. A final task updates the tree and unique history ledger, runs full validation, and publishes through a ready pull request.

**Tech Stack:** Markdown, JSON, Node.js 22 validation scripts, built-in image generation, Pillow for deterministic RGB WebP conversion, Git, GitHub CLI, GitHub Actions.

## Global Constraints

- Repository scope is only AmbitionC/front-end-journey-resource.
- Base is origin/master at bdc35add48d44abf3afe6192fa7d9506466b7f8f.
- Scope is exactly 42 creates plus 8 updates from the approved design.
- Do not add, remove, reorder, or rename tree nodes.
- Use one bright teaching image per article, 1672 by 941 RGB WebP.
- Use official or primary sources and freshly verify every final reference URL.
- Keep Markdown body-only and end with exactly one reference section.
- Validate every group before starting the next.
- Promote the previous 20 merged-pending records and append 50 unique pending records.
- Publication completes only after the exact merge-SHA sync-content Action returns one manifest, 50 articles, 50 images, 0 deletions, and no errors.

---

### Task 1: Freeze manifest, evidence, and illustration specifications

**Files:**

- Create externally: /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/complete-knowledge-next-50-manifest.json
- Create externally: /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/complete-knowledge-next-50-evidence-map.md
- Create externally: /Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/complete-knowledge-next-50-image-specs.md

**Interfaces:**

- Consumes: knowledge/_tree.json, .codex/knowledge-update-history.json, and the selection rule in the design.
- Produces: ordered records with key, label, filePath, articlePath, action, image filename, reason, learning outcome, sources, and image semantics.

- [ ] **Step 1: Generate the inventory and assert the baseline**

Run:

    node /Users/chenhao/.codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs .

Expected: 300 leaves, 258 existing, 42 missing, 0 duplicate keys, and the same 2 known orphans.

- [ ] **Step 2: Write the exact 50-record manifest**

Use the 42 missing leaves in tree order, followed by the 8 audited update keys in the design. Assign one unique readable WebP filename per record. Assert 50 unique keys, article paths, and image names with no existing image collision.

- [ ] **Step 3: Research each learning target**

Record a one-sentence learning outcome, two to four important claims, official or primary URLs, confidence, and time sensitivity. For evolving projects, record the version or research cutoff.

- [ ] **Step 4: Write one image specification per record**

Each specification states teaching purpose, visible elements and relationships, reading direction, exact essential labels, light-theme invariants, alt text, and factual relationships that must not be violated.

- [ ] **Step 5: Verify the external artifacts**

Expected: 50 manifest records, 50 learning outcomes, at least 100 supported claims, 50 image specifications, no duplicate key/path/image, and every source URL reachable.

### Task 2: Implement batch 1 — storage, operations, and data processing

**Files:**

- Create: knowledge/backend/storage/postgresql-transaction.md
- Create: knowledge/backend/storage/database-migration.md
- Create: knowledge/backend/storage/object-storage.md
- Create: knowledge/backend/storage/event-store.md
- Create: knowledge/backend/ops/secrets-config.md
- Create: knowledge/backend/ops/health-check.md
- Create: knowledge/backend/ops/backup-restore.md
- Create: knowledge/data/processing/data-schema-evolution.md
- Create: knowledge/data/processing/data-deduplication.md
- Create: knowledge/data/processing/data-sampling.md
- Create: ten matching images under images/

**Interfaces:**

- Consumes: manifest records 1–10, evidence map, and image specifications.
- Produces: ten valid body-only articles and ten accepted WebPs.

- [ ] **Step 1: Generate and inspect images 1–10**

Generate in small parallel sets. Correct misleading arrows or labels. Convert accepted sources to exact RGB WebP assets and run the light-canvas gates.

- [ ] **Step 2: Draft articles 1–10**

Use dependency-first explanations, concrete examples, failure modes, source links near claims, one accepted OSS image URL, and one final reference section.

- [ ] **Step 3: Run batch gates**

Assert all ten files exist, each has exactly one expected image, one final reference section, balanced fences, no placeholder/local path/secret, used references only, and adequate teaching depth.

- [ ] **Step 4: Commit batch 1**

Run:

    git add knowledge/backend/storage knowledge/backend/ops knowledge/data/processing images
    git commit -m "docs: add storage operations data guides"

Expected: only records 1–10 and their images are new.

### Task 3: Implement batch 2 — data systems and algorithm foundations

**Files:**

- Create: knowledge/data/storage/vector-database-internals.md
- Create: knowledge/data/pipeline/batch-stream-processing.md
- Create: knowledge/data/pipeline/data-orchestration.md
- Create: knowledge/data/pipeline/data-lineage.md
- Create: knowledge/data/pipeline/data-observability.md
- Create: knowledge/data/pipeline/data-contracts.md
- Create: knowledge/data/analysis/experiment-analysis.md
- Create: knowledge/data/analysis/feature-store.md
- Create: knowledge/cs/algorithm/algorithm-complexity.md
- Create: knowledge/cs/algorithm/algorithm-stack-queue.md
- Create: ten matching images under images/

**Interfaces:**

- Consumes: manifest records 11–20, evidence map, and image specifications.
- Produces: ten valid articles and ten accepted WebPs.

- [ ] **Step 1: Generate and inspect images 11–20**

Keep index, time, lineage, DAG, experiment, and data-flow relationships semantically exact. Convert and run all image gates.

- [ ] **Step 2: Draft articles 11–20**

Explain event-time versus processing-time, offline versus online state, statistical assumptions, and complexity boundaries explicitly rather than as slogans.

- [ ] **Step 3: Run batch gates**

Use the same article, image, citation, fence, placeholder, and path assertions as batch 1.

- [ ] **Step 4: Commit batch 2**

Run:

    git add knowledge/data/storage knowledge/data/pipeline knowledge/data/analysis knowledge/cs/algorithm images
    git commit -m "docs: add data systems algorithm guides"

Expected: records 11–20 and their images are added.

### Task 4: Implement batch 3 — algorithms and web engineering

**Files:**

- Create: knowledge/cs/algorithm/algorithm-heap.md
- Create: knowledge/cs/algorithm/algorithm-linked-list.md
- Create: knowledge/cs/algorithm/algorithm-trie.md
- Create: knowledge/cs/algorithm/algorithm-sorting.md
- Create: knowledge/cs/algorithm/algorithm-graph.md
- Create: knowledge/cs/algorithm/algorithm-backtracking.md
- Create: knowledge/cs/algorithm/linear-algebra-ai.md
- Create: knowledge/cs/algorithm/probability-statistics-ai.md
- Create: knowledge/frontend/web/web-semantic-accessibility.md
- Create: knowledge/frontend/engineering/vite-testing.md
- Create: ten matching images under images/

**Interfaces:**

- Consumes: manifest records 21–30, evidence map, and image specifications.
- Produces: ten valid articles and ten accepted WebPs.

- [ ] **Step 1: Generate and inspect images 21–30**

Verify heap ordering, linked-list rewiring, trie traversal, stable sorting, graph direction, backtracking pruning, matrix dimensions, probability labels, accessibility tree, and build/test stages.

- [ ] **Step 2: Draft articles 21–30**

Use small worked examples and explicit invariants. Distinguish mathematical definitions, algorithmic complexity, browser semantics, and tool-version behavior.

- [ ] **Step 3: Run batch gates**

Use the same group assertions and freshly check every final reference.

- [ ] **Step 4: Commit batch 3**

Run:

    git add knowledge/cs/algorithm knowledge/frontend/web knowledge/frontend/engineering images
    git commit -m "docs: add algorithm web engineering guides"

Expected: records 21–30 and their images are added.

### Task 5: Implement batch 4 — Agent product UI and project delivery

**Files:**

- Create: knowledge/frontend/agent-ui/agent-chat-ui.md
- Create: knowledge/frontend/agent-ui/agent-streaming-ui.md
- Create: knowledge/frontend/agent-ui/agent-markdown-code-ui.md
- Create: knowledge/frontend/agent-ui/agent-citation-ui.md
- Create: knowledge/frontend/agent-ui/agent-tool-approval-ui.md
- Create: knowledge/frontend/agent-ui/agent-error-retry-ui.md
- Create: knowledge/frontend/agent-ui/agent-ui-accessibility-testing.md
- Create: knowledge/career/agent-project-requirements.md
- Create: knowledge/career/agent-project-evaluation.md
- Create: knowledge/career/agent-project-deployment.md
- Create: ten matching images under images/

**Interfaces:**

- Consumes: manifest records 31–40, evidence map, and image specifications.
- Produces: ten valid articles and ten accepted WebPs.

- [ ] **Step 1: Generate and inspect images 31–40**

Make event states, approval boundaries, retry ownership, citation relationships, accessibility paths, project value, evaluation, and production readiness unambiguous.

- [ ] **Step 2: Draft articles 31–40**

Connect UI state to durable backend state, distinguish technical success from user outcome, and give practical acceptance criteria for projects.

- [ ] **Step 3: Run batch gates**

Use the same group assertions. Confirm UI security and accessibility claims use authoritative sources.

- [ ] **Step 4: Commit batch 4**

Run:

    git add knowledge/frontend/agent-ui knowledge/career images
    git commit -m "docs: add agent ui project guides"

Expected: records 31–40 and their images are added.

### Task 6: Implement batch 5 — community, interviews, and audited updates

**Files:**

- Create: knowledge/career/agent-open-source-contribution.md
- Create: knowledge/career/agent-interview-system-design.md
- Modify: knowledge/js-es6-ts/es6/promise.md
- Modify: knowledge/html-css/css/responsive-layout.md
- Modify: knowledge/framework/react/useCallback-useMemo.md
- Modify: knowledge/network/tcpIp/tcpIp-model.md
- Modify: knowledge/js-es6-ts/ts/ts-generics.md
- Modify: knowledge/fe/design/design-components.md
- Modify: knowledge/fe/node/node-knowledge.md
- Modify: knowledge/network/others/dns-analysis.md
- Create: ten matching images under images/

**Interfaces:**

- Consumes: manifest records 41–50, existing update prose, evidence map, and image specifications.
- Produces: two new articles, eight materially improved existing articles, and ten accepted WebPs.

- [ ] **Step 1: Generate and inspect images 41–50**

Validate contribution workflow, interview decomposition, Promise scheduling, responsive containers, React dependency identity, encapsulation, generic constraints, state ownership, Node subsystems, and DNS caching/failover.

- [ ] **Step 2: Draft records 41–42 and update records 43–50**

Preserve correct useful update content while replacing weak structure, adding current authoritative citations, concrete examples, boundaries, and the new teaching image.

- [ ] **Step 3: Run batch gates**

Assert the two creates and eight modifications exactly match the manifest and pass all content/image gates.

- [ ] **Step 4: Commit batch 5**

Run:

    git add knowledge/career knowledge/js-es6-ts knowledge/html-css knowledge/framework/react knowledge/network knowledge/fe images
    git commit -m "docs: complete career and core web guides"

Expected: records 41–50 and their images are added or updated.

### Task 7: Update ledgers and run full verification

**Files:**

- Modify: knowledge/_tree.json
- Modify: .codex/knowledge-update-history.json

**Interfaces:**

- Consumes: the completed 50-record manifest and the previous 20-record pending batch.
- Produces: 300 published tree leaves and a 209-record unique history ledger with 159 published plus 50 pending.

- [ ] **Step 1: Publish the 42 created tree leaves**

Change only their contentStatus from coming-soon to published. Keep the 8 update leaves unchanged.

- [ ] **Step 2: Update history**

Promote the 20 records in agent-platform-backend-next-20-2026-07-17 from pending to published. Append exactly 50 records for complete-knowledge-next-50-2026-07-17 using the manifest action and recordedAt 2026-07-17.

- [ ] **Step 3: Run repository validation**

Run:

    npm run validate:tree

Expected: 300 leaves, 300 existing, 0 missing, 0 duplicate keys, and only the same 2 known orphans.

- [ ] **Step 4: Run custom full gates**

Expected:

- 50 selected articles pass structure, citation, fence, image, and source-use checks;
- 50 selected images pass dimension, mode, light-canvas, filename, and visual inspection;
- all final references are reachable;
- tree is 300 published and 0 coming-soon;
- history is 209 total, 159 published, 50 pending, and 209 unique;
- no local paths, secrets, temporary URLs, or process markers;
- git diff --check passes.

- [ ] **Step 5: Review exact scope and commit metadata**

Run:

    git add knowledge/_tree.json .codex/knowledge-update-history.json
    git commit -m "docs: finalize complete knowledge batch"

Expected branch scope: 104 changed files across design, plan, 50 Markdown files, 50 WebPs, and 2 JSON ledgers.

### Task 8: Publish and verify exact merge

**Files:** No content changes expected.

**Interfaces:**

- Consumes: clean verified branch content/complete-knowledge-next-50.
- Produces: merged PR, successful exact-SHA sync-content run, and final master statistics.

- [ ] **Step 1: Re-run completion verification**

Run repository validation, full custom gates, git diff --check, scope counts, status, and recent commit review immediately before publishing.

- [ ] **Step 2: Push and create a ready PR**

Verify base master, head branch, not draft, mergeable clean, expected commits, and exactly 104 files.

- [ ] **Step 3: Merge with a merge commit**

Capture the merge SHA and require origin/master to equal or contain it.

- [ ] **Step 4: Watch only the exact merge-SHA Action**

Find the sync.yml push run whose headSha equals the merge SHA and wait for completion. On failure, inspect logs before any fix.

- [ ] **Step 5: Validate FaaS and final master**

Require:

    {"success":true,"data":{"manifests":1,"articles":50,"images":50,"deleted":0,"errors":[]}}

Re-read master and report:

- tree 300 published, 0 coming-soon;
- history 209 total, 159 published, 50 merged-pending;
- inventory 300 existing, 0 missing, 2 unchanged orphans;
- overall progress 209/300 (69.67 percent).
