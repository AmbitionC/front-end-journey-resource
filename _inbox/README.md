# 收件箱（_inbox）—— 采集器投递的原始素材

本目录存放 **data-collector 采集器投递、尚未整理发布** 的原始内容（当前主要是牛客网面经）。它是「采集 → 加工发布」两层流水线的交接区，**不是发布内容**：

- **采集器**（[data-collector](https://github.com/AmbitionC/data-collector) 的 `repo-inbox` sink）把原始内容写到 `_inbox/<source>/<日期-ID-标题>/`，不做整理。
- **Codex / Claude** 用 [`.codex/skills/curate-interview-posts`](../.codex/skills/curate-interview-posts/SKILL.md) 扫描本目录，把每条整理成规范**面经贴**（`interview/`）并提炼**知识点**（`knowledge/`），更新对应 `_tree.json`，然后从本目录删除该条。

## 与发布/同步的边界

- `_inbox/` **不在** `interview/`、`knowledge/` 模块目录内，因此不被 `_tree.json` 引用、不被 `validate:tree` 扫描、也不被 faas `syncChanged` 当作文章同步。
- `sync.yml` 已对 `_inbox/**` 设置 `paths-ignore`：纯 `_inbox` 的提交不会触发内容同步空跑；只有加工产出（`interview/`、`knowledge/`、`_tree.json`）合入 `master` 才会真正发布。

## 条目结构

```
_inbox/<source>/<YYYY-MM-DD>-<稳定ID>-<标题slug>/
├── original.md   # frontmatter(title/author/date/source/source_url/collected_at/kind) + 原文正文
├── meta.json     # source/url/author/publishTime/suggestedTags/summary/images 等机器可读元信息
└── assets/       # 随文图片
```

`<source>` 为来源标识（如 `nowcoder`）。整理发布后删除对应条目。
