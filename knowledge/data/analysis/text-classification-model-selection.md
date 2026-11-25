文本分类选型先固定任务和部署约束，再比较表示能力。FastText、TextCNN 与 TinyBERT 分别用词袋式聚合、局部卷积和上下文编码形成文本表示；多标签还是单标签，则是另一个需要独立定义的输出问题。学完应能解释各模型为何可能有效，并用同一数据协议决定取舍。

## 先写清一个样本能有几个标签

单标签多分类通常要求从互斥类别中选一个，例如把一条请求分到唯一业务队列；多标签允许同时成立多个类别，例如同一条反馈既属于“退款”又属于“物流”。先定义标签含义、共现规则、缺失标注和未知类别，再设计模型，不能因为一条文本很长就称它为多标签。

假设标签顺序为 `[退款, 物流, 质量]`，样本“东西坏了，想退款”可有 multi-hot 目标 `[1,0,1]`。这只是教学标注，真实系统仍要确认“未标注”是否真的代表负类，标签体系变更如何版本化。

## FastText 如何从词得到分类结果

这里讨论监督文本分类模型。设文本抽取的特征为 $f_1,\dots,f_m$，查表获得向量后做平均：

$$
h=\frac{1}{m}\sum_{j=1}^{m}E[f_j],\qquad z=Wh+b
$$

词袋本身不保留全局顺序；加入 word n-gram，能显式带入部分局部顺序信息。比如“不 推荐”作为 bigram，可以与只出现“推荐”区别开；它仍不等于完整理解否定范围和长距离依赖。[FastText 原论文](https://aclanthology.org/E17-2068/)给出查表、平均和线性分类结构；[官方教程](https://fasttext.cc/docs/en/supervised-tutorial.html)展示 word n-gram 的配置。

“对关键词敏感”不是专门设置的关键词搜索模块。在线性打分下，一个特征向量对某类 logit 的贡献与该类权重有关；训练中与标签稳定共现的词或短语，可能因此提供强信号。这是从结构推导的解释，不保证任意业务中的关键词都重要。平均还会受长度、重复词和特征集合影响，插入无关文字可能稀释信号。

## TextCNN 多学了什么

TextCNN 在连续 token 的 embedding 窗口上应用可训练卷积核，将局部模式映射成激活；不同窗口宽度覆盖不同长度的短语，再通过 max-over-time pooling 提取每张特征图的最强响应，交给分类头。[Kim 的原论文](https://aclanthology.org/D14-1181/)给出这一机制。

FastText 的 n-gram 是离散特征，TextCNN 的卷积核则学习对局部向量组合的响应。后者可以在局部模式上泛化，但最大池化会压缩位置信息，常规浅层 TextCNN 也不能因此保证理解任意长程关系。不要把“用了卷积”概括成“句子顺序完全保留”。

## TinyBERT 的“小”来自结构与蒸馏

TinyBERT 仍属于 Transformer 编码器模型，使用较小学生网络承接 BERT 教师的知识。原方法不仅拟合最终预测，还利用 embedding、隐藏状态和 attention 等中间表示，并区分通用蒸馏与任务蒸馏；任务阶段包含数据增强。尺寸不匹配时需要相应投影。[TinyBERT 原论文](https://aclanthology.org/2020.findings-emnlp.372/)解释了这些训练设计。

减少层数或隐藏维度降低学生计算量，蒸馏帮助恢复质量；蒸馏不是推理时同时运行大小两个模型。也不能把量化、剪枝和 LoRA 都算成 TinyBERT 原方法的必选步骤。论文中的速度和效果来自特定实验，部署选型仍要在自己的长度、硬件、批次和任务上测量。

图中比较的是三个编码器怎样连接同一分类任务，不表示必须同时上线三个模型。

![FastText 用词与 n-gram 向量平均，TextCNN 用局部卷积与最大池化，TinyBERT 用蒸馏后的 Transformer；三者接任务分类头，多标签在输出端独立 Sigmoid](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/text-classification-model-selection-encoders-20261115.png)
*图：教师参与 TinyBERT 的训练蒸馏；推理一般只需学生。三路表示是候选选型方案。*

## 多标签为什么常用 Sigmoid

对第 $c$ 个标签，$p_c=\sigma(z_c)$ 分别表示它成立的分数；多个输出不必加起来为 1。普通 Softmax 把一个类别轴归一化成总和 1，更自然地对应互斥类别，因此不能直接替代多个可同时成立标签的二元目标。特殊的标签组合建模需要另行定义，不能只靠换激活函数得到。

一个常见训练目标是逐标签二元交叉熵：

$$
\mathcal{L}=-\sum_c[y_c\log\sigma(z_c)+(1-y_c)\log(1-\sigma(z_c))]
$$

[PyTorch BCEWithLogitsLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html)将 Sigmoid 与 BCE 合并，以提高数值稳定性。使用它时输入原始 logits，不要预先再做一次 Sigmoid；推理时再转换分数和应用阈值。FastText 则有[官方 one-vs-all 用法](https://fasttext.cc/docs/en/supervised-tutorial.html)，不能只增加输出个数、仍沿用互斥分类的目标。

逐标签输出不意味着真实标签统计独立。标签可共享编码器，也可能需要共现约束或层级一致性校验；Sigmoid 本身不会保证“子类出现时父类也出现”。阈值可按标签在验证集上选择，不能默认每类 0.5 都最优。关于不平衡、概率与阈值的区别，可接着读[分类评估与阈值](imbalanced-classification-evaluation.md)。

## 怎样公平地选型

先在相同去重、实体与时间切分下训练，固定标签与验收指标；验证集选模型、超参数和阈值，测试集用于冻结后的独立验收。不要让一个模型见到更多训练信息，再把差异归功于结构。

| 待验证的需求 | 可以比较的候选能力 | 必须检查的代价与失败 |
| --- | --- | --- |
| 词或短语已提供较强信号 | FastText 的低成本基线 | 否定、改写、未登录词、长文本稀释 |
| 局部组合比单词更重要 | TextCNN 的可学习局部模式 | 窗口、池化和跨句关系的缺口 |
| 上下文歧义较多 | TinyBERT 的上下文表示 | 推理时延、内存、截断与蒸馏域偏差 |

表格是试验假设，不是效果排名。多标签质量至少区分 micro 汇总和按类 macro 汇总，检查低频标签、共现组合和空标签样本；同时记录实际批次与长度分布下的尾延迟、吞吐和内存。总体分数接近时，可再看哪类错误更难接受。

并行训练多个模型是建立可比较基线、检验归纳偏置和资源约束的一种方法，并不证明最终需要集成。若考虑级联或投票，还要检查错误相关性、额外延迟、分数校准与降级行为。最终回答应给出实测选择依据；没有实验记录时，保留“待验证”，不编造准确率或成本收益。

## 练一练

### 高频考点题 1：单标签和多标签

「东西坏了而且物流慢」同时属于质量和物流两类，这是什么任务？

- A. 单标签多分类
- B. 回归任务
- C. 多标签分类
- D. 聚类任务

**答案：C。** 多标签通常每类独立用 sigmoid，单标签互斥类别用 softmax。

### 高频考点题 2：FastText

FastText 怎样得到文本表示？

- A. 用 Transformer 编码整句
- B. 平均词和 n-gram 的嵌入
- C. 只看第一个词
- D. 统计字符数

**答案：B。** 词袋不保留全局顺序，加入 n-gram 能补一点局部顺序信息，速度很快。

### 高频考点题 3：选型的第一步

文本分类模型选型，第一步应该做什么？

- A. 直接选参数量最多的那个模型
- B. 固定任务和部署约束
- C. 先买 GPU
- D. 先写前端界面

**答案：B。** 标签体系、延迟、成本和数据量决定 FastText、BERT 还是大模型合适。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [华为后训练与强化学习实习一面：分类模型、训练并行与排序](../../../interview/huawei/ai/huawei-ai-4.md)
<!-- interview-source-history:end -->

## 参考资料

- [Joulin 等：Bag of Tricks for Efficient Text Classification](https://aclanthology.org/E17-2068/)
- [FastText：Text classification tutorial](https://fasttext.cc/docs/en/supervised-tutorial.html)
- [Kim：Convolutional Neural Networks for Sentence Classification](https://aclanthology.org/D14-1181/)
- [Jiao 等：TinyBERT](https://aclanthology.org/2020.findings-emnlp.372/)
- [PyTorch：BCEWithLogitsLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html)
