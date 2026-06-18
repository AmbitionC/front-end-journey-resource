# 文本分块策略（Chunking）

在 RAG（Retrieval-Augmented Generation）系统中，如何切分文档直接决定了检索质量——块太小丢失上下文，块太大引入噪声，没有银弹，只有权衡。

---

## 为什么 Chunking 很重要

LLM 的 context window 有限，不可能把整本文档塞进 prompt。RAG 的思路是：先把文档切成小块并向量化存储，查询时只取最相关的几块。因此 chunking 是 RAG 精度的上游——检索的基本单元由它决定。

两个核心矛盾：

- **粒度 vs 语义完整性**：块越小越精准定位，但单块信息可能不完整；块越大语义越完整，但检索时会引入无关内容。
- **均匀 vs 结构感知**：固定大小切分简单均匀，但会在句子中间断开；结构感知切分更自然，但实现复杂。

---

## 主要分块策略

### 1. 固定大小切分（Fixed-size Chunking）

按字符数或 token 数硬切，是最简单的方案。

**优点**：实现简单，批处理效率高。  
**缺点**：完全不考虑语义边界，可能在句子或段落中间断开。

```python
def fixed_size_split(text: str, chunk_size: int = 500) -> list[str]:
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
```

### 2. 句子级切分（Sentence-based Chunking）

以句号、换行等自然边界分割，每个 chunk 是完整的句子集合。

**适合**：新闻、FAQ、短段落文档。  
**注意**：中文断句依赖 `。！？` 等标点，英文依赖 `.!?`，混合文档需要额外处理。

### 3. 段落级切分（Paragraph-based Chunking）

以空行或标题分割段落，每个 chunk 是一个自然段或小节。

**适合**：技术文档、博客文章、有明显段落结构的内容。  
**问题**：段落长度差异可能很大，导致 chunk 大小不均。

### 4. 递归字符切分（Recursive Character Splitting）

这是目前最常用的策略，LangChain 的 `RecursiveCharacterTextSplitter` 是典型实现。核心思路是**按优先级依次尝试分隔符**：先尝试 `\n\n`（段落），再尝试 `\n`（换行），再尝试 `. `（句子），最后才按字符数硬切。

```python
# 以下为结构示意，具体参数和行为以官方文档为准
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每块最大 token/字符数
    chunk_overlap=50,     # 相邻块的重叠量
    separators=["\n\n", "\n", "。", ".", " ", ""],
)

chunks = splitter.split_text(document_text)
```

递归切分兼顾了结构感知和大小可控，是通用场景的首选。

### 5. 语义切分（Semantic Chunking）

将相邻句子嵌入为向量，计算余弦相似度，在语义转折处切分。这种方式最接近"人类理解的段落边界"，但计算开销显著更高（需要对每个句子做 embedding），适合对检索质量要求极高且文档量不大的场景。

---

## Chunk Overlap（重叠）

相邻两个 chunk 共享一段文本，目的是避免关键信息恰好落在切分点处被割断。

```
Chunk 1: [-------- A ---------][-- overlap --]
Chunk 2:               [-- overlap --][-------- B ---------]
```

**经验值**：overlap 通常设为 chunk_size 的 10%–20%。过大会导致冗余内容重复检索，降低多样性；过小起不到连接作用。

---

## Chunk 大小对检索质量的影响

| Chunk 大小 | 优势 | 劣势 |
|---|---|---|
| 过小（< 100 tokens） | 定位精准，噪声少 | 语义不完整，单块无法回答问题 |
| 适中（200–600 tokens） | 平衡精度与完整性 | 需根据内容类型调参 |
| 过大（> 1000 tokens） | 语义完整 | 检索时引入大量无关内容，影响 LLM 精度 |

---

## 不同内容类型的实践建议

**代码**：以函数或类为单位切分，不要在函数中间断开。可以用 AST 解析而不是字符串匹配。chunk_size 可以适当放大到 1000+ tokens，因为代码的信息密度高。

**散文/技术文档**：推荐递归字符切分，chunk_size 设 300–500 tokens，overlap 50–100 tokens。

**表格/结构化数据**：不适合直接向量化，考虑先转为自然语言描述再切分，或者存入结构化数据库用 SQL 检索。

**FAQ 类文档**：每个 Q&A 对作为一个 chunk，保持问题和答案的完整性。

---

## 面试常问

**Q：chunk_size 和 chunk_overlap 怎么调？**  
A：没有通用答案，需要根据下游任务评估。实践上先设 500/50 跑 baseline，再通过检索命中率（Hit Rate）和答案相关性指标迭代。

**Q：语义切分一定比固定切分好吗？**  
A：不一定。语义切分在结构清晰的文档上效果更好，但计算成本高；对于结构规整的文档（如 API 文档），递归字符切分已经足够好，且速度快得多。

**Q：为什么 RAG 检索结果相关但答案还是错？**  
A：检索正确只是 RAG 的第一步。常见的后续问题包括：prompt 注入方式不当导致 LLM 忽略检索内容、chunk 中关键信息被截断、以及 LLM 本身的幻觉。chunking 策略只解决检索层的问题。
