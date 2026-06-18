# 文本预处理与清洗策略

原始文本就像未经冶炼的矿石——HTML 残骸、乱码、冗余空白混杂其中，直接喂给模型或搜索引擎只会放大噪音。扎实的预处理是所有 NLP 任务和 RAG 系统质量的地基。

## 为什么文本预处理重要

"垃圾进，垃圾出"（Garbage In, Garbage Out）在文本处理中体现得格外直接：

- **向量化质量**：噪声 token 会拉低 embedding 的语义密度，导致检索召回不准。
- **分词准确性**：残留 HTML 标签会被分词器切成无意义碎片，污染词频统计。
- **模型 context 窗口**：未清洗的文本包含大量无效字符，白白消耗宝贵的 token 预算。

---

## 基础清洗

### 去除 HTML 标签

正则足以应付简单场景，复杂 HTML 应使用解析器。

```python
import re
from bs4 import BeautifulSoup

# 方式一：正则（快，但对嵌套/属性容错差）
def strip_html_regex(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)

# 方式二：BeautifulSoup（推荐）
def strip_html_bs4(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ", strip=True)
```

**陷阱**：`re.sub(r"<.*>", "", text)` 使用贪婪匹配，会把 `<a>foo</a> bar <b>baz</b>` 整体吃掉，务必用非贪婪 `<[^>]+>` 或 `<.*?>`。

### 去除特殊字符与多余空白

```python
def clean_text(text: str) -> str:
    # 去除控制字符（保留换行）
    text = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]", "", text)
    # 合并连续空白（空格/tab），保留段落换行
    text = re.sub(r"[^\S\n]+", " ", text)
    # 去除行首行尾空格
    text = "\n".join(line.strip() for line in text.splitlines())
    # 合并多个空行为一个
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
```

---

## 分词策略

### 中文分词：jieba

中文没有天然空格分隔，分词是关键前置步骤。

```python
import jieba
import jieba.analyse

# 精确模式（默认，适合文本分析）
words = jieba.lcut("自然语言处理是人工智能的核心方向")
# ['自然语言处理', '是', '人工智能', '的', '核心', '方向']

# 添加领域词汇，避免被错误切分
jieba.add_word("大语言模型", freq=100)

# 关键词提取（TF-IDF）
keywords = jieba.analyse.extract_tags(text, topK=10)
```

**搜索引擎模式**（`jieba.lcut(text, cut_all=False)` 的切法）会将长词进一步切分，适合全文检索但不适合语义分析。

### 英文 Tokenization

英文通常用空格拆分后配合词形还原：

```python
import nltk
from nltk.stem import WordNetLemmatizer

nltk.download("punkt", quiet=True)
nltk.download("wordnet", quiet=True)

lemmatizer = WordNetLemmatizer()

def tokenize_en(text: str) -> list[str]:
    tokens = nltk.word_tokenize(text.lower())
    return [lemmatizer.lemmatize(t) for t in tokens if t.isalpha()]
```

对 LLM 任务一般无需手动分词，直接传原文；分词主要用于传统 IR（TF-IDF、BM25）场景。

---

## 停用词过滤

停用词对语义检索意义不大，但**不要在所有任务中都删除**——情感分析中"不"是关键词，删掉会反转语义。

```python
STOPWORDS_ZH = {"的", "了", "是", "在", "和", "与", "也", "都", "这", "那"}

def remove_stopwords(tokens: list[str], stopwords: set) -> list[str]:
    return [t for t in tokens if t not in stopwords]
```

中文停用词表可使用哈工大或中科院版本，词表质量直接影响效果。

---

## 文本规范化

```python
import unicodedata
import opencc  # 繁简转换

def normalize_text(text: str) -> str:
    # 1. Unicode 规范化（统一全角/半角）
    text = unicodedata.normalize("NFKC", text)

    # 2. 小写化（英文）
    text = text.lower()

    # 3. 数字处理：可替换为占位符，也可保留（视任务而定）
    # text = re.sub(r"\d+", "<NUM>", text)

    # 4. 繁体转简体
    converter = opencc.OpenCC("t2s")  # Traditional to Simplified
    text = converter.convert(text)

    return text
```

**`unicodedata.normalize("NFKC", text)`** 是处理中文文本的常用起手式：它能把全角字母 `Ａ` 转为半角 `A`，把各种空格统一，也能处理不同编码形式的同一汉字。

---

## 针对 LLM 的文本切分策略

RAG 系统中，chunk 策略直接影响检索粒度和上下文完整性。

### 固定长度切分

```python
def fixed_chunk(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    """按字符数切分，overlap 保持上下文连续性"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks
```

- 优点：实现简单，chunk 大小可控
- 缺点：可能在句子中间截断，语义不完整

### 语义感知切分

```python
import re

def semantic_chunk(text: str, max_chunk: int = 600) -> list[str]:
    """按段落/句子边界切分"""
    # 先按段落分割
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) <= max_chunk:
            current = current + "\n\n" + para if current else para
        else:
            if current:
                chunks.append(current)
            # 单段落超长：按句子再切
            if len(para) > max_chunk:
                sentences = re.split(r"(?<=[。！？.!?])", para)
                for sent in sentences:
                    if len(current) + len(sent) <= max_chunk:
                        current = current + sent if current else sent
                    else:
                        if current:
                            chunks.append(current)
                        current = sent
            else:
                current = para
    if current:
        chunks.append(current)
    return chunks
```

| 策略 | 适用场景 | 问题 |
|------|---------|------|
| 固定字符长度 | 快速原型、均匀文档 | 语义截断 |
| 段落/句子边界 | 结构化文章、FAQ | chunk 大小不均 |
| 滑动窗口（带 overlap） | 长文档、信息密集型 | 存储量增加 |
| 递归分割（LangChain RecursiveCharacterTextSplitter） | 通用 RAG | 需调参 |

---

## 常见陷阱

**1. 编码问题**

```python
# 错误：直接读取不指定编码
with open("data.txt") as f:
    text = f.read()  # 在 Windows 上可能按 GBK 读取

# 正确：明确指定 UTF-8，并处理异常字符
with open("data.txt", encoding="utf-8", errors="replace") as f:
    text = f.read()

# 检测未知编码
import chardet
raw = open("data.txt", "rb").read()
detected = chardet.detect(raw)
text = raw.decode(detected["encoding"])
```

**2. 空文档与极短文本**

清洗后 token 数可能归零（原文全是 HTML 或特殊字符）。下游任务应检测并跳过空文档，否则会产生全零向量，污染相似度计算。

```python
def is_valid_text(text: str, min_chars: int = 10) -> bool:
    return len(text.strip()) >= min_chars
```

**3. 超长文本**

直接传入 LLM 会超出 context window 导致截断或报错。解决方案：

- 分段处理后合并摘要（Map-Reduce）
- 先用检索定位相关段落再送模型
- 使用 `tiktoken` 预先计算 token 数再决定是否切分

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))
```

---

## 面试要点

**Q：中文分词和英文 tokenization 的核心区别？**
中文缺乏词边界标记，需要基于词典或统计模型（HMM、CRF）进行切分；英文以空格为天然分隔符，难点在于词形还原（lemmatization）和复合词处理。

**Q：RAG 中 chunk 大小如何选择？**
没有银弹。chunk 过小丢失上下文，过大引入噪声稀释语义。经验值：embedding 检索用 256–512 token，rerank 阶段可扩展到 1024。应通过 retrieval 指标（MRR、Recall@K）来调参，而非凭感觉。

**Q：停用词过滤对向量检索有必要吗？**
对基于 embedding 的稠密检索意义有限——模型已在预训练中学会忽视高频词的语义贡献。对 BM25 等稀疏检索影响更大，过滤停用词能降低 IDF 计算噪声。

**Q：如何处理 PDF 中的乱码和多栏布局？**
PDF 文字提取本身是难题：`pdfplumber` 比 `PyPDF2` 对多栏布局的处理更好；乱码通常源于字体子集未嵌入，此时需要 OCR（`pytesseract` + `pdf2image`）回退。提取后仍需走完整清洗管道。
