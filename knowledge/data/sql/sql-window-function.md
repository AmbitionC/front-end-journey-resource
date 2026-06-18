窗口函数（Window Function）是 SQL 中对一组相关行执行计算的函数，它与聚合函数的核心区别在于：**聚合函数将多行折叠为一行，窗口函数保留每一行，同时附上跨行计算的结果**。这一特性让复杂的排名、累计、环比等分析场景变得极为简洁。

---

## 基本语法结构

```sql
函数名() OVER (
  [PARTITION BY 分组列]
  [ORDER BY 排序列 ASC|DESC]
  [ROWS|RANGE 窗口帧定义]
)
```

- `PARTITION BY`：将结果集分成独立的分区，函数在每个分区内独立计算（类似 GROUP BY，但不折叠行）。
- `ORDER BY`：指定分区内的排序方式，对排名函数和帧计算至关重要。
- `ROWS/RANGE`：进一步限定"窗口帧"范围，即参与计算的行集合。

---

## 聚合函数 vs 窗口函数

| 特性 | 聚合函数（GROUP BY） | 窗口函数（OVER） |
|------|---------------------|-----------------|
| 结果行数 | 每组一行 | 与原表相同 |
| 能否访问原始列 | 受限（只能 SELECT 分组列或聚合值） | 可以同时访问原始列 |
| 典型用途 | 统计汇总 | 排名、累计、移动平均 |

**示例对比**：统计每个部门的平均薪资，并保留每个员工的详细信息。

```sql
-- 聚合函数：只能得到部门平均值，丢失员工信息
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id;

-- 窗口函数：保留每行，同时附上部门平均值
SELECT
  emp_id,
  name,
  dept_id,
  salary,
  AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg_salary
FROM employees;
```

---

## 排名函数

排名函数是面试中出现频率最高的窗口函数，需要掌握三者的区别。

### ROW_NUMBER / RANK / DENSE_RANK

```sql
SELECT
  name,
  dept_id,
  salary,
  ROW_NUMBER()  OVER (PARTITION BY dept_id ORDER BY salary DESC) AS row_num,
  RANK()        OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk,
  DENSE_RANK()  OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dense_rnk
FROM employees;
```

假设部门中有两人薪资并列第一（10000），结果如下：

| name | salary | ROW_NUMBER | RANK | DENSE_RANK |
|------|--------|-----------|------|------------|
| Alice | 10000 | 1 | 1 | 1 |
| Bob  | 10000 | 2 | 1 | 1 |
| Carol | 8000 | 3 | 3 | 2 |

- `ROW_NUMBER`：唯一编号，并列时随机决定顺序（不稳定）。
- `RANK`：并列同名次，下一名次跳号（1, 1, 3）。
- `DENSE_RANK`：并列同名次，下一名次不跳号（1, 1, 2）。

**典型场景**：取每个部门薪资最高的前 N 名员工。

```sql
SELECT *
FROM (
  SELECT
    *,
    DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees
) t
WHERE rnk <= 3;
```

---

## 偏移函数：LAG 与 LEAD

`LAG` 访问当前行之前的行，`LEAD` 访问之后的行，常用于计算环比、同比。

```sql
LAG(列名, 偏移量, 默认值)  OVER (PARTITION BY ... ORDER BY ...)
LEAD(列名, 偏移量, 默认值) OVER (PARTITION BY ... ORDER BY ...)
```

**示例**：计算每月销售额与上月的差值。

```sql
SELECT
  month,
  revenue,
  LAG(revenue, 1, 0) OVER (ORDER BY month) AS prev_revenue,
  revenue - LAG(revenue, 1, 0) OVER (ORDER BY month) AS mom_diff
FROM monthly_sales;
```

---

## 聚合窗口函数：SUM / AVG / MAX / MIN

普通聚合函数加上 `OVER` 子句后变为窗口版本，可以在不折叠行的情况下计算累计值或移动平均。

### 累计求和

```sql
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```

`ORDER BY` 不带 `ROWS/RANGE` 时，默认窗口帧为 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`，即从第一行累计到当前行。

### 移动平均（最近 7 天）

```sql
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS moving_avg_7d
FROM daily_sales;
```

---

## 窗口帧：ROWS vs RANGE

窗口帧定义参与计算的行范围，是理解累计与移动计算的关键。

```
ROWS  BETWEEN <起点> AND <终点>
RANGE BETWEEN <起点> AND <终点>
```

常用边界关键字：

| 关键字 | 含义 |
|--------|------|
| `UNBOUNDED PRECEDING` | 分区第一行 |
| `N PRECEDING` | 当前行之前第 N 行 |
| `CURRENT ROW` | 当前行 |
| `N FOLLOWING` | 当前行之后第 N 行 |
| `UNBOUNDED FOLLOWING` | 分区最后一行 |

**ROWS 与 RANGE 的区别**：

- `ROWS`：按物理行数偏移，精确。
- `RANGE`：按排序列的值范围偏移，**相同排序值的行视为同一位置**，可能包含比预期更多的行。

```sql
-- ROWS：精确取前后各 1 行，共最多 3 行
AVG(score) OVER (ORDER BY exam_date ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)

-- RANGE：取 exam_date 在 [当前日期-1, 当前日期+1] 范围内的所有行
AVG(score) OVER (ORDER BY exam_date RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING)
```

---

## NTILE：分桶函数

将分区内的行均匀分成 N 个桶，常用于百分位划分。

```sql
SELECT
  name,
  salary,
  NTILE(4) OVER (ORDER BY salary) AS quartile
FROM employees;
```

---

## 常见误区

**1. 在 WHERE 子句中过滤窗口函数结果**

窗口函数在 `WHERE` 之后执行，不能直接在 `WHERE` 中引用别名，需要用子查询或 CTE。

```sql
-- 错误
SELECT *, RANK() OVER (ORDER BY salary DESC) AS rnk
FROM employees
WHERE rnk <= 3;  -- 报错：rnk 不存在

-- 正确
WITH ranked AS (
  SELECT *, RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT * FROM ranked WHERE rnk <= 3;
```

**2. 混淆 ROWS 和 RANGE 的默认行为**

仅写 `ORDER BY` 不指定帧时，默认是 `RANGE UNBOUNDED PRECEDING TO CURRENT ROW`，而不是 `ROWS`。当有重复排序值时，累计结果可能超出预期。

**3. PARTITION BY 缺失导致全表计算**

省略 `PARTITION BY` 时，整个结果集作为一个分区，对于排名函数会产生全局排名，不一定是你想要的部门内排名。

---

## 面试常问要点

- **ROW_NUMBER / RANK / DENSE_RANK 三者区别**：必须能说清并列时的编号行为。
- **取分组 TopN**：用排名函数 + 子查询/CTE 过滤，是高频手写题。
- **累计求和与移动平均**：考察对窗口帧的理解。
- **LAG/LEAD 实现环比**：数据分析场景必备。
- **窗口函数的执行顺序**：在 `FROM → WHERE → GROUP BY → HAVING → SELECT → 窗口函数 → ORDER BY → LIMIT` 中位于 SELECT 阶段之后，因此不能在 WHERE/HAVING 中直接使用窗口函数的结果。
