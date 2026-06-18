# Jupyter Notebook 工程实践

Jupyter Notebook 是数据科学和机器学习领域最常见的交互式计算环境，其"代码+文档+结果"三合一的 cell 模式极大降低了探索性分析的门槛。然而正因为它的灵活性，工程上的混乱状态也屡见不鲜——理解如何规范使用 Notebook，是从"能跑起来"到"可维护、可复现"的关键一步。

---

## 工具选型：Notebook vs JupyterLab vs VS Code

| 工具 | 定位 | 适用场景 |
|------|------|---------|
| Jupyter Notebook (classic) | 轻量浏览器 UI，单文件视图 | 快速原型、教学演示 |
| JupyterLab | 多标签 IDE 式界面，支持插件 | 日常数据分析、多文件工作流 |
| VS Code + Jupyter 扩展 | 嵌入编辑器，Git 集成更好 | 工程项目、需要版本管理的场景 |

三者底层均使用相同的 `.ipynb` 文件格式和 kernel 协议，核心概念完全通用。JupyterLab 是官方推荐的下一代界面；VS Code 的 Jupyter 支持在工程化程度要求更高时更有优势，因为它与 Git、Linter、调试器的集成更紧密。

---

## Cell 执行顺序与隐藏状态陷阱

Notebook 的最大风险之一：**kernel 中的变量状态与 cell 的视觉顺序无关，只与执行历史有关。**

```python
# Cell 1：定义变量
x = 10

# Cell 2：修改变量（假设你先执行了这个 cell）
x = 99

# Cell 3：使用变量
print(x)  # 输出 99，而非 10——取决于执行顺序，而不是 cell 位置
```

常见陷阱：

- **反向执行**：在下方 cell 修改了变量后，重新执行上方 cell，产生与预期不符的结果
- **删除 cell 后状态残留**：删掉了定义变量的 cell，但 kernel 内存中变量仍然存在，代码看起来能跑但实际上依赖了"幽灵变量"
- **重启验证缺失**：交付前没有执行 "Kernel → Restart & Run All"，导致别人拿到的 Notebook 无法从头复现

**最佳实践**：交付或提交前，永远执行一次 "Restart & Run All"，确保 Notebook 是线性可复现的。

---

## Magic Commands 常用速查

Magic commands 是 IPython 提供的以 `%`（行魔法）或 `%%`（cell 魔法）开头的特殊指令，不属于标准 Python 语法。

```python
# 单行计时（自动多次运行取均值）
%timeit [x**2 for x in range(1000)]

# 整个 cell 计时（只运行一次）
%%time
import time
time.sleep(0.5)
result = sum(range(10_000_000))

# 在 Notebook 内嵌显示 matplotlib 图表（JupyterLab 默认已内嵌，classic 需要）
%matplotlib inline

# 加载扩展，例如 autoreload（自动重载外部模块，开发时非常有用）
%load_ext autoreload
%autoreload 2

# 执行外部 Python 脚本（相当于将脚本内容注入当前 kernel）
%run utils/preprocess.py
```

`%autoreload 2` 配合 `%load_ext autoreload` 是工程开发中高频组合：把可复用逻辑抽到 `.py` 文件后，在 Notebook 中修改该文件会自动生效，无需重启 kernel。

---

## Notebook 组织规范

### 命名约定

```
# 推荐格式：序号-作者-描述
01-chenhao-eda-user-behavior.ipynb
02-chenhao-feature-engineering.ipynb
03-chenhao-model-training-xgboost.ipynb
```

有序前缀便于在文件系统中排序，作者标识方便多人协作时追溯。

### Cell 结构建议

一个工程级 Notebook 的典型结构：

```
[Markdown cell] 标题、目的、作者、日期
[Code cell]     导入依赖
[Code cell]     配置常量（路径、超参数等集中管理）
[Markdown cell] ## 1. 数据加载
[Code cell]     加载逻辑
[Markdown cell] ## 2. 探索性分析
...
[Markdown cell] ## N. 结论与后续步骤
```

将所有路径、超参数等配置集中在顶部专用 cell，避免硬编码分散在各处。

---

## 参数化：papermill

[papermill](https://github.com/nteract/papermill) 允许从命令行或代码向 Notebook 注入参数，实现批量运行不同配置。

```python
# 在 Notebook 中标记参数 cell（在 JupyterLab 中右键 cell → Add Tag → "parameters"）
# 该 cell 定义默认值
input_path = "data/raw/train.csv"
n_estimators = 100
random_state = 42
```

```bash
# 命令行注入参数运行
papermill template.ipynb output/run_2024.ipynb \
  -p input_path data/raw/train_2024.csv \
  -p n_estimators 200
```

papermill 常用于 CI/CD 流水线中定期执行报告生成，或在不同数据集上复用同一分析模板。

---

## 版本控制：nbstripout

`.ipynb` 文件本质是 JSON，其中包含每个 cell 的输出（图片、表格等），直接 `git commit` 会导致 diff 极难阅读，且二进制图片内容频繁变动。

**解决方案：nbstripout**，在 commit 前自动清除输出。

```bash
# 安装
pip install nbstripout

# 在当前仓库启用（写入 .git/config，只需执行一次）
nbstripout --install

# 此后 git add *.ipynb 时，输出会自动被剥离，不影响工作目录中的文件
```

与团队共享时，建议将 `nbstripout --install` 写入项目的 `Makefile` 或 `setup` 脚本，确保所有协作者都启用。

---

## 导出与转换：nbconvert

nbconvert 是 Jupyter 官方的格式转换工具，支持将 Notebook 导出为多种格式。

```bash
# 导出为 HTML（保留输出，适合分享报告）
jupyter nbconvert --to html analysis.ipynb

# 导出为纯 Python 脚本（去除 Markdown，保留代码）
jupyter nbconvert --to script analysis.ipynb

# 导出为 PDF（需要 LaTeX 环境）
jupyter nbconvert --to pdf analysis.ipynb

# 执行并导出（先跑一遍，再生成 HTML）
jupyter nbconvert --to html --execute analysis.ipynb
```

`--execute` 参数在 CI/CD 场景中很有用：定时任务拉取最新数据、执行 Notebook、将结果 HTML 推送到报告系统，全程无需人工干预。

---

## 依赖管理

Notebook 本身不携带环境信息，依赖管理需要显式约定。

```python
# 在 Notebook 顶部 cell 中显示当前环境信息，便于复现
import sys
print(sys.version)
print(sys.executable)

# 导出当前环境依赖（在 terminal 或 Notebook cell 中执行）
# !pip freeze > requirements.txt
# !conda env export > environment.yml
```

```bash
# 为项目创建独立 conda 环境
conda create -n proj-analysis python=3.11
conda activate proj-analysis
pip install -r requirements.txt

# 将 conda 环境注册为 Jupyter kernel
pip install ipykernel
python -m ipykernel install --user --name proj-analysis --display-name "proj-analysis"
```

每个项目应有独立 kernel，避免不同项目的依赖互相污染。

---

## 常见坑总结

```
架构上的常见问题
├── Cell 执行顺序不固定 → 始终 Restart & Run All 验证
├── 单个 Notebook 过于臃肿 → 按阶段拆分（EDA / 特征工程 / 训练）
├── 路径硬编码 → 使用 pathlib.Path(__file__).parent 或配置 cell
├── 输出提交到 Git → 使用 nbstripout
└── 无环境记录 → 维护 requirements.txt 或 environment.yml
```

**硬编码路径**是高频问题，推荐统一使用项目根目录相对路径：

```python
from pathlib import Path

# 以 Notebook 所在目录为基准，向上找到项目根
PROJECT_ROOT = Path.cwd().parent  # 或根据实际目录层级调整
DATA_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
df = pd.read_csv(DATA_DIR / "train.csv")
```

---

## 面试常见问题

**Q：Notebook 适合用于生产环境吗？**

直接将 Notebook 作为生产服务运行是反模式。推荐路径是：在 Notebook 中完成探索验证后，将核心逻辑重构为 `.py` 模块，Notebook 仅保留演示和分析用途。如果需要定期执行（如报告生成），可通过 papermill + CI/CD 调度，但不应暴露为在线服务。

**Q：如何保证 Notebook 的可复现性？**

三个关键点：① 提交前执行 Restart & Run All；② 锁定依赖版本（requirements.txt 或 conda lock）；③ 固定随机种子（`random.seed`、`numpy.random.seed`、框架级别的 seed）。

**Q：多人协作 Notebook 如何管理冲突？**

使用 nbstripout 剥离输出后，`.ipynb` 的 JSON diff 会大幅简化。更进一步的方案是使用 ReviewNB（GitHub App）提供 Notebook 专用 diff 视图，或约定每人维护独立 Notebook 文件，最终汇总到主分析文件。

**Q：如何对 Notebook 中的代码做单元测试？**

将可测试的业务逻辑提取到独立的 `.py` 模块，针对模块编写 pytest 测试。Notebook 本身不适合直接测试；如果必须测试 Notebook 级别的完整流程，可使用 `nbval` 插件（通过重新执行并对比输出来验证）。
