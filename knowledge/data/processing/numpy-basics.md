# NumPy 数值计算基础

NumPy 是 Python 科学计算的基石，几乎所有机器学习框架（PyTorch、TensorFlow、scikit-learn）底层都依赖它的多维数组结构。理解 NumPy 不只是为了用好它，更是理解向量化思想的入口。

## ndarray 核心概念

NumPy 的核心是 `ndarray`（N-dimensional array），它是一块连续的内存，存储同质类型的元素。这与 Python 原生 list 有本质区别：list 存的是指向各处对象的指针，元素类型可以混杂；ndarray 则把同类型数据紧凑排布在一起，因此能整体交给底层 C/Fortran 代码批量计算，既省内存又快几个数量级。也正因为内存连续且同质，ndarray 才支持高效的切片视图和广播运算。三个最重要的属性：

| 属性 | 含义 | 示例 |
|------|------|------|
| `shape` | 各维度的长度 | `(3, 4)` 表示 3 行 4 列 |
| `dtype` | 元素数据类型 | `float32`、`int64`、`bool` |
| `ndim` | 维度数量 | `len(a.shape)` |

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
print(a.shape)   # (2, 3)
print(a.dtype)   # int64
print(a.ndim)    # 2
```

**dtype 选择的实际影响**：`float64` 精度高但占用是 `float32` 的两倍。训练神经网络时 GPU 默认用 `float32`，而 NumPy 默认 `float64`，混用会触发隐式转换，是常见的性能陷阱。

## 创建数组

```python
# 从 Python 列表创建
a = np.array([1, 2, 3], dtype=np.float32)

# 全零/全一
zeros = np.zeros((3, 4))
ones  = np.ones((2, 2, 2))    # 三维

# 等差序列
r1 = np.arange(0, 10, 2)      # [0, 2, 4, 6, 8]
r2 = np.linspace(0, 1, 5)     # [0, 0.25, 0.5, 0.75, 1.0]（含端点，共 5 个）

# 随机数组
rng = np.random.default_rng(42)   # 推荐新 API，可复现
r3 = rng.standard_normal((3, 3))  # 正态分布
r4 = rng.integers(0, 10, size=5)  # 整数 [0, 10)
```

`arange` 与 `linspace` 的区别：`arange` 指定步长，`linspace` 指定点数。浮点步长场景下优先用 `linspace`，避免浮点累加误差导致元素数量不稳定。

## 索引与切片

### 基础索引

```python
a = np.arange(12).reshape(3, 4)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]

a[1, 2]       # 6，等价于 a[1][2]
a[:, 1]       # 第 1 列: [1, 5, 9]
a[1:, 2:]     # 子矩阵右下角: [[6,7],[10,11]]
```

**陷阱**：基础切片返回的是**视图**，不是副本。修改切片会影响原数组。需要副本时用 `.copy()`。

```python
b = a[0, :]         # 视图
b[0] = 99           # 同时修改了 a[0, 0]

c = a[0, :].copy()  # 副本，安全
```

### 布尔索引

```python
scores = np.array([85, 42, 91, 60, 73])
mask = scores > 70
print(scores[mask])   # [85, 91, 73]

# 一步到位
print(scores[scores > 70])
```

### 花式索引（Fancy Indexing）

```python
a = np.array([10, 20, 30, 40, 50])
idx = [0, 2, 4]
print(a[idx])   # [10, 30, 50]
```

花式索引始终返回**副本**，这与基础切片不同，是常见的混淆点。

## 广播机制（Broadcasting）

Broadcasting 允许不同形状的数组进行运算，NumPy 会自动"扩展"较小的数组以匹配较大数组的形状，但**不会实际分配新内存**。

**广播规则**：从尾部维度开始对齐，两个维度兼容的条件是：相等，或其中一个为 1。

```python
# shape (3, 4) + shape (4,) -> shape (3, 4)
a = np.ones((3, 4))
b = np.array([1, 2, 3, 4])
print((a + b).shape)   # (3, 4)

# shape (3, 1) + shape (1, 4) -> shape (3, 4)
col = np.array([[1], [2], [3]])   # (3, 1)
row = np.array([[10, 20, 30, 40]]) # (1, 4)
print((col + row).shape)  # (3, 4)
```

广播常见失败场景：

```python
a = np.ones((3, 4))
b = np.ones((3,))     # 尾部是 3，不等于 4，也不是 1 -> 报错
# ValueError: operands could not be broadcast together with shapes (3,4) (3,)
```

修正：`b.reshape(3, 1)` 将其变为列向量 `(3, 1)`，即可与 `(3, 4)` 广播。

## 向量化运算 vs Python 循环

NumPy 的 ufunc（通用函数）底层是 C 实现，向量化运算速度通常是纯 Python 循环的 **50-200 倍**。

```python
import time

n = 1_000_000
a = np.random.rand(n)
b = np.random.rand(n)

# Python 循环
t0 = time.time()
c = [a[i] * b[i] for i in range(n)]
print(f"Loop: {time.time() - t0:.3f}s")   # ~0.15s

# 向量化
t0 = time.time()
c = a * b
print(f"Vectorized: {time.time() - t0:.3f}s")  # ~0.002s
```

**最佳实践**：任何出现显式 `for` 循环遍历数组元素的代码，都应优先考虑用向量化或广播重写。

## 常用函数速查

```python
a = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)

# 聚合（axis=0 按列，axis=1 按行，不传则全局）
a.sum()             # 21.0
a.sum(axis=0)       # [5., 7., 9.]
a.mean(axis=1)      # [2., 5.]
a.std()             # 标准差
np.max(a, axis=1)   # [3., 6.]

# 形状操作
a.reshape(3, 2)     # 不改变数据，返回视图
a.flatten()         # 展平，返回副本
a.T                 # 转置

# 矩阵运算
x = np.array([[1, 2], [3, 4]])
y = np.array([[5, 6], [7, 8]])
np.dot(x, y)        # 矩阵乘法，等价于 x @ y

# 拼接
np.concatenate([a, a], axis=0)   # 垂直拼接，shape (4, 3)
np.hstack([a, a])                 # 水平拼接，shape (2, 6)
np.vstack([a, a])                 # 垂直拼接
```

`reshape(-1, n)` 中的 `-1` 是推断维度的简写，`a.reshape(-1, 1)` 把任意形状变成列向量，非常常用。

## 在 AI/ML 中的应用：Embedding 向量运算

Embedding 向量在 NumPy 中就是一维或二维数组，最常见的运算是**余弦相似度**：

```python
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """计算两个 embedding 向量的余弦相似度"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# 批量计算：query 向量 vs. 文档库
query   = np.random.rand(768)          # 单条 query embedding
docs    = np.random.rand(1000, 768)    # 1000 篇文档的 embeddings

# 向量化：一次计算 1000 个相似度
norms   = np.linalg.norm(docs, axis=1)            # (1000,)
scores  = docs @ query / (norms * np.linalg.norm(query))  # (1000,)

top5_idx = np.argsort(scores)[::-1][:5]           # 相似度最高的 5 篇
```

这里的技巧是将矩阵-向量乘法 `docs @ query` 替代循环，对 1000 篇文档只需一次调用。

## 面试要点

**Q：ndarray 切片返回视图还是副本？**
基础索引（整数、切片）返回视图；布尔索引和花式索引返回副本。不确定时用 `np.shares_memory(a, b)` 检查。

**Q：广播的核心规则是什么？**
维度从尾部对齐，相等或有一个为 1 则兼容，NumPy 自动将为 1 的维度"拉伸"匹配另一个数组，但不分配实际内存。

**Q：`np.dot` 和 `@` 运算符的区别？**
对二维数组完全等价。`np.dot` 对高维数组行为更复杂（最后轴和倒数第二轴做缩并），通常优先用 `@`（`np.matmul`）更语义清晰。

**Q：为什么不要用 `np.random.seed()` 而用 `np.random.default_rng()`？**
旧的 `np.random.seed` 是全局状态，在多线程或多模块场景下不可控。`default_rng` 返回独立的生成器对象，可复现且线程安全。
