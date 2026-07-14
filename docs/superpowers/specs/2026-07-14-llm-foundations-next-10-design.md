# LLM 基础连续 10 条知识更新设计

## 目标

按 `knowledge/_tree.json` 的叶子顺序，创建当前首批 10 个尚未处理的 LLM 基础知识点，以一批内容、一个分支和一个 PR 完成研究、写作、配图、状态更新、校验和生产发布。

## 固定范围

本批只创建以下 10 篇文章，不调整 key、filePath、目录层级或排序：

1. `llm-capability-boundaries` — 大模型的能力边界、幻觉与不确定性
2. `llm-multimodal-basics` — 多模态模型基础：文本 / 图像 / 音频
3. `llm-tokenizer` — Tokenizer、词表与子词切分
4. `llm-training-overview` — 大模型训练全流程概览
5. `llm-pretraining` — 预训练目标、数据与 Scaling
6. `llm-alignment` — 模型对齐：SFT、偏好数据与安全
7. `llm-rlhf-dpo` — RLHF、RLAIF 与 DPO 的差异
8. `llm-quantization` — 模型量化与精度权衡
9. `llm-moe` — MoE 混合专家模型原理
10. `llm-reasoning-models` — 推理模型、思考预算与使用边界

所有文章写入 `knowledge/llm/basics/{key}.md`。本批不处理两个既有孤儿 Markdown，也不修改其他知识文章。

## 内容架构

10 篇文章共同形成一条依赖顺序：先建立模型能力与多模态边界，再解释文本如何被切分、模型如何训练和预训练，随后进入对齐、偏好优化、部署量化、MoE 扩展与推理时计算。相邻文章只简述前置概念并互相引导，避免复制大段解释。

每篇采用正文式 Markdown，不重复目录标题。基础结构为：开场心智模型、为什么需要、核心概念、工作机制、示例或实践、权衡与误区、小结、参考资料。事实性技术结论优先使用论文、标准、官方模型卡和官方文档；时效性结论明确版本或日期。

## 配图设计

每篇生成一张教学图，共 10 张，统一采用清晰、克制、高对比的教育信息图风格。图片只表达一个核心机制，标签以简短英文为主，正文提供完整中文解释，减少生成模型的文字错误。

图片使用唯一的 WebP 文件名：`{article-key}-{concept-slug}-v1.webp`，保存到仓库 `images/`，并在文章中引用最终 OSS URL。发布前逐张检查组件、箭头、顺序、标签和语义，不合格的图片重新生成。

## 状态与发布数据流

1. 为 10 个目录叶子创建 Markdown，并把对应 `contentStatus` 从 `coming-soon` 改为 `published`。
2. 将历史记录中已有 5 条、且已经成功完成 Action 同步的 `pending` 记录提升为 `published`。
3. 为本批 10 条新增历史记录，写入稳定 key、label、filePath、`action: created`、批次名、日期和 `status: pending`。
4. 文章、图片、目录状态和历史记录在同一分支提交。
5. 创建 PR，合并到 `master`，等待资源仓库 `sync-content` Action 成功。
6. 本批新记录在本次合并中保持 `pending`；按项目规则在下一批或独立记录变更中提升为 `published`。整体进度按“published + 已合并且 Action 成功的 pending”计算。

## 验证与失败处理

发布前必须满足：

- 10 个目标叶子各有且只有一个预期 Markdown 文件。
- 10 篇文章都有真实、贴近论断的来源，没有伪造引用和通用参考列表复用。
- 10 个图片 URL 均对应本批新增的本地图片，且不存在 `IMAGE2_PENDING`。
- 目录仅改变这 10 个叶子的 `contentStatus`，key、filePath 和顺序保持不变。
- 历史记录没有重复 key，原 5 条 pending 正确提升，新 10 条记录完整。
- `npm run validate:tree`（使用可用的现代 Node 运行时）通过。
- scoped diff 不包含无关文章、密钥、绝对路径或临时文件。

任一文章研究证据不足、图片语义错误、校验失败或 Action 失败时停止发布并保留可恢复的批次状态；不得将失败批次报告为完成。

## 完成标准

PR 已合并，`master` 包含完整的 10 篇文章、10 张图片、目录与历史变更，资源仓库 Action 成功完成 OSS/MySQL 同步。完成后重新读取 `master` 计算整体进度，预期从 29/300 提升到 39/300（13.00%）。
