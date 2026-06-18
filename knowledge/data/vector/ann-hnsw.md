# 向量检索：ANN 算法与 HNSW

在 RAG、推荐系统、图像搜索等场景中，我们需要从数百万甚至数十亿条向量中快速找到与查询最相似的若干条——这就是向量检索的核心问题，也是决定整个系统延迟与吞吐的关键瓶颈。

## 暴力检索的局限

最朴素的做法是对每条查询向量与库中所有向量逐一计算距离，取最小的 K 个，这被称为精确最近邻（Exact NN）或暴力检索。

| 方法 | 时间复杂度 | 空间复杂度 | 精度 |
|------|-----------|-----------|------|
| 暴力 (Brute Force) | O(N·D) | O(N·D) | 100% |
| ANN 算法 | 远低于 O(N·D) | 依算法而异 | 可配置 |

当 N 达到百万量级、维度 D 达到几百到几千时，暴力检索的延迟已无法满足在线场景。**近似最近邻（Approximate Nearest Neighbor，ANN）**算法通过允许极小的精度损失，换取数量级的速度提升。

## ANN 算法的主要流派

### 1. 基于树的方法（如 KD-Tree、Ball-Tree）

将向量空间递归划分为子区域，查询时只遍历候选子树。在低维空间（D < 20）效果好，但高维下会退化——所谓"维度灾难"，几乎所有子树都需要被访问。

### 2. 基于量化的方法（如 IVFFlat、PQ）

**IVFFlat（Inverted File with Flat）** 是代表性方案：
- 用 K-means 将向量库聚成 `nlist` 个簇，存储倒排索引。
- 查询时只扫描最近的 `nprobe` 个簇。
- 优点：内存友好，适合超大规模库；缺点：召回率受 `nprobe` 与聚类质量影响较大。

乘积量化（PQ）进一步压缩向量存储，但精度有所下降。

### 3. 基于图的方法（如 HNSW、NSG）

将向量构建成一张近似导航图，查询时从入口点出发，沿图边"贪心爬坡"找到最近邻。图方法在召回率与查询速度的权衡上表现最优，HNSW 是目前业界最广泛使用的图索引算法。

## HNSW：分层可导航小世界图

HNSW（Hierarchical Navigable Small World）由 Malkov & Yashunin 于 2018 年提出，核心思想融合了两个概念：

1. **NSW（可导航小世界图）**：类似社交网络的六度分隔现象——任意两点之间通过少量跳转即可连通，但直接在单层图上构建会导致建图质量参差不齐。
2. **分层结构**：借鉴跳表（Skip List），将图分为多层，高层稀疏（"高速公路"），低层稠密（"街道"）。查询时从最高层粗粒度定位，逐层下钻，最终在底层精确搜索。

### 分层图结构示意

```
Layer 2:  [A] ——————————— [F]          ← 稀疏，远程连接
Layer 1:  [A] — [C] — [E] — [F]        ← 中等密度
Layer 0:  [A]-[B]-[C]-[D]-[E]-[F]-[G]  ← 最稠密，所有向量都在此层
```

每个节点以概率指数衰减决定是否出现在更高层，这保证了高层节点分布均匀。查询从最高层的入口点出发，贪心地向目标移动，到达该层局部最优后下移到下一层继续搜索，直到第 0 层完成精确 K 近邻搜索。

### 关键参数详解

#### `M`（每个节点的最大双向连接数）

控制每层图中每个节点最多保留多少条边（第 0 层为 `2M`）。

- M 越大，图越稠密，召回率越高，但建图时间和内存消耗线性增长。
- 常用范围：8–64，嵌入维度越高通常需要更大的 M。
- 经验值：文本检索通常 16–32，图像/多模态可适当调大。

#### `ef_construction`（建图时的候选集大小）

建图阶段为每个新节点寻找邻居时，动态候选列表的大小。

- 越大建图质量越高，召回率越高，但建图时间增加。
- 必须满足 `ef_construction >= M`，推荐 `ef_construction >= 2 * M`。
- 建图是一次性开销，可以适当调大。

#### `ef_search`（查询时的候选集大小）

查询阶段维护的动态候选列表大小，必须 `>= K`（取回的近邻数量）。

- 这是**运行时**可动态调整的参数，不影响索引结构。
- 越大召回率越高，延迟越高。可通过调整此参数在精度与速度间做实时权衡。

| 参数 | 影响阶段 | 增大效果 | 代价 |
|------|---------|---------|------|
| M | 建图 | 召回率↑，内存↑ | 建图时间↑ |
| ef_construction | 建图 | 图质量↑，召回率↑ | 建图时间↑ |
| ef_search | 查询 | 召回率↑ | 查询延迟↑ |

## HNSW vs IVFFlat

| 维度 | HNSW | IVFFlat |
|------|------|---------|
| 查询速度 | 极快，延迟稳定 | 受 nprobe 影响较大 |
| 召回率 | 高，可调 | 依赖聚类质量 |
| 内存占用 | 较高（需存图结构） | 较低 |
| 建索引时间 | 较慢 | 较快 |
| 增量插入 | 天然支持（无需重建） | 需定期重建 |
| 适用规模 | 百万级以内最优 | 十亿级也可用（配合 PQ） |

**选型建议**：数据规模在百万以内且需要低延迟在线服务时，优先选 HNSW；数据规模极大且内存受限时，考虑 IVFFlat + PQ。

## Python 代码示例

### 使用 hnswlib

```python
import hnswlib
import numpy as np

DIM = 128
NUM_ELEMENTS = 100_000

# 生成示例数据
data = np.random.rand(NUM_ELEMENTS, DIM).astype(np.float32)
query = np.random.rand(10, DIM).astype(np.float32)

# 初始化索引
index = hnswlib.Index(space='cosine', dim=DIM)

# 建图参数
index.init_index(
    max_elements=NUM_ELEMENTS,
    ef_construction=200,  # 建图时候选集大小
    M=16                  # 每节点最大连接数
)

# 批量添加向量（支持增量添加）
index.add_items(data, ids=np.arange(NUM_ELEMENTS))

# 查询前设置 ef_search（可随时调整）
index.set_ef(50)  # ef_search，必须 >= K

# 查询 Top-10
labels, distances = index.knn_query(query, k=10)
print("最近邻 ID:", labels[0])
print("距离:", distances[0])

# 持久化
index.save_index("hnsw_index.bin")

# 加载
index2 = hnswlib.Index(space='cosine', dim=DIM)
index2.load_index("hnsw_index.bin", max_elements=NUM_ELEMENTS)
```

### 使用 faiss（HNSW 实现）

```python
import faiss
import numpy as np

DIM = 128
NUM_ELEMENTS = 100_000

data = np.random.rand(NUM_ELEMENTS, DIM).astype(np.float32)
query = np.random.rand(10, DIM).astype(np.float32)

# faiss.IndexHNSWFlat 使用 L2 距离
# M=32 表示每层最大连接数
index = faiss.IndexHNSWFlat(DIM, 32)

# 设置建图参数
index.hnsw.efConstruction = 200

# 添加向量（faiss HNSW 不支持 ID 映射，需配合 IndexIDMap）
index.add(data)

# 设置查询参数
index.hnsw.efSearch = 64

# 查询 Top-10
distances, labels = index.search(query, k=10)
print("最近邻 ID:", labels[0])
```

## 常见误区与最佳实践

**误区 1：ef_search 设为固定值**
ef_search 应该根据业务对召回率的要求动态调整，而不是一次设定后不再改动。上线前应绘制"召回率 vs 延迟"曲线，找到业务可接受的工作点。

**误区 2：M 越大越好**
M 增大会带来内存和建图时间的线性增长，而召回率的提升是边际递减的。通常 M=16 或 M=32 已能满足绝大多数场景。

**误区 3：忽略距离度量与向量归一化**
使用余弦相似度时，务必提前对向量做 L2 归一化；使用 L2 距离时，不归一化。两者混用会导致召回严重偏差。

**误区 4：建图后大量删除再查询**
HNSW 的删除是逻辑删除（标记），不会重整图结构。大量删除后若不重建索引，查询路径中会存在大量无效节点，导致召回率下降。

## 面试常问要点

- **HNSW 为什么快？** 分层结构让查询从稀疏高层快速定位区域，再在密集底层精确搜索，每一步跳转都大幅减少候选范围。
- **M、ef_construction、ef_search 三者关系？** M 决定图结构，ef_construction 决定建图质量（一次性），ef_search 决定查询精度（实时可调）。
- **HNSW 和 IVFFlat 怎么选？** 规模中等、需要低延迟且内存够用选 HNSW；规模超大、内存受限选 IVF 系列。
- **HNSW 支持增量更新吗？** 支持插入，不支持原地更新和高效物理删除；大量删除后需定期重建。
- **召回率如何评估？** 对比 ANN 结果与暴力检索结果的重叠比例，即 `recall@K = |ANN结果 ∩ 精确结果| / K`。
