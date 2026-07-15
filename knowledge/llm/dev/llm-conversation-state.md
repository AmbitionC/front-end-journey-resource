大模型没有天然的“会话记忆”。模型只看到本次请求携带或由供应商会话对象关联的上下文；应用真正需要保存的是用户与权限、业务事实、消息事件、工具副作用、摘要版本和供应商引用。把这些全部混成一串聊天消息，迟早会遇到丢状态、重复扣费、并发覆盖和不可审计的问题。

## 先确定谁是权威状态

生产系统通常同时存在四种状态：

- **业务状态**：订单、工单、审批结果等结构化事实，由业务数据库负责；
- **会话事件**：用户输入、模型输出、工具调用、人工编辑和错误，采用追加式记录；
- **模型上下文**：为本轮生成挑选的消息、摘要和检索片段，是可重建投影；
- **供应商状态**：响应链、conversation/interaction ID 或临时文件引用，是优化手段而非唯一账本。

![应用数据库作为权威会话账本，为多端与后台任务构造临时模型上下文](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-conversation-state-authoritative-state-v1.webp)
*图：持久会话状态属于应用；模型上下文是从权威状态构造出的有预算视图。*

核心原则是：供应商保存状态可以减少传输和编排代码，但不能替代应用自己的授权、审计与恢复能力。否则一旦切换供应商、对象过期或用户要求删除数据，应用无法证明发生过什么。

## 三种上下文管理模式

### 客户端重放历史

应用每次把所需消息重新发送。优点是透明、容易跨供应商和离线重建；缺点是请求变大、需要自己裁剪，并可能重复发送敏感内容。重放不等于免费：历史通常仍作为输入参与计量。

### 响应链

新请求引用上一响应，供应商负责串联上下文。它适合短链路和快速原型，但应用仍要保存引用、处理分叉，并确认保留与计费规则。响应 A 派生 B、C 时已经形成分支，不能只用一个 `last_response_id` 覆盖。

### 持久会话对象

供应商提供可长期追加 item 的 conversation 或 interaction 对象，可能跨设备或任务使用。它降低同步成本，但引入生命周期、区域、删除、并发和迁移依赖。生产中应把供应商对象 ID 视为应用会话的一个外部索引。

这三种模式可以混用：应用保留权威事件日志，实时路径使用响应链，后台任务从事件日志重建上下文，关键事实始终从业务数据库读取。

## 推荐的数据模型

不要只有 `messages JSON` 一列。最小结构可分为：

```text
Conversation
  id, tenant_id, user_id, version, status, created_at

ConversationEvent
  event_id, conversation_id, sequence, actor, kind,
  payload_ref, provider_ref, causation_id, created_at

ContextSnapshot
  snapshot_id, conversation_id, through_sequence,
  summary, protected_facts, source_event_ids, policy_version
```

`sequence` 与 `version` 用于乐观并发控制；`causation_id` 连接用户消息、模型响应和工具副作用；大文件或敏感正文可放在受控对象存储，事件只保留引用和摘要。删除时才能沿引用完成清理，而不是在一个 JSON 中做模糊搜索。

## 一轮对话怎样提交

一次可靠提交不是“先显示消息，再随手写库”，而是受控状态机：

1. 读取会话版本、权限与业务事实；
2. 追加用户事件，使用幂等键防止双击；
3. 根据 token 预算构造上下文投影；
4. 发起模型请求，记录本次供应商引用；
5. 流式增量只作临时显示，完整终态才提交 assistant 事件；
6. 工具调用先写意图，再由获权执行器执行并记录结果；
7. 用期望版本提交，冲突时重新读取并决定重放或分叉。

```ts
const turn = await appendUserEvent({
  conversationId,
  expectedVersion,
  idempotencyKey,
  contentRef,
});

const context = await buildContext({
  conversationId,
  throughSequence: turn.sequence,
  tokenBudget,
});
```

不要在流开始时就把不完整模型文字当作正式历史。客户端断网、用户取消或流内错误后，那段文字可能从未形成可复现的完整响应。

## 长会话不是不断追加

上下文窗口有限，而且越长不一定越准确。构造上下文时可分层：

1. 高优先级政策与当前权限；
2. 结构化业务事实和未完成任务；
3. 最近若干轮原文；
4. 更早历史的带来源摘要；
5. 按当前问题检索出的相关事件。

摘要必须标记覆盖到哪个 sequence、由哪个策略版本生成，并保留“不可丢失事实”，例如用户确认、金额、截止时间和工具副作用。新摘要不能直接覆盖旧事件；它只是可失效、可重建的投影。对重要场景，抽样比较原始历史与摘要回答，监测事实丢失和立场漂移。

## 多端、并发与分支

手机和网页可能同时发送下一轮，后台代理也可能追加工具结果。简单的最后写入胜出会悄悄覆盖历史。常见策略有：

- 对单一线性会话加短期写锁；
- 用版本号拒绝过期提交，让客户端重新基于最新序列发送；
- 明确允许分支，为每个分支保存 parent event；
- 工具副作用使用独立幂等键，避免重放模型回合时重复执行。

UI 应明确告诉用户“消息基于旧版本未发送”或“已创建分支”，而不是把冲突隐藏成模型回答异常。

## 截至 2026-07-15 的供应商差异

OpenAI 的[对话状态指南](https://developers.openai.com/api/docs/guides/conversation-state)描述了通过 `previous_response_id` 形成响应链，以及使用 Conversations API 持久化会话 item。文档也说明响应保存、`store` 选项和历史计量等当前行为；具体保留期与数据控制必须在上线时重新核对。

Gemini 的 [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview)支持用 `previous_interaction_id` 延续交互并提供服务端状态能力；而 `generateContent` 的 [Chat helper](https://ai.google.dev/gemini-api/docs/generate-content/text-generation)主要是 SDK 帮助应用组织并重发历史。两条接口不能只因都能“聊天”就视为相同状态模型。

其他供应商也会在消息、批次、文件和缓存接口中形成外部状态。统一层应保存 `provider`、对象种类、外部 ID、创建时间和删除状态，但不要把供应商保留期写死为应用的数据承诺。

## 隐私、删除与审计

会话状态需要数据分级：哪些可进入模型、哪些只留本地、哪些必须加密、哪些要按租户或区域隔离。用户删除会话时，要覆盖数据库事件、对象存储、向量索引、缓存以及可控制的供应商对象；若某类日志依法必须保留，应与可读正文分离并说明依据。

审计日志记录谁在何时读取、追加、导出或删除了会话，不记录密钥与不必要的完整正文。使用供应商会话对象前，确认数据使用、保存、删除和地域设置满足产品承诺。

## 常见误区

- 把上下文窗口当长期数据库；
- 只存最后一个供应商响应 ID，丢失分支；
- 认为引用前一响应就不会再次计量历史；
- 在流完成前提交 assistant 正式消息；
- 摘要覆盖原始事件，无法追溯事实；
- 多端并发使用最后写入胜出；
- 重放工具回合时重复发送邮件、扣款或改数据；
- 应用声明“已删除”，却遗漏文件、索引或供应商对象。

## 小结

会话管理的本质是状态所有权。业务事实由业务系统负责，会话事件由应用以可审计方式持久化，模型上下文按本轮预算构造，供应商响应链或会话对象只是可替换的外部能力。明确权威源、版本、因果关系、分支和删除路径，才能让对话跨设备、跨供应商并在故障后可靠恢复。

## 参考资料

- [OpenAI — Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)
- [Gemini API — Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Gemini API — Text generation and chat](https://ai.google.dev/gemini-api/docs/generate-content/text-generation)
