# SQL 核心语法与进阶查询

SQL 是关系型数据库的通用查询语言，无论是日常业务开发还是数据分析，掌握其核心语法都是绕不过去的基础。本文聚焦面试高频考点：JOIN 类型、聚合与分组、子查询与 CTE，帮助你在理解原理的基础上写出正确、高效的查询。

---

## 基础查询结构

一条完整的 SELECT 语句执行顺序如下（注意：书写顺序与执行顺序不同）：

```
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

理解执行顺序对排查错误至关重要。例如，`WHERE` 在 `GROUP BY` 之前执行，因此不能在 `WHERE` 中引用聚合函数的结果——那是 `HAVING` 的职责。

```sql
SELECT department, COUNT(*) AS headcount, AVG(salary) AS avg_salary
FROM employees
WHERE status = 'active'          -- 先过滤行
GROUP BY department              -- 再分组
HAVING COUNT(*) > 5              -- 对分组结果过滤
ORDER BY avg_salary DESC
LIMIT 10;
```

---

## JOIN 类型详解

JOIN 是 SQL 最核心也最容易混淆的部分。以两张表 `orders`（订单）和 `customers`（客户）为例：

```sql
-- orders 表可能有 customer_id 为 NULL（匿名订单）
-- customers 表可能有从未下单的客户
```

### INNER JOIN

只保留两表都能匹配的行，不满足条件的行全部丢弃。

```sql
SELECT o.id, c.name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id;
-- 匿名订单（customer_id IS NULL）和从未下单的客户均不出现
```

### LEFT JOIN

保留左表全部行，右表无匹配则填 NULL。

```sql
SELECT o.id, c.name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id;
-- 匿名订单出现，c.name 为 NULL；从未下单的客户不出现
```

### RIGHT JOIN

与 LEFT JOIN 对称，保留右表全部行。实践中通常可以将表顺序调换、改用 LEFT JOIN，可读性更好。

### FULL OUTER JOIN

合并 LEFT + RIGHT，两边不匹配的行均保留（MySQL 不原生支持，可用 UNION 模拟）。

```sql
-- MySQL 模拟 FULL OUTER JOIN
SELECT o.id, c.name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
UNION
SELECT o.id, c.name
FROM orders o
RIGHT JOIN customers c ON o.customer_id = c.id;
```

### 四种 JOIN 对比

| 类型 | 左表无匹配行 | 右表无匹配行 |
|------|------------|------------|
| INNER JOIN | 丢弃 | 丢弃 |
| LEFT JOIN | 保留，右侧填 NULL | 丢弃 |
| RIGHT JOIN | 丢弃 | 保留，左侧填 NULL |
| FULL OUTER JOIN | 保留，右侧填 NULL | 保留，左侧填 NULL |

**面试常问：** LEFT JOIN 后在 WHERE 中对右表字段加 `IS NOT NULL` 条件，结果等价于 INNER JOIN——这是常见陷阱，务必注意。

```sql
-- 以下两句等价，LEFT JOIN 的语义被 WHERE 破坏了
SELECT * FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
WHERE c.id IS NOT NULL;
-- 等价于
SELECT * FROM orders o INNER JOIN customers c ON o.customer_id = c.id;
```

---

## GROUP BY 与聚合函数

常用聚合函数：`COUNT`、`SUM`、`AVG`、`MAX`、`MIN`。

**重要规则：** SELECT 中的非聚合列必须出现在 GROUP BY 中（标准 SQL，部分数据库有宽松模式）。

```sql
-- 统计每个部门的人数和最高薪资
SELECT department, COUNT(*) AS cnt, MAX(salary) AS max_sal
FROM employees
GROUP BY department;
```

### HAVING vs WHERE

- `WHERE`：在分组前过滤原始行
- `HAVING`：在分组后过滤聚合结果

```sql
-- 找出平均薪资超过 10000 的部门
SELECT department, AVG(salary) AS avg_sal
FROM employees
WHERE status = 'active'        -- 先排除离职员工
GROUP BY department
HAVING AVG(salary) > 10000;   -- 再过滤分组结果
```

### 窗口函数（进阶）

窗口函数不折叠行，可以在保留明细的同时计算聚合值：

```sql
-- 每行显示员工薪资及其所在部门的平均薪资
SELECT name, department, salary,
       AVG(salary) OVER (PARTITION BY department) AS dept_avg,
       RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank
FROM employees;
```

`PARTITION BY` 类似 GROUP BY，但结果集行数不变。`ROW_NUMBER`、`RANK`、`DENSE_RANK` 的区别也是面试热点：

| 函数 | 相同值处理 | 序号是否连续 |
|------|-----------|------------|
| ROW_NUMBER | 随机排序，无并列 | 连续 |
| RANK | 并列跳号（1,1,3） | 不连续 |
| DENSE_RANK | 并列不跳号（1,1,2） | 连续 |

---

## 子查询 vs CTE

两者都可以将复杂查询拆分为可读的逻辑层，但适用场景有差异。

### 子查询（Subquery）

嵌套在其他语句内部，分为相关子查询和非相关子查询。

```sql
-- 非相关子查询：找出薪资高于公司平均水平的员工
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 相关子查询：每个员工与所在部门平均薪资比较（逐行执行，性能较差）
SELECT name, department, salary
FROM employees e
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department = e.department  -- 引用外层表
);
```

相关子查询逐行执行，数据量大时性能较差，通常可用 JOIN 或窗口函数替代。

### CTE（Common Table Expression）

用 `WITH` 关键字定义，相当于临时命名的结果集，逻辑更清晰，可复用。

```sql
WITH dept_avg AS (
    SELECT department, AVG(salary) AS avg_sal
    FROM employees
    GROUP BY department
),
high_earners AS (
    SELECT e.name, e.department, e.salary, d.avg_sal
    FROM employees e
    JOIN dept_avg d ON e.department = d.department
    WHERE e.salary > d.avg_sal * 1.2
)
SELECT * FROM high_earners ORDER BY salary DESC;
```

### 递归 CTE

CTE 支持递归，适合处理树形/层级结构（如组织架构、评论嵌套）：

```sql
-- 从某员工向上找所有管理层
WITH RECURSIVE chain AS (
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE id = 42                          -- 起点
    UNION ALL
    SELECT e.id, e.name, e.manager_id, c.level + 1
    FROM employees e
    JOIN chain c ON e.id = c.manager_id   -- 递归：向上找 manager
)
SELECT * FROM chain;
```

### 子查询 vs CTE 选择原则

| 场景 | 推荐方式 |
|------|---------|
| 一次性简单过滤 | 子查询（代码更紧凑） |
| 逻辑复杂、需要复用 | CTE（可读性更好） |
| 树形/递归结构 | 递归 CTE |
| 相关子查询性能差 | 改写为 JOIN + 窗口函数 |

---

## 集合操作

`UNION`、`INTERSECT`、`EXCEPT` 对两个结果集进行集合运算，要求列数和数据类型兼容。

```sql
-- UNION：合并两个查询结果，自动去重（UNION ALL 保留重复）
SELECT name FROM employees_cn
UNION
SELECT name FROM employees_us;

-- INTERSECT：取交集（两边都存在的行）
SELECT product_id FROM sales_2024
INTERSECT
SELECT product_id FROM sales_2023;

-- EXCEPT（部分数据库用 MINUS）：取差集
SELECT customer_id FROM customers
EXCEPT
SELECT customer_id FROM orders;  -- 从未下单的客户
```

---

## 常见误区与最佳实践

**误区 1：在 WHERE 中使用聚合函数**

```sql
-- 错误
SELECT department FROM employees WHERE COUNT(*) > 5 GROUP BY department;
-- 正确：聚合过滤用 HAVING
SELECT department FROM employees GROUP BY department HAVING COUNT(*) > 5;
```

**误区 2：混淆 NULL 的判断**

`NULL = NULL` 结果是 `NULL`（不是 `TRUE`），必须用 `IS NULL` / `IS NOT NULL`。

```sql
-- 错误
WHERE manager_id = NULL
-- 正确
WHERE manager_id IS NULL
```

**误区 3：SELECT \* 在 JOIN 中引发歧义**

多表 JOIN 时，`SELECT *` 会包含所有连接列，且同名列可能产生歧义，生产代码应显式指定列名。

**最佳实践**

- 大表 JOIN 前确保连接键上有索引
- 能用 JOIN 替代相关子查询时，优先选 JOIN
- CTE 比深层嵌套子查询更易维护
- `EXPLAIN` / `EXPLAIN ANALYZE` 是分析慢查询的第一步

---

## 面试常问要点总结

1. **执行顺序**：FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT，与书写顺序不同。
2. **LEFT JOIN + WHERE 陷阱**：对右表加 `IS NOT NULL` 等价退化为 INNER JOIN。
3. **HAVING vs WHERE**：WHERE 过滤行，HAVING 过滤分组后的聚合结果。
4. **ROW_NUMBER / RANK / DENSE_RANK 区别**：并列时的序号处理逻辑不同。
5. **相关子查询性能**：逐行执行，大数据量应改写。
6. **NULL 的特殊性**：任何值与 NULL 的比较结果均为 NULL，不走普通索引等值查找。
7. **CTE 与子查询的取舍**：复杂逻辑优先 CTE，一次性简单查询子查询即可。
