---
name: aj-diagrams
description: 给 Agent Journey 知识库文章画或重画配图时必须用。完整规则在仓库 .claude/skills/aj-diagrams/SKILL.md，Claude 和 Codex 共用这一份。
---

先读并照做仓库里的 `.claude/skills/aj-diagrams/SKILL.md`（唯一权威版本，改规则只改那一份）。
要点：用 `scripts/diagram-kit/kit.mjs` 写 `images/diagram-sources/<name>.aj.mjs`，
`npm run diagram -- <源码> --preview <预览.png>` 出深浅两版 PNG 并通过自动检查；不要用位图生成模型画技术图。
