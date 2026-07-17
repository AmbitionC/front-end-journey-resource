数据管线“任务成功”只说明程序没有以失败状态退出，不代表数据正确。数据可观测性要把运行信号与数据质量连接起来：新数据是否按时、数量是否异常、schema 是否漂移、字段是否有效、影响了哪些下游，以及谁负责恢复。

![数据可观测性把 freshness、volume、schema、quality、lineage 与告警处置连接成闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/data-observability-quality-signals-v1.webp)
*图：技术信号需要映射到数据产品 SLO 和下游影响，告警才有优先级与可执行 owner。*

## 五类问题面

Freshness 衡量最新成功数据距期望时间的差距；volume 检查行数、文件数、字节和 key 基数；schema 关注字段、类型和兼容性；validity 检查非空、范围、唯一性和业务不变量；lineage 用于追踪来源和 blast radius。

这些维度互相补充。行数正常也可能全部是昨天数据；schema 未变也可能金额单位变了；任务准时完成也可能输出空分区。为每个数据产品定义少量高价值断言，比给所有列自动生成数百条噪声规则更有效。

## 运行遥测与数据事实分开

[OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/)区分 traces、metrics 和 logs。Trace 适合一次 run 跨服务的路径，metrics 适合趋势和告警，logs 提供离散诊断。它们通过 service、environment、runId 和 datasetId 关联，但不能代替对输出数据本身的验证。

管线指标包括 queue delay、duration、retry、checkpoint 和资源；数据指标包括 max event time、row count、null rate 和分布。标签避免 tenantId、partitionId 等无界高基数，详细身份放到日志或事件存储。

## Expectations 是可执行契约

[Great Expectations Core](https://docs.greatexpectations.io/docs/core/introduction/)把数据断言和验证结果作为显式对象。无论采用何种工具，一条规则都需包含 dataset/version、过滤范围、期望、严重级别、owner 和失败动作。

硬规则如主键唯一、货币非负可以阻止发布；统计规则如行数比七日中位数下降 40% 可能先告警。阈值按星期、活动或分区季节性建模，防止正常峰谷触发。模型异常检测也要给出基线窗口和回退静态阈值。

## 以数据产品 SLO 告警

SLO 示例：“工作日 08:15 前，`daily_revenue` 成功发布且完整率 ≥99.9%。”它同时包含 deadline、可用性和质量。告警 burn rate 或持续违约，而非每次瞬时波动；关键报表和实验临时表的优先级不同。

告警内容提供数据集、受影响区间、期望与实际、最近成功、疑似上游变更、下游数量、owner 和 runbook。若没有 owner 或动作，告警只会积累为噪声。

## 发布门禁与隔离

任务先写 staging，执行 schema、计数和业务断言后发布 pointer。失败产物保留用于诊断但不被下游读取。对流式结果，可标记窗口 provisional/final，并把迟到修正纳入质量状态。

不是所有失败都停止全局管线。按数据产品隔离，允许非关键字段降级、使用上一版本或标记 stale；禁止悄悄填零掩盖缺失。用户界面和 API 应暴露 freshness 状态，让消费者知道数据何时可信。

## 根因和影响分析

质量事件关联部署、schema 注册、上游 Run 和基础设施变化。沿血缘向上寻找同一时间出现的最早异常，向下枚举受影响报表、模型与 API。相关性不是因果证据，修复前仍要抽样检查原始数据和变换逻辑。

事故结束后记录检测延迟、确认时间、恢复时间、错误数据暴露范围和重复发生规则。新增断言要针对根因，而不是给每次事故叠加一个过窄阈值。

## 测试与运营

注入空分区、重复主键、schema 增删、延迟事件、分布突变和上游停更，验证告警到正确 owner、坏数据未发布、降级可见。定期检查失效规则、长期静默数据集、无 owner 资产和高噪声告警。

成熟度不以 dashboard 数量衡量，而看能否在用户发现前检测重要数据问题，快速定位实际 Run 和来源，评估下游影响，并通过门禁或降级限制错误传播。

## 参考资料

- [OpenTelemetry：Signals](https://opentelemetry.io/docs/concepts/signals/)
- [Great Expectations：Introduction](https://docs.greatexpectations.io/docs/core/introduction/)
