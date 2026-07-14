Embedding（嵌入）把文本、图片或其他对象映射成固定长度的数值向量。向量本身不是人类可读的标签；它的价值在于，同一模型训练出的向量空间通常会让语义相关的对象在某种距离度量下更接近。

这使语义搜索、聚类、推荐、去重和 RAG 检索成为可能。

## 一、从关键词到语义表示

关键词检索擅长精确匹配产品编号、错误码和专有名词，但“猫咪正在休息”和“小猫在窗边睡觉”几乎没有相同词，仍然表达相近含义。

Embedding 模型会把两段文本分别编码为向量：

$$
f(\text{文本}) = \mathbf{x} \in \mathbb{R}^{d}
$$

其中 $d$ 是向量维度。实际维度可能是数百或数千；图中的二维空间只是帮助理解的投影。

![Embedding 的语义空间与相似度度量](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/embedding-similarity-space-v2.png)

Sentence-BERT 等双编码器方法的关键工程优势，是文档向量可以提前计算并存入索引。查询到来时只编码查询，再做近邻搜索，不需要把查询与每篇文档成对送入一个大模型。

## 二、向量如何学到语义

常见文本 Embedding 模型使用对比学习：

- 相关的文本对是正样本，例如问题与正确答案、标题与正文。
- 不相关或容易混淆的文本是负样本。
- 训练目标拉近正样本表示，推远负样本表示。

简化理解，可以把一个批次中的正确配对分数提高、错误配对分数降低。实际模型还会使用难负样本、不同任务数据和多阶段训练。

因此“相似”不是绝对概念，而是训练数据和目标定义的结果。面向通用语义训练的模型，未必能正确区分公司内部缩写、代码符号或法律条款；选型必须用自己的查询—文档样例评估。

## 三、三种常用相似度

设两个向量为 $\mathbf{a}$ 和 $\mathbf{b}$。

### 余弦相似度

$$
\cos(\mathbf{a},\mathbf{b})=
\frac{\mathbf{a}\cdot\mathbf{b}}
{\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert}
$$

它比较方向，范围理论上是 $[-1,1]$。值越大通常表示越相似。余弦距离常定义为 $1-\cos$，此时越小越近。

### 点积

$$
\mathbf{a}\cdot\mathbf{b}=\sum_{i=1}^{d}a_i b_i
$$

点积同时受方向和模长影响。如果模型输出已经做 L2 归一化，点积与余弦相似度的排序等价；没有归一化时不能默认等价。

### 欧氏距离

$$
\lVert\mathbf{a}-\mathbf{b}\rVert_2=
\sqrt{\sum_{i=1}^{d}(a_i-b_i)^2}
$$

它衡量空间中的直线距离，越小越近。选择哪种指标应遵循模型文档和训练约定，并与向量索引配置保持一致。

```ts
function cosine(a: number[], b: number[]) {
  if (a.length !== b.length) throw new Error("DIMENSION_MISMATCH");
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  if (normA === 0 || normB === 0) throw new Error("ZERO_VECTOR");
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

这个函数适合教学与小规模测试；海量向量应使用经过优化的向量索引。

## 四、生成向量的基本流程

以 OpenAI Embeddings API 为例，模型名应由环境配置，避免散落在代码里：

```ts
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.embeddings.create({
  model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
  input: ["猫咪正在休息", "数据库索引优化"],
});

const vectors = response.data
  .sort((a, b) => a.index - b.index)
  .map((item) => item.embedding);
```

批量接口的返回项带有 `index`，应用应按它恢复输入顺序。还要限制单条文本和单批 token 数，记录失败项并支持幂等重试。

最重要的兼容约束是：

- 入库文档和在线查询使用同一个模型版本。
- 向量维度与数据库列/索引一致。
- 使用相同的预处理、前缀和归一化约定。
- 相似度函数与模型建议、索引类型一致。

任何一项变化都可能让新查询无法正确搜索旧向量。

## 五、文档检索中的数据模型

向量不应与原文和权限信息分离。一个检索单元通常包含：

```ts
type VectorRecord = {
  id: string;             // 稳定、幂等的 chunk ID
  embedding: number[];
  text: string;
  metadata: {
    documentId: string;
    heading?: string;
    position: number;
    tenantId: string;
    acl: string[];
    sourceVersion: string;
    embeddingVersion: string;
  };
};
```

`embeddingVersion` 至少应能定位模型、维度、预处理和切块版本。否则模型升级后，很难判断哪些记录需要重算。

## 六、维度、存储与召回的权衡

更高维度能容纳更丰富的表示，但会增加：

- API 返回与网络传输体积。
- 数据库存储和内存占用。
- 索引构建与查询计算量。
- 全量重嵌入的迁移成本。

维度更高不保证业务召回更好。应在固定评测集上比较 Recall@k、排序质量、P95 延迟、索引大小和总成本。有些模型支持缩短输出维度，但缩短方式必须遵循模型文档，不能简单随意截断所有模型的向量。

## 七、稠密、稀疏与混合检索

Embedding 通常产生稠密向量，擅长语义改写和概念相近。BM25 或稀疏向量擅长精确词项，例如版本号、SKU、函数名和错误码。

两者并非替代关系。生产 RAG 常采用混合检索：

1. 稠密检索召回语义相关片段。
2. 关键词或稀疏检索召回精确匹配。
3. 合并、去重并重排候选结果。

如果语料包含大量代码、专有名词和编号，只使用稠密向量很容易漏掉关键结果。

## 八、向量索引为什么是近似的

对少量数据可以逐个计算距离，得到精确近邻；数据量增大后，通常使用 HNSW、IVF 等 ANN（Approximate Nearest Neighbor）索引。

ANN 用部分召回换速度和资源。查询参数越激进，延迟可能更低，但真正最近的向量可能被漏掉。因此必须区分：

- **检索相关性**：正确片段是否排在前面。
- **ANN 召回**：索引是否找到了精确搜索会返回的候选。
- **回答质量**：模型是否忠实使用了检索证据。

这三层不能用一个“准确率”替代。

## 九、相似不等于正确

向量距离只表示模型空间中的接近程度，不提供事实证明：

- 两段互相矛盾的句子可能因为主题相同而很接近。
- 旧政策和新政策可能都被召回。
- 同名实体可能被错误混合。
- 高相似度阈值无法替代权限、时间和来源过滤。

检索时应先或同时应用 `tenantId`、ACL、语言、时间和文档状态过滤，再用重排器或业务规则选择证据。最终回答要展示来源，并在证据不足时拒答。

## 十、模型升级与重嵌入

不同 Embedding 模型的向量空间不能直接混用。升级建议采用双写/双读迁移：

1. 创建新索引或新的版本分区。
2. 用新模型批量重算文档向量。
3. 同一批评测查询同时检索新旧索引。
4. 比较召回、延迟和成本。
5. 切换在线查询，再保留短期回滚能力。
6. 确认稳定后删除旧向量。

不要在同一个未分版本的索引里逐条替换，让查询同时面对两个不兼容空间。

## 十一、评测方法

准备真实查询集合，每条至少标注一个相关文档或片段。常用指标包括：

- `Recall@k`：前 k 个结果是否覆盖相关片段。
- `MRR`：第一个相关结果出现得有多靠前。
- `nDCG@k`：多个相关结果及其相关等级的排序质量。
- P50/P95 延迟、失败率、索引大小和单次成本。

还要按短查询、长查询、缩写、错别字、精确编号和跨语言场景分组分析，避免平均值掩盖重要失败类型。

## 常见误区

- **把二维图当真实空间**：真实向量是高维的，二维可视化会丢失结构。
- **把相似度当概率**：0.8 不是“80% 正确”，阈值必须由业务数据校准。
- **换模型不重建索引**：不同空间不可直接比较。
- **只存向量不存版本和来源**：无法审计、更新或删除。
- **只做语义检索**：错误码、编号和专有名词常需要关键词信号。
- **只优化回答 Prompt**：很多 RAG 问题其实来自切块和召回。

## 检查清单

- [ ] 文档与查询使用同一模型、维度和预处理。
- [ ] 距离函数与模型、索引配置一致。
- [ ] 记录了文档、切块、Embedding 和来源版本。
- [ ] ACL 与租户过滤在检索阶段生效。
- [ ] 用真实查询评测 Recall@k、排序、延迟和成本。
- [ ] 对编号/专有名词评估关键词或混合检索。
- [ ] 模型升级使用新索引并保留回滚窗口。
- [ ] 产品不会把相似度显示成事实正确概率。

## 参考资料

- [Sentence-BERT 论文](https://arxiv.org/abs/1908.10084)
- [Dense Passage Retrieval 论文](https://arxiv.org/abs/2004.04906)
- [OpenAI：Embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [pgvector：Distance 与索引文档](https://github.com/pgvector/pgvector)
