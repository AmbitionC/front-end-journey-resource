RAG 语料中的重复不只是浪费存储：同一段政策出现十次，会在 top-k 中挤掉其他证据；旧版与新版近似，又可能让模型混合互相冲突的规则。去重要分层处理完全相同、格式变化、近重复和语义相似，并始终保留 canonical 文档到所有来源的血缘。

## 先规范化，再谈相似

原始字节 hash 只能识别完全相同文件。HTML 多一个时间戳、PDF 元数据变化或换行不同都会改变 hash。建立用于比较的 normalization view：

```text
decode → Unicode normalize → whitespace normalize
       → remove approved boilerplate → stable block sequence
```

规范化规则必须版本化且可解释。不要删除数字、否定词、日期和标题，因为它们可能正是版本差异。原始对象永不被规范化结果覆盖。

## 精确重复用确定性 hash

可以同时保存：

- binary hash：文件字节完全相同；
- normalized text hash：规范化文本相同；
- block hash：某个段落或表格重复。

精确 hash 命中可以直接归入同一候选簇，但 canonical 选择仍要考虑权限、来源质量和版本。不同租户即使内容相同，也不能因为 hash 相同就共享未隔离的索引或缓存。

![文档经规范化和精确哈希后，再由 MinHash、SimHash 生成近重复候选，语义复核才决定合并或分开，并保留全部来源](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-deduplication-near-duplicate-v1.webp)
*图：近似算法只产生 CANDIDATES；最终 MERGE / KEEP SEPARATE 由复核层决定。*

## Shingling 与 MinHash

把文本切成连续 token shingles，例如 5-gram，文档可表示为集合。Jaccard resemblance：

```text
J(A,B) = |A ∩ B| / |A ∪ B|
```

[Broder 的原始论文](https://www.cs.princeton.edu/courses/archive/spr05/cos598E/bib/broder97resemblance.pdf)定义了文档 resemblance 与 containment，并用固定大小样本近似集合相交问题。这奠定了 MinHash 在大规模近重复检测中的基础。

MinHash 签名配合 LSH 能避免全量两两比较。它适合大段转载、插入少量页眉或段落顺序基本不变的文档。shingle 大小、签名长度和 band 参数决定召回/计算权衡，必须用标注集选择。

Containment 对“短文是否被长文包含”尤其有用；仅用 Jaccard 可能因长文额外内容很多而分数低。不要把同一阈值用于长短极不均衡的材料。

## SimHash 与语义向量的职责

SimHash 把特征加权投影成位签名，用 Hamming distance 找相近文本，适合搜索引擎式近重复候选。MinHash 对集合 Jaccard 更直接，SimHash 更接近加权特征的角度相似；二者都不是“语义相同”的证明。

embedding 能找到不同措辞但含义相近的内容，也更容易误合并：两个版本的退款政策只有一个“不”字不同，语义向量仍可能非常近。正确流程是 hash/MinHash/SimHash/向量产生候选，语义复核再检查实体、数字、否定、日期和版本。

```ts
type DuplicateDecision = {
  pairId: string;
  decision: 'merge' | 'keep_separate' | 'review';
  reasons: string[];
  exactSignals: Record<string, number | boolean>;
  semanticModelVersion?: string;
  reviewer?: string;
};
```

## Canonical 不等于删除其他来源

canonical 文档是检索展示的首选代表，但簇内每个来源都保留 URI、时间、ACL、版本和内容 hash。选择规则可以优先：官方来源、最新有效版本、完整结构、更高解析质量。

若两个来源权限不同，canonical 只能在当前授权集合内选择。一个公开副本不能自动证明受限原文可见；反过来，受限 canonical 也不能使公开用户失去可见的公开副本。

引用可展示 canonical 内容，同时列出支持来源；删除某来源时只移除它的 membership。簇无成员后才删除 canonical 派生产物。

## 簇会随时间变化

新增文档可能连接两个旧簇，旧文档更新也可能离开簇。避免把 cluster ID 写死为内容身份；保存可变 membership 与版本化 decision。每次算法升级先影子重算，比较簇分裂、合并和 canonical 变化，再发布。

删除传播先移除来源和证据，再重新选 canonical。若被删来源是唯一承载某段内容的成员，对应 chunk 也必须删除，不能因为簇仍存在就保留。

## False Merge 与 False Split

**False merge** 把不同文档合为一簇，会隐藏版本差异并产生错误引用，通常风险更高。**False split** 没识别出重复，会占用 top-k 并放大某事实。

建立 pair-level 标注集，覆盖：

- 完全相同、换格式、加页眉；
- 短文被长文包含；
- 模板相同但数字/实体不同；
- 新旧政策、否定反转；
- 翻译、摘要与真正重复；
- 表格顺序和 OCR 误差。

计算 candidate recall、复核 precision、false merge/split，并测下游 top-k 来源多样性与答案冲突。阈值按文档类型和风险分层，不追求一个全局数字。

## 小结

生产去重是一条证据保守的分层管线：规范化和 hash 处理确定性相同，MinHash/SimHash/embedding 只生成近重复候选，语义复核才决定合并。Canonical 用于检索代表，不删除来源血缘；持续监控 false merge 与 false split，才能减少噪声而不抹平真实版本差异。

## 参考资料

- [Broder — On the Resemblance and Containment of Documents](https://www.cs.princeton.edu/courses/archive/spr05/cos598E/bib/broder97resemblance.pdf)
