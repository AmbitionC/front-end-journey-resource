API 文档、运行时校验、错误语义和兼容性测试是四件事。OpenAPI 能描述接口，并不保证服务实际拒绝非法输入；JSON Schema 校验通过，也不保证认证、业务规则或资源状态正确；客户端编译成功，更不代表新版本没有改变行为。

[OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)把 OpenAPI 定义为与语言无关的 HTTP API 描述。规范正文是权威来源，工具附带的 convenience schema 不能替代规范语义。生成器、校验器和文档工具还可能只支持规范的一部分，版本必须显式固定。

![同一 API 契约用于设计 lint、运行时请求解析与校验及 Provider/Consumer 契约测试；非法请求进入 Problem Details，结构校验与业务授权分别处理](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/api-schema-validation-contract-pipeline-v1.webp)
*图：Schema 是贯穿设计、运行时与测试的契约，但每一层承担不同责任。*

## 设计时的单一来源

先确定 code-first 或 design-first 的权威来源，避免注解、手写 YAML 和运行时代码三方漂移。契约进入版本控制并在 CI 执行：

- 语法与引用解析；
- operationId、状态码、鉴权和错误响应完整性；
- 命名、分页、幂等与内容类型规则；
- 与基线版本的 breaking-change 检测；
- 示例是否真的通过 Schema；
- 生成 SDK 的编译和最小行为测试。

[OpenAPI 最新版本入口](https://spec.openapis.org/oas/latest.html)会指向当前发布版本。生产项目不应在构建中无条件跟随 latest；固定 3.2.0 或明确版本，升级时阅读变更并验证工具链。

## JSON Schema 能表达什么

OpenAPI 3.2 的 Schema Object 构建在 JSON Schema Draft 2020-12 之上，但仍需按 OpenAPI 对方言和扩展的规定解释。[JSON Schema Validation 2020-12](https://json-schema.org/draft/2020-12/json-schema-validation)区分类型、必填、范围、组合等断言，以及 title、description、default、examples 等注解。

format 是常见陷阱：某些实现只把 email、uri、date-time 当注解，不会自动拒绝非法值；是否启用 format-assertion 与具体验证器配置有关。团队要在契约里写清运行模式并做测试，不能因 Schema 写了 format 就假设生产已经校验。

~~~yaml
type: object
required: [name, callbackUrl]
additionalProperties: false
properties:
  name:
    type: string
    minLength: 1
    maxLength: 120
  callbackUrl:
    type: string
    format: uri
~~~

additionalProperties 是否拒绝未知字段是一项兼容性选择。严格拒绝能尽早发现拼写，但新增字段可能破坏旧消费者的回传；宽容读取更利于演进。不同边界可以选择不同策略，不要全局套模板。

## 运行时边界

校验发生在认证后还是前，需要权衡拒绝成本和信息泄露。通常先做请求大小、内容类型和基本解析限制，再认证，随后执行完整 Schema 与业务授权。绝不能在验证原始签名之前对 webhook body 重新序列化。

请求校验只验证形状、类型和局部约束；资源存在、状态转移、唯一性和权限是业务校验。二者错误码分开，方便客户端修复。响应也要在非生产或采样流量中校验，防止服务输出与文档漂移；生产全量响应校验需评估性能和敏感错误泄露。

## 稳定错误语义

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)定义了 Problem Details，可用 type、title、status、detail 和 instance 表达 HTTP API 错误，并允许扩展字段。应用应提供稳定 machine code 和字段问题列表，而不是把验证器堆栈直接返回。

~~~json
{
  "type": "https://api.example.com/problems/validation",
  "title": "Request validation failed",
  "status": 400,
  "code": "INVALID_REQUEST",
  "instance": "/requests/req_01J...",
  "errors": [
    {"pointer": "/callbackUrl", "code": "INVALID_URI"}
  ]
}
~~~

pointer 指向请求位置，code 属于受控词表；detail 可以本地化但不能作为程序判断依据。不要泄漏数据库字段、正则、内部类名或敏感原值。

## 状态码和失败边界

JSON 语法无法解析通常返回 400。目标资源的该方法不支持请求的媒体类型或内容编码时，应按 [RFC 9110 §15.5.16](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.16)区分为 415；问题可能来自 Content-Type、Content-Encoding 或对内容的实际检查，不能笼统归为 400。已解析但违反 Schema 或业务约束时，400/422 的选择应写入应用契约；[422 的语义](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21)要求服务器理解内容类型且内容语法正确，但无法处理其中的指令。

认证失败 401，已认证但无权限 403；资源不存在 404；版本或 ETag 冲突 409/412。各类失败要有一致、可测试的映射，不能只凭“客户端输入有问题”使用同一个状态码。

上游不可用、限流和内部错误不能包装成 400。错误是否 retryable 由稳定 code 和 HTTP 语义共同决定；参数问题重试相同请求没有意义。

## 契约演进

通常向对象响应新增可选字段对宽容消费者兼容，删除/重命名字段、收紧枚举、改变类型或默认语义会破坏。请求端新增必填字段尤其危险。字段废弃先标记 deprecated，监控实际使用，再经过迁移窗口移除。

Schema 兼容不等于行为兼容。排序默认值、分页稳定性、错误码和副作用时机变化，也要进入变更评审。版本策略可以用 URL、Header 或媒体类型，但不能把每个小改动都变成长期维护的新主版本。

## Python 与 Java 交换数据，先固定边界合同

语言名称不能证明生产者快慢。先明确是同步 HTTP、消息队列还是批量文件，再记录真实数据量、生产/消费速率、序列化与解析时间、队列等待、内存和端到端延迟；用同一数据与机器条件比较。CPU、网络、数据库或模型等待是不同瓶颈，不能把某一段语言执行速度推成整个链路的吞吐结论。

跨语言 Schema 至少检查大整数、精确小数、时间与时区、缺失字段和 `null`、字符编码、枚举及数组长度。[RFC 8259 §6](https://www.rfc-editor.org/rfc/rfc8259.html#section-6)指出不同实现可限制数值范围与精度；若链路存在 binary64 消费者，超出安全整数范围的 ID 不能无条件按浮点数传递。可按合同用十进制字符串或一致的精确数值类型，并对 Python/Java 双向解析做边界样本测试，而不是假设写了 JSON 就自动互通。金额的单位与小数位、时间的有效区间也需业务约定。

批量大小同时限制条目数与字节数；消费者承受不了生产速率时，以有界缓冲、流控、限流或明确拒绝传播压力，不无限排队。超时重试仍遵守稳定操作 ID 与幂等合同，异常返回可区分修参、重试与结果未知。这里是接口与容量边界的设计检查，没有证据宣称任一语言或框架必然更快。

## Consumer Contract Tests

Provider 测试证明实现符合 OpenAPI；Consumer 测试证明真实客户端依赖没有被破坏。消费者发布它使用的请求和响应片段，Provider CI 对新实现回放。测试数据不含生产秘密，并对异步、错误和分页路径覆盖。

不要让 Contract Test 只比较快照文本；它应验证状态、Schema、关键字段语义和兼容规则。生成 SDK 的测试确认 optional/nullable、union、日期和未知字段在目标语言中的实际行为。

## 小结

API Schema 治理是一条闭环：固定规范版本，设计时 lint 与兼容检查，运行时分别验证形状和业务规则，用稳定 Problem Details 返回错误，再由 Provider 与 Consumer 契约测试防止漂移。文档生成只是结果之一，真正目标是让客户端和服务端对边界行为有同一份可执行理解。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [京东后端一面：交付标准、Agent 选型与跨语言数据边界](../../../interview/jd/ai/jd-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [OpenAPI Specification：Latest](https://spec.openapis.org/oas/latest.html)
- [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
- [JSON Schema：Validation Draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-validation)
- [RFC 9457：Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC 9110：415 Unsupported Media Type](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.16)
- [RFC 9110：422 Unprocessable Content](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21)
- [RFC 8259：JSON 数值互操作范围](https://www.rfc-editor.org/rfc/rfc8259.html#section-6)
