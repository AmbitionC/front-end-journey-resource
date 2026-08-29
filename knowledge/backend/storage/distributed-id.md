分布式 ID 的难点不在于“生成一个数字”，而在于把唯一性、时间顺序、吞吐量、索引局部性、跨区域部署和故障恢复放进同一份契约。先写清业务是否真的需要有序的 64 位整数，再选择 UUID、Snowflake 或号段（segment）这类不同边界的方案。

![UUID、Snowflake 与号段策略按唯一性、顺序性、中心依赖和时钟风险划分边界；生成后的 ID 仍需在数据库唯一约束下落库](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/distributed-id-strategy-boundary-v1.svg)
*图：选择 ID 方案是在排序能力、协调成本与故障模式之间取舍；唯一索引仍是最终防线。*

## 概览：先定义 ID 契约

至少回答五个问题：ID 是否需要全局唯一、是否需要按生成时间大致排序、调用方是否只接受整数、峰值 QPS 是多少、以及时钟或中心服务不可用时能否短暂降级。不同表甚至同一系统的不同 ID 可以有不同答案。

无论采用何种生成器，数据库的唯一约束都不应被移除。生成器降低冲突概率或提供协调规则；唯一约束才是在并发写入、迁移脚本和旁路系统都存在时的最终不变量。

## 核心模型：三种常见策略

| 策略 | 典型形态 | 优点 | 主要边界 |
| --- | --- | --- | --- |
| UUID | 128 位随机或时间有序值 | 无中心协调、跨系统易生成 | 占用更大；字符串/随机写对索引不友好 |
| Snowflake | 时间戳 + 节点号 + 毫秒内序列 | 紧凑整数、近似时间有序、高吞吐 | 节点号和时钟是正确性依赖 |
| 号段 | 中心表预分配 `[start, end]` | 整数递增、规则直观 | 依赖号段服务；段耗尽前需续租 |

### UUID：标准化格式，不等于排序承诺

RFC 9562 定义 UUID 为 128 位标识符，并规定 UUIDv7 把 Unix 毫秒时间戳放在最高 48 位，其余可用于随机性或毫秒内单调性。[RFC 9562 第 5.7 节](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7)是 UUIDv7 格式的规范来源。v7 在按字节比较、以正确的二进制表示存储时具有时间前缀；它不意味着跨机器绝对全序，也不消除同一毫秒内并发生成的排序问题。

### Snowflake：把协调压缩进 bit layout

常见 64 位布局是 `timestamp | workerId | sequence`。以 ShardingSphere 的实现为例，源码注明了 1 位符号位、41 位时间偏移、10 位 worker ID 和 12 位毫秒内序列；也暴露了时钟差容忍配置。[实现源码说明](https://shardingsphere.apache.org/statistics/staging/xref/org/apache/shardingsphere/infra/algorithm/keygen/snowflake/SnowflakeKeyGenerateAlgorithm.html)展示了这些参数。

同一 worker 在同一毫秒的序列耗尽时必须等待下一毫秒或拒绝请求；两个存活节点若拥有同一 worker ID，则生成器失去唯一性。这里的“有序”通常只在单节点、时钟正常且按数值比较的语境下成立，不能替代业务事件顺序。

### 号段：用批量租约减少中心往返

号段服务通过事务把全局计数器从 `N` 增加到 `N + size`，再把 `[N + 1, N + size]` 交给一个实例本地消费。实例提前申请下一段并双缓冲，可以把大多数发号从中心数据库路径移走。段未用完就宕机会产生空洞；空洞通常可接受，若业务要求连续编号，应重新评估需求，因为故障恢复与高并发下的严格连续性代价很高。

## 实现方法：从需求到故障处理

### 1. 写出选择表

如果需要离线创建、跨组织合并或不愿维护 worker ID，优先考虑 UUIDv7；如果主键必须是紧凑整数且可维护节点租约与时间健康，Snowflake 合适；如果希望整数递增而可以运行一个可靠的号段表/服务，选择号段。不要因为某方案“流行”而把它应用到所有资源。

### 2. 以 UUIDv7 为例，明确存储和比较方式

使用经过测试、符合 RFC 9562 的库，并以数据库原生 UUID/`BINARY(16)` 等二进制形式保存。应用展示时再格式化为文本。混用不同字节序的 GUID/UUID 库会破坏排序和跨语言兼容性；RFC 对网络字节序和某些 COM GUID 的例外均有说明。[RFC 9562 第 4 节](https://www.rfc-editor.org/rfc/rfc9562.html#section-4)。

### 3. Snowflake 的 worker ID 必须可租约、可围栏

不要把 pod 序号或环境变量当成永久唯一事实。启动时从协调系统领取 worker ID，并保存 lease、实例身份和过期时间；租约未确认时拒绝发号。若重启、网络分区或控制面异常导致“旧实例仍在发号而新实例复用 ID”，围栏 token 或明确停机优先于继续服务。

对于时钟回拨，策略要写成状态机：记录上次发号时间；当前时间更小且差值在容忍窗口内，则等待到上次时间；超过窗口则熔断该实例、告警并恢复时钟，不要悄悄用旧时间继续发号。ShardingSphere 的旧版主键文档也描述了小回拨等待、超出容忍范围报错的处理思路。[Clock-back 说明](https://shardingsphere.apache.org/document/legacy/3.x/document/en/features/sharding/other-features/key-generator/)。

### 4. 号段采用事务预留和双缓冲

```sql
-- 在一个短事务中执行；返回新范围而非逐次 SELECT
UPDATE id_segment
SET max_id = max_id + :step
WHERE biz_tag = :tag;
```

实际实现需读取更新前/后的边界（例如 `RETURNING` 或锁定读），并且 `biz_tag` 与业务域隔离。监控“当前段剩余量、预取耗时、续租失败、回退到中心的比例”；段耗尽不是普通重试，而是容量或依赖故障信号。

## 失败边界与常见误区

- **唯一不等于连续，也不等于业务排序。** 支付流水、消息顺序和数据库提交顺序应有独立字段或序列。
- **时间倒退不是小概率细节。** NTP 校时、虚拟机迁移和人工改时都会触发；为 Snowflake 准备观测、熔断和演练。
- **把 ID 暴露给外部会产生枚举风险。** 递增或时间编码 ID 容易泄露规模和时间；外部资源可另用随机 public ID，并始终做授权校验。
- **整数精度会在前端丢失。** JavaScript `number` 无法精确表示所有 64 位整数；JSON 中应以字符串传输，再按语言使用 `bigint`/64 位类型处理。
- **迁移期更容易冲突。** 新旧生成器并行时要划分命名空间、保留位或表级路由，并在写入端做唯一冲突监控。

## 面试追问

1. **Snowflake 怎样保证 worker ID 不重复？** 回答租约、心跳、围栏、控制面不可用时的拒绝服务策略，而不是只说“配置不同”。
2. **为什么 UUIDv7 比 v4 更利于时间相关索引？** v7 的高位包含时间前缀；但需说明存储字节序、同毫秒并发和数据库实现仍会影响实际写放大。
3. **号段服务宕机还能发多久？** 取决于本地剩余段；用双缓冲、低水位预取和剩余容量告警量化答案。
4. **如何处理时钟回拨？** 小回拨等待、较大回拨熔断并告警；不能以重复 ID 换取可用性。

## 小结

分布式 ID 的选型应从契约出发：UUIDv7 以标准化 128 位空间换取去中心化，Snowflake 以节点与时钟管理换取紧凑近似有序的整数，号段以中心预分配换取简单递增。无论哪种方案，都要把唯一索引、故障演练、跨语言表示和外部暴露风险纳入设计。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent 开发一面：推理缓存、网络与存储基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-18.md)（cluster-265dac6c3b53）
<!-- interview-source-history:end -->

## 参考资料

- [RFC 9562：Universally Unique IDentifiers](https://www.rfc-editor.org/rfc/rfc9562.html)
- [Apache ShardingSphere：SnowflakeKeyGenerateAlgorithm 源码](https://shardingsphere.apache.org/statistics/staging/xref/org/apache/shardingsphere/infra/algorithm/keygen/snowflake/SnowflakeKeyGenerateAlgorithm.html)
- [Apache ShardingSphere：Distributed Primary Key（含 clock-back）](https://shardingsphere.apache.org/document/legacy/3.x/document/en/features/sharding/other-features/key-generator/)
