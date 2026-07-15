# 长上下文与 Prompt 工程连续 10 条知识更新设计

## 目标

按 `knowledge/_tree.json` 的叶子顺序和 `.codex/knowledge-update-history.json` 的排除规则，创建当前下一批 10 个未处理知识点。批次先补齐 LLM 基础的最后两篇，再连续补齐 Prompt 与上下文工程的 8 篇缺失文章，以一个分支和一个 PR 完成研究、写作、配图、状态更新、校验与生产发布。

## 固定范围

本批只创建以下 10 篇文章，不改变 key、filePath、目录层级或排序：

1. `llm-long-context` — 长上下文、注意力稀释与有效利用
2. `llm-open-source-deployment` — 开源模型选型、推理与本地部署
3. `prompt-testing-debugging` — Prompt 调试、测试与回归验证
4. `prompt-role-boundaries` — System、Developer、User 消息的职责边界
5. `prompt-instruction-hierarchy` — 指令优先级与冲突处理
6. `prompt-template-design` — Prompt 模板、变量与复用设计
7. `prompt-examples-selection` — 示例选择、排序与动态 Few-Shot
8. `prompt-output-validation` — 模型输出校验与自动修复
9. `prompt-context-compression` — 上下文压缩、摘要与裁剪
10. `prompt-cache-design` — Prompt Cache 与稳定前缀设计

前两篇写入 `knowledge/llm/basics/{key}.md`，后八篇写入 `knowledge/llm/prompt/{key}.md`。本批不修改其他知识文章，不处理两个既有孤儿 Markdown，也不触碰面经内容。

## 内容架构

本批分成两个相连的学习单元：

- **模型使用边界**：长上下文文章解释位置表示、检索位置偏差、注意力/缓存成本和有效上下文评估；开源部署文章解释许可证与模型卡、权重格式、量化、推理引擎、硬件估算和部署验收。
- **Prompt 工程闭环**：从测试与调试建立质量基线，再区分消息角色和冲突层级，随后讲模板与动态示例，最后用输出校验、上下文压缩和稳定前缀缓存完善生产链路。

每篇采用 body-only Markdown，不重复目录标题。结构按开场心智模型、问题与术语、工作机制、示例或实践、权衡与失败模式、小结、参考资料展开。相邻文章通过简短前置说明衔接，不复制整段内容。

事实性结论优先使用原始论文、标准、模型卡、推理框架文档和模型供应商官方文档。涉及 API 消息角色、Prompt Cache 或上下文限制等可能变化的内容，明确供应商差异和文档核验日期，不把某一家的当前实现写成通用标准。

## 配图设计

每篇生成一张核心教学图，共 10 张，采用统一的克制、高对比教育信息图风格；每张图只解释一个核心机制，标签保持简短英文，完整含义由中文正文和图注说明。

计划图片分别表现：

1. 长上下文中输入位置、注意力稀释、检索与验证的关系；
2. 从模型卡与权重到运行时、硬件和服务接口的部署栈；
3. Prompt 版本、测试集、评测器、差异分析与回归门禁；
4. System / Developer / User / Tool 消息的职责分层；
5. 指令来源、优先级、冲突识别和安全停止路径；
6. 模板固定结构、变量边界、渲染与校验流水线；
7. 候选示例检索、相关性/多样性排序和 token 预算；
8. Schema 校验、业务规则、修复重试与失败出口；
9. 原始上下文经保留、摘要、裁剪后形成受控上下文包；
10. 稳定前缀与动态后缀如何影响缓存命中和成本。

图片使用唯一 WebP 文件名 `{article-key}-{concept-slug}-v1.webp`，保存于仓库 `images/`，文章引用对应 OSS URL。发布前逐张检查组件、箭头、标签和语义；有误导性关系时重新生成，不以文字说明替代错误图。

## 状态与发布数据流

1. 创建 10 个预期 Markdown，并把对应目录叶子的 `contentStatus` 从 `coming-soon` 改为 `published`。
2. 将历史记录中上一批已合并且 Action 成功的 10 条 `pending` 提升为 `published`。
3. 为本批新增 10 条历史记录，写入稳定 key、label、filePath、`action: created`、批次 `long-context-prompt-next-10-2026-07-15`、日期和 `status: pending`。
4. 文章、图片、目录树和历史记录放在同一分支与 PR 中。
5. 合并到 `master` 后等待 `sync-content` Action；以 FaaS 返回文章、图片、manifest 数量且 `errors: []` 作为发布完成证据。
6. 本批新记录在本次合并中保持 `pending`，下一批再提升；整体进度按 published 与已成功发布的 merged-pending 去重计算。

## 验证与失败处理

发布前必须满足：

- 10 个目标叶子各有且只有一个预期 Markdown 文件；
- 文章包含贴近论断的一手来源，版本敏感内容有明确边界；
- 10 张图片均能解码，尺寸一致，URL 与仓库文件一一对应；
- 不存在 `IMAGE2_PENDING`、本机绝对路径、临时 URL 或密钥；
- 目录只改变 10 个目标叶子的 `contentStatus`，不改变 key、filePath 和顺序；
- 历史记录 key 唯一，旧 10 条 pending 正确提升，新 10 条 pending 完整；
- `npm run validate:tree` 通过，scoped diff 不含无关文件；
- PR 可干净合并，资源 Action 对合并 SHA 返回成功。

如果一手资料不足、配图语义错误、校验失败或 Action 失败，则停止在对应阶段并保留可恢复状态，不把批次报告为完成。

## 完成标准

PR 已合并，远端 `master` 包含 10 篇文章、10 张图片和匹配的目录/历史变更；FaaS 同步成功且无错误。预期目录状态从 138 个 published 变为 148 个 published，待写从 162 变为 152；整体更新进度从 39/300 变为 49/300（16.33%）。
