RAG 系统最容易出现的错觉是：“答案读起来不错，所以系统应该没问题。”实际上，一段流畅答案可能引用错文档，也可能检索正确却在生成时编造细节。评估的核心是把系统拆成**检索层、生成层和端到端任务层**，先定位故障发生在哪里，再决定优化哪一层。

## 一、先定义“好”到底是什么

不同产品的成功标准不同：

- 客服助手希望答案正确、可执行，并减少人工转接。
- 法务检索更在意证据完整、版本正确和可追溯。
- 代码问答需要匹配当前仓库与依赖版本。
- 内部知识库必须先满足权限隔离，再谈相关性。

因此不要从一个通用总分开始，而应先写出用户任务、不可接受的失败和上线门槛。一个实用的指标树通常包含：

1. **质量**：召回、排序、忠实度、答案正确性、引用正确性。
2. **安全**：越权召回、敏感信息、提示注入和不当工具行为。
3. **体验**：首字延迟、总延迟、失败率、可解释性。
4. **经济性**：检索、重排、模型和人工复核成本。

## 二、构造能长期复用的评测集

评测集不是随手写十个问题。每条样本至少应保存：

~~~ts
type RagEvalCase = {
  id: string;
  query: string;
  expectedDocIds?: string[];
  referenceAnswer?: string;
  requiredFacts?: string[];
  forbiddenClaims?: string[];
  userScope: string;
  tags: string[];
};
~~~

样本来源可以包括真实脱敏查询、客服记录、搜索零结果、用户点踩和专家设计的边界题。要刻意覆盖：

- 常见问题与长尾问题；
- 可回答、不可回答和证据不足的问题；
- 时间敏感、版本敏感和否定表达；
- 同义改写、拼写错误、缩写和多语言；
- 不同租户、角色和权限范围；
- 提示注入与恶意文档。

将评测集分成开发集和冻结回归集。调参时反复观察同一小组样本会产生“对测试集过拟合”，所以还需要保留未参与调优的样本。

![RAG 评估从检索层、生成层和端到端指标定位错误，再通过单变量修改完成回归闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-evaluation-diagnostic-loop-v2.png)

这张图强调一件事：自动指标、LLM Judge 和人工复核是互补关系，不应压成一个看似精确的总分。

## 三、检索层：正确证据有没有进来

### Recall@K：相关证据是否被找回

$$
\operatorname{Recall@K}=\frac{\text{Top-K 中相关文档数}}{\text{全部相关文档数}}
$$

如果一个问题需要三份文档共同回答，系统只召回一份，即使生成模型很强也无法补齐事实。Recall@K 适合判断候选集是否完整。

### Precision@K：候选中有多少是有用的

$$
\operatorname{Precision@K}=\frac{\text{Top-K 中相关文档数}}{K}
$$

Precision 低意味着上下文充满噪声。噪声不仅浪费 token，还可能诱导模型选错版本或混合冲突事实。

### MRR 与 nDCG：相关证据排得够不够靠前

MRR 关注第一个相关结果的位置，适合“找到一个正确入口即可”的任务；nDCG 能处理多级相关性，并对靠前结果赋予更高价值。传统信息检索课程对 MAP、MRR 和 nDCG 的适用边界有系统说明。[Stanford IR：Evaluation Measures](https://web.stanford.edu/class/cs276/handouts/EvaluationNew-handout-1-per.pdf)

检索指标需要人工或规则产生相关性标注。LLM 可以辅助扩充标注，但重要样本应抽样复核，尤其是“部分相关”和“证据冲突”的边界。

## 四、生成层：答案是否忠于证据

检索正确不代表回答正确。生成层至少评估以下维度：

| 维度 | 核心问题 |
|---|---|
| 忠实度（Faithfulness） | 每个事实是否都能由给定上下文支持？ |
| 答案相关性 | 是否直接回答用户问题，而非复述文档？ |
| 正确性 | 与参考答案或可验证事实是否一致？ |
| 完整性 | 是否覆盖任务要求的关键事实？ |
| 引用正确性 | 引用是否真的支持邻近陈述？ |
| 拒答质量 | 证据不足时是否明确说不知道？ |

RAGAS 的原始论文将 RAG 拆为检索上下文质量、生成忠实度和答案质量等维度，目的正是避免把不同故障混成一个分数。[RAGAS 论文](https://aclanthology.org/2024.eacl-demo.16/)

### LLM Judge 能做什么，不能做什么

LLM Judge 适合按量表评估语义质量、事实覆盖和引用支持，但它仍是概率模型，会受到提示词、顺序、模型版本和回答风格影响。

更可靠的做法是：

1. 用明确量表，而不是只问“好不好”。
2. 让评分输出证据位置和失败类别。
3. 用少量人工金标校准 Judge。
4. 定期检查一致率、偏差和版本漂移。
5. 对高风险样本保留人工复核。

Anthropic 关于 Agent 评估的实践也建议组合不同评分器，并分别检查 groundedness、覆盖度和来源质量，而不是依赖单一评委。[Anthropic：Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

## 五、端到端：用户是否真正完成任务

离线质量分数必须与线上结果结合。常见端到端指标包括：

- 任务成功率、一次解决率和人工转接率；
- 用户纠正、重新提问、复制引用和点踩率；
- 首字延迟、总延迟、超时率和错误率；
- 单次请求的检索、重排和生成成本；
- 越权结果、无来源陈述和高风险操作次数。

点击率不是答案正确率，用户停留时间也不一定代表满意。线上指标要结合产品语境，并用抽样审计确认代理指标没有被“刷高”。

## 六、用错误切片定位问题

平均分会掩盖局部灾难。建议把失败按以下维度切片：

- 查询类型：精确标识符、自然语言、比较题、多跳题；
- 文档类型：表格、代码、PDF、长文、扫描件；
- 数据状态：最新版本、历史版本、缺失 metadata；
- 用户范围：租户、角色、地区、语言；
- 失败阶段：解析、分块、召回、融合、重排、生成、引用。

然后查看调用轨迹：查询如何改写、命中了哪些 chunk、各自分数和版本是什么、上下文怎样截断、模型输出引用了哪里。没有 trace，RAG 调优很容易变成猜测。

## 七、优化时一次只改一个主要变量

可以按以下顺序迭代：

1. **修数据**：去重、清洗、版本、权限和解析质量。
2. **修分块**：边界、大小、重叠、标题与 metadata。
3. **修召回**：Embedding、BM25、Hybrid Search、过滤和候选数。
4. **修排序**：RRF、reranker 和多样性。
5. **修上下文**：去重、压缩、顺序和引用 ID。
6. **修生成**：指令、Schema、拒答策略和模型选择。

每次实验记录配置、代码版本、索引版本、模型版本、数据快照和完整指标。只有这样才能复现、回滚和比较。

## 八、一个最小评估报表

~~~json
{
  "dataset": "support-rag-regression-v3",
  "retrieval": {
    "recall@5": 0.84,
    "ndcg@10": 0.79
  },
  "generation": {
    "faithfulness": 0.91,
    "answerRelevance": 0.88
  },
  "operations": {
    "p95LatencyMs": 1820,
    "avgCost": 0.012
  },
  "slices": {
    "versionSensitive": 0.63,
    "exactIdentifiers": 0.94
  }
}
~~~

这些数字只是格式示例，不是行业基准。真正重要的是同一评测集、同一统计口径下的变化，以及失败样本是否符合业务风险偏好。

## 常见误区

- **用答案相似度代替事实正确性**：措辞接近不代表证据成立。
- **只测生成，不测检索**：会把召回失败错怪给模型。
- **只看均值**：高风险切片可能已经不可用。
- **把 LLM Judge 当绝对真值**：必须做人工校准与漂移检查。
- **边调参边改评测集**：失去可比性。
- **只做离线评估**：忽略真实延迟、成本和用户行为。
- **同时替换所有组件**：无法归因，也难以安全回滚。

## 小结

RAG 评估是一套诊断系统，而不是排行榜。先用检索指标判断证据是否进入候选集，再用忠实度、相关性和引用检查判断模型是否正确使用证据，最后用任务成功、延迟、成本与安全指标决定是否值得上线。持续保留失败样本，并让每次修复都进入冻结回归集。

## 参考资料

- [Es et al.：RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://aclanthology.org/2024.eacl-demo.16/)
- [Stanford CS276：Evaluation Measures in Information Retrieval](https://web.stanford.edu/class/cs276/handouts/EvaluationNew-handout-1-per.pdf)
- [Lewis et al.：Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Anthropic：Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

