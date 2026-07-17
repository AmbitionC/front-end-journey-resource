客户端在发送 POST 后连接断开，无法知道服务端是“没收到”“执行中”还是“已经提交但响应丢失”。如果直接重试创建、扣款或发信，可能产生重复副作用。幂等键的作用，是把多次同一逻辑请求原子绑定到一个执行所有者和一个可重放结果，而不是简单给响应加缓存。

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)定义 PUT、DELETE 等方法的幂等语义，POST 默认不具备。应用可以用 client-generated key 让某个具体 POST 操作具备重试安全性，但必须定义作用域、请求一致性、并发和保留期。

![请求携带 Idempotency Key 与请求指纹进入原子账本，首个请求成为 owner 并执行一次；相同请求重放已存响应，不同请求复用同 key 返回冲突](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/api-idempotency-request-ledger-v1.webp)
*图：IN PROGRESS 是并发协调状态；不能让两个请求同时发现“没有记录”后都去执行。*

## 契约

客户端为一次逻辑操作生成高熵 key，并在所有网络重试中复用。新用户意图使用新 key。服务端作用域通常是 tenant + principal/client + endpoint + key，避免不同租户碰撞。

请求指纹由方法、规范路径、内容类型、规范 body 和影响语义的 Header 计算。忽略 traceId、Date 等瞬时字段，但不能忽略金额、资源 ID 或策略相关字段。key 不包含敏感信息。

~~~text
scope = tenant_id + client_id + operation
fingerprint = SHA-256(canonical_request)
ledger primary key = scope + idempotency_key
~~~

## 原子获取所有权

账本记录：

~~~json
{
  "key": "idem_...",
  "scope": "tenant:t1:create-payment",
  "fingerprint": "sha256:...",
  "state": "in_progress",
  "ownerToken": "fence_42",
  "createdAt": "...",
  "leaseUntil": "...",
  "status": null,
  "responseRef": null,
  "effectRef": null,
  "expiresAt": "..."
}
~~~

首个请求用唯一约束或 compare-and-set 插入并成为 owner。并发请求读取已有记录：指纹不同立即 409；指纹相同且 completed 重放；in_progress 则短暂等待、返回 409/202 或提供状态 URL。具体选择写入 API 契约。

“先 SELECT 再 INSERT”没有锁或唯一约束会竞态。ownerToken 是 fencing token，租约过期后的旧 owner 不能覆盖新 owner。

## 副作用与账本的一致性

若副作用和账本在同一数据库，把业务写入与 completed 响应放一个事务最简单。若调用外部支付或消息系统，无法做一个可靠分布式事务，需要 operationId、下游幂等键或 outbox：

1. 原子成为 owner；
2. 给下游发送稳定 operationId；
3. 保存下游确认与业务状态；
4. 保存可重放响应并转 completed；
5. 返回客户端。

如果第 2 步后 timeout，状态为 unknown，恢复器先向下游查询 operationId。不能把账本删除后重试，因为下游可能已经提交。

## 重放什么响应

[Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests)是成熟生产设计示例：服务保存某个 key 的首次结果，并对相同重试返回同一结果，同时检测参数不一致。具体状态码、保存哪些错误和保留时间属于提供方契约，不能把示例当通用标准。

通常保存 HTTP status、允许列表 Header、响应 body 或对象引用，以及完成时间和 Schema 版本。不要重放 Set-Cookie、Date、traceId 等逐请求字段；新响应生成新的 requestId，同时可标记 replayed=true 并引用 originalRequestId。

输入校验在取得执行所有权前失败时，是否占用 key需明确。常见选择是不保存纯语法错误，让修正后的请求可继续使用新 key；一旦业务执行开始，包括失败结果也保存，防止重试再次副作用。

## 相同 key 不同请求

指纹不一致必须返回稳定冲突，说明 key 已绑定另一请求，不能默默把旧响应给新参数，也不能覆盖。错误不回显完整原请求，只给 key、operation 和安全的 mismatch code。

客户端收到冲突后应检查自身重试逻辑：同一 key 只能代表一个用户意图。自动生成 key 但每次重试都刷新，会完全失去保护。

## IN PROGRESS、租约与崩溃恢复

请求可能在 in_progress 后崩溃。租约到期不代表副作用未执行；接管者读取 effectRef 和操作阶段，查询下游或恢复 outbox。只有能证明 not_started 才重新执行。

等待策略有界，不能让大量并发连接阻塞。同步短操作可以在几秒内轮询账本；长任务返回 202 和 jobId，同 key 后续请求返回同一 Job。

## TTL 与保留

TTL 至少覆盖客户端最大重试、队列延迟和对账窗口。过短会在迟到重试时再次执行；无限保留又会增加成本和个人数据风险。completed 响应可将大 body 移到对象存储，账本保留摘要与引用。

删除需要考虑业务资源仍存在时的语义。高价值操作可长期保留轻量 operationId 去重墓碑，即使完整响应已删除。TTL 到期后客户端是否允许复用 key，应写进文档。

## Header 标准状态

IETF 的 [Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)在 2026-07-17 的调研截止点仍是 Internet-Draft，而非 RFC。可以采用该字段名和草案思想，但应注明工作进展并固定本系统契约，不能声称已经是最终互联网标准。

## 测试与观测

并发压测让数十个相同 key 同时到达，断言只有一个 owner 和一个副作用；测试同 key 不同 body、完成后响应丢失、下游提交后 timeout、owner 崩溃、租约接管、TTL 边界和多租户同 key。

指标包括 created、replay、conflict、inProgressWait、unknownEffect、recovery 和 expiredReuse。日志记录 key 的不可逆摘要、scope、fingerprint 摘要、ownerToken、state 和 effectRef，不记录完整敏感请求。

## 小结

API 幂等需要一个原子账本，而不只是 Header。key 在明确作用域内绑定请求指纹，首个请求独占执行，完成结果可重放，并发相同请求等待或复用，不同请求冲突；崩溃恢复先对账未知副作用。TTL 和响应保存策略补齐生命周期后，POST 才真正具备可预测的重试安全性。

## 参考资料

- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Stripe Docs：Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [IETF Internet-Draft：The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
