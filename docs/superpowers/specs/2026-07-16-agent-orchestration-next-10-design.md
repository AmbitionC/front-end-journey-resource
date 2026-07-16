# Agent 编排连续 10 篇知识更新设计

## 目标与批准依据

基于远端 `master` 提交 `6ab72c91da0f0bac651b042d37a1b00996abb205`，继续按 `knowledge/_tree.json` 叶子顺序和 `.codex/knowledge-update-history.json` 排除规则，创建下一批 10 个未处理知识点。用户在指出近期配图普遍呈黑色背景后，认可后续固定为暖白/浅灰背景，并要求“继续更新 10 篇”。因此本批沿用既有完整发布流程，同时把浅色视觉验收升级为不可跳过的质量门禁。

## 方案选择

考虑三种配图方案：

1. **统一浅色教学信息图并设置量化闸门（采用）**：暖白/浅灰背景、深色文字、低饱和蓝青橙紫语义色；先验收样图，再生成其余图片。优点是正文阅读一致、可量化阻止黑底回归。
2. **按主题在浅色与深色之间轮换**：变化更多，但同一学习路径视觉不稳定，也无法解决用户指出的“都是黑色”问题。
3. **保留深色模板只提高局部亮度**：成本最低，但仍会被感知为黑底，不能满足当前反馈。

本批采用方案 1。图片生成提示词只负责提出浅色要求，像素亮度检查负责验证结果；提示词写了“暖白”但输出仍为深色时必须重生成，不能仅凭文字判定通过。

## 固定范围

严格创建以下 10 篇，不改变 key、label、filePath、目录层级或排序：

1. `agent-human-in-loop` — Human-in-the-loop 审批与人工接管
2. `agent-sandbox` — 代码执行、浏览器与文件操作沙箱
3. `agent-run-loop` — Agent Run Loop、轮次与终止条件
4. `agent-state-machine` — 用状态机建模 Agent 行为
5. `agent-event-driven` — 事件驱动 Agent 与异步编排
6. `agent-deterministic-workflow` — 确定性 Workflow 与 Agent 的组合
7. `agent-dynamic-workflow` — 动态工作流生成与执行
8. `agent-tool-selection` — 工具发现、选择与路由
9. `agent-tool-result-validation` — 工具结果校验、解析与反馈
10. `agent-tool-timeout` — 工具超时、取消与重试

全部写入 `knowledge/llm/agent/{key}.md`。本批不修改其他文章，不处理两个既有孤儿文件，也不触碰应用或基础设施仓库。

## 学习路径与文章边界

- **人在回路与执行边界**：Human-in-the-loop 解释风险触发、审批快照、过期与人工接管；Sandbox 解释能力隔离、文件/网络/进程边界与结果回收。两篇都强调“批准意图”不等于授予无限权限。
- **运行时控制模型**：Run Loop 解释 observe/decide/act、轮次预算和终止；状态机解释显式状态、guard、transition 与非法迁移；事件驱动解释异步消息、相关 ID、幂等消费与最终一致性。
- **确定性与动态性组合**：确定性 Workflow 文章讲固定骨架包围受限 Agent 决策；动态工作流文章讲模型产出计划后，必须经过 schema、策略、DAG 与预算验证才能执行。
- **工具生命周期**：工具选择文章讲目录缩减、能力匹配与路由；结果校验文章讲不可信输出的结构、语义、来源和策略验证；超时文章区分 deadline、timeout、取消确认、重试安全与迟到结果。

已有 `agent-tool-design`、`agent-workflow-state`、`agent-planning` 和 `agent-handoff` 作为前置。本批不重复工具 Schema、检查点、通用规划或职责转移的完整内容。

每篇采用 body-only 中文 Markdown，无 H1；从心智模型逐步进入机制、示例、失败模式、测试/监控、小结和 `## 参考资料`。重要事实附近链接一手资料，末尾只列正文真正使用的来源。

## 调研与证据策略

写作前为每篇记录学习目标、关键论断、来源、置信度与时效边界。技术事实只使用标准、规范、原始论文或官方维护者文档：

- 人工审批与沙箱：NIST AI RMF/GenAI Profile、OWASP Agentic Security、Linux namespaces/seccomp、WebAssembly/WASI 或容器运行时官方资料；
- Run Loop、状态机与事件驱动：OpenAI Agents SDK、Temporal、SCXML、CloudEvents、Reactive Manifesto 或消息系统官方语义；
- 确定性/动态工作流：Temporal、LangGraph、OpenAI Agents SDK 与 JSON Schema；明确“模型建议”和“执行许可”的边界；
- 工具生命周期：MCP Tools、JSON Schema、OpenAI function calling、HTTP/AbortSignal/分布式重试官方规范；不把本地取消误写成远端副作用回滚。

供应商和 SDK 行为以 2026-07-16 为时间边界。不得编造固定最佳轮次、超时值、重试次数、沙箱绝对安全性或工具选择准确率。

## 浅色配图设计

每篇一张核心教学图，共 10 张。共同视觉系统：16:9、暖白或浅灰实色背景、深海军蓝文字与轮廓、低饱和蓝/青/橙/紫/绿语义色、清晰留白、短英文标签。禁止黑色/深蓝全幅画布、霓虹发光、暗色渐变、品牌、人物装饰、水印、长段文字和随机标签。

计划资源：

1. `agent-human-in-loop-approval-gate-v1.webp`：风险动作进入审批快照，经 approve/reject/expire，再执行或转人工接管。
2. `agent-sandbox-capability-boundary-v1.webp`：Agent 请求穿过 policy broker 后，只获得受限文件、网络、进程和时间能力，结果经扫描返回。
3. `agent-run-loop-turn-state-v1.webp`：Observe → Decide → Act → Observe 循环被轮次、token、时间和无进展守卫包围，终止到 complete/abstain/escalate。
4. `agent-state-machine-transition-guards-v1.webp`：显式状态通过 event + guard + action 迁移，非法迁移进入拒绝或错误路径。
5. `agent-event-driven-async-correlation-v1.webp`：命令产生事件，队列与消费者用 correlation/idempotency 关联异步结果和状态投影。
6. `agent-deterministic-workflow-agent-boundary-v1.webp`：确定性步骤固定执行，只有受限决策节点调用 Agent，输出经验证后回到工作流。
7. `agent-dynamic-workflow-plan-validation-v1.webp`：模型生成候选 DAG，经 schema、policy、cycle、budget 四道验证后才调度执行，失败回到修订而非直接运行。
8. `agent-tool-selection-progressive-discovery-v1.webp`：从大工具目录按权限和任务筛成候选集，再排序、选择与 fallback，未授权工具永不进入模型候选。
9. `agent-tool-result-validation-trust-boundary-v1.webp`：不可信工具输出依次经过 envelope、schema、semantic、policy/source 验证，形成 accepted/retry/reject 反馈。
10. `agent-tool-timeout-deadline-retry-v1.webp`：全局 deadline 分配给单次 attempt；timeout 触发取消与状态确认，仅幂等/可去重操作进入带抖动退避的重试。

### 样图与量化闸门

先只生成 `agent-human-in-loop-approval-gate-v1.webp`。人工检查结构、箭头、标签和背景；同时转灰度计算：

- 平均亮度必须不低于 185/255；
- 亮度低于 45 的像素不得超过 10%；
- 亮度不低于 190 的像素应占至少 60%；
- 四角不得为近黑或深蓝底色。

样图未通过时修改提示词并重生成，不开始其余 9 张。其余图片逐张应用同一门禁；任何一张失败只重生成该张。最终统一为 1672×941 RGB WebP，且每张语义关系必须与文章一致。

## 元数据与发布流程

1. 创建 10 篇 Markdown 和 10 张浅色 WebP，并完成 article/image/source 闸门。
2. 将本批 10 个叶子的 `contentStatus` 从 `coming-soon` 改为 `published`，不改变其他字段。
3. 将上一批 `rag-production-agent-next-20-2026-07-15` 的 20 条记录从 `pending` 提升为 `published`。
4. 新增本批 10 条记录：`status: pending`、`action: created`、`recordedAt: 2026-07-16`、批次 `agent-orchestration-next-10-2026-07-16`。
5. 文章、图片、目录、历史、设计和计划进入同一分支与 ready PR。
6. 合并后只认 merge SHA 的 `sync-content`：要求 HTTP 200，且返回 `manifests: 1`、`articles: 10`、`images: 10`、`deleted: 0`、`errors: []`。

## 预期状态与完成标准

合并后预期：

- 目录：300 个唯一叶子，198 `published`，102 `coming-soon`；
- 历史：99 个唯一记录，89 `published`，10 `pending`；
- 本批：10 个 Markdown、10 个匹配浅色 WebP、10 个 pending 记录；
- 整体进度：99/300，即 33.00%。

发布前必须通过仓库校验、10 篇正文结构/来源检查、10 张图片语义与亮度检查、JSON 精确差异检查和 `git diff --check`。相对远端基线，最终 PR 应为 24 个文件：10 Markdown、10 WebP、2 JSON、设计和计划。

完成时报告创建 10、更新 0、跳过 0、失败 0、待处理配图 0，并提供 PR 与 Action 链接，最后一行固定为：

```text
整体进度：99/300（33.00%）
```
