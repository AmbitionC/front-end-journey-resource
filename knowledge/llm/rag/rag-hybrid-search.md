# Hybrid Search 混合检索

向量检索让 RAG 系统获得了语义理解能力，但在实际生产中，单靠向量相似度往往不够——精确关键词、专有名词、罕见术语这些场景，向量检索会悄悄失手。Hybrid Search（混合检索）通过融合 dense 和 sparse 两种检索信号，在召回率和精度之间取得更好的平衡。

## 为什么纯向量检索会失败

向量检索（Dense Retrieval）将文本编码为高维向量，通过余弦相似度或点积度量语义距离。这套机制对"同义表达"很友好：问"如何提升网站速度"可以命中"网页性能优化方法"。

但它有几个固有弱点：

**精确匹配失效**：用户搜索 `GPT-4o`、`RFC 7231`、`errno: ECONNRESET` 这类精确术语时，embedding 模型可能把它们映射到语义相近但并非所求的文档上，原始关键词的命中优先级被稀释了。

**罕见词/低频词退化**：embedding 模型是在大量通用语料上训练的，对领域内的低频术语表示能力弱，向量空间中这些词的表示往往不可靠。

**Named Entity 问题**：人名、产品名、版本号等 Named Entity 在语义空间中分布无规律，相似的向量不代表相同的实体。

## 为什么纯 BM25 也不够

BM25 是经典的稀疏检索算法（Sparse Retrieval），基于词频（TF）和逆文档频率（IDF）打分，本质上是关键词匹配。

它的问题同样明显：**没有语义理解**。问"汽车"，BM25 不会返回只含"轿车"、"sedan"的文档。同义词、近义词、不同语言之间的概念对齐，BM25 一概不知。对话式问题、长尾查询、跨语言场景下召回率会显著下降。

## Hybrid Search：两路并行，结果融合

混合检索的思路直接：**同时运行 dense 检索和 sparse 检索，然后合并两路结果**。

```
Query
  ├── Dense Retriever (向量检索) → Top-K 候选列表 A
  └── Sparse Retriever (BM25)   → Top-K 候选列表 B
            ↓
       Fusion (RRF / 加权合并)
            ↓
       最终 Top-K 文档
            ↓ (可选)
       Re-ranker (精排)
            ↓
       送入 LLM
```

核心问题在于：如何把两路分数合并？分数量纲不同——向量相似度通常是 0~1 的余弦值，BM25 分数没有上界——直接加权平均需要归一化，且对超参数非常敏感。

## Reciprocal Rank Fusion（RRF）

RRF 是目前最常用的 rank fusion 策略，由 Cormack et al. 在 2009 年提出。它的核心洞察是：**只用排名（rank），不用原始分数**，天然避免了不同量纲的问题。

公式如下：

$$RRF(d) = \sum_{r \in R} \frac{1}{k + rank_r(d)}$$

其中：
- $d$ 是某篇文档
- $R$ 是所有检索器的集合（这里是 dense 和 sparse 两路）
- $rank_r(d)$ 是文档 $d$ 在检索器 $r$ 中的排名（从 1 开始）
- $k$ 是平滑常数，通常取 60，用于减弱头部排名的统治力

**直觉理解**：一篇文档在两路检索中都排第 1，它的 RRF 分数 ≈ 2 × 1/(60+1)，高于只在一路检索中排第 1 的文档。两路都认可的文档会获得更高的综合排名；只有一路认可的文档不会被完全排除，只是分数相对低。

`k=60` 的含义：排名 1 的文档得 1/61 ≈ 0.016，排名 60 的文档得 1/120 ≈ 0.008，差距仅约 2 倍，这让后部排名的文档仍有机会因为"另一路也排进了前列"而晋升。

## 实现骨架（Python / TypeScript 均可参考）

```python
from typing import List, Dict

def reciprocal_rank_fusion(
    results_list: List[List[str]],  # 每路检索返回的 doc_id 列表（已按分数排序）
    k: int = 60
) -> List[tuple[str, float]]:
    scores: Dict[str, float] = {}
    for results in results_list:
        for rank, doc_id in enumerate(results, start=1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


def hybrid_search(query: str, top_k: int = 10) -> List[str]:
    # 1. 两路并行检索
    dense_results = vector_store.search(query, k=top_k * 2)   # 多取一些供 fusion 用
    sparse_results = bm25_index.search(query, k=top_k * 2)

    dense_ids = [doc.id for doc in dense_results]
    sparse_ids = [doc.id for doc in sparse_results]

    # 2. RRF 融合
    fused = reciprocal_rank_fusion([dense_ids, sparse_ids], k=60)
    top_ids = [doc_id for doc_id, _ in fused[:top_k]]

    # 3. （可选）Cross-Encoder 精排
    candidates = fetch_docs(top_ids)
    reranked = cross_encoder.rerank(query, candidates)

    return reranked[:top_k]
```

## Re-ranking：精排的价值

RRF 解决了粗排融合问题，但粗排候选集里仍可能有"相关但排序不优"的文档。**Cross-Encoder Re-ranker** 对 query 和每篇候选文档做 joint encoding（而非独立 embedding），能捕捉更细粒度的 query-document 交互，排序质量更高。

代价是速度慢——Cross-Encoder 不能预计算，每次 inference 都需要同时处理 query 和 document。因此通常的做法是：

- **粗排**（向量 + BM25）：快速从百万级文档中筛出 20~50 个候选
- **精排**（Cross-Encoder）：只对这 20~50 个候选做精排，控制延迟

## 三种策略对比

| 维度 | Pure Dense | Pure Sparse (BM25) | Hybrid Search |
|------|-----------|-------------------|---------------|
| 语义理解 | 强 | 无 | 强（继承 Dense） |
| 精确关键词匹配 | 弱 | 强 | 强（继承 Sparse） |
| Named Entity / 专有名词 | 弱 | 强 | 强 |
| 同义词 / 近义词 | 强 | 无 | 强 |
| 实现复杂度 | 低 | 低 | 中 |
| 基础设施成本 | 向量数据库 | 倒排索引 | 两者都需要 |
| 查询延迟 | 低 | 低 | 略高（两路 + 融合） |
| 适用场景 | 语义搜索、问答 | 日志检索、代码搜索 | 生产级 RAG 推荐 |

## 何时用 Hybrid，何时用 Pure Vector

**优先选 Hybrid** 的场景：
- 文档包含大量专有名词、产品型号、版本号
- 用户查询中常出现精确短语或引号搜索
- 领域垂直、词汇分布与通用 embedding 训练集差距大
- 对召回率要求高（宁可多返回，不能漏）

**Pure Vector 足够** 的场景：
- 文档和查询都是自然语言，语义表达多样
- 系统简单性优先，基础设施资源有限
- embedding 模型已在目标领域 fine-tune

## 面试常问

**Q：RRF 中的 k=60 有什么来源？**
原论文实验中 k=60 在多个数据集上表现稳定，是经验值而非理论推导。实际项目中可以通过离线评估数据集调优。

**Q：Hybrid Search 一定比纯向量好吗？**
不一定。如果 embedding 模型在目标域已做 fine-tune，且查询以语义为主，纯向量可能已经足够。Hybrid 的收益在于覆盖那些"语义检索失手"的 case，需要用评估指标（Recall@K、MRR 等）在实际数据上验证收益。

**Q：除了 RRF，还有哪些 fusion 方法？**
线性加权融合（需要归一化和调参）、CombSUM、CombMNZ，以及学习式的 learned sparse retrieval（如 SPLADE）。RRF 因为无需调分数量纲、超参少，在工程实践中最为流行。
