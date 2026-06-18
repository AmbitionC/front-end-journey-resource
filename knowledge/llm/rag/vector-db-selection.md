# 向量数据库选型：Pinecone / Chroma / pgvector

向量数据库是 RAG 系统的存储与检索核心，负责高效索引和查询高维向量。选错数据库会在规模增长时付出高昂的迁移成本，因此早期选型至关重要。

## 向量数据库的核心能力

普通数据库按精确值查找，向量数据库按**相似度**查找：

- **ANN（近似最近邻）索引**：HNSW、IVF 等算法在毫秒内从百万向量中找出最相似的 Top-K
- **元数据过滤**：先按条件筛选（如 `category = "技术"`），再做向量搜索
- **持久化与扩展**：支持大规模数据的持久存储与水平扩展

## 三种主流选择对比

| 维度 | Pinecone | Chroma | pgvector |
|------|----------|--------|----------|
| 类型 | 全托管云服务 | 开源，本地/云均可 | PostgreSQL 扩展 |
| 上手难度 | 极低（注册即用） | 低（pip/npm 安装） | 中（需要 Postgres） |
| 本地开发 | 需联网 | 支持内存/本地文件 | 支持 |
| 生产扩展性 | 强（自动扩容） | 需自行运维 | 依赖 Postgres 扩展能力 |
| 元数据过滤 | 支持 | 支持 | 原生 SQL 过滤（最灵活） |
| 成本 | 按存储+查询计费 | 免费（自托管） | 数据库托管成本 |
| 适合场景 | 快速上线、无运维能力 | 原型/小中规模 | 已有 Postgres 的项目 |

## Pinecone

全托管向量数据库，开箱即用：

```ts
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index("my-index");

// 写入向量
await index.upsert([
  {
    id: "doc-1",
    values: [0.1, 0.2, /* ...维度向量 */],
    metadata: { source: "article.md", category: "frontend" },
  },
]);

// 查询最相似的 Top-5
const results = await index.query({
  vector: queryEmbedding,
  topK: 5,
  includeMetadata: true,
  filter: { category: { $eq: "frontend" } }, // 元数据过滤
});
```

**优势**：零运维、高可用、提供 serverless 和 pod 两种部署模式。  
**劣势**：数据存在第三方云上，有数据隐私顾虑；免费 tier 有限制。

## Chroma

开源向量数据库，开发阶段首选：

```ts
import { ChromaClient } from "chromadb";

const client = new ChromaClient(); // 本地默认 http://localhost:8000
const collection = await client.getOrCreateCollection({
  name: "my-docs",
});

// 写入
await collection.upsert({
  ids: ["doc-1", "doc-2"],
  embeddings: [[0.1, 0.2 /* ... */], [0.3, 0.4 /* ... */]],
  documents: ["原始文本1", "原始文本2"],
  metadatas: [{ source: "a.md" }, { source: "b.md" }],
});

// 查询
const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 5,
  where: { source: "a.md" }, // 元数据过滤
});
```

Chroma 也支持嵌入模型直接传文本（内部自动调用 embedding），简化流程。

**优势**：本地开发零成本、支持内存模式（单测理想选择）、API 简洁。  
**劣势**：生产大规模场景需要自行运维，集群能力弱。

## pgvector

PostgreSQL 的向量扩展，适合已有 Postgres 的项目：

```sql
-- 开启扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建包含向量列的表
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536), -- 维度与 embedding 模型一致
  category VARCHAR(50)
);

-- 创建 HNSW 索引（近似搜索，速度更快）
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
```

```ts
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 插入向量
await pool.query(
  "INSERT INTO documents (content, embedding, category) VALUES ($1, $2, $3)",
  [content, JSON.stringify(embedding), "frontend"]
);

// 向量相似搜索 + SQL 过滤（原生 SQL，灵活性最强）
const { rows } = await pool.query(
  `SELECT content, 1 - (embedding <=> $1) AS similarity
   FROM documents
   WHERE category = $2
   ORDER BY embedding <=> $1
   LIMIT 5`,
  [JSON.stringify(queryEmbedding), "frontend"]
);
```

`<=>` 是 pgvector 的余弦距离运算符，`<#>` 是负内积。

**优势**：无需引入新基础设施，与业务数据在同一库中、事务支持完善、SQL 过滤能力最强。  
**劣势**：向量搜索性能在千万级以上不如专用向量数据库；需要 Postgres 运维知识。

## 选型建议

```
快速原型 / 本地开发  →  Chroma（内存模式）
已有 Postgres 栈     →  pgvector（优先考虑）
生产环境 / 无运维    →  Pinecone（serverless 模式）
数据隐私要求高       →  Chroma（自托管） 或 pgvector
超大规模（亿级）     →  Pinecone 或 Weaviate/Qdrant 等专用方案
```

## 面试常问

- **ANN 和精确最近邻（KNN）的区别？** KNN 遍历全量数据，100% 准确但 O(n) 复杂度；ANN 用 HNSW/IVF 等索引结构牺牲少量精度换取 O(log n) 查询速度，生产中几乎都用 ANN。
- **为什么不直接用 MySQL/Elasticsearch 存向量？** 传统 B-Tree 索引对高维向量无效；ES 虽有 dense_vector 支持，但性能和功能不如专用方案。
- **向量维度对选型有影响吗？** pgvector 的 HNSW 索引在高维（>2000）下内存占用较大，需要权衡。
- **如何做多租户隔离？** Pinecone 用 namespace，Chroma 用 collection，pgvector 用表分区或 tenant_id 字段。
