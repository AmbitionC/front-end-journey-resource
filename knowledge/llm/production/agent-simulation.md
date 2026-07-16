Agent 场景测试若只准备一句用户输入和几个 Mock 返回值，通常覆盖不了多轮协商、世界状态变化、延迟、失败和取消。模拟测试把外部交互拆成两个独立系统：用户模拟器决定“人下一步会做什么”，环境模拟器决定“工具和世界如何变化”；被测 Agent 只通过正式接口接收观察、发出动作。

[NIST 的 AI TEVV 工作](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)强调使用任务、挑战问题、测试床和有意义的数据集，并说明测量方法的局限。模拟器正是一类测试床：它能扩大覆盖和控制故障，但它产生的是“在模型化环境中的证据”，不是现实世界的自动替代品。

![用户模拟器与环境模拟器围绕被测 Agent 独立运行](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-simulation-dual-loop-v1.webp)

图中两条循环必须分开。用户模拟器拥有目标、角色、观察、决策与消息；环境模拟器拥有世界状态、规则、工具效果、时钟与失败。若把两者合成一个“全知模拟 LLM”，它可能偷偷读取 Agent 内部状态、替工具修正错误，最终让测试结果过度乐观。

## 用户模拟器建模什么

用户模拟器描述可观察行为，而不是替用户写一篇心理小说。一个可执行角色应包含：

```yaml
persona: impatient_new_user
goal: complete_refund
knowledge: [order_id]
unknown: [refund_policy, internal_status]
preferences:
  max_turns: 6
  accepts_clarification: true
  abandons_after_seconds: 45
behavior_policy:
  - if asked_for_known_field: answer_truthfully
  - if asked_twice: express_frustration
  - if goal_satisfied: stop
  - never_invent_internal_data
```

关键是信息边界：模拟用户只知道角色允许知道的内容，不能访问工具结果、系统 Prompt 或隐藏答案。它可以有噪声、误解、改口和中途离开，但这些行为要来自显式策略与随机种子，不是每次临场发挥。

用户模拟器的输出至少包含消息、当前信念、是否继续和停止原因。测试断言不应只看它最后说“满意”；还要检查真实世界状态是否满足目标，因为模拟 LLM 可能被一段流畅但错误的解释说服。

## 环境模拟器建模什么

环境模拟器负责工具和世界的状态转移。例如退款场景可能包含订单状态、支付状态、库存、时间窗口和通知队列。每个动作经过规则得到新状态和观察：

```text
transition(state, action, clock, injected_fault) -> {
  next_state,
  observation,
  side_effects,
  events
}
```

规则优先使用确定性代码或状态机，使失败可重放。需要自然语言文档或复杂网页时，可以加入生成组件，但最终的金额、权限、状态和副作用仍由确定性内核决定。否则模拟器和被测 Agent 都由模型自由生成，失败时无法判断谁错了。

环境应支持虚拟时钟。超时、令牌过期、预约窗口、队列延迟和重试退避不应靠真实等待几十分钟测试；推进虚拟时间并发出对应事件，可以快速覆盖这些路径。

## 观察与动作契约

Agent 不应拿到模拟器内部对象，只能收到和生产接口同形的观察；模拟器也只能接受正式工具动作。这样场景测试才能发现 Schema、权限与错误映射问题，而不是通过专用测试捷径绕过它们。

每次交换记录 `episode_id`、turn、动作、观察、状态版本、模拟器版本、随机种子和 Trace ID。动作执行后验证后置条件，再将有限观察返回 Agent。对于敏感字段，模拟环境也要执行分类和脱敏，避免测试代码养成依赖明文密钥的习惯。

## 场景与注入计划

一个场景由初始状态、角色、目标、可用能力、故障时间表和停止规则组成：

```yaml
scenario: refund_with_timeout_then_retry
seed: 20260716
initial_world:
  order: {id: o-7, state: delivered, refundable: true}
faults:
  - on: refund.create:first_attempt
    return: timeout_after_commit
limits:
  max_turns: 8
  max_tool_calls: 5
  virtual_deadline: 120s
assert:
  - refund.count == 1
  - user_goal == satisfied
  - no_secret_in_messages
```

故障注入必须区分“提交前超时”和“提交后响应丢失”，后者专门验证幂等。还可以注入 429、部分响应、旧 Schema、跨租户对象、恶意文档、审批拒绝、用户取消和工具恢复。

## 停止规则防止无限对话

模拟测试必须有确定停止条件：目标满足、不可恢复失败、用户放弃、最大轮数、成本预算、工具调用预算或虚拟截止时间。模型说“我会继续尝试”不能覆盖硬限制。

停止原因本身是评估信号。达到最大轮数说明可能循环；用户放弃说明体验失败；预算耗尽说明计划效率差；安全策略阻断可能是正确结果。不要把所有非“goal_satisfied”都记成同一种失败。

## 覆盖而不是堆数量

随机生成一万条近似场景不一定比一百条分层场景更有效。建立覆盖维度：用户熟练度、目标类型、语言、澄清意愿、网络条件、工具错误、数据风险、权限、并发和恢复。用组合策略覆盖高风险交互，并记录每条场景落在哪些格子。

生产事故和人工评审发现的失败应转成固定回归场景；生成式探索负责发现新模式。二者分开统计：固定集衡量可比趋势，探索集寻找未知问题。把探索样本不断改动却仍叫“同一个 Benchmark”，会让版本无法比较。

## 校准模拟器

[NIST AI RMF 的生成式 AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)强调风险管理需要结合具体使用情境、生命周期评估和多方反馈。模拟用户也要用真实但合规的统计与人工观察校准，例如澄清率、放弃率、消息长度、常见误解和任务分布。

校准不意味着复制原始用户对话。可以提取分布和行为模式，使用合成内容，并让领域专家检查角色是否合理。对弱势群体、无障碍需求或高风险决策，模拟结果只能作为补充，不能代替代表性用户研究。

## 评估指标

每个 episode 同时报告：目标满足、状态正确、工具轨迹、安全不变量、轮数、延迟、成本、恢复方式和停止原因。对随机模拟报告分布与失败切片，不只给平均成功率。

[NIST 的实验设计说明](https://itl.nist.gov/div898/handbook/pri/section1/pri11.htm)指出，实验应预先明确目标、因素与响应，以得到有效、客观的结论。比较 Agent 版本时固定场景分配与随机种子，预先确定主指标和样本数；若模拟器也同时升级，结果变化无法只归因于 Agent。

## 常见误区

- 用户模拟器知道隐藏答案，自动给 Agent 关键提示。
- 环境由自由生成文本决定金额和权限，状态无法重放。
- 没有停止规则，模型之间礼貌往返直到预算耗尽。
- 只问模拟用户是否满意，不验证真实后置状态。
- 用大量同质随机样本替代风险覆盖矩阵。
- 看到模拟成功率就宣称现实用户一定成功，忽略情境差异。

## 小结

用户模拟器负责目标与行为，环境模拟器负责规则与世界状态，两者通过正式观察/动作接口与 Agent 交互。固定状态机、虚拟时钟、故障注入、停止规则和可追溯种子让测试可重放；覆盖矩阵、真实校准和清晰局限让结果可解释。模拟能扩大测试面，但不能越过现实验证和代表性用户反馈。

## 参考资料

- [NIST：AI Test, Evaluation, Validation and Verification](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)
- [NIST：AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [NIST：What is experimental design?](https://itl.nist.gov/div898/handbook/pri/section1/pri11.htm)
