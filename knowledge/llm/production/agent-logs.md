结构化日志的目标不是“把 Agent 想过的所有东西都保存下来”，而是用最少、稳定、可查询的事实回答：谁在何时发起了哪次 Run，系统做了什么决定，调用了哪个版本的模型或工具，结果如何，哪些字段被脱敏，后续如何关联到 Trace 与审计证据。

[OpenTelemetry 对信号的区分](https://opentelemetry.io/docs/concepts/signals/)很实用：Trace 表达请求路径，Metric 表达运行时测量，Log 记录事件。三者应共享关联 ID，但承担不同责任；把所有内容都塞进日志，既昂贵，也会失去因果结构。

![结构化 Agent 日志通过 Trace、Run、Span 标识关联并在入库前脱敏](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-logs-correlation-flow-v1.webp)

图中的隐私过滤器必须位于日志存储之前。若先把 Prompt、密钥和工具结果落进通用日志，再依赖查询权限“保护”，原始敏感数据已经进入了复制、备份和导出链路。

## 日志事件的最小信封

所有组件可以共享一个稳定信封，并允许 `details` 按事件类型扩展：

```json
{
  "timestamp": "2026-07-16T12:03:04.123Z",
  "observedTimestamp": "2026-07-16T12:03:04.281Z",
  "eventName": "tool.call.completed",
  "severity": "INFO",
  "service": "agent-worker",
  "environment": "prod",
  "runId": "run_01J...",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "eventId": "evt_01J...",
  "schemaVersion": 4,
  "outcome": "success",
  "details": {
    "tool.name": "invoice.lookup",
    "tool.version": "2026-07-10",
    "durationMs": 183,
    "result.classification": "internal"
  }
}
```

`timestamp` 是事实发生时间，`observedTimestamp` 是采集器观察到它的时间；队列拥塞时二者不同。`eventId` 支持至少一次投递下的去重，`schemaVersion` 支持消费者逐步迁移。`eventName` 应来自受控词表，而不是动态拼入用户、文件名或异常文本。

[OpenTelemetry 的事件语义约定](https://opentelemetry.io/docs/specs/semconv/general/events/)指出，事件应有发生时间、名称、严重级别和适于筛选/聚合的结构化属性；有持续时间的工作应使用 Span，描述整段操作的属性则放在 Span 上。遵循这条边界，日志不会退化成另一套不完整的 Trace。

## 关联上下文怎么传

Run ID 表达产品执行，Trace ID 表达因果传播，Span ID 表达当前操作。HTTP 调用、队列消息、工具网关和后台 Worker 都应显式传播 Trace Context；本地日志库从当前上下文自动注入三个 ID，业务代码不必每次手工拼接。

异步消息要考虑重复和延迟：生产事件记录 message ID 与发送 Span，消费事件记录同一 message ID，并延续或 Link 原 Trace。不要因为日志到达顺序不同就认为业务顺序相反；调查时使用发生时间、因果 ID 和消息序号共同还原。

人工审批、浏览器操作和长任务恢复也要保留 Run ID。一次恢复可以开启新 Trace，但日志仍能按 Run 聚合。若只依赖线程局部变量，跨进程、跨队列后关联必然断裂。

## 应该记录哪些事件

优先记录会改变状态、责任或诊断路径的事实：

- Run 接受、开始、暂停、恢复、取消、完成；
- 计划版本被选用、关键分支被采用；
- 模型调用开始/完成及用量摘要；
- 工具请求、审批决策、执行结果与后置条件；
- 重试被调度、熔断或降级被触发；
- 输入/输出被策略拦截、脱敏或截断；
- 记忆写入、更新、撤销、过期；
- 安全策略版本、授权主体和审计结果。

不要把每个 token、每次循环变量和整段模型输出默认记为日志。高频流式片段可用指标计数或受控采样；需要原文做质量调查时，写入独立证据仓库，日志只保存对象引用、内容哈希、分类和访问策略。

## 敏感数据最小化

2026-07-16 查看 OpenTelemetry GenAI 属性注册表时，系统指令、消息、检索查询、工具参数与结果等字段都带有敏感信息警告。[GenAI 属性注册表](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/)还显示这些字段处在演进中，因此不能简单开启“记录内容”开关后长期不审计。

一条可执行的数据策略应按字段定义：是否允许采集、数据分类、脱敏方式、谁能读取、保留多久、是否可导出。常见处理包括：

- 密钥、令牌、密码：永不记录，命中即阻断并告警；
- 邮箱、手机号、身份证件：结构化识别后掩码或不可逆散列；
- Prompt/结果：默认不记录原文，只记录长度、分类、哈希和受控证据引用；
- 工具参数：Schema 级允许列表，拒绝未知字段进入日志；
- 文件与 URL：移除查询参数、签名和本地路径，仅保留规范化域名或对象 ID。

脱敏必须在应用或边车的可信边界内完成，且在任何网络导出、缓冲落盘之前。采集器二次过滤是防御纵深，不应成为唯一防线。

## 严重级别与结果分类

严重级别描述运维影响，不应由 `catch` 与否机械决定。用户输入验证失败通常是 INFO 或 WARN；依赖短暂失败并成功重试可能是 WARN；数据完整性破坏、越权尝试、无法恢复的关键流程才是 ERROR 或更高。

同时使用独立的 `outcome` 与 `error.type`。`severity=ERROR`、`outcome=failure`、`task_quality=failed`是三个不同维度：日志错误可能被恢复，技术成功也可能产生低质量答案。混用会让告警和统计互相污染。

## Schema 演进与兼容

结构化日志实际上是一套公共 API。新增可选字段通常向后兼容；重命名、改变类型、改变枚举含义则需要新 Schema 版本和双写迁移期。消费者应对未知字段宽容，对关键字段缺失明确失败；不能靠“大家同时上线”维持脆弱一致性。

建议为事件 Schema 建立自动测试：必填字段、枚举、长度上限、敏感字段禁用、Trace ID 格式和时间戳顺序。日志库提供统一构造器，业务团队只填领域细节，避免同一事件在十个服务里有十种拼写。

## 存储、索引与保留期

不是所有字段都值得索引。Trace ID、Run ID、事件名、结果、错误类型、服务、版本和低基数任务类型适合索引；长消息、堆栈和大对象应放冷存储或证据仓库。高基数字段无节制索引会同时增加成本和查询延迟。

保留期按用途与风险区分：实时排障索引可能保留 7–30 天，聚合指标更久，审计记录按合规要求保留，敏感原文尽可能短。删除请求要覆盖索引、副本、对象存储和导出，而不是只删搜索界面中的一条记录。

## 调查路径

一个可操作的调查流程通常从告警或用户投诉开始：先用 Run ID 找到生命周期事件，再用 Trace ID 查看调用瀑布，用 Span ID 聚焦某次工具或模型操作，最后在获得授权后读取受控证据。日志应保留策略版本、组件版本和采样决策，使“为什么当时允许这个动作”可以重建。

若调查只能全文搜索“timeout”，说明结构化程度仍不够。稳定的 `error.type=tool.timeout`、`tool.name`、`retry.count`和`agent.version`能快速得到失败切片，并选择有代表性的 Trace，而不是浏览成千上万行文本。

## 常见误区

- 将完整 Prompt、模型输出和工具返回值默认写进通用日志。
- 只记录 Run ID，不传播 Trace Context，跨服务后无法恢复因果关系。
- 把事件名动态拼上用户或 URL，造成高基数和无法治理的 Schema。
- 先入库后脱敏，忽略缓冲、备份和导出已经复制了原文。
- 用异常堆栈作为唯一结构，无法按错误类型、版本和工具聚合。
- Schema 改名不做版本迁移，让大盘在上线当天悄悄改变含义。

## 小结

Agent 结构化日志是一套最小事实协议：稳定事件名、发生时间、Run/Trace/Span 关联、结果、错误与版本。内容采集必须最小化并在入库前脱敏，Schema 与保留期需要像产品 API 一样治理。日志负责可查询事实，Trace 负责因果路径，证据仓库负责受控原文；三者分工后，系统才能兼顾调试能力、成本与隐私。

## 参考资料

- [OpenTelemetry：Signals](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry：Semantic conventions for events](https://opentelemetry.io/docs/specs/semconv/general/events/)
- [OpenTelemetry：GenAI attributes registry](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/)
