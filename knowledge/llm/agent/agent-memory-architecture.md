Agent 记忆不是把所有历史塞回上下文，而是让系统在正确时机写入、检索、引用、更新和删除信息。可靠架构首先区分“当前工作状态”和“跨任务持久知识”，再为每类记忆定义来源、生命周期和权限。

## 四类记忆的心智模型

[CoALA 论文](https://openreview.net/forum?id=1i6ZCvflQJ)把语言 Agent 视为具有记忆模块与决策过程的认知架构，而不是一个不断增长的提示词。工程上可用四类记忆理解：

- **工作记忆**：当前目标、最近对话、计划和工具结果，位于有限上下文；
- **情景记忆**：某次会话或任务发生了什么，带时间线与结果；
- **语义记忆**：从证据提炼的事实、偏好和概念；
- **程序记忆**：策略、工作流、工具说明和操作规则。

这些类别可以落在同一数据库，但检索和更新策略不同。用户今天说“本次用英文”可能只属于当前线程；“长期偏好英文”需要明确同意后才写入语义记忆；安全策略则不能由普通对话覆盖。

![Agent 的当前目标、最近回合和计划位于 Active Context，记忆管理器从情景、语义、程序与原始证据层按写入策略、检索、排序和引用规则取用](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-memory-architecture-tiered-memory-v1.webp)
*图：Active Context 是工作集，不是永久仓库；所有可引用结论保留到 Raw Evidence 的来源链。*

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

## 检索与上下文组装

检索不是只做向量相似度。先按 namespace、权限、状态、有效期和类型过滤，再综合语义相关性、时间、重要性与来源质量排序，最后去重和分配 token 预算。[Generative Agents](https://arxiv.org/abs/2304.03442)展示了基于 recency、importance 和 relevance 的检索，以及 reflection、planning 等机制；论文结果是研究原型，不等于生产默认值，但这些维度很有启发。

组装时把“用户原话”“系统事实”“推断摘要”标成不同 trust level。记忆内容以数据形式进入模型，不拼进高权限系统指令。最终回答引用 record ID 和 sourceRefs，便于审计。

## 程序记忆与策略分离

工具技巧、成功范式可形成程序记忆，但授权和安全策略必须由版本化配置管理，不能让模型从一次成功操作推断“以后都允许”。程序记忆只能建议步骤；执行层仍校验权限、参数和审批。

同样，不要让外部文档通过“请记住”写入长期规则。对网页、邮件和工具结果使用 untrusted 标签，并限制其可写目标。

## 更新、忘记与一致性

事实会变化。更新采用 append + supersede：保留旧记录来源，新增版本并标记当前视图。过期、用户撤回同意或删除请求触发失效/删除流程。缓存、向量索引、搜索索引和备份策略都要同步，不能只删主表。

跨组件使用 record version 或事件序列。异步索引暂时落后时，检索层检查主记录状态，避免把已删除/已替代的向量结果放回上下文。

## 测试与指标

测试应覆盖跨用户隔离、错误摘要写入、同意撤回、事实冲突、索引延迟、旧版本检索、提示注入要求写程序记忆、删除传播和来源权限变化。用可解释 fixture 验证检索到“正确的少量记录”，不只测召回率。

指标包括候选接受率、检索命中与利用率、无关记忆注入、陈旧率、冲突率、来源覆盖、写入/检索延迟、每轮 token 节省和删除传播时间。高命中率不一定好：模型频繁检索但不使用，说明路由或排序有问题。

## 小结

Agent 记忆是分层、受策略控制的数据系统：工作记忆服务当前任务，情景记录经历，语义保存有来源的稳定知识，程序记忆提供可复用方法。写入要经过用途与质量门，检索先授权再排序，所有派生记忆保留 provenance，并支持版本更新和完整删除。

## 参考资料

- [Sumers et al. — Cognitive Architectures for Language Agents](https://openreview.net/forum?id=1i6ZCvflQJ)
- [Packer et al. — MemGPT](https://arxiv.org/abs/2310.08560)
- [LangGraph — Add and manage memory](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [Park et al. — Generative Agents](https://arxiv.org/abs/2304.03442)
