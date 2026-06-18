# PostgreSQL 特性与 JSON 支持

PostgreSQL 是功能最完整的开源关系型数据库之一，除标准 SQL 之外还内置了文档存储、全文检索、异步消息等能力，这让它在许多场景下能同时替代专用 NoSQL 工具。

## JSONB：半结构化数据的核心武器

PostgreSQL 提供两种 JSON 类型：`json` 和 `jsonb`。

- `json`：存储原始文本，写入快，每次查询都重新解析。
- `jsonb`：存储二进制分解后的结构，写入略慢，但查询、索引性能更好，且会去除重复键、不保留原始空白。

**绝大多数场景选 `jsonb`。**

### 基础操作符

| 操作符 | 含义 | 示例 |
|--------|------|------|
| `->` | 按键/索引取值，返回 `jsonb` | `data->'name'` |
| `->>` | 按键/索引取值，返回 `text` | `data->>'name'` |
| `#>` | 按路径数组取值，返回 `jsonb` | `data#>'{address,city}'` |
| `#>>` | 按路径数组取值，返回 `text` | `data#>>'{address,city}'` |
| `@>` | 左侧是否包含右侧（containment） | `data @> '{"role":"admin"}'` |
| `?` | 键是否存在 | `data ? 'email'` |
| `?|` | 任意键是否存在 | `data ?| ARRAY['email','phone']` |
| `?&` | 全部键是否存在 | `data ?& ARRAY['name','age']` |

```sql
CREATE TABLE users (
    id   SERIAL PRIMARY KEY,
    info JSONB NOT NULL
);

INSERT INTO users (info) VALUES
('{"name":"Alice","age":30,"tags":["admin","dev"],"address":{"city":"Beijing","zip":"100000"}}'),
('{"name":"Bob","age":25,"tags":["viewer"],"address":{"city":"Shanghai","zip":"200000"}}');

-- 取顶层字段（返回 jsonb）
SELECT info->'name' FROM users;

-- 取顶层字段（返回 text，可直接比较）
SELECT info->>'name' FROM users WHERE info->>'name' = 'Alice';

-- 嵌套路径访问
SELECT info#>>'{address,city}' AS city FROM users;

-- 包含查询：找出有 admin 标签的用户
SELECT * FROM users WHERE info->'tags' @> '["admin"]';

-- 键存在检测
SELECT * FROM users WHERE info ? 'address';
```

### GIN 索引：让 JSONB 查询起飞

对 `jsonb` 列做全列 GIN 索引后，`@>`、`?`、`?|`、`?&` 操作符都能走索引，避免全表扫描。

```sql
-- 全列 GIN 索引（最通用）
CREATE INDEX idx_users_info ON users USING GIN (info);

-- jsonb_path_ops 操作符类：索引更小，只支持 @> 操作符
CREATE INDEX idx_users_info_path ON users USING GIN (info jsonb_path_ops);
```

如果只需要对某个固定字段做等值或范围查询，可以用表达式索引：

```sql
-- 对 info->>'age' 做 B-tree 索引
CREATE INDEX idx_users_age ON users ((info->>'age'));

SELECT * FROM users WHERE (info->>'age')::int > 25;
```

### 常见误区

- **误用 `json` 类型**：`json` 不能建 GIN 索引，查询不走索引。
- **`->` 和 `->>` 混用**：`->` 返回 `jsonb`，比较时需要写 `info->'age' = '30'::jsonb`；用 `->>`返回 `text` 再转型更直观。
- **忽略 containment 的嵌套语义**：`@>` 对数组的包含检测是"子集"语义，`'["admin","dev"]' @> '["admin"]'` 为真。

---

## 全文搜索（Full-Text Search）

PostgreSQL 内置全文搜索，通过 `tsvector`（文档向量）和 `tsquery`（查询表达式）实现。

```sql
-- 创建带 tsvector 列的表
ALTER TABLE articles ADD COLUMN tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;

CREATE INDEX idx_articles_tsv ON articles USING GIN (tsv);

-- 查询
SELECT title FROM articles
WHERE tsv @@ to_tsquery('english', 'postgresql & index');

-- 高亮匹配片段
SELECT ts_headline('english', body, to_tsquery('index')) FROM articles LIMIT 5;
```

中文全文搜索需要安装 `pg_jieba` 或 `zhparser` 扩展，并指定对应的文本搜索配置。

---

## 表继承（Table Inheritance）

PostgreSQL 支持面向对象式的表继承，子表自动继承父表的列。

```sql
CREATE TABLE vehicles (
    id    SERIAL PRIMARY KEY,
    brand TEXT,
    year  INT
);

CREATE TABLE cars (
    doors INT
) INHERITS (vehicles);

-- 查询父表时自动包含子表数据
SELECT * FROM vehicles;         -- 返回 vehicles + cars 的所有行
SELECT * FROM ONLY vehicles;    -- 只查父表本身
```

表继承常用于分区的早期替代方案，但现代 PostgreSQL（v10+）的声明式分区（`PARTITION BY`）更完善，新项目优先选后者。

---

## WITH RECURSIVE：递归查询

CTE（公用表表达式）加上 `RECURSIVE` 关键字可以处理树形、图形结构，典型场景是组织架构、分类树。

```sql
CREATE TABLE categories (
    id        INT PRIMARY KEY,
    name      TEXT,
    parent_id INT REFERENCES categories(id)
);

-- 找出 id=1 节点下的所有子孙节点
WITH RECURSIVE subtree AS (
    -- 锚点：起始节点
    SELECT id, name, parent_id, 0 AS depth
    FROM categories
    WHERE id = 1

    UNION ALL

    -- 递归部分：逐层向下
    SELECT c.id, c.name, c.parent_id, s.depth + 1
    FROM categories c
    JOIN subtree s ON c.parent_id = s.id
)
SELECT * FROM subtree ORDER BY depth, id;
```

注意防止循环引用导致无限递归，可加 `WHERE depth < 10` 或用 `CYCLE` 子句（PostgreSQL 14+）。

---

## LISTEN / NOTIFY：轻量级异步消息

`LISTEN`/`NOTIFY` 是 PostgreSQL 内置的发布-订阅机制，无需额外消息队列即可实现进程间通知。

```sql
-- 在连接 A 订阅频道
LISTEN order_updates;

-- 在连接 B 发送通知（可附带 payload，最长 8000 字节）
NOTIFY order_updates, '{"order_id":42,"status":"shipped"}';
```

客户端（如 Node.js 的 `pg` 库）通过 `client.on('notification', handler)` 接收消息，常用于：

- 实时通知前端数据变更（配合 WebSocket）
- 触发器触发后通知应用层做缓存失效
- 轻量级任务队列（不要求高吞吐时）

---

## 扩展生态

PostgreSQL 的扩展机制（`CREATE EXTENSION`）是其区别于其他数据库的重要优势。

| 扩展 | 用途 |
|------|------|
| `pgvector` | 向量存储与相似度搜索，用于 AI/RAG 场景 |
| `PostGIS` | 地理空间数据类型与函数 |
| `pg_trgm` | 三元字符组相似度，支持模糊搜索和 LIKE 索引优化 |
| `uuid-ossp` / `gen_random_uuid()` | UUID 生成（v14+ 内置函数） |
| `hstore` | 键值对类型（jsonb 出现前的替代方案） |
| `pg_stat_statements` | SQL 执行统计，性能分析必备 |

```sql
-- 安装 pgvector 后使用向量检索
CREATE EXTENSION vector;

CREATE TABLE embeddings (
    id      SERIAL PRIMARY KEY,
    content TEXT,
    vec     vector(1536)
);

CREATE INDEX ON embeddings USING ivfflat (vec vector_cosine_ops);

-- 找最相似的 5 条记录
SELECT content, 1 - (vec <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM embeddings
ORDER BY vec <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

---

## 面试常问要点

**Q：`json` 和 `jsonb` 有什么区别？什么时候用哪个？**
A：`jsonb` 以二进制格式存储，支持 GIN 索引，查询性能更好；`json` 保留原始文本格式。几乎所有情况都应选 `jsonb`，只有需要精确保留 JSON 原始格式（如空白、重复键顺序）时才用 `json`。

**Q：JSONB 如何优化查询性能？**
A：对整列创建 GIN 索引支持 `@>`、`?` 等操作符；对高频访问的固定字段创建表达式 B-tree 索引支持等值/范围查询；对路径固定的查询可用 `jsonb_path_ops` 减小索引体积。

**Q：PostgreSQL 全文搜索和 Elasticsearch 比有什么差距？**
A：PostgreSQL 全文搜索适合中小规模、与业务数据同库的场景，减少同步开销；Elasticsearch 在分布式水平扩展、复杂相关性排序、实时索引吞吐方面更强。两者并不互斥，可以配合使用。

**Q：`WITH RECURSIVE` 查询有什么风险？**
A：若数据存在循环引用（如图结构），递归会无限循环直到超出资源限制。需要在递归部分加深度限制或使用 PostgreSQL 14 引入的 `CYCLE` 子句检测循环。
