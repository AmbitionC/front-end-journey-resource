文本分块（Chunking）是把长文档转换成可检索单元的过程。它不是简单按字符“切碎”，而是在模型上下文、Embedding 限制、检索粒度和语义完整性之间寻找平衡。

一个 RAG 系统能否找到正确证据，往往在生成向量之前就由切块质量决定了。

## 一、为什么不能整篇直接入库

把一整篇长文编码成一个向量，会把多个主题压缩到同一表示中。查询只涉及一个小节时，整篇文档的平均语义可能不够接近；即使召回，送入模型的无关内容也会增加噪声和 token 成本。

反过来，把每句话都独立入库会丢失标题、限定条件和上下文。例如“该操作只适用于管理员”如果被切到另一块，模型可能召回操作步骤，却漏掉权限约束。

因此，一个好 chunk 应该同时满足：

- 能独立表达一个相对完整的事实或子主题。
- 足够小，便于精确检索和放入上下文。
- 保留标题、来源、位置和权限等必要背景。
- 边界稳定，源文档更新后可以增量重建。

![同一段 560 token 的文档用三种方式切分：固定 200 token 会把句子从中间切开；递归结构切分按段落切成两块并都带上标题路径，操作步骤和“仅限管理员”留在同一块；滑动窗口每块 200、重叠 40，边界附近内容出现两次。每个 chunk 带着 doc_id、标题路径、页码和权限一起向量化入库](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-chunking-boundaries-overlap-anim.dark.png)
*图：看红线：固定窗口会把句子切开；按结构切分让操作步骤和“仅管理员”留在同一块，每块都带标题路径。*

## 二、长度必须按 token 评估

模型限制通常以 token 计算，而不是字符或字节。同样长度的中文、英文、代码和表格可能对应不同 token 数。

切块工具应使用与 Embedding/生成模型匹配的 tokenizer 或官方计数方法：

```ts
type ChunkLimits = {
  targetTokens: number;
  maxTokens: number;
  overlapTokens: number;
};
```

`targetTokens` 是希望达到的大小，`maxTokens` 是绝不能超过的上限。先按自然结构组织，再在超长节点内部继续拆分；不要为了固定 512 token 强行切断一个尚未结束的句子。

没有适用于所有语料的最佳值。初始参数只是实验起点，最终要通过真实检索评测选择。

## 三、固定长度切分

固定 token 窗口实现简单、吞吐稳定，适合结构很弱的纯文本或作为基线。

```ts
function slidingWindows(tokens: number[], size: number, overlap: number) {
  if (size <= 0 || overlap < 0 || overlap >= size) {
    throw new Error("INVALID_WINDOW");
  }
  const chunks: number[][] = [];
  const step = size - overlap;
  for (let start = 0; start < tokens.length; start += step) {
    chunks.push(tokens.slice(start, start + size));
    if (start + size >= tokens.length) break;
  }
  return chunks;
}
```

缺点是边界可能落在句子、列表或代码块中间。解码 token 后还可能出现难读片段。因此固定切分适合做性能基线，不应默认是质量最优方案。

## 四、递归结构切分

递归切分遵循“先大结构，后小结构”：

1. 按文档、章节或 Markdown 标题分组。
2. 超长章节按段落拆分。
3. 超长段落按句子拆分。
4. 单句仍超长时，才按 token 硬切。

```ts
const separators = [
  /\n#{1,6}\s/, // Markdown 标题
  /\n\n+/,      // 段落
  /(?<=[。！？.!?])\s*/, // 句子：实际实现需按语言优化
];
```

真实解析器不应只靠一个正则。Markdown、HTML、PDF、代码和表格应先转换成带类型的文档树，再按节点类型切分。

这种策略通常是技术文档和知识库的稳健起点：边界可解释、实现成本适中，也方便把标题路径附加到 chunk。

## 五、语义切分

语义切分先对句子或小段落生成向量，再根据相邻单元的相似度变化寻找主题边界。它可以识别没有明显标题的主题转换。

基本流程：

1. 将文档拆成句子或小段。
2. 计算每个单元的 Embedding。
3. 计算相邻单元的相似度或距离。
4. 当距离超过阈值时建立边界。
5. 对过小块合并，对过大块递归拆分。

语义切分增加了 Embedding 成本和参数复杂度。阈值依赖模型与语料；短句、列表和代码也可能产生不稳定边界。适合长叙述文档，不一定适合每个知识库。

## 六、结构感知切分

不同内容类型需要不同的最小语义单元：

### Markdown / HTML

保留标题层级、列表、引用和代码块。一个代码块不要从中间切开；链接文本与目标应同时保留。

### PDF

先处理页眉页脚、双栏、断行和 OCR。页码只是来源元数据，不应成为唯一边界；同一段跨页时应重新拼接。

### 表格

保留列名。大表可以按行组切分，但每块都带表名、列头和关键单位。把表格展平成无列名文本会失去含义。

### 代码

按文件、类、函数或 AST 节点切分，并附带模块路径、符号名和依赖关系。固定字符切分容易破坏语法。

### FAQ

一个问题与完整答案通常是天然 chunk。相似问法可以作为检索别名，但不要复制成多个相互竞争的答案。

## 七、Overlap 的作用与代价

重叠让边界附近的信息同时出现在相邻 chunk 中，减少一句话被切断后无法理解的问题。若块大小为 $S$、重叠为 $O$，步长为：

$$
\text{step}=S-O
$$

重叠越大，chunk 数、Embedding 成本、索引存储和检索重复越高。大量近重复结果还会挤占 top-k，让上下文看起来很多，实际只来自同一小段。

更合理的策略是：

- 优先用结构边界避免切断语义。
- 只在固定/递归窗口边界使用有限重叠。
- 检索后按 `documentId + position` 合并相邻块。
- 对候选做去重或 MMR，避免上下文被重复内容占满。

重叠是边界保险，不是越大越好。

## 八、父子块与邻域扩展

一个实用方案是“用小块检索，用大块回答”：

- 子块较小，向量更聚焦，用于相似度搜索。
- 父块保留完整章节或较长上下文。
- 命中子块后，返回父块或相邻窗口给生成模型。

```ts
type Chunk = {
  id: string;
  parentId?: string;
  documentId: string;
  text: string;
  start: number;
  end: number;
};
```

这种方法兼顾召回精度与回答背景，但要控制父块大小。邻域扩展也应有上限，并在组装时去重。

## 九、元数据是 chunk 的一部分

每个 chunk 至少应记录：

```json
{
  "id": "doc_42:v3:chunk_018",
  "documentId": "doc_42",
  "sourceVersion": "v3",
  "headingPath": ["安装", "鉴权"],
  "position": 18,
  "page": 12,
  "language": "zh-CN",
  "tenantId": "tenant_a",
  "acl": ["developer"],
  "chunkerVersion": "markdown-recursive-v2"
}
```

标题路径可以作为检索文本的一部分增强语义，也可以单独保留用于展示。ACL、租户、文档状态必须用于检索过滤，不能等模型看到内容后再决定是否有权访问。

稳定 ID 使更新和删除可追踪。建议由文档 ID、版本和位置/内容哈希生成，不要每次全量运行都随机生成新 ID。

## 十、一个可落地的切块器

```ts
type Node = { type: string; text: string; headingPath: string[] };

function chunkDocument(nodes: Node[], limits: ChunkLimits) {
  const result = [];
  for (const node of nodes) {
    if (countTokens(node.text) <= limits.maxTokens) {
      result.push(toChunk(node));
      continue;
    }

    const sentences = splitSentences(node.text);
    for (const group of packByTokenBudget(sentences, limits)) {
      result.push(toChunk({ ...node, text: group.join("") }));
    }
  }
  return result;
}
```

生产实现还需要：语言检测、空白清理、重复页眉去除、表格/代码专用策略、异常超长单元处理和版本记录。

## 十一、如何评测切块策略

不要只看平均 chunk 长度。准备查询—证据标注集，对每个策略重新建索引并比较：

- `Recall@k`：正确证据是否进入前 k。
- 命中块是否包含回答所需的完整限定条件。
- top-k 中重复或相邻块比例。
- 组装后的上下文 token、P95 延迟和成本。
- 最终答案的引用正确性与忠实度。

对比至少包含固定长度基线、结构感知策略和一组大小/重叠参数。一次只改变一个主要变量，否则无法判断提升来自哪里。

长上下文并不能替代检索与切块。研究显示，模型对长上下文不同位置的信息利用并不均匀；把大量无关内容塞进提示会让关键证据更难被使用。

## 十二、常见失败

- **块过小**：召回了关键词，却没有结论所需的背景。
- **块过大**：向量主题被稀释，检索和生成成本增加。
- **只按字符切**：破坏句子、表格和代码结构。
- **重叠过大**：top-k 被重复片段占据。
- **标题未保留**：正文中的“它”“该功能”失去指代。
- **没有版本与删除同步**：旧政策仍然能被搜索。
- **权限后置**：已经造成敏感信息泄露。

## 检查清单

- [ ] 文档先解析为结构，再按 token 上限递归拆分。
- [ ] 表格、代码、FAQ 和 PDF 使用适合的边界策略。
- [ ] overlap 有明确目的，并评估重复召回。
- [ ] chunk 带标题路径、来源、位置、版本和 ACL。
- [ ] ID 稳定，增量更新与删除能够同步索引。
- [ ] 用真实查询比较 Recall@k、完整性、延迟和成本。
- [ ] 检索后会合并相邻块并去重。
- [ ] 没有把“更长上下文”当作切块质量的替代品。

## 练一练

### 高频考点题 1：块大小怎么定

关于 chunk 大小，下面哪种说法正确？

- A. 越小越好，每句话单独入库，检索时命中的内容最精确、噪声最少
- B. 越大越好，整篇文档一个向量最完整
- C. 按字符数固定切 500 字，中英文都通用，不需要额外评测
- D. 按 token 计算，从实验起点出发，用真实查询的检索评测来选

**答案：D。** 块太小会丢标题和限定条件，块太大会稀释向量主题。模型限制按 token 算，中文、代码和表格的 token 密度不同，没有通用最佳值。

### 高频考点题 2：Overlap 的代价

把相邻 chunk 的重叠从 50 token 加到 300 token，可能带来什么问题？

- A. chunk 数和成本上升，top-k 容易被近重复片段占满
- B. 检索一定更准，因为每个 chunk 都带上了更完整的上下文
- C. 完全没有副作用
- D. 只会增加一点存储，对检索结果和成本基本没有影响

**答案：A。** 重叠是边界保险，不是越大越好。更好的做法是优先按结构边界切，只在窗口边界用有限重叠，检索后按位置合并相邻块并去重。

### 高频考点题 3：父子块

「用小块检索，用大块回答」指的是？

- A. 先用大块检索保证召回，再把命中的大块切成小块交给模型生成
- B. 把所有块都切成最小单位
- C. 用小的子块做相似度搜索，命中后返回所在父块给模型
- D. 只保留父块做检索和回答，子块只在构建索引时临时使用

**答案：C。** 这样兼顾召回精度和回答所需的上下文。父块大小和邻域扩展都要设上限，组装时还要去重。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 平台一面：Agent 评测、框架与数据结构](../../../interview/bytedance/base/bytedance-base-33.md)
- [字节全栈一面：RAG、Java 与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
- [快手 Agent 开发实习一面：MySQL、Kafka 与 RAG](../../../interview/kuaishou/ai/kuaishou-ai-21.md)
- [OPPO AI 全栈一面：Prompt 到 UI、RAG 与前端性能](../../../interview/oppo/ai/oppo-ai-2.md)
- [字节 Agent 后端实习一面：LangGraph、评测集与混合检索](../../../interview/bytedance/base/bytedance-base-22.md)
- [字节 Agent 二面：RAG 分块、查询改写与随机采样](../../../interview/bytedance/base/bytedance-base-28.md)
- [京东零售后端一面：RAG 分块、证据与工具调用](../../../interview/jd/ai/jd-ai-4.md)
- [腾讯元宝风控实习一面：内容安全评测与 RAG 切分](../../../interview/tencent/ai/tencent-ai-33.md)
- [腾讯后台开发暑期一面：Java 内存、并发与检索](../../../interview/tencent/ai/tencent-ai-31.md)
- [携程 Java 后端二面：分块、向量检索与查询改写](../../../interview/ctrip/ai/ctrip-ai-1.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
- [蚂蚁机器学习实习一面：RAG 数据、幻觉与热点识别](../../../interview/antfin/ai/antfin-ai-15.md)
<!-- interview-source-history:end -->

## 参考资料

- [Lost in the Middle：长上下文信息利用研究](https://arxiv.org/abs/2307.03172)
- [Retrieval-Augmented Generation 原始论文](https://arxiv.org/abs/2005.11401)
- [OpenAI：Retrieval](https://developers.openai.com/api/docs/guides/retrieval)
