# 数据格式：JSON / CSV / Parquet

数据工程中 80% 的时间都花在读写和清洗数据上，选错格式会让后续处理付出数倍代价。

## JSON

JSON 是最通用的文本格式，Python 内置 `json` 模块即可处理，无需安装依赖。它是自描述的（字段名随数据一起存储）、人类可读、跨语言通用，特别适合表达嵌套和层级结构，因此成为 Web API 的事实标准。代价是体积偏大、没有内置类型系统（数字、日期都以文本表达，需自行约定），不适合存储海量结构化数据。

### 基本用法

```python
import json

# 从字符串解析
data = json.loads('{"name": "Alice", "age": 30}')

# 序列化为字符串
text = json.dumps(data, ensure_ascii=False, indent=2)

# 文件读写
with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

### 处理特殊类型

`json` 模块不支持 `datetime`、`Decimal`、`numpy` 类型，需要自定义编码器：

```python
import json
from datetime import datetime
from decimal import Decimal

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

data = {"ts": datetime.now(), "price": Decimal("9.99")}
print(json.dumps(data, cls=CustomEncoder))
```

### 常见陷阱

- `ensure_ascii=True`（默认）会把中文转义为 `\uXXXX`，读起来正常但文件体积膨胀；写文件时务必加 `ensure_ascii=False`
- 嵌套层级深的 JSON 用 `json.loads` 解析时全部载入内存，遇到 GB 级文件应改用流式解析（`ijson` 库）
- JSON 不支持注释，也不支持尾随逗号，从配置文件手工复制粘贴时容易引入语法错误

---

## CSV

CSV 是表格数据的最小公分母，几乎所有工具都支持，但细节问题最多。

### csv 模块 vs pandas

```python
import csv

# 标准库写法，适合流式处理大文件
with open("data.csv", "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"])

# pandas，适合分析和转换
import pandas as pd

df = pd.read_csv(
    "data.csv",
    encoding="utf-8-sig",   # 处理 Windows 导出的 BOM 头
    dtype={"id": str},       # 防止长数字 ID 被转为 float
    na_values=["N/A", "-"],  # 自定义空值标记
)
```

### 编码与引号转义

```python
# 写 CSV 时处理含逗号的字段
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["name", "address"])
    writer.writerow(["Alice", "Beijing, Chaoyang"])  # 自动加引号
```

### 常见陷阱

- 不传 `newline=""` 打开文件会导致 Windows 上每行多一个空行
- Excel 导出的 CSV 默认 GBK 编码，用 `utf-8-sig` 读可以兼容 BOM
- 数字型 ID（如 18 位身份证号）被 pandas 自动推断为 `float64` 后精度丢失，必须用 `dtype` 指定为 `str`

---

## Parquet

Parquet 是列式存储格式，专为大规模数据分析设计，Hadoop/Spark 生态的标配。

### 列式存储原理

行式存储（CSV/JSON）把同一行的所有字段放在一起；列式存储把同一列的所有值放在一起。当查询只涉及少数几列时，列式存储可以跳过其他列的 I/O，同时同类型数据放在一起压缩比更高。

```
行式（CSV）：[id,name,age] [id,name,age] [id,name,age] ...
列式（Parquet）：[id,id,id,...] [name,name,name,...] [age,age,age,...]
```

### pyarrow 读写

```python
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# 写 Parquet
df = pd.DataFrame({"id": [1, 2, 3], "name": ["a", "b", "c"]})
pq.write_table(pa.Table.from_pandas(df), "data.parquet", compression="snappy")

# 读全量
df2 = pd.read_parquet("data.parquet", engine="pyarrow")

# 只读指定列（列裁剪，节省 I/O）
df3 = pd.read_parquet("data.parquet", columns=["id"])

# 读 Parquet 目录（Hive 分区）
dataset = pq.ParquetDataset("data_dir/", filters=[("date", "=", "2024-01-01")])
df4 = dataset.read_pandas().to_pandas()
```

### 为什么适合大数据

- 内置 Snappy/ZSTD 等压缩，同等数据量比 CSV 体积小 3–10 倍
- 支持谓词下推（Predicate Pushdown），读取时在存储层过滤，减少传输量
- 保存 schema 信息，不会丢失列类型（CSV 每次读都要重新推断类型）

---

## 三种格式对比

| 维度 | JSON | CSV | Parquet |
|------|------|-----|---------|
| 数据结构 | 嵌套/任意 | 扁平表格 | 扁平表格 |
| 可读性 | 高 | 高 | 二进制，不可直读 |
| 压缩比 | 低 | 低 | 高（3–10x） |
| 读取速度（大文件） | 慢 | 中 | 快（列裁剪） |
| Schema 保留 | 否 | 否 | 是 |
| 嵌套支持 | 原生 | 不支持 | 有限支持 |
| 典型场景 | API 响应、配置、日志 | 报表导出、小数据集 | 数仓、离线分析、ML 特征 |
| 生态支持 | 全平台 | 全平台 | Spark/Pandas/Arrow |

---

## JSONL：AI 数据集的通用格式

JSONL（JSON Lines）每行是一个独立的 JSON 对象，文件扩展名为 `.jsonl` 或 `.ndjson`。

```python
# 写 JSONL
records = [{"prompt": "你好", "response": "你好！"}, {"prompt": "再见", "response": "再见！"}]
with open("dataset.jsonl", "w", encoding="utf-8") as f:
    for rec in records:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

# 读 JSONL（流式，不全量载入内存）
with open("dataset.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            rec = json.loads(line)
            print(rec["prompt"])
```

JSONL 在 LLM 微调（SFT）数据集中几乎是标准格式（OpenAI fine-tuning API、Hugging Face datasets 均支持），原因有三：可流式读取、便于 `wc -l` 统计条数、追加写入不破坏已有数据。

---

## 常见问题与面试要点

**Q：CSV 和 JSON 数据量大了该怎么办？**
超过几百 MB 的表格数据应转为 Parquet；如果是日志类嵌套 JSON，可以先用 pandas `json_normalize` 展平后存 Parquet。

**Q：如何判断 CSV 的编码？**
用 `chardet` 或 `charset-normalizer` 库检测：`chardet.detect(open("f","rb").read(10000))`，再传给 `encoding` 参数。

**Q：Parquet 文件如何分区？**
```python
pq.write_to_dataset(table, root_path="output/", partition_cols=["year", "month"])
```
分区后查询时可按目录过滤，避免全量扫描。

**Q：fastparquet vs pyarrow 怎么选？**
优先 `pyarrow`：与 Arrow 内存格式直接互转，速度更快，兼容性更好；`fastparquet` 在某些 Dask 场景下仍有使用。

**面试高频考点：**
- 列式存储为什么压缩比高（同质数据、字典编码、Run-Length Encoding）
- `json.loads` 与 `json.load` 的区别（字符串 vs 文件对象）
- CSV `newline=""` 的必要性
- JSONL 相比 JSON 数组的流式处理优势
