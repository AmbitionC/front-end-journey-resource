数据集的质量直接决定模型的上限——垃圾进、垃圾出。在建模之前，系统性地评估并修复数据质量问题，往往比调参带来更大的收益。

## 数据质量的五个维度

| 维度 | 含义 | 典型问题 |
|------|------|----------|
| 完整性 | 必填字段是否存在 | 用户年龄字段大面积为 NULL |
| 准确性 | 数据是否反映真实值 | 录入错误、传感器漂移 |
| 一致性 | 跨表/跨系统的同一数据是否吻合 | 订单表金额与流水表金额不一致 |
| 及时性 | 数据是否在有效时间窗口内 | 延迟两天到达的实时特征 |
| 唯一性 | 主键/业务键是否唯一 | 同一用户被重复写入多条记录 |

实践中，**完整性**和**唯一性**问题最容易被忽略，却是导致特征穿越和模型偏差的高频原因。

## 缺失值分析

### 缺失率统计

```python
import pandas as pd

def missing_report(df: pd.DataFrame) -> pd.DataFrame:
    total = len(df)
    missing = df.isnull().sum()
    rate = missing / total
    return pd.DataFrame({
        "missing_count": missing,
        "missing_rate": rate.round(4)
    }).query("missing_count > 0").sort_values("missing_rate", ascending=False)
```

缺失率超过 **30%** 的字段需要重点关注：直接填充可能引入噪声，直接删除可能丢失信号，需要结合业务判断。

### 缺失模式：MAR / MCAR / MNAR

理解缺失机制对选择处理策略至关重要：

- **MCAR（完全随机缺失）**：缺失与任何变量无关，可安全删除或均值填充。
- **MAR（随机缺失）**：缺失与其他已观测变量相关（如高收入用户更少填写年龄），可用多重插补。
- **MNAR（非随机缺失）**：缺失与该字段本身的值相关（如病情越严重越不愿填写），填充会引入系统性偏差，建议单独建立"是否缺失"的二元特征。

```python
# 检验缺失是否与其他字段相关（MAR 初步验证）
import scipy.stats as stats

def test_mar(df, col, group_col):
    missing_mask = df[col].isnull()
    group_a = df.loc[missing_mask, group_col].dropna()
    group_b = df.loc[~missing_mask, group_col].dropna()
    stat, p = stats.mannwhitneyu(group_a, group_b, alternative="two-sided")
    return {"statistic": stat, "p_value": p}
```

## 重复数据检测与去重

```python
def dedup_report(df: pd.DataFrame, subset: list[str]) -> dict:
    total = len(df)
    dup_mask = df.duplicated(subset=subset, keep=False)
    dup_count = dup_mask.sum()
    return {
        "total_rows": total,
        "duplicate_rows": dup_count,
        "duplicate_rate": round(dup_count / total, 4),
        "deduplicated_df": df.drop_duplicates(subset=subset, keep="first")
    }
```

常见陷阱：**只对主键去重而忽略业务键**。例如订单表以 `order_id` 唯一，但同一用户在同一秒内触发了两次支付回调，两条记录的 `order_id` 相同却表示不同事件，此时需结合时间戳和状态字段综合判断。

## 异常值检测方法

### 统计方法：Z-score 与 IQR

**Z-score** 适合正态分布数据，阈值通常取 ±3：

```python
import numpy as np

def zscore_outliers(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    z = (series - series.mean()) / series.std()
    return series[z.abs() > threshold]
```

**IQR（四分位距）** 对偏态分布更鲁棒：

```python
def iqr_outliers(series: pd.Series, k: float = 1.5) -> pd.Series:
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - k * iqr, q3 + k * iqr
    return series[(series < lower) | (series > upper)]
```

选择原则：优先 IQR，当业务含义明确要求基于均值（如控制图）时再用 Z-score。

### 可视化：箱线图思路

箱线图将 IQR 方法可视化：盒体为 Q1–Q3，须线延伸至 `Q1 - 1.5×IQR` 和 `Q3 + 1.5×IQR`，超出须线的点即为离群点。在 EDA 阶段用箱线图快速定位字段，再用程序化方法批量处理，是高效的工作流。

### 孤立森林（Isolation Forest）

统计方法依赖单变量假设，**Isolation Forest** 则通过随机切分多维特征空间来检测异常：异常点需要更少的切分次数即可被"隔离"。

```python
from sklearn.ensemble import IsolationForest

def isolation_forest_outliers(df: pd.DataFrame, features: list[str],
                               contamination: float = 0.05) -> pd.Series:
    clf = IsolationForest(contamination=contamination, random_state=42)
    labels = clf.fit_predict(df[features])
    # -1 为异常，1 为正常
    return pd.Series(labels == -1, index=df.index)
```

`contamination` 参数需要根据业务先验来设定，默认 `"auto"` 会基于原论文假设，实际场景通常设为 1%–5%。

## 数据一致性校验

一致性校验分三个层级：

**类型检查**：字段存储类型与业务语义一致（如日期字段是否真的能被解析为日期）。

**范围检查**：数值是否在合理区间内。

**业务规则**：跨字段或跨表的逻辑约束。

```python
def validate(df: pd.DataFrame) -> list[str]:
    errors = []
    # 类型检查
    try:
        pd.to_datetime(df["order_date"])
    except Exception:
        errors.append("order_date 含无法解析的日期格式")
    # 范围检查
    if (df["age"] < 0).any() or (df["age"] > 120).any():
        errors.append(f"age 存在超出 [0, 120] 的值：{df['age'].describe()}")
    # 业务规则
    invalid = df["end_time"] < df["start_time"]
    if invalid.any():
        errors.append(f"存在 {invalid.sum()} 条 end_time < start_time 的记录")
    return errors
```

## 数据质量报告的生成思路

一份可落地的数据质量报告应包含：

1. **概览**：总行数、总字段数、扫描时间范围。
2. **字段级报告**：每列的缺失率、唯一值数、数值分布（均值/标准差/分位数）。
3. **规则校验结果**：按严重程度（Error / Warning / Info）分级。
4. **异常样本列表**：标注异常原因，方便人工复核。

可以用 `pandas-profiling`（现为 `ydata-profiling`）快速生成 HTML 报告，但在大规模数据集（>1000 万行）上性能较差，生产环境建议自行实现轻量版。

## 面试要点

**Q：缺失值处理有哪些策略，各自适用场景是什么？**

删除（缺失率高且随机）、均值/中位数/众数填充（MCAR 且对模型影响小）、模型预测填充（MAR，如 KNN 或回归）、插值（时序数据）、保留缺失标志位（MNAR）。面试时需要结合数据量和下游模型来分析，不要给"万能答案"。

**Q：Z-score 和 IQR 的区别，什么时候用哪个？**

Z-score 假设正态分布，对极端离群点本身敏感（极端值拉高均值和标准差，导致漏检）；IQR 基于分位数，对分布形状假设更弱，更鲁棒。偏态数据优先 IQR。

**Q：Isolation Forest 的原理是什么？时间复杂度如何？**

通过随机选择特征和切分值递归构建树，异常点平均路径长度更短（更容易被隔离）。训练复杂度 O(n log n)，推断复杂度 O(n)，适合大规模数据的无监督异常检测。

**Q：数据质量问题最常被忽视的是什么？**

实践中最容易被忽略的是**时效性**（训练集和服务时特征计算口径不一致导致的 Training-Serving Skew）以及**重复数据的业务定义**（主键唯一≠业务语义唯一）。
