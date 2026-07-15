“在数据库上做 RAG”并不等于把每行转成一句话再做向量检索。结构化数据的价值恰恰在类型、关系、约束与可计算性。正确设计要先判断问题需要精确查询、单元格证据还是文档解释，再在同一权限与语义层下执行。

## 三种问题，三条路径

一套结构化检索系统通常同时支持：

- **SQL 路径**：计数、聚合、排序、连接、时间窗口等可计算问题；
- **Cell / Row 路径**：找到某个产品、订单或指标对应的原始记录；
- **Text 路径**：解释字段定义、业务口径、报表备注和数据字典。

例如“华东区上季度退款最多的三类商品，以及退款率口径是什么？”需要 SQL 计算排名，再从语义层或数据字典检索“退款率”的定义。只做向量召回无法可靠聚合；只生成 SQL 又解释不了口径。

![自然语言问题先经过 Schema 与 ACL 门禁，再路由到 SQL、行列检索或文本解释，最终保留查询和来源证据](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-table-retrieval-query-routing-v1.webp)
*图：授权失败在查询前终止；SQL 还受到超时和行数上限约束。*

## Schema 检索先缩小可见世界

不要把整个生产库 schema 和样例行塞给模型。先用确定性目录筛出当前用户可见的数据集，再按问题检索相关表、字段、指标定义和 join 关系：

```ts
type GovernedSchema = {
  tenantId: string;
  allowedTables: string[];
  columns: Array<{
    table: string;
    name: string;
    type: string;
    description: string;
    sensitivity: 'public' | 'internal' | 'restricted';
  }>;
  approvedJoins: Array<[string, string]>;
  metrics: Array<{ name: string; expressionId: string }>;
};
```

模型看到的 schema 必须是授权后的投影，不是先生成 SQL 再尝试过滤结果。行级与列级策略由数据库、查询代理或策略引擎强制执行；Prompt 里的“不要访问工资表”不构成访问控制。

## 生成的是查询计划，不是任意 SQL

[PostgreSQL Queries 总览](https://www.postgresql.org/docs/current/queries.html)把数据检索拆为表表达式、选择列表、组合、排序、限制和 WITH 等可组合部分。让模型输出受限的结构化计划，再由服务器编译和校验，比直接接受长 SQL 更可控：

```json
{
  "dataset": "sales_daily",
  "dimensions": ["region", "category"],
  "metrics": ["refund_count", "refund_rate"],
  "filters": [{ "field": "quarter", "op": "eq", "value": "2026-Q2" }],
  "orderBy": [{ "metric": "refund_count", "direction": "desc" }],
  "limit": 3
}
```

服务端校验字段、操作符、聚合、join、时间范围和 limit，再用参数绑定生成 SQL。禁止多语句、DDL/DML、注释逃逸、未批准函数和不受限子查询。数据库账户本身只授予最小只读权限。

[PostgreSQL Table Expressions](https://www.postgresql.org/docs/17/queries-table-expressions.html)把 `FROM`、`WHERE`、`GROUP BY`、`HAVING` 描述为逐步生成虚拟表的管线；这提醒我们应在执行记录里保留每个过滤与聚合，而不是只存最终自然语言答案。

## 语义层统一业务口径

同名字段不一定同义，业务指标也不应由模型现场拼公式。语义层为“活跃用户”“净收入”“退款率”等指标保存版本化定义、可用维度、时间粒度和所有者。模型选择 `metric_id`，服务器加载审核过的表达式。

聚合正确性尤其要防：

- 一对多 join 导致重复计数；
- 比率先按行计算再求平均；
- 时区、自然月和财务季度混用；
- NULL 被当作 0；
- 快照表与事件表重复叠加。

这些问题不一定触发 SQL 错误，却会得到流畅而错误的答案。Golden Set 必须包含已知聚合结果和边界条件。

## Cell / Row 检索保留结构

精确实体、SKU、错误码适合关键词或主键检索；自然语言描述可用向量检索。索引单元可以是行、单元格、表格区域或指标切片，但返回结果要保留：数据集版本、主键、行列坐标、字段类型、权限摘要和时间水位。

表格文档中的单元格也不应被完全扁平化。可以把表头路径拼入检索文本：

```text
REPORT: 2026 Q2
ROW: East / Consumer
COLUMN: Refund / Rate
VALUE: 3.2%
```

同时保存结构化值 `0.032`。模型上下文使用可读表示，计算与校验使用原类型。

## 结果本身就是证据包

最终答案旁应保存：

```ts
type QueryEvidence = {
  queryId: string;
  normalizedPlan: unknown;
  sqlHash?: string;
  datasetVersion: string;
  executedAt: string;
  rows: unknown[];
  truncated: boolean;
  policyDecisionId: string;
};
```

若展示 SQL，优先展示规范化只读版本，隐藏物理表名等敏感实现。`truncated: true` 时，模型不得把样本行描述成全量结果。涉及金额、合规或运营决策时，可把聚合值在服务器侧重新计算并断言类型与范围。

## 资源限制与故障策略

查询代理设置 statement timeout、扫描字节、返回行数、并发和成本上限。先运行 `EXPLAIN` 或使用受控模板估算代价；超限时请求缩小时间窗，而不是偷偷截断后继续回答。

不要将数据库错误原样塞回模型：错误可能泄漏表结构。用结构化类别返回 `UNKNOWN_FIELD`、`POLICY_DENIED`、`QUERY_TOO_EXPENSIVE`、`TIMEOUT`，并标明是否可修正重试。模型可以修复一次字段选择，但权限拒绝与永久错误不得循环重试。

## 评测与监控

分层度量：

- 路由：SQL、行列、文本或组合路径是否正确；
- schema：相关表字段召回和越权字段为零；
- 计划：过滤、聚合、join、limit 是否符合标注；
- 执行：结果值、行数、超时和资源使用；
- 答案：数值一致、单位正确、引用可复查。

按多表 join、时间、NULL、比率、同义字段、精确 ID、权限拒绝和 Prompt injection 切片。监控不能记录未经脱敏的全部行；保存哈希、计数和审计 ID，并按权限提供受控回放。

## 小结

表格检索的核心是“受治理的计算 + 可引用的结构证据”。先由 Schema 与 ACL 确定可见范围，再路由到 SQL、行列或文本路径；查询通过语义层、参数化编译和资源限制执行，结果以带版本与策略决策的证据包交给生成层。

## 参考资料

- [PostgreSQL — Queries](https://www.postgresql.org/docs/current/queries.html)
- [PostgreSQL — Table Expressions](https://www.postgresql.org/docs/17/queries-table-expressions.html)
