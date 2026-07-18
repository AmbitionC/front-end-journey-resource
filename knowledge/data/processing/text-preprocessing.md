文本预处理与清洗策略需要把“机制是什么”“边界在哪里”“怎样验证”放在同一条学习路径中。本文以 [Unicode Standard Annex #15: Unicode Normalization Forms](https://unicode.org/reports/tr15/) 对“NFC/NFD/NFKC/NFKD 规范化形式与稳定性”的说明为事实边界，并用 [SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226) 校准“直接从原始句子训练子词模型的原始方法”。文中的代码和工程方案用于解释这些机制；涉及具体版本、默认值或部署行为时，应再回到所链接的一手资料确认。

![文本预处理与清洗策略的核心机制与验证路径](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/text-preprocessing-normalization-tokenization-v1.webp)
*图：文本预处理与清洗策略的核心组件、信息流与验证边界。*

---

在 RAG（Retrieval-Augmented Generation）和 LLM 工程中，文本预处理（Text Preprocessing）常被低估——工程师往往把 80% 的精力花在模型调参上，却忽视"数据入口"的质量。事实上，一份存在编码乱码、HTML 残骸或切分不当的文档，会直接导致 embedding 语义漂移、检索召回率下降，让任何模型优化都事倍功半。本文系统梳理文本预处理的完整链路，并重点讲解 RAG 场景下的分块（Chunking）策略与调参思路。

## 文本预处理在 RAG/LLM 工程中的核心地位

RAG 的检索质量由三个环节决定：**文档处理质量、向量化模型、检索策略**。其中文档处理是最上游的一环，任何噪声都会被放大并传导至下游。

- **向量化质量**：HTML 标签、乱码、冗余空白会占据 token 预算，稀释语义密度，导致 embedding 与真实语义偏离。
- **检索召回率**：chunk 边界切在句子中间，会导致检索时关键信息被拆散在两个 chunk 里，两个都匹配不上。
- **LLM 生成质量**：context window 中混入无关噪声，会干扰模型注意力，产生幻觉（Hallucination）。

对 AI/Agent 工程师来说，预处理不是一次性脚本，而是需要持续迭代的**数据管道（Data Pipeline）**，其参数需要与检索指标联动调优。

---

## 基础清洗（Basic Cleaning）

### 去除 HTML 与特殊字符

Web 数据中 HTML 标签、JS 代码片段是常见噪声。正则适合简单场景，复杂嵌套结构应使用解析器。

```python
import re
from bs4 import BeautifulSoup

# 推荐：BeautifulSoup，正确处理嵌套标签和 HTML 实体
def strip_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

# 去除控制字符（保留换行符 \n）
def remove_control_chars(text: str) -> str:
    return re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]", "", text)

# 合并冗余空白，保留段落结构
def normalize_whitespace(text: str) -> str:
    text = re.sub(r"[^\S\n]+", " ", text)          # 连续空格/tab 合并
    text = "\n".join(l.strip() for l in text.splitlines())
    text = re.sub(r"\n{3,}", "\n\n", text)          # 多空行 → 双换行
    return text.strip()
```

> **陷阱**：`re.sub(r"<.*>", "", text)` 的贪婪匹配会把 `<a>foo</a> bar <b>baz</b>` 整段吃掉。务必用非贪婪写法 `<[^>]+>` 或 `<.*?>`。

### Unicode 标准化与大小写规范化

```python
import unicodedata
import opencc  # 繁简转换

def normalize_unicode(text: str) -> str:
    # NFKC：统一全角/半角字母、分解并重组 Unicode 组合字符
    text = unicodedata.normalize("NFKC", text)
    # 英文小写化（中文不受影响）
    text = text.lower()
    # 繁体 → 简体（处理混合来源文档）
    converter = opencc.OpenCC("t2s")
    return converter.convert(text)
```

`NFKC` 是中文文本预处理的起手式：它能把全角字母 `Ａ` 转为半角 `A`，统一各类空格字符，也能处理同一汉字的多种 Unicode 编码形式（如 CJK 兼容区字符）。

---

## 分词（Tokenization）与中文分词

### 中文分词：jieba

中文没有天然词边界，需要基于词典或统计模型（HMM、CRF）进行切分。

```python
import jieba
import jieba.analyse

# 精确模式（默认，适合语义分析）
words = jieba.lcut("大语言模型正在重构信息检索范式")
# ['大语言模型', '正在', '重构', '信息检索', '范式']

# 添加领域词汇，避免被错误切分
jieba.add_word("向量数据库", freq=100)
jieba.add_word("检索增强生成", freq=100)

# TF-IDF 关键词提取
keywords = jieba.analyse.extract_tags(text, topK=10, withWeight=True)
```

**搜索引擎模式** (`cut_all=True`) 会将长词进一步拆分，适合构建倒排索引，但会破坏语义完整性，不适合直接送 embedding 模型。

### 停用词（Stopwords）、词干提取（Stemming）与词形还原（Lemmatization）

```python
import nltk
from nltk.stem import WordNetLemmatizer, PorterStemmer

lemmatizer = WordNetLemmatizer()
stemmer = PorterStemmer()

# Lemmatization：还原词典形式（running → run，better → good）
tokens = nltk.word_tokenize("The models are running faster")
lemmas = [lemmatizer.lemmatize(t, pos="v") for t in tokens]

# Stemming：粗暴截断词缀（running → run，connection → connect）
stems = [stemmer.stem(t) for t in tokens]

# 停用词过滤（中文示例）
STOPWORDS_ZH = {"的", "了", "是", "在", "和", "与", "也", "都", "这", "那", "一个"}
def remove_stopwords(tokens: list[str]) -> list[str]:
    return [t for t in tokens if t not in STOPWORDS_ZH]
```

| 操作 | 适用场景 | 注意事项 |
|------|---------|---------|
| Stemming | BM25/TF-IDF 全文检索 | 结果不是真实词，不可读 |
| Lemmatization | 语言分析、问答系统 | 需要词性标注，速度较慢 |
| 停用词过滤 | 稀疏检索（BM25） | 情感分析中"不"是关键词，勿滥删 |

> 对于基于 embedding 的**稠密检索（Dense Retrieval）**，lemmatization 和停用词过滤的收益有限——预训练模型已经在语料中学会了词形变化和高频词的处理方式。这些操作主要用于 BM25 等稀疏检索场景。

---

## RAG 文档分块策略（Chunking Strategies）

分块是 RAG 工程中最关键的设计决策之一。chunk 的粒度、边界位置直接决定检索时能否命中正确上下文。

### 固定大小分块（Fixed-size Chunking）

```python
def fixed_chunk(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start += chunk_size - overlap
    return chunks
```

优点：实现简单，chunk 大小完全可控，适合快速原型。缺点：可能在句子甚至单词中间截断，造成语义碎片。

### 递归字符分割（RecursiveCharacterTextSplitter）

LangChain 中最常用的通用分割器，按优先级尝试分隔符列表：`["\n\n", "\n", "。", ".", " ", ""]`，优先从语义边界断开。

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # 单位：字符数（中文）或 token 数（配合 length_function）
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", "！", "？", ".", "!", "?", " ", ""],
    length_function=len,
)

chunks = splitter.split_text(long_text)
# 返回 list[str]，自动保持语义边界
```

### 基于文档结构分块（Markdown / Header Splitter）

对于结构化文档（技术手册、Wiki、API 文档），按标题层级分块能保留文档语义层次，并自动提取元数据。

```python
from langchain.text_splitter import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]

splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
docs = splitter.split_text(markdown_text)
# 每个 doc.metadata 自动包含 {"h1": "...", "h2": "..."}
```

结合二级分割使用效果最佳：先按 Header 切出语义段，再用 `RecursiveCharacterTextSplitter` 对过长段落二次切割。

### 语义分块（Semantic Chunking）

基于 embedding 相似度的动态分块，在语义转折点切割，而非固定字符位置。

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

chunker = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",  # 或 "standard_deviation"
    breakpoint_threshold_amount=95,          # 相似度跌破第 95 百分位时切割
)
docs = chunker.create_documents([long_text])
```

语义分块能产出语义完整的 chunk，但计算成本高（每次分块都要调用 embedding API），适合离线预处理，不适合实时场景。

### 四种策略对比

| 策略 | 语义完整性 | 计算成本 | 适用场景 |
|------|-----------|---------|---------|
| 固定大小 | 低 | 极低 | 快速原型，均匀纯文本 |
| RecursiveCharacterTextSplitter | 中 | 极低 | 通用 RAG，首选方案 |
| Markdown/Header Splitter | 高 | 极低 | 技术文档、结构化 Wiki |
| 语义分块（Semantic Chunking） | 最高 | 高 | 高质量离线索引，预算充足时 |

---

## Chunk 重叠（Overlap）的作用与调参

重叠（overlap）解决的核心问题是：**关键信息落在两个 chunk 边界处时，单独任一 chunk 都无法命中**。

```
│<─────── chunk 1 ──────────>│
                    │<─── chunk 2 ───────────>│
                    │< overlap >│
```

**调参建议：**

- overlap 通常设为 chunk_size 的 **10%–20%**。例如 chunk_size=512 时，overlap=50–100 是合理起点。
- overlap 过小：边界处信息丢失，检索召回率下降。
- overlap 过大：重复内容增多，向量库存储膨胀，检索时相似 chunk 互相竞争排名。
- 对于**问答类**任务，overlap 可适当加大（15%–20%）；对于**摘要类**任务，overlap 可缩小（5%–10%）。
- 最终应通过 **Recall@K** 指标实验来确定最优值，而非凭经验拍板。

---

## RAG 文档处理完整流程

```mermaid
flowchart TD
    A[原始文档\nPDF / HTML / Markdown / TXT] --> B[文件解析\npdfplumber / BeautifulSoup / unstructured]
    B --> C[基础清洗\n去 HTML · 控制字符 · 空白规范化]
    C --> D[Unicode 标准化\nNFKC · 繁简转换 · 小写化]
    D --> E{文档类型判断}
    E -->|结构化 Markdown/HTML| F[Header/结构分割\nMarkdownHeaderTextSplitter]
    E -->|非结构化纯文本| G[递归字符分割\nRecursiveCharacterTextSplitter]
    E -->|高质量语料| H[语义分块\nSemanticChunker]
    F --> I[元数据注入\nsource · page · section · timestamp]
    G --> I
    H --> I
    I --> J[Token 计数验证\ntiktoken · 过滤空/超长 chunk]
    J --> K[向量化\nEmbedding Model]
    K --> L[写入向量数据库\nChroma / Milvus / Weaviate]
    L --> M[检索质量评估\nRecall@K · MRR · NDCG]
    M -->|指标不达标| D
```

---

## 元数据保留策略（Metadata Preservation）

元数据是 RAG 系统实现**精准过滤和来源溯源**的基础。每个 chunk 在入库时应携带足够的上下文信息。

```python
from langchain.schema import Document

def build_document_with_metadata(
    chunk: str,
    source_file: str,
    page: int,
    section: str,
    chunk_index: int,
) -> Document:
    return Document(
        page_content=chunk,
        metadata={
            "source": source_file,        # 文件路径或 URL
            "page": page,                 # 页码（PDF 场景）
            "section": section,           # 所属章节标题
            "chunk_index": chunk_index,   # chunk 在文档中的序号
            "char_count": len(chunk),     # 字符数（便于调试）
            "indexed_at": "2026-06-19",   # 入库时间戳
        }
    )
```

**元数据的实际用途：**

- **过滤检索**：`filter={"source": "product_manual_v2.pdf"}` 限制检索范围，避免跨文档噪声。
- **来源引用**：LLM 回答时可附带 `source + page`，提升可信度。
- **增量更新**：通过 `indexed_at` 判断文档是否需要重新向量化。
- **调试诊断**：`chunk_index` 帮助快速定位检索失败的 chunk 在原文中的位置。

---

## 评估分块质量（Chunk Quality Evaluation）

分块策略的好坏不能靠主观判断，需要通过检索指标量化。

```python
# 构造评估数据集：问题 → 标准答案所在 chunk
eval_dataset = [
    {"query": "RAG 的核心优势是什么？", "relevant_chunk_id": "doc_001_chunk_3"},
    {"query": "如何配置向量数据库？",   "relevant_chunk_id": "doc_002_chunk_7"},
]

def recall_at_k(retriever, dataset: list[dict], k: int = 5) -> float:
    hits = 0
    for item in dataset:
        results = retriever.get_relevant_documents(item["query"])[:k]
        retrieved_ids = [r.metadata.get("chunk_id") for r in results]
        if item["relevant_chunk_id"] in retrieved_ids:
            hits += 1
    return hits / len(dataset)

# 典型评估流程
print(f"Recall@5: {recall_at_k(retriever, eval_dataset, k=5):.3f}")
```

**关键指标说明：**

| 指标 | 含义 | 典型目标 |
|------|------|---------|
| Recall@K | 前 K 个结果中包含相关 chunk 的比例 | ≥ 0.80 |
| MRR（Mean Reciprocal Rank） | 相关结果排名的倒数均值，衡量排序质量 | ≥ 0.70 |
| NDCG@K | 考虑位置权重的排序质量指标 | ≥ 0.75 |

工程上常用 [RAGAS](https://github.com/explodinggradients/ragas) 框架自动生成评估集并计算上述指标，可直接集成到 CI/CD 流程中。

---

## 常见误区

**误区一：chunk_size 越大，上下文越完整**
chunk 过大会引入噪声，稀释 embedding 的语义焦点，导致相似度计算不准。实测中 256–512 token 的 chunk 在大多数问答场景下检索效果优于 1024 token 的 chunk。

**误区二：停用词过滤对所有任务都有益**
停用词过滤对 BM25 等稀疏检索有效，但对 embedding 检索几乎无影响。更危险的是：情感分析中的"不"、"没"是高信息量词，删掉会直接反转语义。

**误区三：分块策略一次设定永久有效**
文档类型变化（新增 PDF、API 文档）、embedding 模型升级、业务问题分布变化，都需要重新评估分块参数。把 Recall@K 纳入定期监控。

**误区四：元数据可有可无**
没有元数据的 RAG 系统无法做权限过滤、来源引用和增量更新，上线后维护成本极高。元数据设计应在文档入库前就规划好 schema。

**误区五：用字符数代替 token 数控制 chunk 大小**
中文一个字约 1–2 个 token，英文一个词约 1–1.5 个 token，但 BPE 分词的实际结果差异较大。应用 `tiktoken` 或模型对应的 tokenizer 来精确控制 chunk 的 token 数，避免超出 embedding 模型的最大输入长度（通常 512 或 8192 token）。

---

## 最佳实践

1. **清洗管道模块化**：将 HTML 清洗、Unicode 标准化、空白处理设计为独立函数并单元测试，方便针对不同数据源组合使用。

2. **首选 RecursiveCharacterTextSplitter**：作为通用起点，它在语义完整性和计算成本之间取得最佳平衡；结构化文档再叠加 MarkdownHeaderTextSplitter。

3. **overlap 设为 chunk_size 的 10%–15%**：用 Recall@5 指标验证，不要凭感觉调参。

4. **元数据 schema 提前设计**：至少包含 `source`、`page`/`section`、`chunk_index`、`indexed_at`，为后续过滤检索和增量更新打好基础。

5. **用 tiktoken 验证 token 边界**：在向量化之前过滤掉 token 数 < 10 的碎片 chunk 和超出模型最大输入长度的异常 chunk。

6. **建立评估集并持续监控**：用 RAGAS 或自建评估脚本定期跑 Recall@K，将分块质量纳入数据管道的 CI 检查。

7. **保留原始文本副本**：清洗和分块不应修改原始文档，应在副本上操作，便于回溯问题和重新处理。

---

## 面试常问

**Q：RAG 中如何选择 chunk_size？**
没有银弹。经验起点是 256–512 token（embedding 检索），rerank 阶段可扩展到 1024 token。关键是用 Recall@K 和 MRR 指标实验驱动，而非凭感觉。chunk 过小丢失上下文，过大稀释语义焦点，最优值与文档类型和业务问题分布强相关。

**Q：RecursiveCharacterTextSplitter 和 MarkdownHeaderTextSplitter 分别用在什么场景？**
前者是通用兜底方案，按分隔符优先级递归切割，适合任意纯文本；后者专为结构化 Markdown 设计，能提取标题层级作为元数据，适合技术文档、Wiki 等有明确结构的内容。两者可以组合：先用 Header Splitter 按章节切割，再用 Recursive Splitter 对过长章节二次切割。

**Q：为什么 overlap 对 RAG 很重要？**
检索是基于向量相似度匹配的，如果关键信息横跨两个 chunk 的边界，两个 chunk 都只包含半段信息，都无法被精确召回。overlap 确保边界处的内容在相邻 chunk 中都有完整表达，提升边界区域的召回率。

**Q：如何评估分块策略的好坏？**
构造"查询 → 标准相关 chunk"的评估集（可手工标注或用 LLM 自动生成），计算 Recall@K（K=5 是常用值）。如果条件允许，同时计算 MRR 评估排序质量。RAGAS 框架提供了端到端的 RAG 评估工具链，包括 faithfulness、answer relevancy、context recall 等多维指标。

**Q：中文文本预处理与英文有哪些核心差异？**
中文无词边界，需要分词（jieba 等）；英文重词形变化，需要 stemming/lemmatization。中文 BPE tokenization 通常以字为基本单位，英文以 subword 为单位。中文文档还需处理繁简混用（NFKC + opencc）、全半角混用等问题。此外，中文停用词表（哈工大、中科院版本）与英文 NLTK stopwords 逻辑类似但需单独维护。

## 参考资料

- [Unicode Standard Annex #15: Unicode Normalization Forms](https://unicode.org/reports/tr15/)
- [SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)
