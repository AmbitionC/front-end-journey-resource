---
name: curate-interview-posts
description: Turn raw collected interview experiences (牛客/nowcoder 面经) from the repository `_inbox/` into a polished interview post under `interview/` and extract reusable knowledge points into `knowledge/`, updating the `_tree.json` manifests. Use when Codex/Claude is asked to 整理面经, 面经入库, 处理面经收件箱, drain the interview inbox, 把牛客面经整理成面经贴, or 从面经提炼知识点 in AmbitionC/front-end-journey-resource. Pairs with the采集器 data-collector, which drops raw entries into `_inbox/nowcoder/`.
---

# Curate Interview Posts

把 `_inbox/` 里采集器投递的原始面经，整理成网站可发布的规范**面经贴**，并从中提炼可复用的**知识点**。本 skill 是「采集 → 加工发布」两层流水线的加工层；采集由 [data-collector](https://github.com/AmbitionC/data-collector) 负责。

**项目模式**：以 `AmbitionC/front-end-journey-resource` 为内容唯一真相源。动手前先看仓库当前状态，不要依赖记忆里的路径/schema。整理发布只改本仓库，**不要**为发布去改 `fe-journey-faas` / `front-end-journey` / `front-end-journey-manager`。详见 [references/fe-journey-integration.md](references/fe-journey-integration.md)。

## 输入

`_inbox/<source>/<日期-ID-标题>/`（当前 `<source>` 主要是 `nowcoder`），每条含：

- `original.md`：frontmatter（title/author/source/source_url/collected_at/kind）+ 原始面经正文。
- `meta.json`：`url/author/publishTime/suggestedTags/summary/images` 等。
- `assets/`：随文图片。

用户可指定处理范围（某条、某公司、全部）；未指定则处理 `_inbox/` 下全部条目。

## 每条的处理流程

1. **读原文**：读 `original.md` + `meta.json`，理解这是哪家公司、什么岗位/轮次、考了哪些题。
2. **原文去重**：先按 [references/dedup-and-heat.md](references/dedup-and-heat.md) §一 判断这条是否已入库（同 URL 幂等；跨 URL 转载比对 `meta.json.contentHash`）。已存在则并入来源、不重复建贴。
3. **脱敏（强制）**：面经属于公开发布内容，务必去除个人隐私 —— 真实姓名、手机号/微信/邮箱、身份证、具体薪资数字、可定位到个人的细节。保留公司、岗位、轮次、题目与答题思路。
4. **写面经贴** → `interview/<目录>/<key>.md`：
   - **判断归属**：
     - **公司面经**（能对应到某公司某岗某轮）：归到已有公司分组（见 `interview/_tree.json`，如 腾讯/`Tencent`、阿里/`alibaba`、字节/`bytedance`、美团/`meituan` …）；查不到合适公司分组时新建一个顶层公司节点。
     - **专题/题集面经**（无具体公司，如「AI 面试题合集」「手写题合集」这类按主题聚合、常带 `#…题解#` 标签的帖子）：归到一个「综合/专题」顶层分组（如 `common`，label「综合面经」），按主题建子分组；这类帖子往往更适合把重点放在**知识点提炼**（第 5 步），面经贴本身作为题目索引。
   - 用仓库既有面经贴风格：按题目分节（`#### （1）…`），每题给出清晰、准确、可教学的解答，而非照抄口水话。必要时补充标准答案与易错点。原帖只有问题没有答案时，由你补齐高质量解答。
   - 在 `interview/_tree.json` 对应分组下 upsert 叶子 `{ label, key, isLeaf: true, filePath, tags }`（`filePath` 为目录，`key` 为文件名去掉 `.md`，全库唯一；`tags` 用考点如 `JavaScript`/`React`/`手写题`/`系统设计`/`Agent`）。
5. **提炼知识点（去重 + 热度加权）** → `knowledge/<子路径>/<key>.md`：**严格按 [references/dedup-and-heat.md](references/dedup-and-heat.md) 执行**，核心是「同一考点只留一条、越高频越靠前」：
   - 对每个知识点候选，先用站内检索 / embedding + 读 `knowledge/_tree.json` 找**语义相近**的既有知识点（不只看标题）。
   - **命中近似**（表述不同但内容相近）→ **绝不新建**：把该面经登记进既有知识点的「## 出现于（热度来源）」（按面经 key/contentHash 去重），`heat = 去重来源数`，据分档表重算 `currRank`；有新角度就补进正文（内容加权）。
   - **全新** → 调 [`generate-knowledge-docs`](../generate-knowledge-docs/SKILL.md) 生成，`heat: 1`，来源=该面经。
   - 每次改动后把受影响父节点下 `knowledge/_tree.json` 兄弟叶子**按 `heat` 降序稳定重排**，使目录树热点→冷门（网站索引默认已按热度排序、无需改前端）。
   - 面经贴↔知识点互链。
6. **出队**：整理发布成功后删除 `_inbox/` 中该条目（含 `assets/`）。
7. **图片**：面经贴/知识点若要用采集到的图，按 [references/fe-journey-integration.md](references/fe-journey-integration.md) 放到 `images/` 由同步流程发布；不要外链 `_inbox/assets`。

## 发布

在仓库默认分支（`master`）提交整理产出（`interview/`、`knowledge/`、对应 `_tree.json`，以及被删除的 `_inbox` 条目）。合入 `master` 后由仓库的 `sync.yml` Action 自动同步到 OSS/DB/网站/检索 —— 无需手动调用 faas。提交前请复核 diff（尤其脱敏），把关面经质量与隐私。

`_tree.json` 校验：改完跑 `npm run validate:tree` 确认叶子与文件一致、key 唯一。
