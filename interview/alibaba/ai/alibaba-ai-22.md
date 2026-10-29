### 阿里云 AI Infra 一面：FlashAttention 与 AI Coding

候选人自述为阿里云 AI Infra 一面，方向是大模型推理性能优化与加速，线上约30分钟、1位面试官。标题仅记“0914”，面试年份未明。

面试经历、岗位方向与轮次来自候选人自述，未独立认证。下列短答与教学例子由编辑补充，不是候选人现场答案或企业标准答案。

<details data-knowledge-key="transformer-arch">
<summary>（1）FlashAttention 的核心实现思路是什么，它主要优化什么？</summary>
</details>
<p>它把注意力计算按块组织，复用片上内存中的数据，避免反复读写完整的n×n注意力中间矩阵。通过逐块维护Softmax归一化统计与输出累积，数学上仍对应标准精确Attention；浮点实现可能有数值差异。优化重点是数据搬运和中间显存，没有把稠密注意力的两两交互变成线性计算。实际收益要固定硬件、输入形状和精度测量。</p>

<p>教学例子（非原项目基准）：在全量注意力的量级设定中，长度从n变为2n，位置对由n²增至4n²。分块可以减少完整矩阵的物化与搬运，却不意味着这些交互自动消失，也不能据此承诺固定加速倍数。</p>

技术核对：[Triton：Fused Attention](https://triton-lang.org/main/getting-started/tutorials/06-fused-attention.html)。

知识导航：[Transformer 架构原理](../../../knowledge/llm/basics/transformer-arch.md)。

<details data-knowledge-key="agent-coding">
<summary>（2）怎样高效使用 AI Coding，让结果更贴合需求？</summary>
</details>
<p>先给出目标、验收样例、允许修改范围和现有约束，让AI读取相关代码、调用方与测试，再按依赖拆成可验证的小任务。一次完成连贯的小补丁，按影响运行验证并审查diff；把错误信息和真实测试结果反馈到下一轮。保留代码基线、用户已有修改和上下文记录，效率用成功交付、返工和成本衡量，不能只看生成速度或模型自称完成。</p>

<p>教学例子（非原项目经历）：修复空输入崩溃时，先提供可复现输入与期望行为，再让AI提交小补丁，运行覆盖该输入的回归检查并审查差异；测试未运行就标明未验证，不能把代码已经生成当成修复成功。</p>

技术核对：[SWE-bench：仓库任务与测试评测](https://www.swebench.com/original.html)、[Git：diff比较](https://git-scm.com/docs/git-diff)。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)。
