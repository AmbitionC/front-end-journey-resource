Batch API 适合不要求即时返回的大量独立任务：离线分类、数据清洗、评测、摘要或内容标注。它通常以任务清单或 JSONL 提交，供应商异步处理后提供结果文件。批处理不是“把实时接口放进一个大循环”，而是一套清单、校验、关联、重跑和生命周期管理系统。

## 哪些任务适合 Batch

适合的任务通常具备：

- 单条请求互相独立；
- 可以等待较长时间；
- 输入与模型配置在提交时可冻结；
- 结果可以通过稳定 key 回写；
- 单条失败不应使整个批次回滚。

强交互、严格秒级 SLA、请求间有顺序依赖、需要多轮动态工具调用的工作不适合直接放进 Batch。可先把复杂工作流拆成多个有依赖的阶段，每一阶段内部再批处理独立单元。

![请求记录逐行校验后进入离线批次，并行处理产生乱序结果，再用稳定 key 关联成功与失败](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-batch-api-offline-lifecycle-v1.webp)
*图：输出顺序可能变化，关联依赖唯一业务 key；失败项独立进入受控重跑。*

## 清单是不可变输入快照

每一行至少包含唯一 `custom_id`、目标操作和请求体。不要把数据库自增行号当唯一关联：同一数据可能重跑、分片或跨环境复制。可以组合业务主键、任务版本和内容指纹：

```text
custom_id = tenant + task + record_id + prompt_version + content_hash
```

清单生成后计算文件哈希并保存元数据：数据查询条件、源快照版本、模板版本、Schema 版本、模型策略、生成时间和记录数。随后冻结；源数据库变化不应偷偷改变已经提交的批次。

JSONL 要求一行一个完整 JSON 对象，不能使用漂亮打印的多行 JSON。正式上传前进行本地逐行校验：UTF-8、JSON 可解析、key 唯一、端点一致、内容大小、模型能力、工具和 Schema 合法、估算 token 与费用在预算内。

## 一个应用侧批次模型

供应商 batch ID 只是外部引用。自有模型可以是：

```text
BatchJob
  batch_id, tenant_id, manifest_hash, source_snapshot,
  provider, model_policy, schema_version, status,
  total, submitted, completed, failed, created_at

BatchItem
  custom_id, batch_id, source_ref, input_hash,
  provider_request_ref, status, output_ref, error,
  attempt, usage
```

状态机示例：

```text
draft → validating → uploaded → submitted → processing
                                     ↘ cancelling
processing → reconciling → completed_with_errors/completed
                         ↘ expired/failed
```

供应商状态映射到应用状态，原始状态继续保留。轮询器需要有退避和单实例租约，避免多个 worker 同时高频查询；若支持 webhook，也要验证签名并保留轮询作为补偿。

## 输出绝不能按行号回写

多个官方 Batch 文档都提醒结果顺序可能与输入不同。必须按 `custom_id` 建立关联：

1. 逐行读取输出文件；
2. 校验 `custom_id` 属于当前清单且未重复；
3. 区分成功响应与每行错误；
4. 验证响应 Schema 和业务约束；
5. 幂等写入结果表；
6. 最后对比输入 key 集合与输出 key 集合。

集合差异分为：缺失、重复、未知、成功、供应商失败、验证失败。即使供应商批次标记 completed，应用也要完成 reconciliation 才能宣布任务完成。

```text
missing = input_keys - output_keys
unexpected = output_keys - input_keys
duplicates = keys_with_count_gt_1
```

结果文件可能很大，采用逐行流式解析和分段提交，避免一次读入内存。写入使用 `batch_id + custom_id + attempt` 唯一约束，重复下载不会重复生效。

## 失败重跑要生成新清单

不要重新提交整个原批次。只挑出可重试的失败和缺失项，生成带父批次引用的新清单；请求错误、内容策略拒绝和 Schema 不兼容需要先修复，不能机械重试。

新的 `attempt` 必须可见。若 prompt、模型或 Schema 发生变化，它已经不是同一实验，应生成新任务版本，而不是把结果覆盖成“重试成功”。评测场景尤其要保留每次配置与原始响应，才能公平比较。

取消也可能是部分成功：已完成结果应正常对账，未完成项标为 cancelled 或 expired。不能因为批次整体取消就丢弃已经付费且有效的结果。

## 成本、配额与分片

批处理常有独立配额、完成窗口与价格。正文不应依赖某个固定折扣；在提交时读取带版本的供应商价格与限制，估算：

```text
estimated_total = Σ estimated_item_usage × batch_rate
```

按租户、任务和数据敏感等级分批，避免一个超大文件成为单点失败。分片大小要平衡上传/轮询开销、失败域、结果文件体积和供应商限制。先提交小 canary 批次验证 Schema、成本和结果关联，再放大全量。

实时与批处理通常使用不同配额池，但仍可能共享项目预算、模型容量或数据政策。路由器要把 batch 能力作为独立能力，不应自动把实时模型名直接用于离线任务。

## 截至 2026-07-15 的供应商差异

OpenAI 的 [Batch API 指南](https://developers.openai.com/api/docs/guides/batch)描述当前 JSONL、`custom_id`、状态、结果/错误文件与支持端点，并明确结果顺序可能不同。当前完成窗口和价格优势属于调研日产品规则，使用前应重查。

Anthropic 的[批处理指南](https://platform.claude.com/docs/en/build-with-claude/batch-processing)说明 Message Batches 的独立请求、`custom_id`、乱序结果和部分失败；[Batch API 参考](https://platform.claude.com/docs/en/api/messages/batches)给出当前端点契约。

Gemini 的 [Batch API 指南](https://ai.google.dev/gemini-api/docs/batch-api)描述当前 `generateContent` 批处理、内联或 JSONL 输入、用户 key 和任务状态，并提示批次创建的当前幂等特性。支持 API、窗口、配额和折扣变化较快，应在能力目录记录验证日期。

统一层可抽象清单、key、状态和对账，但上传方式、端点、取消、过期与错误文件必须由各适配器实现。

## 运营与安全

清单、结果和错误文件可能含完整提示词与模型输出，应加密、按租户隔离、限制下载并设置删除期。日志记录哈希、数量和对象引用，不直接打印行内容。签名下载 URL 只短时有效，不进入长期日志。

关键指标：校验拒绝率、排队时长、处理时长、成功/失败/缺失比例、重跑率、每条 usage 与成本、Schema 验证通过率、人工复核率。告警应按“长时间无进展”而不是简单固定时长，因为供应商窗口会变化。

## 常见误区

- 用同步循环模拟批处理并占满实时并发；
- 清单生成后仍受源数据库变化影响；
- 不校验 JSONL 和 key 唯一性就上传；
- 按输出行号回写输入；
- 供应商状态 completed 就跳过应用对账；
- 一条失败就重跑整个批次；
- 新模型/新提示结果覆盖旧 attempt；
- 大文件一次读入内存；
- 忘记清理供应商与自有存储中的输入输出文件。

## 小结

Batch API 的核心是可审计清单与 key-based reconciliation。冻结输入快照、逐行预校验、保存自有状态、按唯一 key 处理乱序结果，并只重跑可恢复失败；再用分片、canary、预算和删除策略管理规模。这样异步与价格优势才不会换来错位回写和不可复现实验。

## 参考资料

- [OpenAI — Batch API](https://developers.openai.com/api/docs/guides/batch)
- [Anthropic — Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [Anthropic — Message Batches API](https://platform.claude.com/docs/en/api/messages/batches)
- [Gemini API — Batch API](https://ai.google.dev/gemini-api/docs/batch-api)
