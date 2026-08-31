Agent 记忆不是把所有历史塞回上下文，而是让系统在正确时机写入、检索、引用、更新和删除信息。可靠架构首先区分“当前工作状态”和“跨任务持久知识”，再为每类记忆定义来源、生命周期和权限。

## 四类记忆的心智模型

[CoALA 论文](https://openreview.net/forum?id=1i6ZCvflQJ)把语言 Agent 视为具有记忆模块与决策过程的认知架构，而不是一个不断增长的提示词。工程上可用四类记忆理解：

- **工作记忆**：当前目标、最近对话、计划和工具结果，位于有限上下文；
- **情景记忆**：某次会话或任务发生了什么，带时间线与结果；
- **语义记忆**：从证据提炼的事实、偏好和概念；
- **程序记忆**：策略、工作流、工具说明和操作规则。

这些类别可以落在同一数据库，但检索和更新策略不同。用户今天说“本次用英文”可能只属于当前线程；“长期偏好英文”需要明确同意后才写入语义记忆；安全策略则不能由普通对话覆盖。

![Agent 记忆写入与召回策略：请求和运行上下文经过写入门，按用途进入事实、证据或检查点存储，冲突和低置信内容进入隔离区](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-memory-write-recall-policy-v1.svg)
*图：会话状态、长期事实与原始证据分开治理；相似度只能提供候选，不能替代写入授权、冲突检查和来源绑定。*

## 分层而不是无限上下文

[MemGPT](https://arxiv.org/abs/2310.08560)使用类似虚拟内存的分层思路，在有限上下文与更大外部存储之间管理信息。这个类比重要之处不是某个具体实现，而是承认：活跃上下文稀缺，换入什么、换出什么需要策略。

典型数据层：

```ts
type MemoryRecord = {
  id: string;
  namespace: string[];
  kind: 'episode' | 'semantic' | 'procedure';
  content: unknown;
  sourceRefs: string[];
  createdAt: string;
  validFrom?: string;
  validTo?: string;
  confidence: number;
  sensitivity: 'public' | 'internal' | 'personal' | 'secret';
  status: 'active' | 'superseded' | 'expired' | 'deleted';
  version: number;
};
```

原始对话、文件或工具响应存入证据层；MemoryRecord 是派生索引。事实记录不能失去 sourceRefs，否则后续无法判断摘要错误、信息过期或权限变化。

## 短期状态与长期存储

[LangGraph 的 memory 文档](https://docs.langchain.com/oss/python/langgraph/add-memory)区分 thread-scoped 的 short-term memory 与按 namespace 管理的 long-term store。短期状态随线程 checkpoint 演进，适合最近消息与计划；长期记忆跨线程检索，需要独立的 store、命名空间和写入规则。

命名空间至少隔离租户、用户、应用和记忆类型。不要只用可猜的 user ID 作为唯一边界；存储层还要按主体授权。共享团队知识与个人偏好分开，避免一个人的输入影响所有用户。

## 写入管线

不是每句话都值得记住。写入依次经过：候选提取、敏感性分类、用途/同意检查、去重与冲突检测、证据绑定、质量验证、持久化。候选可分为：用户明确要求记住、任务产出的稳定事实、成功/失败经验、运行策略更新。

模型提出 memory candidate，受信任服务决定是否写。策略可以要求：长期个人偏好必须有显式同意；秘密默认不持久化；外部网页内容不得成为程序记忆；低置信事实只保存为待验证候选。

### Markdown、RAG 与 Checkpoint 不是三选一

面试中常问“为什么记忆用 Markdown，不用 RAG”。正确回答应先指出三者不是同一层：

| 载体 | 适合保存 | 优点 | 主要边界 |
|---|---|---|---|
| Markdown / 结构化事实文件 | 少量、稳定、需要人工审阅的项目约束与结论 | 可读、可 diff、可版本化 | 全量扫描会随规模变慢，缺少天然权限与冲突治理 |
| RAG 证据库 | 大量、动态、需要按查询召回的原文与历史片段 | 可扩展、按需取证 | 相似不等于真实，召回结果必须保留来源与权限 |
| Checkpoint / 事件存储 | 当前 Run 的步骤、待办、工具结果与副作用状态 | 可恢复、可重放 | 不应被当作跨任务长期知识 |

可组合做法是：Checkpoint 保存“任务做到哪”，Markdown 保存经过验证的少量稳定事实，RAG 保存可回溯的原始证据。回答“为什么选 Markdown”时，应给出实际规模、更新频率、审阅需求和迁移阈值；不能把文件格式包装成通用记忆架构。

### 语义匹配怎样参与可靠更新

语义相似度只负责召回可能相关的旧记录。写入服务还要比较主体、事实类型、时间范围、来源和否定关系，再选择 `append`、`supersede`、`merge` 或 `quarantine`。例如“这次用英文”和“长期偏好英文”向量可能很近，却不应互相覆盖。

阈值应在标注过的冲突/重复样本上校准，并为临界区设置人工复核或保守追加；记录模型、Embedding、阈值与候选版本，便于重放。更新失败时保留原记录，不能因一次模型判断覆盖已验证事实。

## 检索与上下文组装

检索不是只做向量相似度。先按 namespace、权限、状态、有效期和类型过滤，再综合语义相关性、时间、重要性与来源质量排序，最后去重和分配 token 预算。[Generative Agents](https://arxiv.org/abs/2304.03442)展示了基于 recency、importance 和 relevance 的检索，以及 reflection、planning 等机制；论文结果是研究原型，不等于生产默认值，但这些维度很有启发。

组装时把“用户原话”“系统事实”“推断摘要”标成不同 trust level。记忆内容以数据形式进入模型，不拼进高权限系统指令。最终回答引用 record ID 和 sourceRefs，便于审计。

## 程序记忆与策略分离

工具技巧、成功范式可形成程序记忆，但授权和安全策略必须由版本化配置管理，不能让模型从一次成功操作推断“以后都允许”。程序记忆只能建议步骤；执行层仍校验权限、参数和审批。

同样，不要让外部文档通过“请记住”写入长期规则。对网页、邮件和工具结果使用 untrusted 标签，并限制其可写目标。

## 更新、忘记与一致性

事实会变化。更新采用 append + supersede：保留旧记录来源，新增版本并标记当前视图。过期、用户撤回同意或删除请求触发失效/删除流程。缓存、向量索引、搜索索引和备份策略都要同步，不能只删主表。

跨组件使用 record version 或事件序列。异步索引暂时落后时，检索层检查主记录状态，避免把已删除/已替代的向量结果放回上下文。

### 跨会话关联与并发写入

跨会话记忆的主键不能只用 `session_id`。推荐把 `tenant_id + subject_id + memory_type + record_id` 作为隔离维度，session 只保留“这次对话”的作用域。检索先由受信任服务按 tenant/subject 做权限过滤，再执行语义召回；不能先全库向量检索、最后才让模型判断属于谁。

同一用户可能同时运行多个 Agent。写入时使用版本号/CAS 或 append-only 事件，冲突后重新读取并合并；摘要生成也记录它消费到的最后事件序号。这样旧任务晚完成时不会覆盖新事实。若多 Agent 需要共享团队知识，单独使用 team namespace，并限制可写角色，不能把个人记忆直接“提升”为团队事实。

## 测试与指标

测试应覆盖跨用户隔离、错误摘要写入、同意撤回、事实冲突、索引延迟、旧版本检索、提示注入要求写程序记忆、删除传播和来源权限变化。用可解释 fixture 验证检索到“正确的少量记录”，不只测召回率。

指标包括候选接受率、检索命中与利用率、无关记忆注入、陈旧率、冲突率、来源覆盖、写入/检索延迟、每轮 token 节省和删除传播时间。高命中率不一定好：模型频繁检索但不使用，说明路由或排序有问题。

## 小结

Agent 记忆是分层、受策略控制的数据系统：工作记忆服务当前任务，情景记录经历，语义保存有来源的稳定知识，程序记忆提供可复用方法。写入要经过用途与质量门，检索先授权再排序，所有派生记忆保留 provenance，并支持版本更新和完整删除。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Coding Agent 日常实习一面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-10.md)（cluster-1b2940d40f2e）
- [腾讯 AI 应用开发面试：跨会话记忆与多 Agent（2026 年 4 月）](../../../interview/tencent/ai/tencent-ai-4.md)（cluster-2fc69bb3d45d）
- [字节豆包 Seed Agent 开发一面：状态、容错与效果评测（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-20.md)（cluster-418d84d3fe66）
- [OPPO AI 全栈一面：Prompt 到 UI、RAG 与前端性能（2026 年 8 月）](../../../interview/oppo/ai/oppo-ai-2.md)（cluster-4a37152b165a）
- [腾讯 Agent 项目二面：记忆、RAG 与 MCP（2026 年 5 月）](../../../interview/tencent/ai/tencent-ai-2.md)（cluster-7568c06b462a）
- [腾讯 CSIG 后台开发一面：Agent Memory、SkillRouter 与多 Agent Code Review（2026 年 7 月）](../../../interview/tencent/ai/tencent-ai-9.md)（cluster-757b7d499173）
- [腾讯 AI 开发一面：Coding Agent 记忆、评测与可靠运行（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-8.md)（cluster-7ef1a4a8ef82）
- [蚂蚁 AI 开发一面：协作式 Agent、交付门禁与后端基础（2026 年 8 月）](../../../interview/antfin/ai/antfin-ai-4.md)（cluster-910d0b20a897）
- [百度后端 Go / Agent 一面：会话恢复、记忆冲突与评测（2026 年 8 月）](../../../interview/baidu/ai/baidu-ai-2.md)（cluster-9acb30c57710）
- [淘宝闪购 Agent 算法一面：框架选型、人工接管与线上安全（2026 年 4 月）](../../../interview/alibaba/ai/alibaba-ai-6.md)（cluster-e392a4fd1f33）
<!-- interview-source-history:end -->

## 参考资料

- [Sumers et al. — Cognitive Architectures for Language Agents](https://openreview.net/forum?id=1i6ZCvflQJ)
- [Packer et al. — MemGPT](https://arxiv.org/abs/2310.08560)
- [LangGraph — Add and manage memory](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [Park et al. — Generative Agents](https://arxiv.org/abs/2304.03442)
