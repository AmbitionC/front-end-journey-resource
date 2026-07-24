# FrontEnd Journey 面经/知识点集成参考

仅用于本仓库（`AmbitionC/front-end-journey-resource`）的面经整理与知识点提炼。动手前务必复核仓库当前 schema 与目录，不要依赖记忆。

## 仓库角色（与 knowledge skill 一致）

- `front-end-journey-resource`：Markdown / 图片 / 导航清单的唯一真相源。
- `fe-journey-faas`：内容 API 与 GitHub→OSS/MySQL 同步（**面经整理无需改动它**）。
- `front-end-journey-manager`：人工 Markdown 编辑与内容 CRUD。
- `front-end-journey`：阅读端，通过 `useNavList('interview')` / `useNavList('knowledge')` 加载导航，从 OSS 取 Markdown 渲染。

发布只改本仓库；`interview/`、`knowledge/`、`_tree.json`、`images/` 合入 `master` 后由 `sync.yml` Action 完成同步。

## 路径与文件

- 面经贴：`interview/<filePath>/<key>.md`
- 知识点：`knowledge/<filePath>/<key>.md`
- 导航清单：`interview/_tree.json`、`knowledge/_tree.json`
- 图片：`images/<name>`（发布时同步到 OSS；正文用 OSS URL 引用，不外链 `_inbox/assets`）

文章正文 **不带 frontmatter**（标题等元信息在 `_tree.json` 的叶子里）；面经贴正文用「按题目分节」的既有风格。

## `_tree.json` 叶子 schema

interview 叶子：

```json
{
  "label": "字节跳动前端一面",
  "key": "bytedance-fe-1",
  "isLeaf": true,
  "filePath": "bytedance",
  "tags": ["JavaScript", "React", "手写题"]
}
```

knowledge 叶子（含热度；`heat`/`currRank` 见 [dedup-and-heat.md](dedup-and-heat.md)）：

```json
{
  "label": "事件循环 Event Loop",
  "key": "event-loop",
  "isLeaf": true,
  "filePath": "js-es6-ts/runtime",
  "contentStatus": "published",
  "heat": 6,
  "currRank": 4
}
```

`heat`（复现来源数，排序真相源）与 `currRank`（0~5 火苗展示）是加工阶段维护的额外字段，faas 同步原样透传、网站火苗与热度排序直接消费，**无需改后端或前端**。

规则：

- `key` 在模块内**全局唯一**，与文件名一致（`<filePath>/<key>.md`）。
- 顶层为公司/大类节点（有 `children`，无 `isLeaf`）；面经叶子挂在公司分组下。
- upsert：已有同 `key` 则合并更新，否则在目标父节点 `children` 追加。
- 改完运行 `npm run validate:tree`：校验每个叶子有对应 `.md`、`key` 唯一、无孤儿文件。

## 现有 interview 顶层公司（示例，以实际 `_tree.json` 为准）

腾讯(`Tencent`)、阿里(`alibaba`)、字节(`bytedance`)、美团(`meituan`)、携程(`ctrip`)、滴滴(`didi`)、金山(`kingsoft`)、蔚来(`nio`)、OPPO(`oppo`)、小红书(`redbook`)、蚂蚁(`antfin`)。查不到合适公司时新建顶层节点。

## 与知识点生成的衔接

需要新建知识点时，复用同目录的 [`generate-knowledge-docs`](../../generate-knowledge-docs/SKILL.md)（项目模式）生成渐进式图文文档并 upsert `knowledge/_tree.json`；面经贴里可链接到对应知识点，形成「面经题 → 知识点」的互链。

## 隐私红线

面经属于公开发布内容。发布前必须去除：真实姓名、手机号/微信/QQ/邮箱、身份证、精确薪资、可定位到个人的信息。保留公司、岗位、轮次、题目与解法。提交前复核 diff。
