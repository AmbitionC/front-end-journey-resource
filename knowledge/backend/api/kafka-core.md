Kafka 把事件写成可保留、可重读的分区日志，生产者负责写入，消费者负责读取和处理。理解它要分清三个问题：记录在哪里、哪个消费者处理、失败后从哪里继续；“消息写入成功”与“业务已经完成”是不同的确认。

本文依据 Apache Kafka 4.4 官方文档，讲解使用 KafkaConsumer 的普通分区分配消费组，不展开 ShareConsumer。副本确认示例按未启用 Eligible Leader Replicas（ELR）的 ISR 模型解释；启用 ELR 时须核对对应配置语义。示例事件与位置均为教学构造，没有运行集群或性能实验。

## 先把日志、分区和位置分开

| 概念 | 负责什么 | 容易混淆的边界 |
| --- | --- | --- |
| Topic | 命名一类事件流 | 一个 Topic 可以有多个分区 |
| Partition（分区） | 保存一条按追加顺序组织的日志 | 顺序保证在分区内，不是全 Topic 的总顺序 |
| Offset | 标识记录在某个分区中的位置 | 不同分区的位置不能直接比较；清理或事务等因素可使可读位置不连续 |
| Consumer group | 多个消费者分担一组订阅分区 | 不同组可各自读取同一份日志，保存各自进度 |

生产者将事件交给选定分区的 leader，记录追加到分区日志；消费者通过拉取取得记录。消费不会立即删除事件，能否重读取决于日志保留、压缩清理策略以及记录是否仍存在。[Kafka 概念说明](https://kafka.apache.org/intro/#main-concepts-and-terminology)、[分区与消费位置](https://kafka.apache.org/44/design/design/#consumer-position)。

## 一次处理怎样接到进度提交

下面选择“处理成功后手动提交 offset”的路径，先看数据流，再分析中途崩溃的含义。

![事件从生产者写入分区日志，被消费者拉取并完成业务持久化后，再提交下一条读取位置到消费组进度存储；业务提交和进度提交是两步](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/kafka-core-offset-flow-v1.png)
*图：只展示正常流程，省略副本与生产确认。处理成功后才提交进度，仍有两步之间崩溃而重复处理的窗口，不表示跨系统原子完成。*

普通消费组通过协调者把提交位置写入内部主题 `__consumer_offsets`，不是把业务结果也存进这份进度记录。[消费进度存储](https://kafka.apache.org/44/implementation/distribution/#consumer-offset-tracking)。

消费者的当前 position 是接下来准备读取的位置，随 poll 返回记录而推进；committed offset 是保存给故障恢复的位置。读到记录不等于业务处理成功，因此不能混用两者。[KafkaConsumer：位置与提交](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html#offsets-and-consumer-position-heading)。

假设某分区的一条事件 offset 为 37。处理并持久化成功后，可以把该分区下一次读取起点提交为 38；这不保证 38 一定有可读记录。若业务写入成功后、提交进度前崩溃，接管者可能重新读到 37；若先提交 38 再做业务，崩溃后则可能跳过尚未完成的处理。前者需要幂等或去重吸收重复，后者存在漏处理风险。[手动提交的官方示例与故障窗口](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html#manual-offset-control-heading)。

并行处理时，只能推进到该分区已连续完成的安全边界，不能因为较后记录先完成就跨过前面的未完成项。重平衡会改变分区归属，还须处理旧任务收尾、提交失败和新消费者恢复；增加消费者本身不能消除这些窗口。

## 分区为什么能扩展吞吐，又为什么限制顺序

分区可以分布到多个 broker，读写负载因而有机会并行；普通订阅消费组在同一时刻把一个分区分配给一个组内消费者，一个消费者可以负责多个分区。只有两个分区时，组内增加到四个消费者，不会因此得到四个同时负责分区的消费者。[消费组与分区分配](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html#consumer-groups-and-topic-subscriptions-heading)。

若同一实体的事件需要保持读取顺序，应让它们按稳定的路由规则进入同一分区，并约束后续处理的提交顺序。相同 key 的行为依赖分区器与分区数等条件，改变分区数可能改变映射，不能只写“相同 key 永远有序”。多个分区之间没有统一总序，消费者内部再并发处理也可能改变业务完成次序。

更多分区会增加元数据、复制、文件和重平衡的维护成本，热点 key 也可能集中到少数分区。因此应依据真实负载、处理耗时与顺序要求选择，不能把分区数当作吞吐的线性倍率。

## 可靠性要沿三段确认链检查

### 生产端：确认哪一步，重试是否可能重复

| 生产确认 | 生产者收到成功前等待什么 | 主要边界 |
| --- | --- | --- |
| acks=0 | 不等待 broker 确认 | 不能证明服务端已收到 |
| acks=1 | leader 写入本地日志 | leader 在 follower 复制前故障，已确认记录仍可能丢失 |
| acks=all | 等待当前 ISR 的确认 | 还要结合最小同步副本、选主与故障范围理解 |

ISR 是跟得上 leader 的同步副本集合，不等于配置的全部副本。未启用 ELR 的模型中，acks=all 配合 min.insync.replicas 约束成功写入时的同步副本下限：ISR 有三个成员时，即使下限设为二，也不是“随便两个确认就算成功”；ISR 低于下限时应拒绝相应写入。副本数量与成功确认条件都要满足，不能承诺任意故障下绝不丢失。[生产确认](https://kafka.apache.org/44/configuration/producer-configs/#producerconfigs_acks)、[最小同步副本与 ELR 例外](https://kafka.apache.org/44/configuration/topic-configs/#topicconfigs_min.insync.replicas)。

确认响应丢失时，生产者可能不知道消息是否已写入。幂等生产者利用生产者标识与序号抑制协议重试造成的重复追加；4.4 配置还要求兼容的 acks、重试与在途请求设置。它不会把应用再次发送的相同业务事件自动认作同一操作，也不替代消费端幂等。[幂等生产配置](https://kafka.apache.org/44/configuration/producer-configs/#producerconfigs_enable.idempotence)。

### Broker：复制、选主与保留决定恢复边界

分区 leader 接收写入，followers 复制日志；leader 故障时按集群规则选出可接管副本。若允许不在 ISR 中的副本作为最后手段当选，可能牺牲数据完整性换取可用性。日志过期或压缩清理也会影响重放，消费者停滞到记录已被清理时，不能期待仅靠旧 offset 恢复全部数据。[复制机制](https://kafka.apache.org/44/design/design/#replication)、[非同步副本选主配置](https://kafka.apache.org/44/configuration/topic-configs/#topicconfigs_unclean.leader.election.enable)。

### 消费端：业务效果与 offset 需要协调

“处理后提交”通常允许失败后重复，业务可用稳定事件身份，把去重记录与业务变更放入同一数据库事务，并核对同一事件的载荷与作用域。单独记录一个“已收到”标记，再异步做业务，会产生标记成功而业务未完成的窗口。这是应用设计，Kafka 不会自动为外部数据库或 HTTP 调用创建原子边界。

Kafka 内部的读—处理—写链路可以将输出记录与消费 offset 纳入 Kafka 事务，并让下游使用相应的 read_committed 读取语义。该范围的 exactly-once 不能直接扩展成“外部付款或发邮件只执行一次”；外部系统需要共同保存结果与进度、幂等或其他经验证的协调协议。[投递语义与事务范围](https://kafka.apache.org/44/design/design/#message-delivery-semantics)。

## 面试时怎样串起三问

解释执行原理，沿“生产者选分区并写日志—消费者按组分配拉取—处理后提交位置”说明机制；解释分区好处，同时给出并行度与分区内顺序的取舍；解释可靠性，则分别检查生产确认和重试、Broker 副本与选主、消费进度与业务幂等。明确正常流程之外的故障窗口，才能说明配置真正保证了什么。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 Agent 开发实习一面：MySQL、Kafka 与 RAG](../../../interview/kuaishou/ai/kuaishou-ai-21.md)
<!-- interview-source-history:end -->

## 参考资料

- [Apache Kafka：核心概念](https://kafka.apache.org/intro/)
- [Kafka 4.4：Design](https://kafka.apache.org/44/design/design/)
- [Kafka 4.4：Producer Configs](https://kafka.apache.org/44/configuration/producer-configs/)
- [Kafka 4.4：Topic Configs](https://kafka.apache.org/44/configuration/topic-configs/)
- [Kafka 4.4：KafkaConsumer](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)
- [Kafka 4.4：Consumer Offset Tracking](https://kafka.apache.org/44/implementation/distribution/)

官方资料实际核验于 2026-11-13；以上边界不代表原面经披露了具体版本、部署配置或项目实现。
