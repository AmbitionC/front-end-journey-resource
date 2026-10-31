不平衡二分类首先是一个决策问题：正类代表什么，漏掉它和误报它分别有什么代价，模型分数怎样变成行动。本文把目标定义、数据切分、训练策略、阈值和特征重要性连成一条可验证的流程，避免用一个高准确率替代完整判断。

以下以普通二分类为范围，不假定任何面试项目采用了某个模型或特征方案。表中的人数与代价全部是可手算的教学样例，不是业务实验结果。

## 分类、排序与特征工程先分开

二分类给每个样本预测类别，或输出对正类的分数，再依据阈值决定是否采取行动。排序关心同一请求或候选集合中谁应排在前面，验收可能涉及前 K 位相关性、覆盖和位置效果。同一个分数可以拿来排序，也可以设阈值分类，但两种用法的目标与指标并不因此相同。

例如在招聘意向任务里，要先问标签是点击、明确表达意向，还是后续达成某个业务事件，并确定观察窗口。若目标是决定是否触达某个人，可讨论分类与决策代价；若目标是给一位用户排列一组岗位，则要定义候选集合和排序标签。原始日志里只有“没发生事件”，也未必等于成熟的负类：可能尚未到标签观察期限，或根本没有获得曝光。

特征是决策时可获得的输入。应先确认其实体、时间窗口和来源，再考虑表示方式；不能用预测之后才产生的行为或最终结果作为输入。特征与标签的时间对齐、线上线下一致性可继续阅读[Feature Store 基础](feature-store.md)。

## 不平衡为什么会让准确率误导

混淆矩阵把预测与真实类别组合成四种计数：TP 为正类被正确识别，FN 为正类被漏掉，FP 为负类被误报，TN 为负类被正确排除。由它们得到：

$$
\mathrm{Precision}=\frac{TP}{TP+FP},\quad
\mathrm{Recall}=\frac{TP}{TP+FN},\quad
F_1=\frac{2TP}{2TP+FP+FN}
$$

假设固定测试集中有 1000 个样本，其中只有 10 个正类：

| 教学策略 | TP / FP / FN / TN | Accuracy | Precision | Recall | F1 |
|---|---|---:|---:|---:|---:|
| 全部预测负类 | 0 / 0 / 10 / 990 | 99.0% | 未定义 | 0% | 0 |
| 候选 B | 8 / 12 / 2 / 978 | 98.6% | 40.0% | 80.0% | 0.5333 |
| 候选 C | 5 / 1 / 5 / 989 | 99.4% | 83.33% | 50.0% | 0.6250 |

第一行没有预测正类，Precision 的分母为零，数学上未定义；实现若按约定返回 0，报告中应说明。B 比“全负”准确率低，却找回了八个正类。C 的 F1 更高，也不能据此认定业务一定更好：若仅为教学假设设定一次漏报代价为 10、误报为 1，则三行的代价分别是 100、32、51，B 的总代价反而更低。代价要来自实际业务合同，不是通过指标名称猜测。

Precision 与 Recall 必须在同一数据分布和阈值上解释。PR 曲线展示阈值变化下的取舍，AP 用召回增量加权汇总 Precision；它与对曲线作梯形积分得到的面积不总相同，报告时应标明计算口径，不能笼统把所有结果都叫同一种 PR-AUC。[scikit-learn：Precision–Recall 与 AP](https://scikit-learn.org/stable/auto_examples/model_selection/plot_precision_recall.html)

## 从标签到验收：哪些步骤允许调优

先冻结标签、实体和时间切分，再在训练范围拟合预处理和模型。验证集用于比较模型、特征、训练策略与阈值；最终测试集用于对冻结方案进行独立验收。若同一个用户、相邻窗口或近重复样本跨集合泄漏，即使正负比例保持一致，也可能高估泛化能力。

图中将“训练”和“验证决策”分开：验证数据可以参与方案选择，但测试集不能成为反复试阈值的反馈源。模型或数据方案因测试结果而重新设计后，需要重新定义独立验收协议。

![定义标签和切分后，仅在训练集拟合，在验证集选方案，冻结后独立测试并通过验收上线监控](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/imbalanced-classification-evaluation-dataflow-v2.png)
*图：按 1→5 阅读主流程。训练拟合、验证选择与冻结后的独立验收彼此分开；采样、标准化及特征选择不能先在全量数据上拟合，再切出一个看似独立的测试集。*

把标准化、缺失值处理或特征选择放在训练折内拟合，验证和测试只应用已经学到的转换。交叉验证时，每一折也要维持这条边界。scikit-learn 的 Pipeline 能帮助组织拟合与变换，但不能自动修复错误标签、时间穿越或实体泄漏。[scikit-learn：数据泄漏与预处理](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage)

## 类别权重与采样是候选策略，不是必做步骤

先建立保持原始训练分布的可解释基线，检查正类样本是否足以覆盖不同切片。随后可以比较类别权重、欠采样、过采样或其他适用方法，观察它们对目标指标、概率校准和少数切片的影响。简单复制样本不会创造新信息，合成样本也不能保证符合真实业务分布。

例如 scikit-learn 的 LogisticRegression 提供 `class_weight`，其中 `balanced` 按训练输入中的类别频次调整权重；它改变损失中的样本贡献，不保证某个阈值下达到理想 Precision 或 Recall，也不是对所有模型都通用的参数。[LogisticRegression：class_weight](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)

若使用采样，应在数据切分之后，只作用于训练部分；调参交叉验证时也只处理当前训练折。验证集和测试集应保留目标使用场景中要评估的分布，或明确说明抽样与重加权合同。否则，把大量负类从测试集中删掉后得到的 Precision，可能无法代表真实线上流量。

## 阈值如何和业务目标对应

模型分数、校准概率和最终决策是三个层次，默认 0.5 并不是普遍最优阈值。可以在验证集上按“Recall 不低于目标时，控制误报”“每日人工审核容量”“预定义漏报和误报代价”等条件选择阈值，同时报告样本数和不确定性。目标与代价必须先约定，不能看完测试集才挑一个最漂亮的指标。

ROC 与 PR 回答不同问题；哪一种汇总更适用取决于任务，二者都不替代最终操作点的检查。如果正类比例或标签成熟度变化，即使某些排序能力看起来相近，实际 Precision 和待处理数量也可能变化。上线后应监控分数、标签延迟、正类比例及关键切片，并在新的验证协议下调整；需要概率可信度时，另行检验校准。

## “特征重要”到底重要在哪里

特征重要性是关于某个模型、某份数据和某个评分指标的判断。置换重要性的基本做法是：记录当前模型的验证分数，打乱一列特征，再看分数下降多少，并重复置换观察波动。它衡量该模型对这列信息的依赖，既不是特征固有价值，也不是因果效应；模型本来就很差时，低重要性尤其不能证明特征无用。[scikit-learn：置换重要性](https://scikit-learn.org/stable/modules/permutation_importance.html)

高度相关的特征可能互相替代，打乱其中一个仍有另一个可用，从而得到偏低的单列重要性。可按业务含义比较特征组的消融，或删去候选组后重新训练，在相同验证协议下比较，并把模型变化与单次置换分开。也不要只凭树模型的内部重要性排名决定删列，更不能把“高重要性”解释为修改该特征一定会造成同样业务提升。

## 实践时保留什么证据

一份可复核报告应包括正类定义和成熟窗口、时间与实体切分、训练时拟合/采样的位置、模型及特征版本、验证时选定的阈值和选择规则，以及冻结后测试集的混淆矩阵、切片指标和样本数。这样才能判断收益来自更好的模型、不同阈值，还是数据泄漏和评测口径变化。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 AI 应用实习面试：模型服务、RAG 与分类评估](../../../interview/kuaishou/ai/kuaishou-ai-15.md)
<!-- interview-source-history:end -->

## 参考资料

- [scikit-learn：Precision–Recall 示例与 AP 口径](https://scikit-learn.org/stable/auto_examples/model_selection/plot_precision_recall.html)
- [scikit-learn：Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html)
- [scikit-learn：LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
- [scikit-learn：Permutation feature importance](https://scikit-learn.org/stable/modules/permutation_importance.html)
- [scikit-learn：Permutation Importance with Multicollinear or Correlated Features](https://scikit-learn.org/stable/auto_examples/inspection/plot_permutation_importance_multicollinear.html)
