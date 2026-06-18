Python 生态的强大离不开丰富的第三方库，但多项目并存时的依赖冲突是每个开发者都绕不过的坑。掌握虚拟环境与包管理工具，是写出可维护 Python 项目的第一步。

## 为什么需要虚拟环境

Python 默认将包安装到全局 `site-packages`。当项目 A 依赖 `requests==2.28`、项目 B 依赖 `requests==2.31` 时，两者无法共存，后安装的版本会覆盖前者。

虚拟环境的本质是为每个项目创建一个独立的 Python 解释器副本和 `site-packages` 目录，环境之间完全隔离，互不干扰。

```
/project-a/
  .venv/
    lib/python3.11/site-packages/requests-2.28/

/project-b/
  .venv/
    lib/python3.11/site-packages/requests-2.31/
```

## venv 与 virtualenv

### venv（标准库内置）

Python 3.3+ 内置，无需额外安装，是最轻量的选择：

```bash
# 创建虚拟环境
python -m venv .venv

# 激活（macOS/Linux）
source .venv/bin/activate

# 激活（Windows）
.venv\Scripts\activate

# 退出
deactivate
```

激活后，`python` 和 `pip` 命令均指向虚拟环境内部，与系统 Python 完全隔离。

### virtualenv

`virtualenv` 是 `venv` 的前身，功能更丰富（支持更低版本 Python、创建速度更快），但需要单独安装。现代项目优先使用内置 `venv` 即可。

## pip 核心用法

pip 是 Python 官方包管理器，绝大多数场景下够用。

```bash
# 安装包
pip install requests

# 安装指定版本
pip install "requests>=2.28,<3.0"

# 从 requirements 文件安装
pip install -r requirements.txt

# 导出当前环境依赖
pip freeze > requirements.txt

# 查看已安装包
pip list

# 卸载
pip uninstall requests
```

### requirements.txt 的最佳实践

`pip freeze` 会锁定所有依赖（包括传递依赖）的精确版本，适合生产环境保证复现性。但维护成本较高，推荐搭配 `pip-tools` 区分直接依赖（`requirements.in`）和锁文件（`requirements.txt`）：

```bash
pip install pip-tools
# 编辑 requirements.in，只写直接依赖
pip-compile requirements.in  # 生成锁定的 requirements.txt
```

## conda：科学计算的首选

conda 不只是包管理器，也是环境管理器，且不局限于 Python 包——它可以管理 C/Fortran 库（如 BLAS、CUDA），这正是科学计算场景的核心需求。

```bash
# 创建指定 Python 版本的环境
conda create -n myenv python=3.10

# 激活环境
conda activate myenv

# 安装包（优先从 conda-forge 渠道）
conda install -c conda-forge numpy scipy

# 导出环境
conda env export > environment.yml

# 从文件还原环境
conda env create -f environment.yml
```

### conda 适用场景

- 需要管理多个 Python 版本（如同时维护 3.9 和 3.11 项目）
- 依赖非 Python 的系统库（NumPy 依赖的 BLAS、PyTorch 的 CUDA 等）
- 数据科学/机器学习项目（Anaconda 发行版预装常用科学库）

纯 Web 后端项目通常不需要 conda，`venv + pip` 足够。

## uv：新一代包管理工具

uv 由 Astral（Ruff 的作者）用 Rust 编写，2024 年发布后迅速成为社区热点。其核心优势是**极速**——比 pip 快 10-100 倍，冷启动安装常见包只需数百毫秒。

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建虚拟环境
uv venv .venv

# 安装包（自动激活环境）
uv pip install requests

# 从 requirements.txt 安装
uv pip install -r requirements.txt

# 初始化项目（生成 pyproject.toml）
uv init myproject
cd myproject

# 添加依赖并锁定
uv add requests
uv add --dev pytest  # 开发依赖

# 同步依赖（根据 uv.lock）
uv sync
```

uv 使用 `uv.lock` 作为锁文件，类似 Node.js 的 `package-lock.json`，精确记录所有依赖的哈希值，保证跨机器复现。

## 工具对比

| 维度 | pip | conda | uv |
|------|-----|-------|-----|
| 安装速度 | 慢 | 较慢 | 极快（Rust 实现） |
| 虚拟环境管理 | 需配合 venv | 内置 | 内置 |
| 多 Python 版本 | 不支持 | 支持 | 支持（uv python install） |
| 非 Python 依赖 | 不支持 | 支持 | 不支持 |
| 锁文件 | 无（需 pip-tools） | environment.yml（不精确） | uv.lock（精确） |
| 适用场景 | 通用 | 科学计算 | 现代 Python 项目 |
| 学习成本 | 低 | 中 | 低 |

## 常见误区与面试要点

### 误区

**误区 1：用 `sudo pip install` 安装全局包**
直接污染系统 Python，可能破坏系统工具。永远在虚拟环境中安装依赖。

**误区 2：把 `.venv` 目录提交到 Git**
虚拟环境包含绝对路径，不可移植。应在 `.gitignore` 中排除 `.venv/`，只提交 `requirements.txt` 或 `uv.lock`。

**误区 3：混用 pip 和 conda 管理同一环境**
conda 环境中使用 pip 安装包时，conda 无法感知这些包的依赖关系，可能导致环境损坏。如必须混用，先用 conda 安装，再用 pip 补充。

**误区 4：`pip freeze` 等于项目直接依赖**
`pip freeze` 输出的是所有已安装包（含传递依赖），直接作为 `requirements.txt` 会让文件臃肿且难以维护。

### 面试要点

- **虚拟环境的原理**：修改 `PATH` 使 `python`/`pip` 指向 `.venv/bin/`，同时设置 `VIRTUAL_ENV` 环境变量，让解释器优先搜索虚拟环境的 `site-packages`。
- **`pip install -e .`**：以"可编辑模式"安装本地包，代码修改立即生效，无需重新安装，开发阶段常用。
- **pyproject.toml vs setup.py**：前者是 PEP 517/518 规范的现代标准，推荐新项目使用；`setup.py` 是旧标准，逐步被取代。
- **uv 的速度来源**：Rust 实现 + 内置并发下载 + 全局缓存（相同包只下载一次）+ 无需启动 Python 解释器。
