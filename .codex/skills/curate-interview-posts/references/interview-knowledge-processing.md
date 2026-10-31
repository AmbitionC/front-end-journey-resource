# 面经加工阶段的知识关联证据

本契约用于原文已经采集并冻结后的**加工阶段**。浏览器采集不调用知识生成、不改公开文章、不增加热度。处理每个面经问题时，实际读取并执行仓库内 [`generate-knowledge-docs`](../../generate-knowledge-docs/SKILL.md)：复用已有知识时执行检索、准确性与教学质量审查；有新角度才更新正文；确认没有语义命中才新建。不能把一次文件读取或 `prepared` 自述当作完整技能执行。

## 准备与执行

```bash
node scripts/interview-knowledge-processing.mjs <resource-root> --keys key-a,key-b --out /absolute/private/processing-plan.json
```

该命令不修改内容，准备包包含实际 skill 的相对路径与 SHA-256、知识目录正文指纹以及限定目标；`status` 固定为 `needs_execution`。`--out` 把完整包写入仓外私有文件，stdout 只交付路径、SHA 和计数；省略时保留完整 JSON stdout 接口。它不会运行 Agent、生成文章、写 `completed` 记录或给出质量通过结论。新考点先用 skill 自带 `knowledge-inventory.mjs` 检索全库，选择/创建稳定叶子后也可用本命令核对输出。

Agent 必须实际加载该 skill 并按其工作流完成知识检索、研究、教学目标和结果核验。真实运行转录与执行回执放仓外，并由独立内容审核者核查：技能确实加载、候选正文确实阅读、创建理由排除了语义重复、引用支持重要断言。已有强内容应保留，复用不重写；来源导航变动不算教学正文更新。

## 批次执行顺序与上下文

保留用户选择的模型与推理档位，允许 max。每批先固定原生 run/batch、当前已发布基线和私有证据清单，再按真实原文与语义去重。将确定性的聚合、指纹、目录和 Git 读取交给脚本，Agent 负责题意、候选正文、准确性、教学性和图解判断。

按唯一知识 key 分配写入责任：同一主题的一次真实技能执行可以覆盖多道题，转录明确记录所覆盖题目、实际检索/阅读、复用或更新理由及最终内容核验；每道题仍有独立关联、绑定到本题的执行回执和唯一独审结论。共享真实主题转录，不重复研究相同内容；不同来源题意或边界仍逐题检查。多个 worker 不同时写同一知识正文或共享目录，由协调者汇合目录。

委派时使用新上下文（可用时 `fork_turns: none`）。交接包只含任务目标、限定 source/article/question/knowledge keys、基线 commit、当前 Skill 路径、私有原文/候选/清单路径及 SHA、输出要求和待核实事项；worker 自己读取证据。返回固定为：结论与阻断、计数、改动路径、私有报告/转录路径及 SHA。完整原文、全库目录、逐题账本和长转录留在文件，协调者按需打开异常项。仅为独立语义工作或必需独审委派，避免重复分工。

完成顺序：

1. 实际执行知识技能，完成逐题映射、唯一主题研究、面经短答和知识正文；新建先排除语义重复。
2. 完成配图、quickRead、目录、图片补同步清单。流程/时序/状态/数据流用 Archify，架构关系用 Excalidraw；在实际阅读宽度和 PDF 版面核验静态图可读性后再冻结。只处理本批新内容的图。
3. 用下述 `--prepare` 入口完成草稿热度、反链及稳定排序；有受影响的静态图绑定时，在全部正文变动之后更新 `knowledge/pdf-static-images.json` 中本批 article/source/output 指纹并保留完整覆盖，最后核对来源映射和所有最终字节。
4. 实际核验最终知识输出，在真实技能运行记录中保留终稿检查；逐题回执绑定当前 Skill、真实转录和最终完整正文 SHA，再冻结资源与逐题账本。
5. 独立审核全部题目与知识质量；运行原有发布校验。正式热度同步应当零改动，之后仍保留最终 head 技术独审、真实 PR CI、可信发布意图、合并、同 SHA 同步/PDF 与规定验收。

优先完成事件或有界等待；外层等待可用 45–55 秒，期间有独立工作就继续，避免短间隔轮询及仅查时间。完整测试针对最终变更运行一次；之后只有文件变化、失败或新风险才重跑相关检查。检查结果绑定文件/提交，不能把旧候选的通过结论套到新候选。公共文件或证据审后改变，须重新冻结并由审核方判断重审范围，最终全局摘要仍须重新审核。

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

正式审核之前使用不依赖批准的草稿入口，避免“先审→写反链→再审”的循环：

```bash
node scripts/sync-interview-topic-weights.mjs <resource-root> --prepare \
  --history /absolute/private/history.json --history-sha <history-sha256> \
  --sources /absolute/private/weight-sources.json --sources-sha <sources-sha256> \
  --keys key-a,key-b
```

`weight-sources.json` 是显式精确的 `[{"sourceId":"aaaaaaaaaaaa","articleKey":"article-key"}]`，也可使用 `{ "sources": [...], "sourceEvidence": [...] }` 提供与原文契约相同的冻结原件描述符。只选择本批逐题映射已确定的 prepared 来源，私账 knowledgeKeys 与已绑定题目一致；待补题不给知识热度。输入必须仓外且 SHA 固定，原件及参与计频的历史指纹须从实际冻结证据重读验证；缺已存的 `normalizedBodySha256` 时先据真实原件回填私账并重新固定输入，不能在两种同步路径中使用不同别名。准备只投影所选 `sourceId/articleKey`，不改私账状态，不产生实际技能执行、审核通过、发布授权或线上结果，返回 `needs_review`。其他 prepared 批次不计入。

正式 `sync-interview-topic-weights`（不带 `--prepare`）仍必须提供 `--history --keys --review --review-sha`，完整验证独立审核后，只把其 `articleKeys/sourceEvidence` 精确命中的 prepared 来源投影。最终同步应返回所有变动计数为 0 且 `treeOrderChanged: false`；有变动即旧冻结失效，重新核对、冻结和审核，不能自动更新 approved 回执。

历史 `published`/有效 `merged` 仍参与累计，合并转载不能在代表来源撤回后保留热度。

计数按证据 cluster 去重，规范 URL 和已从冻结原文校验的完整正文 SHA-256 也是去重别名；同一 cluster 即使流程字段冲突也只计一次。`processUnitId` 用于既有面经页复用与轮次审核，不同真实 cluster 即使属于同一流程也分别计热。复算使用 `heat = interviewBaseHeat + interviewCount`，不新增 `weight`。

受影响分类中的叶子按 heat 降序稳定排序，同热度保留原顺序，分类节点保留原槽位；即使数值未变也纠正陈旧顺序。`treeOrderChanged` 独立报告排序变化。草稿与正式同步共用同一计数/反链/排序逻辑；实际原文去重、逐题语义复用和独审门槛不因准备入口改变。
