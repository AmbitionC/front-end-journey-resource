# Embedding 原理与向量相似度

Embedding（嵌入）是将文本（或图像、音频）映射为一个数值向量的技术，它是语义搜索和 RAG 系统的基础。理解 embedding 的工作原理，能帮助你正确选择相似度度量方式，避免 RAG 效果差的常见陷阱。

## 什么是 Embedding

直观理解：把"苹果"和"梨"都变成高维空间中的一个点，语义相近的词/句子，在空间中的距离也相近。

一个句子经过 embedding 模型处理后，得到的是一个固定长度的浮点数数组，例如 1536 维（OpenAI text-embedding-3-small）或 1024 维（其他模型）。这个向量捕捉了文本的语义信息，而不只是关键词。

```
"今天天气真好" → [0.023, -0.147, 0.891, ..., 0.034]  // 1536 个浮点数
"The weather is great today" → [0.019, -0.152, 0.884, ..., 0.041]  // 语义相近，向量也相近
"量子力学基础" → [-0.312, 0.445, -0.023, ..., 0.178]  // 语义不同，向量差异大
```

## Embedding 模型如何工作

大致流程（概念层面）：

```
输入文本
  ↓
Tokenization（分词为 token）
  ↓
Transformer Encoder（多层注意力机制）
  ↓
Pooling（将所有 token 的表示聚合为一个向量）
  ↓
固定维度向量（通常已 L2 归一化）
```

Encoder-only 架构（如 BERT 的变体）是 embedding 模型的主流选择，与 GPT 的 decoder-only 架构不同，它的目标是理解而非生成。

## 向量相似度度量

获得向量后，需要计算两个向量的"相似程度"。三种常用方式：

### 余弦相似度（Cosine Similarity）

**最常用**。衡量两个向量方向的一致性，与向量长度无关。

```
cos(θ) = (A · B) / (|A| × |B|)
```

取值范围 [-1, 1]，值越大越相似。若向量已 L2 归一化（|A| = |B| = 1），余弦相似度等价于点积。

**适用场景**：文本语义相似度、RAG 检索，大多数 embedding 模型输出的是归一化向量，直接用余弦相似度即可。

### 点积（Dot Product）

```
A · B = Σ(Aᵢ × Bᵢ)
```

当向量已归一化时与余弦相似度等价，计算更快。部分模型（如 OpenAI 的 embedding API）官方推荐用点积（以官方文档为准）。

**适用场景**：向量已归一化的场景，以及某些需要用向量长度编码"重要性"的场景（如推荐系统）。

### 欧氏距离（Euclidean Distance / L2 Distance）

```
d(A, B) = √(Σ(Aᵢ - Bᵢ)²)
```

值越小越相似（注意方向和余弦相似度相反）。

**适用场景**：图像 embedding、需要捕捉绝对位置差异的场景。对于归一化的文本 embedding，效果通常不如余弦相似度。

### 三者对比

| 指标 | 计算复杂度 | 范围 | 是否受向量长度影响 | 推荐场景 |
|------|-----------|------|------------------|---------|
| 余弦相似度 | O(n) | [-1, 1] | 否 | 文本语义搜索 |
| 点积 | O(n) | 无界 | 是 | 归一化向量场景 |
| 欧氏距离 | O(n) | [0, ∞) | 是 | 图像/音频 embedding |

## TypeScript 示例：调用 Embedding API 并计算余弦相似度

```typescript
// 以 OpenAI 为例，其他提供商 API 形式类似，以官方文档为准
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) throw new Error(`Embedding API error: ${response.status}`);
  const data = await response.json();
  return data.data[0].embedding as number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector dimensions must match');

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dot / denominator;
}

// 使用示例
async function semanticSearch(query: string, documents: string[]) {
  const queryEmbedding = await getEmbedding(query);
  const docEmbeddings = await Promise.all(documents.map(getEmbedding));

  const scores = docEmbeddings.map((docEmb, i) => ({
    document: documents[i],
    score: cosineSimilarity(queryEmbedding, docEmb),
  }));

  // 按相似度降序排列
  return scores.sort((a, b) => b.score - a.score);
}
```

## 维度与性能权衡

Embedding 维度越高，通常携带的信息越丰富，但也带来更高的存储和计算开销：

- **存储**：一个 1536 维的 float32 向量占 6KB，百万级文档就是 6GB
- **检索延迟**：向量数据库（如 Pinecone、Qdrant、pgvector）使用 HNSW 等近似最近邻算法，在精度和速度间取得平衡
- **降维**：部分场景可以用 PCA 或 Matryoshka 嵌套向量（OpenAI 支持截断维度）在保留大部分语义的同时降低开销

## 稀疏检索 vs 稠密检索

RAG 系统通常同时使用两种检索方式：

| 类型 | 代表 | 原理 | 优势 | 劣势 |
|------|------|------|------|------|
| 稀疏检索 | BM25、TF-IDF | 关键词词频统计，向量极稀疏（大部分为 0） | 精确关键词匹配、可解释、无需 GPU | 无法理解语义，"汽车"和"轿车"是两个词 |
| 稠密检索 | Embedding + 向量数据库 | 语义向量，全部维度有值 | 语义理解、跨语言、同义词匹配 | 需要 embedding 模型，存储成本高 |

**混合检索（Hybrid Search）**：结合两者，用 BM25 处理精确关键词，用 embedding 处理语义相似，通过 RRF（Reciprocal Rank Fusion）融合排名，是目前 RAG 的主流实践。

## 面试常问

**Q：余弦相似度为什么比欧氏距离更适合文本 embedding？**
A：文本长度不同会导致向量的"模"（长度）不同，欧氏距离受此影响大。余弦相似度只关注方向，与长度无关，更能反映语义相似性。

**Q：embedding 向量和 one-hot 编码有什么本质区别？**
A：one-hot 是稀疏向量，每个词独立，无法表达语义关系。embedding 是稠密向量，通过训练学习语义关系，"国王"减"男人"加"女人"约等于"女王"——这种语义运算在 one-hot 中不可能实现。

**Q：RAG 中 chunk 的大小对 embedding 质量有什么影响？**
A：chunk 太小丢失上下文，embedding 的语义代表性差；chunk 太大语义混杂，检索时噪声多。常见策略是 256–512 token 一个 chunk，并做 overlap（相邻 chunk 有重叠），防止关键信息被截断在边界。

**Q：如果两段文本余弦相似度很高，是否意味着它们表达的信息相同？**
A：不一定。"今天天气好"和"今天天气不好"在 embedding 空间中可能相近（都含"天气"语义），但语义相反。这是 embedding 检索的已知局限，需要结合 re-ranker 模型做二次精排。
