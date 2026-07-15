Agent planning 不是先写一串漂亮步骤，而是把目标、不可变约束、依赖、完成证据和预算变成可执行状态。计划在观察新结果后可以调整，但不能借“重新规划”绕过授权、无限循环或悄悄改变用户目标。

## 先冻结 Goal 与 Constraints

```ts
type PlanEnvelope = {
  goal: string;
  constraints: {
    deadline?: string;
    maxCost?: number;
    allowedTools: string[];
    forbiddenEffects: string[];
    approvalBoundaries: string[];
  };
  successRubric: string[];
};
```

Goal 描述结果，success rubric 描述可验证完成，constraints 由用户、策略与环境提供。执行中可以建议修改，但只有有权主体确认后才更新版本。模型不能因为某路径困难就删除约束。

## Task DAG 胜过线性清单

任务记录依赖、输入、输出、owner、状态和 done-when：

```ts
type PlanTask = {
  id: string;
  dependsOn: string[];
  action: string;
  evidenceRequired: string[];
  doneWhen: string[];
  status: 'pending' | 'ready' | 'running' | 'blocked' | 'done' | 'failed';
};
```

DAG 使无依赖任务可并行，也避免 B 尚未完成就启动依赖 B 的 C。Done 不是“Agent 说完成”，而是证据满足：测试输出、文件 hash、API 状态或用户批准。

![目标与约束锁定后形成带依赖和完成证据的任务 DAG，执行观察只能触发受时间、成本、轮次、重规划次数与审批边界约束的有限重规划](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-planning-replan-loop-v1.webp)
*图：无进展循环由 Loop Guard 终止并 Abstain；Replan 只修改未完成任务。*

## Plan、Act、Observe 分开

计划器选择下一 ready task，执行器调用工具，观察器把结构化结果写入状态。不要让工具自由文本直接重写计划；先校验 result 与证据，再决定状态转移。

[ReAct](https://arxiv.org/abs/2210.03629)研究将 reasoning trace 与 task-specific actions 交错，让行动从外部环境获取信息，观察又帮助更新计划和处理异常。工程实现不必暴露私有推理文本；保留可审计的 action、observation、decision reason 和 plan diff 即可。

## 何时 Replan

触发条件应明确：工具返回永久错误、假设被证伪、依赖数据变化、预算不足、用户改变目标或出现更安全路径。单次超时通常先按 retry policy 处理，不必重写整个 DAG。

Replan 输入为当前 envelope、未完成任务、结构化 observation 和剩余预算；输出是 plan diff：新增/删除/改依赖/改验收。已完成任务与外部副作用不可重写，除非明确 compensation。

```json
{
  "reason": "required dataset unavailable",
  "remove": ["B"],
  "add": [{ "id": "B2", "dependsOn": ["A"], "action": "use approved archive" }],
  "unchangedConstraints": true
}
```

## 分解要适度

[Plan-and-Solve](https://arxiv.org/abs/2305.04091)先制定计划把任务分为子任务，再逐项求解，以减少多步推理中的遗漏。它的论文结果针对特定推理数据集；生产计划还需要工具、权限和副作用状态。

任务过粗无法验证和恢复，过细则管理成本超过执行。好的粒度通常对应一个可重试、可验证、单 owner 的操作。模型生成内容和外部写入分开：先 draft/validate，再 approval/publish。

## 预算包围循环

设置 time、cost、turn、tool call、token 与 replan limit。每次决策读取剩余预算；估算下一任务超过预算时，选择降级、请求扩充或 abstain，不能先花费再报告。

当前 OpenAI Agents runner 文档中的 [Running agents](https://openai.github.io/openai-agents-python/running_agents/)展示了模型输出、工具调用/交接结果再进入下一轮的运行循环，并提供最大轮次限制。具体 SDK 行为会变化，但有界循环是通用安全要求。

## Approval Boundary

计划可以提前标记需要审批的任务：付款、删除、发布、外部消息、权限变更。审批绑定 exact action、参数 hash、计划版本和过期时间；replan 改参数后旧批准失效。

审批前允许只读准备和预览，批准后执行仍重新授权并使用幂等键。Agent 不得把高风险动作拆小来规避审批。

## Loop Guard 与无进展检测

仅按最大轮数终止太晚。检测：相同工具+参数重复、相同错误循环、计划 diff 无实际变化、证据集合不增长、任务在 ready/running 反复切换。

触发时先总结已尝试、可用证据、阻塞条件和最小用户输入，再进入 blocked/abstain。不要用换措辞的相同查询假装进展。

## 计划评测

不只评最终成功，还要测：

- dependency validity 与可执行任务比例；
- 完成证据是否满足 rubric；
- 不必要任务/工具调用；
- replan 次数与原因正确；
- 预算、授权和审批违规为零；
- 失败后恢复与 compensation；
- 成功率、延迟、成本和人工介入。

场景覆盖工具失败、数据变化、歧义、无解、预算耗尽、审批拒绝和恶意 observation。用固定工具 fixture 对比无计划、静态计划与动态计划。

## 小结

可靠 planning 是一个受边界约束的状态机：Goal/Constraints 与完成 rubric 锁定，任务以 DAG 表达依赖和证据，Act/Observe 提供可审计反馈，Replan 只修改未完成部分。预算、审批和 Loop Guard 让动态性服务于目标，而不是变成无限自治。

## 参考资料

- [Yao et al. — ReAct](https://arxiv.org/abs/2210.03629)
- [Wang et al. — Plan-and-Solve Prompting](https://arxiv.org/abs/2305.04091)
- [OpenAI Agents SDK — Running agents](https://openai.github.io/openai-agents-python/running_agents/)
