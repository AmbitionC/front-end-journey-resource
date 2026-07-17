Schema 演进不是“新 schema 能否注册”，而是不同版本的读者与写者在滚动发布、回放历史和灾难恢复时能否彼此理解。每次变更都要从两个方向推演：旧读者读新数据，以及新读者读旧数据；只验证当前最新版本，会漏掉最危险的跨版本组合。

![数据 Schema 演进中旧新 Reader 与 Writer 的前向、后向和完全兼容矩阵](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/data-schema-evolution-compatibility-matrix-v1.webp)
*图：兼容性描述的是 reader/writer 版本关系；部署顺序、历史回放和格式规则必须一起验证。*

## 先明确兼容方向

[Confluent Schema Evolution](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)把常见模式定义为 backward、forward 和 full compatibility。以“新 schema”作为判断主体：

- backward：新 reader 能读取旧 writer 产生的数据；
- forward：旧 reader 能读取新 writer 产生的数据；
- full：两个方向都成立；
- transitive：新版本要与全部历史版本比较，而不只与上一版比较。

不同团队有时用词方向相反，因此契约里应写出 reader/writer 组合，而不只写“向后兼容”。是否需要 transitive 取决于保留数据、离线重放和消费者升级周期：只要多年历史仍会被新程序读取，就不能只关心相邻版本。

## 兼容性取决于序列化格式

规则不能脱离 Avro、Protobuf 或 JSON Schema 泛化。[Avro 规范](https://avro.apache.org/docs/current/specification/)通过 writer schema 与 reader schema 的解析规则处理字段增加、删除、别名和默认值。增加有默认值的字段常能让新 reader 读取旧数据，但默认值用于读取缺失字段，不会神奇地改写历史记录。

Protobuf 的字段号进入 wire format，删除字段后应保留编号和名称，避免未来误用；JSON 消费者是否忽略未知字段则取决于验证器和代码。`string` 改成 `int`、修改枚举语义或把 optional 变 required 通常都不是安全的小改动。

语法兼容也不等于语义兼容。把 `amount` 单位从元改成分，schema 仍是整数，但消费者结果会错一百倍。字段描述、单位、时区、空值含义、枚举扩展策略和 owner 都属于数据契约。

## 按协议安排发布顺序

假设要新增 `risk_level`。如果旧消费者会忽略未知字段，可以先升级 reader 使其接受缺失字段，再升级 writer 发送新字段；若旧 reader 对未知字段报错，则必须先让所有 reader 宽容，或使用新 topic/API 版本。

典型安全流程：

1. 在 registry CI 中验证目标兼容模式；
2. 发布能同时读取旧新形状的消费者；
3. 等待所有在线和批处理消费者完成升级；
4. 发布新 writer，并逐步放量；
5. 观察反序列化错误与字段使用；
6. 超过回滚窗口后再废弃旧字段。

“所有消费者”包括数据仓库作业、重放工具、移动端和长期离线客户端。没有消费者清单，就无法证明 Contract 阶段安全。

## Schema Registry 不是全部防线

Registry 提供版本、兼容检查和 schema ID，但运行时仍要处理未知 schema、registry 暂时不可用、缓存和权限。消息应携带可解析的 schema 标识；消费者缓存已用 schema，但不能在离线时随意把未知载荷当 JSON 猜测。

权限分离 producer 注册、兼容策略修改和只读获取。默认策略由平台设置，例外需要 owner、原因和过期时间。删除 schema 版本会破坏历史回放，应采用受控弃用，而非为了列表整洁清理。

## 破坏性变更与双轨迁移

确实需要改变类型或语义时，新增字段或新事件版本：同时产生 old/new，消费者迁移后停止 old。对于计算昂贵的历史回填，明确旧记录如何解释，是使用默认值、按事件时间重算，还是标记 unavailable。

不要让双写无限存在。记录旧新字段一致率、仍读取旧字段的消费者和最后使用时间，设置 Contract 日期。若两字段冲突，指定唯一权威来源，避免双向同步。

## 测试矩阵

CI 应保存真实历史 fixture，至少覆盖 old writer → new reader、new writer → old reader、缺失 optional、未知字段、未知枚举、默认值、空值和极端数值。除了 schema 工具的静态判断，还要运行实际生成代码和序列化库，因为库版本与 strictness 会影响行为。

线上监控 schema ID 分布、反序列化失败、未知枚举、默认值命中和各消费者版本。一次演进完成的证据是兼容矩阵全部通过、旧消费者归零、历史回放成功，且旧字段被有计划地移除。

## 参考资料

- [Confluent：Schema Evolution and Compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [Apache Avro：Specification](https://avro.apache.org/docs/current/specification/)
