# Agent Multi-Agent and Production Next 20 Design

## Goal

Publish the next 20 missing FrontEnd Journey knowledge points in deterministic tree order, covering multi-agent execution, memory, browser/computer/coding/voice agents, and the first production reliability controls. Each article receives one semantically checked light-background teaching diagram and authoritative primary-source citations.

## Selection contract

The source of truth is `origin/master` at `6631d5c5a64c73e6bf90e37e64167fa8e7da0763`. Flatten `knowledge/_tree.json` in directory order, exclude any key recorded as `published` or `pending` in `.codex/knowledge-update-history.json`, and require the expected Markdown path to be absent.

The exact batch is:

1. `agent-parallel-tools` — 并行工具调用与依赖调度
2. `agent-subagents` — Subagent 子智能体设计
3. `agent-supervisor` — Supervisor 监督者模式
4. `agent-delegation` — 任务委派、职责与结果合并
5. `agent-multi-agent-messaging` — 多智能体消息、协议与状态同步
6. `agent-memory-architecture` — Agent 记忆系统架构设计
7. `agent-memory-summarization` — 会话摘要、压缩与记忆提炼
8. `agent-memory-forgetting` — 遗忘策略、冲突处理与记忆更新
9. `agent-browser-use` — Browser-use 网页操作智能体
10. `agent-computer-use` — Computer-use 桌面操作智能体
11. `agent-coding` — Coding Agent 的架构与执行循环
12. `agent-voice` — Voice Agent 与实时对话编排
13. `agent-guardrails` — 输入、输出与工具 Guardrails
14. `agent-permission-model` — 最小权限、授权与工具调用确认
15. `agent-failure-recovery` — 失败分类、重试、补偿与恢复
16. `agent-idempotency` — 幂等性、重复执行与副作用控制
17. `agent-data-privacy` — 敏感数据、日志脱敏与隐私保护
18. `agent-security-threat-model` — Agent 威胁建模与安全测试
19. `agent-deployment` — Agent 服务部署、扩缩容与版本发布
20. `agent-feedback-loop` — 线上反馈、评估集与持续改进闭环

No other tree leaf or article belongs in this batch.

## Content architecture

Every article is body-only Chinese Markdown at `knowledge/{filePath}/{key}.md`, larger than 4500 bytes, and progresses from the problem and vocabulary to mechanism, implementation model, failure modes, testing/observability, recap, and one final `## 参考资料` section. Important claims use primary sources linked near the claim and repeated only in the final reference list.

Neighbor boundaries are explicit:

- parallel tools owns dependency graphs and joins; subagents own isolated workers; supervisor owns centralized control; delegation owns task contracts and merge semantics; messaging owns protocol/state synchronization;
- memory architecture owns tiers and retrieval; summarization owns lossy compression with evidence; forgetting owns expiry, conflict, and correction;
- browser use owns DOM/browser actions; computer use owns pixels/input devices; coding owns repository change loops; voice owns realtime audio turns;
- guardrails own layered validation; permission model owns authority; failure recovery owns classified remediation; idempotency owns duplicate side effects; privacy owns data lifecycle; threat model owns adversarial analysis; deployment owns version rollout; feedback loop owns production signals becoming evaluated improvements.

## Evidence and time boundaries

Research precedes drafting. Prefer protocol specifications, official framework/runtime documentation, security standards, and original research. Current SDK/provider behavior is dated 2026-07-16 and labeled as an implementation example rather than a portable guarantee. Security and privacy articles distinguish normative requirements, framework behavior, and engineering recommendations.

An outside-repository evidence map records learning outcome, at least three supported claims, URLs, confidence, and time sensitivity for all 20 keys. Inaccessible or obsolete starting URLs must be replaced with reachable primary sources before an article is accepted.

## Illustration system

Create exactly one teaching diagram per article with these filenames:

1. `agent-parallel-tools-dependency-dag-v1.webp`
2. `agent-subagents-contract-lifecycle-v1.webp`
3. `agent-supervisor-control-loop-v1.webp`
4. `agent-delegation-responsibility-merge-v1.webp`
5. `agent-multi-agent-messaging-protocol-state-v1.webp`
6. `agent-memory-architecture-tiered-memory-v1.webp`
7. `agent-memory-summarization-evidence-compression-v1.webp`
8. `agent-memory-forgetting-conflict-update-v1.webp`
9. `agent-browser-use-observe-act-verify-v1.webp`
10. `agent-computer-use-perception-action-safety-v1.webp`
11. `agent-coding-repo-loop-v1.webp`
12. `agent-voice-realtime-turn-taking-v1.webp`
13. `agent-guardrails-layered-controls-v1.webp`
14. `agent-permission-model-capability-approval-v1.webp`
15. `agent-failure-recovery-error-taxonomy-v1.webp`
16. `agent-idempotency-operation-ledger-v1.webp`
17. `agent-data-privacy-data-lifecycle-v1.webp`
18. `agent-security-threat-model-trust-boundaries-v1.webp`
19. `agent-deployment-versioned-rollout-v1.webp`
20. `agent-feedback-loop-eval-flywheel-v1.webp`

All sources remain outside the repository; accepted outputs are 1672×941 RGB WebP under `images/`. The visual system is a full-canvas warm-white or very light gray background, white cards, fine charcoal outlines, restrained blue/teal/orange/violet/green accents, and generous whitespace. Black or dark-navy canvas, dark gradient, neon, terminal, and cyberpunk aesthetics are forbidden.

Quantitative gates for every image:

- mean grayscale luminance at least 185;
- pixels below 45 no more than 10%;
- pixels at or above 190 at least 60%;
- all four corner luminance values at least 150;
- dimensions exactly 1672×941, mode RGB, decodable WebP;
- required components, arrows, ownership, and safety boundaries are semantically correct.

Each article references exactly one stable OSS URL matching its image filename.

## Batch and failure strategy

Process as two reviewable groups of 10. Complete research and image specifications for all 20, then generate and inspect each image individually. Draft group A (1–10), run the full article/image gate, then group B (11–20) and repeat. A systemic source, format, or image failure stops the current group; thresholds are never lowered to force acceptance.

## Metadata transition

Change only the 20 selected tree leaves from `coming-soon` to `published`. Promote exactly the previous batch `agent-orchestration-next-10-2026-07-16` from `pending` to `published`. Append 20 unique history records with action `created`, date `2026-07-16`, batch `agent-multi-production-next-20-2026-07-16`, and status `pending`.

Expected ledger after the change:

- tree: 300 unique leaves, 218 `published`, 82 `coming-soon`;
- history: 119 unique records, 99 `published`, 20 `pending`.

## Verification and publication

Before publication, require article gates, image gates, reachable final references, metadata totals, `npm run validate:tree`, `git diff --check`, and a scoped diff of exactly 44 files across three commits: this design, one implementation plan, 20 Markdown files, 20 images, and two JSON ledgers.

Push a ready PR against `master`, verify it is clean and contains exactly the expected commits/files, merge with a merge commit, and accept only the `sync-content` run for the merge SHA. The expected FaaS payload is one manifest, 20 articles, 20 images, zero deletions, and no errors. Do not open the production site after a successful Action.
