Prompt Cache 复用的是相同或可识别前缀已经完成的计算，从而降低部分请求的延迟与计费计算；它不会扩大模型上下文窗口，也不会让变化后的内容自动命中。设计重点是稳定前缀、动态后缀、供应商适配、失效策略和可观测性。

## 为什么前缀顺序决定命中

许多缓存机制围绕请求前缀工作：工具定义、长期政策和共享示例放在前面，用户问题、当前时间、随机 ID 与工具结果放在后面。只要稳定区中间插入一个动态字段，后续前缀都可能无法复用。

稳定不是“长期不改”，而是相同版本的请求按确定顺序序列化。对象键顺序、空白、工具列表、图片、模型与供应商参数是否参与匹配，要以具体接口为准；应用不应自创一个通用命中规则。

## 推荐的请求分区

**稳定前缀**：应用政策、任务定义、工具 Schema、固定输出契约、经审核示例。按变更频率从低到高排列。

**动态后缀**：用户本轮输入、当前权限状态、检索结果、时间、会话状态和工具返回。不要为了提高命中率缓存可能过期的授权或实时数据。

![稳定前缀与动态后缀经供应商适配进入自动或显式缓存，并观测命中、延迟和成本](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/prompt-cache-design-stable-prefix-v1.webp)
*图：命中依赖供应商定义的前缀匹配；缓存复用计算，但不增加上下文长度。*

## 自动缓存与显式缓存

缓存接口大致有两类：

- **自动前缀缓存**：供应商识别满足条件的重复前缀，应用仍发送完整请求，并从 usage/指标判断是否命中；
- **显式缓存对象或断点**：应用创建缓存资源或标记可缓存边界，后续请求引用它，并负责生命周期与失效。

这只是工程分类，不是跨供应商标准。同一家供应商也可能按 API 产品或模型提供不同机制。

## 截至 2026-07-15 的供应商差异

- **OpenAI** 的[Prompt Caching 指南](https://developers.openai.com/api/docs/guides/prompt-caching)描述了自动对重复前缀进行缓存优化，并建议将静态内容放在前、动态内容放在后；可从响应 usage 中观察缓存 token。支持模型、最小长度、保留方式和计费以当期文档为准。
- **Anthropic** 的[Prompt caching 文档](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)描述自动缓存与显式 `cache_control` 断点等模式，并提供不同生命周期选项。命中依赖缓存前缀，TTL、可缓存区块和定价是供应商特性。
- **Gemini** 的[Context caching 指南](https://ai.google.dev/gemini-api/docs/caching)区分隐式与显式缓存；当前 Interactions API 与旧 `generateContent` 路线的能力并不完全相同。[GenerateContent 缓存说明](https://ai.google.dev/gemini-api/docs/generate-content/caching)应与所用 API 一起核对。

这些细节高度时效化。代码中应由供应商适配器封装，不把阈值、TTL 或 usage 字段散落在业务逻辑中；升级前重新阅读官方文档并运行命中测试。

## 缓存键与版本设计

即使由供应商自动匹配，应用也应维护自己的逻辑指纹，用于观测和失效：

```text
prefix_fingerprint = hash(
  provider + model + policy_version + toolset_version
  + schema_version + example_set_version + serializer_version
)
```

它不一定等于供应商实际缓存键，但能解释一次请求期望复用哪个前缀。任何影响模型可见内容或语义的变更都应产生新版本，不能为了命中把旧安全政策继续缓存。

## 失效不是只等 TTL

以下变化应主动视为新前缀或删除显式缓存：安全政策更新、工具参数/权限变化、输出 Schema 变化、示例修正、模型/端点变化、数据授权范围变化。对于共享缓存，还要确认缓存资源是否按项目、组织、区域或账号隔离。

不要缓存短期凭证、用户秘密或实时授权结论。即使供应商承诺隔离与保留策略，应用也只应发送完成任务所需的数据，并遵守自身数据政策。

## 怎样算是否值得

缓存收益取决于稳定前缀 token 数、复用次数、命中率、缓存写入/存储价格、命中读取价格和额外管理成本。用真实 usage 估算：

```text
净收益 = 未缓存基线成本
       - 缓存写入与存储
       - 缓存读取
       - 失效与额外请求成本
```

同时看首 token 延迟与 P95，而不是只看账单。低复用、频繁变更或很短的前缀可能不值得显式管理。

## 可观测性

每次请求记录供应商、模型、逻辑前缀指纹、预期缓存模式、输入 token、供应商返回的缓存读写 token、首 token 延迟和错误。按指纹聚合命中率，区分冷启动、版本切换和意外 miss。

当命中率突然下降时，比较最终序列化请求：工具顺序是否变化，模板是否插入时间，示例排序是否不稳定，供应商模型是否切换。不要只在源码模板上找差异。

## 一个稳定装配策略

1. 对工具和固定片段做确定性排序；
2. 固定序列化方式与模板版本；
3. 按更新频率从低到高排列前缀区块；
4. 把时间、请求 ID、用户输入和检索内容推到后缀；
5. 通过适配器选择自动或显式缓存；
6. 在测试环境连续发送等价请求，确认 usage 的真实命中；
7. 修改每个关键区块，验证预期失效；
8. 将质量回归与缓存性能一起纳入发布门禁。

## 常见误区

- 缓存等于增加上下文窗口；
- 文本“意思一样”就一定命中；
- 为了命中缓存实时权限和工具结果；
- 只记录总体输入 token，不记录缓存读写；
- 将某供应商 TTL、阈值和计费写成通用常量；
- 安全政策更新后仍强求旧缓存命中。

## 小结

Prompt Cache 的工程价值来自可复用的稳定前缀，而不是隐藏魔法。把政策、工具和示例确定性地放在前面，把实时数据放在后面；用供应商适配器封装自动/显式机制，以版本驱动失效，并用真实 usage、延迟和成本验证收益。缓存提高复用效率，但绝不能替代上下文预算、数据授权或质量评估。

## 参考资料

- [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Gemini API — Context caching](https://ai.google.dev/gemini-api/docs/caching)
- [Gemini API — GenerateContent caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)
