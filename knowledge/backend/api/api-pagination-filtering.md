列表 API 的分页正确性首先取决于“稳定全序”，其次才是 cursor 编码。如果只按 created_at 排序，多个对象时间相同就没有确定先后；如果使用 OFFSET，在并发插入或删除时，后续页会发生重复或遗漏。稳定 cursor 分页使用所有排序字段加唯一 tie-breaker，并以最后一条记录的排序元组作为下一页边界。

[Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)把 cursor 定义为客户端应视为不透明的位置标识，并要求正向与反向分页保持一致的边顺序。即使 REST API 不使用 GraphQL，也可以借用“不透明 cursor + 稳定连接顺序”的契约。

![规范化过滤与排序产生 created_at、id 的稳定全序，不透明 cursor 绑定最后元组和查询指纹，数据库用 keyset predicate 读取下一页](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/api-pagination-filtering-cursor-order-v1.webp)
*图：并发新增记录出现在 cursor 边界之前，不会被错误塞进后续页造成重复。*

## 先规范过滤与排序

服务端公开字段允许列表和操作符，例如 status eq、created_at gte、tag contains；拒绝任意 SQL 片段。字符串、时间、时区、空值和大小写规则明确。过滤条件先规范化，再生成 query fingerprint。

排序定义写出方向、NULLS FIRST/LAST 和 tie-breaker：

~~~text
ORDER BY created_at DESC, id DESC
~~~

id 必须在排序域中唯一且不可变。若用户选择 score DESC，也追加 id DESC；若 score 会随时间重算，同一次分页最好绑定 scoreVersion 或快照，否则顺序会漂移。

## Keyset Predicate

第一页没有 cursor，按 filter 和完整 ORDER BY 取 limit + 1 条。返回 limit 条，并用最后一条的 created_at、id 生成 nextCursor。下一页查询：

~~~sql
WHERE tenant_id = :tenant
  AND status = :status
  AND (
    created_at < :last_created_at
    OR (created_at = :last_created_at AND id < :last_id)
  )
ORDER BY created_at DESC, id DESC
LIMIT :limit_plus_one
~~~

方向为 ASC 时比较符反转。数据库支持行值比较时可简化，但必须验证 NULL 和索引行为。索引通常从 tenant/filter 等相等条件开始，后接排序字段，与查询计划一起评审。

## Cursor 内容与签名

cursor 可以编码：

~~~json
{
  "v": 2,
  "sort": [["created_at", "desc"], ["id", "desc"]],
  "last": ["2026-07-17T03:04:05.123Z", "obj_9"],
  "queryHash": "sha256:...",
  "snapshot": "optional-version",
  "exp": 1784250000
}
~~~

序列化后用 AEAD 加密或至少签名，再 Base64URL。客户端不依赖内部格式，服务端验证版本、签名、过期、租户和 queryHash。cursor 不是授权凭据；每页仍重新认证和授权。

queryHash 绑定规范 filter、sort、字段投影、租户作用域和必要版本。用户拿 status=open 的 cursor 请求 status=closed 时返回稳定 INVALID_CURSOR，而不是悄悄改变查询。

## 并发变化语义

Keyset 分页避免 OFFSET 的位置漂移，但不能凭空提供数据库快照。第一页返回后新增且排在 cursor 前的记录，不会进入后续页；用户刷新第一页时看到它。已看记录更新到边界后，可能在新位置再次出现；被删除则不会出现。

若产品要求“导出时完全一致”，需要 snapshot token、数据库一致性快照、asOf 时间或物化结果集，并为其设置资源与保留上限。普通无限滚动通常接受 read-committed 语义，但必须写进 API 文档。

## 反向分页

向前与向后使用同一逻辑顺序。查询 previous page 时可以反转 SQL 比较与 ORDER BY 获取候选，再在返回前反转数组，使客户端看到的边顺序仍一致。不要让 before cursor 的返回顺序与 after 相反。

Relay 规范中的 first/after 与 last/before 提供清晰模型，但实现不必同时支持所有组合。禁止会产生歧义或昂贵查询的参数组合，并返回稳定错误。

## Page Size 与资源限制

limit 有默认值和最大值，cursor 中不必绑定当前 limit，允许客户端缩小；是否允许增大按缓存和资源策略决定。服务端取 limit + 1 判断 hasNext，不执行昂贵 COUNT(*) 作为每页前置。

总数如果必须提供，可返回异步/估算值及其时间，或单独 endpoint。实时精确 count 在复杂过滤和高写入下昂贵，也不能保证与后续页同一快照。

## 链接与响应

[RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html)定义 Web Linking。REST 响应可以在 body 或 Link Header 提供 rel=next / prev 链接，但链接中的 filter、sort 和 cursor 必须完整且正确编码。

~~~json
{
  "items": [],
  "pageInfo": {
    "hasNext": true,
    "nextCursor": "eyJ2IjoyLC4uLg",
    "snapshot": null
  }
}
~~~

cursor 属于不透明数据，不在日志完整记录；记录版本、queryHash 摘要和错误类型即可。

## 过滤安全

字段与操作符映射到参数化查询，禁止把 URL 参数拼接 SQL。限制条件数量、嵌套深度、正则和模糊搜索长度，防止高成本查询。tenant 条件由身份上下文注入，不能从客户端 filter 接受。

排序字段也用枚举映射；未知字段拒绝。为允许的组合建立索引和查询预算，慢查询触发取消而非持续占用数据库。

## 测试

生成大量相同 created_at 的数据，验证 id tie-breaker 无重复遗漏；在翻页间并发插入、删除和更新；篡改 cursor、换租户、换 filter、过期、旧版本；测试 ASC/DESC、NULL、多字节字符串、最大 limit 和反向分页。

性质测试可以收集所有 cursor 页，断言每页内部与跨页严格有序、同一对象不重复、nextCursor 必然推进。性能测试检查使用预期复合索引，而不是扫描并 OFFSET。

## 小结

稳定分页的核心是 canonical query、包含唯一 tie-breaker 的全序和基于最后元组的 keyset predicate。cursor 对客户端不透明，内部绑定查询身份、版本和边界，并经过完整性保护。并发语义与快照能力明确后，API 才能避免看似随机的重复和缺页。

## 参考资料

- [Relay：Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [RFC 8288：Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)
