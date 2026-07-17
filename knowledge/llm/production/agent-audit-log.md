Agent 审计日志回答的不是“服务有没有报错”，而是“谁以什么身份，在什么策略和版本下，对什么资源做了什么，系统为何允许，产生了什么可验证结果”。它既服务于安全调查与合规留痕，也必须避免把 Prompt、密钥和个人数据复制进一个更难治理的日志系统。

[NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final)把日志管理视为生成、传输、存储、访问、分析、保留和处置的完整生命周期。审计设计因此不能停在一条 JSON Schema；采集端、传输链、写入权限、时间、完整性、查询审批和删除都属于证据链。

![Agent 事件经规范化形成带序号的规范记录，再通过哈希链和签名批次进入只追加归档，并由独立验证器校验](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-audit-log-evidence-chain-v1.webp)
*图：可验证性来自有序记录、完整性保护、受限写入和独立校验，不来自一个名为 immutable 的布尔字段。*

## 审计、运行日志和 Trace 的边界

运行日志帮助排障，Trace 描述一次调用的因果路径，审计记录权限与状态变化的关键事实。三者可以共享 runId、traceId、spanId 和主体标识，但生命周期不同。调试日志可以采样，关键授权和副作用事件不能因为采样丢失；Trace 过期后，审计证据仍可能需要保留。

[OpenTelemetry Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)提供了有用的关联字段：事件时间、采集时间、资源、属性、TraceId 和 SpanId。它解决统一表达与关联，不自动提供合规意义上的不可抵赖、保留或写入者身份验证。

## 事件信封

一条审计事件应最少包含：

~~~json
{
  "eventId": "evt_01J...",
  "sequence": 18421,
  "eventTime": "2026-07-17T02:13:44.319Z",
  "observedTime": "2026-07-17T02:13:44.507Z",
  "tenantId": "t_42",
  "actor": {"type": "user", "id": "u_7", "authn": "passkey"},
  "delegate": {"type": "agent", "id": "support-agent", "runId": "run_9"},
  "action": "customer.refund.request",
  "resource": {"type": "order", "id": "ord_8"},
  "decision": "allow",
  "policy": {"id": "refund-policy", "version": "2026-07-10"},
  "outcome": "committed",
  "operationId": "op_31",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "schemaVersion": 3,
  "evidenceRefs": ["obj://audit-evidence/sha256/..."]
}
~~~

actor 表示发起主体，delegate 表示代表其行动的 Agent 或服务；二者不能合并，否则无法解释授权委托链。decision 表示策略判定，outcome 表示实际结果；允许后执行失败，与拒绝执行是两类事件。operationId 用于副作用对账，evidenceRefs 指向受控证据而不是把原文塞进日志。

## 规范化和顺序

不同服务先把领域事件映射到受控词表，再进入中央写入管道。事件名、动作、结果和资源类型使用稳定枚举，禁止把用户名、URL 或异常文案拼进字段名。时间必须统一为带时区的高精度格式，同时保留 eventTime 与 observedTime，以区分业务发生顺序和采集到达顺序。

分布式系统不存在天然全局时钟。sequence 可以是每租户、每分区或每聚合根的有序编号，并记录分区标识；不要伪造一个无法保证的全局严格顺序。调查时结合序号、因果 ID、消息 ID 和时间还原事实。

## 完整性保护

防篡改并不等于任何人都不能删除一字节。更可操作的目标是：未授权修改会被发现，授权处置有记录，证据能由独立方验证。常见做法是对规范序列化后的记录计算摘要，把前一条或前一批摘要写入下一批，周期性签名批次根，并把根锚定到权限和故障域独立的存储。

[RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html)定义了 HTTP 消息签名的组件覆盖、算法和签名参数，可用于保护传输中的审计提交请求；它不替代归档端的有序哈希链、访问控制和保留策略。签名只证明持有密钥的一方签过所覆盖内容，仍需可靠地绑定服务身份、密钥轮换和时间。

写入账号只有追加权限，查询账号不能改写，保留期处置由单独角色批准。签名密钥放在受管密钥系统，验证器周期性重算链并将结果写到独立位置。任何断链、重复序号、时间回退或 Schema 不可解析都应报警。

## 敏感数据与证据仓库

审计记录默认保存标识符、分类、摘要、长度和对象引用，而不是 Prompt、模型完整输出、文件内容、令牌和工具秘密。确需调查原文时，把内容放入单独加密的证据仓库，使用更严格的审批、短保留期、访问水印和访问审计。

脱敏必须在首次持久化之前。若先写入消息队列或本地磁盘再清洗，敏感内容已经进入备份和复制链。字段级允许列表比正则“事后扫一遍”可靠；未知字段默认拒绝或散列。哈希也不是天然匿名化，低熵值仍可能被枚举，需要加盐或令牌化策略。

## 保留、查询与处置

保留期按事件类型、法律义务和风险分层。授权、密钥、资金、数据导出等事件可以保留更久；普通只读查询只留聚合或短期明细。到期处置不仅删除搜索索引，还要覆盖对象存储、副本、导出和灾备。合法保留需要单独状态，避免普通生命周期规则误删。

查询必须以工单或调查目的为入口，记录查询者、条件、导出范围和审批。高敏批量导出设置行数限制与二次批准。常用索引包括 tenant、actor、run、action、resource、decision、outcome、policyVersion 和 operationId；不要索引长文本导致成本和泄露面失控。

## 失败模式与验证

审计管道自身也会失败。生产路径不能因为归档端短暂不可用就悄悄丢事件：使用本地受限缓冲或可靠队列，明确积压上限；关键高风险动作可选择“审计不可用则拒绝”，普通动作则带降级告警。至少一次投递会产生重复，eventId 和规范记录摘要负责去重。

测试覆盖 Schema 演进、乱序、重复、断链、签名密钥轮换、时钟漂移、采集端被绕过、敏感字段注入、归档只读权限、保留期删除和合法保留。恢复演练要证明备份后的记录和签名根仍能验证，而不只是“文件可以打开”。

## 小结

可靠审计是一条受控证据链：稳定事件语义、清晰的主体与委托、策略和结果分离、有序标识、完整性保护、独立验证、敏感数据最小化和可执行的保留处置。所谓“不可抵赖”是身份、密钥、时间、存储、流程和验证共同形成的系统属性，不是一条日志配置。

## 参考资料

- [NIST SP 800-92：Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)
- [OpenTelemetry：Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)
- [RFC 9421：HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html)
