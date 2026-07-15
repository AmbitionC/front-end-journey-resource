分块有一个经典矛盾：小块容易与问题精确匹配，却缺少完整上下文；大块上下文丰富，却会稀释 embedding。Parent-Child Retrieval 把“用于匹配的单位”和“送给模型的单位”分开：先检索小 child，再通过稳定 parent ID 回填更大的父级内容。

## 两套单位，一个血缘

假设一篇文档按章节形成 parent，每个 parent 再分成语义较小的 child：

```ts
type ChildRecord = {
  childId: string;
  parentId: string;
  text: string;
  vector: number[];
  start: number;
  end: number;
  sourceVersion: string;
};

type ParentRecord = {
  parentId: string;
  sourceId: string;
  text: string;
  headingPath: string[];
  sourceVersion: string;
};
```

只有 child 进入向量检索；parent 保存在文档存储。查询命中 child 后按 `parentId` 批量读取 parent。[LangChain 的 retriever 集成目录](https://python.langchain.com/docs/integrations/retrievers/)把 Parent Document Retriever 归入多种可组合检索器之一，具体类名会随版本变化，文章关注的是这一稳定的两级机制。ID 同时包含 sourceVersion 与逻辑路径，防止更新后指向旧内容。

![小块先负责匹配，再通过 Parent ID 回填较大上下文，最后去重并受 token 预算约束](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-parent-child-small-big-v1.webp)
*图：Small-to-Big 的顺序不能反转；Adjacent Window 是另一种局部扩展路径。*

## 为什么小块更适合匹配

一个大章节可能同时讲安装、授权、错误处理和示例。用户问“错误码 E17 如何重试”，整章向量会被其他主题稀释；对应小段落更集中。小块还能给关键词和 rerank 更清楚的相关性信号。

但直接把小块送进模型容易丢失限定词、表头、定义和前后步骤。因此命中后回填 parent，获得足够语境。Parent 不一定是整篇文档，可以是一个章节、表格、函数或滑动窗口。

## 查询流程

```ts
const children = await childIndex.search(query, { topK: 20, filter: acl });
const ranked = await rerank(query, children);

const parentScores = new Map<string, number>();
for (const child of ranked) {
  parentScores.set(
    child.parentId,
    Math.max(parentScores.get(child.parentId) ?? -Infinity, child.score),
  );
}

const parentIds = allocateByBudget(parentScores);
const parents = await parentStore.getMany(parentIds);
```

用最高 child 分数、多个 child 的加权聚合或覆盖不同子问题的配额给 parent 排序，都需要在标注集上验证。不要让一个 parent 因包含许多普通 child 而无条件占满上下文。

## Parent 大小仍需评测

Parent 过小，扩展没有意义；过大，则重新引入噪声与 token 成本。选择依据包括文档结构、问题跨度和模型预算，而不是固定字符数。

常见策略：

- 标题章节：适合政策、手册和教程；
- 语义段组：适合没有清晰标题的文本；
- 表格整体：child 是行/单元格，parent 是完整表头与相关行；
- 代码符号：child 是语句或注释，parent 是完整函数/类；
- page region：child 是 OCR 行，parent 是同一区域或页面。

对超长 parent 可做二次裁剪，但保留命中 child、标题与必要前后文；不能先生成摘要再丢失原文位置。

## Adjacent Window 是轻量替代

如果文档没有稳定 parent，可以在命中 chunk 周围取前后 N 个相邻块。它实现简单、更新成本低，但可能跨章节边界或包含无关内容。窗口按 token 动态扩展，并在标题、分页或权限边界处停止。

Parent-Child 更适合结构明确、需要整段语境的内容；Adjacent Window 更适合连续叙事。两者可共同进入实验，而非互相替代。

## 去重与 token 配额

多个 child 常指向同一 parent。先按 parentId 去重，再按相关性和来源多样性分配预算。可以限制单文档最多 parent 数，避免一个来源霸占全部上下文；相邻 parent 若重叠，合并区间并保留各 child 命中位置。

当问题含多个子意图时，按子问题保留至少一个 parent，比单纯取总分前几名更稳。预算不足时返回命中 child 与较小窗口，而不是静默截断 parent 尾部。

## 更新与权限

文档更新后，parent 文本、child 切分和 embedding 可能同时改变。影子构建新 sourceVersion，确认所有 child 的 parentId 可解析后再切换索引。[GraphRAG 输入文档](https://microsoft.github.io/graphrag/index/inputs/)用内容哈希生成稳定 document ID，体现了版本化检索中“身份必须可重建”的同一原则。删除 parent 时同步删除 child；孤儿 child 是发布阻断错误。

Parent 权限不能比 child 更宽。检索前在 child index 过滤 ACL，回填时 parent store 再验证相同租户、sourceVersion 和授权摘要，防止 ID 猜测或缓存串租户。

## 评测 Small-to-Big

把评测拆开：

- child Recall@K：相关细节是否进入候选；
- parent resolution：命中 child 是否映射到正确版本 parent；
- context precision：扩展后噪声增加多少；
- answer faithfulness：限定条件是否因扩展得到改善；
- token 与延迟：回填和去重成本。

对照实验至少包括：固定小块、固定大块、Adjacent Window、Parent-Child。按定义、跨段限定、表格、代码和多意图问题切片。Small-to-Big 不是必然提升；若问题只需精确 ID，小块本身可能更好。

## 小结

Parent-Child Retrieval 通过职责分离化解分块矛盾：child 为召回优化，parent 为上下文完整性优化。稳定 parent ID、更新原子性、去重预算和权限复核是工程关键；效果要与小块、大块和相邻窗口基线逐类比较。

## 参考资料

- [LangChain — Retrievers integrations](https://python.langchain.com/docs/integrations/retrievers/)
- [Microsoft GraphRAG — Inputs and stable document IDs](https://microsoft.github.io/graphrag/index/inputs/)
