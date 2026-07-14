# FrontEnd Journey Agent 知识库任务交接

> 更新时间：2026-07-14  
> 内容仓库：`AmbitionC/front-end-journey-resource`  
> 阅读站仓库：`AmbitionC/front-end-journey`

## 当前目标

网站以 Agent 为主题，总目录固定为 300 个核心知识点。保留前端核心，并补齐服务端、数据、计算机与算法基础。后续按目录顺序逐篇调研、配图、更新和发布。

## 已完成状态

- 300 点目录已经替换到 `knowledge/_tree.json`，所有 key 唯一。
- 方向比例：Agent 与大模型 165（55%）、服务端 45（15%）、数据 35（11.67%）、计算机与算法 25（8.33%）、前端核心 20（6.67%）、项目与职业 10（3.33%）。
- 128 个知识点复用已有文章，目录状态为 `published`；172 个待写知识点为 `coming-soon`。
- 29 个已经处理的知识点全部保留：历史中 24 个为 `published`，另 5 个为已合入 `master` 的 `pending`。
- 未匹配新目录的 189 篇旧 Markdown 已删除；应用清单在 `planning/resource-migration-manifest.json`。
- 阅读站已经加入好看的“即将上线”空状态；对应 `front-end-journey` PR #3。
- 300 点目录迁移对应 `front-end-journey-resource` PR #15。

整体进度：29/300（9.67%），剩余 271 个。

## 下一项

- key：`llm-capability-boundaries`
- 标题：大模型的能力边界、幻觉与不确定性
- 路径：`knowledge/llm/basics/llm-capability-boundaries.md`
- 当前状态：`coming-soon`

完成这一篇后继续按 `knowledge/_tree.json` 的叶子顺序选择，同时跳过 `.codex/knowledge-update-history.json` 中已经是 `published` 或 `pending` 的 key。

## 携带的执行能力

项目所用 skill 已导出到：

```text
.codex/skills/generate-knowledge-docs/
├── SKILL.md
├── agents/openai.yaml
├── references/fe-journey-integration.md
├── references/image2-integration.md
└── scripts/knowledge-inventory.mjs
```

在新的电脑上，让 Codex 读取该目录的 `SKILL.md` 即可沿用当前规则。该 skill 要求：调研优先、按依赖组织文章、只做高价值教学配图、每批 5—10 篇、文章/图片/历史记录同分支发布，并在每批结束后重算整体进度。

## 继续执行

```bash
git clone https://github.com/AmbitionC/front-end-journey-resource.git
cd front-end-journey-resource
npm install
node .codex/skills/generate-knowledge-docs/scripts/knowledge-inventory.mjs . > /tmp/fe-journey-inventory.json
npm run validate:tree
```

开始下一批前读取：

1. `.codex/skills/generate-knowledge-docs/SKILL.md`
2. `.codex/skills/generate-knowledge-docs/references/fe-journey-integration.md`
3. `.codex/knowledge-update-history.json`
4. `knowledge/_tree.json`
5. 本交接文件

推荐给 Codex 的继续指令：

```text
使用仓库内 .codex/skills/generate-knowledge-docs/SKILL.md，依据 planning/TASK_HANDOFF.md 和 .codex/knowledge-update-history.json，从 llm-capability-boundaries 开始，继续更新下一批 5 篇知识点，验证后发布并输出整体进度。
```

## 发布规则

- 内容、图片、目录状态和历史记录必须放在同一个资源仓库分支。
- 发布流程是 branch → PR → merge 到 `master`。
- `npm run validate:tree` 必须通过。
- 资源仓库 Action 是 OSS/MySQL 同步的发布依据；Action 成功后默认不再手工打开生产站验证，除非明确要求。
- 5 条 `pending` 记录的文章与图片已经合入 `master`，选择新批次时不得重复处理；待确认 Action 后可单独或随下一批改为 `published`。
- 当前接口未返回 PR #15 对应 Action 状态，因此交接文档不宣称其 OSS/MySQL 同步成功。

## 关键历史链接

- 300 点目录迁移：<https://github.com/AmbitionC/front-end-journey-resource/pull/15>
- 阅读站空状态：<https://github.com/AmbitionC/front-end-journey/pull/3>

`knowledge/_tree.json`、`.codex/knowledge-update-history.json` 与 GitHub `master` 始终是实际状态的最终依据；本文件用于快速恢复上下文。
