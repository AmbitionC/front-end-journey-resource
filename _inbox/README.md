# 收件箱（_inbox）—— 采集器投递的原始素材

本目录存放 **data-collector 采集器投递、尚未消费** 的原始内容，包括面经、知识线索、运营选题和优秀项目候选。它是「采集 → 聚合分流 → 内容加工」的交接区，**不是发布内容**：

- **采集器**（[data-collector](https://github.com/AmbitionC/data-collector) 的 `repo-inbox` sink）把原始内容写到 `_inbox/<source>/<日期-ID-标题>/`，不做整理。
- **Codex / Claude** 用 [`.codex/skills/curate-fe-journey-inbox`](../.codex/skills/curate-fe-journey-inbox/SKILL.md) 先按 `clusterId` 聚合并分流：面经/知识进入公开内容加工，运营/项目/排除项进入本地 `_inbox/_reports/`。
- 旧的纯面经条目仍可单独使用 [`.codex/skills/curate-interview-posts`](../.codex/skills/curate-interview-posts/SKILL.md)。混合批次不要直接套用它。

## 与发布/同步的边界

- `_inbox/` **不在** `interview/`、`knowledge/` 模块目录内，因此不被 `_tree.json` 引用、不被 `validate:tree` 扫描、也不被 faas `syncChanged` 当作文章同步。
- `sync.yml` 已对 `_inbox/**` 设置 `paths-ignore`：纯 `_inbox` 的提交不会触发内容同步空跑；只有加工产出（`interview/`、`knowledge/`、`_tree.json`）合入 `master` 才会真正发布。
- `_inbox/**`（除本 README）默认被 Git 忽略。原始证据、处理状态和运营/项目候选报告只保留本地，不进入产品内容仓库历史。

## 条目结构

```
_inbox/<source>/<YYYY-MM-DD>-<稳定ID>-<标题slug>/
├── original.md   # frontmatter(title/author/date/source/source_url/collected_at/kind) + 原文正文
├── meta.json     # source/url/author/publishTime/suggestedTags/summary/images 等机器可读元信息
└── assets/       # 随文图片
```

`<source>` 为来源标识（如 `nowcoder`、`github`）。`meta.json.feJourney` 提供候选类型、质量分、项目分、聚类与排除原因。

消费时先处理整个 cluster，避免相似帖子重复生成内容或重复增加知识热度。本轮不自动删除条目；公开内容 diff 验证且人工确认后，再独立清理已经核对的原始证据。
