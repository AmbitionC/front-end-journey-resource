公司：华为 · 岗位：后训练与强化学习实习 · 轮次：一面 · 面试时间：10 月 30 日（原记录未单独注明年份）。

以下按已见文字整理，短答为编辑补充的备考思路，并非当事人的现场回答。原记录有一张未核验图片，图中内容未纳入；模型最终选型、业务实测指标和论文细节也未披露。

## 背景交流

开场为简短自我介绍；随后还交流了实习安排是否获得导师支持，并追问首篇强化学习论文的构思与完成过程。结尾反问业务方向与工作地点。原文未记录这些问题的实际回答，不能据此还原个人经历或论文方法。

## 技术问题与回答思路

<details data-knowledge-key="text-classification-model-selection"><summary>（1）在实习项目中，为什么同时训练 FastText、TextCNN 和 TinyBERT，最终怎样选型？</summary></details>
<p>原记录没有披露最终模型和实验指标。可先说明三者的词袋式聚合、局部卷积与上下文编码差异，再用相同数据切分比较标签质量、长尾错误、时延和资源成本；同时训练是建立对照，不代表必须同时上线。</p>

<details data-knowledge-key="text-classification-model-selection"><summary>（2）FastText 与 TextCNN 怎样提取文本特征？FastText 为什么可能对关键词敏感？</summary></details>
<p>FastText把词或 n-gram 的查表向量聚合后分类，强标签相关词可能对线性打分贡献较大；TextCNN用可训练卷积核提取局部组合，再池化形成表示。关键词敏感是可能出现的训练结果，不能理解为硬编码关键词检索；两者都需检查否定、改写与长程依赖错误。</p>

<details data-knowledge-key="text-classification-model-selection"><summary>（3）TinyBERT 相比普通 BERT，采用了哪些轻量化设计和处理？</summary></details>
<p>先说明较小的学生 Transformer，再解释对 embedding、隐藏状态、attention 和预测等知识的蒸馏，以及通用蒸馏和任务蒸馏的分工。减少层数或维度与蒸馏训练是两个层面，不能把量化、剪枝都当作该方法的必选步骤；实际体积与速度须按部署条件测量。</p>

<details data-knowledge-key="text-classification-model-selection"><summary>（4）多标签分类任务怎样定义，输出层使用 Softmax 还是 Sigmoid，有什么好处？</summary></details>
<p>先确认一个样本可同时具备多个标签，以 multi-hot 目标配逐标签 Sigmoid 和二元交叉熵，是常见的建模方式；普通类别 Softmax 总和为1，更自然地对应互斥类别。标签独立输出不代表真实标签互不相关，还需验证阈值、共现与层级规则；原项目具体配置未披露。</p>

<details data-knowledge-key="algorithm-trie"><summary>（5）AC 自动机解决什么问题，底层机制是什么？</summary></details>
<p>它将多个模式建成 Trie，并增加失败链接和输出信息，用已读文本的后缀状态继续精确匹配。失配时沿 fail 找可用转移而不倒退文本指针，报告结果还需包含后缀模式；复杂度要计入匹配输出量，不能把它当成语义召回。</p>

<details data-knowledge-key="agent-architecture"><summary>（6）AC 自动机、向量召回、多模型和 Agent 怎样协同，整条业务链路如何说明？</summary></details>
<p>原记录未披露真实模块依赖、模型路由或最终业务产物。可按职责说明：AC提供精确词条信号，向量检索补语义候选，模型完成分类或判断，编排层根据任务与结果决定后续动作；这是备考组织框架，实际串并行、授权与失败处理须以项目证据说明。</p>

<details data-knowledge-key="llm-alignment"><summary>（7）多路打标的大模型端到端微调怎样完成，包括数据集构建、切分、输入输出，以及分层预测和端到端预测的比较？</summary></details>
<p>先定义标签与标注指南，去重后按任务目标隔离时间或实体，再固定预测时可用输入、结构化输出和训练损失掩码。分层预测便于约束标签空间但可能逐层传播错误，端到端直接输出标签集合也需校验格式与层级一致性；在相同测试协议下比较逐标签质量、完整输出、时延和成本，原项目数据与结果仍未知。</p>

<details data-knowledge-key="distributed-training-parallelism"><summary>（8）DDP（Distributed Data Parallel）分布式训练的原理是什么？</summary></details>
<p>每个进程持有模型副本、处理各自数据并反向计算，Reducer将就绪梯度按桶进行 all-reduce，部分通信可与反向计算重叠。副本从一致状态取得同步梯度后各自执行相同更新；应用仍需正确分片数据、核对有效批次和 loss 归约，DDP不会自动解决单卡模型状态放不下的问题。</p>

<details data-knowledge-key="distributed-training-parallelism"><summary>（9）除数据并行外，模型并行可以怎样实现？</summary></details>
<p>张量并行把同一层的权重或算子拆给多设备，流水线并行把不同层或阶段分给设备，通过微批次传递激活与反向梯度。前者关注层内通信，后者关注调度、阶段均衡和气泡；组合使用时要明确并行组、状态归属与实际互联代价。</p>

<details data-knowledge-key="recommendation-ranking-models"><summary>（10）LightGBM 的核心原理是什么，怎样说明推荐项目从它比较到 DCN-V2 与 MMoE 的过程？</summary></details>
<p>LightGBM沿梯度提升逐轮增加树，并用直方图与 leaf-wise 分裂提高效率；DCN-V2侧重显式特征交叉，MMoE用各任务门控混合共享专家。应按原项目的失败、受控消融、每任务效果与部署成本解释选择，不能将三者说成固定串联，原记录没有给出实测升级收益。</p>

<details data-knowledge-key="algorithm-hash"><summary>（11）给定整数数组 nums 和整数 k，统计和为 k 的连续子数组个数（力扣 560）；本地编写并测试 nums=[1,1,1], k=2 及 nums=[1,2,3], k=3。</summary></details>
<p>令当前前缀和为 S，查询此前 S-k 的出现次数并累加，再把 S 的频次加一；初始频次0为1，用来覆盖从数组首项开始的区间。必须先查询再写入，且保存频次而非最早位置，才能正确处理重复前缀和与 k=0；两个指定输入结果均为2，一般整数含负数时不能无条件套滑动窗口。</p>

## 关联知识

- [FastText、TextCNN 与 TinyBERT：文本分类和多标签选型](../../../knowledge/data/analysis/text-classification-model-selection.md)
- [推荐排序模型：LightGBM、DCN-V2 与 MMoE](../../../knowledge/data/analysis/recommendation-ranking-models.md)
- [Trie、前缀检索与自动补全](../../../knowledge/cs/algorithm/algorithm-trie.md)
- [哈希表、缓存与去重](../../../knowledge/data-structure/algorithm/algorithm-hash.md)
- [模型对齐：SFT、偏好数据与安全](../../../knowledge/llm/basics/llm-alignment.md)
- [分布式训练：数据、张量与流水线并行](../../../knowledge/llm/basics/distributed-training-parallelism.md)
- [智能体定义、类型、PEAS 与 Agent Loop](../../../knowledge/llm/agent/agent-architecture.md)
