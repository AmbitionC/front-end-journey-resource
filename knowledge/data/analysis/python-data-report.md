数据报告是将原始数据转化为可读结论的核心环节，Python 凭借 pandas、matplotlib 和模板引擎的生态，能以极少的胶水代码完成从数据清洗到格式化输出的全流程。

## 报告生成的整体流程

一个完整的数据报告 pipeline 通常分为四个阶段：

```mermaid
flowchart LR
    A[原始数据\nCSV / DB / API] --> B[数据处理\npandas]
    B --> C[可视化\nmatplotlib / seaborn]
    C --> D[格式化输出\nHTML / PDF]
    D --> E[分发\n邮件 / 存储]
```

每个阶段职责分明，替换其中某一层（例如换用 Plotly 替代 matplotlib）不会影响其他层。

## 用 pandas 做数据聚合

pandas 是报告数据层的核心工具，常用操作：

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])

# 按月聚合销售额
monthly = (
    df.groupby(df["date"].dt.to_period("M"))["amount"]
    .agg(["sum", "mean", "count"])
    .rename(columns={"sum": "总额", "mean": "均值", "count": "笔数"})
)

# 生成描述性统计摘要
summary = df[["amount", "quantity"]].describe().round(2)
```

`describe()` 直接输出 count、mean、std、min、quartiles、max，是报告摘要表的快速来源。

## 可视化：将图表嵌入报告

matplotlib/seaborn 生成的图表需要以 Base64 编码或文件路径的形式嵌入 HTML。使用 Base64 可以让报告成为单文件，无外部依赖。

```python
import matplotlib.pyplot as plt
import io, base64

def chart_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=150)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

fig, ax = plt.subplots(figsize=(8, 4))
ax.bar(monthly.index.astype(str), monthly["总额"])
ax.set_title("月度销售额")
plt.xticks(rotation=45)

chart_b64 = chart_to_base64(fig)
plt.close(fig)  # 释放内存，避免在循环中泄漏
```

> **注意**：始终调用 `plt.close(fig)` 或使用 `with plt.rc_context()` 上下文，否则在批量生成报告时会累积 figure 对象导致内存泄漏。

## HTML 报告：Jinja2 模板

Jinja2 将数据和模板分离，是生成 HTML 报告最灵活的方式：

```python
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader("templates"))
template = env.get_template("report.html")

html = template.render(
    title="月度销售报告",
    generated_at="2026-06-18",
    summary_table=summary.to_html(classes="table"),
    monthly_table=monthly.to_html(classes="table"),
    chart_b64=chart_b64,
)

with open("output/report.html", "w", encoding="utf-8") as f:
    f.write(html)
```

对应的 `templates/report.html` 片段：

```html
<h1>{{ title }}</h1>
<p>生成时间：{{ generated_at }}</p>
<h2>描述统计</h2>
{{ summary_table | safe }}
<h2>月度趋势</h2>
<img src="data:image/png;base64,{{ chart_b64 }}" alt="月度销售额" />
```

`| safe` 过滤器告诉 Jinja2 不要对 HTML 字符串转义，pandas 的 `to_html()` 输出需要这个标记。

## PDF 生成

| 方案 | 适用场景 | 特点 |
|------|----------|------|
| **weasyprint** | HTML → PDF | 支持 CSS，输出质量高，依赖较重 |
| **reportlab** | 程序化绘制 | 完全控制布局，学习曲线陡 |
| **nbconvert** | Jupyter Notebook → PDF | 数据科学报告快速导出，需 LaTeX 环境 |
| **pdfkit** | HTML → PDF（wkhtmltopdf） | 安装简单，跨平台略麻烦 |

大多数场景推荐先生成 HTML，再用 weasyprint 转 PDF，既能复用 Jinja2 模板，又能通过 CSS 控制打印样式。

```python
from weasyprint import HTML

HTML(filename="output/report.html").write_pdf("output/report.pdf")
```

## 快速 EDA 报告：ydata-profiling

ydata-profiling（前身为 pandas-profiling）能用一行代码生成包含分布、缺失值、相关性的完整探索报告：

```python
from ydata_profiling import ProfileReport

profile = ProfileReport(df, title="销售数据探索报告", explorative=True)
profile.to_file("output/eda_report.html")
```

适合快速了解新数据集，不适合生产环境的定制报告（生成速度慢、输出格式固定）。

## 自动化调度

报告生成脚本完成后，可以通过两种方式自动化：

**cron（简单场景）**：在 crontab 中添加定时任务，适合单机、低频场景。

```
# 每天早上 8 点生成报告
0 8 * * * /usr/bin/python3 /path/to/generate_report.py
```

**Apache Airflow（复杂场景）**：将报告生成定义为 DAG，支持依赖管理、重试、告警，适合有多个上游数据任务的场景。

## 端到端代码骨架

```python
import pandas as pd
import matplotlib.pyplot as plt
import io, base64
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

# 1. 读取数据
df = pd.read_csv("data/sales.csv", parse_dates=["date"])

# 2. 聚合
monthly = (
    df.groupby(df["date"].dt.to_period("M"))["amount"]
    .sum()
    .reset_index()
)
monthly.columns = ["month", "total"]

# 3. 可视化
fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(monthly["month"].astype(str), monthly["total"], marker="o")
ax.set_xlabel("月份")
ax.set_ylabel("销售额")
plt.xticks(rotation=45)
buf = io.BytesIO()
fig.savefig(buf, format="png", bbox_inches="tight")
chart_b64 = base64.b64encode(buf.getvalue()).decode()
plt.close(fig)

# 4. 渲染 HTML
env = Environment(loader=FileSystemLoader("templates"))
html = env.get_template("report.html").render(
    title="月度销售报告",
    table=monthly.to_html(index=False, classes="table"),
    chart_b64=chart_b64,
)

(OUTPUT_DIR / "report.html").write_text(html, encoding="utf-8")
print("报告已生成：output/report.html")
```

## 常见陷阱

- **硬编码路径**：用 `pathlib.Path` 或环境变量管理路径，避免在不同机器上报 FileNotFoundError。
- **图表编码问题**：matplotlib 默认字体不含中文，需显式设置字体（如 `plt.rcParams["font.family"] = "PingFang SC"`），否则中文标签显示为方块。
- **报告可复现性**：如果报告依赖当前时间或随机采样，应固定随机种子（`random_state`）并在报告中记录生成时间戳和数据版本。
- **DataFrame 的 `to_html()` XSS 风险**：当数据来源不受信任时，Jinja2 的 `| safe` 需配合数据清洗，防止注入。
- **大数据量导致报告过慢**：在聚合阶段过滤数据，而非把全量数据传入模板。

## 面试高频问题

**Q：如何自动化报告生成并发送邮件？**

核心思路：cron/Airflow 触发脚本 → 生成 HTML/PDF → 用 `smtplib` 或第三方邮件 SDK（如 SendGrid）将文件作为附件发送。需注意邮件客户端对内嵌图片的支持差异，HTML 报告最好同时提供纯文本摘要。

**Q：选择 HTML 还是 PDF 作为报告格式？**

| 场景 | 推荐格式 |
|------|----------|
| 内部仪表盘、需要交互 | HTML |
| 正式文件、打印归档 | PDF |
| 数据科学探索 | HTML（ydata-profiling） |
| 邮件附件 | PDF（兼容性最好） |

**Q：报告模板和数据逻辑如何解耦？**

将数据聚合逻辑封装为返回纯 Python 字典或 DataFrame 的函数，模板只负责展示。这样更换模板引擎（如从 Jinja2 换成 mako）或输出格式（如增加 Excel 导出）时，数据层无需修改。
