# 面经加工阶段的知识关联证据

本契约用于原文已经采集并冻结后的**加工阶段**。浏览器采集不调用知识生成、不改公开文章、不增加热度。处理每个面经问题时，实际读取并执行仓库内 [`generate-knowledge-docs`](../../generate-knowledge-docs/SKILL.md)：复用已有知识时执行检索、准确性与教学质量审查；有新角度才更新正文；确认没有语义命中才新建。不能把一次文件读取或 `prepared` 自述当作完整技能执行。

## 准备与执行

```bash
node scripts/interview-knowledge-processing.mjs <resource-root> --keys key-a,key-b
```

该命令只读，返回实际 skill 的相对路径与 SHA-256、知识目录正文指纹以及限定目标；`status` 固定为 `needs_execution`。它不会运行 Agent、生成文章、写 `completed` 记录或给出质量通过结论。新考点先用 skill 自带 `knowledge-inventory.mjs` 检索全库，选择/创建稳定叶子后也可用本命令核对输出。

Agent 必须实际加载该 skill 并按其工作流完成知识检索、研究、教学目标和结果核验。真实运行转录与执行回执放仓外，并由独立内容审核者核查：技能确实加载、候选正文确实阅读、创建理由排除了语义重复、引用支持重要断言。已有强内容应保留，复用不重写；来源导航变动不算教学正文更新。

## 逐题私有映射

已绑定的 `questionLedger.rows[].questions[]` 增加 `knowledgeAssociation`：

```json
{
  "action": "reuse",
  "searchQuery": "本题的知识检索语义",
  "rationale": "为什么复用、补充或创建，以及候选内容的实际差异",
  "candidates": [{ "key": "existing-key", "sha256": "完整基线知识正文SHA256" }],
  "skillExecution": { "path": "/absolute/private/actual-run.json", "sha256": "实际运行回执SHA256" }
}
```

`action` 为 `reuse | update | create`。`reuse/update` 必须包含实际命中的既有候选；候选指纹绑定 PR base 的正文。`reuse` 只允许来源导航变化，教学正文发生变化必须改为 `update` 并审核新角度。`create` 不允许伪装已有 key；已有知识库非空时必须有实际阅读的候选及排除理由。新面经知识叶子显式设置 `interviewBaseHeat: 0`，首次同步后 `interviewCount: 1`、`heat: 1`；不得用初始 `heat: 1` 再推断出一个重复的历史基线。存量叶子保留原基线。

未绑定组仍按发布审核契约记录明确待补原因，不给知识热度，也不能虚构执行结果。

## 实际执行回执

仓外真实运行报告为 `schemaVersion: 1`、`kind: knowledge-skill-execution`，包含：

- `status: completed`、`stage: processing`；失败、待执行和采集阶段不能放行。
- `skill.name: generate-knowledge-docs`、`skill.path: .codex/skills/generate-knowledge-docs/SKILL.md`、`skill.sha256`（实际加载的当前 skill 字节）。
- 本题的 `sourceId`、`articleKey`、`knowledgeKey`、`action`。
- `output.path`（知识文章相对路径）与 `output.sha256`（最终知识正文完整指纹）。
- `trace.path/sha256`（仓外实际运行转录，必须非空）。

这里给出字段契约，不提供生成 `completed` 的脚本。运行记录只能来自真实执行；不得为通过门槛编造报告。测试中的合成 runner/reviewer 仅是隔离 fixture，不是生产审核证据。

## 独立质量审核

现有仓外 `independentReview` 报告增加 `knowledgeQuality`，绑定 `publicationDigest` 和 `questionLedgerSha256`，并在 `questions` 中为每个已绑定问题提供唯一一条结果：

```json
{
  "articleKey": "article-key",
  "sourceId": "aaaaaaaaaaaa",
  "questionIndex": 0,
  "knowledgeKey": "existing-key",
  "skillExecutionSha256": "实际运行回执SHA256",
  "decision": "approved",
  "accuracy": true,
  "pedagogy": true,
  "sources": true,
  "semanticReuse": true,
  "rationale": "独立审核者实际检查了什么、为何通过"
}
```

`questionIndex` 从 0 开始。缺项、重复/越界结果、拒绝、任一质量检查未通过、旧转录或旧摘要均阻断 `validate:release`。本地哈希只能证明字节绑定，不能认证 Agent 或审核者身份；既有 GitHub 可信发布意图仍需对真实独立审核作证。缺实际运行或质量审查时保留草稿并报告阻断。

## 热度草稿与目录顺序

`sync-interview-topic-weights` 只把当前固定回执 `articleKeys` 与 `sourceEvidence` 中精确 `sourceId/articleKey` 命中的 `prepared` 来源投影成草稿证据；不把其他待处理批次算成发布。历史 `published`/有效 `merged` 仍参与累计，合并转载不能在代表来源撤回后保留热度。

计数按证据 cluster 去重，规范 URL 和已从冻结原文校验的完整正文 SHA-256 也是去重别名；同一 cluster 即使流程字段冲突也只计一次。`processUnitId` 用于既有面经页复用与轮次审核，不同真实 cluster 即使属于同一流程也分别计热。复算使用 `heat = interviewBaseHeat + interviewCount`，不新增 `weight`。

受影响分类中的叶子按 heat 降序稳定排序，同热度保留原顺序，分类节点保留原槽位；即使数值未变也纠正陈旧顺序。`treeOrderChanged` 独立报告排序变化。同步写的是草稿，变更任何正文、目录或证据之后须重新冻结、独立审核；重复执行在同一最终审核版本下应无文件差异。
