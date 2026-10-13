# Interview Knowledge Idempotency Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans with tests first. This scoped implementation is already authorized; no further plan approval is required.

**Goal:** Process reviewed interview evidence into reusable knowledge with idempotent heat, stable category ordering, and auditable skill and quality evidence.

**Architecture:** Keep private source evidence and processing logs outside the public repository. Count distinct evidence clusters, with canonical URL and verified full-body aliases deduplicated; `processUnitId` controls page reuse but does not collapse genuinely distinct clusters. Freeze source/question/processing evidence and independent quality decisions before projecting only the reviewed prepared batch into draft heat.

**Tech Stack:** Node.js 22, native node:test, JSON private receipts, existing Markdown/tree manifests.

**Spec:** The authorized scope and concrete evidence contract below are the specification for this plan.

## Global Constraints

- Work only in the isolated `resource-interview-knowledge` clone, based on `3552091e8e3fe1407d62668183e752624125a534`.
- Preserve existing `heat`, `interviewBaseHeat`, `interviewCount`; do not introduce `weight`.
- New interview-derived leaves start with `interviewBaseHeat: 0`; preserve legacy baselines.
- Invoke/read the actual generate-knowledge-docs skill in processing, never in browser collection. No tool may fabricate a completed skill invocation.
- Reuse semantic matches, independently review quality, and block publication when evidence is absent or stale.
- No article publication, original checkout edits, pushes, PRs, installations, browser actions, or process restarts.

## Review Focus

- Same URL or verified body under conflicting cluster metadata must not count twice (Task 1).
- A merged repost must not retain heat after the published representative is retracted (Task 1).
- Unrelated prepared sources sharing a knowledge key must be excluded (Task 2).
- Mixed category/leaf siblings must keep category slots while ordering leaf slots (Task 2).
- Rehashed self-declarations cannot replace actual pinned skill execution and independent quality evidence (Task 3).

### Task 1: Evidence frequency identity

**Files:** `scripts/interview-source-history.mjs`, `test/interview-source-history.test.mjs`, `test/private-public-interview-boundary.test.mjs`.

**Interfaces:** `topicFrequencies(history)` retains `{key,count,clusters,companies,lastSeenAt}`. Cluster count is independent of `processUnitId`; aliases are canonical URL and full `normalizedBodySha256` (validated from frozen originals at the private boundary).

- [x] Add literal regression cases: same cluster/different processes => 1; two clusters/same process => 2; same canonical URL or full body => 1; retired representative plus merged duplicate => 0.
- [x] Run `node --test test/interview-source-history.test.mjs test/private-public-interview-boundary.test.mjs` and observe the intended count failures.
- [x] Implement evidence alias grouping and exclude inactive/retracted source groups.
- [x] Run the same tests and verify green.

### Task 2: Scoped heat and stable ordering

**Files:** `scripts/sync-interview-topic-weights.mjs`, `test/interview-topic-weights.test.mjs`, `test/private-public-interview-boundary.test.mjs`.

**Interfaces:** `syncInterviewTopicWeights(root, options)` uses pinned review `sourceEvidence` pairs plus `articleKeys` to activate prepared sources. Returns existing counters plus `treeOrderChanged`.

- [x] Test unrelated prepared exclusion, explicit zero baseline, preserved legacy baseline, removal/retraction, byte-identical rerun, ties, stale order with unchanged numbers, and mixed siblings.
- [x] Run targeted tests and observe failures for batch scope and stale ordering.
- [x] Pin review/history reads, project only exact reviewed source pairs, sort leaf slots independently from numeric changes, and write only changed bytes.
- [x] Run targeted tests and verify green.

### Task 3: Processing and publication evidence contract

**Files:** new `scripts/interview-knowledge-processing.mjs`, `scripts/content-review.mjs`, shared `test/release-review-fixture.mjs`, new `test/interview-knowledge-processing.test.mjs`, curation and generation skills/contracts.

**Interfaces:** A read-only processing-plan command returns the real skill path, instructions hash, semantic inventory and `status: needs_execution`. Each bound ledger question adds `knowledgeAssociation` with `action`, nonempty `rationale`, actual searched `candidates` and a pinned private `skillExecution` descriptor. The completed runner report binds stage `processing`, skill name/path/instructions SHA, sourceId/articleKey/knowledgeKey, action, frozen output path/SHA, and a nonempty execution trace. The independent content report adds a digest-bound `knowledgeQuality` section with an approved row for each bound question and explicit accuracy/pedagogy/sources/semanticReuse checks. All such evidence is private, byte-pinned, and independently reviewed; local hashes do not authenticate a runner or reviewer.

- [x] Write tests that missing association, missing/pending/wrong-stage/stale skill evidence, absent/rejected/stale quality and unsupported create decisions block final review.
- [x] Run targeted tests and observe the missing gate failures.
- [x] Implement read-only preparation (never a completed invocation), validate pinned actual run evidence and per-question quality, and enforce zero baseline for genuinely new leaves.
- [x] Update synthetic test fixtures explicitly as test-only runner/reviewer evidence, and document the processing workflow and CLI.
- [x] Run targeted tests, `npm test`, `npm run validate:tree`, and `git diff --check` under Node 22. Commit the validated branch and report its head to the parent for review.

## Execution record

Initial branch/status read: clean `codex/interview-knowledge-idempotency`, HEAD and origin/master at the base above. The temporary clone-local dependency symlink was removed before the newly authorized dependency preparation. Locked `npm ci --ignore-scripts` succeeded once with Puppeteer downloads disabled, existing registry/config and a `/tmp` cache; original checkout and dependencies were untouched.

Ruling: Evidence cluster identity supersedes the old same-process frequency rule as explicitly requested. Same-process page reuse and independently reviewed round exceptions remain enforced by content review.

- Task 1 complete: Node 22 targeted RED 15/21 passed, 6 assertion failures (five new regressions plus prior same-process expectation); GREEN 21/21. Logs `/tmp/resource-knowledge-count-{red,green}.log`.
- Task 2 complete: scoped projection/stale order/mixed siblings RED 2/5 passed, 3 failures; GREEN combined 26/26. Legacy baseline, explicit zero baseline, stable ties, byte-identical rerun and private binding retraction are exercised.
- Task 3 complete: missing preparation/association/execution/quality RED 0/4 passed; GREEN integration 46/46. Duplicate quality and changed prose claimed as reuse reproduced with RED, then fixed. Expanded evidence boundary tests 17/17 passed.
- Full suite first run 126/127 passed: an existing test's nonrecursive `.codex` mkdir conflicted with the new real skill fixture. Fixed both existing fixture setup sites to recursive mkdir. Final `npm test`: 127/127 passed, zero skipped.
- `npm run validate:tree`: zero errors, two existing warnings, 95 interviews and 322 knowledge leaves. `git diff --check`: clean.
- No public articles, trees, images, raw sources, original checkouts, or network publication changed. Skill execution and reviewer authority used in tests are explicitly synthetic; real processing must obtain actual run and independent quality evidence.

Final independent review: two Important findings, no Critical/Minor findings, declined-to-judge empty. Inactive source alias bridging and count-only legacy baseline/retraction were reproduced with six assertion failures (14/20 passed), fixed in one pass, and verified GREEN 20/20 including migration rerun and backlink cleanup. Final complete suite: 133/133 passed, zero skipped; tree zero errors/two existing orphan warnings; diff check clean. Logs: /tmp/resource-knowledge-review-fixes-{red,green}.log and /tmp/resource-knowledge-full-suite-final.log.

Read-only preparation on the actual 322-leaf repository for agent-memory returned the actual generate-knowledge-docs fingerprint and needs_execution. Public interview/knowledge/image contents and package-lock.json have zero diff from the base. Keep this feature branch and isolated clone for parent delivery; no push or PR performed.
