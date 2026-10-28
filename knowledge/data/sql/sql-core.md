![SQL 逻辑处理阶梯：FROM/JOIN→WHERE→GROUP BY→HAVING→SELECT→DISTINCT→ORDER BY→LIMIT；旁边用三值逻辑 TRUE/FALSE/UNKNOWN 展示 NULL 过滤行为](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/sql-logical-query-processing-order-v1.webp)
*图：沿图中的节点与箭头阅读，重点是关系查询的逻辑处理顺序讲清 SELECT、JOIN、GROUP BY、HAVING、子查询、CTE 与 NULL 三值逻辑。*

---

SQL 是关系型数据库的声明式查询语言，其核心价值在于用**逻辑意图**描述"要什么"而非"怎么取"，查询优化器负责将意图翻译为高效的物理执行计划。对于 AI/Agent 工程师而言，SQL 同样是构建 RAG（检索增强生成）数据管道、知识图谱查询和 Agent 记忆系统的基础设施。（参见 [PostgreSQL SQL language tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html)）

---

## SELECT 执行顺序与查询优化器

### 逻辑执行顺序

下面是解释查询语义的逻辑处理顺序，不是物理执行计划。优化器可以在保持结果语义的前提下重排或合并操作。示例主要使用 MySQL 8.4 可用写法，递归路径数组另标为 PostgreSQL 方言。

```
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

**为什么执行顺序重要？**

每一步产生一个中间结果集（虚拟表），下一步在此基础上继续处理。这意味着：

- `WHERE` 时 `SELECT` 别名尚不存在，`WHERE alias > 10` 会报错；
- 同一查询层的 `WHERE` 不能直接按组聚合结果筛选；这类条件通常写在 `HAVING`，聚合表达式也可用于 `SELECT`、适用的 `ORDER BY` 等位置；
- `LIMIT` 截取结果；要稳定选出同一批行，`ORDER BY` 还应能打破并列，例如追加唯一主键。别名可见性受方言影响：[MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/problems-with-alias.html)允许在 `GROUP BY`、`HAVING` 和 `ORDER BY` 引用选择列别名，不能把逻辑阶段机械当作所有方言的语法规则。

```sql
-- 完整示例：按部门统计活跃员工，取平均薪资最高的前 5 个部门
SELECT department,
       COUNT(*)       AS headcount,
       AVG(salary)    AS avg_salary
FROM   employees
WHERE  status = 'active'          -- ① 先过滤行（此时 avg_salary 别名不存在）
GROUP BY department               -- ② 分组
HAVING COUNT(*) > 5               -- ③ 对分组结果过滤；写表达式便于跨方言阅读
ORDER BY avg_salary DESC          -- ④ 排序（SELECT 别名在此可用，因为 SELECT 已执行）
LIMIT 5;                          -- ⑤ 截取
```

### 查询优化器的物理执行

逻辑执行顺序描述语义，物理执行顺序由查询优化器（Query Optimizer）决定。优化器会做谓词下推（Predicate Pushdown，尽早过滤减少数据量）、选择 JOIN 算法、重排 JOIN 顺序等变换。`EXPLAIN ANALYZE` 可查看实际执行计划，是定位慢查询的第一工具。

---

## JOIN 类型与连接算法

### 四种标准 JOIN 的语义

以 `orders`（订单）和 `customers`（客户）为例，两表通过 `customer_id` 关联。

```sql
-- INNER JOIN：仅保留两表都能匹配的行
SELECT o.id, c.name
FROM   orders o
INNER  JOIN customers c ON o.customer_id = c.id;

-- LEFT JOIN：保留左表全部行，右表无匹配填 NULL
SELECT o.id, c.name
FROM   orders o
LEFT   JOIN customers c ON o.customer_id = c.id;

-- RIGHT JOIN：保留右表全部行，左表无匹配填 NULL（可等价改写为 LEFT JOIN 调换表顺序）
SELECT o.id, c.name
FROM   customers c
LEFT   JOIN orders o ON o.customer_id = c.id;

-- FULL OUTER JOIN 的保重复模拟：MySQL 8.4 没有原生 FULL JOIN 语法
-- 第一支保留左连接全部行，第二支只补没有订单匹配的客户。
SELECT o.id, c.name
FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
UNION ALL
SELECT NULL AS id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
```

| JOIN 类型 | 左表无匹配 | 右表无匹配 | 典型用途 |
|-----------|-----------|-----------|---------|
| INNER JOIN | 丢弃 | 丢弃 | 只取有效关联数据 |
| LEFT JOIN | 保留，右侧 NULL | 丢弃 | 主表驱动，扩展维度信息 |
| RIGHT JOIN | 丢弃 | 保留，左侧 NULL | 等价于调换表顺序的 LEFT JOIN |
| FULL OUTER JOIN | 保留，右侧 NULL | 保留，左侧 NULL | 数据对账、合并两个不完全重叠的集合 |

全连接模拟的两支使用相同的 `=` 匹配条件，不依赖“某个可空业务列为 NULL 就一定未匹配”。第一支输出所有匹配对及左侧未匹配行，第二支只输出右侧未匹配行，`UNION ALL` 保留投影后相同的多行。支持范围见 [MySQL 8.4 JOIN 语法](https://dev.mysql.com/doc/refman/8.4/en/join.html)，重复规则见 [集合操作文档](https://dev.mysql.com/doc/refman/8.4/en/set-operations.html)。

教学反例：orders 为空，customers 有 `(id=1,name='同名')` 和 `(id=2,name='同名')`。投影 `o.id,c.name` 的全连接应有两行 `(NULL,'同名')`；直接将左右连接用 `UNION` 拼接却只剩一行。若业务要求唯一投影结果，应另行显式去重，不能当成 JOIN 的默认语义。

### LEFT JOIN 的保留范围示意

![LEFT JOIN 保留左侧匹配和未匹配来源行；A 为左侧独有区域、B 为匹配区域、C 为右侧独有区域。此图不表示输出重复次数](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/pdf-sql-core-mermaid-f6236f43fad9.png)

A：仅在 orders 中（customer_id 为 NULL 或无对应客户），c.name 补 NULL；B：两表匹配的订单；C：仅在 customers 中、没有对应订单的客户，不单独输出。

> 说明：图仅概括来源行的保留范围，不表达输出行数或匹配次数。LEFT JOIN 保留左侧的匹配行与未匹配行，不单独输出右侧未匹配行；一对多会产生多行，投影相同的输出也默认保留。

### 连接算法：嵌套循环 vs 哈希连接

查询优化器在执行 JOIN 时会从多种物理算法中选择代价最小的一种。理解两种主要算法有助于写出对优化器友好的 SQL。

**嵌套循环连接（Nested Loop Join）**

对外表（驱动表）的每一行，逐一扫描内表寻找匹配行。

```
for each row r in outer_table:
    for each row s in inner_table:
        if r.key == s.key: emit(r, s)
```

- 朴素双重扫描需 O(M × N) 次条件比较，M、N 为输入行数；
- 若每次可借 B-tree 索引定位，简化成本可记为 O(M log N + R)，R 为输出匹配对数；一对多输出的代价不能省掉；
- 小驱动输入、可用索引与较少匹配行可能使其合适，实际还取决于统计信息、缓存和随机访问代价。

**哈希连接（Hash Join）**

分两阶段执行：下面仅描述等值内连接的简化模型：对构建端的连接键建哈希桶，再扫描探测端查找。通常希望构建端较小，但由物理计划决定，不能按 SQL 左右顺序猜测。

```
-- Build phase
for each row r in build_table:
    if r.key is not NULL: buckets[hash(r.key)].append(r)

-- Probe phase
for each row s in probe_table:
    if s.key is not NULL:
        for r in buckets.get(hash(s.key), []):
            if r.key == s.key: emit(r, s)  -- 比较实际键，保留全部匹配对
```

- 在哈希分布等假设下，简化平均成本为 O(M + N + R)，还需保存构建端；哈希碰撞须比较实际键，同键多行不能互相覆盖；
- 构建端内存不足可能分批或溢写磁盘，不能把内存模型当作性能保证；
- 索引是否可用于连接条件、选择率、行宽及内存等共同影响方案，按实际计划判断。[MySQL 8.4 文档](https://dev.mysql.com/doc/refman/8.4/en/hash-joins.html)也说明了哈希连接的内存预算与磁盘溢写。

| 算法 | 时间复杂度 | 内存需求 | 最佳场景 |
|------|-----------|---------|---------|
| 索引嵌套循环（简化） | O(M log N + R) | 依实现与缓存而定 | 可用连接索引、驱动输入及匹配量较小 |
| 朴素嵌套循环 | O(M × N + R) | 低 | 很小输入或其他算法不适用 |
| 等值哈希连接（平均模型） | O(M + N + R) | 需构建端与桶；可能溢写 | 计划选择哈希查找的等值连接 |

上表是教学成本模型，不是优化器的固定规则。检查连接条件、可用索引、估计/实际行数及输出基数，再用计划判断；`YEAR(created_at)=2024` 这样的过滤条件与两表连接键条件也不是同一件事。

---

## GROUP BY 与聚合

### 分组与聚合函数

`GROUP BY` 将结果集折叠为若干"桶"，每个桶产生一行输出。常用聚合函数（Aggregate Function）：`COUNT`、`SUM`、`AVG`、`MAX`、`MIN`。

可移植的基本写法是选择列要么聚合，要么作为分组列，但标准的可选功能依赖规则及实现支持还有边界。[MySQL 8.4 的 `ONLY_FULL_GROUP_BY`](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html)允许能由分组列推导的函数依赖，例如同表主键或合适的 `UNIQUE NOT NULL` 键确定的列；文档还列出被 `WHERE` 限为单值的特定情况。不能把它简化为“非聚合列必须逐字在 GROUP BY”；也不能靠关闭模式任取每组一行来代替确定的保留规则。

```sql
-- 每个部门的人数、最高薪资和薪资总额
SELECT department,
       COUNT(*)       AS headcount,
       MAX(salary)    AS max_sal,
       SUM(salary)    AS total_sal
FROM   employees
GROUP BY department;
```

### HAVING 与 WHERE 的职责边界

```sql
-- 找出"活跃员工超过 5 人且平均薪资高于 10000"的部门
SELECT department, AVG(salary) AS avg_sal
FROM   employees
WHERE  status = 'active'         -- WHERE：分组前过滤原始行
GROUP BY department
HAVING COUNT(*) > 5              -- HAVING：分组后过滤聚合结果
   AND AVG(salary) > 10000;
```

先按语义选位置：行条件属于 `WHERE`，组聚合条件属于 `HAVING`。只有保持结果等价时才考虑提前过滤；优化器也可能自行下推，不能保证改写必更快。

### 窗口函数（Window Function）

窗口函数在保留原始行的同时计算聚合值，不折叠结果集，是 `GROUP BY` 的有力补充。

```sql
SELECT name,
       department,
       salary,
       AVG(salary)   OVER (PARTITION BY department)                   AS dept_avg,
       RANK()        OVER (PARTITION BY department ORDER BY salary DESC) AS sal_rank
FROM   employees;
```

`PARTITION BY` 是窗口函数的"分组"，`ORDER BY` 决定窗口内的排序语义。`ROW_NUMBER`、`RANK`、`DENSE_RANK` 的区别是面试高频题：

| 函数 | 并列值处理 | 序号是否连续 | 示例（薪资相同）|
|------|-----------|-----------|--------------|
| ROW_NUMBER | 强制唯一，任意打破平局 | 连续 | 1, 2, 3, 4 |
| RANK | 并列后跳号 | 不连续 | 1, 1, 3, 4 |
| DENSE_RANK | 并列不跳号 | 连续 | 1, 1, 2, 3 |

---

## 子查询与 CTE

### 子查询（Subquery）

嵌套在其他语句中的 `SELECT`，分为**非相关子查询**和**相关子查询**（Correlated Subquery）。（参见 [SQLite SELECT documentation](https://www.sqlite.org/lang_select.html)）

```sql
-- 非相关：不引用外层列；物理求值次数由执行计划决定
SELECT name, salary
FROM   employees
WHERE  salary > (SELECT AVG(salary) FROM employees);

-- 相关：引用外层 e.department；物理上不一定逐行重算
SELECT name, department, salary
FROM   employees e
WHERE  salary > (
    SELECT AVG(salary)
    FROM   employees
    WHERE  department = e.department   -- 引用外层 e
);
```

相关描述的是依赖关系，不直接规定物理求值次数。[MySQL 8.4 文档](https://dev.mysql.com/doc/refman/8.4/en/correlated-subqueries.html)说明了在优化开关及条件满足时转成派生表的情况。下面可改写为按部门聚合后连接；是否更快须测计划和负载：

```sql
-- 此例的语义改写；仍按 = 匹配，NULL 部门不会互相匹配
SELECT name, department, salary
FROM   employees e
JOIN  (SELECT department, AVG(salary) AS dept_avg
       FROM   employees
       GROUP BY department) d USING (department)
WHERE  e.salary > d.dept_avg;
```

### CTE（公共表表达式）

`WITH` 子句定义命名临时结果集，逻辑层次清晰，支持多次引用同一 CTE（部分数据库会物化以避免重复计算）。

```sql
WITH dept_avg AS (
    SELECT department, AVG(salary) AS avg_sal
    FROM   employees
    GROUP BY department
),
high_earners AS (
    SELECT e.name, e.department, e.salary, d.avg_sal
    FROM   employees e
    JOIN   dept_avg d ON e.department = d.department
    WHERE  e.salary > d.avg_sal * 1.2
)
SELECT * FROM high_earners ORDER BY salary DESC;
```

### 递归 CTE 与知识图谱查询

递归 CTE 包含**锚点成员**（初始行集）与**递归成员**（基于上一轮工作集扩展）。依目标使用 `UNION` 或 `UNION ALL`；后者保留重复，环与多路径需专门处理。下面采用 `UNION ALL`，迭代到没有新增行或由显式终止条件停止，并须受数据库资源限制约束。

```sql
WITH RECURSIVE cte_name AS (
    -- 锚点成员：初始集合
    anchor_query
    UNION ALL
    -- 递归成员：引用 cte_name 自身，每轮在上一轮结果基础上扩展
    recursive_query
)
SELECT * FROM cte_name;
```

**Agent 记忆/知识图谱教学案例**

在 Agent 系统中，经常需要将实体关系存储为图结构。以下场景：一个 LLM Agent 维护着一张 `kg_edges`（知识图谱边）表，记录概念节点之间的 `is_a`、`part_of` 等关系。当用户提问时，Agent 需要从某个节点出发，沿关系链路遍历到所有上位概念，再把路径上的节点文本拼接进 Prompt（即 Graph-RAG 的一种实现）。

```sql
-- 知识图谱边表
-- CREATE TABLE kg_edges (
--   from_node VARCHAR(64),
--   to_node   VARCHAR(64),
--   relation  VARCHAR(32)   -- 'is_a', 'part_of', 'related_to' …
-- );

-- 从 'transformer' 节点出发，沿 is_a/part_of 向上遍历所有祖先概念
WITH RECURSIVE ancestors AS (
    -- 锚点：起始节点的出边；path 保存该路径访问过的 from_node
    SELECT from_node AS node,
           to_node   AS parent,
           relation,
           1         AS depth,
           ARRAY[from_node] AS path      -- PostgreSQL 语法，防止环路
    FROM   kg_edges
    WHERE  from_node = 'transformer'
      AND  relation IN ('is_a', 'part_of')

    UNION ALL

    -- 递归：从上一轮的 parent 继续向上
    SELECT e.from_node,
           e.to_node,
           e.relation,
           a.depth + 1,
           a.path || e.from_node
    FROM   kg_edges e
    JOIN   ancestors a ON e.from_node = a.parent
    WHERE  e.relation IN ('is_a', 'part_of')
      AND  NOT (e.from_node = ANY(a.path))   -- 防止有环图死循环
      AND  a.depth < 10                       -- 深度上限，避免超深递归
)
SELECT DISTINCT node, parent, relation, depth
FROM   ancestors
ORDER BY depth;
```

结果提供边、节点和深度，应用仍需鉴权、去重、筛选与预算控制后再组织上下文。它能利用已存层次关系；是否改善回答质量取决于图数据与评测，本文没有做优于纯向量检索的实测比较。

### 子查询 vs CTE 选择矩阵

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 一次性、简单过滤 | 子查询 | 无需命名，代码紧凑 |
| 逻辑复杂、需多次引用 | CTE | 可复用，层次清晰 |
| 适合在关系库内表达的层级遍历 | 递归 CTE | 可声明迭代与终止；不是唯一方案 |
| 已由计划确认的相关子查询瓶颈 | 比较等价连接、预聚合或适用窗口写法 | 先保持 NULL、重复行和标量基数合同 |
| 调试中间结果 | CTE | 将目标 CTE 作为最后 SELECT 的输入观察 |

---

## 集合操作

查询去重、清理表内重复实体和阻止并发重复写入是不同合同。SELECT DISTINCT 按整组选出列去重；GROUP BY 按业务键分组并计算聚合，不是任取非分组列。清理重复实体前先明确业务键、保留顺序、NULL 与并发行为；唯一约束用于后续写入约束，不替你决定历史行保留哪条。

`UNION`、`INTERSECT`、`EXCEPT` 对两个结果集进行集合运算，要求**列数相同、对应列数据类型兼容**。

```sql
-- UNION：按选择列去重；UNION ALL 保留重复，不做这一步去重
SELECT document_id FROM corpus_v1
UNION
SELECT document_id FROM corpus_v2;

-- INTERSECT：取交集（两次都出现的文档）
SELECT product_id FROM sales_2024
INTERSECT
SELECT product_id FROM sales_2023;

-- EXCEPT（Oracle/部分方言用 MINUS）：取差集
SELECT customer_id FROM customers
EXCEPT
SELECT customer_id FROM orders;   -- 从未下单的客户
```

**集合操作与 RAG 数据管道**：在构建向量数据库的增量更新管道时，常用 `EXCEPT` 找出"已在候选池但尚未嵌入"的文档，或用 `INTERSECT` 核验两个版本语料库的重叠文档，再决定是否重新计算 Embedding。

| 操作 | 等价逻辑 | 是否去重 | 性能提示 |
|------|---------|---------|---------|
| UNION | A ∪ B | 是（隐含 DISTINCT） | 有额外排序/哈希代价 |
| UNION ALL | 拼接两个多重集 | 否 | 不需要去重步骤；总成本仍看输入和计划 |
| INTERSECT | A ∩ B | 是 | — |
| EXCEPT | A − B | 是 | — |

---

## 常见误区

**误区 1：在 WHERE 中使用聚合函数**

限制针对同一查询层：不能直接在这一层的 `WHERE` 用组聚合过滤。前文 `WHERE salary > (SELECT AVG(salary) FROM employees)` 是合法的标量子查询写法，`AVG` 属于内层查询，不与该限制冲突。

```sql
-- 错误
SELECT department FROM employees WHERE COUNT(*) > 5 GROUP BY department;
-- 正确
SELECT department FROM employees GROUP BY department HAVING COUNT(*) > 5;
```

**误区 2：拒绝 NULL 补齐行的 WHERE 条件会改变 LEFT JOIN 的保留效果**

关键是谓词对右侧 NULL 补齐行的求值结果。若它为 FALSE 或 UNKNOWN，这些未匹配行会被滤掉；若为 TRUE，则仍可能保留。例如 `WHERE c.region IS NULL` 可以同时留下未匹配订单和 region 本就为 NULL 的匹配客户，不能泛称“对右表字段过滤就变 INNER JOIN”。见 [MySQL 8.4 外连接简化的拒 NULL 条件](https://dev.mysql.com/doc/refman/8.4/en/outer-join-simplification.html)。

```sql
-- 以下两句等价，LEFT JOIN 语义已被 WHERE 破坏
SELECT * FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
WHERE  c.id IS NOT NULL;
-- 等价于
SELECT * FROM orders o INNER JOIN customers c ON o.customer_id = c.id;

-- 若要过滤特定客户同时保留无客户订单，条件应放在 ON 子句中
SELECT * FROM orders o LEFT JOIN customers c
  ON o.customer_id = c.id AND c.region = 'CN';
```

**误区 3：NULL 的比较行为**

任何值与 `NULL` 做等值比较（`=`、`!=`）结果均为 `NULL`（既非 `TRUE` 也非 `FALSE`），必须用 `IS NULL` / `IS NOT NULL`。`COUNT(column)` 不计 `NULL`，`COUNT(*)` 计所有行。

```sql
-- 错误：永远不会匹配
WHERE manager_id = NULL
-- 正确
WHERE manager_id IS NULL
```

**误区 4：UNION 的隐式去重代价**

`UNION` 隐含 `DISTINCT`，通常需要额外的重复消除工作。是否使用 `ALL` 先由结果合同决定：保留重复时要用 `ALL`，要求唯一结果时仍须去重，不能只为性能改变语义。

**误区 5：递归 CTE 无终止条件导致死循环**

终止取决于递归是否最终不再产生新的工作行。[PostgreSQL 18 文档](https://www.postgresql.org/docs/18/queries-with.html)区分 `UNION` 的整行去重与 `UNION ALL` 的保重复。只输出节点身份、在有限图上求可达性时，`UNION` 可消除已访问节点并使带环遍历停止；下面的输出不带不断变化的 depth 或 path：

```sql
-- 教学条件：有限 edges(from_node,to_node) 图，只求从节点 1 可达的节点。
WITH RECURSIVE reachable(node) AS (
  SELECT 1
  UNION
  SELECT e.to_node
  FROM edges e JOIN reachable r ON e.from_node = r.node
)
SELECT node FROM reachable ORDER BY node;
```

若输出还包含递增 depth，即使回到同一节点也成为不同的整行，换成 `UNION` 未必终止；此时需按目标定义访问状态、路径检测或有意义的深度限制，并配置资源预算。深度截断只能保证有界，不能把被截去的路径当作完整结果。

---

## 最佳实践

- **索引策略**：根据连接、过滤与选择率评估索引。若希望按普通日期索引范围查找，`YEAR(created_at)=2024` 可比较改为 `created_at >= '2024-01-01' AND created_at < '2025-01-01'`；只写下界会错误包含以后年份。具体效果仍须核对计划。
- **先证等价再比较子查询改写**：保留 NULL、重复匹配与标量最多一行的合同，再比较实际计划；相关子查询可能被优化，不保证手工改写获益。
- **CTE 优于深层嵌套子查询**：超过两层嵌套的子查询可读性极差，用 CTE 拆解每个逻辑步骤，便于调试和维护。
- **EXPLAIN 先行**：慢查询先用 `EXPLAIN ANALYZE` 查看执行计划，确认是全表扫描、错误 JOIN 顺序还是排序代价过高，再针对性优化。
- **先决定重复行合同**：需要保留重复时用 `UNION ALL`；要求选择列唯一时才去重。
- **RAG 管道中用 SQL 做增量过滤**：在向量数据库更新前，先用 `EXCEPT` 或 `LEFT JOIN … IS NULL` 模式从关系库中筛出尚未处理的文档，避免重复计算 Embedding，降低 API 调用成本。

---

## 面试常问要点

1. **执行顺序**：`FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`，书写顺序与执行顺序不同；别名位置按方言核对，MySQL 8.4 还允许用于 `GROUP BY` 和 `HAVING`。

2. **LEFT JOIN + WHERE 陷阱**：判断条件是否拒绝右侧 NULL 补齐行。例中 `c.id IS NOT NULL` 会去掉未匹配订单；`c.region IS NULL` 则可能保留它们。是否把条件放入 `ON` 取决于要表达的匹配与过滤合同。

3. **HAVING vs WHERE**：`WHERE` 在分组前过滤原始行（减少分组数据量），`HAVING` 在分组后过滤聚合结果；能用 `WHERE` 的不要用 `HAVING`。

4. **ROW_NUMBER / RANK / DENSE_RANK**：并列时 `RANK` 跳号（1,1,3），`DENSE_RANK` 不跳号（1,1,2），`ROW_NUMBER` 强制唯一无并列。

5. **嵌套循环 vs 哈希连接**：比较输入、索引、选择率、构建内存和输出量 R；哈希桶要保存全部同键行并检查碰撞，不能覆盖同键其他行。教学复杂度不替代计划。

6. **相关子查询性能**：相关是外层引用关系，不保证物理上逐行执行；查计划后再比较保持结果等价的改写。

7. **递归 CTE 终止条件**：锚点 + `UNION`/`UNION ALL` + 递归成员。有限状态可用 `UNION` 整行去重停止；含不断变化的 depth/path 时需另设访问或截断规则，不能假定换 UNION 就能去环。

8. **NULL 特殊性**：等值比较返回 `NULL` 而非 `FALSE`；`COUNT(col)` 跳过 `NULL`；`col = NULL` 不能选出 NULL 行；`IS NULL` 是否利用索引取决于数据库、索引和计划。

9. **集合操作去重代价**：`UNION` 隐含去重有排序/哈希代价，不需去重时用 `UNION ALL`；`INTERSECT`/`EXCEPT` 同样隐含去重。

10. **子查询 vs CTE**：CTE 提供命名和分层；内联或物化取决于数据库、查询及引用方式，不能保证计划相同或必然更快。参见 [PostgreSQL 18 的 CTE 物化规则](https://www.postgresql.org/docs/18/queries-with.html)。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [百度测开多轮：SQL 分组与 Skill 实践](../../../interview/baidu/ai/baidu-ai-8.md)
- [字节 AI 全栈一面：Pipeline 质量、Doris 与消息轮播](../../../interview/bytedance/base/bytedance-base-23.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
<!-- interview-source-history:end -->

## 参考资料

- [PostgreSQL SQL language tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html)
- [SQLite SELECT documentation](https://www.sqlite.org/lang_select.html)

本文按 MySQL 8.4 文档核对方言边界；PostgreSQL 路径数组与 CTE 规则另行注明。示例为教学查询，不表示已连接生产数据库或做性能对比。
- [MySQL 8.4：JOIN](https://dev.mysql.com/doc/refman/8.4/en/join.html)
- [MySQL 8.4：集合操作与ALL](https://dev.mysql.com/doc/refman/8.4/en/set-operations.html)
- [MySQL 8.4：GROUP BY与功能依赖](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html)
- [MySQL 8.4：选择列别名](https://dev.mysql.com/doc/refman/8.4/en/problems-with-alias.html)
- [MySQL 8.4：相关子查询](https://dev.mysql.com/doc/refman/8.4/en/correlated-subqueries.html)
- [MySQL 8.4：哈希连接](https://dev.mysql.com/doc/refman/8.4/en/hash-joins.html)
- [PostgreSQL 18：WITH查询](https://www.postgresql.org/docs/18/queries-with.html)
- [MySQL 8.4：外连接简化与拒 NULL 谓词](https://dev.mysql.com/doc/refman/8.4/en/outer-join-simplification.html)
