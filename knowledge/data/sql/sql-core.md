![SQL 逻辑处理阶梯：FROM/JOIN→WHERE→GROUP BY→HAVING→SELECT→DISTINCT→ORDER BY→LIMIT；旁边用三值逻辑 TRUE/FALSE/UNKNOWN 展示 NULL 过滤行为](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/sql-logical-query-processing-order-v1.webp)
*图：沿图中的节点与箭头阅读，重点是关系查询的逻辑处理顺序讲清 SELECT、JOIN、GROUP BY、HAVING、子查询、CTE 与 NULL 三值逻辑。*

---

SQL 是关系型数据库的声明式查询语言，其核心价值在于用**逻辑意图**描述"要什么"而非"怎么取"，查询优化器负责将意图翻译为高效的物理执行计划。对于 AI/Agent 工程师而言，SQL 同样是构建 RAG（检索增强生成）数据管道、知识图谱查询和 Agent 记忆系统的基础设施。（参见 [PostgreSQL SQL language tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html)）

---

## SELECT 执行顺序与查询优化器

### 逻辑执行顺序

SQL 语句的书写顺序（`SELECT … FROM … WHERE …`）与数据库引擎的实际执行顺序不同。理解这一差异是写出正确查询、读懂报错信息的根基。

```
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

**为什么执行顺序重要？**

每一步产生一个中间结果集（虚拟表），下一步在此基础上继续处理。这意味着：

- `WHERE` 时 `SELECT` 别名尚不存在，`WHERE alias > 10` 会报错；
- `WHERE` 时聚合尚未发生，聚合函数只能出现在 `HAVING` 或 `SELECT` 中；
- `LIMIT` 在最末，不加 `ORDER BY` 的 `LIMIT` 结果是不确定的。

```sql
-- 完整示例：按部门统计活跃员工，取平均薪资最高的前 5 个部门
SELECT department,
       COUNT(*)       AS headcount,
       AVG(salary)    AS avg_salary
FROM   employees
WHERE  status = 'active'          -- ① 先过滤行（此时 avg_salary 别名不存在）
GROUP BY department               -- ② 分组
HAVING COUNT(*) > 5               -- ③ 对分组结果过滤（不能写 HAVING headcount > 5，标准 SQL）
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

-- FULL OUTER JOIN：两侧不匹配行均保留（MySQL 不原生支持，用 UNION 模拟）
SELECT o.id, c.name FROM orders o LEFT  JOIN customers c ON o.customer_id = c.id
UNION
SELECT o.id, c.name FROM orders o RIGHT JOIN customers c ON o.customer_id = c.id;
```

| JOIN 类型 | 左表无匹配 | 右表无匹配 | 典型用途 |
|-----------|-----------|-----------|---------|
| INNER JOIN | 丢弃 | 丢弃 | 只取有效关联数据 |
| LEFT JOIN | 保留，右侧 NULL | 丢弃 | 主表驱动，扩展维度信息 |
| RIGHT JOIN | 丢弃 | 保留，左侧 NULL | 等价于调换表顺序的 LEFT JOIN |
| FULL OUTER JOIN | 保留，右侧 NULL | 保留，左侧 NULL | 数据对账、合并两个不完全重叠的集合 |

### Mermaid 可视化：LEFT JOIN 结果集

```mermaid
venn
    title LEFT JOIN：orders LEFT JOIN customers
    A["仅在 orders 中\n(customer_id=NULL 或无对应客户)\nc.name = NULL"]
    B["两表匹配\n(完整订单行)"]
    C["仅在 customers 中\n(从未下单的客户)\n→ 被丢弃"]
```

> 说明：LEFT JOIN 保留左圆（A + B），丢弃右圆独占区域（C）。

### 连接算法：嵌套循环 vs 哈希连接

查询优化器在执行 JOIN 时会从多种物理算法中选择代价最小的一种。理解两种主要算法有助于写出对优化器友好的 SQL。

**嵌套循环连接（Nested Loop Join）**

对外表（驱动表）的每一行，逐一扫描内表寻找匹配行。

```
for each row r in outer_table:
    for each row s in inner_table:
        if r.key == s.key: emit(r, s)
```

- 时间复杂度：O(M × N)，M、N 为两表行数；
- 若内表连接键有索引，复杂度降为 O(M × log N)；
- 适合**小表驱动大表**，且内表连接键有索引的场景。

**哈希连接（Hash Join）**

分两阶段执行：先对小表（构建端）的连接键建内存哈希表，再扫描大表（探测端）查哈希表匹配。

```
-- Build phase
for each row r in build_table:
    hash_table[hash(r.key)] = r

-- Probe phase
for each row s in probe_table:
    if hash_table[hash(s.key)] matches: emit(r, s)
```

- 时间复杂度：O(M + N)，但需要额外内存存储哈希表；
- 适合**无索引的大表等值连接**；
- 连接键上有合适索引时，优化器通常选嵌套循环；无索引大表 JOIN 则多选哈希连接。

| 算法 | 时间复杂度 | 内存需求 | 最佳场景 |
|------|-----------|---------|---------|
| 嵌套循环（有索引） | O(M log N) | 低 | 内表有索引，小驱动表 |
| 嵌套循环（无索引） | O(M × N) | 低 | 极小表 |
| 哈希连接 | O(M + N) | 中高（需容纳构建端） | 大表无索引等值 JOIN |

实践中，在 JOIN 键上建索引、避免 JOIN 键做函数运算（如 `ON YEAR(o.created_at) = 2024`），是影响优化器选择更优算法的关键手段。

---

## GROUP BY 与聚合

### 分组与聚合函数

`GROUP BY` 将结果集折叠为若干"桶"，每个桶产生一行输出。常用聚合函数（Aggregate Function）：`COUNT`、`SUM`、`AVG`、`MAX`、`MIN`。

**标准 SQL 规则**：`SELECT` 中的非聚合列必须出现在 `GROUP BY` 中（MySQL 的 `ONLY_FULL_GROUP_BY` 模式强制执行此规则，其他方言行为各异）。

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

`WHERE` 阶段消除不满足条件的行，减少进入 `GROUP BY` 的数据量，性能优先于 `HAVING`。能用 `WHERE` 过滤的条件不要放到 `HAVING`。

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
-- 非相关子查询：整个子查询只执行一次
SELECT name, salary
FROM   employees
WHERE  salary > (SELECT AVG(salary) FROM employees);

-- 相关子查询：外层每行执行一次，性能差
SELECT name, department, salary
FROM   employees e
WHERE  salary > (
    SELECT AVG(salary)
    FROM   employees
    WHERE  department = e.department   -- 引用外层 e
);
```

相关子查询的时间复杂度与外表行数成正比，生产环境应改写为 JOIN + 窗口函数：

```sql
-- 等价改写，性能更优
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

递归 CTE（Recursive CTE）由两部分通过 `UNION ALL` 连接：**锚点成员**（Anchor Member，初始行集）和**递归成员**（Recursive Member，每轮迭代新增的行）。数据库引擎反复执行递归成员直到结果集为空。

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

**Agent 记忆/知识图谱实际案例**

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
    -- 锚点：起始节点自身
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

查询结果返回的节点列表可直接拼入 RAG 的上下文窗口，为 LLM 提供结构化的背景知识，显著优于纯向量检索对层次关系的处理能力。

### 子查询 vs CTE 选择矩阵

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 一次性、简单过滤 | 子查询 | 无需命名，代码紧凑 |
| 逻辑复杂、需多次引用 | CTE | 可复用，层次清晰 |
| 树形/图形层级遍历 | 递归 CTE | 唯一标准做法 |
| 相关子查询性能瓶颈 | 改写为 JOIN + 窗口函数 | 避免逐行子查询 |
| 调试中间结果 | CTE | 可单独执行每个 WITH 块 |

---

## 集合操作

`UNION`、`INTERSECT`、`EXCEPT` 对两个结果集进行集合运算，要求**列数相同、对应列数据类型兼容**。

```sql
-- UNION：合并并去重（UNION ALL 保留重复行，性能更优）
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
| UNION ALL | A ∪ B（含重复） | 否 | 比 UNION 快，明确不需去重时首选 |
| INTERSECT | A ∩ B | 是 | — |
| EXCEPT | A − B | 是 | — |

---

## 常见误区

**误区 1：在 WHERE 中使用聚合函数**

执行顺序决定了聚合发生在 `WHERE` 之后，在 `WHERE` 中调用聚合函数会直接报语法错误。

```sql
-- 错误
SELECT department FROM employees WHERE COUNT(*) > 5 GROUP BY department;
-- 正确
SELECT department FROM employees GROUP BY department HAVING COUNT(*) > 5;
```

**误区 2：LEFT JOIN 被 WHERE 子句"降级"为 INNER JOIN**

`LEFT JOIN` 的语义（保留左表所有行）会被 `WHERE` 对右表字段的过滤条件破坏，因为 `WHERE` 在 `JOIN` 之后执行，右表为 `NULL` 的行会被过滤掉。

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

`UNION` 隐含 `DISTINCT`，执行时会对整个结果集做排序或哈希去重，代价不可忽视。确认不存在重复时应使用 `UNION ALL`。

**误区 5：递归 CTE 无终止条件导致死循环**

数据存在环路（如知识图谱中的双向关联）时，没有环路检测的递归 CTE 会无限循环直到超过深度限制或内存耗尽。必须使用路径数组或深度上限作为终止条件。

---

## 最佳实践

- **索引策略**：大表 JOIN 前确保连接键有索引；WHERE 过滤的高选择性列也应建索引；避免对索引列做函数运算（`WHERE YEAR(created_at) = 2024` 会导致全表扫描，改为范围条件 `WHERE created_at >= '2024-01-01'`）。
- **用 JOIN 替代相关子查询**：相关子查询逐行执行，复杂度高；等价改写为 JOIN 后优化器能选择哈希连接等更高效的算法。
- **CTE 优于深层嵌套子查询**：超过两层嵌套的子查询可读性极差，用 CTE 拆解每个逻辑步骤，便于调试和维护。
- **EXPLAIN 先行**：慢查询先用 `EXPLAIN ANALYZE` 查看执行计划，确认是全表扫描、错误 JOIN 顺序还是排序代价过高，再针对性优化。
- **UNION ALL 优先**：明确结果集不含重复时用 `UNION ALL` 代替 `UNION`，避免不必要的去重开销。
- **RAG 管道中用 SQL 做增量过滤**：在向量数据库更新前，先用 `EXCEPT` 或 `LEFT JOIN … IS NULL` 模式从关系库中筛出尚未处理的文档，避免重复计算 Embedding，降低 API 调用成本。

---

## 面试常问要点

1. **执行顺序**：`FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`，书写顺序与执行顺序不同；别名只能在 `SELECT` 执行后的阶段（`ORDER BY`）引用。

2. **LEFT JOIN + WHERE 陷阱**：对右表字段加 `IS NOT NULL` 等过滤条件，会使 LEFT JOIN 退化为 INNER JOIN；若要保留左表行同时过滤右表，条件应放在 `ON` 子句中。

3. **HAVING vs WHERE**：`WHERE` 在分组前过滤原始行（减少分组数据量），`HAVING` 在分组后过滤聚合结果；能用 `WHERE` 的不要用 `HAVING`。

4. **ROW_NUMBER / RANK / DENSE_RANK**：并列时 `RANK` 跳号（1,1,3），`DENSE_RANK` 不跳号（1,1,2），`ROW_NUMBER` 强制唯一无并列。

5. **嵌套循环 vs 哈希连接**：内表有索引时优化器倾向嵌套循环；大表无索引等值 JOIN 优化器倾向哈希连接；JOIN 键上建索引是最直接的优化手段。

6. **相关子查询性能**：逐行执行，时间复杂度 O(M × cost_of_subquery)，大数据量应改写为 JOIN 或窗口函数。

7. **递归 CTE 终止条件**：锚点 + `UNION ALL` + 递归成员；有环图必须加路径数组或深度上限防止死循环；适用于组织架构、评论树、知识图谱遍历等场景。

8. **NULL 特殊性**：等值比较返回 `NULL` 而非 `FALSE`；`COUNT(col)` 跳过 `NULL`；`NULL` 无法走等值索引查找（`IS NULL` 可以走特定索引类型）。

9. **集合操作去重代价**：`UNION` 隐含去重有排序/哈希代价，不需去重时用 `UNION ALL`；`INTERSECT`/`EXCEPT` 同样隐含去重。

10. **子查询 vs CTE**：功能上等价，CTE 可复用、可逐步调试；多数现代优化器对 CTE 和等价子查询的执行计划相同，但 CTE 的可读性和可维护性显著更优。

## 参考资料

- [PostgreSQL SQL language tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html)
- [SQLite SELECT documentation](https://www.sqlite.org/lang_select.html)
