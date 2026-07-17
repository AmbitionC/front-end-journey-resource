Webhook 是“提供方主动调用接收方”的跨边界写入协议。接收方必须假设请求会延迟、重复、乱序，甚至被攻击者重放；提供方必须假设网络在任何时刻断开，无法从一次 timeout 判断对方到底有没有提交。可靠设计因此围绕原始报文验签、时间与重放门禁、持久收件箱、幂等处理和可观测重试展开。

![提供方发送带签名、时间戳和 Delivery ID 的原始请求，接收方在解析和副作用之前依次验证时间窗口、原始正文签名与重放账本，再异步交给幂等处理器](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/webhook-design-signature-retry-ledger-v1.webp)
*图：先验证并持久接收，再快速返回 2xx；业务副作用与网络响应解耦。*

## 事件与投递是两个身份

eventId 标识业务事件，例如 invoice.paid；deliveryId 标识一次 HTTP 投递。同一事件可能因重试有多个 delivery，也可能按产品策略只复用一个 deliveryId。两者都应稳定并出现在 Header 与审计中。

消息信封至少包含 eventId、eventType、occurredAt、schemaVersion、resourceId 和 data。事件类型来自受控词表，Schema 版本化；接收方对未知字段宽容，对未知事件类型安全忽略或隔离，不能直接当成功处理。

## 签名覆盖原始报文

[RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html)定义 HTTP Message Signatures，签名输入可以覆盖方法、目标、Header 和内容摘要，签名参数可以包含创建、过期、keyid、alg 和 nonce。无论采用标准还是供应商 HMAC 格式，接收方都要明确覆盖哪些组件。

推荐签名内容至少绑定：

~~~text
HTTP method
request target
content digest or exact raw body
delivery id
created timestamp
key id and signature parameters
~~~

TLS 仍然必需，签名不负责隐藏内容。只签 body 而不绑定目标路径，可能允许把合法报文转发到另一个动作；不签 deliveryId 和时间会削弱防重放能力。

[GitHub Webhook 验签文档](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)强调使用接收到的原始 payload 计算签名，并安全比较结果。框架若先解析 JSON、改变空白、Unicode 或字段顺序，再重新序列化验签，合法签名会失败或形成歧义。中间件必须保留原始字节。

## 密钥管理

每个 endpoint 或租户使用独立密钥，不共享一个全平台 secret。Header 带 keyId，接收方可在轮换窗口同时接受 current 与 previous；提供方先发布新密钥、验证接收方就绪，再切换签名，最后撤销旧密钥。

密钥存受管 secret 系统，日志只记录 keyId 和验证结果。算法固定允许列表，不能由请求声明任意算法。比较使用常量时间函数，并先校验编码与长度，避免实现细节泄漏。

## 时间窗口与重放账本

接收方检查 created/expired 与本地可信时钟，允许小幅漂移但拒绝过旧或来自过远未来的请求。然后对 endpointId + deliveryId 做原子插入：

~~~text
ABSENT -> RECEIVED -> PROCESSING -> SUCCEEDED
                               -> FAILED_RETRYABLE
                               -> FAILED_TERMINAL
~~~

已存在且正文摘要相同的 delivery 直接返回先前接收结果；同 deliveryId 但摘要不同是安全冲突，应拒绝并告警。Nonce 或 deliveryId 保留至少覆盖最大重试与攻击重放窗口。

签名正确不表示事件新鲜，也不表示发件方有权操作当前资源。业务处理仍要验证资源、状态和租户。

## 快速接收与异步处理

接收路径完成大小限制、Content-Type、时间、签名、防重放和最小 Schema 后，将原始摘要与受控 payload 持久化，再尽快返回 2xx。耗时业务放入队列。这样提供方不会因接收方处理慢而反复重试。

若持久化失败，返回非 2xx 让提供方重试；如果已经持久化成功但 2xx 丢失，重复 delivery 由账本去重。绝不能先返回 2xx 再依赖进程内异步任务，否则进程崩溃会永久丢事件。

## 重试协议

提供方只对网络错误、timeout、429 和部分 5xx 做有界指数退避与 jitter；400、401、403 等通常需要配置修复。遵守 Retry-After，设置最大 attempt 和最长投递期限。每次 attempt 复用 eventId，并按协议使用稳定或可关联的 deliveryId。

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)给出 HTTP 方法、状态与重试相关语义。Webhook POST 默认不幂等，所以重复安全不能依赖方法本身，而要由 deliveryId 和接收方账本实现。

提供方提供投递历史、最后响应摘要和手工重放按钮。手工重放生成受审计的新 attempt，不能绕过签名和权限。接收方的 DLQ 也需要修复、审批和幂等重放流程。

## 乱序与业务幂等

payment.updated 可能先于 payment.created 到达，旧状态事件也可能在新事件后重试。若来源提供 resourceVersion 或 sequence，接收方用条件更新拒绝倒退；否则读取提供方当前状态或设计可交换、可重复的处理。

业务副作用使用 eventId 或领域 operationId 去重。收件箱去重只保证同一投递不被重复排队，不自动保证邮件、积分或下游调用只发生一次。

## SSRF 与 endpoint 治理

提供方允许用户配置回调 URL 时，会面临 SSRF。验证 HTTPS、端口和域名，解析后阻止环回、链路本地、私网和云元数据地址；每次连接校验最终 IP，限制重定向，并对域名所有权做验证。出站请求经过受控代理。

endpoint 有租户、用途、事件允许列表、密钥版本、状态和失败阈值。连续失败时暂停并通知，避免无限攻击错误地址。

## 观测与测试

指标包括发送/接收率、验签失败、时间窗口拒绝、重复率、各 attempt 状态、端到端延迟、队列积压和终态失败。日志带 eventId、deliveryId、endpointId、keyId、bodyDigest、attempt 和 traceId，不记录密钥或完整敏感正文。

测试覆盖正文被改一字节、错误路径、过期签名、未来时间、重复/冲突 delivery、密钥轮换、返回 2xx 丢失、乱序、接收后崩溃、私网重定向和 DLQ 重放。

## 小结

Webhook 的正确边界是：对精确原始字节和关键请求组件验签，验证时间与防重放身份，先持久接收再返回 2xx，业务在队列中幂等处理；发送方使用有界重试和可审计重放。这样网络的不确定性不会变成重复副作用或伪造事件。

## 参考资料

- [RFC 9421：HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html)
- [GitHub Docs：Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
