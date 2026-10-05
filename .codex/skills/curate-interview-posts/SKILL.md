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

用户可指定处理范围（某条、某公司、全部）；未指定则处理 `_inbox/` 下全部条目。若调用方提供 Data Collector `batchId`，范围必须严格取自 `curate-fe-journey-inbox/scripts/inspect-batch.mjs`，不得混入其他批次。

## 每条的处理流程

1. **读原文**：读 `original.md` + `meta.json`，理解这是哪家公司、什么岗位/轮次、考了哪些题。
2. **原文去重**：先按 [references/dedup-and-heat.md](references/dedup-and-heat.md) §一 判断这条是否已入库，并先查仓库外的私有来源历史（读取真实正文，以 NFKC 去空白的完整 SHA-256 聚合；同 URL 幂等，跨 URL 同正文复用已有 key，不信任可编辑的 `clusterId` / `contentHash`）。既有已提交历史仅用于迁移核对，不把新原帖 URL、内容指纹或评级提交到公开仓库。已存在则并入来源、不重复建贴，也不重复增加知识热度。
3. **脱敏（强制）**：面经属于公开发布内容，务必去除个人隐私 —— 真实姓名、手机号/微信/邮箱、身份证、具体薪资数字、可定位到个人的细节。保留公司、岗位、轮次、题目与答题思路。
4. **写面经贴** → `interview/<目录>/<key>.md`：
   - **判断归属**：
     - **公司面经**（能对应到某公司某岗某轮）：归到已有公司分组（见 `interview/_tree.json`，如 腾讯/`Tencent`、阿里/`alibaba`、字节/`bytedance`、美团/`meituan` …）；查不到合适公司分组时新建一个顶层公司节点。
     - **专题/题集面经**（无具体公司，如「AI 面试题合集」「手写题合集」这类按主题聚合、常带 `#…题解#` 标签的帖子）：归到一个「综合/专题」顶层分组（如 `common`，label「综合面经」），按主题建子分组；这类帖子往往更适合把重点放在**知识点提炼**（第 5 步），面经贴本身作为题目索引。
   - 用仓库既有面经贴风格：按题目分节（`#### （1）…`），每题给出清晰、准确、可教学的解答，而非照抄口水话。必要时补充标准答案与易错点。原帖只有问题没有答案时，由你补齐高质量解答。
   - 保留公司、岗位、轮次、面试月份等必要背景，以及面经贴与知识点之间的导航链接；公开正文不得出现 `## 来源` 模块，也不得包含 `nowcoder.com` 原始链接。
   - 在 `interview/_tree.json` 对应分组下 upsert 叶子 `{ label, key, isLeaf: true, filePath, tags }`（`filePath` 为目录，`key` 为文件名去掉 `.md`，全库唯一；`tags` 用考点如 `JavaScript`/`React`/`手写题`/`系统设计`/`Agent`；`updatedAt` 设为当天日期，驱动站点「NEW」标记）。
5. **提炼知识点（去重 + 热度加权）** → `knowledge/<子路径>/<key>.md`：**严格按 [references/dedup-and-heat.md](references/dedup-and-heat.md) 执行**，核心是「同一考点只留一条、越高频越靠前」：
   - 对每个知识点候选，先用站内检索 / embedding + 读 `knowledge/_tree.json` 找**语义相近**的既有知识点（不只看标题）。
   - **命中近似**（表述不同但内容相近）→ **绝不新建**：把该面经登记进既有知识点的「## 出现于（热度来源）」（按面经 key/contentHash 去重），`heat = 去重来源数`，据分档表重算 `currRank`；有新角度就补进正文（内容加权）。
   - **全新** → 调 [`generate-knowledge-docs`](../generate-knowledge-docs/SKILL.md) 生成，`heat: 1`，来源=该面经。
   - 每次改动后把受影响父节点下 `knowledge/_tree.json` 兄弟叶子**按 `heat` 降序稳定重排**，使目录树热点→冷门（网站索引默认已按热度排序、无需改前端）。
   - 面经贴↔知识点互链。
6. **记录与出队**：来源、原文和逐题映射只保存在仓库外的私有历史与审核证据中；规范 URL、A/B 证据、实际正文 `normalizedBodySha256`、独立过程 `processUnitId`、公开 key 和知识 key 均需与冻结原文对应。独立审核冻结所有公开正文、目录、速读、图片及图片补同步清单，审核回执的 SHA-256 由审核方在私账外交付。执行 `npm run validate:release -- /absolute/private/history.json /absolute/private/review.json <review-sha256>`，不得从账本中的 approved 字段推断通过。详情见 [最终版本发布审核](references/release-review.md)。变更任何冻结输入都须重新审核；热度草稿写入后也必须重新冻结。未证实关键词的原题组保持明确待补，不猜题、不计热度。同过程不同轮次的独立页面例外须有已审证据；补充既有流程优先复用稳定 key。只有 PR 合并、该最终 SHA 同步与发布端核验成功后才把私有状态记为 `published` 并清理本批成功消费的本地候选，失败与待补项保留。
7. **图片**：面经贴/知识点若要用采集到的图，按 [references/fe-journey-integration.md](references/fe-journey-integration.md) 放到 `images/` 由同步流程发布；不要外链 `_inbox/assets`。

## 发布

按用户授权的 PR 流程提交公开内容，复核隐私和 diff，运行 `npm run validate:tree` 与上述冻结私有审核。正式同步和直接 PDF 入口都要求 GitHub 真实审查绑定已审 PR head 与公开资源快照，并核对合并 SHA；具体信任边界及操作见 [最终版本发布审核](references/release-review.md)。公开目录检查、本地冻结绑定、可信发布审查、同步结果和网站可见行为各自记录，前一项通过不代表后一项完成。

原先自动 publish 直接推送 master 的方式不能满足新审查门槛；仅推送后校验也不能补上缺失的 PR 回执。未知来源、八篇既有流程补充的最新线上 key 未核对、FaaS 未按 afterSha 固定读取，或生产阅读端未证实消费知识关联时应报告阻断，不记上线成功。无需改权限、增加凭据或外部服务。

旧公开来源账本移到仓外后，从当前公开树删除；这不擦除过去 Git 提交，不得声称历史原帖链接已全部撤回。
