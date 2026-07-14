Prompt 的一次改字，可能同时改变准确率、格式、延迟、Token 用量和工具调用行为。要让变化可解释、可比较、可回滚，不能只给一段文本标 `v2`；应把真正影响请求与结果的整套配置作为一个“提示包”版本化。

## 版本对象不是只有 Prompt 文本

一次 LLM 运行通常由这些因素共同决定：

- system / developer 指令与 user 模板；
- 模型 ID 或快照、推理与采样参数；
- 工具列表、描述、JSON Schema 与执行策略；
- 检索配置、知识库版本和上下文拼装顺序；
- 输出 Schema、解析器与后处理代码；
- SDK、业务代码、功能开关和安全策略。

因此日志中的 `prompt_version` 最好指向一个不可变清单，而不是只指向某个文本文件。OpenAI 的 Prompt 指南也建议把 Prompt 构造器集中管理，并在变更前加入代表性 fixtures、测试和评测，再通过发布系统或功能开关分阶段上线。[OpenAI 文本生成指南](https://developers.openai.com/api/docs/guides/text)

![提示包先经过离线评测，再进入稳定分流的灰度或 A/B 实验，由指标与护栏决定发布或回滚](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/prompt-versioning-experiment-v3.webp)
*图：只有把模板、模型、工具和输出结构一起锁定，A/B 结果才知道究竟比较了什么。*

## 用不可变清单描述一个版本

可以把人类可读版本号与内容哈希结合：版本号表达发布意图，哈希确认运行时拿到的确切内容。

```yaml
id: support-answer@2.3.0
created_at: 2026-07-14
change: "要求答案引用检索证据；缺少证据时不猜测"

model:
  id: ${MODEL_ID}
  reasoning_effort: low

prompts:
  instructions: prompts/support/instructions.md
  user_template: prompts/support/user.md

tools:
  schema: tools/support-tools.schema.json
  policy_version: support-tools@4

retrieval:
  index_version: help-center-2026-07-10
  top_k: 8

output:
  schema: schemas/support-answer.v3.json

eval:
  dataset: support-regression@12
  rubric: support-rubric@5
```

构建或发布时计算清单及其引用文件的哈希，并在请求日志中记录：

```json
{
  "prompt_id": "support-answer",
  "prompt_version": "2.3.0",
  "bundle_hash": "sha256:…",
  "experiment": "support-citations-2026-07",
  "variant": "B",
  "model": "resolved-model-id",
  "request_id": "provider-request-id"
}
```

运行时不要读取会被原地覆盖的“latest.md”。发布应创建不可变版本，再通过一个可回滚的别名或配置把流量指向它。

## 版本号怎么定

语义化版本可以借用，但不要假装 Prompt 与库 API 一样具有严格兼容性。一个实用约定是：

- **Patch**：不改变任务与输出契约的澄清、错别字或示例修正；
- **Minor**：新增受支持场景、规则或示例，输出 Schema 保持兼容；
- **Major**：任务边界、工具权限、模型家族或输出 Schema 发生不兼容变化。

无论版本号多小，只要影响模型输入，就必须跑回归评测。`2.3.1` 不代表风险一定小。

## 先离线评测，再做线上实验

离线评测回答“这个候选是否达到最基本质量”；线上实验回答“它是否改善真实用户目标”。不能用 A/B 测试替代安全和正确性门槛。

### 1. 固定代表性数据集

数据集应接近真实任务分布，并单独保留边界与对抗用例。每条样本包含输入、必要上下文、期望特征和评分方法。避免只收集候选版本表现好的例子。

### 2. 选择可重复的评分器

优先顺序通常是：确定性代码检查、经校准的模型评分、人工评分。格式、Schema、引用存在性可用代码检查；事实性和语气可用明确 rubric；高风险决策要保留专家复核。

Anthropic 的评测指南强调成功标准应具体、可测、与任务相关，并覆盖真实分布和边界情况；多维任务通常需要质量、隐私、延迟和价格等多项指标，而不是一个总分。[Anthropic 评测指南](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)

### 3. 设定晋级门槛

候选必须同时满足：核心质量不低于基线、安全和格式用例全部达标、成本与延迟不越过护栏。不要用平均分掩盖某个严重失败类别。

OpenAI Evals 的基本流程也是先定义期望行为与测试数据，再对候选 Prompt 运行评测并分析结果。[OpenAI Evals 指南](https://developers.openai.com/api/docs/guides/evals)

## 正确设计灰度与 A/B 测试

### 明确实验假设

坏假设是“B 更好”；好假设是“B 会把一次解决率提高，同时不降低安全通过率，P95 延迟增加不超过既定阈值”。

### 只改变目标变量

如果 A 与 B 同时使用不同 Prompt、不同模型和不同检索参数，最终无法归因。需要比较整包升级时可以这样做，但结论应写成“包 B 优于包 A”，不能归因到某一句 Prompt。

### 选择正确的分流单位

按用户或账号进行稳定分配（sticky assignment），避免同一人在多轮会话中来回切换版本。团队协作、企业账户等存在相互影响时，按组织分流比按请求分流更合理。

```ts
function variantFor(subjectId: string): "A" | "B" {
  const bucket = stableHash(`support-exp-2026-07:${subjectId}`) % 100;
  return bucket < 50 ? "A" : "B";
}
```

### 预先定义指标与停止规则

至少包括：

- 一个主要指标，例如任务完成率或一次解决率；
- 质量护栏，例如事实错误率、Schema 失败率、拒绝误伤率；
- 系统护栏，例如 P95 延迟、Token 成本、工具失败率；
- 预定样本量或运行周期、显著性方法与最大可接受损失；
- 立即停止条件，例如越权工具调用或严重安全失败。

不要每天查看结果并在第一次“看起来赢了”时结束实验，这会抬高误判概率。若必须连续监控，应使用预先选择的序贯检验方法，并把规则写进实验配置。

## 灰度发布与回滚

A/B 用于比较，灰度用于限制风险。生产发布可按以下顺序：

1. **影子流量**：候选读取真实输入但不影响用户，检查格式、成本与工具决策；
2. **内部或白名单**：让可快速反馈的人群使用；
3. **小比例灰度**：观察错误、延迟、安全和关键业务指标；
4. **逐步扩大**：每一级都有观察窗口和自动停止条件；
5. **全量与保留对照**：必要时保留少量长期基线，监测环境漂移。

回滚必须是配置切换，不应要求重新构建应用。旧提示包、旧工具 Schema 与兼容解析器要保留到回滚窗口结束。

## 可观测性与隐私

为了定位回归，日志至少需要提示包版本、实验变体、模型、延迟、Token 用量、工具结果状态、输出解析状态和供应商请求 ID。但不要默认完整记录用户 Prompt 和模型回复；先做数据分级、脱敏、访问控制与保留期限设计。

将用户反馈直接当作唯一质量指标也不可靠：只有愿意反馈的人会被观察到，而且满意度可能与事实正确性冲突。应把显式反馈与任务结果、自动评测和抽样审查结合。

## 常见失败方式

**只保存 Prompt 文本。** 模型或工具 Schema 已变化，回滚文本仍复现不了旧行为。

**在生产中覆盖同名版本。** 日志写着 `v2`，不同时间却指向不同内容，事故无法复盘。

**离线集被反复调参污染。** 同一个评测集被看得太多后会变成训练集，应保留独立的最终验证集并定期补充新案例。

**A/B 按请求随机。** 多轮会话可能跨版本，既破坏体验，也污染指标。

**只看平均质量。** 少数越权、泄露或格式崩溃可能被平均分淹没，必须设置分类护栏。

## 小结

Prompt 版本管理的核心是可复现：把模板、模型、工具、检索和输出结构打成不可变提示包；变更先过离线评测，再通过稳定分流的灰度或 A/B 验证；用预定义指标决定发布或回滚。这样每次变化都能回答三个问题：线上运行的到底是什么、为什么发布、出问题如何快速退回。

## 参考资料

- [OpenAI：Text generation 中的 Prompt 工程化建议](https://developers.openai.com/api/docs/guides/text)
- [OpenAI：Working with evals](https://developers.openai.com/api/docs/guides/evals)
- [Anthropic：Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)
