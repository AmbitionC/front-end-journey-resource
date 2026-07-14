预训练模型会延续语料中的模式，却不会自动知道哪种回答更有帮助、更真实或更安全。偏好学习把“多个答案中哪个更好”转成训练信号。RLHF、RLAIF 和 DPO 都服务于这个目标，但反馈来源、优化路径和工程复杂度不同。

## 偏好数据是什么

一条典型偏好样本包含提示 $x$、较优回答 $y_w$（chosen）和较差回答 $y_l$（rejected）：

```text
prompt: 请解释为什么需要数据库事务
chosen: 先说明原子性，再用转账失败举例……
rejected: 事务就是让数据库更快……
```

评价者依据明确指南比较事实性、任务完成度、表达和安全边界。偏好是相对判断，不等于 chosen 完美，也不代表 rejected 在所有场景都错误。提示分布、评价者背景和指南都会进入最终模型。

## 三条常见训练路径

![RLHF、RLAIF 与 DPO 从偏好数据到策略模型的不同训练路径](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-rlhf-dpo-preference-paths-v1.webp)
*图：RLHF 与 RLAIF 通常先训练奖励模型再用强化学习更新策略；DPO 直接用 chosen/rejected 对优化策略，但三者都依赖偏好质量与独立评估。*

## RLHF：人工反馈加奖励模型

[InstructGPT](https://arxiv.org/abs/2203.02155) 展示了一套经典流程：先用人工示范做监督微调（SFT），再让标注者对模型输出排序，用排序训练奖励模型，最后以奖励为目标优化语言模型，同时约束它不要偏离参考策略过远。

可以把奖励模型理解为 $r_\phi(x,y)$：输入提示与回答，输出一个可比较分数。强化学习阶段会综合奖励和 KL 约束，例如：

$$
\max_\theta\;\mathbb{E}[r_\phi(x,y)]-\beta\,D_{KL}(\pi_\theta\Vert\pi_{ref})
$$

KL 项限制策略为追分而剧烈偏离原模型。RLHF 能在训练中持续采样当前策略的新回答，但需要维护采样、奖励模型和 PPO 等强化学习组件，调试成本较高。

## RLAIF：用 AI 扩展反馈

RLAIF 用模型生成、批评或比较回答，减少部分人工排序成本。[Constitutional AI](https://arxiv.org/abs/2212.08073) 让模型依据一组自然语言原则批评并修订回答，再从 AI 偏好反馈训练无害性。

“AI 反馈”不等于“没有人工参与”：人仍然选择原则、基础模型、提示、校准样本和验收标准。若反馈模型存在系统性偏差，它可以更便宜地复制偏差，因此通常需要人工抽检与独立红队。

## DPO：直接优化偏好对

[Direct Preference Optimization](https://arxiv.org/abs/2305.18290) 从带 KL 约束的奖励最大化推导出一个直接分类目标。训练时提高 chosen 相对 reference 的概率优势，同时降低 rejected 的相对优势，不必显式拟合奖励模型，也不需要在训练内运行 PPO rollout。

直观地说，DPO 学习的是：相对参考模型，当前策略应该更偏向 $y_w$ 而非 $y_l$。超参数 $\beta$ 控制偏好强度与偏离参考模型之间的权衡。

DPO 的流水线更简单，但不是“免费 RLHF”：它仍需高质量偏好对、参考策略、合适的采样分布和评估。若 rejected 太容易、偏好对覆盖狭窄，模型可能只学到表面格式；离线数据也难以及时暴露当前策略的新失败模式。

## 怎样选择

| 维度 | RLHF | RLAIF | DPO |
| --- | --- | --- | --- |
| 主要反馈 | 人工示范与排序 | AI 依据人工原则生成/判断 | 人或 AI 产生的偏好对 |
| 显式奖励模型 | 通常需要 | 通常需要 | 不需要 |
| 强化学习 rollout | 通常需要 | 通常需要 | 不需要 |
| 优点 | 可对当前策略在线探索 | 扩大反馈规模、减少敏感标注 | 实现稳定、训练链路较短 |
| 主要风险 | 奖励投机、训练不稳定、成本高 | 放大反馈模型偏差 | 离线覆盖不足、对数据构造敏感 |

如果已有可靠的 chosen/rejected 数据、训练基础设施有限，DPO 常是合理起点；如果需要持续探索模型当前输出、奖励可校准且有强化学习经验，RLHF 更灵活；RLAIF 适合扩展反馈，但必须保留人工治理。

## 共同风险与评估

- **Reward hacking**：模型找到评分器喜欢的措辞，却没有真正完成任务。
- **过度优化**：持续追逐代理奖励可能损害事实性、多样性或通用能力。
- **标注偏差**：少数评价者的风格被误当成普遍偏好。
- **位置与长度偏差**：评价者或 grader 可能偏爱第一项、长答案或自信语气。
- **安全—帮助性冲突**：拒绝更多可能提高某项安全分，却增加合规请求误伤。

评估应把训练偏好集与保留测试集分开，覆盖事实、推理、代码、多语言、安全和过度拒答；同时报告胜率、任务成功率和失败类型，不能只报告奖励模型分数。

## 小结

RLHF、RLAIF 与 DPO 是三种把偏好变成模型行为的路径。RLHF 用奖励模型和强化学习提供在线优化能力，RLAIF 扩大反馈规模，DPO 直接从偏好对学习、简化训练。决定效果的核心仍是目标定义、数据覆盖、参考策略和独立评估，而不是算法名称。

## 参考资料

- [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)
- [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073)
- [Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290)
