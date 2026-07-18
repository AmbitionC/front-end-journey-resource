# Remaining 91 Knowledge Documents Implementation Plan

> Execute this plan from the `content/complete-remaining-91` worktree. The approved design is in `docs/superpowers/specs/2026-07-18-complete-remaining-91-design.md`.

## Batch inventory

The deterministic order is the knowledge-tree order after removing all 209 keys already present in `.codex/knowledge-update-history.json`.

1. Agent foundations (1–10): `context-engineering`, `agent-react`, `agent-paradigms`, `agent-memory`, `build-agent-framework`, `mcp-protocol`, `multi-agent`, `agent-evaluation`, `agent-deep-research`, `ai-observability`.
2. AI production and Node.js (11–20): `llm-cost-optimize`, `prompt-injection-defense`, `ai-rate-limiting`, `agent-eval-framework`, `node-event-loop-deep`, `node-stream`, `fastapi-basics`, `node-buffer`, `node-worker-threads`, `express-core`.
3. Backend frameworks and APIs (21–30): `nestjs-architecture`, `koa-middleware`, `restful-design`, `websocket`, `api-versioning`, `graphql-core`, `sse-server`, `mysql-index`, `db-transaction-lock`, `redis-cache`.
4. Data access and backend security (31–40): `typeorm-entity`, `redis-data-structure`, `db-sharding`, `jwt-auth`, `oauth2`, `rate-limit-circuit`, `docker-basics`, `cicd-pipeline`, `password-encrypt`, `sql-injection`.
5. DevOps and Python/data foundations (41–50): `docker-compose`, `nginx-proxy`, `logging-monitoring`, `python-env`, `python-typing`, `python-async`, `python-oop`, `numpy-basics`, `jupyter-practices`, `pandas-basics`.
6. Data processing and SQL (51–60): `data-formats`, `text-preprocessing`, `data-quality`, `data-labeling`, `sql-core`, `postgresql-features`, `pgvector-usage`, `ann-hnsw`, `sql-window-function`, `sql-index-optimize`.
7. Data systems and operating systems (61–70): `clickhouse-intro`, `embedding-models`, `etl-design`, `embedding-pipeline`, `dvc-basics`, `matplotlib-seaborn`, `python-data-report`, `os-process-thread`, `os-virtual-memory`, `http-message`.
8. Systems, networking, and algorithms (71–80): `os-ipc`, `os-thread-sync`, `os-deadlock`, `tcp-handshake`, `tcp-udp`, `algorithm-array`, `algorithm-hash`, `algorithm-tree`, `algorithm-loop`, `algorithm-string`.
9. Frontend and agent career (81–90): `event-loop`, `localStorage-sessionStorage`, `web-attack`, `type-system`, `react-hooks`, `design-state`, `agent-role-landscape`, `agent-learning-roadmap`, `agent-project-portfolio`, `agent-resume-interview`.
10. Final career document (91): `agent-skill-map`.

## Task 1: Evidence and asset manifest

- Record every article path, reason for update, two or more primary/official sources, and one unique image filename.
- Check source reachability and replace redirected, obsolete, or secondary URLs.
- Create a bright illustration prompt for each article using the shared 1672 × 941 visual contract.

## Task 2: Generate illustrations

- Generate source images in small groups so each prompt remains topic-specific.
- Normalize each image to 1672 × 941 RGB WebP on a warm-white canvas without destructive cropping.
- Run dimension, mode, luminance, dark-pixel, light-pixel, corner, and duplicate-hash checks before copying the image into its article directory.

## Task 3: Update articles in ten groups

For every group:

- Inspect the existing document and retain correct, useful explanations and examples.
- Rewrite weak documents and repair stale or misleading claims in stronger documents.
- Add near-claim links to the approved evidence map.
- Reference exactly one newly generated illustration using the OSS image URL convention.
- Add a final `## 参考资料` section whose URLs match links used in the body.
- Run per-file structure, link, image, and content checks, then commit the group.

## Task 4: Update generation history

- Change all existing `pending` records to `published`.
- Append the 91 records in tree order with status `pending`, action `update`, and batch ID `complete-remaining-91-2026-07-18`.
- Assert 300 records, 300 unique keys, 209 published, and 91 pending.

## Task 5: Full validation

- Run `npm run validate:tree`.
- Validate the 91 article paths, titles, one-image rule, final references, near-claim links, OSS image links, and absence of placeholder text.
- Validate all 91 new images for size, RGB mode, brightness, unique hashes, and unique filenames.
- Inspect `git diff --check`, changed-file inventory, expected count (185), and absence of deletions or unintended taxonomy changes.

## Task 6: Review and publish

- Request an independent review of content integrity, scope, image/link rules, and history invariants.
- Resolve actionable findings and rerun validation.
- Push the branch, open a pull request, wait for required checks, merge, and verify the merge commit on `master`.
- Inspect the exact GitHub Actions job and FaaS response. Confirm 0 manifests, 91 articles, 91 images, 0 deletions, and no errors.
- Report the final 300/300 completion state with PR, merge, Actions, and validation evidence.
