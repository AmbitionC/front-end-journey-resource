# Agent Observability, Evaluation, and Security Next 20 Design

## Goal

Publish the next 20 missing FrontEnd Journey knowledge points in deterministic tree order. The batch covers the production feedback chain from traces and metrics through testing, evaluation, experiments, and release gates, then introduces the main trust-boundary and supply-chain controls for agent systems. Every article receives one semantically checked light-background teaching diagram and authoritative primary-source citations.

## Selection contract

The source of truth is `origin/master` at `ef2072e57fdc342c3f1bf7c24845024d454da865`. Flatten `knowledge/_tree.json` in directory order, exclude any key recorded as `published` or `pending` in `.codex/knowledge-update-history.json`, and require the expected Markdown path to be absent.

The exact batch is:

1. `agent-trace-model` — Trace、Span、Run 与工具调用事件模型
2. `agent-metrics` — 成功率、质量、延迟、成本与业务指标
3. `agent-logs` — Agent 结构化日志与上下文关联
4. `agent-debugging` — Agent 调试方法与失败复现
5. `agent-test-pyramid` — Agent 单元、集成、场景与端到端测试
6. `agent-simulation` — 用户模拟器与环境模拟测试
7. `agent-red-teaming` — Agent 红队测试与对抗样本
8. `agent-benchmark` — Agent Benchmark 的设计与解读
9. `agent-online-eval` — 在线评估、抽样与质量监控
10. `agent-ab-testing` — Agent A/B 测试与实验设计
11. `agent-quality-gates` — 发布质量门禁与回归阻断
12. `agent-prompt-regression` — Prompt、工具与模型升级回归测试
13. `agent-indirect-injection` — 网页、文件与邮件中的间接 Prompt Injection
14. `agent-tool-poisoning` — 工具描述、Schema 与返回值投毒
15. `agent-memory-poisoning` — 记忆污染与持久化攻击
16. `agent-data-exfiltration` — 数据外泄路径与阻断策略
17. `agent-identity-auth` — Agent 身份、用户身份与委托授权
18. `agent-secrets-management` — 密钥、凭证与 Secret 生命周期
19. `agent-supply-chain` — 模型、工具、MCP 与依赖供应链安全
20. `agent-network-egress` — 网络出口、域名白名单与数据边界

No other tree leaf or article belongs in this batch.

## Content architecture

Every article is body-only Chinese Markdown at `knowledge/{filePath}/{key}.md`, larger than 4500 bytes, and progresses from a concise mental model through mechanism, implementation, failure modes, verification, recap, and one final `## 参考资料` section. Important claims use reachable primary sources linked near the claim and listed again in the final reference section.

Neighbor boundaries are explicit:

- trace-model defines causal events and identifiers; metrics aggregate decisions; logs retain inspectable facts; debugging reconstructs and compares failed runs;
- the test pyramid chooses isolation levels; simulation supplies controllable users and environments; red teaming seeks adversarial failures; benchmarks compare fixed evaluation tasks; online evaluation samples live behavior; A/B testing estimates causal product effects;
- quality gates combine evidence into release decisions; prompt regression isolates prompt, tool, and model changes;
- indirect injection enters through untrusted content; tool poisoning corrupts capability contracts or outputs; memory poisoning persists attacker influence; data exfiltration describes protected data crossing an unauthorized boundary;
- identity and authorization define principals, delegation, and authority; secrets management protects credentials over their lifecycle; supply-chain security establishes provenance and integrity; network egress enforces destinations and data boundaries at runtime.

## Evidence and time boundaries

Research precedes drafting. Prefer OpenTelemetry specifications, W3C and IETF standards, NIST guidance, OWASP agentic-security material, MITRE ATLAS, OAuth/RFC identity standards, SLSA and Sigstore, Kubernetes documentation, and original evaluation research. Provider or framework behavior is dated 2026-07-16 and identified as an implementation example rather than a universal contract. Security articles distinguish normative requirements, documented platform behavior, observed attack technique, and engineering recommendation.

An outside-repository evidence map records a learning outcome, at least three supported claims, URLs, confidence, and time sensitivity for every key. Inaccessible, indirect, or obsolete starting URLs must be replaced with reachable primary sources before an article is accepted.

## Illustration system

Create exactly one teaching diagram per article with these filenames:

1. `agent-trace-model-trace-waterfall-v1.webp`
2. `agent-metrics-metric-stack-v1.webp`
3. `agent-logs-correlation-flow-v1.webp`
4. `agent-debugging-reproduction-loop-v1.webp`
5. `agent-test-pyramid-layered-strategy-v1.webp`
6. `agent-simulation-dual-loop-v1.webp`
7. `agent-red-teaming-attack-defense-cycle-v1.webp`
8. `agent-benchmark-evaluation-matrix-v1.webp`
9. `agent-online-eval-sampling-monitoring-loop-v1.webp`
10. `agent-ab-testing-experiment-funnel-v1.webp`
11. `agent-quality-gates-release-ladder-v1.webp`
12. `agent-prompt-regression-change-matrix-v1.webp`
13. `agent-indirect-injection-trust-boundaries-v1.webp`
14. `agent-tool-poisoning-tool-contract-defense-v1.webp`
15. `agent-memory-poisoning-memory-trust-lifecycle-v1.webp`
16. `agent-data-exfiltration-egress-control-v1.webp`
17. `agent-identity-auth-delegation-chain-v1.webp`
18. `agent-secrets-management-secret-lifecycle-v1.webp`
19. `agent-supply-chain-provenance-map-v1.webp`
20. `agent-network-egress-policy-path-v1.webp`

Generated sources remain outside the repository; accepted outputs are 1672×941 RGB WebP under `images/`. The visual system uses a full-canvas warm-white or very light gray background, white cards, fine charcoal outlines, restrained blue/teal/orange/violet/green accents, and generous whitespace. Black or dark-navy canvas, dark gradients, neon, terminal, and cyberpunk aesthetics are forbidden.

Quantitative gates for every image:

- mean grayscale luminance at least 185;
- pixels below 45 no more than 10%;
- pixels at or above 190 at least 60%;
- all four corner luminance values at least 150;
- dimensions exactly 1672×941, mode RGB, decodable WebP;
- required components, arrows, ownership, data classification, and trust boundaries are semantically correct.

Each article references exactly one stable OSS URL matching its image filename.

## Batch and failure strategy

Process as two reviewable groups of 10. Establish evidence and image specifications before drafting. Generate and inspect images individually, then draft group A and group B with the same article/image gates. A systemic source, format, semantic, or luminance failure stops the affected group; acceptance thresholds are never reduced.

## Metadata transition

Change only the 20 selected tree leaves from `coming-soon` to `published`. Promote exactly the previous batch `agent-multi-production-next-20-2026-07-16` from `pending` to `published`. Append 20 unique history records with action `created`, date `2026-07-16`, batch `agent-observability-security-next-20-2026-07-16`, and status `pending`.

Expected ledger after the change:

- tree: 300 unique leaves, 238 `published`, 62 `coming-soon`;
- history: 139 unique records, 119 `published`, 20 `pending`.

## Verification and publication

Before publication, require article gates, image gates, reachable final references, metadata totals, `npm run validate:tree`, `git diff --check`, and a scoped diff of exactly 44 files across three commits: this design, one implementation plan, 20 Markdown files, 20 images, and two JSON ledgers.

Push a ready PR against `master`, verify it is clean and contains exactly the expected commits and files, merge with a merge commit, and accept only the `sync-content` run for the merge SHA. The expected FaaS payload is one manifest, 20 articles, 20 images, zero deletions, and no errors. Do not open the production site after a successful Action.
