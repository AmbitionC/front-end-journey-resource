批处理和流处理的本质差别不是“每天跑一次”与“实时”，而是输入是否有边界、结果何时算完整、状态如何随时间推进。设计前先定义事件时间、可接受延迟、迟到修正、重放来源和状态保留，再决定采用批、流或统一引擎。

![批流处理中有界与无界数据、事件时间、水位线、窗口、迟到数据和重放的时间模型](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/batch-stream-processing-time-model-v1.webp)
*图：watermark 表达事件时间进度而非墙上时钟；迟到事件按显式策略更新、旁路或丢弃。*

## 有界与无界

有界数据有可识别的结束位置，例如某日分区或静态文件；可以读取全部输入后得到最终结果。无界数据持续到达，任何“结果”都相对于窗口、触发器和当前进度。[Flink 概览](https://nightlies.apache.org/flink/flink-docs-stable/docs/learn-flink/overview/)把有界和无界流放在同一流处理模型中，并强调有状态计算。

批不一定高延迟，流也不一定逐事件输出。micro-batch 在小时间段处理，流式引擎也会缓冲、checkpoint。选择应基于业务何时需要看到结果、允许怎样修正，而不是追求架构标签。

## 三种时间

事件时间是业务事件实际发生时间，处理时间是算子看到它的机器时间，摄取时间是平台接收时间。网络重试、移动端离线和队列积压会让它们显著不同。按处理时间开窗口实现简单，却会把同一业务事件因系统负载不同分到不同窗口。

[Flink Time 文档](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/)说明 watermark 用来表达事件时间进度。它近似声明“系统预计不会再看到早于 T 的正常事件”，不是对未来的保证。watermark 太激进会让大量数据变 late，太保守则让窗口和状态迟迟不能关闭。

## 窗口、触发与迟到策略

滚动窗口不重叠，滑动窗口可重叠，会话窗口按活动间隔聚合。窗口定义还需指定时区和夏令时；“自然日”不等于固定 24 小时。触发器决定何时产生早期、准时和迟到结果。

迟到数据有三种常见策略：在 allowed lateness 内更新原结果；写入 side output 供补偿；超过治理阈值后丢弃并计数。下游必须知道结果是 append、update 还是 retract。若 sink 只会追加，却不断输出同一窗口修正值，总量会被重复累计。

## 状态与 checkpoint

去重、窗口聚合和 join 都需要按 key 保存状态。状态大小取决于 key 基数、窗口、TTL 和迟到范围，不能只估算每条事件计算量。[Flink Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/)介绍 checkpoint 将算子状态与输入位置形成一致恢复点。

exactly-once 描述的是特定边界和协议，不代表所有外部副作用只发生一次。sink 需要事务提交或幂等键；Webhook、邮件等使用 operation ledger。checkpoint 恢复会重放一段输入，消费者和输出必须承受重复。

## Batch、Lambda 与 Kappa

批处理适合全量重算、复杂历史 join 和可等待结果；流处理适合低延迟告警、在线特征和连续状态。Lambda 同时维护批与流两套路径，能用批层校正但逻辑易漂移；Kappa 以可重放日志和流作业统一处理，减少双实现，却要求事件历史、状态迁移和重放容量可靠。

实际系统可以组合：对象存储保存不可变原始数据作为重放源，流任务给出分钟级结果，日批任务做对账。重点是同一业务定义是否共享、修正如何覆盖、哪个结果是权威，而非宣布采用某个流派。

## 重放与 Backfill

事件 schema、业务逻辑和参考数据都要版本化。重放写入新结果版本或隔离表，追平实时后切换；不要把多年历史直接灌入生产 sink 造成通知和容量事故。对外副作用在 replay mode 下禁用或查询幂等账本。

回填开始前估算输入量、状态、checkpoint、下游写入和完成时间，设置独立并发与限速。校验窗口计数、业务摘要、迟到率和新旧版本差异，再逐步替换。

## 可观测与测试

监控 source lag、watermark lag、late-event rate、状态大小、checkpoint 成功与耗时、反压、sink commit 和重启恢复时间。测试乱序、重复、空闲分区、水位线不推进、夏令时、checkpoint 后崩溃和旧 schema 重放。

正确的时间模型能回答：这条记录属于哪个窗口、结果何时首次可用、何时近似最终、迟到后怎样修正、失败后从哪里恢复。回答不了这些问题，“实时”只是一种模糊的延迟承诺。

## 参考资料

- [Apache Flink：Overview](https://nightlies.apache.org/flink/flink-docs-stable/docs/learn-flink/overview/)
- [Apache Flink：Time and Watermarks](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/)
- [Apache Flink：Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/)
