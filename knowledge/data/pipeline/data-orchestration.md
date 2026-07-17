数据编排器负责“何时运行什么、依赖是否满足、失败怎样恢复”，不应承载实际数据计算。一个可靠 DAG 要把逻辑数据区间、任务幂等性、重试、回填和并发上限显式化；仅把一串脚本画成箭头，仍然无法安全重跑。

![数据编排 DAG 中逻辑日期、任务依赖、重试退避、回填与并发限制](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/data-orchestration-dag-retry-backfill-v1.webp)
*图：每个 Run 对应明确数据区间；任务输出按区间和版本寻址，重试与 backfill 不覆盖其他运行。*

## DAG 是控制面

[Airflow DAG 文档](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html)将 DAG 定义为包含任务、依赖和调度的工作流。编排器提交 Spark、SQL、容器或 API 任务并记录状态，但不应把大量数据经过 scheduler 进程传递。任务间交换稳定数据引用和小型元数据。

DAG 必须无环，因为循环会让完成条件不明确。业务上的迭代通过单任务内部循环、有限展开或由上一 Run 产生下一 Run 输入实现，而不是创建运行时依赖环。

## 逻辑日期不是启动时间

每天 02:00 运行的 `2026-07-16` 日批，通常处理 7 月 16 日的数据区间，即使实际因上游延迟到 04:00 才启动。任务查询应使用编排器传入的 interval start/end，不使用 `now()` 猜测。这样重跑过去日期仍能读取同一范围。

输出按 dataset、interval、codeVersion 分区，先写 staging，校验后原子发布 success marker 或元数据指针。不要直接覆盖“latest”；否则并发 Run 和回填会相互踩踏。

## 幂等决定重试是否安全

[Airflow Task 文档](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/tasks.html)描述 task instance 的执行状态和重试。编排器的 retry 只会再次调用任务，不会自动撤销已写数据库、已发消息或已调用外部 API 的部分结果。

任务应具有确定输入、版本化输出和提交边界。数据库写入使用 merge/upsert 与 runId；文件先写临时位置再原子发布；外部动作使用 idempotency key。若无法幂等，就把副作用拆成有账本的单独任务，并在重试前查询结果。

重试采用指数退避和抖动，区分暂时错误与永久错误。schema 不兼容或权限拒绝不应重试数十次；上游 503 可以有限重试。最大次数、总 deadline 与 on-call 告警需协调。

## 依赖表达数据就绪

任务成功不一定意味着数据可用。上游可能生成空分区或质量失败。依赖应指向带 schema、完成标志和质量结果的数据产品，而不是只看某个进程退出码。跨 DAG 使用 dataset event 或外部 marker 时，携带 interval 和 version，避免误把昨天的成功当今天就绪。

动态任务映射需控制 fan-out。突然出现百万分区会淹没 scheduler；先汇总 manifest、限制并发和批大小。资源池按数据库、API 或集群容量设置，而不是每个 DAG 各自宣称最大并发。

## Backfill 是受控再计算

[Airflow Backfill](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/backfill.html)为历史逻辑日期创建运行，并提供重新处理和并发控制。回填前冻结代码与依赖版本，列出日期范围，估算读写负载并决定与实时任务的优先级。

新逻辑回填应写新版本分区，校验后切换；不要用当前代码静默重写多年历史。若参考维表会变化，明确使用“事件当时版本”还是“当前修正版”。重放通知、计费等副作用默认关闭。

## SLA、告警与恢复

区分 schedule delay、queue delay、run duration、data freshness 和 deadline miss。用户关心的是数据何时可用，不是 task 是否颜色变绿。告警附带 DAG/run/task、数据区间、最后成功、上游状态、重试次数和运行手册。

失败恢复从最近可验证产物继续，而不是清空全部重跑。为每个任务保存输入 manifest、代码版本、输出摘要和质量结果。scheduler 数据库损坏时，应能从 DAG 定义和数据产物重建控制状态。

## 测试清单

在单元测试验证日期区间、分支和模板；在集成测试运行小型历史数据。演练重复 retry、同区间并发、上游迟到、空分区、部分输出、回填与实时竞争、代码回滚。一个成熟 DAG 的任意 task instance 都能回答：处理哪个数据区间、输入版本是什么、重复执行会怎样、输出何时被视为已提交。

## 参考资料

- [Apache Airflow：DAGs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html)
- [Apache Airflow：Tasks](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/tasks.html)
- [Apache Airflow：Backfill](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/backfill.html)
