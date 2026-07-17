数据血缘要回答两类事故问题：“这个错误结果从哪里来？”以及“这个上游变更会影响谁？”它不是手工绘制的架构图，而是由实际运行事件、稳定的数据集身份、schema 和列级变换持续生成的可查询证据。

![从作业 Run、输入输出 Dataset 到列级映射和下游影响分析的数据血缘](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/data-lineage-column-provenance-v1.webp)
*图：Run 连接一次真实执行的输入输出；Job 表示稳定逻辑，Dataset 与 Column 使用跨系统可解析的身份。*

## 核心实体

[OpenLineage 规范](https://github.com/OpenLineage/OpenLineage/blob/main/spec/OpenLineage.md)定义 Run、Job 和 Dataset。Job 是稳定的计算逻辑，例如 `warehouse.daily_revenue`；Run 是一次执行，有 runId 与 START/COMPLETE/FAIL 等生命周期；Dataset 表示输入或输出数据。

一次 Run 读取 `raw.orders/2026-07-16` 并写 `mart.revenue/2026-07-16`，血缘边属于这次运行。只在 catalog 中写“orders → revenue”，会丢失运行时间、代码版本、失败状态和分区。稳定图与运行事实都需要，前者用于导航，后者用于取证。

## 身份与命名空间

Dataset 名称必须能在系统间稳定解析。`orders` 在不同集群、数据库和环境中可能是完全不同对象，因此使用 namespace 加 name，例如 `snowflake://prod/account/db.schema.table`。环境是身份的一部分，预发布血缘不能污染生产影响分析。

重命名、复制和视图要记录新旧关系，而不是按字符串相似度猜。分区通常作为 dataset facet 或运行级输入范围，不应为每天生成一棵完全断裂的新图，具体取决于查询需求。

## Facet 携带可扩展事实

OpenLineage 使用 facets 给核心实体附加版本化元数据。静态 dataset schema 与某次 run 的 input statistics、output statistics 含义不同。facet schema 要兼容演进，未知 facet 可被旧消费者忽略；敏感 SQL、参数和样本值不能无审查进入中央 catalog。

采集器应在任务开始和结束发送事件，并带 eventTime、producer、nominalTime、code version、inputs 和 outputs。至少一次上报可能重复，后端按 runId、event type 和 event time 幂等。离线缓冲和重试防止 lineage 服务暂时不可用阻塞主数据任务。

## 列级血缘

[OpenLineage Column Lineage Facet](https://openlineage.io/docs/spec/facets/dataset-facets/column_lineage_facet/)描述输出字段与输入字段的映射及变换。直接投影是一对一，拼接或聚合可能多对一，常量字段没有输入列。列级血缘应由 SQL parser、查询计划或框架运行信息自动生成，手工维护很快漂移。

动态 SQL、UDF、`SELECT *` 和半结构化 JSON 会降低精度。系统应显示 confidence/coverage，而不是伪装完整。对无法解析的节点仍保留 dataset-level 边和原始 job/run 引用，便于人工追查。

## 影响分析与根因定位

上游 schema 变更前，从 dataset 或 column 向下游遍历，结合最近成功 Run、owner、SLA 和使用热度确定 blast radius。不是图上所有可达节点都同等紧急：已停用作业、测试环境和关键财务报表应有不同权重。

质量告警发生时向上游查找最近 schema、代码、数据量和 freshness 变化，再定位具体 Run。血缘给出调查路径，不自动证明因果；仍需对比时间和运行事实。

## 与编排和可观测连接

orchestrator 的 dagRunId、taskRunId 与 OpenLineage runId 关联，日志和 Trace 也记录同一低敏标识。这样可以从 catalog 跳到实际任务日志，再回到输入分区。采样 Trace 会过期，不能替代持久 lineage event。

血缘覆盖率本身需要指标：关键数据集有无 owner、最近是否收到 COMPLETE、输入输出是否为空、列映射比例、事件延迟和解析错误。对核心层设置门禁，未上报 lineage 或 schema 的任务不能宣称已治理。

## 验证与治理

用已知 SQL fixture 验证 rename、join、aggregate、CTE、UDF 和 `SELECT *`；演练事件重复、乱序、失败 Run、dataset 重命名和跨环境隔离。访问控制要继承源数据敏感度，用户能看到“存在一条边”不一定能查看列名或 SQL。

一套可信血缘必须能从某个业务指标追到具体输出分区、运行、代码版本和输入列，也能在上游变更前列出有 owner 的下游清单。不能回答到 Run 和版本层面的图，只是漂亮的系统地图。

## 参考资料

- [OpenLineage：Core Specification](https://github.com/OpenLineage/OpenLineage/blob/main/spec/OpenLineage.md)
- [OpenLineage：Column Lineage Dataset Facet](https://openlineage.io/docs/spec/facets/dataset-facets/column_lineage_facet/)
