# Agent Observability, Evaluation, and Security Next 20 Implementation Plan

> **Execution:** Use `superpowers:executing-plans` task by task in the current session. Do not delegate because this session's coordination policy forbids subagents unless the user explicitly requests them.

**Goal:** Publish the next 20 observability, testing, evaluation, and security knowledge guides with one verified light-background teaching diagram per guide.

**Architecture:** Treat the tree and update history as a deterministic selection ledger, establish a primary-source evidence map before drafting, and treat generated images and prose as untrusted until semantic and quantitative gates pass. Work in two groups of 10, then publish one atomic content/metadata PR and accept only the merge-SHA synchronization result.

**Tech Stack:** Chinese GitHub-flavored Markdown, JSON manifests, built-in imagegen/image2, Pillow, Node.js 22, npm, Git, GitHub CLI, GitHub Actions.

## Global constraints

- Base is `origin/master` at `ef2072e57fdc342c3f1bf7c24845024d454da865`; branch is `content/agent-observability-security-next-20`.
- Create exactly the 20 keys listed in the design and no other articles.
- Article files are body-only Chinese Markdown with no H1, larger than 4500 bytes, one final `## 参考资料`, and one unique matching OSS image URL.
- Every final reference is a reachable authoritative primary source and appears near the claim it supports.
- Every image is 1672×941 RGB WebP with a warm-white/light-gray full canvas; dark canvas, dark gradients, neon, terminal, and cyberpunk styles are forbidden.
- Image gates are mean luminance ≥185, pixels below 45 ≤10%, pixels at or above 190 ≥60%, and four corner luminance values ≥150.
- Promote the previous 20 pending records and append 20 pending records dated 2026-07-16.
- Do not modify infrastructure repositories or manually open the production site after successful synchronization.

---

### Task 1: Freeze inventory and manifest

**Files:**
- Read: `knowledge/_tree.json`
- Read: `.codex/knowledge-update-history.json`
- Read: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-observability-security-next-20-manifest.json`

- [ ] Run `npm run validate:tree` and the skill inventory script. Expected baseline: 300 leaves, 218 existing, 82 missing, zero duplicate keys, and the same two existing orphans.
- [ ] Flatten leaves in order, exclude history `published` and `pending`, and require the article to be absent. Assert the first 20 keys equal the design exactly.
- [ ] Assert the external manifest has 20 unique keys, article paths, and image names and contains only action `created`.
- [ ] Assert the branch starts from the stated base and has no unrelated worktree changes.

### Task 2: Build the evidence map

**Files:**
- Create outside repository: `/Users/chenhao/Documents/Codex/2026-07-14/new-chat/work/agent-observability-security-next-20-evidence-map.md`

- [ ] For traces, metrics, and logs, use OpenTelemetry specifications and semantic-convention documentation; distinguish causal events from aggregations and records.
- [ ] For debugging and tests, use official evaluation/testing documentation and original research; define reproducibility inputs and isolation boundaries.
- [ ] For simulation, red teaming, benchmarks, online evaluation, A/B tests, quality gates, and regression, use NIST, OWASP, MITRE, official platform guidance, and original evaluation/experiment sources where they directly support the claim.
- [ ] For the eight security topics, use OWASP agentic guidance, NIST publications, MITRE ATLAS, OAuth/IETF standards, SLSA, Sigstore, Kubernetes, and relevant protocol specifications.
- [ ] Record one learning outcome, at least three supported claims, URLs, confidence, and a time boundary under every key. Require 20 headings, at least 60 claims, no empty source lists, and no inaccessible final source.

### Task 3: Generate and validate images 1–10

**Files:**
- Create: `images/agent-trace-model-trace-waterfall-v1.webp`
- Create: `images/agent-metrics-metric-stack-v1.webp`
- Create: `images/agent-logs-correlation-flow-v1.webp`
- Create: `images/agent-debugging-reproduction-loop-v1.webp`
- Create: `images/agent-test-pyramid-layered-strategy-v1.webp`
- Create: `images/agent-simulation-dual-loop-v1.webp`
- Create: `images/agent-red-teaming-attack-defense-cycle-v1.webp`
- Create: `images/agent-benchmark-evaluation-matrix-v1.webp`
- Create: `images/agent-online-eval-sampling-monitoring-loop-v1.webp`
- Create: `images/agent-ab-testing-experiment-funnel-v1.webp`

- [ ] Use `imagegen` once per distinct diagram and preserve every generated source outside the repository.
- [ ] Begin every prompt with the exact light-theme contract; require short English labels and one unambiguous mechanism.
- [ ] Inspect semantics: trace hierarchy preserves identifiers; metric layers do not conflate product outcome and service health; logs correlate with trace and run; debugging replays pinned inputs; test pyramid increases realism and cost by layer; simulation separates user and environment; red teaming closes a remediation loop; benchmark reports distribution and uncertainty; online evaluation uses sampling and escalation; A/B testing preserves assignment and exposure.
- [ ] Convert accepted sources to 1672×941 RGB WebP and run all quantitative image gates. Regenerate failures; never relax gates.

### Task 4: Draft and validate articles 1–10

**Files:**
- Create: `knowledge/llm/production/agent-trace-model.md`
- Create: `knowledge/llm/production/agent-metrics.md`
- Create: `knowledge/llm/production/agent-logs.md`
- Create: `knowledge/llm/production/agent-debugging.md`
- Create: `knowledge/llm/production/agent-test-pyramid.md`
- Create: `knowledge/llm/production/agent-simulation.md`
- Create: `knowledge/llm/production/agent-red-teaming.md`
- Create: `knowledge/llm/production/agent-benchmark.md`
- Create: `knowledge/llm/production/agent-online-eval.md`
- Create: `knowledge/llm/production/agent-ab-testing.md`

- [ ] Draft each article from the evidence map with a concise mental model, dependency-first mechanism, practical contract or example, failure modes, verification, recap, and final references.
- [ ] Insert exactly one matching OSS image URL immediately after the prose that creates the visual need, with meaningful Chinese alt text and caption.
- [ ] For every file assert bytes >4500, no H1/front matter/local path/placeholder, exactly one image URL, exactly one final reference heading, balanced fences, and every final source URL cited in the body.
- [ ] Review neighboring-topic boundaries and remove repeated generic sections.

### Task 5: Generate and validate images 11–20

**Files:**
- Create: `images/agent-quality-gates-release-ladder-v1.webp`
- Create: `images/agent-prompt-regression-change-matrix-v1.webp`
- Create: `images/agent-indirect-injection-trust-boundaries-v1.webp`
- Create: `images/agent-tool-poisoning-tool-contract-defense-v1.webp`
- Create: `images/agent-memory-poisoning-memory-trust-lifecycle-v1.webp`
- Create: `images/agent-data-exfiltration-egress-control-v1.webp`
- Create: `images/agent-identity-auth-delegation-chain-v1.webp`
- Create: `images/agent-secrets-management-secret-lifecycle-v1.webp`
- Create: `images/agent-supply-chain-provenance-map-v1.webp`
- Create: `images/agent-network-egress-policy-path-v1.webp`

- [ ] Generate and inspect one image at a time under the same light-theme contract.
- [ ] Require: quality gates connect evidence to block/advance decisions; regression separates change axes; injection diagrams distinguish data from instruction; tool and memory poisoning show validation before trust; exfiltration and network egress show policy enforcement at the boundary; identity shows subject, agent, workload, and delegated authority; secrets show issuance through revocation; supply chain shows provenance and verification.
- [ ] Convert to exact final assets and apply all semantic and quantitative gates first to group B, then all 20 together.

### Task 6: Draft and validate articles 11–20

**Files:**
- Create: `knowledge/llm/production/agent-quality-gates.md`
- Create: `knowledge/llm/production/agent-prompt-regression.md`
- Create: `knowledge/llm/production/agent-indirect-injection.md`
- Create: `knowledge/llm/production/agent-tool-poisoning.md`
- Create: `knowledge/llm/production/agent-memory-poisoning.md`
- Create: `knowledge/llm/production/agent-data-exfiltration.md`
- Create: `knowledge/llm/production/agent-identity-auth.md`
- Create: `knowledge/llm/production/agent-secrets-management.md`
- Create: `knowledge/llm/production/agent-supply-chain.md`
- Create: `knowledge/llm/production/agent-network-egress.md`

- [ ] Draft from the evidence map and explicitly separate normative standard, documented implementation behavior, attack observation, and engineering recommendation.
- [ ] Insert one unique exact OSS image per article and apply the same content gates as group A.
- [ ] Confirm all 20 keys, images, paths, labels, sources, and topic boundaries are unique and complete.

### Task 7: Update ledgers and verify the repository

**Files:**
- Modify: `knowledge/_tree.json`
- Modify: `.codex/knowledge-update-history.json`

- [ ] Change only the selected 20 leaf `contentStatus` values from `coming-soon` to `published`.
- [ ] Change exactly 20 records in batch `agent-multi-production-next-20-2026-07-16` from `pending` to `published`.
- [ ] Append the 20 exact manifest records with `status: pending`, `action: created`, `recordedAt: 2026-07-16`, and batch `agent-observability-security-next-20-2026-07-16`.
- [ ] Assert tree totals 300 unique / 238 published / 62 coming-soon and history totals 139 unique / 119 published / 20 pending.
- [ ] Run `npm run validate:tree`, article gates, image gates, URL checks, ledger assertions, `git diff --check`, secret/local-path scans, and exact-scope checks.
- [ ] Expect 44 changed files across three commits: two planning documents, 20 Markdown files, 20 images, and two JSON ledgers.
- [ ] Commit the exact 42 content and ledger files as `docs: add agent observability security guides`.

### Task 8: Publish and accept synchronization

**Files:**
- Read: `.github/workflows/sync.yml`

- [ ] Push `content/agent-observability-security-next-20` and create a ready PR to `master`.
- [ ] Require 3 commits, 44 files, clean mergeability, and no unexpected review or check blocker.
- [ ] Merge with a merge commit and capture the merge SHA.
- [ ] Find the `sync-content` Action whose `headSha` exactly equals that merge SHA; ignore branch-head runs.
- [ ] Require Action conclusion `success` and FaaS response `{manifests:1, articles:20, images:20, deleted:0, errors:[]}`.
- [ ] Re-fetch `origin/master`, recalculate inventory and ledger totals, then report created/updated/skipped/failed/pending-image counts, PR, merge SHA, Action, payload, and final progress.
