Pandas 是 Python 数据分析的核心库，提供了高性能的表格数据结构与丰富的操作 API，掌握它是数据工程和分析岗位的基本门槛。

## 核心数据结构

### Series

Series 是一维带标签的数组，可以把它理解为有索引的列表：

```python
import pandas as pd

s = pd.Series([10, 20, 30], index=['a', 'b', 'c'])
print(s['b'])   # 20
print(s.values) # array([10, 20, 30])
print(s.index)  # Index(['a', 'b', 'c'], dtype='object')
```

### DataFrame

DataFrame 是二维带标签的表格，每列是一个 Series，共享同一个行索引。它的设计借鉴了关系数据库的表和 R 的 data.frame：行用行索引（index）标识，列用列名标识，列与列之间可以是不同的数据类型，但同一列内部类型一致。理解"一列即一个 Series"这一点很关键，它解释了为什么按列操作（向量化）远比按行操作高效——Pandas 底层基于 NumPy 数组，整列运算可以直接交给 C 实现的批量计算。

```python
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age':  [25, 30, 35],
    'score': [88.5, 92.0, 78.3]
})
```

DataFrame 的列类型（dtype）在创建时自动推断，后续可用 `df.dtypes` 查看。

## 读取数据

Pandas 支持多种数据源，最常用的三种：

```python
# CSV：最通用，支持指定编码和分隔符
df = pd.read_csv('data.csv', encoding='utf-8', sep=',')

# JSON：自动处理嵌套结构（orient 参数控制格式）
df = pd.read_json('data.json', orient='records')

# Parquet：列式存储，读写速度远快于 CSV，适合大数据集
df = pd.read_parquet('data.parquet', engine='pyarrow')
```

**最佳实践**：生产环境优先使用 Parquet，它体积小、类型保真、读取快；CSV 仅用于与外部系统交换数据。读 CSV 时常见的坑是类型推断不准确，例如以 0 开头的编号被当成整数从而丢失前导零，可用 `dtype={'id': str}` 显式指定；超大文件还可用 `usecols` 只读需要的列、用 `nrows` 先抽样观察结构，避免一次性把整个文件载入内存。

## 数据探索

拿到新数据集，标准探索流程如下：

```python
df.head(5)        # 前 5 行，快速目测结构
df.tail(3)        # 后 3 行，检查尾部是否有脏数据
df.info()         # 列名、非空计数、dtype，一眼看出哪些列有缺失
df.describe()     # 数值列的均值/标准差/分位数
df['status'].value_counts()          # 类别列的频次分布
df['status'].value_counts(normalize=True)  # 转为占比
```

`info()` 输出中，若某列的 Non-Null Count 小于总行数，说明存在缺失值，需要处理。`describe()` 默认只统计数值列，加上 `include='all'` 参数可以同时给出类别列的唯一值数、出现最频繁的值等信息。探索阶段的目标是快速建立对数据规模、字段含义、分布形态和脏数据位置的整体认知，而不是急于建模；很多后续问题（如离群点、编码不一致）在这一步就能暴露出来。

## 缺失值处理

```python
# 检测缺失值
df.isnull().sum()         # 每列缺失数量
df.isnull().mean() * 100  # 每列缺失率（%）

# 删除含缺失值的行（谨慎使用，可能丢失信息）
df.dropna(subset=['age', 'score'], inplace=True)

# 填充缺失值
df['score'].fillna(df['score'].median(), inplace=True)  # 数值列用中位数
df['city'].fillna('unknown', inplace=True)              # 类别列用占位符
df.fillna(method='ffill', inplace=True)                 # 时序数据向前填充
```

**常见陷阱**：`fillna(method='ffill')` 在 Pandas 2.x 中已废弃，改用 `ffill()` 方法直接调用：

```python
df['price'] = df['price'].ffill()
```

## 数据筛选与变换

### loc 与 iloc

```python
# loc：基于标签（行索引名 / 列名）
df.loc[df['age'] > 28, ['name', 'score']]

# iloc：基于整数位置
df.iloc[0:3, 1:3]  # 前3行的第2、3列
```

**原则**：能用 `loc` 就不用 `iloc`，标签比位置更不易因数据顺序变化而出错。布尔索引是 Pandas 最常用的筛选方式，本质是用一个与行数等长的布尔 Series 去过滤；多条件组合时必须用 `&`、`|` 并给每个条件加括号，例如 `df[(df['age'] > 28) & (df['score'] > 80)]`，不能用 Python 的 `and`/`or`，因为后者无法对数组逐元素求值。

### apply 与 map

```python
# apply：对列/行执行自定义函数，可以返回标量或 Series
df['score_level'] = df['score'].apply(lambda x: 'A' if x >= 90 else 'B')

# map：Series 专用，适合值替换或映射字典
status_map = {0: '未激活', 1: '活跃', 2: '注销'}
df['status_label'] = df['status'].map(status_map)
```

### groupby 聚合

```python
# 按部门统计平均分和人数
summary = (
    df.groupby('department')
    .agg(avg_score=('score', 'mean'), headcount=('name', 'count'))
    .reset_index()
)
```

`reset_index()` 将分组键从索引还原为普通列，方便后续操作。

## 合并与连接

```python
# merge：类似 SQL JOIN，按键列对齐
result = pd.merge(df_orders, df_users, on='user_id', how='left')

# concat：沿轴方向拼接，结构相同的多个 DataFrame 纵向堆叠
combined = pd.concat([df_2023, df_2024], ignore_index=True)
```

| 场景 | 推荐方法 |
|------|----------|
| 按共同字段关联两张表 | `merge` |
| 同结构数据纵向追加 | `concat` |
| 按行/列索引对齐运算 | `join` / `align` |

**常见陷阱**：`merge` 默认是 inner join，若键列有空值或重复，结果行数可能与预期偏差较大，用完要立即检查 `len(result)` 是否合理。

## 性能陷阱

### 禁用 iterrows

`iterrows()` 每次迭代都会创建 Series 对象，百万行数据可能慢几百倍：

```python
# 错误做法：极慢
for idx, row in df.iterrows():
    df.at[idx, 'tax'] = row['salary'] * 0.2

# 正确做法：向量化运算
df['tax'] = df['salary'] * 0.2
```

### 链式赋值警告（ChainedAssignment）

```python
# 危险写法：可能修改的是副本而非原 DataFrame
df[df['age'] > 30]['score'] = 0  # SettingWithCopyWarning

# 正确写法：使用 loc
df.loc[df['age'] > 30, 'score'] = 0
```

Pandas 2.0 对此行为更严格，建议全局开启 `pd.options.mode.copy_on_write = True`（Copy-on-Write 模式），在 3.0 中将成为默认。

### 类型优化

```python
# 类别列用 category dtype 可节省大量内存
df['city'] = df['city'].astype('category')

# 整数列避免使用 object，显式指定 int32/int64
df['age'] = df['age'].astype('int32')
```

## 面试要点

**Q：loc 和 iloc 的区别？**
`loc` 基于标签索引，支持布尔数组；`iloc` 基于整数位置，切片遵循 Python 左闭右开规则，但 `loc` 的切片是两端都包含的。

**Q：如何高效处理大文件？**
使用 `chunksize` 参数分批读取，或直接改用 Polars / DuckDB 处理 GB 级数据，Pandas 的内存占用约为数据本身的 5-10 倍。

```python
for chunk in pd.read_csv('big.csv', chunksize=100_000):
    process(chunk)
```

**Q：merge 的几种 how 类型？**
`inner`（默认）、`left`、`right`、`outer`，对应 SQL 的 INNER/LEFT/RIGHT/FULL OUTER JOIN。

**Q：groupby 后如何同时保留原列和聚合结果？**
使用 `transform` 代替 `agg`，它返回与原 DataFrame 等长的结果，可直接赋值为新列：

```python
df['dept_avg'] = df.groupby('department')['score'].transform('mean')
```
