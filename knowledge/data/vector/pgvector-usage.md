pgvector 是 PostgreSQL 的开源向量扩展，让关系型数据库原生支持高维向量的存储与相似度检索，是构建 RAG（检索增强生成）系统时最低成本的向量存储方案之一。

## 安装与启用

### 安装扩展

在系统层面安装（以 Ubuntu 为例）：

```bash
# 通过包管理器安装
sudo apt install postgresql-15-pgvector

# 或从源码编译
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && sudo make install
```

在数据库中启用：

```sql
-- 在目标数据库中执行一次即可
CREATE EXTENSION IF NOT EXISTS vector;
```

### 创建含向量列的表

```sql
CREATE TABLE documents (
    id        BIGSERIAL PRIMARY KEY,
    content   TEXT NOT NULL,
    embedding vector(1536)   -- 维度与你的 embedding 模型一致
);
```

`vector(n)` 中的 `n` 最大支持 16000 维。维度在列定义时固定，插入时不匹配会报错。

## 距离运算符

pgvector 提供三种距离运算符，对应三种相似度度量：

| 运算符 | 距离类型 | 含义 |
|--------|----------|------|
| `<->` | L2（欧氏距离） | 向量空间中的直线距离 |
| `<#>` | 负内积 | 结果越小内积越大（需归一化后用于余弦） |
| `<=>` | 余弦距离 | `1 - cosine_similarity`，结果越小越相似 |

**选型建议**：文本 embedding 通常已归一化，此时 `<=>` 与 `<#>` 结果等价；`<->` 适合坐标型向量。绝大多数 RAG 场景用余弦距离即可。

## 相似度检索 SQL

### 基本查询

```sql
-- 找最相似的 5 条文档（余弦距离）
SELECT id, content, embedding <=> '[0.12, 0.34, ...]'::vector AS distance
FROM documents
ORDER BY distance
LIMIT 5;
```

### 带元数据过滤的检索（混合查询）

```sql
-- 先过滤类别，再做向量检索
SELECT id, content, embedding <=> $1 AS distance
FROM documents
WHERE category = 'tech'
ORDER BY distance
LIMIT 10;
```

注意：当过滤条件命中的行数占比很少时，索引可能被跳过，走全表扫描反而更快——这是正常行为。

## 索引

### IVFFlat 索引

IVFFlat（Inverted File with Flat compression）将向量空间划分成多个簇，查询时只搜索最近的若干簇。

```sql
-- 创建 IVFFlat 索引（余弦距离）
-- lists = 聚类数，建议 = sqrt(行数)
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 查询时调大 probes 提升召回率（默认 1）
SET ivfflat.probes = 10;
```

**关键参数**：
- `lists`：聚类数，影响索引构建时间和检索精度/速度权衡
- `probes`：查询时扫描的簇数，越大召回越高，延迟越大

IVFFlat 要求**在数据充足后**再建索引（官方建议表中行数 > lists × 40）。

### HNSW 索引

HNSW（Hierarchical Navigable Small World）构建多层图结构，查询速度更快，召回率更高，但内存占用更大、构建更慢。

```sql
-- 创建 HNSW 索引（余弦距离）
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 查询时调整 ef_search（默认 40）
SET hnsw.ef_search = 100;
```

**关键参数**：
- `m`：每个节点的最大连接数，越大质量越高，内存越大（建议 8–64）
- `ef_construction`：构建时候选列表大小，越大质量越高，构建越慢
- `hnsw.ef_search`：查询时候选列表大小，越大召回越高

**IVFFlat vs HNSW 对比**：

| 维度 | IVFFlat | HNSW |
|------|---------|------|
| 构建速度 | 快 | 慢 |
| 查询速度 | 中 | 快 |
| 内存占用 | 小 | 大 |
| 召回率 | 中（依赖 probes） | 高 |
| 增量插入 | 需重建 | 支持 |

数据量较小或资源受限时用 IVFFlat，追求低延迟高召回时用 HNSW。

## Python 集成示例

典型 RAG 场景：存储文档 embedding、检索相似片段喂给大模型。

```python
import psycopg2
import numpy as np

# 假设已有 embedding_model.encode() 返回 numpy array
def upsert_document(conn, doc_id: int, content: str, embedding: np.ndarray):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO documents (id, content, embedding)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE
              SET content = EXCLUDED.content,
                  embedding = EXCLUDED.embedding
            """,
            (doc_id, content, embedding.tolist())
        )
    conn.commit()

def search_similar(conn, query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, content, embedding <=> %s AS distance
            FROM documents
            ORDER BY distance
            LIMIT %s
            """,
            (query_embedding.tolist(), top_k)
        )
        rows = cur.fetchall()
    return [{"id": r[0], "content": r[1], "distance": r[2]} for r in rows]
```

也可使用 `psycopg2` 的 `register_vector`（pgvector 提供的适配器）直接传递 numpy 数组，无需手动 `.tolist()`。

## pgvector vs 专用向量数据库

| 维度 | pgvector | Pinecone / Weaviate / Qdrant |
|------|----------|------------------------------|
| 运维复杂度 | 低（复用已有 PG） | 需引入新组件 |
| 事务/关系查询 | 原生支持 JOIN、ACID | 不支持 |
| 超大规模（亿级向量） | 有压力 | 设计目标 |
| 索引类型 | IVFFlat、HNSW | 多种，通常更丰富 |
| 过滤后向量搜索 | 效率一般 | 专门优化 |
| 成本 | 低（共享 PG 实例） | 按量计费，可能较贵 |

**实践建议**：向量数量在百万量级以内、团队已有 PostgreSQL 基础设施时，pgvector 是最务实的选择；超过千万行或对延迟极其敏感时，再评估迁移到专用向量数据库的成本收益。

## 常见误区与最佳实践

**误区一：先插数据再建索引**
IVFFlat 索引的 `lists` 参数在建索引时固定，数据量变化后需重建。正确做法是数据批量导入后一次性建索引。

**误区二：维度设置过高**
向量维度越高，索引效果越差（维度诅咒），且存储和计算成本线性增长。使用 embedding 模型的推荐维度，不要随意升维。

**误区三：忽视 `probes`/`ef_search` 调优**
默认值偏保守，生产环境应根据召回率要求测试合适的值，并通过 `SET` 命令或连接参数设置。

**误区四：混合过滤导致索引失效**
带 `WHERE` 的向量查询在过滤选择性高时可能回退到顺序扫描。可通过 `EXPLAIN ANALYZE` 验证是否走了索引。

## 面试常问

- **pgvector 支持哪些距离类型？**：L2、内积、余弦，分别对应 `<->`、`<#>`、`<=>`。
- **IVFFlat 和 HNSW 如何选择？**：IVFFlat 构建快内存小，HNSW 召回高查询快但内存大。
- **为什么向量查询有时不走索引？**：`WHERE` 过滤后结果集太小，规划器认为顺序扫描更快；或者表数据量不足时规划器会跳过索引。
- **如何在 RAG 中权衡 pgvector 和专用向量库？**：核心是规模（向量数）、是否需要关系查询、团队的运维能力，不是非此即彼。
