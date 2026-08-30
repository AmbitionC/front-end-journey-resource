Agentic RL 不是给普通问答换一个新名字，而是把模型放进会持续变化的环境：模型要读取观察、选择动作、调用工具，再根据新观察继续决策。轨迹可能跨几十到几百步，最终奖励却只在任务结束时出现。真正的难点因此从“怎样给一段回答打分”扩展成“怎样解释一条长轨迹为什么成功或失败”。

![Agent 在长时序中反复观察、行动和调用环境，稀疏终局奖励需要跨越整条轨迹完成信用分配](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agentic-rl-long-horizon-credit-assignment-v1.png)
*图：轨迹越长，中间动作越多，终局奖励越难准确归因；训练还要面对环境随机性与部分可观测状态。*

## 先定义轨迹，而不是先选算法

一条 Agent 轨迹可写成：

$$
\tau=(s_0,a_0,o_0,s_1,a_1,o_1,\ldots,s_T,R_T)
$$

- $s_t$ 是策略在第 $t$ 步可见的状态，包括指令、上下文、工具结果与预算；
- $a_t$ 可以是文本 Token、工具调用、搜索查询、代码或停止动作；
- $o_t$ 是环境返回的观察；
- $R_T$ 是最终任务结果，也可能另有过程奖励。

与单轮回答相比，Agent 轨迹通常长度不固定，工具和环境可能随机，模型看到的状态还可能经过摘要或裁剪。训练样本必须同时记录模型版本、工具协议、环境版本、旧策略概率、超时和终止原因，否则相同文本并不代表相同决策过程。

## 为什么长时序信用分配困难

假设最终测试通过，早期的需求澄清、中间的搜索和最后的代码修改都可能有贡献；如果失败，也不能把责任平均分给每一步。困难主要来自：

- **稀疏与延迟奖励**：中间动作没有直接标签，最终信号要传播到很早的决策；
- **误差累积**：一次错误检索会改变后续状态，后面的正确动作也可能无力挽回；
- **高方差**：工具结果、网络、沙箱和外部数据会让同一策略产生不同结果；
- **部分可观测**：摘要可能丢失历史，模型无法从当前状态还原真实原因；
- **真实副作用**：写文件、发请求和修改环境让“重放同一轨迹”不再天然安全。

过程奖励可以提供更密集信号，但也可能奖励表面步骤或被模型投机。正确做法不是无条件增加打分点，而是让步骤结果可验证，并用独立终局验证确认任务真的完成。

## PPO：Critic 与 GAE 分工

[PPO](https://arxiv.org/abs/1707.06347)通过新旧策略概率比的裁剪限制单次更新幅度。Actor-Critic 中，Critic 估计状态价值 $V(s_t)$；Actor 更新需要的则是动作相对基线有多好，即优势 $A_t$。

[GAE](https://arxiv.org/abs/1506.02438)先计算 TD 残差：

$$
\delta_t=r_t+\gamma V(s_{t+1})-V(s_t)
$$

再按指数权重组合未来残差：

$$
\hat A_t=\sum_{l=0}^{\infty}(\gamma\lambda)^l\delta_{t+l}
$$

$\lambda$ 在偏差与方差之间折中。Critic 提供基线，GAE 负责把多步奖励组合成优势；“已有 Critic，所以不需要 GAE”混淆了价值估计与优势构造。

## GRPO：用组内相对表现替代 Critic

[DeepSeekMath](https://arxiv.org/abs/2402.03300)提出的 GRPO 对同一问题采样一组回答，用组内奖励的均值和标准差构造相对优势，不再训练单独的 Critic。它降低了价值模型的内存与训练成本，但不自动解决长时序归因：常见做法会把一个序列级优势分配给整条回答中的 Token。

当一组样本全对或全错时，归一化后的相对信号可能失效；当奖励只看终局时，模型仍不知道哪一个工具动作真正促成结果。因此需要关心组采样是否有区分度、奖励是否可靠，以及损失如何在 Token 与序列之间归约。

## Clip 与 KL 不是同一个约束

PPO Clip 截断采样动作的新旧概率比，超过区间后不再鼓励继续朝该方向变化。它是局部代理目标，不是整体策略 KL 的硬上界。

KL 则比较两个完整分布，可用于约束新策略不要偏离旧策略，也可在 RLHF 中约束策略不要偏离冻结参考模型。两者对象和目的可能不同。实践中可以同时使用 Clip、KL 监控、目标 KL 和提前停止，不能把它们说成完全等价。

## DAPO：不只是“Token 级损失”

[DAPO](https://arxiv.org/abs/2503.14476)针对长推理训练组合了四项关键设计：

1. **Clip-Higher**：提高正向裁剪上界，给低概率优质动作更多提升空间；
2. **Dynamic Sampling**：过滤组内奖励完全相同的样本，让相对优势保留有效信号；
3. **Token-Level Policy Gradient Loss**：在一批有效 Token 上归一化损失，避免先对每条序列等权平均造成长度偏置；
4. **Overlong Reward Shaping**：对过长输出采用更平滑的惩罚，避免突然截断带来噪声。

Token 级归约说的是怎样汇总损失，并不表示原生 GRPO 没有 Token 概率比，也不等于每个 Token 获得了独立、准确的因果奖励。

## DSPO：让优化单位贴近终局奖励

[DSPO](https://arxiv.org/abs/2510.09255)面向稀疏终局奖励的 Agentic Search，把整条轨迹 Token 概率比的几何平均作为序列级重要性比，并在序列级统一裁剪。它还动态过滤组内结果完全一致的样本，只保留同时出现成功与失败轨迹的组。

这能减少长轨迹中逐 Token 权重噪声累积，并让优化单位更接近“整条轨迹是否成功”的奖励单位。不过它解决的是特定问题，不意味着所有任务都应抛弃 Token 级或过程级信号；当可靠的步骤验证存在时，分层奖励仍可能更合适。

## 把上下文压缩视为环境转移

Agent 可见上下文可以被压缩，但训练器不应丢弃完整历史。若多个不同历史被压成同一摘要，策略看到的是状态混叠，优势估计很难解释最终奖励。

更稳妥的记录方式是：

- 外部持久化原始消息、动作、工具返回与旧策略 Log Probability；
- 记录压缩器版本、输入范围、摘要与被删除片段的引用；
- 把压缩动作显式写入轨迹，在压缩边界建立检查点；
- 分别评估任务成功率、状态恢复率和关键信息保真度。

这样推理时仍能节省上下文，训练与审计时又能还原因果链。

## Reward Hacking 与安全边界

Agent 能修改文件、测试、搜索结果或评审输入，因而比纯文本模型拥有更多“改变评分器而不完成目标”的路径。奖励、隐藏测试和验证器应放在 Agent 无权修改的边界外；工具采用最小权限，副作用可审计，最终成功由环境真实状态决定。

评测还应包含冻结保留集、对抗任务、人工抽检与失败类型分析。奖励模型分数、通过率和任务终态要分开报告，避免一个代理指标掩盖投机行为。

## 训练与评估检查表

1. 状态、动作、环境和终止条件是否有明确版本？
2. 奖励对应 Token、步骤、阶段还是整条轨迹？
3. 组采样是否同时包含成功与失败，优势是否有区分度？
4. 上下文压缩后，原始轨迹和旧策略概率是否仍可追溯？
5. Clip、KL、梯度、轨迹长度和超长比例是否同时监控？
6. 最终验证器是否独立于 Agent 权限与训练奖励？
7. 环境随机性、工具失败和副作用重放是否有隔离测试？

## 小结

Agentic RL 的核心挑战是长轨迹上的信用分配与分布控制。PPO 用 Critic 和 GAE构造时序优势，GRPO 用组内相对奖励省去 Critic；DAPO改进采样、裁剪和 Token 归约，DSPO 则把稀疏终局奖励与序列级优化对齐。无论采用哪种算法，完整轨迹、可复现环境、外置验证器和权限边界都比单个损失公式更重要。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [淘天 Agent 算法一面：任务构造、轨迹验证与后训练（2026 年 8 月）](../../../interview/alibaba/ai/alibaba-ai-4.md)（cluster-787120ee1249）
- [腾讯大模型算法岗一二面：Agentic RL、PPO/GRPO 与 DeepSeek V4（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-7.md)（cluster-daad361f34b4）
<!-- interview-source-history:end -->

## 参考资料

- [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)
- [High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438)
- [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models](https://arxiv.org/abs/2402.03300)
- [DAPO: An Open-Source LLM Reinforcement Learning System at Scale](https://arxiv.org/abs/2503.14476)
- [DSPO: Dynamic-filter Sequence-level Policy Optimization for Agentic Search](https://arxiv.org/abs/2510.09255)
