数据契约不是一份只写字段名的 Wiki，而是生产者对身份、结构、语义、质量、时效和变更流程作出的可执行承诺。消费者据此生成代码、验证输入和规划升级；平台则在 CI、注册和运行时持续检查。没有 owner 与演进规则的 schema，只是格式说明。

![生产者与消费者围绕 Schema、语义、质量 SLO、兼容检查和弃用流程协作的数据契约](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/data-contracts-producer-consumer-change-v1.webp)
*图：契约由生产者负责、消费者验证，CI 管结构兼容，运行时质量与 freshness 监控实际履约。*

## 契约包含什么

最小契约应记录 dataset/topic/API 的稳定身份、owner、字段 schema、业务语义、主键、事件时间、单位、空值、敏感级别、更新频率、质量 SLO、版本和弃用策略。示例值可以帮助理解，但不能替代明确约束。

“amount: number”不够：要说明币种、元还是分、税前还是税后、退款符号和精度。“timestamp”要说明事件时间还是摄取时间、时区和精度。枚举说明未知值处理，标识符说明作用域与是否可复用。

## 机器可读的结构层

[Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)集中保存 schema 版本并可在注册时执行兼容检查。它适用于消息格式层，但不能自动判断字段语义或 freshness。兼容模式要写成 reader/writer 组合，并与消费者发布顺序对应。

[OpenAPI Specification](https://spec.openapis.org/oas/latest.html)为 HTTP API 提供机器可读的 operation、parameter、request 和 response schema，可用于文档、代码生成和测试。不过 OpenAPI 描述不等于服务必然遵守；网关或应用仍需运行时校验、鉴权和观测。

批数据可用 JSON Schema、Avro/Protobuf 或表格式 schema。无论载体如何，契约文件进入版本控制，变更通过 review，构建产物带不可变版本和摘要。

## 生产者拥有，消费者参与

生产者最了解数据生成语义，应对契约和 SLO 负责；平台提供模板、registry 和检查，而不是成为所有数据的 owner。消费者声明依赖的字段、版本和 criticality，生产者才能评估 blast radius。

变更提案附兼容结果、受影响消费者、迁移窗口和回滚方式。添加 optional 字段通常低风险，但仍可能触发 strict validator；删除、重命名、类型或语义变化采用新字段/新版本和双轨窗口。

## CI 与运行时闭环

CI 验证语法、命名、owner、兼容性、敏感标记和 fixture。Consumer-driven contract test 用真实 SDK/解析器读取生产者样本，覆盖 old/new 组合。禁止仅通过修改 registry 策略绕过失败；例外必须有期限和迁移计划。

运行时验证 schema ID、必填、范围、唯一性、枚举未知、行数和最大事件时间。先写 staging，满足 release gate 后发布。质量结果与数据版本一起保存，让下游知道它消费的是“已验证 v42”而不是某个可变 latest。

## SLO 与错误预算

契约可以定义：“每工作日 08:00 前发布；完整率 ≥99.9%；主键重复为 0；最近 30 天可回填。”SLO 需要测量位置、窗口和计算公式。偶发违约消耗错误预算，持续违约触发改进，而不是所有波动都叫 P0。

消费者应设计可见降级：使用上一版本时标记 stale，缺失 optional 字段使用契约默认，关键字段失败则拒绝发布。不能静默把缺失金额填 0，因为这让数据“格式正确、语义错误”。

## 弃用而非突然删除

字段进入 deprecated 后公布替代字段、最后写入日和删除日。通过 lineage、查询日志与消费者声明追踪仍在使用者；只有使用归零并超过回滚窗口才 Contract。长期离线任务和恢复工具也属于消费者。

契约自身要版本化，但避免每个小改动创建完全断裂的新身份。major 版本表达破坏性协议边界，minor 表达兼容增加；实际兼容性仍由格式规则和测试决定，不能只信版本号。

## 验证清单

演练新 producer + 旧 consumer、旧 producer + 新 consumer、未知枚举、缺失字段、schema registry 不可用、数据迟到、质量门禁失败和弃用回滚。检查每个关键数据产品都有 owner、SLO、敏感分级、消费者清单和最后验证时间。

契约的成功标准不是仓库里有多少 YAML，而是一次变更能在发布前发现不兼容，在运行时发现违约，并能快速通知真实 owner 和受影响消费者。

## 参考资料

- [Confluent：Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
