Embedding 模型将文本转换为稠密向量，是语义搜索、RAG、推荐系统等场景的基础设施。选对模型直接决定检索质量和系统成本，选错了换起来代价极高——所有已入库的向量都要重新生成。

## 什么是 Embedding

模型读入一段文本，输出一个固定维度的浮点数数组（向量）。语义相近的文本，其向量在高维空间中距离更近。这个"距离近"需要通过相似度度量来量化。

```python
# 概念示意：两段文本经过 embedding 后计算相似度
import numpy as np

def cosine_similarity(vec_a, vec_b):
    dot = np.dot(vec_a, vec_b)
    norm = np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
    return dot / norm if norm > 0 else 0.0

# vec_a, vec_b 是 embedding 模型输出的向量
score = cosine_similarity(vec_a, vec_b)  # 范围 [-1, 1]，越接近 1 越相似
```

---

## 相似度度量：三种方式的区别

| 度量方式 | 公式核心 | 适用场景 | 注意事项 |
|----------|----------|----------|----------|
| Cosine 相似度 | 向量夹角余弦值 | 最通用，忽略向量长度 | 需要归一化或直接用公式 |
| Dot Product（内积） | 两向量各维度乘积之和 | 向量已归一化时等价于 cosine | 未归一化时受向量模影响 |
| Euclidean 距离 | 各维度差的平方和开根 | 低维空间，某些聚类场景 | 高维空间容易陷入"维度诅咒" |

实践中 **cosine 相似度最常见**，大多数向量数据库默认支持。当向量经过 L2 归一化后，cosine 相似度与 dot product 等价，此时可以用向量数据库的 HNSW + inner product 索引来加速。

---

## 向量维度的影响

向量维度决定表达能力与存储/计算成本之间的权衡。

- **低维（128–384）**：存储省、检索快，适合资源受限场景，语义粒度较粗。
- **中维（768–1024）**：主流 BERT 类模型的标准输出，综合性价比高。
- **高维（1536、3072 等）**：大模型 embedding 的常见规格，语义更细腻，但索引构建和内存占用成倍增加。

维度越高不代表效果一定更好——关键在于模型的训练质量和与任务的匹配度。

---

## 主流模型类别

### OpenAI text-embedding 系列

OpenAI 提供的 API 调用型模型，无需自行部署。两代产品在维度、上下文长度上有显著差异，当前主流是第二代（`text-embedding-3-*`）。

```python
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    text = text.replace("\n", " ")
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

vec = get_embedding("什么是向量数据库？")
print(f"维度: {len(vec)}")
```

第二代模型支持**维度截断**（`dimensions` 参数），可以在不重新训练的情况下压缩输出向量，方便在精度和成本之间调节。

### 开源 sentence-transformers 系列

基于 Hugging Face 生态，覆盖多语言和各类垂直领域任务。通过 `sentence-transformers` 库几行代码即可本地推理。

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-large-zh-v1.5")  # 中文优化模型

sentences = ["向量检索的原理", "如何实现语义搜索"]
embeddings = model.encode(sentences, normalize_embeddings=True)

print(f"shape: {embeddings.shape}")  # (2, 1024)
```

常用的开源选择：
- **BAAI/bge 系列**（智源）：中英双语，有 small/base/large 规格，MTEB 中文榜表现稳定。
- **sentence-transformers/all-MiniLM**：英文轻量模型，速度快，适合对延迟敏感的场景。
- **multilingual-e5**（微软）：多语言通用，指令感知型（推理时需在文本前加 `query:` / `passage:` 前缀）。

### 本地部署方案

需要数据不出网或定制化的场景，常见路径有两种：

**方案 A：直接用 transformers 库推理**

```python
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F

tokenizer = AutoTokenizer.from_pretrained("BAAI/bge-base-zh-v1.5")
model = AutoModel.from_pretrained("BAAI/bge-base-zh-v1.5")

def encode(text: str) -> list[float]:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    # 取 [CLS] token 的表示并 L2 归一化
    vec = outputs.last_hidden_state[:, 0, :]
    vec = F.normalize(vec, p=2, dim=1)
    return vec.squeeze().tolist()
```

**方案 B：通过 Ollama 提供本地 API**

```python
import requests

def get_embedding_ollama(text: str, model: str = "nomic-embed-text") -> list[float]:
    resp = requests.post(
        "http://localhost:11434/api/embeddings",
        json={"model": model, "prompt": text},
    )
    return resp.json()["embedding"]
```

Ollama 支持一键拉起模型服务，适合快速本地实验；生产环境可换用 vLLM 或 TGI 以获得更高吞吐。

---

## 选型维度

选 embedding 模型时需要在以下维度综合权衡：

| 维度 | 关键问题 |
|------|----------|
| **语言支持** | 主要处理中文、英文还是多语言？有些模型对中文优化有限 |
| **上下文长度** | 文档片段有多长？部分模型上限 512 token，长文本需截断或换模型 |
| **向量维度** | 存储和检索的资源预算是多少？ |
| **开源 vs 闭源** | 数据隐私要求、离线部署需求、长期 API 成本 |
| **任务类型** | 对称检索（问问题）vs 非对称（query 找 passage）；部分模型需要加指令前缀 |
| **推理速度** | 实时 API 还是离线批处理？batch encode 能显著提升吞吐 |

---

## 常见误区与最佳实践

**误区 1：维度越高效果越好**
维度是模型架构的一部分，不能单独决定质量。一个小而精的模型完全可以在特定任务上超过维度更高的通用模型。

**误区 2：用不同模型生成的向量可以混用**
绝对不行。不同模型的向量空间不兼容，混用会导致相似度计算完全失效。

**误区 3：query 和 document 可以用相同方式编码**
某些非对称模型（如 E5、BGE with instruction）要求 query 和 passage 使用不同前缀。忽略这一点会显著降低检索质量。

**最佳实践：**
- 先用小规模数据在目标任务上做**离线评估**（recall@k、MRR），再决定模型。
- 批量生成时务必使用 `batch_encode`，避免逐条调用浪费吞吐。
- 模型确定后，向量数据库的索引参数（如 HNSW 的 `M`、`ef_construction`）也需要配合向量维度调整。
- 为 embedding 调用加缓存层（如 Redis），相同文本不重复计算。

---

## 面试常问要点

- **为什么用 cosine 相似度而不是欧氏距离？** 语义向量的语义信息主要编码在方向上，而非模长，cosine 只关注角度，更鲁棒。
- **上下文长度超出模型限制怎么办？** 滑动窗口分块 + 取各块向量的加权平均，或改用支持长上下文的模型（如 jina-embeddings-v2）。
- **如何评估 embedding 模型好坏？** MTEB（Massive Text Embedding Benchmark）提供跨语言、多任务的标准化排行；也可以在自己的数据集上做离线召回率评估。
- **fine-tune embedding 模型的时机？** 通用模型在领域词汇、缩写密集的专业场景（金融、法律、医疗）表现往往欠佳，此时可以用对比学习（SimCSE、triplet loss）在领域数据上微调。
