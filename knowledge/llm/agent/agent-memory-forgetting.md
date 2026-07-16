Agent 的“遗忘”不是数据库里随便删一行，而是让无效、过期、冲突或不再获准使用的信息退出当前决策，同时保留必要的版本与审计语义。没有遗忘策略，记忆越多，陈旧事实、错误偏好和隐私风险就越大。

## 四种不同动作

先区分：

- **衰减（decay）**：降低检索权重，不改变原始事实；
- **过期（expire）**：超过有效期后不再进入当前视图；
- **替代（supersede）**：新版本成为 current，旧版本保留来源链；
- **删除（delete）**：因用户请求、政策或数据治理要求移除，并传播到索引与缓存。

把四者都实现成 `DELETE FROM memory` 会丢失冲突历史，也无法区分“过时”与“从未存在”。反过来，只标软删除却继续让向量索引召回，也不是真正退出使用。

![记忆目录中的来源、时间、置信度和状态经过 TTL、相关性、同意与冲突策略，执行衰减、过期、替代或删除；冲突事实保留来源并生成独立 Current View](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-memory-forgetting-conflict-update-v1.webp)
*图：Current View 是版本折叠结果；Supersede 不抹去历史，Delete 留下不含原文的审计记录。*

## 状态模型

```ts
type MemoryStatus =
  | { kind: 'active'; version: number }
  | { kind: 'superseded'; by: string; at: string }
  | { kind: 'expired'; reason: string; at: string }
  | { kind: 'deleted'; tombstoneId: string; at: string };
```

记录同时保存 `validFrom/validTo`、来源时间和摄取时间。网页“当前价格”即使刚写入，也可能很快过期；用户生日通常长期有效；一次会话的语言偏好只在 thread 范围有效。TTL 按语义配置，不能全库一个数字。

[LangGraph memory 文档](https://docs.langchain.com/oss/python/langgraph/add-memory)提供长期 store 的创建、更新、删除等机制，但“何时忘记”仍由应用定义。框架能执行删除，不会替你决定隐私、冲突和有效期。

## 检索权重与衰减

衰减适合“可能仍有价值但近期不重要”的记忆。权重可以综合相关性、recency、importance、使用反馈和来源可靠性。[Generative Agents](https://arxiv.org/abs/2304.03442)使用 recency、importance 和 relevance 组织记忆检索，为这种策略提供研究参考。

不要让被频繁检索的错误记忆因“使用次数高”不断强化。负反馈、纠错和来源撤回必须能降低权重或直接失效。高风险事实如权限与支付信息不依赖软衰减，而应在有效期后硬性排除。

## 冲突与替代

新事实与旧事实冲突时，先判断：是否同一实体、同一字段、同一时间范围和同一来源语义。不同时间的地址不是矛盾，而是版本；两个来源同时声称当前地址才需要仲裁。

冲突记录包含候选值、来源、时间、置信度和状态。可由用户明确更正时，新记录 supersede 旧记录；可由权威 API 验证时重新读取；无法判断时，current view 标记 disputed，回答中暴露不确定性。不要按“最后写入”静默获胜。

[CoALA](https://openreview.net/forum?id=1i6ZCvflQJ)把记忆与决策过程放在完整认知架构中理解。工程含义是：存储中的记录不等于决策可直接使用的知识，策略和检索层需要构造 current view。

## 删除与 tombstone

删除流程先验证主体和范围，建立不含敏感原文的 tombstone，随后删除主记录、向量、关键词索引、缓存、派生摘要和下游副本。备份通常按既定生命周期到期，不应为了单条删除破坏恢复能力，但恢复后必须重新应用删除日志。

Tombstone 只保存最小标识、请求时间、处理状态和政策依据，防止被删除内容因“审计”再次复制。跨服务使用 deletion event 和幂等键；每个消费者确认完成，超时进入补偿或人工处理。

[NIST Privacy Framework](https://www.nist.gov/privacy-framework)强调以风险为基础管理数据处理。具体法律义务因地区和场景不同，技术系统至少要能发现数据位置、执行策略、证明传播状态，而不是在 UI 上显示“已删除”就结束。

## 同意和用途变化

用户允许某信息服务当前任务，不等于允许永久记忆或用于训练/分析。记录用途、合法/政策依据、同意版本与作用域。同意撤回时，先停止新的检索和处理，再执行删除或保留例外；例外必须由政策服务决定，不能由 Agent 自行解释。

程序记忆也会失效。工具 schema、供应商 API 和内部流程更新后，旧 playbook 应按版本替代；执行层始终以当前策略和工具描述为准。

## 一致性与竞态

删除和更新期间可能有正在运行的 Agent 已把旧记忆读入上下文。记录 `memorySnapshotVersion`，在高风险工具调用前重新检查相关事实与权限；发现版本变化就中止或重规划。索引是派生数据，检索结果返回后再向主存储确认 status/version。

多个更新使用 compare-and-set，避免最后写入覆盖他人纠正。异步处理器必须幂等；重复删除事件应得到相同终态。

## 测试与观测

测试 TTL 边界、时钟偏差、同意撤回、冲突事实、并发更新、删除事件重复/乱序、索引延迟、备份恢复后的删除重放和跨用户隔离。断言被删除或过期记录不会重新进入上下文，superseded 记录仍可用于审计但不作为 current。

指标包括过期记录召回率（应为零）、冲突未决时长、纠错传播延迟、删除完成率、索引残留、tombstone 错误、恢复后重删结果和长期记忆规模。监控内容本身要脱敏，避免为了证明删除而记录原文。

## 小结

遗忘是记忆生命周期控制：衰减改变排序，过期退出有效集合，替代保留版本链，删除传播到所有派生副本。通过来源、时间、状态、同意与 current view 分层，Agent 才能纠错、尊重删除并避免让陈旧记忆持续支配决策。

## 参考资料

- [LangGraph — Add and manage memory](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [Park et al. — Generative Agents](https://arxiv.org/abs/2304.03442)
- [Sumers et al. — Cognitive Architectures for Language Agents](https://openreview.net/forum?id=1i6ZCvflQJ)
- [NIST — Privacy Framework](https://www.nist.gov/privacy-framework)
