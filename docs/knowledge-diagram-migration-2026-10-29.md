# 知识配图盘点与分批替换策略

盘点基准：2026-10-29，完成核验日期：2026-10-30，内容提交 `68db834b4cfe20c91ed9cd7fffe0fee6da8738af`。本次完成绘图工具安装、流程调整、全量引用盘点和迁移队列；线上文章图片替换计数为 0。

## 盘点结果

| 口径 | 数量 |
|---|---:|
| 知识树中的唯一知识点 | 326 篇 |
| 有图片或 iframe 引用 | 317 篇 |
| 有生成来源依据的旧图文章 | **245 篇 / 245 张图** |
| 旧栅格图来源仍需补证 | **41 篇 / 42 张图** |
| 本轮旧图替换候选合计 | **286 篇 / 287 张图** |
| 当前使用 Archify 的文章 | 29 篇 |
| 其中同时保留旧图候选 | 4 篇 |
| 使用源码 SVG 的文章 | 6 篇 |
| 当前图片均为确定性绘图、无旧图候选 | 31 篇 |
| 无图片或 iframe 引用 | 9 篇 |

按知识域分布（候选数为前两列之和）：

| 知识域 | 有生成依据 | 来源待补证 | 候选合计 |
|---|---:|---:|---:|
| Agent 与大模型核心 | 119 | 32 | 151 |
| 服务端工程 | 40 | 3 | 43 |
| 数据工程 | 35 | 1 | 36 |
| 计算机与算法基础 | 20 | 5 | 25 |
| 前端核心 | 21 | 0 | 21 |
| 项目与职业 | 10 | 0 | 10 |

两项来源口径分别保留：245 篇可以由当前图片元数据、同名历史原始素材的 AI 元数据，或明确指定文件名的生成计划核实；41 篇只保留到历史素材批次或缺少充分生成来源。这 41 篇纳入审查候选，不能断言均由某个图像模型生成。元数据标记未作密码学签名验证，具体 image 模型版本也不能由扩展名或批次名推断。

扫描从 `knowledge/_tree.json` 的 `isLeaf: true` 节点出发，解析当前 Markdown/HTML 引用、对应文件和 SHA-256，覆盖全部 326 篇。代码块中的示例图片语法不计入。统计当前引用的 326 个唯一资源、327 次引用；未引用的历史图片和孤立文章不纳入本轮分母。另有 68 篇含 100 个 Mermaid 代码块；4 张当前引用的 Mermaid 静态导出已有历史清单与图片哈希依据，单列为确定性派生图。

以下四篇仍需要处理其旧图部分，不能因出现 Archify 就记为整篇完成：`llm-token-context`、`build-agent-framework`、`agent-subagents`、`redis-data-structure`。

完整逐篇、逐图明细见 [盘点 JSON](../.codex/reports/knowledge-diagram-inventory-2026-10-29.json)，含来源等级、当前文章/图片指纹和引用关系。[迁移台账](../.codex/diagram-migration-history.json) 保存 286 个候选知识点及首批预选项，所有条目均未分配执行中的 `batchId`。

## 已有历史更新任务

此前“查询 skill 同步状态”任务已完成剩余 91 篇文章及 91 张配图并发布 [PR #31](https://github.com/AmbitionC/front-end-journey-resource/pull/31)。另一个“调研 Archify 框架图接入方案”任务曾完成 10 篇交互图升级；当前仓库还包含后续批次，盘点得到 29 篇使用 Archify。

上一内容批次的实际验收已覆盖 326/326 个知识点：119 个历史状态为 `published`，207 个为完整内容已合并的 `pending`。这表示知识文章曾被加工和交付；配图迁移独立统计。本次保留原有 `.codex/knowledge-update-history.json`，并续接 `agent-simulation` 已登记的临时图替换事项。

## 绘图分工与已安装版本

| 图的教学目的 | 工具 | 保留的可编辑源文件 |
|---|---|---|
| 流程、分支、审批、重试、状态变化、数据管道 | Archify | `.archify.json` |
| 调用链、参与方、消息先后、请求/响应 | Archify `sequence` | `.archify.json` |
| 组件、分层、服务、存储、部署、职责与信任边界 | Excalidraw | `.excalidraw` |

按图的含义选择工具：RAG 组件边界画成 Excalidraw，RAG 入库过程或请求时序画成 Archify。已有正确的 Mermaid、SVG 和 Archify 图可以继续使用；架构图下次重绘时使用 Excalidraw。定量图表继续使用标准绘图库。

- **Archify 3.2.0**：安装并核验上游稳定标签 `v3.2.0`，源提交 `208acba8d412335185b2056fedf54b3405df43fb`，203 个安装文件逐字节匹配。[上游发布](https://github.com/tt-a1i/archify/releases/tag/v3.2.0)
- **Excalidraw Skill / CLI 2.1.2**：安装社区项目 `yctimlin/mcp_excalidraw` 的稳定标签 `v2.1.2`，源提交 `1df6f8eba395cb2eb0a998ffba3237182a878197`；npm `latest` 同为 2.1.2，运行时按版本固定。当前采用 Skill + 本地 CLI，无需增加 MCP 连接。[上游发布](https://github.com/yctimlin/mcp_excalidraw/releases/tag/v2.1.2)

Excalidraw Skill 另保留两项本地兼容调整：修正不符合 Codex 校验的描述占位符；明确离线文件必须保留原生标签绑定和箭头几何。上游版本、原始文件指纹及本地修改分别记录，运行时源码未改动。

全局与仓库两份 `generate-knowledge-docs` 已更新到同一绘图规则，旧 `image2-integration.md` 保留为跳转说明；后续知识原理图不使用 image2/image2.5，也不在工具故障时回退到其他位图生成模型。详细流程见 [绘图集成契约](../.codex/skills/generate-knowledge-docs/references/diagram-integration.md)。

## 分批替换策略

默认每批 10 篇，复杂批次可缩到 5 篇。先续接明确待修事项，再处理高频核心知识；41 篇来源待补证候选先审查来源和可维护性，再决定是否替换。已验证的现有图不因统一风格而重画。

首批预选均来自有生成依据的集合，执行前重新核对文章和旧图片指纹：

| 知识点 | 工具 / 图型 | 首要审查内容 |
|---|---|---|
| `agent-simulation` | Archify / sequence | 模拟用户、Agent 与环境的角色；动作与观察方向 |
| `agent-coding` | Archify / workflow | 检查、补丁、测试、审查与失败返回 |
| `prompt-context-compression` | Archify / workflow | 保护信息、压缩策略、预算与验证 |
| `function-calling` | Archify / sequence | 模型提议、应用授权执行与工具结果 |
| `tcp-handshake` | Archify / sequence | 主动/被动关闭、ACK 顺序与 TIME-WAIT 归属 |
| `agent-parallel-tools` | Archify / workflow | 依赖约束、并行执行与重试条件 |
| `agent-sandbox-escape` | Excalidraw / architecture | 独立防线和运行时隔离边界 |
| `agent-api-gateway` | Excalidraw / architecture | 身份、策略与下游服务边界 |
| `agent-cache` | Excalidraw / architecture | 不同缓存层的归属和键隔离 |
| `rag-access-control` | Excalidraw / architecture | 索引和检索时的身份、租户边界 |

每一批保存源文件、导出图、工具版本、旧图/新图 SHA-256 和图意审查依据。保留有用正文、稳定 key、目录、面经来源和热度；图片替换使用新对象名，旧资源保留用于回滚。图意与正文一致后，再核对中文字体、箭头、换行、网页尺寸和 PDF 静态导出。按需刷新 PDF 清单指纹，通过 PR 合并、实际同步和必要的 PDF 验收后，才将台账从 `reviewed` / `merged` 晋升为 `published`。

新图优先沿用资源仓库现有静态图片发布路径。增加 `/archify/*.html` iframe 依赖前端静态资源的部署，不能把内容仓库同步当成前端部署。中文图可使用已核对字形的 PNG；SVG 需额外确认字体可用性或字形嵌入，保留可编辑源文件。

## 本次验证与进度

- Archify doctor 通过；新流程样例的 `validate`、`deliver`、严格 `check`、真实 `browser-check` 四个门禁通过。另生成四个明暗/尺寸截图，并查看了 1440×900 亮色样例。
- Excalidraw 原生场景实际导出 SVG 和 2080×1080 PNG；核对 9 个必要标签和 4 条绑定连线，并查看最终 PNG。中文 PNG 字形可读；SVG 字体可移植性需按具体发布环境单独验证。
- 两个绘图 Skill、全局与仓库两份知识 Skill 均通过 Codex Skill 格式校验。独立行为复核覆盖时序/架构分流、混合旧图、渲染器缺失、中文字体和两套进度口径。
- 仓库结构检查为 0 errors / 2 个既有孤立文章警告。全套测试在与 Action 相同的 `GITHUB_ACTIONS=true`、当前检出 SHA 约束环境中实际通过 134/134。普通本机环境为 133/134，单独复测同样在 `direct PDF CLI fails before browser launch or upload when genuine final proof is missing` 用例触发 20 秒超时；保留失败日志，不改超时或发布校验代码来消除这个结果。
- 两个样例用于工具能力验证，未替换线上文章引用。逐批执行记录留在专门迁移台账中。

历史文章加工整体进度：326/326（100.00%）。

本轮旧图专项：已发布替换 0/286 个候选知识点；生成来源有依据 245 篇，来源待补证 41 篇。
