美团北斗大模型算法秋招的一至四面自述，面试日期未披露。四轮合为一个流程，以下选择奖励、训练信号与工具参数三组问题。

经历和岗位来自候选人自述，未独立认证；以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案。未披露条件先澄清，教学假设会单独说明。

<details data-knowledge-key="agentic-rl">
<summary>（1）怎样设计 reward model 与过程监督信号，并解释过程信号的可复用范围？</summary>
</details>

短答：先定奖励监督整条结果还是某个步骤。过程监督需要可判定的步骤边界、前缀上下文与对齐标签；奖励模型预测分数，不会自动证明最终任务正确。

详解：例如教学步骤“2+3=5”正确，“5×2=12”错误，标签必须说明是判当前步骤还是整个前缀。可用过程信号训练、排序候选或定位错误，但需检查标签噪声、前序错误传播、投机与分布外效果，并用独立终局验证看任务是否完成。作者论文与实验未披露，不能复原其方案。

知识导航：[Agentic RL：长时序信用分配与策略优化](../../../knowledge/llm/agent/agentic-rl.md)。

<details data-knowledge-key="agentic-rl">
<summary>（2）GRPO 训练怎样兼顾效率和稳定性，出现原文所说“全 0 或全 1”时应先核查什么？</summary>
</details>

短答：先确认“全0/全1”指哪个量。若指同一问题组内奖励都相同，相对优势没有区分度；数值保护可避免除零，却不会创造学习信号。

详解：检查评分器与解析、难度、截断、采样多样性和有效组比例，再评估数据配比、课程、采样或奖励。别把零方差等同整个训练梯度必为零，KL等其他项可能仍更新。过滤同分组也要限制生成预算、记录剩余分布，不能把困难题全删后只报奖励变好。实现配置按实际训练器版本核查。

知识导航：[Agentic RL：长时序信用分配与策略优化](../../../knowledge/llm/agent/agentic-rl.md)。

<details data-knowledge-key="agent-tool-design">
<summary>（3）Agent 调用多参数工具时，怎样降低参数幻觉并界定未来方案的验证方式？</summary>
</details>

短答：缩窄工具与参数，能从服务端或既有结果取得的字段不让模型猜。结构校验后还要检查资源、业务状态和权限；缺少必要信息先澄清。

详解：严格Schema能约束形状，不能保证订单真实、日期合理或当前主体有权。把失败分为可修参、可重试、拒绝与结果未知，限制修正次数；副作用以稳定操作ID查询或对账。未来方案需要相同任务上的参数正确率、成功率与风险指标，不能把某种协议说成已经消除幻觉。

知识导航：[Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)。

## 参考资料

- [TRL0.25：PRM逐步标签](https://github.com/huggingface/trl/blob/v0.25.0/docs/source/prm_trainer.md)
- [TRL：奖励建模](https://github.com/huggingface/trl/blob/main/docs/source/reward_trainer.md)
- [TRL1.16：GRPO优势与指标](https://github.com/huggingface/trl/blob/v1.16.0/docs/source/grpo_trainer.md)
- [MCP：工具校验与访问控制](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [OpenAI Docs：Function Calling严格模式](https://developers.openai.com/api/docs/guides/function-calling#strict-mode)
