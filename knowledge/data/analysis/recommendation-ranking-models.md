LightGBM、DCN-V2 和 MMoE 回答三个不同问题：怎样用树逐步改进预测，怎样学习显式特征交叉，以及多个任务怎样共享专家。它们可以是比较对象，也能在明确设计下组合；“从树演进到深度多任务模型”应是一条有证据的实验路线，而不是模型名称决定的结论。

## 先明确排序要预测什么

先定义请求、候选物品、决策时可用特征、标签观察窗口与业务目标。点击、转化、满意度可能相关，却不等价；只在点击样本中观测到的转化标签，还涉及条件分布和选择偏差。候选生成与排序的职责可先阅读[动态画像与图召回](../storage/recommendation-profile-graph-recall.md)，本文专注评分模型。

同一个模型家族可以按不同损失训练：例如二分类概率、回归分数或排序目标。不能因为产品叫推荐，就默认 LightGBM 一定使用某个排序损失，也不能把每条样本的 AUC 直接当作完整列表的用户价值。

## LightGBM：逐轮增加树，修正当前预测

梯度提升把预测写成多个弱学习器的加和：

$$
F_t(x)=F_{t-1}(x)+\eta f_t(x)
$$

每轮根据当前损失的梯度等统计寻找新的树和叶子输出，使目标进一步改善；不是让每棵树独立训练后多数投票。任务目标决定梯度，不能将所有分类、回归和排序场景都简单描述成拟合原始残差。

LightGBM 用直方图把连续特征值离散到 bins，累积统计并评估分裂，减少候选阈值处理与存储开销；leaf-wise 生长优先拆分增益最大的叶子，而不是同层所有节点一起扩张。小数据或复杂树仍可能过拟合，要结合叶子数、深度、叶子最小样本与正则等约束调参。[官方 Features](https://lightgbm.readthedocs.io/en/stable/Features.html)说明直方图、直方图相减和 leaf-wise 的机制与边界。

因此一份可解释的树模型基线包括：固定输入特征与时间可用性，选定目标，记录验证曲线和早停方案，再查长尾切片与部署成本。类别型特征如何编码也要与库版本、训练及服务合同一致，不能认为所有类别 ID 当数值阈值切分都合理。

## DCN-V2：让特征交叉有显式路径

用户、物品与上下文的组合可能比单一特征更有用。若输入表示为 $x_0\in\mathbb{R}^d$，一个矩阵形式的 cross layer 可写为：

$$
x_{l+1}=x_l+x_0\odot(W_lx_l+b_l)
$$

逐层保留原始 $x_0$，与当前表示变换后做逐元素乘法并加残差，形成可学习的显式交叉。增加交叉层能提高所表示的多项式阶数，但不保证越深越好。深层 MLP 可学习隐式非线性，两种分支可以并行拼接，也可以按方案堆叠。[TensorFlow Recommenders 的 DCN 教程](https://www.tensorflow.org/recommenders/examples/dcn)展示矩阵交叉、组合结构和低秩版本；[Cross 层 API](https://www.tensorflow.org/recommenders/api_docs/python/tfrs/layers/dcn/Cross)给出具体运算定义。

全矩阵表达更灵活，也增加参数与计算。若用 $W\approx UV$ 低秩分解，计算可先压到较小维度再恢复，节省程度与 rank、实现和输入维度有关；不能直接承诺效果不变。矩阵权重反映模型依赖的交叉，也不是因果效应证明。

## MMoE：不同任务学习不同专家配比

多任务模型既希望共享有用模式，又不希望一个任务把另一个拖偏。MMoE 共享多个专家 $E_i(x)$，但为任务 $k$ 配置自己的门控 $g_k(x)$ 与任务头 $h_k$：

$$
u_k(x)=\sum_i g_{k,i}(x)E_i(x),\qquad \hat y_k=h_k(u_k(x))
$$

若门控采用 Softmax，可得到归一化的专家权重。这里归一化的是“专家组合权重”，与多标签输出层用 Sigmoid 是两件事。专家内部可以是子网络，不要求每个专家天然对应某个有名字的业务群体；门控也不自动解决全部任务冲突。[MMoE 原作者研究页](https://research.google/pubs/modeling-task-relationships-in-multi-task-learning-with-multi-gate-mixture-of-experts/)说明共享专家与每任务独立门控的设计。

下面给出一种可选的“交叉表示 + 多任务共享”组合。输入先产生 cross 与 deep 表示，组合后的 $z$ 供专家和各任务门控读取；LightGBM 仍是独立比较基线，不是该网络必须经过的一层。

![输入表示进入 Cross 与 Deep 两路并拼接为 z，共享专家提供候选表示，每个任务用自己的门控混合专家并经过点击或转化任务头](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/recommendation-ranking-models-cross-mmoe-20261115.png)
*图：表示学习与任务共享是可分开的设计维度；图示是教学方案，不代表任何具体公司的项目实现。*

## 从树模型比较到交叉与多任务模型

合理的迭代首先说明失败：是类别交叉表达不足，特征工程维护困难，还是多个目标无法用单一头处理？随后分开检验假设，避免一次换模型、加特征、改标签又调阈值，最后无法解释收益来源。

| 对照 | 想回答的问题 | 保持一致的条件 |
| --- | --- | --- |
| 树基线与单任务深度基线 | 表示与归纳偏置是否适合当前数据 | 特征可用时点、标签、评测请求与预算 |
| Deep 与加入 Cross 的版本 | 显式交叉是否带来增益 | 输入、任务头、训练/调参资源与验收协议 |
| 单任务、共享底座与 MMoE | 任务共享是否有效、是否负迁移 | 每任务样本口径、损失权重与缺失标签处理 |

这些是建议的消融维度，不是必须跑出的结论。MMoE 的任务权重、样本缺失和梯度冲突会影响各任务结果；总体平均改善也可能掩盖重要任务退化。离线应报告每任务指标、用户或物品切片以及概率校准需求；线上还需在获准试验中检查真实业务指标、尾延迟与资源成本。

时间切分要防止用未来点击或转化构造历史特征；同用户、同物品或近重复跨集合是否泄漏，取决于要验收的泛化目标。模型变大并不会修复数据问题。复杂模型只有在质量收益、稳定性、服务代价和维护成本同时有证据时，才构成可辩护的升级。

## 面试中如何说明选择

按“目标与数据合同 → 基线 → 失败样例 → 单变量对照 → 每任务结果 → 线上约束”展开。能说清 LightGBM 的 boosting 与分裂机制、DCN 的交叉、MMoE 的任务门控，比背三个名字更有解释力。没有实际试验数据时，只讨论可能的设计理由，不能替当事人补造上线收益或固定演进路径。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [华为后训练与强化学习实习一面：分类模型、训练并行与排序](../../../interview/huawei/ai/huawei-ai-4.md)
<!-- interview-source-history:end -->

## 参考资料

- [LightGBM：Features](https://lightgbm.readthedocs.io/en/stable/Features.html)
- [TensorFlow Recommenders：Deep & Cross Network](https://www.tensorflow.org/recommenders/examples/dcn)
- [Ma 等：Modeling Task Relationships in Multi-task Learning with Multi-gate Mixture-of-Experts](https://research.google/pubs/modeling-task-relationships-in-multi-task-learning-with-multi-gate-mixture-of-experts/)
- [TensorFlow Recommenders：Cross 层 API](https://www.tensorflow.org/recommenders/api_docs/python/tfrs/layers/dcn/Cross)
